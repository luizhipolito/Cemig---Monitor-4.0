import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Login, Resposta, Autorizacao } from './login.interfaces';
import { NgForm } from '@angular/forms';
import { ApiService } from 'src/services/api.service';
import { AppUtils } from 'src/utils/app.utils';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { StorageArvoreService } from '../../services/storage-arvore.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private loginData: Login = {};

  private configError: MatSnackBarConfig = {
    panelClass: ['style-error'],
    duration: 2000,
    verticalPosition: 'top',
  };

  onSubmit(f: NgForm) {
    if (f.valid) {
      console.log(f.value.username + ':' + f.value.password);
      var autorizacao = btoa(f.value.username + ':' + f.value.password);
      this.loginData.Autorizacao = autorizacao;
      this.api
        .postData('/entradaManual/login', this.loginData)
        .subscribe((data: Resposta) => {
          if (data.Status) {
            this.utils.saveStorage('Autorizacao', data.Dados);
            this.utils.usuarioLogado = this.utils.getStorage(
              'Autorizacao'
            ) as Autorizacao;
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
