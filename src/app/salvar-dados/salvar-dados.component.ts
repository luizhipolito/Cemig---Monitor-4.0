import { Component, OnInit, Attribute, Input, } from '@angular/core';
import { MenuController, NavController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import {
  Arvore,
  StorageArvoreService,
} from 'src/services/storage-arvore.service';
import { AppUtils, createBatch } from 'src/utils/app.utils';
import { ApiService } from 'src/services/api.service';
import { ConfigService } from 'src/services/config.service';
import { EntradaManualComponent } from '../entrada-manual/entrada-manual.component';

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
    this.dataToWriteOnPI = writtenValues.map((m) => {

      return { isToSave: true, ...m };
    }) as Array<Arvore>;
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

  async saveOnPI() {
    if (this.confirm == false) {
      this.showAlert('Confirme o envio dos dados!')
    } else {
      let dataTrue = this.dataToWriteOnPI.filter(u => u.isToSave)
      if (dataTrue.length == 0) {
        this.showAlert('Não existem dados selecionados!')
      } else {
        let dataToWriteOnPI = this.dataToWriteOnPI.filter((f) => f['isToSave']);
        for (let data of dataToWriteOnPI) {
          let values = data.value.filter(m => m.mode != 'Leitura')
          if (values) {
            this.showAlertCloseAfter('Enviando dados...');
          }
          let batch = createBatch(values, 'update', data.date);
          let batchResponse = await this.api
            .executeBatch(this.config.afServer, batch)
            .toPromise();
          let responses = Object.keys(batchResponse).map((k) => batchResponse[k]);
          let noUpdate = responses.find(c => c.Status >= 400 && (c.Status != 402 && c.Status != 409))

          if (noUpdate) {
            let error = noUpdate.Content['Errors'];
            this.dismissAlert();
            this.showAlert(`Não foi possivel enviar os dados!<br>Erro:${error}`)
            return;
          }
          let isUpdated = responses.every((r) => (r.Status >= 200 && r.Status < 400) || (r.Status == 402 || r.Status == 409));
          if (isUpdated) {
            this.dataToWriteOnPI = this.dataToWriteOnPI.filter(
              (f) => f.isToSave != true
            );
            console.log(this.dataToWriteOnPI)
            this.dismissAlert();
            await this.updateStorage(this.dataToWriteOnPI);
          }

        }

        this.showAlert('Dados enviado(s) com sucesso!')

      }
    }
  }
  async updateStorage(dataToWriteOnPI: Arvore[]) {
    await this.storageService.store(
      this.storageService.writtenValues,
      dataToWriteOnPI
    );
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

      let dataToRemoveOnStorage = this.dataToWriteOnPI.filter(r => r.isToSave)

      if (dataToRemoveOnStorage.length == 0) {
        this.showAlert('Nao existem dados selecionados!');
      } else {
        let res = await this.showConfirm();
        if (!res) return;
        this.dataToWriteOnPI = this.dataToWriteOnPI.filter((f) => !f['isToSave']);
        await this.updateStorage(this.dataToWriteOnPI);
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


}
