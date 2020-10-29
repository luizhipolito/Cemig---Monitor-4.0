import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/services/api.service';
import { AppUtils } from 'src/utils/app.utils';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Autorizacao } from '../login/login.interfaces';
import {
  Resposta,
  AplicacaoPI,
  arvore,
  TagPI,
  dados,
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

  autorizacaoStored: Autorizacao;
  aplicacaoData: dados;
  arvores: Arvore;

  TableDataSource = new MatTableDataSource<TagPI>([]);
  tableColumns: string[] = ['Nome', 'Descricao'];

  dataAtual = this.utils.formatDateTime(new Date());

  fillOfAplicacao = () => {
    this.api
      .getData(
        '/entradaManual/TagAplicacao?AuthorizationRequest=' +
          this.autorizacaoStored.Token +
          '&AplicacaoId=E0Yfc0jetNdUKgzx5SiPQwKAJmkZ-0ID6xGDTA46LyNIOwRUMyQU1BWi1UMU41RUo1XFRFU1RFU1xDRU1JRyAtIEdFUsOKTkNJQSBERSBTRUdVUkFOw4dBIERFIEJBUlJBR0VOUyBFIE1BTlVURU7Dh8ODTyBDSVZJTA&?searchFullHierarchy=true'
      )
      .subscribe((data: Resposta) => {
        if (data.Status) {
          this.aplicacaoData = data.Dados;
          for (let ar of this.aplicacaoData) {
            let parentId = ar.AplicacaoID;
            let pathSplit = ar.Caminho.split('\\');
            // console.log(pathSplit);
            let index = pathSplit.indexOf('Usinas');
            if (pathSplit.length === index) continue;
            if (pathSplit.length === index + 2) {
              //Raiz: ex: Usinas/PCH...
              //Não precisa salvar ipdParent
              parentId = null;
              parentId = ar.AplicacaoID;
              console.log('path', ar);
              this.storageService.insert(ar);
            } else {
              //Filhos da raiz. Ex: Usinas/PCH.../../.. etc
              //Salvar idParent, que tem que ser sempre o idApplication anterior
              this.storageService.insert(ar);
            }
          }
          this.api.hideLoader();
        } else {
          this.showMessageBox(data.Mensagem);
        }
      });
  };

  onSairClick = (ev) => {
    this.logoutUsuario();
  };

  showMessageBox = (message: string) => {
    this.messageBox.open(message, null, {
      duration: 2000,
    });
  };

  logoutUsuario = () => {
    this.utils.usuarioLogado = null;
    this.utils.removeStorgare('Autorizacao');
    this.router.navigate(['/']);
    this.navCtrl.pop();
  };

  constructor(
    private api: ApiService,
    public utils: AppUtils,
    private router: Router,
    private messageBox: MatSnackBar,
    private menu: MenuController,
    private db: DataBaseService,
    public navCtrl: NavController,
    public storageService: StorageArvoreService
  ) {}

  openMenu() {
    this.menu.open();
  }

  ngOnInit() {
    this.autorizacaoStored = this.utils.getStorage(
      'Autorizacao'
    ) as Autorizacao;

    this.fillOfAplicacao();
    console.log('autorizado', this.autorizacaoStored);
  }
  ngOnDestroy() {}

  ionViewDidEnter() {
    if (!this.arvores) {
      this.storageService.getAll().then((result) => {
        this.arvores = result;
        console.log(this.arvores);
      });
    }
  }
}
