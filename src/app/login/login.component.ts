import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Login, Resposta, Autorizacao } from './login.interfaces';
import { NgForm } from '@angular/forms';
import { ApiService } from 'src/services/api.service';
import { AppUtils } from 'src/utils/app.utils';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import {
  StorageArvoreService,
  Arvore,
  Enumeration,
  ArvoreList,
} from '../../services/storage-arvore.service';
import {
  arvore,
  dataEnumeration,
} from '../entrada-manual/entrada-manual.interfaces';
import { ConfigService } from 'src/services/config.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private loginData: Login = {};
  aplicacaoData: Array<arvore>;
  enumerationData: Array<dataEnumeration>;

  private configError: MatSnackBarConfig = {
    panelClass: ['style-error'],
    duration: 2000,
    verticalPosition: 'top',
  };
  storageService: any;

 
  constructor(
    private router: Router,
    private api: ApiService,
    public utils: AppUtils,
    private messageBox: MatSnackBar,
    public storage: StorageArvoreService,
    public configService: ConfigService
  ) {}

 onSubmit(f: NgForm) {
    if (f.valid) {
      var Authorization = btoa(f.value.username + ':' + f.value.password);
      this.api.setAuth(Authorization);
      this.loginData.Autorizacao = Authorization;
      this.api.getData().subscribe((data: Resposta) => {
        if (data) {
          this.utils.saveStorage('Authorization', Authorization);
          this.utils.usuarioLogado = this.utils.getStorage(
            'Authorization'
          ) as Autorizacao;

          this.storage.removeAll();
          this.configService.isToLoadFromPI = true;
          this.router.navigate(['/entrada-manual']);
          this.api.hideLoader();

          // redireciona para pagina de entrada manual
        } else {
          this.api.hideLoader();
          this.showMessageBox(data.Mensagem);
        }
      });
    } else {
      this.showMessageBox('Informe seu usuário e senha para continuar!');
    }
  }

  showMessageBox = (message: string) => {
    this.messageBox.open(message, null, this.configError);
  };


  ngOnInit() {
    this.utils.usuarioLogado = null;
    this.utils.removeStorgare('Autorizacao');
  }
}
