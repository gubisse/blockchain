export interface Usuario {
  id: string;
  nome: string;
  senha: string; // já em md5
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  morada: string;
  data: string;
}

export interface Proforma {
  id: string;
  cliente: string;
  nome: string;
  parametros: string;
  totalpagar: number;
  data: string;
  estado: string;
}

export interface elementosQuimicos118 {
  id: string;
  nome: string;
  descricao:string;
}

export interface Parametro {
  id: string;
  categoria: string;
  valor: number;
  campos: string;
  formula: string;
}

export interface Analise {
  id: string;
  proforma: string;
  parametro: string;
  valorfinal: number;
  data: string;
  [key: string]: string | number; // Para campos dinâmicos como x, y, z
}
export interface Comprovativo {
  id: string;
  proforma: string;
  data: string;
}