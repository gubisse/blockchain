
// //relatoriopdf

// import { $ } from "@builder.io/qwik";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";

// import type { Alunos, Escola, Professor, Usuario } from "./entidade"; // Importando a função

// export const generatePDFReportProfessores = $(
//   ({ lista, procurado, escola }: { lista: Professor[]; procurado: string; escola: Escola | null }) => {
//     if (!escola) {
//       console.log("Nenhuma escola selecionada para o relatório.");
//       return; // Ou lidar com o caso de null de outra forma
//     }
//     console.log(`Gerando relatório para ${escola.nome} com ${lista.length} professores`);
//     console.log(`Termo procurado: ${procurado}`);

//     const doc = new jsPDF();
//     doc.text(`Relatório de Professores da ${escola.nome}`, 10, 10);

//     // Filtrando professores com base no termo procurado
//     const filteredProfessores = lista.filter((dado) =>
//       dado.id_escola === escola.id
//     );


//     const tableColumn = ["ID", "Nome", "Contacto", "Disciplina"];
//     const tableRows = filteredProfessores.map((professor) => [
//       professor.id,
//       professor.nome,
//       professor.contacto,
//       professor.formacao || "N/A", // Adicionando um campo extra para disciplina
//     ]);

//     // Criando a tabela no PDF
//     autoTable(doc, {
//       head: [tableColumn],
//       body: tableRows,
//       startY: 20,
//     });

//     // Baixando o arquivo
//     doc.save(`relatorio_professores_${new Date().toISOString().split("T")[0]}.pdf`);
//   }
// );

// export const generatePDFReportProfessoresDoDistrito = $(
//   ({ lista, procurado, usuario }: { lista: Professor[]; procurado: string; usuario: Usuario }) => {
//     if (!lista) {
//       console.log("Nenhuma lista de professor tem esse sistema.");
//       return; // Ou lidar com o caso de null de outra forma
//     }
//     console.log(`Gerando relatório para ${usuario.name} com ${lista.length} professores`);
//     console.log(`Termo procurado: ${procurado}`);

//     // Filtrando professores com base no termo procurado
//     const filteredProfessores = lista.filter((dado) =>
//       dado.id_escola === usuario.id
//     );

//     const doc = new jsPDF();
//     doc.text(`Professores do distrito de ${usuario.Usuarioname}`, 10, 10);

//     const tableColumn = ["ID", "Nome", "Contacto", "Disciplina"];
//     const tableRows = filteredProfessores.map((professor) => [
//       professor.id,
//       professor.nome,
//       professor.contacto,
//       professor.formacao || "N/A", // Adicionando um campo extra para disciplina
//     ]);

//     // Criando a tabela no PDF
//     autoTable(doc, {
//       head: [tableColumn],
//       body: tableRows,
//       startY: 20,
//     });

//     // Baixando o arquivo
//     doc.save(`relatorio_professores_${new Date().toISOString().split("T")[0]}.pdf`);
//   }
// );


// export const generatePDFReportEscolas = $(
//   ({ lista, procurado, usuario }: { lista: Escola[]; procurado: string; usuario: Usuario }) => {
  
//     const doc = new jsPDF();
//     doc.text(`Relatório das escolas do distrito de ${usuario.website}`, 10, 10);

//     console.log(usuario)

//     // Garantir que estamos usando os dados filtrados e paginados atuais
//     const filteredEscolas = lista.filter((dado) =>
//       dado.nome.toLowerCase().includes(procurado.toLowerCase()) ||
//       dado.id_posto_administrativo.toString().toLowerCase().includes(procurado.toLowerCase())
//     );

//     const tableColumn = ["ID", "Nome da escola", "Posto Admini", "Diretor Pedagogico", "Diretor Adjunto"];
//     const tableRows = filteredEscolas.map((dado) => [
//       dado.id,
//       dado.nome,
//       dado.id_posto_administrativo,
//       dado.nome,
//       dado.nome,
//     ]);

//     autoTable(doc, { // Use autoTable como função diretamente
//       head: [tableColumn],
//       body: tableRows,
//       startY: 20,
//     });

//     doc.save(`relatorio_escolas_${new Date().toISOString().split("T")[0]}.pdf`);
//   }
// );


// export const generatePDFReportEstatisticaAlunos = $(
//   ({ lista, procurado, usuario }: { lista: Alunos[]; procurado: string; usuario: Usuario }) => {
    
//     const doc = new jsPDF();
//     doc.text(`Relatório Alunos do distrito de ${usuario.website}`, 10, 10);

//     console.log(usuario)

//     // Garantir que estamos usando os dados filtrados e paginados atuais
//     const filtered = lista.filter((dado) =>
//       dado.id.toString().toLowerCase().includes(procurado.toLowerCase()) ||
//       dado.id.toString().toLowerCase().includes(usuario.id.toString().toLowerCase())
//     );

//     const tableColumn = ["ID", "Nome da escola", "Ano letivo", "Matriculados", "Desistentes", "S.Positiva"];
//     const tableRows = filtered.map((dado) => [
//       dado.id,
//       dado.id_escola,
//       dado.ano_letivo,
//       dado.quantidade_matriculados,
//       dado.quantidade_desistente,
//       dado.quantidade_situacao_positiva

//     ]);

//     autoTable(doc, { // Use autoTable como função diretamente
//       head: [tableColumn],
//       body: tableRows,
//       startY: 20,
//     });

//     doc.save(`relatorio_escolas_${new Date().toISOString().split("T")[0]}.pdf`);

//   }
// );