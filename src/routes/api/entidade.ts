
export interface Role {
  id?: string;
  nome: string;
  descricao: string;
  created_at?: Date
}

export interface Usuario {
  id?: string;
  role: string;
  professor: string;
  nome: string;
  senha: string;
  created_at?: Date

}

export interface Login {
  id?: string;
  usuario: string;
  senha?: string;
  created_at?: Date
}

export interface Provincia {
  id: string;      // ID único para a província
  nome: string;    // Nome da província
}

export interface Distrito {
  id: string;           // ID único para o distrito
  nome: string;         // Nome do distrito
  provincia: string; // ID da província à qual o distrito pertence
}

export interface PostoAdministrativo {
  id: string;         // ID único para o posto administrativo
  nome: string;       // Nome do posto administrativo
  distrito: string; // ID do distrito ao qual o posto pertence
}

export interface Escola {
  id?: string;
  postoadministrativo: string;
  nome: string;
  created_at?: Date
}

export interface Formacao {
  id?: string;
  nome?: string;
  descricao?: string;
}

export interface LocalFormacao {
  id?: string;
  nome: string;
  provincia: string;
  pais: string;
}

export interface Professor {
  id?: string;
  escola: string;
  nome: string;
  email: string;
  formacao: string;
  localformacao: string;
  anoconclusaoformacao: number;
  anoadmissaoestado: number;
  contacto: string;
}

export interface EstatisticaAlunos {
  id?: string;
  escola: string;
  anolectivo: number;
  homensMatriculados: number;
  homensSituacaoPositiva: number;
  homensDesistentes: number;
  mulheresMatriculados: number;
  mulheresSituacaoPositiva: number;
  mulheresDesistentes: number;
  created_at?: Date
}






export interface Disciplina {
  id: string;
  nome: string;
  descricao: string;
}

export interface CHA {
  id: string;
  nome: string;
  horas: number;
  formacao: string;
  professor: string;
}

export interface CHD {
  id: string;
  nome: string;
  formacao: string;
  cha: string;
  horas: number;
  disciplina: string;
}

