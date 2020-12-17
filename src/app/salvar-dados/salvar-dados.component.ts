import { Component, OnInit } from '@angular/core';
import { MenuController, NavController } from '@ionic/angular';
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


export class SalvarDadosComponent {
  confirm: boolean;
  constructor(
    private menu: MenuController,
    private navCtrl: NavController,
    private router: Router,
    public storageService: StorageArvoreService,
    public utils: AppUtils,
    private api: ApiService,
    public config: ConfigService
  ) { }



  onBack() {
    this.navCtrl.navigateBack('entrada-manual');
  }

  ngOnInit() { }

  dataToWriteOnPI: Array<Arvore> = [];
  dataRemoved: Array<Arvore> = [];

  async loadSaveValues() {
    let writtenValues = await this.storageService.getByKey(
      this.storageService.writtenValues
    );

    this.dataToWriteOnPI = writtenValues.map((m) => {
      return { isToSave: true, ...m };
    }) as Array<Arvore>;
  }

  async ionViewWillEnter() {
    this.confirm = true;
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

  async saveOnPI() {
    if (!this.confirm) {
      console.log('not confirmed');
    }
    let dataToWriteOnPI = this.dataToWriteOnPI.filter((f) => f['isToSave']);
    for (let data of dataToWriteOnPI) {
      let values = data.value;

      let batch = this.utils.createBatch(values, 'update', data.date);
      let batchResponse = await this.api
        .executeBatch(this.config.afServer, batch)
        .toPromise();
      console.log(batchResponse)
      let responses = Object.keys(batchResponse).map((k) => batchResponse[k]);
      let isUpdated = responses.every((r) => r.Status >= 200 && r.Status < 400);
      if (isUpdated) {
        this.dataToWriteOnPI = this.dataToWriteOnPI.filter(
          (f) => f.AplicacaoID != data.AplicacaoID
        );
      }
    }
    console.log(this.dataToWriteOnPI)
    await this.updateStorage(this.dataToWriteOnPI);
  }
  async updateStorage(dataToWriteOnPI: Arvore[]) {
    await this.storageService.store(
      this.storageService.writtenValues,
      dataToWriteOnPI
    );
  }

  async removeWritten() {
    if (!this.confirm) {
      console.log('selecionar confirmar')
    } else {
      let dataToWriteOnPI = this.dataToWriteOnPI.filter((f) => f['isToSave']);
      console.log(dataToWriteOnPI)
      for (let data of dataToWriteOnPI) {
        // this.dataRemoved = dataToWriteOnPI.filter(i =>);
        console.log(this.dataRemoved)
      }

    }

  }

}

