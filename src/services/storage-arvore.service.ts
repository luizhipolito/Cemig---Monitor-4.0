import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root',
})
export class StorageArvoreService {
  constructor(private storage: Storage) {}

  public insert(key, arvore: Arvore) {
    // let key = arvore.AplicacaoID;
    return this.save(key, arvore);
  }

  public update() {}

  private save(key: string, arvore: Arvore) {
    this.storage.set(key, arvore);
  }

  public remove() {}

  public getAll() {}
}

export class Arvore {
  AplicacaoID: string;
  Nome: string;
  Descricao: string;
  PossuiSubNivel: boolean;
  Caminho: string;
  CategoryNames: string | null;
}
