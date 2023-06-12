import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/services/api.service';
import { StorageArvoreService } from 'src/services/storage-arvore.service';
import { getBodyBatchAttrUsinas } from '../logs-leitura/logs-leitura.component';
import { FormControl } from '@angular/forms';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-export-read',
  templateUrl: './export-read.component.html',
  styleUrls: ['./export-read.component.scss'],
})
export class ExportReadComponent implements OnInit, OnDestroy {

  showProgressBar: boolean = false;
  usinas: Array<string> = [];
  endDateForm: FormControl = new FormControl();
  startDateForm: FormControl = new FormControl();
  usinasForm: FormControl = new FormControl();
  subs: Array<Subscription> = [];

  constructor(private storageService: StorageArvoreService,
              private navCtrl: NavController,
              private api: ApiService) { }

  ngOnInit() {
    this.loadUsinas();
  }

  exportLeituras(){
    console.log(this.startDateForm.value);
    console.log(this.endDateForm.value);
    console.log(this.usinasForm.value);
  }

  loadUsinas(){
    this.showProgressBar = true;
    let promises = [];

    promises.push(this.storageService.getConfig(
      this.storageService.configValues
    ));
    promises.push(this.storageService.getConfig(
      this.storageService.databaseWebId
    ));

    Promise.all(promises).then(results => {
      let config = results[0] as Array<any>;

      const url = config.find(c => c.Nome == 'configUrl').configValue;
      const databaseWebId = results[1];

      const body = getBodyBatchAttrUsinas(url, databaseWebId);
      this.subs.push(
        this.api.post(`${url}/batch`, body).subscribe(data => {
          this.showProgressBar = false;
          this.usinas = data.Elementos.Content.Items[0].Content.Items.map(usina => usina.Name);
        })
      );
    });
  }

  onBack() {
    this.navCtrl.navigateBack('entrada-manual');
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

}
