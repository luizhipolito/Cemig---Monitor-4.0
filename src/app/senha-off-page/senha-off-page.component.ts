import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/services/api.service';
import { AppUtils } from 'src/utils/app.utils';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { StorageArvoreService } from 'src/services/storage-arvore.service';
// import { Autorizacao, Resposta, Login } from '../login/login.interfaces';
import { NgForm } from '@angular/forms';
import { ConfigService } from 'src/services/config.service';

@Component({
  selector: 'app-senha-off-page',
  templateUrl: './senha-off-page.component.html',
  styleUrls: ['./senha-off-page.component.scss'],
})
export class SenhaOffPageComponent implements OnInit {
  private configError: MatSnackBarConfig = {
    panelClass: ['style-error'],
    duration: 2000,
    verticalPosition: 'top',
  };

  onSubmit(f: NgForm) {
    let senhaOff = this.utils.getStorage('senhaOff');
    console.log(senhaOff);
    if (f.value.password === senhaOff) {
      this.storage.getAll();
      this.router.navigate(['/entrada-manual']);
    } else {
      this.showMessageBox('Senha incorreta');
    }
  }

  goEntrada() {
    this.router.navigate(['/entrada-manual']);
  }

  showMessageBox = (message: string) => {
    this.messageBox.open(message, null, this.configError);
  };

  constructor(
    private router: Router,
    private api: ApiService,
    public utils: AppUtils,
    private messageBox: MatSnackBar,
    public storage: StorageArvoreService,
    public config: ConfigService
  ) {}

  ngOnInit() {
    this.utils.usuarioLogado = null;
    this.utils.removeStorgare('Autorizacao');
  }
}
