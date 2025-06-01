import { $, type QRL } from '@builder.io/qwik';
import md5 from 'blueimp-md5'; 

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import type { Usuario } from './entidade';
import { usuarios } from "./dado";

const USUARIOS_FIXOS: Usuario[] = usuarios;

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
    usuario: usuario.id,
    data: new Date().toISOString(),
  };

  localStorage.setItem('login', JSON.stringify(objetoLogin));

  return { sucesso: true, mensagem: 'Login efetuado com sucesso.', usuario: objetoLogin };
});

export const VerificarLogin = () => {
  const login = localStorage.getItem('login');
  if (!login) return null;

  try {
    const obj = JSON.parse(login);
    return obj && obj.usuario;
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

export const formatarDataHora = (iso: string | undefined | null) => {
  if (!iso) return 'Data inválida';
  const data = new Date(iso);
  if (isNaN(data.getTime())) return 'Data inválida';
  
  return data.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', '');
};

