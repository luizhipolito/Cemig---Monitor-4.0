import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/services/api.service';
import { StorageArvoreService } from 'src/services/storage-arvore.service';
import { getBodyBatchAttrUsinas } from '../logs-leitura/logs-leitura.component';
import { FormControl, Validators } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { getBeginDay, isNumber } from 'src/utils/app.utils';
import jsPDF from 'jspdf';
import { formatDate } from '@angular/common';

export class UsinaDateModel {

  constructor(usina: string, date: Date) {
    this.instruments = [];
    this.usina = usina;
    this.date = date;
    this.dateStr = formatDate(date, "dd/MM/yyyy", "en-US");
  }

  addInstrument(instrument: string) {
    this.instruments.push(instrument);
  }

  usina: string;
  date: Date;
  dateStr: string;
  instruments: Array<string>;
}

@Component({
  selector: 'app-export-read',
  templateUrl: './export-read.component.html',
  styleUrls: ['./export-read.component.scss'],
})
export class ExportReadComponent implements OnInit, OnDestroy {

  showProgressBar: boolean = false;
  usinas: Array<string> = [];
  startDateForm: FormControl = new FormControl(null, Validators.required);
  endDateForm: FormControl = new FormControl(null, Validators.required);
  usinasForm: FormControl = new FormControl();
  tableData:  Array<UsinaDateModel> = [];
  subs: Array<Subscription> = [];

  constructor(private storageService: StorageArvoreService,
              private navCtrl: NavController,
              private api: ApiService) { }

  ngOnInit() {
    this.loadUsinas();
  }

  async exportLeituras(){
    let startDate = getBeginDay(new Date(this.startDateForm.value));
    let endDate = getBeginDay(new Date(this.endDateForm.value));
    let usinasFilter = this.usinasForm.value as Array<string>;
    usinasFilter = usinasFilter ? usinasFilter : [];

    let instrumentos = await this.storageService.getByKey(
      this.storageService.navigation
    );

    let usinasDateInstruments:  Array<UsinaDateModel> = [];

    for(let instrumento of instrumentos) {
      let proximaLeitura: Date;
        let periodicidadeLeitura: number;

        instrumento.atributos?.list.forEach(attr => {
          if(attr.Name == 'Data da Próxima Leitura') {
            proximaLeitura = getBeginDay(new Date(attr.Value?.Value as any))
          }
          if(attr.Name == 'Periodicidade de Leitura') {
            periodicidadeLeitura = attr.Value?.Value as any;
          }
        });

        if(!proximaLeitura || !isNumber(periodicidadeLeitura) || (proximaLeitura as any == 'Invalid Date')) {
          continue;
        }

        const usinaInstrumento = instrumento['usina'];

        if(usinasFilter.length && !usinasFilter.some(u => u == usinaInstrumento)) {
          continue;
        }

        let dateToIncrement = new Date(proximaLeitura >= startDate ? proximaLeitura : this.getDatePeriodicidade(proximaLeitura, startDate, periodicidadeLeitura)); 

        while(dateToIncrement <= endDate) {

          let usinaFound = usinasDateInstruments.find(u => u.usina == usinaInstrumento && u.date.getTime() == dateToIncrement.getTime());

          if(!usinaFound) {
            usinaFound = new UsinaDateModel(usinaInstrumento, new Date(dateToIncrement));
            usinasDateInstruments.push(usinaFound);
          }

          usinaFound.addInstrument(instrumento['name']);

          dateToIncrement.setDate(dateToIncrement.getDate() + periodicidadeLeitura);
        }

    }

    let finalTableData:  Array<UsinaDateModel> = [];

    usinasDateInstruments.forEach(usina => {
      do {
        let instruments = usina.instruments.splice(0, 30);
        let page = new UsinaDateModel(usina.usina, usina.date);

        while (instruments.length < 30) {
          instruments.push("");
        }

        page.instruments = instruments;
        finalTableData.push(page);

      } while (usina.instruments.length);
    });

    this.tableData = finalTableData;

    setTimeout(async () => {
      let source = window.document.getElementById("div-tables");
      let doc = new jsPDF('p', 'pt', 'a4');
      await doc.html(source, {'width': 500});
      doc.save('leituras.pdf');
    }, 500);
  }

  getDatePeriodicidade(date: Date, stopDate: Date, increment: number){
    if(date >= stopDate) {
      return date;
    }

    let _date = new Date(date);
    _date.setDate(_date.getDate() + increment)

    return this.getDatePeriodicidade(_date, stopDate, increment);
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
