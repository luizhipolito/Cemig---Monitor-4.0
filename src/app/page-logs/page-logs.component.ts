import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { StorageArvoreService, Arvore } from 'src/services/storage-arvore.service';
import { SocialSharing } from '@ionic-native/social-sharing/ngx'
import { PIWebObject } from 'src/model/PIWebObject.model';

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

  sharingLogs() {
    this.dataLogs.forEach((data: Arvore) => {

      let treeLogs = new Arvore();
      treeLogs.user = data.user;
      treeLogs.date = data.date;
      treeLogs.relativePath = data.relativePath;
      treeLogs.value = data.value
      console.log(treeLogs)
    })


    // console.log(this.dataLogs.map(c => c).find(a => a))
    // console.log(this.dataLogs.length)
    // let dataLog = this.dataLogs.map(c => c);
    // console.log(JSON.stringify(dataLog))

    // console.log(JSON.stringify(this.dataLogs))
    this.socialSharing.share('data');
  }


  async ionViewWillEnter() {
    await this.loadLogValues();
  }

  ngOnInit() { }

}
