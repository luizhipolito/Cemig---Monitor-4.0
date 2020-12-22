import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { StorageArvoreService } from 'src/services/storage-arvore.service';
import { NgForm } from '@angular/forms';
import { ConfigService } from 'src/services/config.service';
import { AlertController } from '@ionic/angular';

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
    public alertController: AlertController
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
  }

  onSubmit(f: NgForm) {
    let senhaOff = this.configService.SenhaOff;
    if (f.value.password === senhaOff) {
      this.configService.isToLoadFromPI = false;
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
