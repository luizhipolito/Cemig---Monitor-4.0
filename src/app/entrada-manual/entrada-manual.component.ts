import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/services/api.service';
import {
  AppUtils,
  b64toBlob,
  compoundBatches,
  createBatch,
  distinct,
  firstOrNull,
  firstSelection,
  isNumber,
  isResult,
} from 'src/utils/app.utils';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {
  MenuController,
  NavController,
  ModalController,
  AlertController,
} from '@ionic/angular';
import {
  StorageArvoreService,
  Arvore,
} from 'src/services/storage-arvore.service';
import { ConfigService } from 'src/services/config.service';
import { PIWebObject } from 'src/model/PIWebObject.model';
import {
  EnumModeAttribute,
  PIWebAttribute,
} from 'src/model/PIWebAttribute.model';
import { map, last } from 'rxjs/operators';
import { Attribute } from 'src/model/Attribute.model';
import { __await } from 'tslib';
import { InserirComentarioComponent } from '../inserir-comentario/inserir-comentario.component';
import { element } from 'protractor';
import { attachView } from '@ionic/angular/providers/angular-delegate';
import { NODATA } from 'dns';
import { PIWebValue } from 'src/model/PIWebValue.model';
import { PIWebLink } from 'src/model/PIWebLink.model';
import { SalvarDadosComponent } from '../salvar-dados/salvar-dados.component';
import { stringify } from 'querystring';
import { FormBuilder, FormGroup, NgForm } from '@angular/forms';
import { formatDate } from '@angular/common';
import { Elemento } from 'src/model/Elemento.model';
import { Subscription } from 'rxjs';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { File } from '@ionic-native/file/ngx';
import { EntradaManualStateService } from './state/entrada-manual-state.service';

declare var cordova:any;

const typeEnumeration = 'EnumerationValue';
// let currentModal = null;
class Navigation {
  path: Array<string>;
  name: string;
  date: Date;
  dateLast: Date;

  static Instance(): Navigation {
    let n = new Navigation();
    n.path = [];
    n.name = '';
    return n;
  }

  static Create(path: Array<string>, name: string, date: Date, dateLast: Date) {
    let n = new Navigation();
    n.path = path;
    n.name = name;
    n.date = date;
    n.dateLast = dateLast;
    return n;
  }
}

export class LoadProgress {

  constructor() {
    this.totalInstrument = '?';
    this.currentInstrument = 0;
    this.configInicial = LoadStatus.WAITING;
    this.instruments = LoadStatus.WAITING;
    this.tree = LoadStatus.WAITING;
    this.setTextInstrument();
  }

  private setTextInstrument() {
    this.textInstrumento = `(${this.currentInstrument}/${this.totalInstrument})`;
  }

  setCurrent(current: number){
    this.currentInstrument = current;
    this.setTextInstrument();
  }

  setTotal(total: number) {
    this.totalInstrument = total;
    this.setTextInstrument()
  }

  private totalInstrument: number|string;
  private currentInstrument: number;
  configInicial: LoadStatus;
  instruments: LoadStatus;
  tree: LoadStatus;
  textInstrumento: string;
}

export enum LoadStatus {
  WAITING,
  ON_PROGRESS,
  DONE
}

export class Node {
  name: string;
  children?: Array<Node>;
  index?: number;
  relativePath?: string;
  date: Date;
  dateLast: Date;
  dateRead?: Date;
  parent?: Node;
  pathStr?: string;
  hasToRead?: boolean;
  nextDateToRead?: Date;

  constructor(name: string){
    this.name = name;
    this.children = new Array<Node>();
  }
}

export enum TypeShow {
  TREE,
  ELEMENTS
}

export enum TreeShow {
  TREE,
  READ
}

