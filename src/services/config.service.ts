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
  SenhaOff: string;
  afServer: string;
  Leitura: string;
  EscritaLeitura: string;

  endPoint = {
    asset: ['Databases'],
    database: ['Elements'],
    Elementos: ['Attributes'],
    value: ['Value'],
  };

  attributes = {
    Insercao: 'Categoria Elemento Inserção',
    Escrita: 'Descrição Atributo Escrita',
    ElementoRaiz: 'Elemento Raiz',
    SenhaOff: 'Senha Offline',
    afServer: 'AF Server',
    Leitura: 'Descrição Atributo Leitura',
    EscritaLeitura: 'Descrição Atributo Leitura Escrita',
  };
  constructor() {}
}
