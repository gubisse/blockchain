import { $ } from "@builder.io/qwik";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Usuario, Cliente, Proforma, Parametro, Analise } from "./entidade";
import { elementosQuimicos118 } from "./dado";
import { formatarDataMZ } from "./util";

export const relatorioEmPDF = $(
  ({ dado, titulo }: { dado: any[]; titulo?: string }) => {
    if (!Array.isArray(dado) || dado.length === 0) {
      console.warn("Nenhum dado fornecido para gerar o relatório.");
      return;
    }

    const doc = new jsPDF();

    const nomeTitulo = titulo || "Relatório Genérico";
    doc.text(nomeTitulo, 10, 10);

    const tableColumn = Object.keys(dado[0]);
    const tableRows = dado.map((item) =>
      tableColumn.map((key) => item[key] ?? "")
    );

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    const nomeArquivo = nomeTitulo.toLowerCase().replace(/ /g, "_");
    const data = new Date().toISOString().split("T")[0];
    doc.save(`${nomeArquivo}_${data}.pdf`);
  }
);

type DadosParaRelatorio = {
  cliente: Partial<Cliente>;
  proforma: Partial<Proforma>;
  parametros: Parametro[];
  analises: Analise[];
  usuario: Partial<Analise>;
};

// Interface para garantir compatibilidade com Parametro
interface ParametroCompleto extends Parametro {
  nome: string;
  descricao: string;
}



export const relatorioEmPDF2 = async ({
  dado,
  titulo = 'Relatório de Análise',
}: {
  dado: DadosParaRelatorio;
  titulo?: string;
}) => {
  const doc = new jsPDF();

  // ✅ Carrega logo dinamicamente do public/imagens/logo.png
  try {
    const logoUrl = '/imagens/ucm.png'; // Caminho relativo ao `public/`
    const response = await fetch(logoUrl);
    const blob = await response.blob();

    const reader = new FileReader();
    const imageData: string = await new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob); // converte para base64
    });

    doc.addImage(imageData, 'PNG', 10, 10, 28, 28);
  } catch (e) {
    console.warn('Falha ao carregar logo:', e);
    doc.setFontSize(12);
    doc.text('LOGO', 10, 20);
  }

  // ... (resto igual ao que você já fez)

  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text('Departamento da Engenharia Alimentar', 115, 15);
  doc.setFontSize(10);
  doc.text('Av. das Empresas, Chimoio, Moçambique', 115, 22);
  doc.text('Email: contact@xaianalytics.com', 115, 27);
  doc.text('Telefone: +258 123 456 789', 115, 32);

  doc.setLineWidth(0.5);
  doc.line(10, 38, 200, 38);

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold'); // ou 'times', 'courier' etc.
  doc.text(titulo, 105, 48, { align: 'center' });

  doc.setFontSize(12);
  doc.text('Detalhes do Cliente', 10, 60);
  doc.setFontSize(10);
  doc.text('Nome:', 10, 68);
  doc.setFont('helvetica', 'normal');
  doc.text(dado.cliente.nome || 'N/A', 30, 68);
  doc.setFont('helvetica', 'bold');
  doc.text('Telefone:', 10, 74);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dado.cliente.telefone || 'N/A'}`, 30, 74);
  doc.setFont('helvetica', 'bold');
  doc.text('Email:', 10, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dado.cliente.email || 'N/A'}`, 30, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('Morada:', 10, 86);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dado.cliente.morada || 'N/A'}`, 30, 86);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalhes da Proforma', 120, 60);
  doc.setFontSize(10);
  doc.text('Nome:', 120, 68);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dado.proforma.nome || 'N/A'}`, 140, 68);
  doc.setFont('helvetica', 'bold');
  doc.text('Data:', 120, 74);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatarDataMZ(dado.proforma.data || "") || 'N/A'}`, 140, 74);
  doc.setFont('helvetica', 'bold');
  doc.text('Estado:', 120, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dado.proforma.estado || 'N/A'}`, 140, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('Total pago:', 120, 86);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dado.proforma.totalpagar || 0} MZN`, 140, 86);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Parâmetros Analisados', 10, 100);
  doc.setFont('helvetica', 'normal');

  const parametrosSelecionados = (dado.proforma?.parametros ?? '')
    .split(',')
    .map((pid) => elementosQuimicos118.find((p) => p.id === pid.trim()))
    .filter((p): p is ParametroCompleto => !!p && 'nome' in p && 'descricao' in p);

  const tableData = parametrosSelecionados.map((param) => {
    const analise = dado.analises.find(
      (a) => a.parametro === param.id && a.proforma === dado.proforma?.id
    );

    return [
      `${param.id} - ${param.nome}`,
      dado.parametros.find((d) => d.id === param.id)?.valor?.toString() ?? 'N/A',
      analise?.valorfinal?.toString() ?? '-',
      analise?.usuario?.toString() ?? '-',
    ];
  });


  autoTable(doc, {
    startY: 108,
    head: [['Elemento', 'Custo em MZN', 'Resultado da análise', 'Analisador']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 200;

  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  doc.setFontSize(12);
  doc.text('Assinatura do Técnico Responsável', centerX, finalY + 20, { align: 'center' });

  doc.setFontSize(10);  
  doc.setFont('helvetica', 'bold');
  doc.text('_____________________________', centerX, finalY + 30, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  doc.text(`${dado.usuario.nome}`, centerX, finalY + 37, { align: 'center' });


  const dataStr = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  doc.save(`${dado.cliente.nome || 'relatorio'}_${dataStr}.pdf`);
};
