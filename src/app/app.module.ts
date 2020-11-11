import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginComponent } from './login/login.component';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from './material.module';
import { CdkTableModule } from '@angular/cdk/table';
import { EntradaManualComponent } from './entrada-manual/entrada-manual.component';

import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { IonicStorageModule } from '@ionic/storage';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StorageArvoreService } from 'src/services/storage-arvore.service';
import { DataConfigComponent } from './data-config/data-config.component';
import { SenhaOffPageComponent } from './senha-off-page/senha-off-page.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    EntradaManualComponent,
    DataConfigComponent,
    SenhaOffPageComponent,
  ],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot({
      name: 'arvoreDB',
      driverOrder: ['indexeddb', 'sqlite', 'websql'],
    }),
    AppRoutingModule,
    HttpClientModule,
    CommonModule,
    FormsModule,
    MaterialModule,
    CdkTableModule,
    BrowserAnimationsModule,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    SQLite,
    SQLitePorter,
    StorageArvoreService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
