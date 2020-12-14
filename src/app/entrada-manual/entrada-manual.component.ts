import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/services/api.service';
import { AppUtils } from 'src/utils/app.utils';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MenuController, NavController, ModalController } from '@ionic/angular';
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
import { distinct, map } from 'rxjs/operators';
import { Attribute } from 'src/model/Attribute.model';
import { PIWebValue } from 'src/model/PIWebValue.model';
import { EnumerationValue } from 'src/model/EnumerationValue.model';
import { __await } from 'tslib';
import { isNumber } from 'util';
import { InserirComentarioComponent } from '../inserir-comentario/inserir-comentario.component';

const firstOrNull = () => true;
const typeEnumeration = 'EnumerationValue';
let currentModal = null;

@Component({
  selector: 'app-entrada-manual',
  templateUrl: './entrada-manual.component.html',
  styleUrls: ['./entrada-manual.component.scss'],
})
export class EntradaManualComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  keyboardValue = '';
  numberGroups = [
    [7, 8, 9],
    [4, 5, 6],
    [1, 2, 3],
    [0, '<', '.'],
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
      if (symbol == '<') {
        this.propFocous.Selected = this.propFocous.Selected.substr(
          0,
          this.propFocous.Selected.length - 1
        );
      }
    }
  }

  async goInserirComentario() {
    let modal = await this.modalController.create({
      component: InserirComentarioComponent,
      cssClass: 'my-custom-class',
    });
    await modal.present();
    currentModal = modal;
  }
  dismissModal() {
    currentModal.dismiss().then(() => {
      currentModal = null;
    });
  }
  // this.router.navigate(['/inserir-comentario']);

  Elemento = {};
  selectedViews = 'elemento';

  private configError: MatSnackBarConfig = {
    panelClass: ['style-error'],
    duration: 2000,
    verticalPosition: 'top',
  };

  authToken: string;
  elements: Attribute;
  navigationData: Array<PIWebObject>;
  enumerationSets: Array<PIWebObject>;
  enumerationValues: Array<EnumerationValue>;
  value: Array<EnumerationValue>;
  enumerationTree: Array<Arvore>;
  navigationTree: Array<Arvore>;
  arvoreLocal: Array<Arvore>;
  navigation: Array<{ path: Array<string>; name: string }>;
  currentDate = this.utils.formatDateTime(new Date());
  isToSyncDataFromPI: boolean;
  pathNavigation: { path: Array<string>; name: string } = {
    path: [],
    name: '',
  };
  clickNavigation: string;
  propFocous: PIWebAttribute;

  firstSelection: string = 'Observação';
  textCondition: string = 'Condição'; // "Comparação"
  templateConditionAtt = 'Condição X Atributo';
  templateConditionComp = 'Condição X Comparação';
  templateConditionValue = 'Condição X Valor';
  templateIndex = ' X ';
  templateType = 'Tipo';

  constructor(
    private api: ApiService,
    public utils: AppUtils,
    private router: Router,
    private messageBox: MatSnackBar,
    private menu: MenuController,
    public navCtrl: NavController,
    public storageService: StorageArvoreService,
    public config: ConfigService,
    public modalController: ModalController
  ) {}

  async ionViewWillEnter() {
    //this.isToSyncDataFromPI = true;
    this.isToSyncDataFromPI = this.config.isToLoadFromPI;
    await this.loadAuthFromStorage();

    if (this.isToSyncDataFromPI) {
      this.syncDataFromPI();
    } else {
      this.loadDataFromStorage();
    }
  }
  async loadAuthFromStorage() {
    this.authToken = await this.utils.getStorage('Authorization');
    this.api.setAuth(this.authToken);
  }

  async syncDataFromPI() {
    await this.syncConfigFromPI();
    await this.syncNavigationData();
    await this.syncEnumerationSets();
  }

  async syncConfigFromPI() {
    let configHome = await this.api.getData().toPromise();
    let configUrlValues = this.api.getLink(
      configHome,
      this.config.config,
      this.config.endPoint['value']
    );
    let attributes = this.config.attributes;
    let configData = await this.api.get(configUrlValues).toPromise();
    for (let attribute in attributes) {
      let nameOrPath = attributes[attribute];
      let value = this.api.getLink(
        configData,
        nameOrPath,
        this.config.endPoint['value'],
        'Value'
      );
      this.config[attribute] = value;
    }

    this.api.setBaseUrl(
      'https://' + this.config.afServer + '/piwebapi',
      this.config.ElementoRaiz
    );
    this.utils.saveStorage('senhaOff', this.config.SenhaOff);
  }

  async syncNavigationData() {
    let rootData = await this.api.getData().toPromise();
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
    let attributes = await this.loadAttributes(navigationData);

    this.navigationData = navigationData;
    this.navigationTree = navigationData.map((nav) => {
      let tree = new Arvore();
      tree.atributos = attributes.find((att) => att.WebId == nav.WebId);
      tree.AplicacaoID = nav.WebId;
      tree.relativePath = nav.relativePath;
      tree.Caminho = tree.relativePath.split('\\').filter((c) => Boolean(c));
      return tree;
    });

    await this.storageService.store(
      this.storageService.navigation,
      this.navigationTree
    );
    this.api.hideLoader();
    await this.loadDataFromStorage();
  }

  async getEnumarationSets(
    qualyfiers: Array<string>
  ): Promise<Array<PIWebObject>> {
    let rootDataEnumeration = await this.api.getData().toPromise();
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
    this.enumerationSets = await this.getEnumerationSetsValues(enumerationSets);
    this.enumerationTree = this.enumerationSets.map((enumSet) => {
      let tree = new Arvore();
      tree.AplicacaoID = enumSet.WebId;
      tree.relativePath = enumSet.Path;
      tree.Caminho = tree.relativePath.split('\\').filter((c) => Boolean(c));
      tree.value = enumSet.valuesSets;
      tree.Nome = enumSet.Name;
      return tree;
    });

    await this.storageService.store(
      this.storageService.enumerationSets,
      this.enumerationTree
    );
  }
  async getEnumerationSetsValues(enumerationSets: Array<PIWebObject>) {
    let batchRequest = this.createBatch(enumerationSets, 'EnumerationSets');
    let batchResponse = await this.api
      .executeBatch(this.config.afServer, batchRequest)
      .toPromise();

    enumerationSets.forEach((enumset, index) => {
      let response = batchResponse[index];
      if (response && response['Status'] == 200) {
        enumset.valuesSets = this.utils.getItems(response['Content']);
      }
    });

    return enumerationSets;
  }
  getEnumerationSetsQualyfiers(): Array<string> {
    if (this.arvoreLocal) {
      const aggregateAttributes = (acc: Array<PIWebAttribute>, cur: Arvore) =>
        acc.concat(cur.atributos.list).concat([cur.atributos.firstSelection]);

      let qualifyers = this.arvoreLocal
        .reduce(aggregateAttributes, [])
        .filter((att) => att && att.Type == typeEnumeration)
        .map((att) => att.TypeQualifier)
        .filter(this.utils.distinct);
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

    this.navigation = new Array<{ path: Array<string>; name: string }>();
    this.arvoreLocal.forEach((arvore: Arvore) => {
      let path = arvore.Caminho.find(firstOrNull);
      if (!this.navigation.find((n) => n.name == path)) {
        this.navigation.push({
          path: [path],
          name: path,
        });
      }
    });
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

  ngOnInit() {}

  print() {
    //console.log(this.elements);
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
            let selectOptions = this.getOptions(elem.TypeQualifier);
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

  showMessageBox = (message: string) => {
    this.messageBox.open(message, null, {
      duration: 2000,
    });
  };

  openMenu() {
    this.menu.open();
  }

  logoutUsuario = () => {
    this.menu.close();
    this.router.navigate(['/']);
  };
  onSairClick = (ev) => {
    this.logoutUsuario();
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
    });
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

  async loadAttributes(items: Array<PIWebObject>) {
    let server = this.config.afServer;
    let attributesData: Array<Attribute> = new Array<Attribute>();
    let bacthRequestAttributes = this.createBatch(items, 'Attributes');
    let batchResponseAttributes = await this.api
      .executeBatch(server, bacthRequestAttributes)
      .toPromise();

    let batchRequestValues = this.createBatch(items, 'Value');
    let batchResponseValues = await this.api
      .executeBatch(server, batchRequestValues)
      .toPromise();

    const hasChildren = (piwebObj: PIWebObject) => piwebObj.HasChildren;

    for (let key of Object.keys(batchResponseAttributes)) {
      let response = batchResponseAttributes[key];
      let valueResponse = batchResponseValues[key];
      const isResult = (r: any) =>
        r['Status'] == 200 &&
        r['Content'] &&
        r['Content']['Items'] &&
        Array.isArray(r['Content']['Items']);

      let isAttributeResult = isResult(response);
      let isValueResult = isResult(valueResponse);

      if (isAttributeResult && isValueResult) {
        let attributes = response['Content']['Items'] as Array<PIWebAttribute>;
        let valuesItems = valueResponse['Content'][
          'Items'
        ] as Array<PIWebAttribute>;

        let childrenBatch = this.createBatch(
          attributes.filter(hasChildren),
          'Attributes'
        );

        if (attributes.some(hasChildren)) {
          let childrenBatchResponse = await this.api
            .executeBatch(server, childrenBatch)
            .toPromise();
          let configList = {};

          for (let batchKey of Object.keys(childrenBatchResponse)) {
            let configAtt = isResult(childrenBatchResponse[batchKey])
              ? (childrenBatchResponse[batchKey]['Content'][
                  'Items'
                ] as Array<PIWebAttribute>)
              : [];
            let batchValueChildren = this.createBatch(
              configAtt,
              'ChildrenValue'
            );
            let batchValue = await this.api
              .executeBatch(server, batchValueChildren)
              .toPromise();

            configAtt.forEach((child, cIndex) => {
              child.Value = batchValue[cIndex]['Content'];
            });
            let parentPath = configAtt.find(firstOrNull).Path;
            parentPath = parentPath.split('|').slice(0, -1).join('|');
            configList[parentPath] = configAtt;
          }

          attributes.forEach((att) => {
            att.config = configList[att.Path] || [];
            att.mode = this.getMode(att.config as PIWebAttribute[]);
          });
        }

        let newAttribute: Attribute = new Attribute();
        newAttribute.WebId = items[key].WebId;
        newAttribute.RelativePath = items[key].relativePath;

        let firstSelectionIndex = attributes.findIndex(
          (esc) => esc.Name == this.firstSelection
        );
        newAttribute.firstSelection = attributes[firstSelectionIndex];
        attributes.splice(firstSelectionIndex, 1);
        newAttribute.list = attributes
          .filter((att) => att.Description.includes(this.config.AppAttributes))
          .map((att) => this.getAttValue(att, valuesItems));
        attributesData.push(newAttribute);
      }
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

  createBatch(items: Array<PIWebObject>, type: string) {
    let batchItem = {};
    let selectedFieldsParam =
      '?selectedFields=Items.Description;Items.Name;Items.Path;Items.Type;Items.TypeQualifier;Items.HasChildren;Items.Links.Attributes;Items.Links.Value';

    if (type == 'Value') {
      selectedFieldsParam =
        '?selectedFields=Items.Name;Items.Value;Items.Path;Items.HasChildren';
    }
    if (type == 'EnumerationSets') {
      selectedFieldsParam = '';
      type = 'Values';
    }

    if (type == 'ChildrenValue') {
      selectedFieldsParam = '';
      type = 'Value';
    }
    items.forEach((item, index) => {
      batchItem[index] = {
        Method: 'GET',
        Resource: `${item.Links[type]}${selectedFieldsParam}`,
      };
    });
    return batchItem;
  }

  setPropFocous(element: PIWebAttribute) {
    if (
      (element.mode == EnumModeAttribute.Escrita ||
        element.mode == EnumModeAttribute['Leitura/Escrita']) &&
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
      if (attValue.Value.Value) {
        attValueString = attValue.Value.Value;
      } else {
        attValueString = new String(attValue.Value).toString();
      }

      if (attValue.UnitsAbbreviation) {
        attValueString = attValueString + ' ' + attValue.UnitsAbbreviation;
      }
    }

    att.ValueString = attValueString;

    return att;
  }

  async saveElement() {
    let dateStr = this.currentDate
      ? this.currentDate.split('T').find(firstOrNull)
      : null;

    if (!dateStr) {
      return;
    }

    let tree = new Arvore();
    tree.AplicacaoID = this.elements.WebId;
    tree.relativePath = this.elements.RelativePath;
    tree.value = this.utils.getWrittenValues(this.elements);
    tree.date = dateStr;

    let hasTree = await this.storageService.hasValue(
      this.storageService.writtenValues,
      tree
    );

    if (hasTree) {
      //Deseja atualizar?
    }
    await this.storageService.insertOrUpdate(
      this.storageService.writtenValues,
      tree
    );

    alert('Salvo com sucesso');
    //Salvo com sucesso

    console.log(
      await this.storageService.getByKey(this.storageService.writtenValues)
    );
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
}
