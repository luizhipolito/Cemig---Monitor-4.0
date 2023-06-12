import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { StorageArvoreService } from 'src/services/storage-arvore.service';
import { AppUtils } from 'src/utils/app.utils';
import { EntradaManualComponent } from '../entrada-manual/entrada-manual.component';
import { ConfigService } from 'src/services/config.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent {
  appMenuSwipeGesture: boolean;
  nameMenu: string;


  constructor(
    private router: Router,
    private menu: MenuController,
    public storageService: StorageArvoreService,
    public utils: AppUtils,
    public entradaManual: EntradaManualComponent,
    public config: ConfigService
  ) { }

  ionViewWillEnter() {
    this.nameMenu = this.config.NomeAppMenu;
    console.log(this.nameMenu)
    this.menu.close();
    this.config.init();
  }



  goSalvarDados() {
    this.menu.close();
    this.router.navigate(['/salvar-dados']);
  }

  goPageLogs() {
    this.menu.close();
    this.router.navigate(['/page-logs']);
  }

  openMenu() {
    this.menu.open();
  }

  goLogsLeitura(){
    this.menu.close();
    this.router.navigate(['/logs-leitura']);
  }

  logoutUsuario = () => {
    this.storageService.removeEdit();
    this.utils.removeStorgare('Authorization');
    this.utils.removeStorgare('user');
    this.menu.close();
    this.router.navigate(['/']);
  };
  onSairClick = (ev) => {
    this.logoutUsuario();

  };

  ngOnInit() {
  }
}
