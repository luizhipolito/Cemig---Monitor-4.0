import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { EntradaManualComponent } from './entrada-manual/entrada-manual.component';
import { SenhaOffPageComponent } from './senha-off-page/senha-off-page.component';
import { DataConfigComponent } from './data-config/data-config.component';
import { SalvarDadosComponent } from './salvar-dados/salvar-dados.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'entrada-manual',
    component: EntradaManualComponent,
  },
  {
    path: 'senha-off-page',
    component: SenhaOffPageComponent,
  },
  {
    path: 'data-config',
    component: DataConfigComponent,
  },

  {
    path: 'salvar-dados',
    component: SalvarDadosComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
