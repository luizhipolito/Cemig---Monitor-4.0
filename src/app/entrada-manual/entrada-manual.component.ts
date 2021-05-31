import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/services/api.service';
import {
  AppUtils,
  compoundBatches,
  createBatch,
  distinct,
  firstOrNull,
  firstSelection,
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
import { isNumber, isString } from 'util';
import { InserirComentarioComponent } from '../inserir-comentario/inserir-comentario.component';
import { element } from 'protractor';
import { attachView } from '@ionic/angular/providers/angular-delegate';
import { NODATA } from 'dns';
import { PIWebValue } from 'src/model/PIWebValue.model';
import { PIWebLink } from 'src/model/PIWebLink.model';
import { SalvarDadosComponent } from '../salvar-dados/salvar-dados.component';
import { stringify } from 'querystring';
import { NgForm } from '@angular/forms';
import { formatDate } from '@angular/common';

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

@Component({
  selector: 'app-entrada-manual',
  templateUrl: './entrada-manual.component.html',
  styleUrls: ['./entrada-manual.component.scss'],
})
export class EntradaManualComponent {
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
  date: any;
  elements: Attribute;
  enumerationTree: Array<Arvore>;
  arvoreLocal: Array<Arvore>;
  navigation: Array<Navigation>;

  dateLast: any;
  currentDate = this.utils.formatDateTime(new Date());
  pathNavigation: Navigation = Navigation.Instance();

  
  lastFocus: PIWebAttribute[];
  focusLast: string[];

  textCondition: string = 'Condição'; // "Comparação"
  templateConditionAtt = 'Condição X Atributo';
  templateConditionComp = 'Condição X Comparação';
  templateConditionValue = 'Condição X Valor';
  templateIndex = ' X ';
  searchField = '';

  // minimo: any;
  // minimoAlerta: any;
  // minimoAtencao: any;
  // maximoAtencao: any;
  // maximoAlerta: any;
  // maximo: any;

  constructor(
    private api: ApiService,
    public utils: AppUtils,
    private router: Router,
    private messageBox: MatSnackBar,
    public navCtrl: NavController,
    public storageService: StorageArvoreService,
    public config: ConfigService,
    public modalController: ModalController,
    public alertController: AlertController,
  ) { }




  async edit() {
    let editData = await this.storageService.getByKey('Edit')
    if (editData) {
      editData['isEdit'] = true;
      if (editData['isEdit'] == true) {
        if (editData != null) {
          this.dataLeitura = null;
          let pathEdit = editData['relativePath'];
          let path = pathEdit.split(`\\`).filter(p => Boolean(p))
          let name = path[path.length - 1];


          this.navigation = new Array<{ path: Array<string>; name: string, date: Date, dateLast: Date }>();
          this.navigation.push({
            path: path,
            name: undefined,
            date: undefined,
            dateLast: undefined
          });
          this.pathNavigation.path = path;
          this.pathNavigation.name = name;
          let first = editData['value'].filter(o => o.Name == 'Observação').find(s => s.Selected)

          this.elements = new Attribute;

          this.currentDate = editData['date'];
          this.elements.firstSelection = first;
          this.elements.RelativePath = pathEdit;
          this.elements.WebId = editData['AplicacaoID'];
          this.elements.list = editData['value'].filter(o => o.Name != 'Observação');
          this.changeFocous(0)
        }
      }
    }
  }

  public user;

  async ionViewWillEnter() {
    this.currentIndexProgress = 0;
    this.progress = 0;
    this.progressPercent = 0;
    let isToSyncDataFromPI = this.config.isToLoadFromPI && true;
    this.user = this.utils.getStorage('user');
    this.init();
    await this.api.init();
    await this.config.init();
    this.dataLeitura = null;

    if (isToSyncDataFromPI) {
      await this.syncDataFromPI();
      await this.dataSentTrue();
    } else {
      await this.loadDataFromStorage();

    }
    await this.edit();
    this.date = null;
  }

  arrayProgress = [0, 0.05, 0.1, 0.2, 0.35, 0.55, 0.6, 0.9, 0.95, 1];
  currentIndexProgress = 0;

  nextProgress() {
    this.currentIndexProgress++;
    this.progress = this.arrayProgress[this.currentIndexProgress];
    this.progressPercent = Math.ceil(this.progress * 100);
  }

  updateLoopProgress(lenLoop: number){
    let current = this.arrayProgress[this.currentIndexProgress];
    let next = this.arrayProgress[this.currentIndexProgress + 1];
    let diff = (next - current);
    let percentIteration = diff / lenLoop;

    this.progress += percentIteration;
    this.progressPercent = Math.ceil(this.progress * 100);
  }

  progress = 0;
  progressPercent = Math.ceil(this.progress * 100);
  init() {
    this.elements = null;
    this.utils.propFocous = null;
    this.resetElementsAndSetSelecionado(null, []);
    this.navigation = new Array<Navigation>();
    this.pathNavigation = Navigation.Instance();
  }

  async syncDataFromPI() {
    await this.syncConfigFromPI();
    await this.syncNavigationData();
    await this.syncEnumerationSets();
    this.config.isToLoadFromPI = false;
  }

  async syncConfigFromPI() {
    let configHome = await this.api
      .get(this.config.getBaseConfigUrl())
      .toPromise();
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

  async syncNavigationData() {
    let rootData = await this.api.get(this.config.getBaseUrl()).toPromise();

    var url = this.config.configUrl;
    var webId = rootData.WebId;
    var categoryNameElement = this.config.Insercao;
    var categoryNameAttr = this.config.CategoriaAtributo;
    var pathSearch = rootData.Path;

    let navigationTree = await this.api.getElements(url, webId, categoryNameElement, categoryNameAttr, pathSearch);

    await this.storageService.store(
      this.storageService.navigation,
      navigationTree as any
    );
    this.api.hideLoader();
    await this.loadDataFromStorage();
    this.nextProgress();
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

  clickMainNavigation() {
    this.loadNavigationDataFromStorage();
    this.pathNavigation.path = [];
  }

  dataRead: Array<Arvore>;
  dataReadPath: any;
  async loadNavigationDataFromStorage() {
    let pathRead: any;
    let dataLeitura: any;
    this.elements = null;
    this.arvoreLocal = await this.storageService.getByKey(
      this.storageService.navigation
    );

    let dateLastRead: any;

    this.navigation = new Array<Navigation>();
    if (this.arvoreLocal) {
      this.dataRead = await this.storageService.getByKey(
        this.storageService.writtenValuesForList
      );
      if (this.dataRead != null) {
        this.dataReadPath = this.dataRead.map(p => p.relativePath.split('\\').pop());
      } else {
        this.dataReadPath = [];
      }

      this.arvoreLocal.forEach((arvore: Arvore) => {
        let dateNext = arvore.atributos.list.filter(l => l.mode == 'DataProxima' && l.Value?.Value?.Name != 'Calc Failed');
        let datelast = arvore.atributos.list.filter(l => l.mode == 'DataUltima' && l.Value?.Value?.Name != 'Calc Failed');
        if (dateNext.length > 0) {

          dataLeitura = dateNext.find(d => d)?.Value.Value;

          dateLastRead = datelast && datelast.length > 0 ? datelast.find(l => l)?.Value.Value : null;

          if (dateLastRead) {
            dateLastRead = dateLastRead.split('T').find(firstOrNull);
            dateLastRead = dateLastRead.split('-').reverse().join("/", dateLastRead, 0, dateLastRead.length)

          } else {
            dateLastRead = 'Sem Data';
          }

          let datePlus = new Date(this.currentDate);
          let dateMinus = new Date(this.currentDate);
          let dataInicio: any = this.config.DataFimBusca;
          let dataFim: any = this.config.DataFimBusca;
          datePlus.setDate(datePlus.getDate() + dataInicio);
          dateMinus.setDate(dateMinus.getDate() - dataFim);

          this.date = new Date(dataLeitura);

          if(dataLeitura) {
            dataLeitura = dataLeitura.split('T').find(firstOrNull);
            dataLeitura = dataLeitura.split('-').reverse().join("/", dataLeitura, 0, dataLeitura.length);
          } else {
            dataLeitura = 'Sem Data';
          }
          
          let path = arvore.Caminho;
          let lastIndex = arvore.Caminho.length - 1;
          this.dataLeitura = dataLeitura;
          if ((this.date > dateMinus && this.date < datePlus)) {
            this.navigation.push(Navigation.Create(arvore.Caminho, path[lastIndex], dataLeitura, dateLastRead));
          }
        }
      });
    }
    if (this.navigation.length == 0) {
      if (this.pathNavigation.date) {
        this.showAlert('Não existem dados para leitura por data!');
      }
      this.onClickId(this.pathNavigation)
    }
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

  onClickId = (e) => {
    this.dataLeitura = null;
    this.pathNavigation = e;
    this.storageService.getFilhos(e.path).then((result) => {
      let pathLength = e.path.length;
      this.navigation = new Array<{ path: Array<string>; name: string; date: Date; dateLast: Date }>();
      let pathResult = result.find(p => p).relativePath.slice().split('\\').pop();
      let pathTrue = this.pathNavigation.path;
      let pathTrues = pathTrue.slice().pop();
      if (pathTrues == pathResult) {
        let item = result.find(firstOrNull);
        this.navigation.push({
          path: e.path,
          name: item.Nome,
          date: undefined,
          dateLast: undefined
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
        this.elements = null;
        result.forEach((arvore) => {
          let caminho = arvore.Caminho[pathLength];
          if (!this.navigation.find((n) => n.name == caminho)) {
            let path = e.path.concat([caminho]);
            this.navigation.push({
              path: path,
              name: caminho,
              date: undefined,
              dateLast: undefined
            });
          }
        });
      }
    });
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
    const objKeysLen = request ? Object.keys(request).length : [];

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

    var lenSplit = splitedRequest ? splitedRequest.length : 0;

    for(let requestSet of splitedRequest) {
      let resp = await this.api.executeBatchAsync(server, requestSet);
      for (let key of Object.keys(resp)) {
        response[countReponse] = resp[key];
        countReponse++;
      }
      this.updateLoopProgress(lenSplit);
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
        console.log(this.pathNavigation.path)
        let pathLength = this.pathNavigation.path.pop();
        this.onClickId({
          path: this.pathNavigation.path,
          name: undefined,
        });
      } else {
        this.loadNavigationDataFromStorage();
        this.pathNavigation.path = [];
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

  dataLeitura: any;
  selectedDate: Date;

  filterByDate(navigation: Array<Navigation>, date: any): Array<Navigation> {
    this.elements = null;
    this.navigation = new Array<Navigation>();
    this.arvoreLocal.forEach((arvore: Arvore) => {
      if (date != null) {
        let proximaDataLeitura = arvore.atributos.list.filter(p => p.mode == 'DataProxima' && p.Value.Value.Name != 'Calc Failed');
        let datelast = arvore.atributos.list.filter(l => l.mode == 'DataUltima' && l.Value.Value.Name != 'Calc Failed');
        if (datelast.length > 0) {
          this.dateLastRead = datelast.find(l => l).Value.Value;
          this.dateLastRead = this.dateLastRead.split('T').find(firstOrNull);
          this.dateLastRead = this.dateLastRead.split('-').reverse().join("/", this.dateLastRead, 0, this.dateLastRead.length)
        } else {
          this.dateLastRead = 'Sem Data';
        }
        if (proximaDataLeitura.length > 0) {
          this.dataLeitura = proximaDataLeitura.find(d => d).Value.Value;
          this.dataLeitura = this.dataLeitura.split('T').find(firstOrNull);
          this.dataLeitura = this.dataLeitura.split('-').reverse().join("/", this.dataLeitura, 0, this.dataLeitura.length);
          if ((proximaDataLeitura.find(v => v).ValueString < date)) {
            let indexLastPath = arvore.Caminho.length - 1;
            this.navigation.push(
              Navigation.Create(arvore.Caminho, arvore.Caminho[indexLastPath], this.dataLeitura, this.dateLastRead)
            )
          }
        }
      }
    })
    if (this.navigation.length == 0) {
      this.pathNavigation.path = [];
      this.onClickId(this.pathNavigation);
      this.showAlert('Não existem leituras para esta data!')
    }
    return;
  }

  filterByDateAndString(navigation: Array<Navigation>, name: string): Array<Navigation> {
    this.navigation = new Array<Navigation>();
    navigation.forEach((arvore: Navigation) => {
      if (arvore && arvore.path && arvore.path.length > 0) {
        console.log(arvore)
        arvore.path.forEach((path, index) => {
          if (
            path.toLocaleLowerCase().includes(name) &&
            !this.navigation.some((n) => n.name == arvore.name)
          ) {
            this.navigation.push(
              Navigation.Create(arvore.path, arvore.name, arvore.date, arvore.dateLast)
            );
          }
        });
      }
    });
    if (this.navigation.length == 0) {
      // this.dataLeitura = null;
      // this.date = null;
      // console.log('0000')
    }
    return;
  }

  filterByString(navigation: Array<Arvore>, name: string): Array<Navigation> {
    this.dataLeitura = null;
    this.navigation = new Array<Navigation>();
    navigation.forEach((arvore: Arvore) => {
      if (arvore && arvore.Caminho && arvore.Caminho.length > 0) {
        arvore.Caminho.forEach((path, index) => {
          if (
            path.toLocaleLowerCase().includes(name) &&
            !this.navigation.some((n) => n.name == path)
          ) {
            this.navigation.push(
              Navigation.Create(arvore.Caminho.slice(0, index + 1), path, undefined, undefined)
            );
          }
        });
        console.log(this.navigation)
      }
    });
    return;
  }

  dateSelect: any;

  async searchDate($event: Event) {
    this.dateSelect = $event.target['value'];
    // this.pathNavigation.path = null;
    // this.dataLeitura = null;
    await this.filterByDate(this.navigation, this.dateSelect);
  }

  async search($event: Event) {
    let dataNavigation: Array<Navigation>
    let searchItem = $event.target['value'];
    if (searchItem) {
      this.elements = null;
      searchItem = new String(searchItem).toLowerCase();
      // if (this.date && searchItem) {
      //   if (!dataNavigation) {
      //     dataNavigation = this.navigation;
      //   }
      //   if (this.dateLast != this.date) {
      //     dataNavigation = this.navigation;
      //   }
      //   this.dateLast = this.date;
      //   this.filterByDateAndString(dataNavigation, searchItem);
      // } else {
      //   this.date = null;
      //   this.filterByString(this.arvoreLocal, searchItem)
      // }
      // if (this.navigation.length == 0) {
      //   console.log('Arvore Vazia')
      // }
      if (this.dateSelect && searchItem) {
        if (!dataNavigation) {
          dataNavigation = this.navigation;
        }
        this.filterByDateAndString(dataNavigation, searchItem);
      } if (!this.dateSelect && searchItem) {

        this.filterByString(this.arvoreLocal, searchItem)
      }
    } else {
      this.elements = null;
      await this.loadNavigationDataFromStorage();
    }
  }
}
