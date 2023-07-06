import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { StorageArvoreService } from 'src/services/storage-arvore.service';
import { AppUtils } from 'src/utils/app.utils';
import { EntradaManualComponent } from '../entrada-manual/entrada-manual.component';
import { ConfigService } from 'src/services/config.service';
import { Subscription } from 'rxjs';
import { EntradaManualStateService } from '../entrada-manual/state/entrada-manual-state.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit, OnDestroy {
  appMenuSwipeGesture: boolean;
  nameMenu: string;
  isAdmin: boolean = false;
  subs: Array<Subscription> = [];

  constructor(
    private router: Router,
    private menu: MenuController,
    public storageService: StorageArvoreService,
    public utils: AppUtils,
    public entradaManual: EntradaManualComponent,
    private entradaManualState: EntradaManualStateService,
    public config: ConfigService
  ) { }

  checkAdmin(){
    this.subs.push(
      this.config.isAdmin$.subscribe(data => {
        this.isAdmin = data;
      })
    );
  }

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

  goInicio(){
    this.menu.close();

    if(this.isAdmin) {
      this.entradaManualState.resetEntradaManual();
      this.router.navigate(['/read-export-prompt']);
    }
    else {
      this.router.navigate(['/entrada-manual']);
    }
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
    this.checkAdmin();
  }

  ngOnDestroy(){
    this.subs.forEach(s => s.unsubscribe());
  }
}
