import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Router } from '@angular/router';
import {
  Arvore,
  StorageArvoreService,
} from 'src/services/storage-arvore.service';
import { AppUtils } from 'src/utils/app.utils';
import { ApiService } from 'src/services/api.service';
import { ConfigService } from 'src/services/config.service';

@Component({
  selector: 'app-salvar-dados',
  templateUrl: './salvar-dados.component.html',
  styleUrls: ['./salvar-dados.component.scss'],
})
export class SalvarDadosComponent implements OnInit {
  constructor(
    private menu: MenuController,
    private router: Router,
    public storageService: StorageArvoreService,
    public utils: AppUtils,
    private api: ApiService,
    public config: ConfigService
  ) {}

  ngOnInit() {}

  dataToWriteOnPI: Array<Arvore> = [];

  async loadSaveValues() {
    let writtenValues = await this.storageService.getByKey(
      this.storageService.writtenValues
    );

    this.dataToWriteOnPI = writtenValues.map((m) => {
      return { isToSave: true, ...m };
    }) as Array<Arvore>;
  }

  async ionViewWillEnter() {
    await this.config.init();
    await this.api.init();

    await this.loadSaveValues();
  }
  getRelativePath(path: string) {
    if (path.startsWith('\\')) {
      path = path.slice(1);
    }
    path = path.split('\\').join('➤');
    return path;
  }

  openMenu() {
    this.menu.open();
  }

  onBack() {
    this.router.navigate(['/entrada-manual']);
  }

  logoutUsuario = () => {
    this.menu.close();
    this.router.navigate(['/']);
  };
  onSairClick = (ev) => {
    this.logoutUsuario();
  };

  async saveOnPI() {
    let dataToWriteOnPI = this.dataToWriteOnPI.filter((f) => f['isToSave']);

    for (let data of dataToWriteOnPI) {
      let values = data.value;
      let batch = this.utils.createBatch(values, 'update', data.date);
      let batchResponse = await this.api
        .executeBatch(this.config.afServer, batch)
        .toPromise();
      console.log(batchResponse);
    }

    await this.loadSaveValues();
  }
}
