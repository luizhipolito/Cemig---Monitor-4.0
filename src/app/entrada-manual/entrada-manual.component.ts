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

@Component({
  selector: 'app-entrada-manual',
  templateUrl: './entrada-manual.component.html',
  styleUrls: ['./entrada-manual.component.scss'],
})
export class EntradaManualComponent implements OnInit {
  elements: Elements[] = [];

  Elemento = {};

  selectedViews = 'elementos';

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private configError: MatSnackBarConfig = {
    panelClass: ['style-error'],
    duration: 2000,
    verticalPosition: 'top',
  };

  autorizacaoStored: Autorizacao;
  aplicacaoData: dados;

  TableDataSource = new MatTableDataSource<TagPI>([]);
  tableColumns: string[] = [
    'Nome',
    'Descricao',
    'Unidade',
    'ValorEntrada',
    'StatusEnvio',
    'UltimaData',
    'UltimoValor',
  ];

  dataAtual = this.utils.formatDateTime(new Date());

  fillOfAplicacao = () => {
    this.api
      .getData(
        '/entradaManual/Aplicacoes?AuthorizationRequest=' +
          this.autorizacaoStored.Token
      )
      .subscribe((data: Resposta) => {
        if (data.Status) {
          this.aplicacaoData = data.Dados;
          // let dados = data.Dados;
          console.log(this.aplicacaoData);
          this.api.hideLoader();
        } else {
          this.showMessageBox(data.Mensagem);
        }
      });
  };

  // get by AplicacaoID
  onAplicacaoChange = () => {
    var aplicacao = this.aplicacaoData.Arvore.find((item) => item.AplicacaoID);
    console.log(aplicacao);
    this.api
      .getData(
        '/entradaManual/TagAplicacao?AuthorizationRequest=' +
          this.autorizacaoStored.Token +
          '&AplicacaoId=' +
          aplicacao.AplicacaoID
      )
      .subscribe((data: Resposta) => {
        if (data.Status) {
          this.aplicacaoData = data.Dados;
          console.log(data.Dados);
          // this.TableDataSource.paginator = this.paginator;
          // this.TableDataSource.sort = this.sort;
          this.api.hideLoader();
        } else {
          this.showMessageBox(data.Mensagem);
          this.api.hideLoader();
        }
      });
  };

  // onEnviarClick = (ev) => {
  //   const entradasInvalidas = this.TableDataSource.data.filter(
  //     (item) => item.ErroValidacao
  //   ).length;

  //   if (entradasInvalidas == 0) {
  //     const tagsParaEnviar = this.TableDataSource.data.filter(
  //       (item) => item.ValorEntrada
  //     );

  //     if (tagsParaEnviar.length > 0) {
  //       tagsParaEnviar.forEach((item) => (item.DataEntrada = this.dataAtual));
  //       this.api
  //         .postData(
  //           '/entradaManual/EscreveTags?AuthorizationRequest=' +
  //             this.autorizacaoStored.Token,
  //           tagsParaEnviar
  //         )
  //         .subscribe((data: Resposta) => {
  //           if (data.Status) {
  //             // this.onAplicacaoChange(undefined);

  //             const dadosRetorno = data.Dados as TagPI[];

  //             const dadosTabela = this.TableDataSource.data;

  //             dadosRetorno.forEach((item) => {
  //               const aux = dadosTabela.findIndex(
  //                 (f) => f.Caminho == item.Caminho
  //               );
  //               if (aux >= 0) {
  //                 dadosTabela[aux] = item;
  //               }
  //             });

  //             this.TableDataSource.data = dadosTabela;

  //             console.log(this.TableDataSource.data);
  //             this.api.hideLoader();
  //           } else {
  //             this.api.hideLoader();
  //           }
  //         });
  //     } else alert('Não há valores a serem enviados!');
  //   } else alert('Existem tags com valores inválidos!');
  // };

  onLimparClick = (ev) => {
    this.TableDataSource.data.forEach(
      (item) => (
        (item.ValorEntrada = null),
        (item.ErroValidacao = false),
        (item.StatusEnvio = '')
      )
    );
  };

  onSairClick = (ev) => {
    this.logoutUsuario();
  };

  EntradaValida = (data: TagPI) => {
    const valorEntrada: number = Number.parseFloat(data.ValorEntrada);
    if (
      valorEntrada < data.LimiteInferior ||
      valorEntrada > data.LimiteSuperior
    ) {
      return true;
    }
    return false;
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
    public navCtrl: NavController
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

    this.db.getDataBaseState().subscribe((ready) => {
      if (ready) {
        this.db.getArvores().subscribe((elementos) => {
          this.elements = elementos;
        });
        console.log(this.elements);
      }
    });
  }
  ngOnDestroy() {}
}
