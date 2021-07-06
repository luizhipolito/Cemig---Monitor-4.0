import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { StorageArvoreService, Arvore } from 'src/services/storage-arvore.service';
import { SocialSharing } from '@ionic-native/social-sharing/ngx'
import { File } from '@ionic-native/file/ngx';

@Component({
  selector: 'app-page-logs',
  templateUrl: './page-logs.component.html',
  styleUrls: ['./page-logs.component.scss'],
})
export class PageLogsComponent {

  constructor(
    private navCtrl: NavController,
    public storageService: StorageArvoreService,
    private socialSharing: SocialSharing,
    private file: File,
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
  async sharingLogs() {
    this.logData = document.getElementById('boxLogsData').innerText;
    console.log(this.logData)

    var fileDir = this.file.externalApplicationStorageDirectory;
    var filename = "logs.txt";
    this.file.writeFile(fileDir, filename, this.logData, { replace: true });

    await this.socialSharing.share(null, 'Logs CEMIG', fileDir + 'logs.txt');
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

  ngOnInit() { }

}
