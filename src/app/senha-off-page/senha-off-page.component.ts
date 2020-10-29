import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/services/api.service';
import { AppUtils } from 'src/utils/app.utils';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { StorageArvoreService } from 'src/services/storage-arvore.service';
import { Autorizacao, Resposta, Login } from '../login/login.interfaces';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-senha-off-page',
  templateUrl: './senha-off-page.component.html',
  styleUrls: ['./senha-off-page.component.scss'],
})
export class SenhaOffPageComponent implements OnInit {

  private loginData: Login = {};

  private configError: MatSnackBarConfig = {
    panelClass: ['style-error'],
    duration: 2000,
    verticalPosition: 'top',
  };

  goEntrada() {
    this.router.navigate(['/entrada-manual'])
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
  ) { }

  ngOnInit() {
    this.utils.usuarioLogado = null;
    this.utils.removeStorgare('Autorizacao');
  }
}
