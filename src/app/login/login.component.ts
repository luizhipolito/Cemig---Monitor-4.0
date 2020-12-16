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
  dataEnumeration,
} from '../entrada-manual/entrada-manual.interfaces';
import { ConfigService } from 'src/services/config.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private configError: MatSnackBarConfig = {
    panelClass: ['style-error'],
    duration: 2000,
    verticalPosition: 'top',
  };

  constructor(
    private router: Router,
    private api: ApiService,
    public utils: AppUtils,
    private messageBox: MatSnackBar,
    public storage: StorageArvoreService,
    public configService: ConfigService
  ) {}

  async ionViewWillEnter() {
    this.utils.removeStorgare('Autorizacao');
  }

  onSubmit(f: NgForm) {
    if (f.valid) {
      let AuthorizationToken = btoa(f.value.username + ':' + f.value.password);
      this.api.setAuth(AuthorizationToken);
      this.api
        .get(this.configService.getHomeUrl())
        .subscribe((data: Resposta) => {
          if (data) {
            this.utils.saveStorage('Authorization', AuthorizationToken);
            this.storage.removeAll();
            this.configService.isToLoadFromPI = true;
            this.router.navigate(['/entrada-manual']);
          } else {
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

  iconBack() {
    this.router.navigate(['home']);
  }
}
