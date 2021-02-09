import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { StorageArvoreService } from 'src/services/storage-arvore.service';

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

  dataLogs: any;
  async loadLogValues() {
    this.dataLogs = await this.storageService.getByKey(
      this.storageService.writtenLogs
    )
    console.log(this.dataLogs)
  }

  async ionViewWillEnter() {
    await this.loadLogValues();
  }

  ngOnInit() { }

}
