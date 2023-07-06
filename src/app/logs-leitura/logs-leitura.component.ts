import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/services/api.service';
import { StorageArvoreService } from 'src/services/storage-arvore.service';
import { AppUtils } from 'src/utils/app.utils';
import { separator } from '../salvar-dados/salvar-dados.component';
import jsPDF from 'jspdf';
import { formatDate } from '@angular/common';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { File } from '@ionic-native/file/ngx';

class Log {
  dateSync: Date;
  dateInput: Date;
  dateRead: Date;
  operador: string;
  path: string;
  value: string;
  instrumento: string;
  atributo: string;
  usina: string;
}

@Component({
  selector: 'app-logs-leitura',
  templateUrl: './logs-leitura.component.html',
  styleUrls: ['./logs-leitura.component.scss'],
})
export class LogsLeituraComponent implements OnInit, OnDestroy {

  showProgressBar: boolean = false;
  subs: Array<Subscription> = [];
  usinas: Array<string> = [];
  url: string;
  urlUsinaElement: string;
  databaseWebId: string;

  startDateForm = new FormControl();
  endDateForm = new FormControl();
  usinaForm = new FormControl();
  operadorForm = new FormControl();
  usina: string;
  operador: string;
  now: Date;
  logs: Array<Log>;

  constructor(private api: ApiService,
              private storageService: StorageArvoreService,
              private alertController: AlertController,
              private navCtrl: NavController,
              private utils: AppUtils,
              private file: File,
              private socialSharing: SocialSharing,
              private router: Router) { }

  async ngOnInit() {
    this.checkTokenOk().then(value => {
      if(value) {
        this.loadUsinas();
      }
    })
  }


