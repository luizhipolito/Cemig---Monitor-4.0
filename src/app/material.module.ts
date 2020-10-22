import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const materialModules = [
  FormsModule,
  MatSnackBarModule,
  ReactiveFormsModule,
  MatSidenavModule,
  MatIconModule,
  MatButtonModule,
];

@NgModule({
  imports: materialModules,
  exports: materialModules,
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }],
})
export class MaterialModule {}
