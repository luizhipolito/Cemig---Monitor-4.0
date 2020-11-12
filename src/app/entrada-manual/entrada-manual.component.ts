import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/services/api.service';
import { AppUtils } from 'src/utils/app.utils';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Autorizacao } from '../login/login.interfaces';
import { Resposta, arvore, dados } from './entrada-manual.interfaces';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MenuController, NavController } from '@ionic/angular';
import { Elements, DataBaseService } from 'src/services/data-base.service';
import {
  StorageArvoreService,
  ArvoreList,
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
  aplicacaoData: Array<arvore>;
  arvoreLocal: Array<ArvoreList>;

  dataAtual = this.utils.formatDateTime(new Date());

  fillOfAplicacao = () => {
    this.api.getData('').subscribe((data) => {
      if (data.Status) {
        this.aplicacaoData = data.Dados;
        console.log('dados data', data.Dados);
        let parentId = '';

        let arr = this.aplicacaoData.sort(this.comparePath);
        console.log('arr', arr);
        for (let ar of arr) {
          let pathSplit = ar.Caminho.split('\\');

          let index = pathSplit.indexOf('Usinas');
          if (pathSplit.length === index + 1) continue;
          if (pathSplit.length === index + 2) {
            //Raiz: ex: Usinas/PCH...
            //Não precisa salvar ipdParent
            this.storageService.insert(ar);
          } else {
            const prevPath = pathSplit
              .slice(0, pathSplit.length - 1)
              .join('\\');
            parentId = arr.find((a) => a.Caminho === prevPath).AplicacaoID;
            ar.parentID = parentId;
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

  comparePath(a: arvore, b: arvore) {
    if (a.Caminho < b.Caminho) {
      return -1;
    }
    if (a.Caminho > b.Caminho) {
      return 1;
    }
    return 0;
  }

  ngAfterViewInit() {
    this.storageService.getAll().then((result) => {
      this.arvoreLocal = result;
      console.log('Arvore local', this.arvoreLocal);
    });
  }

  onClickId = (e) => {
    let Idparent = e.AplicacaoID;
    console.log(Idparent);
    this.storageService.getFilhos(Idparent).then((result) => {
      this.arvoreLocal = result;
      if (result === undefined) {
        console.log(result);
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
      'Autorizacao'
    ) as Autorizacao;

    this.fillOfAplicacao();
    console.log('autorizado', this.autorizacaoStored);
  }
  ngOnDestroy() {}
}
