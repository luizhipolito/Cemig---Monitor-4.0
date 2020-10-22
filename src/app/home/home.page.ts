import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  goSincronizar() {
    this.router.navigate(['/login']);
  }
  constructor(private router: Router) {}

  ngOnInit(): void {}
}
