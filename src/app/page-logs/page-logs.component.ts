import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { StorageArvoreService, Arvore } from 'src/services/storage-arvore.service';
import * as saveAs from "file-saver";
import { formatDate } from '@angular/common';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { File } from '@ionic-native/file/ngx';

@Component({
  selector: 'app-page-logs',
  templateUrl: './page-logs.component.html',
  styleUrls: ['./page-logs.component.scss'],
})
export class PageLogsComponent {

  constructor(
    private navCtrl: NavController,
    private file: File,
    private socialSharing: SocialSharing,
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

    if(window.hasOwnProperty("cordova")){
      let fileDir = this.file.externalApplicationStorageDirectory;
      let filename = "logs.txt";
      this.file.writeFile(fileDir, filename, blob, { replace: true });
      this.socialSharing.share(null, `Logs ${formatDate(new Date(), 'dd/MM/yyyy', 'en-US')}`, `${fileDir}${filename}`);
    }
    else{
      saveAs(blob, "logs.txt");
    }
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
