import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/services/api.service';
import { AppUtils } from 'src/utils/app.utils';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import {
  Resposta,
  arvore,
  dados,
  ArvoreLocal,
} from './entrada-manual.interfaces';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MenuController, NavController } from '@ionic/angular';
import { Elements, DataBaseService } from 'src/services/data-base.service';
import {
  StorageArvoreService,
  ArvoreList,
  Arvore,
} from 'src/services/storage-arvore.service';
import { Autorizacao } from '../login/login.interfaces';
import { ConfigService } from 'src/services/config.service';
import { PIWebObject } from 'src/model/PIWebObject.model';
import { PIWebAttribute } from 'src/model/PIWebAttribute.model';
import { map } from 'rxjs/operators';

const firstOrNull = () => true;

@Component({
  selector: 'app-entrada-manual',
  templateUrl: './entrada-manual.component.html',
  styleUrls: ['./entrada-manual.component.scss'],
})
export class EntradaManualComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  elements: Elements[] = [];
  Elemento = {};
  selectedViews = 'elemento';

  private configError: MatSnackBarConfig = {
    panelClass: ['style-error'],
    duration: 2000,
    verticalPosition: 'top',
  };

  authToken: string;
  navigationData: Array<PIWebObject>;
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
    this.navigationData = navigationData;

    await this.loadAttributes(navigationData);
    this.navigationTree = navigationData.map((nav) => {
      let tree = new Arvore();
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
    this.pathNavigation = e;
    console.log(this.pathNavigation);
    this.storageService.getFilhos(e.path).then((result) => {
      let pathLength = e.path.length;

      this.navigation = new Array<{ path: Array<string>; name: string }>();
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
    // await items.forEach(async (item) => {
    //   let attributesLink = item.Links.Attributes;
    //   let attr = await this.api.get(attributesLink).toPromise();
    //   let attributes = attr['Items'] as Array<PIWebAttribute>;
    //   //let attributesLeitura = attributes.filter(att=> att.Description == this.config.Leitura);
    //   let attributesEscrita = attributes.filter(
    //     (att) => att.Description == this.config.Escrita
    //   );
    //   //let attributesEscritaELeitura =  attributes.filter(att=> att.Description == this.config.LeituraEscrita);
    //   console.log(attributesEscrita);
    // });
  }
}
