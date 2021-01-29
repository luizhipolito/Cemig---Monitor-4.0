import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppUtils } from 'src/utils/app.utils';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  goSincronizar() {
    this.router.navigate(['/login']);
  }

  goEntrar() {
    this.router.navigate(['/senha-off-page']);
  }

  goSettings() {
    this.router.navigate(['/data-config']);
  }
  constructor(private router: Router, public utils: AppUtils) { }

  ngOnInit(): void { }
}
