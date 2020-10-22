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
}

export interface AplicacaoPI {
  AplicacaoID: string;
  Nome: string;
  Descricao: string;
  PossuiSubNivel: boolean;
  Caminho: string;
}

export interface TagPI {
  TagId: string;
  Nome: string;
  Descricao: string;
  Caminho: string;
  Unidade: string;
  ValorEntrada: string;
  DataEntrada: string;
  StatusEnvio: string;
  UltimaData: string;
  UltimoValor: Number;
  LimiteInferior: Number;
  LimiteSuperior: Number;
  EntradaValida: boolean;
  TipoTag: string;
  ErroValidacao: boolean;
}
