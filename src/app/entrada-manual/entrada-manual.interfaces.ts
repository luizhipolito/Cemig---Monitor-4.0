export interface Resposta {
  Dados?: dados;
  Mensagem?: string;
  Status: boolean;
}

export interface dados {
  Arvore: Array<arvore>;
}

export interface arvore {
  AplicacaoID: string;
  Nome: string;
  Descricao: string;
  PossuiSubNivel: boolean;
  Caminho: string;
  CategoryNames: string | null;
  parentID: string;
}

export interface dataEnumeration {
  ID: string;
  Nome: string;
  caminho: string;
  value: string;
}

export class ArvoreLocal {
  AplicacaoID: string;
  Nome: string;
  Descricao: string;
  PossuiSubNivel: boolean;
  Caminho: string;
  CategoryNames: string | null;
  parentID: string;
}
