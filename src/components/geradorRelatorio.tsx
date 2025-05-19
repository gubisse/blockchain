import { $ } from "@builder.io/qwik";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Cliente, Proforma, Parametro, Analise, ElementosQuimicos118 } from "./entidade";
import { elementosQuimicos118 } from "./dado";

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
};

// Interface para garantir compatibilidade com Parametro
interface ParametroCompleto extends Parametro {
  nome: string;
  descricao: string;
}

export const relatorioEmPDF2 = ({
  dado,
  titulo = 'Relatório de Análise',
}: {
  dado: DadosParaRelatorio;
  titulo?: string;
}) => {
  const doc = new jsPDF();

  try {
    doc.addImage('logo.png', 'PNG', 10, 10, 40, 20);
  } catch (e) {
    doc.setFontSize(12);
    doc.text('LOGO', 10, 20);
  }

  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text('xAI Analytics', 120, 15);
  doc.setFontSize(10);
  doc.text('Av. das Empresas, Chimoio, Moçambique', 120, 22);
  doc.text('Email: contact@xaianalytics.com', 120, 27);
  doc.text('Telefone: +258 123 456 789', 120, 32);

  doc.setLineWidth(0.5);
  doc.line(10, 38, 200, 38);

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(titulo, 105, 48, { align: 'center' });

  doc.setFontSize(12);
  doc.text('Detalhes do Cliente', 10, 60);
  doc.setFontSize(10);
  doc.text(`Nome: ${dado.cliente.nome || 'N/A'}`, 10, 68);
  doc.text(`Telefone: ${dado.cliente.telefone || 'N/A'}`, 10, 74);
  doc.text(`Email: ${dado.cliente.email || 'N/A'}`, 10, 80);
  doc.text(`Morada: ${dado.cliente.morada || 'N/A'}`, 10, 86);

  doc.setFontSize(12);
  doc.text('Detalhes da Proforma', 150, 60);
  doc.setFontSize(10);
  doc.text(`Nome: ${dado.proforma.nome || 'N/A'}`, 150, 68);
  doc.text(`Data: ${dado.proforma.data || 'N/A'}`, 150, 74);
  doc.text(`Estado: ${dado.proforma.estado || 'N/A'}`, 150, 80);
  doc.text(`Total pago: ${dado.proforma.totalpagar || 0} MZN`, 150, 86);

  doc.setFontSize(12);
  doc.text('Parâmetros Analisados', 10, 100);

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
      dado.parametros.find((d) => d.id === param.id)?.valor ?? 'N/A',
      analise ? analise.resultado?.toString() ?? 'Por analisar' : 'Por analisar',
      `${param.valor ?? 0} MZN`,
    ];
  });

  autoTable(doc, {
    startY: 108,
    head: [['Elemento', 'Custo', 'Resultado da análise', 'Valor']],
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

  doc.setFontSize(12);
  doc.text('Assinatura do Técnico Responsável', 10, finalY + 20);
  doc.setFontSize(10);
  doc.text('_____________________________', 10, finalY + 30);
  doc.text('Nome: [Nome do Emissor]', 10, finalY + 37);

  const dataStr = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  doc.save(`${dado.cliente.nome || 'relatorio'}_${dataStr}.pdf`);
};