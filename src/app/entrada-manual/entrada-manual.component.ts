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
import { ConfigService } from 'src/services/config.service';

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

  onClickId = (e) => {
    let Idparent = e.ownID;
    console.log(Idparent);
    this.storageService.getFilhos(Idparent).then((result) => {
      this.arvoreLocal = result;
      console.log(this.arvoreLocal);
    });
  };

  ionViewWillEnter() {
    this.fillOfAplicacao();
  }

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
    public storageService: StorageArvoreService,
    public config: ConfigService
  ) {}

  ngOnInit() {
    this.autorizacaoStored = this.utils.getStorage(
      'Authorization'
    ) as Autorizacao;
    this.api.setAuth(this.autorizacaoStored);

    this.api.getData().subscribe((data) => {
      const firstOrNull = () => true;

      let linkUrl = this.api.getLink(
        data,
        this.config.config,
        this.config.endPoint['value']
      );
      let url = linkUrl.find(firstOrNull);

      this.api.get(url).subscribe((data) => {
        let attributes = this.config.attributes;
        for (let attribute in attributes) {
          let nameOrPath = attributes[attribute];
          let value = this.api.getLink(
            data,
            nameOrPath,
            this.config.endPoint['value'],
            'Value'
          );
          console.log(value);
          this.config[attribute] = value.find(firstOrNull);
        }

        // this.config.ElementoRaiz = this.config.ElementoRaiz.split('\\').join(
        //   '\\\\'
        // );

        console.log(this.config.ElementoRaiz);

        this.api.setBaseUrl(
          'https://' + this.config.afServer + '/piwebapi',
          this.config.ElementoRaiz
        );

        this.api.getData().subscribe((data) => {
          linkUrl = this.api.getLink(
            data,
            this.config.ElementoRaiz,
            this.config.endPoint.database
          );
          this.utils.saveStorage('senhaOff', this.config.SenhaOff);
          let insercaoParams = this.api.getCatagoryParams(this.config.Insercao);
          let elementUrl = linkUrl.find(firstOrNull);
          this.api.get(elementUrl, insercaoParams).subscribe((data) => {
            data['Items'] = data['Items'].map((e) => {
              return {
                ...e,
                relativePath: e.Path.replace(this.config.ElementoRaiz, ''),
              };
            });
            console.log(data);
            if (data) {
              this.aplicacaoData = data['Items'];
              let arr = this.aplicacaoData.map((arLocal) => {
                let arvore = new Arvore();
                arvore.AplicacaoID = arLocal['WebId'];
                arvore.relativePath = arLocal['relativePath'];
                arvore.Caminho = arvore.relativePath.split('\\');

                return arvore;
              });

              arr.forEach((arvore) => {
                this.storageService.insert(arvore);
              });

              this.api.hideLoader();
            } else {
              this.showMessageBox('Dados Invalidos');
            }
          });
        });

        // let url = linkUrl.find((link) => true);
        //   this.api.get(url).subscribe((data) => {
        //     linkUrl = this.api.getLink(
        //       data,
        //       this.config.config,
        //       this.config.endPoint['Elementos']
        //     );
        //     console.log('link2', linkUrl);
        //     let url = linkUrl.find((link) => true);
        //     this.api.get(url).subscribe((data) => {
        //       linkUrl = this.api.getLink(data, 'Categoria Elemento Inserção', [
        //         'Value',
        //       ]);
        //       this.api.get(linkUrl[0]).subscribe((data) => {
        //         let value = data['Value'];
        //         this.config.Insercao = value;
        //         console.log(value);
        //       });
        //       linkUrl = this.api.getLink(data, 'Categoria Elemento Navegação', [
        //         'Value',
        //       ]);
        //       this.api.get(linkUrl[0]).subscribe((data) => {
        //         let value = data['Value'];
        //         this.config.Navegacao = value;
        //         console.log(value);
        //       });
        //       linkUrl = this.api.getLink(data, 'Descrição Atributo Escrita', [
        //         'Value',
        //       ]);
        //       this.api.get(linkUrl[0]).subscribe((data) => {
        //         let value = data['Value'];
        //         this.config.Escrita = value;
        //         console.log(value);
        //       });
        //       linkUrl = this.api.getLink(data, 'Elemento Raiz', ['Value']);
        //       this.api.get(linkUrl[0]).subscribe((data) => {
        //         let value = data['Value'];
        //         this.config.ElementoRaiz = value;
        //         console.log(value);
        //       });
        //       linkUrl = this.api.getLink(data, 'Senha Offline', ['Value']);
        //       this.api.get(linkUrl[0]).subscribe((data) => {
        //         let value = data['Value'];
        //         this.config.SenhaOff = value;
        //         console.log(value);
        //       });
        //     });
        // });
      });
    });
  }

  ngOnDestroy() {}
}
