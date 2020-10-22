export interface Login {
  Autorizacao?: string;
}

export interface Autorizacao {
  Autenticado: boolean;
  Identificador: string;
  Nome: string;
  Token: string;
}

export interface Resposta {
  Dados?: Autorizacao;
  Mensagem?: string;
  Status: boolean;
}
