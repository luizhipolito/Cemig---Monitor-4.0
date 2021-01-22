import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Login, Resposta, Autorizacao } from './login.interfaces';
import { NgForm } from '@angular/forms';
import { ApiService } from 'src/services/api.service';
import { AppUtils } from 'src/utils/app.utils';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import {
  StorageArvoreService,
} from '../../services/storage-arvore.service';

import { ConfigService } from 'src/services/config.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {


  constructor(
    private router: Router,
    private api: ApiService,
    public utils: AppUtils,
    private messageBox: MatSnackBar,
    public storage: StorageArvoreService,
    public configService: ConfigService,
    public config: ConfigService,
    public alertController: AlertController
  ) { }

  public user;
  public pass;

  async ionViewWillEnter() {
    this.utils.removeStorgare('Autorizacao');
    this.user = this.utils.getStorage('user');
    this.pass = this.utils.getStorage('password');
  }

  isActiveToggleTextPassword: Boolean = true;
  public toggleTextPassword(): void {
    this.isActiveToggleTextPassword = (this.isActiveToggleTextPassword == true) ? false : true;
  }
  public getType() {
    return this.isActiveToggleTextPassword ? 'password' : 'text';
  }

  onSubmit(f: NgForm) {
    this.utils.saveStorage('user', f.value.username)
    this.utils.saveStorage('password', f.value.password)

    if (f.valid) {
      let AuthorizationToken = btoa(f.value.username + ':' + f.value.password);
      this.api.setAuth(AuthorizationToken);

      if (!this.configService.configUrl) {
        this.config.configUrl = 'https://34.233.235.92/piwebapi';
        this.config.configPath = '\\\\EC2AMAZ-T1N5EJ5\\Testes\\APP Entrada Manual';
        this.config.saveStorage();
      }

      this.api
        .get(this.configService.getHomeUrl())
        .subscribe((data: Resposta) => {
          if (data) {
            this.utils.saveStorage('Authorization', AuthorizationToken);
            this.storage.removeAll();
            this.configService.isToLoadFromPI = true;
            this.router.navigate(['/entrada-manual']);
          } else {
            // this.showMessageBox(data.Mensagem);
            console.log('Mensagem')
            this.showAlert(data.Mensagem)
          }
        });
    } else {
      // this.showMessageBox('Informe seu usuário e senha para continuar!');
      this.showAlert('Informe usuário e senha para continuar!')
    }
  }

  async showAlert(message: string) {
    await this.alertController
      .create({
        message,
        buttons: ['OK'],
      })
      .then((res) => {
        res.present();
      });
  }

  iconBack() {
    this.router.navigate(['home']);
  }
}
