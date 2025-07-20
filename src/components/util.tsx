import { $, type QRL } from '@builder.io/qwik';
import md5 from 'blueimp-md5'; 

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import type { Usuario, Restauracao } from './entidade';
import { getAllDados } from "./DTO";

let USUARIOS_FIXOS: Usuario[] = [];

(async () => {
  USUARIOS_FIXOS = await getAllDados("usuario");
})();



export function formatarDataMZ(isoString: string): string {
  const data = new Date(isoString);
  return data.toLocaleString('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Maputo',
  });
}
export const formatarDataHora = (iso: string | undefined | null) => {
  if (!iso) return 'Data inválida';
  const data = new Date(iso);
  console.log(iso)
  if (isNaN(data.getTime())) return 'Data inválida';
  return data.toLocaleString('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', '');
};

export const CodificadorMD5 = (codigo: string) => {
  return md5(codigo.trim());
}

export const AlegarLogin = $(async (nome: string, senha: string) => {
  const usuario = USUARIOS_FIXOS.find(u => u.nome === nome.trim());

  if (!usuario) {
    return { sucesso: false, mensagem: 'Usuário não encontrado.' };
  }

  const senhaDigitada = md5(senha.trim());

  if (usuario.senha !== senhaDigitada) {
    return { sucesso: false, mensagem: 'Senha incorreta.' };
  }

  const objetoLogin = {
    usuario: usuario,
    data: new Date().toISOString(),
  };

  localStorage.setItem('login', JSON.stringify(objetoLogin));

  return { sucesso: true, mensagem: 'Login efetuado com sucesso.', usuario: objetoLogin };
});


export const ConfirmarSenhaDoUsuarioLogado = $(async (senha: string) => {
  // 1. Recupera os dados armazenados no localStorage
  const loginStr = localStorage.getItem('login');

  console.log("Usuarios:\n\n",USUARIOS_FIXOS)

  if (!loginStr) {
    return { sucesso: false, mensagem: 'Nenhum login encontrado no dispositivo.'};
  }

  let loginData;
  try {
    loginData = JSON.parse(loginStr);
  } catch (e) {
    return { sucesso: false, mensagem: 'Dados de login corrompidos.' };
  }
  console.log(loginData)
  const nome = loginData?.usuario?.nome;
  const senhaSalva = loginData?.usuario?.senha;

  if (!nome || !senhaSalva) {
    return { sucesso: false, mensagem: 'Usuário ou senha ausentes nos dados armazenados.' };
  }

  // 2. Busca o usuário na lista fixa
  const usuario = USUARIOS_FIXOS.find(u => u.nome === nome.trim());
  if (!usuario) {
    return { sucesso: false, mensagem: 'Usuário não encontrado nos registros fixos.' };
  }

  // 3. Compara senha digitada com a do sistema
  const senhaDigitada = md5(senha.trim());

  if (usuario.senha !== senhaDigitada) {
    return { sucesso: false, mensagem: 'Senha incorreta.' };
  }

  return {
    sucesso: true,
    mensagem: 'Senha confirmada com sucesso.',
    usuario: usuario,
  };
});


export const VerificarLogin = () => {
  const login = localStorage.getItem('login');
  if (!login) return null;

  try {
    const obj = JSON.parse(login);
    return obj;
  } catch {
    return null;
  }
};


export const TerminarLogin = $(() => {
  localStorage.removeItem('login');
  return true;
});


export const GerarPDF: QRL<() => void> = $(() => {
  const elementoOriginal = document.getElementById('relatorio-pdf');
  if (!elementoOriginal) return;

  // Clona o elemento e aplica estilos básicos para evitar problemas de parsing
  const clone = elementoOriginal.cloneNode(true) as HTMLElement;
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#000000';
  clone.style.fontFamily = 'sans-serif';

  // Esconde o clone fora da tela
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.appendChild(clone);
  document.body.appendChild(container);

  html2canvas(clone, { scale: 2 })
    .then((canvas) => {
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgProps = {
        width: canvas.width,
        height: canvas.height,
      };

      const ratio = pageWidth / imgProps.width;
      const imgWidth = pageWidth;
      const imgHeight = imgProps.height * ratio;

      let position = 0;

      // Adiciona imagem à primeira página e divide em múltiplas páginas se necessário
      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      } else {
        while (position < imgHeight) {
          pdf.addImage(imgData, 'JPEG', 0, -position, imgWidth, imgHeight);
          position += pageHeight;
          if (position < imgHeight) pdf.addPage();
        }
      }

      pdf.save('relatorio-proforma.pdf');
    })
    .catch((err) => {
      console.error('Erro ao gerar PDF:', err);
    })
    .finally(() => {
      container.remove();
    });
});

// Função para avaliar expressões matemáticas simples
export const evaluateExpression = (expression: string): number => {
  try {
    // Substitui variáveis por valores e avalia a expressão
    // Suporta operações básicas: +, -, *, /
    const safeEval = new Function(`return ${expression}`);
    const result = safeEval();
    return Number.isFinite(result) ? Number(result.toFixed(2)) : NaN;
  } catch (error) {
    return NaN;
  }
};

// src/services/restaurar.ts
export async function AlegarRestauracao(codigo: string): Promise<Restauracao> {
  // 1. Validação básica
  const codigoLimpo = codigo.trim();

  if (!codigoLimpo) {
    return { sucesso: false, mensagem: 'O código não pode estar vazio.' };
  }
  /*
  if (codigoLimpo.length !== 24) {
    return { sucesso: false, mensagem: 'O código deve conter exatamente 24 letras.' };
  }
  */
  // 2. Lógica de verificação (aqui você pode buscar no banco de dados, arquivos, etc.)
  // Simulação: um código fictício aceito
  const codigoAutorizado = 'A' // 'ABCDEFGHIJKLMNOPQRSTUVWX'; // 24 letras

  if (codigoLimpo.toUpperCase() === codigoAutorizado) {
    // Simule alguma lógica de restauração se necessário
    return { sucesso: true, mensagem: 'Sistema liberado para a restauracao.' };
  }

  return { sucesso: false, mensagem: 'Código inválido. Tente novamente.' };
}
