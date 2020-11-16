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
  ArvoreList,
} from '../../services/storage-arvore.service';
import {
  arvore,
  ArvoreLocal,
} from '../entrada-manual/entrada-manual.interfaces';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private loginData: Login = {};
  aplicacaoData: Array<arvore>;

  private configError: MatSnackBarConfig = {
    panelClass: ['style-error'],
    duration: 2000,
    verticalPosition: 'top',
  };
  storageService: any;

  onSubmit(f: NgForm) {
    if (f.valid) {
      console.log(f.value.username + ':' + f.value.password);
      var Authorization = btoa(f.value.username + ':' + f.value.password);
      this.api.setAuth(Authorization);
      console.log(Authorization);
      this.loginData.Autorizacao = Authorization;
      this.storage.removeAll();
      this.api.getData().subscribe((data: Resposta) => {
        console.log(data);
        if (data) {
          this.utils.saveStorage('Authorization', Authorization);
          this.utils.usuarioLogado = this.utils.getStorage(
            'Authorization'
          ) as Autorizacao;
          this.api.getData().subscribe((data) => {
            if (data) {
              this.aplicacaoData = data['Items'];
              let arr = this.aplicacaoData.map((arLocal) => {
                let arvore = new Arvore();
                arvore.AplicacaoID = arLocal['WebId'];
                arvore.parentID = arLocal['Links']['Parent'];
                arvore.ownID = arLocal['Links']['Self'];
                arvore.Nome = arLocal['Name'];
                arvore.Caminho = arLocal['Path'];
                return arvore;
              });
              arr.forEach((arvore) => {
                this.storage.insert(arvore);
              });
              this.router.navigate(['/entrada-manual']);
              this.api.hideLoader();
            } else {
              this.showMessageBox('Dados Invalidos');
            }
          });

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

  constructor(
    private router: Router,
    private api: ApiService,
    public utils: AppUtils,
    private messageBox: MatSnackBar,
    public storage: StorageArvoreService
  ) {}

  ngOnInit() {
    this.utils.usuarioLogado = null;
    this.utils.removeStorgare('Autorizacao');
  }
}
