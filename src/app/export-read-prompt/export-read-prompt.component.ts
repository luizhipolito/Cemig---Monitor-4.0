import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EntradaManualStateService } from '../entrada-manual/state/entrada-manual-state.service';

@Component({
  selector: 'app-export-read-prompt',
  templateUrl: './export-read-prompt.component.html',
  styleUrls: ['./export-read-prompt.component.scss'],
})
export class ExportReadPromptComponent {

  constructor(private router: Router, private entradaManualState: EntradaManualStateService) { }

  readInstrumentos(){
    this.entradaManualState.setKeepEntradaManual();
    this.router.navigate(['/entrada-manual']);
  }

  exportLeituras(){
    this.router.navigate(['/read-export']);
  }

}
