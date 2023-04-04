import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/services/api.service';
import { StorageArvoreService } from 'src/services/storage-arvore.service';
import { AppUtils } from 'src/utils/app.utils';
import { separator } from '../salvar-dados/salvar-dados.component';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { File } from '@ionic-native/file/ngx';
import { formatDate } from '@angular/common';

declare var cordova:any;

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

      const body = this.getBodyBatchAttrUsinas(this.url, this.databaseWebId);
      this.subs.push(
        this.api.post(`${this.url}/batch`, body).subscribe(data => {
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

    this.subs.push(this.api.post(`${this.url}/batch`, logsBody).subscribe(data => {
        this.showProgressBar = false;
        if(data) {
          const indexLog = (data.Atributos.Content.Items as Array<any>).findIndex(i => i.Name == 'Log');
          const logs = this.createLogArrayObj(data.RecordedValues.Content.Items[indexLog].Content.Items.map(log => log.Value));
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

          const now = new Date();

          cordova.plugins.pdf.htmlToPDF({
            data: this.buildHtml(now, this.startDateForm.value, this.endDateForm.value, usina, operador, logsFilter),
            documentSize: "A4",
            landscape: "landscape",
            type: "base64"
          },
          (data) => {
              
              let fileDir = this.file.externalApplicationStorageDirectory;
              let filename = "LogsLeitura.pdf";
              this.file.writeFile(fileDir, filename, this.b64toBlob(data, 'application/pdf'), { replace: true });
              this.socialSharing.share(null, `Logs de Leituras CEMIG ${formatDate(now, 'dd/MM/yyyy', 'en-US')}`, `${fileDir}${filename}`);
            },
            () => {
              alert('Erro ao gerar arquivo');
              this.showProgressBar = false;
            }
          );
        }
      })
    );
  }

  buildHtml(now: Date, startDate: Date, endDate: Date, usina: string, operador: string, logs: Array<Log>): string {

    let rowData = logs.map(log =>
      `<tr>
        <td>${formatDate(log.dateInput, "dd/MM/yyyy HH:mm:ss", 'en-US')}</td>
        <td>${formatDate(log.dateSync, "dd/MM/yyyy HH:mm:ss", 'en-US')}</td>
        <td>${log.path}</td>
        <td>${log.usina}</td>
        <td>${log.instrumento}</td>
        <td>${log.atributo}</td>
        <td>${formatDate(log.dateRead, "dd/MM/yyyy", 'en-US')}</td>
        <td>${log.value}</td>
        <td>${log.operador}</td>
      </tr>`).join("");

    return this.htmlPDF
      .replace("#EXPORT_DATE#", formatDate(now, "dd/MM/yyyy", "en-US"))
      .replace("#BEGIN_DATE#", startDate ? formatDate(startDate, "dd/MM/yyyy", "en-US") : "")
      .replace("#END_DATE#", endDate ? formatDate(endDate, "dd/MM/yyyy", "en-US") : "")
      .replace("#USINA#", usina ? usina : "")
      .replace("#OPERADOR#", operador ? operador : "")
      .replace("#ROW_DATA#", rowData);
  }

  createLogArrayObj(logs: Array<string>): Array<Log> {

    let logsObjs: Array<Log> = [];

    logs.forEach(log => {
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

  getBodyBatchAttrUsinas(url: string, databaseWebId: string){
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

  getBodyBatchLogs(){
    return {
      "Atributos": {
          "Method": "GET",
          "Resource": `${this.urlUsinaElement}/attributes?selectedFields=Items.Links.RecordedData;Items.Name`
      },
      "RecordedValues": {
          "Method": "GET",
          "RequestTemplate": {
              "Resource": "{0}?selectedFields=Items.Value&maxCount=150000"
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

  b64toBlob(b64Data, contentType='', sliceSize=512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
  
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
  
    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
  }

  ngOnDestroy() {
      this.subs.forEach(s => s.unsubscribe());
  }

  htmlPDF = `<html>
              <head>
                <style>
                  table {
                    font-family: arial, sans-serif;
                    border-collapse: collapse;
                    width: 100%;
                  }
                  td,
                  th {
                    border: 1px solid #a4a4a4;
                    text-align: left;
                    padding: 8px;
                  }
                  tr:nth-child(even) {
                    background-color: #dddddd;
                  }
                  .filter-cls {
                    padding-left: 4px;
                    font-weight: normal;
                  }
                  .flex {
                    display: flex;
                  }
                </style>
              </head>
              <body>
                <h1>Logs de Leituras #EXPORT_DATE#</h1>
                <h2 class="flex">
                  Data Início:
                  <div class="filter-cls">#BEGIN_DATE#</div>
                </h2>
                <h2 class="flex">
                  Data Fim:
                  <div class="filter-cls">#END_DATE#</div>
                </h2>
                <h2 class="flex">
                  Usina:
                  <div class="filter-cls">#USINA#</div>
                </h2>
                <h2 class="flex">
                  Operador:
                  <div class="filter-cls">#OPERADOR#</div>
                </h2>
                <table>
                  <tr>
                    <th>Data/Hora Entrada</th>
                    <th>Data/Hora Sincronismo</th>
                    <th>Caminho</th>
                    <th>Usina</th>
                    <th>Instrumento</th>
                    <th>Atributo</th>
                    <th>Data leitura</th>
                    <th>Valor lido</th>
                    <th>Operador</th>
                  </tr>
                  #ROW_DATA#
                </table>
              </body>
            </html>`;
}
