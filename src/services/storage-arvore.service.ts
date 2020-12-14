import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { HttpClient } from '@angular/common/http';
import { stringify } from 'querystring';
import { Attribute } from 'src/model/Attribute.model';
import { PIWebValue } from 'src/model/PIWebValue.model';
import { EnumerationValue } from 'src/model/EnumerationValue.model';
import { PIWebObject } from 'src/model/PIWebObject.model';

@Injectable({
  providedIn: 'root',
})
export class StorageArvoreService {
  navigation: string = 'navigation';
  enumerationSets: string = 'enumerationSets';
  writtenValues: string = 'writtenValues';
  constructor(private storage: Storage, private http: HttpClient) {}

  public insert(arvore: Arvore) {
    let key = arvore.AplicacaoID;
    return this.save(key, arvore);
  }

  public store(key: string, arvore: Array<Arvore>) {
    return this.storage.set(key, arvore);
  }

  public saveConfig(key, value: string) {
    this.storage.set(key, value);
  }

  public removeAll() {
    this.storage.clear();
  }

  public update(key: string, arvore: Arvore) {
    return this.save(key, arvore);
  }

  public save(key: string, arvore: Arvore) {
    this.storage.set(key, arvore);
  }

  public getConfig(key: string) {
    return this.storage.get(key);
  }

  public getFilhos(pathList: Array<string>) {
    return this.getByKey('navigation')
      .then((treelist: Array<Arvore>) => {
        let children: Array<Arvore> = new Array<Arvore>();
        treelist.forEach((tree: Arvore) => {
          let validPath = true;
          pathList.forEach((path, index) => {
            validPath = validPath && tree.Caminho[index] == path;
          });
          if (validPath) {
            children.push(tree);
          }
        });
        return Promise.resolve(children);
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  }

  public getByKey(key): Promise<Array<Arvore>> {
    return this.storage
      .get(key)
      .then((result) => {
        return Promise.resolve(result);
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

        arvores.push(arvore);
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
  Description: string;
  Caminho: string[];
  relativePath: string;
  value: Array<PIWebObject>;
  atributos: Attribute;
  date: string;
}

export class ArvoreList {
  key: string;
  arvore: Arvore;
}