@Component({
  selector: 'app-entrada-manual',
  templateUrl: './entrada-manual.component.html',
  styleUrls: ['./entrada-manual.component.scss'],
})
export class EntradaManualComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  keyboardValue = '';
  numberGroups = [
    [7, 8, 9],
    [4, 5, 6],
    [1, 2, 3],
    ['<', 0, '.'],
    ['', '-', 'Enter'],
  ];
  onButtonPress(symbol) {
    if (this.utils.propFocous) {
      if (!this.utils.propFocous.Selected) {
        this.utils.propFocous.Selected = '';
      }
      if (isNumber(symbol)) {
        this.utils.propFocous.Selected += symbol;
      }
      if (
        symbol === '.' &&
        !new String(this.utils.propFocous.Selected).includes('.')
      ) {
        this.utils.propFocous.Selected += symbol;
      }
      if (
        symbol === '-' &&
        !new String(this.utils.propFocous.Selected).includes('-')
      ) {
        this.utils.propFocous.Selected += symbol;
      }
      if (symbol == '<') {
        this.utils.propFocous.Selected = this.utils.propFocous.Selected.substr(
          0,
          this.utils.propFocous.Selected.length - 1
        );
      } if (symbol == 'Enter') {
        let firstIndex = this.elements.list.findIndex((att) =>
          att.Name == this.utils.propFocous.Name
        );
        let lastI = this.focusLast.reverse();
        let last = this.lastFocus;
        let lastId = last.map(n => n.Name)
        if (lastI[0] == lastId[0]) {
          firstIndex = 0;
        }

        this.changeFocous(firstIndex)
      }
      this.utils.propFocous.color = this.utils.getColorScalling(this.utils.propFocous);
    }
  }


  templateMax = 'LimitMaximum';
  templateMaxAtention = 'LimitHiHi';

  // async goInserirComentario() {
  //   let modal = await this.modalController.create({
  //     component: InserirComentarioComponent,
  //     cssClass: 'my-custom-class',
  //   });
  //   await modal.present();
  //   currentModal = modal;
  // }
  // dismissModal() {
  //   currentModal.dismiss().then(() => {
  //     currentModal = null;
  //   });
  // }

  Elemento = {};
  selectedViews = 'elemento';
  date: Date;
  elements: Attribute;
  enumerationTree: Array<Arvore>;
  arvoreLocal: Array<Arvore>;

  loadProgress: LoadProgress;

  dateLast: any;
  currentDate = this.utils.formatDateTime(new Date());

  navigation: Array<Node>;
  nextReads: Array<Node> = [];
  originalTree: Array<Node>;
  pathNavigation: Array<Node>
  loadStatus = LoadStatus;

  typeShowSelected: TypeShow = TypeShow.TREE;
  typeShow = TypeShow;

  typeTreeSelected: TreeShow = TreeShow.TREE;
  treeShow = TreeShow;
  
  lastFocus: PIWebAttribute[];
  focusLast: string[];

  textCondition: string = 'Condição'; // "Comparação"
  templateConditionAtt = 'Condição X Atributo';
  templateConditionComp = 'Condição X Comparação';
  templateConditionValue = 'Condição X Valor';
  templateIndex = ' X ';
  searchField = '';
  onlyReset: boolean;
  selectedDateFormated: Date;
  formSearch: FormGroup = this.formBuilder.group(this.getResetForm());
  showSearch: boolean = false;
  showProgressBar: boolean = true;
  subs: Array<Subscription> = [];

  // minimo: any;
  // minimoAlerta: any;
  // minimoAtencao: any;
  // maximoAtencao: any;
  // maximoAlerta: any;
  // maximo: any;

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    public utils: AppUtils,
    private router: Router,
    private messageBox: MatSnackBar,
    public navCtrl: NavController,
    public storageService: StorageArvoreService,
    public config: ConfigService,
    public modalController: ModalController,
    public alertController: AlertController,
    private file: File,
    private entradaManualState: EntradaManualStateService,
    private socialSharing: SocialSharing
  ) { }


  ngOnInit() {
    this.changesSearch();
  }

  async edit() {
    let editData = await this.storageService.getByKey('Edit')
    if (editData) {
      editData['isEdit'] = true;
      if (editData['isEdit'] == true) {
        if (editData != null) {
          this.typeShowSelected = TypeShow.ELEMENTS;
          let pathEdit = editData['relativePath'];
          let path = pathEdit.split(`\\`).filter(p => Boolean(p))
          let name = path[path.length - 1];


          this.navigation = new Array<Node>();
          this.navigation.push({
            name: undefined,
            date: undefined,
            dateLast: undefined,
            index: editData['node']?.index
          });

          this.buildPathFromNode(editData['node']);

          let first = editData['value'].filter(o => o.Name == 'Observação').find(s => s.Selected)

          this.elements = new Attribute;

          this.currentDate = editData['date'];
          this.elements.firstSelection = first;
          this.elements.RelativePath = pathEdit;
          this.elements.WebId = editData['AplicacaoID'];
          this.elements.list = editData['value'].filter(o => o.Name != 'Observação');
          this.changeFocous(0)
          await this.storageService.removeEdit();
        }
      }
    }
  }

  public user;

  async ionViewWillEnter() {
    this.showProgressBar = true;
    let isToSyncDataFromPI = this.config.isToLoadFromPI && true;
    this.user = this.utils.getStorage('user');
    this.init();
    await this.api.init();
    await this.config.init();

    if (isToSyncDataFromPI) {
      await this.syncDataFromPI();
      await this.dataSentTrue();
    } else {
      await this.loadDataFromStorage();

    }
    await this.edit();
    this.date = null;
    this.showProgressBar = false;

    this.checkAndOpenPromptExport();
  }

  checkAndOpenPromptExport(){
    if(this.entradaManualState.keepEntradaManual || !this.config.subjectAdmin.value) {
      this.entradaManualState.resetEntradaManual();
    } else {
      this.router.navigate(['/read-export-prompt']);
    }
  }

  init() {
    this.elements = null;
    this.utils.propFocous = null;
    this.resetElementsAndSetSelecionado(null, []);
    this.navigation = new Array<Node>();
    this.pathNavigation =  new Array<Node>();
  }

  async syncDataFromPI() {
    this.loadProgress = new LoadProgress();
    this.loadProgress.configInicial = LoadStatus.ON_PROGRESS;
    await this.syncConfigFromPI();
    this.loadProgress.configInicial = LoadStatus.DONE;

    this.loadProgress.instruments = LoadStatus.ON_PROGRESS;
    await this.syncNavigationData();
    this.loadProgress.instruments = LoadStatus.DONE;


    this.loadProgress.tree = LoadStatus.ON_PROGRESS;
    await this.syncEnumerationSets();
    this.loadProgress.tree = LoadStatus.DONE;

    this.loadProgress = undefined;

    this.config.isToLoadFromPI = false;
  }

  savedatabaseWebId(configHome){
    const pathSplit = (configHome.Links.Database as string).split("/");
    this.storageService.saveConfig(this.storageService.databaseWebId, pathSplit[pathSplit.length - 1]);
  }

  async syncConfigFromPI() {
    let configHome = await this.api
      .get(this.config.getBaseConfigUrl())
      .toPromise();

    this.savedatabaseWebId(configHome);
    let configUrlValues = this.utils.getValue(
      configHome,
      this.config.config,
      this.config.endPoint['value']
    );
    let attributes = this.config.attributes;
    let configData = await this.api.get(configUrlValues).toPromise();
    for (let attribute in attributes) {
      let nameOrPath = attributes[attribute];
      let value = this.utils.getValue(
        configData,
        nameOrPath,
        this.config.endPoint['value'],
        'Value'
      );
      this.config[attribute] = value;
    }

    this.utils.saveStorage('senhaOff', this.config.SenhaOff);
    await this.config.saveStorage();
  }

  insertChildren = (nodes: Array<Node>, parent: Node, caminho: Array<string>, path: string, index: number, isRead: boolean = false): Node => {

    if(!caminho.length) {
      parent.index = index;
      parent.relativePath = path;
      return parent;
    }

    const name = caminho[0];

    let node = nodes.find(n => n.name == name);

    if(!node) {
      node = new Node(name);
      node.parent = parent;
      let pathArr = this.getPathFromNode(node);
      node.pathStr = pathArr.slice(0, pathArr.length - 1).map(n => n.name).join(" > ")
      nodes.push(node);
    }
    
    return this.insertChildren(node.children, node, caminho.slice(1, caminho.length), path, index, isRead);
  };

  async exportLeituras(){

    let reads = this.getChildrenReads(this.navigation);
    const pathArr = this.getPathFromNode(this.navigation[0].parent).map(n => n.name);
    const now = new Date();

    const configValues = (await this.storageService.getConfig(this.storageService.configValues));
    const elementoRaiz = configValues.find(c => c.Nome == 'ElementoRaiz').configValue as string;
    const indexOfUsina = elementoRaiz.indexOf("Usinas");
    const pathReduced = elementoRaiz.substring(indexOfUsina, elementoRaiz.length);
    const pathSplited = pathReduced.split("\\");

    const path = pathSplited.concat(pathArr).join(' > ');

    cordova.plugins.pdf.htmlToPDF({
      data: this.buildHtml(now, path, reads),
      documentSize: "A4",
      landscape: "portrait",
      type: "base64"
    },
    (data) => {
        
        let fileDir = this.file.externalApplicationStorageDirectory;
        let filename = "Leituras.pdf";
        this.file.writeFile(fileDir, filename, b64toBlob(data, 'application/pdf'), { replace: true });
        this.socialSharing.share(null, `Leituras CEMIG ${formatDate(now, 'dd/MM/yyyy', 'en-US')}`, `${fileDir}${filename}`);
      },
      () => {
        alert('Erro ao gerar arquivo');
        this.showProgressBar = false;
      }
    );
  }

  buildHtml(now: Date, path: string, nodes: Array<Node>): string {

    let rowData = nodes.map(node => {
      const nodeTree = this.arvoreLocal[node.index];
      return `<tr>
                <td>${node.pathStr}</td>
                <td>${node.name}</td>
                <td class="f-bold ${node.hasToRead ? 'f-red' : 'f-green'}">${node.hasToRead ? 'Leitura Pendente' : 'Leitura Preenchida'}</td>
                <td>${nodeTree.node.dateLast}</td>
                <td>${formatDate(new Date(nodeTree.node.dateRead), 'dd/MM/yyyy', 'en-US')}</td>
              </tr>`;
    }).join("");

    return this.htmlPDF
      .replace("#EXPORT_DATE#", formatDate(now, "dd/MM/yyyy", "en-US"))
      .replace("#CAMINHO#", path)
      .replace("#ROW_DATA#", rowData);
  }

  getChildrenReads(nodes: Array<Node>): Array<Node>{

    if(!nodes.length) {
      return [];
    }

    let reads = [];

    nodes.forEach(node => {
      if(node.children?.length) {
        reads = reads.concat(this.getChildrenReads(node.children));
      } else {
        reads.push(node);
      }
    });

    return reads;
  }

  buildPathFromNode(node: Node) {
    this.pathNavigation = this.getPathFromNode(node);
  }

  getPathFromNode(node: Node){
    let n: Node = node;

    let path: Array<Node> = [];
    
    while(n) {
      path.push(n);
      n = n.parent;
    }

    return path.reverse();
  }

  async syncNavigationData() {
    let rootData = await this.api.get(this.config.getBaseUrl()).toPromise();

    var url = this.config.configUrl;
    var webId = rootData.WebId;
    var categoryNameElement = this.config.Insercao;
    var categoryNameAttr = this.config.CategoriaAtributo;
    var pathSearch = rootData.Path;
    let navigationTree = await this.api.getElements(url, webId, categoryNameElement, categoryNameAttr, pathSearch, this.loadProgress, this.config.InstrumentosPorBatch);

    await this.storageService.store(
      this.storageService.navigation,
      navigationTree as any
    );
    await this.loadDataFromStorage();
  }

  async getEnumarationSets(
    qualyfiers: Array<string>
  ): Promise<Array<PIWebObject>> {
    let rootDataEnumeration = await this.api
      .get(this.config.getBaseUrl())
      .toPromise();
    let databaseUrl = this.utils.getValue(
      rootDataEnumeration,
      this.config.EnumerationSets,
      this.config.endPoint.enumeration
    );
    let databaseResponse = await this.api.get(databaseUrl).toPromise();
    let enumerationRootData = this.utils.getValue(
      databaseResponse,
      this.config.EnumerationSets,
      this.config.endPoint.enumerationSets
    );
    let enumerationSets = this.utils
      .getItems(await this.api.get(enumerationRootData).toPromise())
      .filter((enumSet) => qualyfiers.includes(enumSet.Name));

    return enumerationSets;
  }

  async syncEnumerationSets() {
    let qualifyers = this.getEnumerationSetsQualyfiers();
    let enumerationSets = await this.getEnumarationSets(qualifyers);
    let enumerationSetsAndValues = await this.getEnumerationSetsValues(
      enumerationSets
    );

    this.enumerationTree = enumerationSetsAndValues.map((enumSet) => {
      let tree = new Arvore();
      tree.AplicacaoID = enumSet.WebId;
      tree.relativePath = enumSet.Path;
      tree.Caminho = tree.relativePath.split('\\').filter((c) => Boolean(c));
      tree.value = enumSet.valuesSets.sort(function (a: PIWebAttribute, b: PIWebAttribute) {
        return a.Value < b.Value ? -1 : 1;
      })
      tree.Nome = enumSet.Name;
      return tree;
    });
    await this.storageService.store(
      this.storageService.enumerationSets,
      this.enumerationTree
    )
  }

  async getEnumerationSetsValues(enumerationSets: Array<PIWebObject>) {
    let batchRequest = createBatch(enumerationSets, 'EnumerationSets');

    let batchResponse = await this.splitBatchAndExecute(batchRequest, this.config.afServer);

    enumerationSets.forEach((enumset, index) => {
      let response = batchResponse[index];
      if (response && response['Status'] == 200) {
        enumset.valuesSets = this.utils.getItems(response['Content']);
      }
    });
    return enumerationSets
  }
  getEnumerationSetsQualyfiers(): Array<string> {
    if (this.arvoreLocal) {
      const aggregateAttributes = (acc: Array<PIWebAttribute>, cur: Arvore) =>
        acc.concat(cur.atributos.list).concat([cur.atributos.firstSelection]);
      let qualifyers = this.arvoreLocal
        .reduce(aggregateAttributes, [])
        .filter((att) => att && att.Type == typeEnumeration)
        .map((att) => att.TypeQualifier)
        .filter(distinct);
      return qualifyers;
    }
    return [];
  }
  dateLastRead: any;
  loadEnumerationSetsValues = (data): Array<PIWebObject> => {
    return data['Items'].map((e) => {
      return { ...e, values: e.Links.Values };
    });
  };

  async clickMainNavigation() {
    this.typeShowSelected = TypeShow.TREE;
    this.resetSearch();
    this.elements = null;

    await this.updateNextRead();

    if(this.nextReads.length) {
      this.typeTreeSelected = TreeShow.READ;
      this.navigation = this.nextReads;
    } else {
      this.typeTreeSelected = TreeShow.TREE;
      this.onClickId(null);
    }
  }

  async updateNextRead(){
    this.pathNavigation = new Array<Node>();
    let dataRead = await this.storageService.getByKey(
      this.storageService.writtenValuesForList
    );

    dataRead = dataRead ? dataRead : [];

    const updateChildren = (nodes: Array<Node>, parent: Node): boolean => {

      if(!nodes?.length) {
        parent.nextDateToRead = this.arvoreLocal[parent.index].node.dateRead;
        return !dataRead.some(dr => dr.relativePath == parent.relativePath);
      }

      nodes.forEach(n => {
        n.hasToRead = updateChildren(n.children, n);
      });

      if(parent) {
        parent.nextDateToRead = nodes.reduce((a, b) => a.hasToRead && a.nextDateToRead.getTime() < b.nextDateToRead.getTime() ? a : b).nextDateToRead; 
      }

      return nodes.some(n => n.hasToRead);
    };

    if(this.nextReads?.length) {
      updateChildren(this.nextReads, null);
    }
  }

  getToday(): Date {
    let date = new Date();
    this.setBeginDay(date);
    return date;
  }

  setBeginDay(date: Date){
    date.setMilliseconds(0);
    date.setSeconds(0);
    date.setMinutes(0);
    date.setHours(0);
  }

  async loadNavigationDataFromStorage() {
    let dataLeitura: any;
    this.elements = null;
    this.nextReads = [];
    this.arvoreLocal = await this.storageService.getByKey(
      this.storageService.navigation
    );

    let dateLastRead: any;
    const today = this.getToday();

    this.navigation = new Array<Node>();
    if (this.arvoreLocal) {
      let nodes = [];
      let nodesRead = [];

      this.arvoreLocal.forEach((arvore: Arvore, index: number) => {
        let dateNext = arvore.atributos.list.filter(l => l.mode == 'DataProxima' && l.Value?.Value?.Name != 'Calc Failed' && l.Value?.Value?.Name != 'Pt Created');
        let datelast = arvore.atributos.list.filter(l => l.mode == 'DataUltima' && l.Value?.Value?.Name != 'Calc Failed' && l.Value?.Value?.Name != 'Pt Created');

        let intervaloInsercao = (dateNext[0]?.config?.find(c => c.Name == 'Intervalo de Inserção') as any)?.Value?.Value;

        dataLeitura = dateNext.find(d => d)?.Value?.Value;

        const dateRead = dataLeitura ? new Date(dataLeitura) : null;
        if(dataLeitura) {
          dataLeitura = dataLeitura.split('T').find(firstOrNull);
          dataLeitura = dataLeitura.split('-').reverse().join("/", dataLeitura, 0, dataLeitura.length);
        } else {
          dataLeitura = 'Sem Data';
        }

        if(dateRead) {
          this.setBeginDay(dateRead);
        }

        this.date = dateRead ? new Date(dateRead) : null;

        dateLastRead = datelast && datelast.length > 0 ? datelast.find(l => l)?.Value.Value : null;

        if (dateLastRead) {
          dateLastRead = dateLastRead.split('T').find(firstOrNull);
          dateLastRead = dateLastRead.split('-').reverse().join("/", dateLastRead, 0, dateLastRead.length)

        } else {
          dateLastRead = 'Sem Data';
        }
        
        let datePlus = new Date(today);
        datePlus.setDate(datePlus.getDate() + intervaloInsercao);
        let dateMinus = new Date(today);
        dateMinus.setDate(dateMinus.getDate() - intervaloInsercao);


        let element = this.insertChildren(nodes, null, arvore.Caminho, arvore.relativePath, index);
        arvore.node = element;

        if (dateRead && this.date >= dateMinus && this.date < datePlus) {
          element.date = dataLeitura;
          element.dateLast = dateLastRead;
          element.dateRead = dateRead;

          this.insertChildren(nodesRead, null, arvore.Caminho, arvore.relativePath, index, true);
        }

      });

      this.originalTree = nodes;
      this.nextReads = nodesRead;
    }

    this.clickMainNavigation();
  }

  async loadDataFromStorage() {
    await this.loadNavigationDataFromStorage();
    await this.loadEnumerationSetsFromStorage();
  }

  async dataSentTrue() {
    let dataWriteStorage = await this.storageService.getByKey(
      this.storageService.writtenValues
    )
    if (dataWriteStorage) {
      if (dataWriteStorage.length > 0) {
        this.confirmDataSent();
      }
    }

  }

  async confirmDataSent() {
    let choice = false;
    let alert = await this.alertController.create({
      header: 'Confirmar',
      message: 'Existem dados não enviados!</br> Deseja enviar agora?',
      buttons: [
        {
          text: 'Não',
          handler: () => {
            alert.dismiss(false);
            return false;
          },
        },
        {
          text: 'Sim',
          handler: () => {
            alert.dismiss(true);
            this.router.navigate(['/salvar-dados']);
            return true;
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss().then((data) => {
      choice = data.data as boolean;
    });
    return choice;
  }


  async loadEnumerationSetsFromStorage() {
    this.enumerationTree = await this.storageService.getByKey(
      this.storageService.enumerationSets
    );
  }

  generateRelativePath = (data): Array<PIWebObject> => {
    return data['Items'].map((e) => {
      return {
        ...e,
        relativePath: e.Path.replace(this.config.ElementoRaiz, ''),
      };
    });
  };

  print() {
    // console.log(this.elements);
  }

  onClickId = (node: Node) => {
    this.typeShowSelected = TypeShow.TREE;
    this.resetSearch();
    let filhos: Array<Node> = [];
    this.pathNavigation = [];
    this.navigation = [];
    this.elements = null;

    if(!node) {
      filhos = this.originalTree;
    } else {
      filhos = node.children;

      this.buildPathFromNode(node);
    }

    if(!filhos || filhos.length == 0) {
      this.typeShowSelected = TypeShow.ELEMENTS;

      let item = this.arvoreLocal[node.index];//result[node.index];
      this.navigation.push({
        name: item.Nome,
        date: undefined,
        dateLast: undefined,
        index: node.index
      });
      this.elements = item.atributos;
      if (this.elements.firstSelection && this.elements.firstSelection.Type) {
        this.elements.firstSelection.valuesSets = this.getOptions(
          this.elements.firstSelection.TypeQualifier
        );
      }
      this.elements.list.forEach((elem) => {
        if (elem.Type == typeEnumeration) {
          let selectOptions = this.getOptions(elem.TypeQualifier)
          elem.valuesSets = selectOptions;
        }
      });
    } else {
      this.navigation = filhos;
    }
  };

  formatDateAttr(att, format: string){

    if(att.Type == "DateTime" && att.ValueString){
      const defaultFormat = "dd/MM/yyyy hh:mm:ss";
      format = format ? format : defaultFormat;
    
      const date = new Date(att.ValueString);

      if(date as any != 'Invalid Date') {
        try {
          att.ValueStringView = formatDate(date, format, 'en');
        } catch (e) {
          att.ValueStringView = formatDate(date, defaultFormat, 'en');
        }
      }
    }
  }

  onSelect($event) {
    this.utils.propFocous = null;
    this.resetElementsAndSetSelecionado(null, this.elements.list);
    const format: string = this.config.FormatoData;

    this.elements.list.forEach((att) => {

      this.formatDateAttr(att, format);
      
      if (!att.config.some((s) => s.Name.includes(this.textCondition))) {
        att.visible = true;
      } else {

        att.visible = false;
        let hasCondition = true;
        let index = 1;
        while (hasCondition) {
          let attTemp = this.templateConditionAtt.replace(
            this.templateIndex,
            ' ' + index + ' '
          );
          let valTemp = this.templateConditionValue.replace(
            this.templateIndex,
            ' ' + index + ' '
          );
          let compTemp = this.templateConditionComp.replace(
            this.templateIndex,
            ' ' + index + ' '
          );
          let config = att.config as PIWebAttribute[];
          let atribute = this.getValueTemplate(attTemp, config);
          let condition = this.getValueTemplate(compTemp, config);
          let value = this.getValueTemplate(valTemp, config);
          hasCondition =
            Boolean(atribute) && Boolean(condition) && Boolean(value);
          let selector = $event.target.value.Name;
          if (hasCondition) {
            att.visible =
              att.visible || this.IsConditionValid(selector, condition, value);
          }
          index++;
        }
      }

      if (!att.visible) {
        att.Selected = null;
      }
    })
    this.changeFocous(0);
  }

  changeFocous(index: number) {
    let elem = this.elements.list.find(
      (att, i) =>
        att.visible &&
        (att.mode == 'LeituraEscrita' || att.mode == 'Escrita') &&
        (att.Type == 'Double' || att.Type == 'Single') && i > index
    );
    this.lastFocus = this.elements.list.filter(
      (att, i) =>
        att.visible &&
        (att.mode == 'LeituraEscrita' || att.mode == 'Escrita' ||
          att.mode == 'EscritaConstante' || att.mode == 'LeituraEsConst') &&
        (att.Type == 'Double' || att.Type == 'Single') && i > index
    )
    this.focusLast = this.lastFocus.map(n => n.Name.valueOf())
    if (elem) {
      this.utils.propFocous = elem;
      this.resetElementsAndSetSelecionado(elem, this.elements.list);
    }
  }

  IsConditionValid(selector, condition, value): boolean {
    let conditionValue = eval(`'${selector}' ${condition} '${value}'`);
    return conditionValue;
  }
  getValueTemplate(attTemp: string, configs: PIWebAttribute[]): string {
    let config = configs.find((f) => f.Name == attTemp);
    let configValue = null;
    let value =
      config && config.Value && config.Value.Good ? config.Value.Value : null;
    if (value) {
      configValue = new String(value).toString();
      if (value.Name) {
        configValue = value.Name;
      }
    }
    return configValue;
  }

  splitRequest(request, maxLen: number = 1000): Array<any> {
    const objKeysLen = request ? Object.keys(request).length : 0;

    if(objKeysLen <= maxLen) {
      return [request];
    }

    let newRequests = [];
    let startIndex = 0;
    let endIndex;

    do {
      endIndex = startIndex + maxLen;
      endIndex = endIndex > objKeysLen ? objKeysLen : endIndex;

      var obj = {};
      var indexObj = 0;
      for(let i=startIndex; i < endIndex; i++) {
        obj[indexObj] = request[i];
        indexObj++;
      }
      newRequests.push(obj);

      startIndex += maxLen;

    } while(endIndex < objKeysLen);

    return newRequests;
  }

  async getResponse(previusBatch: any, type: string) {
    let server = this.config.afServer;
    let request = {};

    for (let key of Object.keys(previusBatch)) {
      
      let response = previusBatch[key];

      if (isResult(response)) {
        let items = response['Content']['Items'] as Array<PIWebAttribute>;
        request = compoundBatches(request, createBatch(items, type));
      }
    }

    var response = await this.splitBatchAndExecute(request, server);

    return response;
  }

  async splitBatchAndExecute(request, server){
    let response = {};
    var countReponse = 0;
    let splitedRequest = this.splitRequest(request);

    for(let requestSet of splitedRequest) {
      let resp = await this.api.executeBatchAsync(server, requestSet);
      for (let key of Object.keys(resp)) {
        response[countReponse] = resp[key];
        countReponse++;
      }
    }

    return response;
  }

  read(content: any) {
    let fKey = Object.keys(content).find(firstOrNull);
    let value = content[fKey];
    delete content[fKey];
    return value;
  }

  filterDescription(attResponse) {
    if(attResponse) {
      const descAttr = this.config.AppAttributes;
      var keys = Object.keys(attResponse);
      for (let key in keys) {
        var element = attResponse[key];
        var attrs: Array<any> = element?.Content?.Items;
        attrs = attrs && element.Status == 200 ? attrs : [];

        let attrsFiltered = attrs.filter(att => att.Description && att.Description.includes(descAttr));
        if(attrsFiltered.length) {
          element.Content.Items = attrsFiltered;
        }
      }
      return attResponse;
    }
  }

  stringInput: string;
  setPropFocous(element: PIWebAttribute) {
    if (
      (element.mode === EnumModeAttribute.Escrita ||
        element.mode === EnumModeAttribute['Leitura/Escrita'] ||
        element.mode === EnumModeAttribute['Escrita (Constante)'] ||
        element.mode === EnumModeAttribute['Leitura/Escrita (Constante)'])
    ) {
      
      this.utils.propFocous = element;
      this.resetElementsAndSetSelecionado(element, this.elements.list);
    }
  }

  resetElementsAndSetSelecionado(element: PIWebAttribute, elements: Array<PIWebAttribute>){
    elements.forEach(el => {
      el['selecionado']  = false;
    });

    if(element) {
      element['selecionado'] = true;
    }
  }

  getAttValue(
    att: PIWebAttribute,
    valuesItems: Array<PIWebAttribute>
  ): PIWebAttribute {
    let valueAtt = valuesItems.find(
      (a) => a.Name == att.Name && a.Path == att.Path
    );

    let attValue = valueAtt.Value;
    let attValueString = '';
    att.Value = attValue;
    if (attValue && attValue.Value) {
      let hasNoData = attValue.Value.Name
      if (attValue.Value.Value) {
        attValueString = attValue.Value.Value;
      } else {
        attValueString = new String(attValue.Value).toString();
      }
      if (hasNoData == 'No Data' || hasNoData == 'Pt Created') {
        attValueString = ''
      }
      if (att.mode == EnumModeAttribute['Leitura/Escrita']) {
        att.Selected = attValueString;
        att.color = this.utils.getColorScalling(att);
      }
      if (att.mode == EnumModeAttribute['Leitura/Escrita (Constante)']) {
        att.Selected = attValueString;
        att.color = this.utils.getColorScalling(att);
      }


      if (attValue.UnitsAbbreviation) {
        attValueString = attValueString + ' ' + attValue.UnitsAbbreviation;
      }
    }
    att.ValueString = attValueString;
    return att;
  }

  async saveElement() {
    await this.storageService.removeEdit();

    let dateStr = this.currentDate
      ? this.currentDate.split('T').find(firstOrNull)
      : null;

    if (!dateStr) {
      return;
    }
    let tree = new Arvore();
    tree.AplicacaoID = this.elements.WebId;
    tree.relativePath = this.elements.RelativePath;
    tree.isEdit = false;
    let values = this.utils.getWrittenValues(this.elements);

    tree.date = dateStr;
    tree.value = values;
    tree.node = this.arvoreLocal[this.navigation[0].index].node;

    let currentDateLogs = this.utils.formatDateTimeHours(new Date());
    let treeLogsPost = new Arvore();
    treeLogsPost.AplicacaoID = this.elements.WebId;
    treeLogsPost.relativePath = this.elements.RelativePath;
    treeLogsPost.user = this.user;
    treeLogsPost.isEdit = true;
    treeLogsPost.isSystem = false;
    let valuesLogs = this.utils.getWrittenValues(this.elements);

    treeLogsPost.date = currentDateLogs;
    treeLogsPost.value = valuesLogs;

    treeLogsPost.dataDate = formatDate(new Date(this.currentDate), "dd/MM/yyyy", "en");

    this.storageService.insertOrUpdate(
      this.storageService.writtenLogs,
      treeLogsPost
    );

    let validationModes: any;
    let leituraEscritaMode = this.elements.list.filter(m => m.mode == 'LeituraEscrita').filter(s => s?.Selected);
    let leituraEscritaConstanteMode = this.elements.list.filter(m => m.mode == 'LeituraEsConst').filter(s => s?.Selected);
    let EscritaConstanteMode = this.elements.list.filter(m => m.mode == 'EscritaConstante').filter(s => s?.Selected);
    let EscritaMode = this.elements.list.filter(m => m.mode == 'Escrita').find(s => s?.Selected);
    validationModes = leituraEscritaMode.concat(leituraEscritaConstanteMode, EscritaConstanteMode, EscritaMode).filter(s => s != null && s?.Type != 'String');

    for (let i = 0; i < validationModes.length; i++) {

      let valueAlert = validationModes[i].Selected;

      if (!valueAlert) {
        this.showAlert('Não existem dados preenchidos!')
        return;
      }

      this.utils.getAlerts(validationModes[i])

      let leitura = validationModes[i].Name;


      if (this.utils.maximo || this.utils.minimo || this.utils.minimoAlerta || this.utils.minimoAtencao || this.utils.maximoAlerta || this.utils.maximoAtencao) {
        if (this.utils.minimo || this.utils.minimo == 0) {
          if (valueAlert <= this.utils.minimo) {
            await this.showAlert(`Atenção! A leitura ${leitura} esta fora dos limites especificados para o equipamento.`)
            return;
          }
        }

        if (this.utils.maximo) {
          if (valueAlert >= this.utils.maximo) {
            await this.showAlert(`Atenção! A leitura ${leitura} esta fora dos limites especificados para o equipamento.`)
            return;
          }
        }

        if (!this.utils.minimoAtencao && this.utils.minimoAlerta) {
          if (valueAlert <= this.utils.minimoAlerta) {
            let res = await this.showConfirm(`A leitura  ${leitura} esta abaixo do limite de alerta. Deseja salvar?`);
            if (!res) return;
          }
        }

        if (this.utils.minimoAtencao && !this.utils.minimoAlerta) {
          if (valueAlert <= this.utils.minimoAtencao) {
            let res = await this.showConfirm(`A leitura ${leitura} esta abaixo do limite de atenção. Deseja salvar?`)
            if (!res) return;
          }
        }

        if (this.utils.minimoAtencao && this.utils.minimoAlerta) {
          if (valueAlert > this.utils.minimoAlerta && valueAlert <= this.utils.minimoAtencao) {
            let res = await this.showConfirm(`A leitura ${leitura} esta abaixo do limite de atenção. Deseja salvar?`)
            if (!res) return;
          }
        }
        if (valueAlert > this.utils.minimo && valueAlert <= this.utils.minimoAlerta) {
          let res = await this.showConfirm(`A leitura  ${leitura} esta abaixo do limite de alerta. Deseja salvar?`);
          if (!res) return;
        }
        if (this.utils.maximoAtencao && this.utils.maximoAlerta) {
          if (valueAlert >= this.utils.maximoAtencao && valueAlert < this.utils.maximoAlerta) {
            let res = await this.showConfirm(`A leitura ${leitura} esta acima do limite de atenção. Deseja salvar?`)
            if (!res) return;
          }
        }
        if (this.utils.maximoAtencao && this.utils.maximoAlerta) {
          if (valueAlert >= this.utils.maximoAtencao && valueAlert < this.utils.maximoAlerta) {
            console.log('atencao')
            let res = await this.showConfirm(`A leitura ${leitura} esta acima do limite de atenção. Deseja salvar?`)
            if (!res) return;
          }
        }

        if (this.utils.maximoAlerta) {
          if (valueAlert >= this.utils.maximoAlerta && valueAlert < this.utils.maximo) {
            let res = await this.showConfirm(`A leitura ${leitura} esta acima do limite de alerta. Deseja salvar?`);
            if (!res) return;
          }
        }
        if (this.utils.maximoAlerta && !this.utils.maximo) {
          if (valueAlert >= this.utils.maximoAlerta) {
            let res = await this.showConfirm(`A leitura ${leitura} esta acima do limite de alerta. Deseja salvar?`);
            if (!res) return;
          }
        }

        if (this.utils.maximoAtencao && !this.utils.maximoAlerta) {
          if (valueAlert >= this.utils.maximoAtencao) {
            let res = await this.showConfirm(`A leitura ${leitura} esta acima do limite de atenção. Deseja salvar?`)
            if (!res) return;
          }
        }
      }
    }



    let hasTree = await this.storageService.hasValue(
      this.storageService.writtenValues,
      tree
    );

    if (hasTree) {
      let res = await this.showConfirm('Já existe uma leitura para esta data neste instrumento não salva. Deseja sobrescrever?');
      if (!res) return;
    }
    await this.storageService.insertOrUpdate(
      this.storageService.writtenValues,
      tree
    );
    await this.storageService.insertOrUpdate(
      this.storageService.writtenValuesForList,
      tree
    );
    this.elements = null;

    if (this.arvoreLocal) {
      if (this.arvoreLocal.length == 0) {
        this.onClickId(null);
      } else {
        this.clickMainNavigation();
      }
    }
    await this.showAlert('Salvo com sucesso!');
  }

  async showConfirm(message: string) {
    let choice = false;
    let alert = await this.alertController.create({
      header: 'Confirmar',
      message,
      buttons: [
        {
          text: 'Não',
          handler: () => {
            alert.dismiss(false);
            return false;
          },
        },
        {
          text: 'Sim',
          handler: () => {
            alert.dismiss(true);
            return true;
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss().then((data) => {
      choice = data.data as boolean;
    });
    return choice;
  }
  async showAlert(message: string) {
    await this.alertController
      .create({
        message,
        buttons: ['OK'],
      })
      .then((res) => {
        res.present();
      });
  }

  async dismissAlert() {
    await this.alertController.dismiss();
  }

  getOptions(qualifyer: string) {
    if (this.enumerationTree) {
      let enumerationSet = this.enumerationTree.find(
        (enumset) => enumset.Nome == qualifyer
      );

      if (enumerationSet) {
        return enumerationSet.value;
      }
    }
    return [];
  }

  getResetForm(){
    return {
      date: null,
      text: null
    };
  }
  
  changesSearch(){
    this.subs.push(
      this.formSearch.valueChanges.subscribe(() => {
        this.selectedDateFormated = this.formSearch?.value?.date ?  this.getDate(new Date(this.formSearch?.value?.date)) : null;
        this.search();
      })
    );
  }

  resetSearch(){
    this.showSearch = false;
    this.onlyReset = true;
    this.selectedDateFormated = null;
    this.formSearch.setValue(this.getResetForm());
  }

  getDate(date: Date): Date {
    date.setMilliseconds(0);
    date.setSeconds(0);
    date.setMinutes(0);
    date.setHours(0);
    date.setDate(date.getDate() + 1);

    return date;
  }

  checkDate(node : Node): boolean {
    return node.dateRead < this.selectedDateFormated;
  }

  checkText(node : Node): boolean {
    return node.name.toLowerCase().includes(this.formSearch.value.text.toLowerCase());
  }

  searchTree(nodes: Array<Node>): Array<Node> {

    if(!nodes) {
      return [];
    }

    let nodesSearch: Array<Node> = [];

    nodes.forEach(n => {
      const findDate = this.selectedDateFormated;
      const findText = !!this.formSearch.value.text;

      if((!findDate || (!n.children?.length && this.checkDate(n))) && (!findText || this.checkText(n))) {
        nodesSearch.push(n);
      }

      const children = this.searchTree(n.children);
      children.forEach(c => nodesSearch.push(c));
    });

    return nodesSearch;
  }

  search(){

    if(this.onlyReset) {
      this.onlyReset = false;
      return;
    }

    if(!this.selectedDateFormated && !this.formSearch.value.text) {
      this.clickMainNavigation();
    } else {
      this.typeShowSelected = TypeShow.TREE;
      this.typeTreeSelected = TreeShow.TREE;
      this.elements = null;
      this.pathNavigation = [];
      this.showSearch = true;
      this.navigation = this.searchTree(this.originalTree);
    }
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  htmlPDF = `<html>
              <head>
                <style>
                  table {
                    font-family: arial, sans-serif;
                    border-collapse: collapse;
                    width: 100%;
                  }
                  td,
                  th {
                    border: 1px solid #a4a4a4;
                    text-align: left;
                    padding: 8px;
                  }
                  tr:nth-child(even) {
                    background-color: #dddddd;
                  }
                  .filter-cls {
                    padding-left: 4px;
                    font-weight: normal;
                  }
                  .flex {
                    display: flex;
                  }
                  .f-bold {
                    font-weight: bold;
                  }
                  .f-green {
                    color: rgb(112, 173, 71);
                  }
                  .f-red {
                    color: rgb(255, 0, 0);;
                  }
                </style>
              </head>
              <body>
                <h1>Leituras #EXPORT_DATE#</h1>
                <h2 class="flex">
                  Caminho:
                  <div class="filter-cls">#CAMINHO#</div>
                </h2>
                <table>
                  <tr>
                    <th>Caminho Instrumento</th>
                    <th>Instrumento</th>
                    <th>Status</th>
                    <th>Data Última Leitura</th>
                    <th>Data Próxima Leitura</th>
                  </tr>
                  #ROW_DATA#
                </table>
              </body>
            </html>`;
}
