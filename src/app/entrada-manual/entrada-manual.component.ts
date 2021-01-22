import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/services/api.service';
import {
  AppUtils,
  compoundBatches,
  createBatch,
  distinct,
  firstOrNull,
  hasChildren,
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
import { isNumber } from 'util';
import { InserirComentarioComponent } from '../inserir-comentario/inserir-comentario.component';
import { element } from 'protractor';
import { attachView } from '@ionic/angular/providers/angular-delegate';
import { NODATA } from 'dns';
import { PIWebValue } from 'src/model/PIWebValue.model';
import { PIWebLink } from 'src/model/PIWebLink.model';
import { SalvarDadosComponent } from '../salvar-dados/salvar-dados.component';

const typeEnumeration = 'EnumerationValue';
// let currentModal = null;
class Navigation {
  path: Array<string>;
  name: string;

  static Instance(): Navigation {
    let n = new Navigation();
    n.path = [];
    n.name = '';
    return n;
  }

  static Create(path: Array<string>, name: string) {
    let n = new Navigation();
    n.path = path;
    n.name = name;
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
    if (this.propFocous) {
      if (!this.propFocous.Selected) {
        this.propFocous.Selected = '';
      }
      if (isNumber(symbol)) {
        this.propFocous.Selected += symbol;
      }
      if (
        symbol === '.' &&
        !new String(this.propFocous.Selected).includes('.')
      ) {
        this.propFocous.Selected += symbol;
      }
      if (
        symbol === '-' &&
        !new String(this.propFocous.Selected).includes('-')
      ) {
        this.propFocous.Selected += symbol;
      }
      if (symbol == '<') {
        this.propFocous.Selected = this.propFocous.Selected.substr(
          0,
          this.propFocous.Selected.length - 1
        );
      } if (symbol == 'Enter') {
        let firstIndex = this.elements.list.findIndex((att) =>
          att.Name == this.propFocous.Name
        );
        let lastI = this.focusLast.reverse();
        let last = this.lastFocus;
        let lastId = last.map(n => n.Name)
        if (lastI[0] == lastId[0]) {
          firstIndex = 0;
        }

        this.changeFocous(firstIndex)
      }
      this.propFocous.color = this.getColorScalling(this.propFocous);
    }
  }

  getColorScalling(propFocous: PIWebAttribute): string {
    let selectedValue = new Number(propFocous.Selected).valueOf();
    let colorClass = 'black';
    let valueSK = Number.MAX_VALUE;
    for (let k of Object.keys(this.templateRangeScalling)) {
      let sk = this.templateRangeScalling[k];

      let config = propFocous.config.find((c) => c.Name == k) as PIWebAttribute;
      if (config && config.Value) {
        valueSK = new Number(config.Value.Value).valueOf();
        if ((selectedValue <= valueSK && k.startsWith('Mínimo')) || (k.startsWith('Máximo') && valueSK > selectedValue)) {
          return sk;
        }
      }
    }
    if (selectedValue >= valueSK && valueSK > 0) {
      return this.templateRangeScalling.Over;
    }
    return colorClass;
  }

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

  elements: Attribute;
  enumerationTree: Array<Arvore>;
  arvoreLocal: Array<Arvore>;
  navigation: Array<Navigation>;
  currentDate = this.utils.formatDateTime(new Date());
  pathNavigation: Navigation = Navigation.Instance();

  propFocous: PIWebAttribute;
  lastFocus: PIWebAttribute[];
  focusLast: string[];

  firstSelection: string = 'Observação';
  textCondition: string = 'Condição'; // "Comparação"
  templateConditionAtt = 'Condição X Atributo';
  templateConditionComp = 'Condição X Comparação';
  templateConditionValue = 'Condição X Valor';
  templateIndex = ' X ';
  templateType = 'Tipo';
  searchField = '';

  templateRangeScalling = {
    Mínimo: 'red',
    'Mínimo de Alerta': 'red',
    'Mínimo de Atenção': 'yellow',
    'Máximo de Atenção': 'white',
    'Máximo de Alerta': 'yellow',
    Máximo: 'red',
    Over: 'red',
  };
  templateMax = 'Máximo';
  templateMaxAtention = 'Máximo de Atenção';

  minimo: any;
  minimoAlerta: any;
  minimoAtencao: any;
  maximoAtencao: any;
  maximoAlerta: any;
  maximo: any;

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
          let pathEdit = editData['relativePath'];
          let path = pathEdit.split(`\\`).filter(p => Boolean(p))
          let name = path[path.length - 1];


          this.navigation = new Array<{ path: Array<string>; name: string }>();
          this.navigation.push({
            path: path,
            name: undefined,
          });
          this.pathNavigation.path = path;
          this.pathNavigation.name = name;
          let first = editData['value'].filter(o => o.Name == 'Observação').find(s => s.Selected)
          console.log(editData)
          this.elements = new Attribute;
          this.currentDate = editData['date']
          this.elements.firstSelection = first;
          this.elements.RelativePath = pathEdit;
          this.elements.WebId = editData['AplicacaoID'];
          this.elements.list = editData['value'].filter(o => o.Name != 'Observação');
          this.changeFocous(0)
        }
      }
    }
  }



  async ionViewWillEnter() {
    let isToSyncDataFromPI = this.config.isToLoadFromPI && true;
    this.init();
    await this.api.init();
    await this.config.init();


    if (isToSyncDataFromPI) {
      await this.syncDataFromPI();
    } else {
      await this.loadDataFromStorage();
    }
    await this.edit();
  }

  init() {
    this.elements = null;
    this.propFocous = null;
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
    let rootUrl = this.utils.getValue(
      rootData,
      this.config.ElementoRaiz,
      this.config.endPoint.database
    );
    let insertParams = this.api.getCatagoryParams(this.config.Insercao);
    let navigationData = await this.api
      .get(rootUrl, insertParams)
      .pipe(map(this.generateRelativePath))
      .toPromise();
    let attributes = await this.loadAttributes(navigationData)
    let navigationTree = navigationData.map((nav) => {
      let tree = new Arvore();
      tree.atributos = attributes.find((att) => att.WebId == nav.WebId)
      tree.AplicacaoID = nav.WebId;
      tree.relativePath = nav.relativePath;
      tree.Caminho = tree.relativePath.split('\\').filter((c) => Boolean(c));
      return tree;
    });
    await this.storageService.store(
      this.storageService.navigation,
      navigationTree
    );
    this.api.hideLoader();
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
    let batchResponse = await this.api.executeBatchAsync(
      this.config.afServer,
      batchRequest
    );


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

  loadEnumerationSetsValues = (data): Array<PIWebObject> => {
    return data['Items'].map((e) => {
      return { ...e, values: e.Links.Values };
    });
  };

  async loadNavigationDataFromStorage() {
    this.arvoreLocal = await this.storageService.getByKey(
      this.storageService.navigation
    );
    this.navigation = new Array<Navigation>();
    if (this.arvoreLocal) {
      this.arvoreLocal.forEach((arvore: Arvore) => {
        let path = arvore.Caminho.find(firstOrNull);

        if (!this.navigation.find((n) => n.name == path)) {
          this.navigation.push(Navigation.Create([path], path));
        }
      });
    }
  }

  async loadDataFromStorage() {
    await this.loadNavigationDataFromStorage();
    await this.loadEnumerationSetsFromStorage();
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
    this.pathNavigation = e;
    this.storageService.getFilhos(e.path).then((result) => {
      let pathLength = e.path.length;
      this.navigation = new Array<{ path: Array<string>; name: string }>();
      if (result.length == 1) {
        let item = result.find(firstOrNull);
        this.navigation.push({
          path: e.path,
          name: item.Nome,
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
            });
          }
        });
      }
    });
  };



  onSelect($event) {
    this.propFocous = null;
    this.elements.list.forEach((att) => {

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
      this.propFocous = elem;
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
    let response = await this.api.executeBatchAsync(server, request);
    return response;
  }

  read(content: any) {
    let fKey = Object.keys(content).find(firstOrNull);
    let value = content[fKey];
    delete content[fKey];
    return value;
  }

  async loadAttributes(items: Array<PIWebObject>) {
    let server = this.config.afServer;
    let attributesData: Array<Attribute> = new Array<Attribute>();
    let attRequest = createBatch(items, 'Attributes');
    let attResponse = await this.api.executeBatchAsync(server, attRequest);
    let childAttResponse = await this.getResponse(attResponse, 'Attributes');
    let childValueResponse = await this.getResponse(
      childAttResponse,
      'ChildrenValue'
    );
    let valueRequest = createBatch(items, 'Value');
    let valueResponse = await this.api.executeBatchAsync(server, valueRequest);
    for (let key in Object.keys(attResponse)) {
      let newAttribute: Attribute = new Attribute();
      let configList = {};
      let atts = attResponse[key]['Content']['Items'] as Array<PIWebAttribute>;
      for (let attKey in atts) {
        let children = this.read(childAttResponse)['Content'][
          'Items'
        ] as Array<PIWebAttribute>;

        for (let keyChild in children) {
          let child = children[keyChild];
          child.Value = this.read(childValueResponse)['Content'];
          let parentPath = child.Path;
          parentPath = parentPath.split('|').slice(0, -1).join('|');
          if (!(parentPath in configList)) {
            configList[parentPath] = [];
          }
          configList[parentPath].push(child);
        }
      }
      atts = atts.map((att) => {
        att.config = configList[att.Path] || [];
        att.mode = this.getMode(att.config as PIWebAttribute[]);

        return att
      });

      let valuesItems = valueResponse[key]['Content'][
        'Items'
      ] as Array<PIWebAttribute>;
      let firstSelectionIndex = atts.findIndex(
        (att) => att.Name == this.firstSelection
      );
      newAttribute.WebId = items[key].WebId;
      newAttribute.RelativePath = items[key].relativePath;
      newAttribute.firstSelection = atts[firstSelectionIndex];
      atts.splice(firstSelectionIndex, 1);
      newAttribute.list = atts
        .filter((att) => att.Description.includes(this.config.AppAttributes))
        .map((att) => this.getAttValue(att, valuesItems))
        .sort(function (a: PIWebAttribute, b: PIWebAttribute) {
          let indexA = a.config.find(i => i.Name == 'Indexe') as PIWebAttribute;
          let indexB = b.config.find(i => i.Name == 'Indexe') as PIWebAttribute;
          if (indexA && indexB && indexA.Value && indexB.Value)
            return indexA.Value.Value < indexB.Value.Value ? -1 : 1;
          return 1;
        })
      attributesData.push(newAttribute);
    }

    return attributesData;
  }
  getMode(config: PIWebAttribute[]): EnumModeAttribute {
    let type = config.find((c) => c.Name == this.templateType);
    if (
      type &&
      type.Value &&
      type.Value.Good &&
      type.Value.Value &&
      type.Value.Value.Name &&
      EnumModeAttribute[type.Value.Value.Name]
    ) {
      return EnumModeAttribute[type.Value.Value.Name];
    }
    return EnumModeAttribute.Leitura;
  }
  setPropFocous(element: PIWebAttribute) {
    if (
      (element.mode === EnumModeAttribute.Escrita ||
        element.mode === EnumModeAttribute['Leitura/Escrita'] ||
        element.mode === EnumModeAttribute['Escrita (Constante)'] ||
        element.mode === EnumModeAttribute['Leitura/Escrita (Constante)']) &&
      element.Type != typeEnumeration
    ) {
      this.propFocous = element;
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
      if (hasNoData == 'No Data') {
        attValueString = ''
      }
      if (att.mode == EnumModeAttribute['Leitura/Escrita']) {

        att.Selected = attValueString;
        att.color = this.getColorScalling(att);
      }
      if (att.mode == EnumModeAttribute['Leitura/Escrita (Constante)']) {
        att.Selected = attValueString;
        att.color = this.getColorScalling(att);
      }

      if (attValue.UnitsAbbreviation) {
        attValueString = attValueString + ' ' + attValue.UnitsAbbreviation;
      }
    }

    att.ValueString = attValueString;
    return att;
  }




  getAlerts(propFocous: PIWebAttribute) {
    this.maximo = null;
    this.maximoAlerta = null;
    this.maximoAtencao = null;
    this.minimo = null;
    this.minimoAlerta = null;
    this.minimoAtencao = null;
    for (let k of Object.keys(this.templateRangeScalling)) {
      let config = propFocous.config.find((c) => c.Name == k) as PIWebAttribute;
      if (config && config.Name) {
        if (config.Name === 'Mínimo') {
          this.minimo = config.Value.Value;
          // console.log(this.minimo)
        }

        if (config.Name === 'Mínimo de Alerta') {
          this.minimoAlerta = config.Value.Value;
          // console.log(this.minimoAlerta)
        }

        if (config.Name === 'Mínimo de Atenção') {
          this.minimoAtencao = config.Value.Value;
          // console.log(this.minimoAtencao)
        }

        if (config.Name === 'Máximo de Atenção') {
          this.maximoAtencao = config.Value.Value;
          // console.log(this.maximoAtencao)
        }

        if (config.Name === 'Máximo de Alerta') {
          this.maximoAlerta = config.Value.Value;
          // console.log(this.maximoAlerta)
        }

        if (config.Name === 'Máximo') {
          this.maximo = config.Value.Value;
          // console.log(this.maximo)
        }

      }
    }
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

    // if (!values.every((t) => t.Selected)) {
    //   this.showAlert('Preencha os campos!');
    //   return;
    // }

    let valueAlert = this.propFocous.Selected;

    if (!valueAlert) {
      this.showAlert('Não existem dados preenchidos!')
      return;
    }

    if (this.propFocous.mode == 'LeituraEscrita') {
      this.getAlerts(this.propFocous)
    }
    if (this.propFocous.mode == 'LeituraEsConst') {
      this.getAlerts(this.propFocous)
      console.log(this.propFocous)
    }
    if (this.propFocous.mode == 'EscritaConstante') {
      this.getAlerts(this.propFocous)
      console.log(this.propFocous)
    }
    if (this.propFocous.mode == 'Escrita') {
      this.getAlerts(this.propFocous)
      console.log(this.propFocous)
    }


    if (this.maximo || this.minimo || this.minimoAlerta || this.minimoAtencao || this.maximoAlerta || this.maximoAtencao) {
      if (!this.minimo['Name']) {
        if (valueAlert <= this.minimo) {
          await this.showAlert('Atenção! A leitura esta fora dos limites especificados para o equipamento.')
          return;
        }
      }
      if (!this.maximo['Name']) {
        if (valueAlert >= this.maximo) {
          await this.showAlert('Atenção! A leitura esta fora dos limites especificados para o equipamento.')
          return;
        }
      }

      if (valueAlert > this.minimo && valueAlert <= this.minimoAlerta) {
        let res = await this.showConfirm('A leitura esta abaixo do limite de alerta. Deseja salvar?');
        if (!res) return;
      }

      if (valueAlert > this.minimoAlerta && valueAlert <= this.minimoAtencao) {
        let res = await this.showConfirm('A leitura esta abaixo do limite de atenção. Deseja salvar?')
        if (!res) return;
      }

      if (valueAlert >= this.maximoAtencao && valueAlert < this.maximoAlerta) {
        let res = await this.showConfirm('A leitura esta acima do limite de atenção. Deseja salvar?')
        if (!res) return;
      }

      if (valueAlert >= this.maximoAlerta && valueAlert < this.maximo) {
        let res = await this.showConfirm('A leitura esta acima do limite de alerta. Deseja salvar?');
        if (!res) return;
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
    console.log(this.elements)
    this.elements = null;
    let pathLength = this.pathNavigation.path.pop();
    this.onClickId({
      path: this.pathNavigation.path,
      name: undefined,
    })

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

  async search($event: Event) {
    let searchItem = $event.target['value'];

    if (searchItem) {
      this.elements = null;
      searchItem = new String(searchItem).toLowerCase();

      this.navigation = new Array<Navigation>();

      this.arvoreLocal.forEach((arvore: Arvore) => {
        if (arvore && arvore.Caminho && arvore.Caminho.length > 0) {
          arvore.Caminho.forEach((path, index) => {
            if (
              path.toLocaleLowerCase().includes(searchItem) &&
              !this.navigation.some((n) => n.name == path)
            ) {
              this.navigation.push(
                Navigation.Create(arvore.Caminho.slice(0, index + 1), path)
              );
            }
          });
        }
      });
      if (this.navigation.length == 0) {
        console.log('Arvore Vazia')
      }
    } else {
      this.elements = null;
      await this.loadNavigationDataFromStorage();
    }
  }
}
