import { Injectable } from '@angular/core';
import { Arvore, StorageArvoreService } from './storage-arvore.service';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  isToLoadFromPI: boolean = false;
  server: string;
  config: string;
  Insercao: string;
  Navegacao: string;
  Escrita: string;
  ElementoRaiz: string;
  EnumerationSets: string;
  EnumValues: string;
  SenhaOff: string;
  afServer: string;
  Leitura: string;
  EscritaLeitura: string;
  Enumeration: string = 'Testes';
  descricaoEnumerationSets: string;
  DataBase: string;
  AppAttributes: string;

  endPoint = {
    asset: 'Databases',
    database: 'Elements',
    Elementos: 'Attributes',
    value: 'Value',
    values: 'Values',
    enumeration: 'Database',
    enumerationSets: 'EnumerationSets',
  };

  attributes = {
    Insercao: 'Categoria Elemento Inserção',
    Escrita: 'Descrição Atributo Escrita',
    ElementoRaiz: 'Elemento Raiz',
    SenhaOff: 'Senha Offline',
    afServer: 'AF Server',
    Leitura: 'Descrição Atributo Leitura',
    EscritaLeitura: 'Descrição Atributo Leitura Escrita',
    descricaoEnumerationSets: 'Descrição Enumeration Sets',
    DataBase: 'Database',
    AppAttributes: 'Descrição Atributo',
  };
  constructor(public storageService: StorageArvoreService) {}

  async init() {
    let config = await this.storageService.getByKey(
      this.storageService.configValues
    );

    config.forEach((conf) => {
      this[conf.Nome] = conf.configValue;
    });
  }

  async saveStorage() {
    let attributes = Object.keys(this);
    let configTree: Array<Arvore> = new Array<Arvore>();

    attributes.forEach((att) => {
      if (typeof this[att] == 'string') {
        let tree = new Arvore();
        tree.Nome = att;
        tree.configValue = this[att];
        configTree.push(tree);
      }
    });

    await this.storageService.store(
      this.storageService.configValues,
      configTree
    );
  }
}
