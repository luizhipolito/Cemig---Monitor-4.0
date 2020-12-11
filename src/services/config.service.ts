import { Injectable } from '@angular/core';

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
  constructor() { }
}
