/*import md5 from "blueimp-md5";
import type { Role, Usuario } from "./entidade"; // Importando a função

// Função utilitária para formatar Date como YYYY-MM-DD
export const formatDateToInput = (date?: Date): string => {
  if (!date || isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0]; // Fallback para data atual
  }
  return date.toISOString().split('T')[0]; // Ex.: "2025-04-29"
};

export const parseDate = (input: string): Date => {
  const parsed = new Date(input);
  if (isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
};

export const semanaDoAno = (data: string | Date) => {
  const d = new Date(data);
  const umJaneiro = new Date(d.getFullYear(), 0, 1);
  const dias = Math.floor((d.getTime() - umJaneiro.getTime()) / (24 * 60 * 60 * 1000));
  const numeroSemana = Math.ceil((dias + umJaneiro.getDay() + 1) / 7);
  return `${numeroSemana}`;
};

export function geradorDeSenhaMD5(senhaBruta: string): string {
  const senha = senhaBruta?.trim() || "";
  return md5(senha);
}

export function comparadorDeSenha( senha: string , senhaBD: string): boolean {
  const senhaDigitada = senha?.trim() as string;
  const senhaCriptografada = md5(senhaDigitada) as string;
  return senhaCriptografada === senhaBD as string;
}

export function buscarEndPointParaOLogado(usuarios: Usuario[], roles: Role[]): string {
  const loginStr = localStorage.getItem("login");
  if (!loginStr) return "l";

  const login = JSON.parse(loginStr);

  if (Array.isArray(usuarios) && Array.isArray(roles)) {
    const usuario = usuarios.find((d: any) => d.id === login.usuario);
    if (usuario) {
      const role = roles.find((r: any) => r.id === usuario.role);
      if (role && role.id) {
        if (role.id === "1d60c7cf-f845-48cf-b0d1-44d252299b04") return "d/tp";
        if (role.id === "aa42686d-8b42-43b9-927e-33640a38c8d9") return "d/td";
        if (role.id === "c7dfc45b-7cd5-4180-b963-c1f441d78792") return "d/e";
      }
    }
  }

  return "l";
}


export function terminarSessao(): boolean {
  localStorage.removeItem("login");
  return true;
}*/