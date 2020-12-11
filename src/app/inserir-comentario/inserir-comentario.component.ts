import { Component, OnInit } from '@angular/core';
import { EntradaManualComponent } from '../entrada-manual/entrada-manual.component';
import { ConfigService } from 'src/services/config.service';
import { MenuController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inserir-comentario',
  templateUrl: './inserir-comentario.component.html',
  styleUrls: ['./inserir-comentario.component.scss'],
})
export class InserirComentarioComponent implements OnInit {



  constructor(private menu: MenuController, private router: Router) {

  }

  ngOnInit() {

  }
  openMenu() {
    this.menu.open();
  }

  logoutUsuario = () => {
    this.menu.close();
    this.router.navigate(['/']);
  };
  onSairClick = (ev) => {
    this.logoutUsuario();
  };

}
