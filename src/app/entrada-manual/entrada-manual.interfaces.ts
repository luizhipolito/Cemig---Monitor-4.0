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
