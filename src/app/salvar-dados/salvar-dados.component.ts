import { Component, OnInit, Attribute, Input, } from '@angular/core';
import { MenuController, NavController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import {
  Arvore,
  StorageArvoreService,
} from 'src/services/storage-arvore.service';
import { AppUtils, createBatch, firstOrNull } from 'src/utils/app.utils';
import { ApiService } from 'src/services/api.service';
import { ConfigService } from 'src/services/config.service';
import { EntradaManualComponent } from '../entrada-manual/entrada-manual.component';
import { PIWebObject } from 'src/model/PIWebObject.model';
import { formatDate } from '@angular/common';

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
    public config: ConfigService,
    public alertController: AlertController,
  ) { }

  onBack() {
    this.storageService.removeEdit()
    this.navCtrl.navigateBack('entrada-manual');
  }

  ngOnInit() { }

  dataToWriteOnPI: Array<Arvore> = [];

  async loadSaveValues() {
    let writtenValues = await this.storageService.getByKey(
      this.storageService.writtenValues
    );
    if (writtenValues) {
      this.dataToWriteOnPI = writtenValues.map((m) => {
        return { isToSave: true, ...m };
      }) as Array<Arvore>;
    }
  }

  async ionViewWillEnter() {
    this.confirm = false;
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

  async sendLog(date: Date, dateSync: Date, values: Array<PIWebObject>, dateRead: string, user: string, response: Array<any>){
    let dateTimestamp = new Date();
    const separator = "#IHM_CEMIG#";

    let config = await this.storageService.getConfig(
      this.storageService.configValues
    ) as Array<any>;

    let webId = await this.storageService.getConfig(
      this.storageService.databaseWebId
    );

    const url = config.find(c => c.Nome == 'configUrl').configValue;
    const body = this.getBodyBatchAttrUsinas(url, webId);
    let usinasEl = await this.api.post(`${url}/batch`, body).toPromise();

    const webIdAttr = (usinasEl.Atributos.Content.Items[0].Content.Items as Array<any>).find(attr => attr.Name == 'Log').WebId;

    let objBodyLog = {};

    response.forEach((resp, index) => {
      if(resp.Status >= 200 && resp.Status < 300) {
        const item = values[index];
        const value =
        item['Selected'] && item['Selected']['Name']
          ? item['Selected']['Name']
          : item['Selected'];

        if(value) {
          const instrumentAttrArr = item.Path.split("\\");
          let instrumentAttr = instrumentAttrArr[instrumentAttrArr.length - 1];
          const instrumentAttrSplArr = instrumentAttr.split('|');
          let instrument = instrumentAttrSplArr[0];
          let attr = instrumentAttrSplArr[1];

          let indexUsinas = instrumentAttrArr.indexOf('Usinas');
          let dateReadArr = dateRead.split('-').reverse();
          let dateReadParsed = dateReadArr.join('/');

          let contentObj = {
            Timestamp: dateTimestamp.toISOString(),
            Value: `${date.toISOString()}${separator}${dateSync.toISOString()}${separator}${item.Path}${separator}${instrumentAttrArr[indexUsinas + 1]}${separator}${instrument}${separator}${attr}${separator}${dateReadParsed}${separator}${value}${separator}${user}`
          };

          objBodyLog[index] = {
            Method: "POST",
            Resource: `${url}/streams/${webIdAttr}/value`,
            Content: JSON.stringify(contentObj)
          };

          dateTimestamp.setMilliseconds(dateTimestamp.getMilliseconds()  + 1);
        }
      }
    });

    this.api.post(`${url}/batch`, objBodyLog).toPromise();
  }

  responses: any[];
  async saveOnPI() {
    if (this.confirm == false) {
      this.showAlert('Confirme o envio dos dados!')
    } else {
      let dataTrue = this.dataToWriteOnPI.filter(u => u.isToSave);
      if (dataTrue.length == 0) {
        this.showAlert('Não existem dados selecionados!')
      } else {
        let token = this.utils.getStorage('Authorization');
        let _user = this.utils.getStorage('user');
        if (!token) {
          let res = await this.showConfirmToken();
          if (!res) return;
          this.router.navigate(['/login'])
          return;
        }
        let dataToWriteOnPI = this.dataToWriteOnPI.filter((f) => f['isToSave']);
        for (let data of dataToWriteOnPI) {
          let values = data.value.filter(m => m.mode != 'Leitura');
          if (values) {
            this.dismissAlert();
            this.showAlertCloseAfter('Enviando dados...');
          }
          let batch = createBatch(values, 'update', data.date);

          let dateSync = new Date();
          let batchResponse = await this.api
            .executeBatch(this.config.afServer, batch)
            .toPromise();
          this.responses = Object.keys(batchResponse).map((k) => batchResponse[k]);
          let noUpdate = this.responses.find(c => c.Status >= 400 && (c.Status != 402 && c.Status != 409 && c.Status != 500));
          if(!noUpdate) {
            await this.sendLog(data.inputTimestamp, dateSync, values, data.date, _user, this.responses);
          }


          let valuesList;
          let val = this.responses.map(c => c);
          let user = this.utils.getStorage('user');
          let stat = data.value.filter(m => m.mode != 'Leitura');
          valuesList = stat.map((nav, index) => {
            let tree = new ArvoreLogs();
            tree.Name = nav.Name;
            tree.status = val[index];

            return tree;
          })


          let currentDate = this.utils.formatDateTimeHours(new Date());
          let treeLogs = new Arvore();
          treeLogs.user = user;
          treeLogs.AplicacaoID = this.utils.getRandom().toLocaleString();
          treeLogs.date = currentDate;
          treeLogs.relativePath = data.relativePath;
          treeLogs.value = valuesList
          treeLogs.isToSave = false;
          treeLogs.dataDate = this.getDateFromDate(data.date);

          this.storageService.insertOrUpdate(
            this.storageService.writtenLogs,
            treeLogs
          );

          if (noUpdate) {
            let error = noUpdate.Content['Errors'];
            let errorMessage = noUpdate?.Content?.Message;

            error = error ? error.toString() : "";
            errorMessage = errorMessage ? errorMessage.toString() : "";

            let msg = error && errorMessage ? `${error} - ${errorMessage}`
              : (error ? error : (errorMessage ? errorMessage : ""));

            msg = this.parseMsg(msg);

            this.dismissAlert();
            this.showAlert(`Não foi possivel enviar os dados!<br>Erro:${msg}`)
            return;
          }
        }

        let isUpdated = this.responses.every((r) => (r.Status >= 200 && r.Status < 400) || (r.Status == 402 || r.Status == 409 || r.Status == 500));
        if (isUpdated) {
          this.dataToWriteOnPI = this.dataToWriteOnPI.filter(
            (f) => f.isToSave != true
          );
        }

        await this.updateStorage(this.dataToWriteOnPI);
        this.dismissAlert();
        let res = await this.showConfirmSincronism();
        if (!res) return;
      }
    }
  }

  getDateFromDate(dateStr: string): string {
    let dateArr = dateStr?.split("-");

    if(!dateArr || dateArr.length < 3) {
      return null;
    }

    const dateAttrInt = dateArr.map(d => parseInt(d));

    const date = new Date();
    date.setFullYear(dateAttrInt[0]);
    date.setMonth(dateAttrInt[1] - 1);
    date.setDate(dateAttrInt[2]);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return formatDate(date, "dd/MM/yyyy", "en");
  }

  parseMsg(msg: string) {
    if(msg && msg.toLocaleLowerCase().includes("no write access")) {
      return "Usuário sem permissão de escrita.";
    }

    return msg;
  }

  async updateStorage(dataToWriteOnPI: Arvore[]) {
    await this.storageService.store(
      this.storageService.writtenValues,
      dataToWriteOnPI
    );
  }

  async updateStorageList(dataToWriteOnPI: Arvore[]) {
    await this.storageService.store(
      this.storageService.writtenValuesForList,
      dataToWriteOnPI
    )
  }


  onEdit(element) {
    this.storageService.save(
      'Edit',
      element
    )
    this.router.navigate(['entrada-manual'])
  }

  async removeWritten() {

    if (this.confirm == false) {
      this.showAlert('Confirme a Exclusao.')
    } else {

      let dataToRemoveOnStorage = this.dataToWriteOnPI.filter(r => r.isToSave);

      if (dataToRemoveOnStorage.length == 0) {
        this.showAlert('Nao existem dados selecionados!');
      } else {
        let res = await this.showConfirm();
        if (!res) return;

        this.dataToWriteOnPI = this.dataToWriteOnPI.filter((f) => !f['isToSave']);
        for (let data of dataToRemoveOnStorage) {
          let values = data.value.filter(m => m.mode != 'Leitura');
          let currentDateLogs = this.utils.formatDateTimeHours(new Date());
          let user = this.utils.getStorage('user');
          let treeLogsDeleted = new Arvore();
          treeLogsDeleted.AplicacaoID = this.utils.getRandom().toLocaleString();
          treeLogsDeleted.relativePath = data.relativePath;
          treeLogsDeleted.user = user;
          treeLogsDeleted.isEdit = false;
          treeLogsDeleted.date = currentDateLogs;
          treeLogsDeleted.value = values;
          treeLogsDeleted.dataDate = this.getDateFromDate(data.date);

          await this.storageService.insertOrUpdate(
            this.storageService.writtenLogs,
            treeLogsDeleted
          );
        }
        await this.updateStorage(this.dataToWriteOnPI);
        await this.updateStorageList(this.dataToWriteOnPI);
        await this.showAlert('Dado(s) Excluído(s) com sucesso!')
      }
    }
  }

  async showAlert(message: string) {
    await this.alertController
      .create({
        message,
        buttons: ['Ok'],
      })
      .then((res) => {
        res.present();
      });
  }

  async showAlertCloseAfter(message: string) {
    const alert = await this.alertController
      .create({
        message,
        buttons: [{
          text: '',
          handler: () => {
            this.alertController.dismiss()
          }
        }],
      })
    await alert.present()

  }
  async dismissAlert() {
    this.alertController.dismiss()
  }


  async showConfirm() {
    let choice = false;
    let alert = await this.alertController.create({
      header: 'Confirmar',
      message:
        'Deseja realmente excluir esses dados?',
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

  async showConfirmToken() {
    let choice = false;
    let alert = await this.alertController.create({
      header: 'Confirmar',
      message:
        'Precisa logar para enviar leituras!<br> Deseja ir para tela de Login?',
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

  async showConfirmSincronism() {
    let choice = false;
    let alert = await this.alertController.create({
      message:
        'Dado(s) enviado(s) com sucesso!</br>Deseja Sincronizar dados?',
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
            this.config.isToLoadFromPI = true;
            this.router.navigate(['entrada-manual'])
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

  getBodyBatchAttrUsinas(url: string, databaseWebId: string){
    return {
      "Elemento": {
          "Method": "GET",
          "Resource": `${url}/elements/search?databaseWebId=${databaseWebId}&query=Name:=Usinas`
      },
      "Atributos": {
          "Method": "GET",
          "RequestTemplate": {
               "Resource": "{0}"
           },
          "Parameters": [
              "$.Elemento.Content.Items[0].Links.Attributes"
          ],
          "ParentIds": [
              "Elemento"
          ]
      }
    };
  }
}

export class ArvoreLogs {
  Name: string;
  AplicacaoID: string;
  date: string;
  relativePath: string;
  status: Array<string>;
  values: Array<PIWebObject>;
}