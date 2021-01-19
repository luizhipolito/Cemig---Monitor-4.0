import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { StorageArvoreService } from 'src/services/storage-arvore.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit {
  appMenuSwipeGesture: boolean;

  constructor(private router: Router, private menu: MenuController, public storageService: StorageArvoreService) { }
  ionViewWillEnter() {
    this.menu.close();
  }
  goSalvarDados() {
    this.menu.close();
    this.router.navigate(['/salvar-dados']);
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
