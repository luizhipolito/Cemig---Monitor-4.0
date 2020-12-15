import { Component, OnInit } from '@angular/core';
import { MenuController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-inserir-comentario',
  templateUrl: './inserir-comentario.component.html',
  styleUrls: ['./inserir-comentario.component.scss'],
})
export class InserirComentarioComponent {



  constructor(private menu: MenuController, private router: Router, private modalCtrl: ModalController) {

  }

  dismissModal() {
    this.modalCtrl.dismiss()
  }

  salvarComent() {
    this.modalCtrl.dismiss()
  }

  onSubmit(f: NgForm) {
    if (f.valid) {
      console.log(f.value.message);
    }
  }


}
