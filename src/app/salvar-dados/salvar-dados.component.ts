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

  responses: any[];
  async saveOnPI() {
    if (this.confirm == false) {
      this.showAlert('Confirme o envio dos dados!')
    } else {
      let dataTrue = this.dataToWriteOnPI.filter(u => u.isToSave)
      if (dataTrue.length == 0) {
        this.showAlert('Não existem dados selecionados!')
      } else {
        let token = this.utils.getStorage('Authorization');
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

          let batchResponse = await this.api
            .executeBatch(this.config.afServer, batch)
            .toPromise();
          this.responses = Object.keys(batchResponse).map((k) => batchResponse[k]);
          let noUpdate = this.responses.find(c => c.Status >= 400 && (c.Status != 402 && c.Status != 409 && c.Status != 500))


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

          this.storageService.insertOrUpdate(
            this.storageService.writtenLogs,
            treeLogs
          );

          if (noUpdate) {
            let error = noUpdate.Content['Errors'];
            this.dismissAlert();
            this.showAlert(`Não foi possivel enviar os dados!<br>Erro:${error}`)
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
        this.showAlert('Dados enviado(s) com sucesso!');
      }
    }
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
      console.log(dataToRemoveOnStorage)

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


}

export class ArvoreLogs {
  Name: string;
  AplicacaoID: string;
  date: string;
  relativePath: string;
  status: Array<string>;
  values: Array<PIWebObject>;
}