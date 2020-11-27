import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/services/api.service';
import { AppUtils } from 'src/utils/app.utils';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MenuController, NavController } from '@ionic/angular';
import { Elements } from 'src/services/data-base.service';
import {
  StorageArvoreService,
  Arvore,
} from 'src/services/storage-arvore.service';
import { ConfigService } from 'src/services/config.service';
import { PIWebObject } from 'src/model/PIWebObject.model';
import { PIWebAttribute } from 'src/model/PIWebAttribute.model';
import { map } from 'rxjs/operators';
import { Attribute } from 'src/model/Attribute.model';

const firstOrNull = () => true;

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
  navigationTree: Array<Arvore>;
  arvoreLocal: Array<Arvore>;
  navigation: Array<{ path: Array<string>; name: string }>;
  dataAtual = this.utils.formatDateTime(new Date());
  isToSyncDataFromPI: boolean;

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

  ionViewWillEnter() {
    this.isToSyncDataFromPI = this.config.isToLoadFromPI;
    this.loadAuthFromStorage();

    if (this.isToSyncDataFromPI) {
      this.syncDataFromPI();
    } else {
      //this.loadConfigFromStorage();
      this.loadDataFromStorage();
    }
  }
  loadAuthFromStorage() {
    this.authToken = this.utils.getStorage('Authorization');
    this.api.setAuth(this.authToken);
  }

  async syncDataFromPI() {
    await this.loadConfigFromPI();
    await this.loadNavigationData();
  }

  async loadConfigFromPI() {
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

  async loadNavigationData() {
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

    this.storageService.store(
      this.storageService.navigation,
      this.navigationTree
    );
    this.api.hideLoader();
    await this.loadDataFromStorage();
  }

  async loadDataFromStorage() {
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

  generateRelativePath = (data): Array<PIWebObject> => {
    return data['Items'].map((e) => {
      return {
        ...e,
        relativePath: e.Path.replace(this.config.ElementoRaiz, ''),
      };
    });
  };

  ngOnInit() {}

  onClickId = (e) => {
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
        console.log(this.elements);
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

    // for (let item of items) {

    for (let item of items.filter((a, i) => i < 25)) {
      let attributesLink = item.Links.Attributes;
      let attributesValue = item.Links.Value;
      let attr = await this.api.get(attributesLink).toPromise();
      let values = await this.api.get(attributesValue).toPromise();
      let attributes = attr['Items'] as Array<PIWebAttribute>;
      let valuesItems = values['Items'] as Array<PIWebAttribute>;

      let newAttribute: Attribute = new Attribute();
      newAttribute.WebId = item.WebId;
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
    return attributesData;
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
}