  checkTokenOk(): Promise<boolean>{
    return new Promise(resolve => {
      let token = this.utils.getStorage('Authorization');
      if (token == null) {
        this.showConfirmToken().then(result => {
          if(!result) {
            this.onBack();
            resolve(false);
          } else {
            this.router.navigate(['/login'])
            resolve(false);
          }
        });
      } else {
        resolve(true);
      }
    });
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

      this.url = config.find(c => c.Nome == 'configUrl').configValue;
      this.databaseWebId = results[1];

      const body = getBodyBatchAttrUsinas(this.url, this.databaseWebId);
      this.subs.push(
        this.api.post(`${this.url}/batch`, body, false).subscribe(data => {
          this.showProgressBar = false;
          this.usinas = data.Elementos.Content.Items[0].Content.Items.map(usina => usina.Name);
          this.urlUsinaElement = data.Elemento.Content.Items[0].Links.Self;
        })
      );
    });
  }

  cleanFilters(){
    this.startDateForm.setValue(null);
    this.endDateForm.setValue(null);
    this.usinaForm.setValue(null);
    this.operadorForm.setValue(null);
  }

  searchlogs(){
    this.showProgressBar = true;
    let startDate = this.startDateForm.value ? this.getBeginDay(this.startDateForm.value) : null;
    let endDate = this.endDateForm.value ? this.getEndDay(this.endDateForm.value) : null;
    let usina = this.usinaForm.value ? this.usinaForm.value.trim() : null;
    let operador = this.operadorForm.value ? this.operadorForm.value.trim().toLowerCase() : null;

    const logsBody = this.getBodyBatchLogs();

    this.subs.push(this.api.post(`${this.url}/batch`, logsBody, false).subscribe(data => {
        this.showProgressBar = false;
        if(data) {
          const indexLog = (data.Atributos.Content.Items as Array<any>).findIndex(i => i.Name == 'Log');
          const logs = this.createLogArrayObj(data.RecordedValues.Content.Items[indexLog].Content.Items.filter(log => log.Good).map(log => log.Value));
          const logsFilter: Array<Log> = [];

          logs.forEach(log => {

            let startDateMatch = startDate ? log.dateRead >= startDate : true;
            let endDateMatch = endDate ? log.dateRead < endDate : true;
            let usinaMatch = usina ? log.usina == usina : true;
            let operadorMatch = operador ? log.operador.includes(operador) : true;


            if(startDateMatch && endDateMatch && usinaMatch && operadorMatch) {
              logsFilter.push(log);
            }
          });

          this.now = new Date();
          this.usina = usina;
          this.operador = operador;
          this.logs = logsFilter;

          setTimeout(async () => {
            let source = window.document.getElementById("div-table-logs");
            let doc = new jsPDF('p', 'pt', 'a4');
            await doc.html(source, {'width': 500});

            if(window.hasOwnProperty("cordova")){
              var blob = doc.output('blob');
              let fileDir = this.file.externalApplicationStorageDirectory;
              let filename = "LogsLeitura.pdf";
              this.file.writeFile(fileDir, filename, blob, { replace: true });
              this.socialSharing.share(null, `Logs de Leituras CEMIG ${formatDate(new Date(), 'dd/MM/yyyy', 'en-US')}`, `${fileDir}${filename}`);
            }
            else {
              doc.save('logs_leituras.pdf');
            }

          }, 500);
        }
      })
    );
  }

  createLogArrayObj(logs: Array<string>): Array<Log> {

    let logsObjs: Array<Log> = [];

    logs.forEach(log => {
      if(log) {
        let objLog = new Log();
        let items = log.split(separator);

        objLog.dateInput = new Date(items[0]);
        objLog.dateSync = new Date(items[1]);
        objLog.path = items[2];
        objLog.usina = items[3].trim();
        objLog.instrumento = items[4];
        objLog.atributo = items[5];
        objLog.dateRead = this.getDateRead(items[6]);
        objLog.value = items[7];
        objLog.operador = items[8].toLowerCase();

        logsObjs.push(objLog);
      }
    })

    return logsObjs;
  }

  getDateRead(dateStr: string): Date {
    let items = dateStr.split("/").map(i => Number.parseInt(i));

    let date = new Date();
    date.setDate(1);
    date = this.getBeginDay(date);

    date.setFullYear(items[2]);
    date.setMonth(items[1] - 1);
    date.setDate(items[0]);
    
    return date;
  }

  getBeginDay(date: Date): Date{
    let _date = new Date(date);
    _date.setMilliseconds(0);
    _date.setSeconds(0);
    _date.setMinutes(0);
    _date.setHours(0);
    return _date;
  }

  getEndDay(date: Date): Date {
    let _date = new Date(date);
    _date = this.getBeginDay(_date);
    _date.setDate(_date.getDate() + 1);
    return _date;
  }

  onBack() {
    this.navCtrl.navigateBack('entrada-manual');
  }

  getBodyBatchLogs(){
    return {
      "Atributos": {
          "Method": "GET",
          "Resource": `${this.urlUsinaElement}/attributes?selectedFields=Items.Links.RecordedData;Items.Name`
      },
      "RecordedValues": {
          "Method": "GET",
          "RequestTemplate": {
              "Resource": "{0}?selectedFields=Items.Value;Items.Good&startTime=-10y&endTime=*&maxCount=150000"
          },
          "Parameters": [
              "$.Atributos.Content.Items[*].Links.RecordedData"
          ],
          "ParentIds": [
              "Atributos"
          ]
      }
    };
  }

  async showConfirmToken() {
    let choice = false;
    let alert = await this.alertController.create({
      header: 'Confirmar',
      message:
        'Precisa logar para acessar os logs de leituras!<br> Deseja ir para tela de Login?',
      buttons: [
        {
          text: 'Não',
          handler: () => {
            alert.dismiss(false);
            return false;
          },
        },
        {
          text: 'Sim',
          handler: () => {
            alert.dismiss(true);
            return true;
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss().then((data) => {
      choice = data.data as boolean;
    });
    return choice;
  }

  ngOnDestroy() {
      this.subs.forEach(s => s.unsubscribe());
  }
  
}

export function getBodyBatchAttrUsinas(url: string, databaseWebId: string){
  return {
    "Elemento": {
        "Method": "GET",
        "Resource": `${url}/elements/search?databaseWebId=${databaseWebId}&query=Name:=Usinas&selectedFields=Items.Links.Elements;Items.Links.Self`
    },
    "Elementos": {
      "Method": "GET",
      "RequestTemplate": {
           "Resource": "{0}?selectedFields=Items.Name"
       },
      "Parameters": [
          "$.Elemento.Content.Items[0].Links.Elements"
      ],
      "ParentIds": [
          "Elemento"
      ]
    }
  };
}