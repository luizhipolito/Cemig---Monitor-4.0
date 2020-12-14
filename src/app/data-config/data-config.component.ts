import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { StorageArvoreService } from 'src/services/storage-arvore.service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { ApiService } from 'src/services/api.service';
import { ConfigService } from 'src/services/config.service';
import { AppUtils } from 'src/utils/app.utils';

@Component({
  selector: 'app-data-config',
  templateUrl: './data-config.component.html',
  styleUrls: ['./data-config.component.scss'],
})
export class DataConfigComponent implements OnInit {
  constructor(
    private router: Router,
    private storageService: StorageArvoreService,
    private messageBox: MatSnackBar,
    public api: ApiService,
    public config: ConfigService,
    public utils: AppUtils
  ) {
  }

  showServer = this.utils.getStorage('server')
  showConfig = this.utils.getStorage('config')

  backHome() {
    this.router.navigate(['/home']);
  }

  onSubmit(f: NgForm) {
    if (f.valid) {
      let server = f.value.server;
      // let server = 'https://34.233.235.92/piwebapi';
      let config = f.value.configuracoes;
      // let config = '\\\\EC2AMAZ-T1N5EJ5\\Testes\\APP Entrada Manual';



      this.api.setBaseUrl(server, config);
      this.config.server = server;
      this.config.config = config;

      this.utils.saveStorage('server', server);
      this.utils.saveStorage('config', config);

      console.log(server, config);
      this.utils.saveStorage('baseUrl', `${server}/elements/?path=${config}`);
      this.router.navigate(['/login']);
    } else {
      this.showMessageBox('Não existem dados preenchidos');
    }
  }

  private configError: MatSnackBarConfig = {
    panelClass: ['style-error'],
    duration: 2000,
    verticalPosition: 'top',
  };

  showMessageBox = (message: string) => {
    this.messageBox.open(message, null, this.configError);
  };
  ngOnInit() { }
}
