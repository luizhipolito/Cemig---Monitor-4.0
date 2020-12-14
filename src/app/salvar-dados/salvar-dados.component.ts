import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Router } from '@angular/router';
import { StorageArvoreService } from 'src/services/storage-arvore.service';

@Component({
  selector: 'app-salvar-dados',
  templateUrl: './salvar-dados.component.html',
  styleUrls: ['./salvar-dados.component.scss'],
})
export class SalvarDadosComponent implements OnInit {
  constructor(
    private menu: MenuController,
    private router: Router,
    public storageService: StorageArvoreService
  ) {}

  ngOnInit() {}

  dataToWriteOnPI = [];

  async ionViewWillEnter() {
    this.dataToWriteOnPI = await this.storageService.getByKey(
      this.storageService.writtenValues
    );
    console.log(this.dataToWriteOnPI);
  }

  openMenu() {
    this.menu.open();
  }

  logoutUsuario = () => {
    this.menu.close();
    this.router.navigate(['/']);
  };
  onSairClick = (ev) => {
    this.logoutUsuario();
  };
}
