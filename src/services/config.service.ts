import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  server: string;

  config: string;

  Insercao: string;
  Navegacao: string;
  Escrita: string;
  ElementoRaiz: string;
  SenhaOff: string;
  afServer: string;

  endPoint = {
    asset: ['Databases'],
    database: ['Elements'],
    Elementos: ['Attributes'],
    value: ['Value'],
  };

  attributes = {
    Insercao: 'Categoria Elemento Inserção',
    Navegacao: 'Categoria Elemento Navegação',
    Escrita: 'Descrição Atributo Escrita',
    ElementoRaiz: 'Elemento Raiz',
    SenhaOff: 'Senha Offline',
    afServer: 'AF Server',
  };
  constructor() {}
}
