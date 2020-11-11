import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { StorageArvoreService } from 'src/services/storage-arvore.service';

@Component({
  selector: 'app-data-config',
  templateUrl: './data-config.component.html',
  styleUrls: ['./data-config.component.scss'],
})
export class DataConfigComponent implements OnInit {
  constructor(
    private router: Router,
    private storageService: StorageArvoreService
  ) {}

  backHome() {
    this.router.navigate(['/home']);
  }

  onSubmit(f: NgForm) {
    if (f.valid) {
      console.log(f.value.server);
      this.storageService.saveConfig('baseUrl', f.value.server);
      this.router.navigate(['/home']);
    }
  }
  ngOnInit() {}
}
