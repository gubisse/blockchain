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

export interface Parametro {
  id: string;
  categoria: string;
  nome: string;
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