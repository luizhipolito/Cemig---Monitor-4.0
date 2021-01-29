import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { StorageArvoreService } from 'src/services/storage-arvore.service';
import { AppUtils } from 'src/utils/app.utils';
import { EntradaManualComponent } from '../entrada-manual/entrada-manual.component';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent {
  appMenuSwipeGesture: boolean;
  nameMenu: string;


  constructor(private router: Router, private menu: MenuController, public storageService: StorageArvoreService, public utils: AppUtils, public entradaManual: EntradaManualComponent) { }
  ionViewWillEnter() {
    this.menu.close();
  }


  goSalvarDados() {
    this.menu.close();
    this.router.navigate(['/salvar-dados']);
  }

  async returnHome() {
    this.entradaManual.elements = null;
    this.entradaManual.date = null;
    this.entradaManual.selectedDate = null;
    await this.entradaManual.loadNavigationDataFromStorage();
    this.router.navigate(['/entrada-manual'])
    this.menu.close();
  }

  openMenu() {
    this.menu.open();
  }

  logoutUsuario = () => {
    this.storageService.removeEdit();
    this.menu.close();
    this.router.navigate(['/']);

  };
  onSairClick = (ev) => {
    this.logoutUsuario();

  };

  ngOnInit() { }
}
