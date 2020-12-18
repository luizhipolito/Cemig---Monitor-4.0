import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

const menus = ['/entrada-manual', '/salvar-dados'];
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  providers: [ScreenOrientation],
})
export class AppComponent {
  hasMenu = false;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private router: Router,
    private screenOrientation: ScreenOrientation
  ) {
    this.initializeApp();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe((n) => {
        let routerMenu = n['url'];
        this.hasMenu = menus.includes(routerMenu);
      });
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      this.screenOrientation.lock(
        this.screenOrientation.ORIENTATIONS.LANDSCAPE
      );
    });
  }
}
