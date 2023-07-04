import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { StorageArvoreService, Arvore } from 'src/services/storage-arvore.service';
import * as saveAs from "file-saver";

@Component({
  selector: 'app-page-logs',
  templateUrl: './page-logs.component.html',
  styleUrls: ['./page-logs.component.scss'],
})
export class PageLogsComponent {

  constructor(
    private navCtrl: NavController,
    public storageService: StorageArvoreService
  ) { }


  onBack() {
    this.storageService.removeEdit()
    this.navCtrl.navigateBack('entrada-manual');
  }

  getRelativePath(path: string) {
    if (path.startsWith('\\')) {
      path = path.slice(1);
    }
    path = path.split('\\').join('➤');
    return path;
  }
  dataResponse: string;
  dataLogs: Array<Arvore>;
  async loadLogValues() {
    this.dataLogs = await this.storageService.getByKey(
      this.storageService.writtenLogs
    );
  }



  logData: any;
  sharingLogs() {
    this.logData = document.getElementById('boxLogsData').innerText;

    var blob = new Blob([this.logData], {
      type: "text/plain;charset=utf-8;",
    });
    saveAs(blob, "logs.txt");
  }

  getMessage(obj): string {
    if(!obj?.Status) return null;

    if(obj.Status >= 200 && obj.Status < 300) {
      return "Sucesso";
    } else {
      let messages: Array<string> = [];
      let errors = obj.Content?.Errors ? obj.Content.Errors as Array<string> : [];

      errors.forEach(err => {
        messages.push(err);
      });

      return messages.length ? messages.join("; ") : `Status ${obj.Status}`;
    }
  }

  async ionViewWillEnter() {
    await this.loadLogValues();
  }

}
