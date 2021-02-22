import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { StorageArvoreService, Arvore } from 'src/services/storage-arvore.service';
import { NgForm } from '@angular/forms';
import { ConfigService } from 'src/services/config.service';
import { AlertController } from '@ionic/angular';
import { AppUtils } from 'src/utils/app.utils';
import { Device } from '@ionic-native/device/ngx';

@Component({
  selector: 'app-senha-off-page',
  templateUrl: './senha-off-page.component.html',
  styleUrls: ['./senha-off-page.component.scss'],
})
export class SenhaOffPageComponent {
  private configError: MatSnackBarConfig = {
    panelClass: ['style-error'],
    duration: 2000,
    verticalPosition: 'top',
  };

  constructor(
    private router: Router,
    private messageBox: MatSnackBar,
    public storage: StorageArvoreService,
    public configService: ConfigService,
    public alertController: AlertController,
    public utils: AppUtils,
    public device: Device,
  ) { }


  isActiveToggleTextPassword: Boolean = true;

  public toggleTextPassword(): void {
    this.isActiveToggleTextPassword = (this.isActiveToggleTextPassword == true) ? false : true;
  }
  public getType() {
    return this.isActiveToggleTextPassword ? 'password' : 'text';
  }

  async ionViewWillEnter() {
    await this.configService.init();
    this.user = this.utils.getStorage('user');
  }

  public user;
  currentDate = this.utils.formatDateTimeHours(new Date());

  async onSubmit(f: NgForm) {
    let senhaOff = this.configService.SenhaOff;
    if (f.value.password === senhaOff) {
      this.configService.isToLoadFromPI = false;

      let treeUserOff = new Arvore();
      treeUserOff.user = this.user;
      treeUserOff.date = this.currentDate;
      treeUserOff.deviceModel = this.device.model;
      treeUserOff.deviceId = this.device.uuid;
      treeUserOff.device = this.device.manufacturer;
      treeUserOff.isToSave = true;
      treeUserOff.AplicacaoID = this.utils.getRandom().toLocaleString();

      await this.storage.insertOrUpdate(
        this.storage.writtenLogs,
        treeUserOff
      )
      this.router.navigate(['/entrada-manual']);
    } else {
      // this.showMessageBox('Senha incorreta');
      this.showAlert('Senha Incorreta!')
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

  goEntrada() {
    this.router.navigate(['/entrada-manual']);
  }

  showMessageBox = (message: string) => {
    this.messageBox.open(message, null, this.configError);
  };
}
