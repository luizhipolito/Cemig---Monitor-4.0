import { Component, OnInit, ViewChild } from '@angular/core';
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

@Component({
  selector: 'app-entrada-manual',
  templateUrl: './entrada-manual.component.html',
  styleUrls: ['./entrada-manual.component.scss'],
})
export class EntradaManualComponent implements OnInit {
  elements: Elements[] = [];

  Elemento = {};

  selectedViews = 'elemento';

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private configError: MatSnackBarConfig = {
    panelClass: ['style-error'],
    duration: 2000,
    verticalPosition: 'top',
  };

  autorizacaoStored: any;
  aplicacaoData: Array<arvore>;
  arvoreLocal: Array<ArvoreList>;

  dataAtual = this.utils.formatDateTime(new Date());

  fillOfAplicacao = () => {
    this.storageService.getAll().then((result) => {
      this.arvoreLocal = result;
      console.log('Arvore local', this.arvoreLocal);
    });
  };

  ionViewWillEnter() {
    this.fillOfAplicacao();
  }

  onClickId = (e) => {
    let Idparent = e.ownID;
    console.log(Idparent);
    this.storageService.getFilhos(Idparent).then((result) => {
      this.arvoreLocal = result;
      console.log(this.arvoreLocal);
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
    this.utils.usuarioLogado = null;
    this.utils.removeStorgare('Autorizacao');
    this.router.navigate(['/']);
  };
  onSairClick = (ev) => {
    this.logoutUsuario();
  };

  constructor(
    private api: ApiService,
    public utils: AppUtils,
    private router: Router,
    private messageBox: MatSnackBar,
    private menu: MenuController,
    public navCtrl: NavController,
    public storageService: StorageArvoreService
  ) {}

  ngOnInit() {
    this.autorizacaoStored = this.utils.getStorage(
      'Authorization'
    ) as Autorizacao;
    this.api.setAuth(this.autorizacaoStored);
  }
  ngOnDestroy() {}
}
