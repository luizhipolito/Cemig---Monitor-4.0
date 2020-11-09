import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-data-config',
  templateUrl: './data-config.component.html',
  styleUrls: ['./data-config.component.scss'],
})
export class DataConfigComponent implements OnInit {
  constructor(private router: Router) {}

  backHome() {
    this.router.navigate(['/home']);
  }

  ngOnInit() {}
}
