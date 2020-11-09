import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class StorageArvoreService {
  constructor(private storage: Storage, private http: HttpClient) {}

  public insert(arvore: Arvore) {
    let key = arvore.AplicacaoID;
    return this.save(key, arvore);
  }

  public update(key: string, arvore: Arvore) {
    return this.save(key, arvore);
  }

  public save(key: string, arvore: Arvore) {
    this.storage.set(key, arvore);
  }

  public getFilhos(id: string) {
    let filhos: ArvoreList[] = [];
    return this.storage
      .forEach((value: Arvore, key: string) => {
        let arvore = new ArvoreList();
        arvore.key = key;
        arvore.arvore = value;
        if (value.parentID === id) {
          filhos.push(arvore);
        }
      })
      .then(() => {
        return Promise.resolve(filhos);
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  }

  public getAll() {
    let arvores: ArvoreList[] = [];
    return this.storage
      .forEach((value: Arvore, key: string) => {
        let arvore = new ArvoreList();
        arvore.key = key;
        arvore.arvore = value;
        if (value.parentID === undefined) {
          arvores.push(arvore);
        }
      })
      .then(() => {
        return Promise.resolve(arvores);
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  }
}

export class Arvore {
  AplicacaoID: string;
  Nome: string;
  Descricao: string;
  PossuiSubNivel: boolean;
  Caminho: string;
  CategoryNames: string | null;
  parentID: string;
}

export class ArvoreList {
  key: string;
  arvore: Arvore;
}
