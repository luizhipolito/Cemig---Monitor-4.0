import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppUtils } from 'src/utils/app.utils';
import { ConfigService } from 'src/services/config.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  ionViewWillEnter() {
    this.config.init();
    this.nameHome = this.config.NomeAppInicio;
  }

  goSincronizar() {
    this.router.navigate(['/login']);
  }

  goEntrar() {
    this.router.navigate(['/senha-off-page']);
  }

  goSettings() {
    this.router.navigate(['/data-config']);
  }

  nameHome: any;
  getName() {

    console.log(this.nameHome)
  }

  constructor(private router: Router, public utils: AppUtils, public config: ConfigService) { }

  ngOnInit(): void {
  }
}
