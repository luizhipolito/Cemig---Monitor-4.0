import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EntradaManualStateService {

  keepEntradaManual: boolean;

  constructor() { 
    this.resetEntradaManual();
  }

  resetEntradaManual(){
    this.keepEntradaManual = false;
  }

  setKeepEntradaManual(){
    this.keepEntradaManual = true;
  }
}
