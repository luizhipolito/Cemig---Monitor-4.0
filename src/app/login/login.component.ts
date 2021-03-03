import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Login, Resposta, Autorizacao } from './login.interfaces';
import { NgForm } from '@angular/forms';
import { ApiService } from 'src/services/api.service';
import { AppUtils, firstOrNull } from 'src/utils/app.utils';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import {
  StorageArvoreService, Arvore,
} from '../../services/storage-arvore.service';

import { ConfigService } from 'src/services/config.service';
import { AlertController, LoadingController } from '@ionic/angular';
import { Device } from '@ionic-native/device/ngx';

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
    public storageService: StorageArvoreService,
    public configService: ConfigService,
    public config: ConfigService,
    public alertController: AlertController,
    public device: Device,
    public loadingController: LoadingController,
  ) { }

  dataWrittenListToRemove: any;

  public user;
  public pass;
  currentDate = this.utils.formatDateTimeHours(new Date());
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

  AuthorizationToken: string;
  async onSubmit(f: NgForm) {
    const loading = await this.loadingController.create({
      message: 'Aguarde...',
    });

    await loading.present()

    this.utils.saveStorage('user', f.value.username);
    this.utils.saveStorage('password', f.value.password);
    if (f.valid) {
      this.AuthorizationToken = btoa(f.value.username + ':' + f.value.password);
      this.api.setAuth(this.AuthorizationToken);
      if (!this.configService.configUrl) {
        this.config.configUrl = 'https://pwnpo-bhepiapp1/piwebapi';
        // this.config.configUrl = 'https://34.233.235.92/piwebapi';
        this.config.configPath = '\\\\10.30.48.171\\Instrumentação de barragens - MG/SB\\CEMIG - Gerência de Segurança de Barragens e Manutenção Civil\\Usinas\\APP_Entrada_Manual';
        // this.config.configPath = '\\\\EC2AMAZ-T1N5EJ5\\Testes\\APP Entrada Manual';
        this.config.saveStorage();
      }
      let date = new Date(this.currentDate);

      let treeUser = new Arvore();
      treeUser.user = this.user;
      treeUser.date = this.currentDate;
      treeUser.deviceModel = this.device.model;
      treeUser.deviceId = this.device.uuid;
      treeUser.device = this.device.manufacturer;
      treeUser.deviceVersion = this.device.version;
      treeUser.devicePlatform = this.device.platform;
      treeUser.isSystem = true;
      treeUser.AplicacaoID = this.utils.getRandom().toLocaleString();
      await this.storageService.insertOrUpdate(
        this.storageService.writtenLogs,
        treeUser
      );

      let writtenValues = await this.storageService.getByKey(
        this.storageService.writtenValues
      );
      if (writtenValues) {
        if (writtenValues.length == 0) {
          this.storageService.removeWrittenList();
        }
      }

      let hasDataToSend = await this.storageService.getByKey('writtenValues');
      if (hasDataToSend) {
        if (hasDataToSend.length > 0) {
          loading.dismiss();
          this.showConfirm('Existem Leituras pendentes para envio!<br> Deseja enviar agora?');
          return;
        }
      }


      this.api
        .get(this.configService.getHomeUrl())
        .subscribe((data: Resposta) => {
          if (data) {
            this.utils.saveStorage('Authorization', this.AuthorizationToken);
            this.storageService.removeAll();
            this.configService.isToLoadFromPI = true;
            loading.dismiss();
            this.router.navigate(['/entrada-manual']);
          } else {
            // this.showMessageBox(data.Mensagem);
            console.log('Mensagem')
            this.showAlert(data.Mensagem)
          }
        });
    } else {
      this.showAlert('Informe usuário e senha para continuar!')
    }
    loading.dismiss();
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

  async showConfirm(message: string) {
    let choice = false;
    let alert = await this.alertController.create({
      header: 'Confirmar',
      message,
      buttons: [
        {
          text: 'Não',
          handler: () => {
            this.api
              .get(this.configService.getHomeUrl())
              .subscribe((data: Resposta) => {
                if (data) {
                  this.utils.saveStorage('Authorization', this.AuthorizationToken);
                  this.storageService.removeAll();
                  this.configService.isToLoadFromPI = true;
                  this.router.navigate(['/entrada-manual']);
                } else {
                  // this.showMessageBox(data.Mensagem);
                  console.log('Mensagem')
                  this.showAlert(data.Mensagem)
                }
              });

            alert.dismiss(false);

            return false;
          },
        },
        {
          text: 'Sim',
          handler: () => {
            alert.dismiss(true);
            this.api
              .get(this.configService.getHomeUrl())
              .subscribe((data: Resposta) => {
                if (data) {
                  this.utils.saveStorage('Authorization', this.AuthorizationToken);
                  this.router.navigate(['salvar-dados']);
                }
              });
            return true;
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss().then((data) => {
      choice = data.data as boolean;
    });
    return choice;
  }
}
