import { Component, OnInit, ViewChild, ɵConsole } from '@angular/core';
import { ApiService } from 'src/services/api.service';
import { AppUtils } from 'src/utils/app.utils';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MenuController, NavController } from '@ionic/angular';
import {
  StorageArvoreService,
  Arvore,
} from 'src/services/storage-arvore.service';
import { ConfigService } from 'src/services/config.service';
import { PIWebObject } from 'src/model/PIWebObject.model';
import { PIWebAttribute } from 'src/model/PIWebAttribute.model';
import { distinct, map } from 'rxjs/operators';
import { Attribute } from 'src/model/Attribute.model';
import { PIWebValue } from 'src/model/PIWebValue.model';
import { EnumerationValue } from 'src/model/EnumerationValue.model';
import { __await } from 'tslib';

const firstOrNull = () => true;
const typeEnumeration = 'EnumerationValue';

@Component({
  selector: 'app-entrada-manual',
  templateUrl: './entrada-manual.component.html',
  styleUrls: ['./entrada-manual.component.scss'],
})
export class EntradaManualComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

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
  dataAtual = this.utils.formatDateTime(new Date());
  isToSyncDataFromPI: boolean;
  pathNavigation: { path: Array<string>; name: string } = {
    path: [],
    name: '',
  };
  clickNavigation: string;

  firstSelection: string = 'Observação';
  conditionSelection: string = 'Observação <> "Não Observado"';
  conditionFirstSelection: string = 'Não Observado';

  constructor(
    private api: ApiService,
    public utils: AppUtils,
    private router: Router,
    private messageBox: MatSnackBar,
    private menu: MenuController,
    public navCtrl: NavController,
    public storageService: StorageArvoreService,
    public config: ConfigService
  ) {}

  async ionViewWillEnter() {
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
    let configUrlValues = this.api
      .getLink(configHome, this.config.config, this.config.endPoint['value'])
      .find(firstOrNull);
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
      this.config[attribute] = value.find(firstOrNull);
    }

    this.api.setBaseUrl(
      'https://' + this.config.afServer + '/piwebapi',
      this.config.ElementoRaiz
    );
    this.utils.saveStorage('senhaOff', this.config.SenhaOff);
  }

  async syncNavigationData() {
    let rootData = await this.api.getData().toPromise();
    let rootUrl = this.api
      .getLink(
        rootData,
        this.config.ElementoRaiz,
        this.config.endPoint.database
      )
      .find(firstOrNull);
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
        acc
          .concat(cur.atributos.escrita)
          .concat(cur.atributos.leitura)
          .concat(cur.atributos.leituraEscrita);

      let qualifyers = this.arvoreLocal
        .reduce(aggregateAttributes, [])
        .filter((att) => att.Type == typeEnumeration)
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
    this.getOptions('Instrumento_PC');
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
    console.log(this.elements);
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
        this.elements.escrita.forEach((esc) => {
          if (esc.Type == typeEnumeration) {
            let selectOptions = this.getOptions(esc.TypeQualifier);
            esc.valuesSets = selectOptions;
          }
        });

        this.elements.leitura.forEach((esc) => {
          if (esc.Type == typeEnumeration) {
            let selectOptions = this.getOptions(esc.TypeQualifier);
            esc.valuesSets = selectOptions;
          }
        });

        this.elements.leituraEscrita.forEach((esc) => {
          if (esc.Type == typeEnumeration) {
            let selectOptions = this.getOptions(esc.TypeQualifier);
            esc.valuesSets = selectOptions;
          }
        });

        let firstSelectionIndex = this.elements.escrita.findIndex(
          (esc) => esc.Name == this.firstSelection
        );
        this.elements.firstSection = this.elements.escrita[firstSelectionIndex];
        if (this.elements.firstSection) {
          this.elements.firstSection.Selected = this.elements.firstSection.valuesSets.find(
            (f) => f.Name == this.conditionFirstSelection
          );
        }
        this.elements.escrita.splice(firstSelectionIndex);
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

  async loadAttributes(items: Array<PIWebObject>) {
    let attributesData: Array<Attribute> = new Array<Attribute>();
    let bacthRequestAttributes = this.createBatch(items, 'Attributes');
    let batchResponseAttributes = await this.api
      .executeBatch(this.config.afServer, bacthRequestAttributes)
      .toPromise();

    let batchRequestValues = this.createBatch(items, 'Value');
    let batchResponseValues = await this.api
      .executeBatch(this.config.afServer, batchRequestValues)
      .toPromise();

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
        let newAttribute: Attribute = new Attribute();
        newAttribute.WebId = items[key].WebId;
        newAttribute.escrita = attributes.filter(
          (att) => att.Description == this.config.Escrita
        );

        newAttribute.leitura = attributes
          .filter((att) => att.Description == this.config.Leitura)
          .map((att) => this.getAttValue(att, valuesItems));
        newAttribute.leituraEscrita = attributes
          .filter((att) => att.Description == this.config.EscritaLeitura)
          .map((att) => this.getAttValue(att, valuesItems));

        attributesData.push(newAttribute);
      }
    }

    return attributesData;
  }

  createBatch(items: Array<PIWebObject>, type: string) {
    let batchItem = {};
    let selectedFieldsParam =
      '?selectedFields=Items.Description;Items.Name;Items.Path;Items.Type;Items.TypeQualifier';

    if (type == 'Value') {
      selectedFieldsParam = '?selectedFields=Items.Name;Items.Value;Items.Path';
    }
    if (type == 'EnumerationSets') {
      selectedFieldsParam = '';
      type = 'Values';
    }

    items.forEach((item, index) => {
      batchItem[index] = {
        Method: 'GET',
        Resource: `${item.Links[type]}${selectedFieldsParam}`,
      };
    });
    return batchItem;
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

  getOptions(qualifyer: string) {
    let enumerationSet = this.enumerationTree.find(
      (enumset) => enumset.Nome == qualifyer
    );

    if (enumerationSet) {
      return enumerationSet.value;
    }
    return [];
  }
}
