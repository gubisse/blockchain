import { $ } from "@builder.io/qwik";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Gera um relatório em PDF a partir de uma lista genérica de dados
 * @param dado - Array de objetos para gerar o relatório
 * @param titulo - Título opcional do relatório
 */
export const relatorioEmPDF = $(
  ({ dado, titulo }: { dado: any[]; titulo?: string }) => {
    if (!Array.isArray(dado) || dado.length === 0) {
      console.warn("Nenhum dado fornecido para gerar o relatório.");
      return;
    }

    const doc = new jsPDF();

    // Título
    const nomeTitulo = titulo || "Relatório Genérico";
    doc.text(nomeTitulo, 10, 10);

    // Cabeçalhos baseados nas chaves do primeiro objeto
    const tableColumn = Object.keys(dado[0]);
    const tableRows = dado.map((item) =>
      tableColumn.map((key) => item[key] ?? "")
    );

    // Tabela
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    // Nome do arquivo com data
    const nomeArquivo = nomeTitulo.toLowerCase().replace(/ /g, "_");
    const data = new Date().toISOString().split("T")[0];
    doc.save(`${nomeArquivo}_${data}.pdf`);
  }
);
export const relatorioEmPDF2 = $(
  ({ dado, titulo }: { dado: any; titulo?: string }) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(titulo || "Relatório", 20, 20); // evitar erro TS2345

    doc.setFontSize(12);
    doc.text(`Cliente: ${dado.cliente.nome}`, 20, 40);
    doc.text(`Proforma: ${dado.proforma.nome}`, 20, 50);
    doc.text(`Data: ${dado.proforma.data}`, 20, 60);
    doc.text("Parâmetros:", 20, 70);

    let y = 80;

    dado.parametros.forEach((param: any) => {
      doc.text(
        `${param.nome} (${param.id}): ${param.valorfinal || "Por analisar"} (Valor: ${param.valor} MZN)`,
        20,
        y
      );
      y += 10;
    });

    doc.text(`Total pago: ${dado.proforma.totalpagar}`, 20, y + 10);
    doc.save("relatorio_.pdf");
  }
);
