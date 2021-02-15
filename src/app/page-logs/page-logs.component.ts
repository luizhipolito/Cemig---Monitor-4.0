import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { StorageArvoreService, Arvore } from 'src/services/storage-arvore.service';
import { SocialSharing } from '@ionic-native/social-sharing/ngx'
import { File } from '@ionic-native/file/ngx';
import { stringify } from 'querystring';

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

  dataLogs: Array<Arvore>;
  async loadLogValues() {
    this.dataLogs = await this.storageService.getByKey(
      this.storageService.writtenLogs
    )
  }

  createAccessLogFileAndWrite(text: string) {
    this.file.checkFile(this.file.dataDirectory, 'access.log')
      .then(doesExist => {
        console.log("doesExist : " + doesExist);
        return this.writeToAccessLogFile(text);
      }).catch(err => {
        return this.file.createFile(this.file.dataDirectory, 'access.log', false)
          .then(FileEntry => this.writeToAccessLogFile(text))
          .catch(err => console.log('Couldnt create file'));
      });
  }

  writeToAccessLogFile(text: string) {
    this.file.writeExistingFile(this.file.dataDirectory, 'access.log', text)
  }

  someEventFunc(text: string) {
    console.log(text)
    // This is an example usage of the above functions
    // This function is your code where you want to write to access.log file
    this.createAccessLogFileAndWrite(text);
  }

  logData: any;
  async sharingLogs() {

    this.logData = document.getElementById('boxLogsData').innerText;
    this.someEventFunc(this.logData);

    this.socialSharing.share(this.logData);
  }



  async ionViewWillEnter() {
    await this.loadLogValues();
  }

  ngOnInit() { }

}
