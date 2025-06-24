import { component$, useSignal, useStore, $, useTask$ } from "@builder.io/qwik";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import type { Cliente, Proforma, Parametro, Analise } from "~/components/entidade";
import { clientes, parametros, proformas, analises, elementosQuimicos118 } from "~/components/dado";
import { relatorioEmPDF2  } from "~/components/geradorRelatorio";

// Função para avaliar expressões matemáticas simples
const evaluateExpression = (expression: string): number => {
  try {
    const safeEval = new Function(`return ${expression}`);
    const result = safeEval();
    return Number.isFinite(result) ? Number(result.toFixed(2)) : NaN;
  } catch (error) {
    return NaN;
  }
};

export default component$(() => {
  const carregando = useSignal(false);
  const visualizacaoTabela = useSignal(false);
  const isActiveModalCliente = useSignal<null | "relatorio">(null);
  const isSelected = useSignal<Partial<Proforma> | null>(null);

const state = useStore<{
  clientes: Cliente[];
  parametros: Parametro[];
  parametrosEs: Parametro[];
  proformas: Proforma[];
  analises: Analise[];
  camposNecessarios: string[];
  valores: string[];
  formulaPreenchida: string | number;
  resultadoFormulaPreenchida: number;
  dadosParaRelatorio: {
    cliente: Partial<Cliente>;
    proforma: Partial<Proforma>;
    parametros: Parametro[];
    analises: Analise[];
  };
  form: {
    proforma: Partial<Proforma>;
    parametro: Partial<Parametro>;
    analise: Partial<Analise>;
    erro: string;
    mensagem: string;
  };
  erro: string;
  mensagem: string;
}>({
  clientes: [],
  parametros: [],
  parametrosEs: [],
  proformas: [],
  analises: [],
  camposNecessarios: [],
  valores: [],
  formulaPreenchida: 0,
  resultadoFormulaPreenchida: 0,
  dadosParaRelatorio: {
    cliente: {},
    proforma: {},
    parametros: [],
    analises: [],
  },
  form: {
    proforma: {},
    parametro: {},
    analise: {},
    erro: "",
    mensagem: "",
  },
  erro: "",
  mensagem: "",
});


  useTask$(async () => {
    // Simula carregamento de API
    state.clientes = clientes;
    state.parametros = parametros;
    state.proformas = proformas;
    state.analises = analises;

  });

  useTask$(({ track }) => {
    track(() => state.form.analise.proforma);
    if (!state.form.analise.proforma) return;

    const proforma = state.proformas.find((d) => d.id === state.form.analise.proforma);
    if (proforma) {
      state.form.proforma = proforma;
      state.parametrosEs = proforma.parametros
        .split(",")
        .map((param) => state.parametros.filter((p) => p.id === param))
        .flat();
      state.camposNecessarios = [];
      state.valores = [];
    }
  });

  useTask$(({ track }) => {
    track(() => state.form.analise.parametro);
    if (!state.form.analise.parametro) return;

    const parametro = state.parametros.find((d) => d.id === state.form.analise.parametro);
    if (parametro) {
      state.form.parametro = parametro;
      state.camposNecessarios = parametro.campos?.split(",") || [];
    }
    state.valores = [];
  });

  useTask$(({ track }) => {
    track(() => state.mensagem);
    if (state.mensagem) {
      setTimeout(() => {
        state.mensagem = "";
      }, 4000);
    }
  });

  useTask$(({ track }) => {
    track(() => state.erro);
    if (state.erro) {
      setTimeout(() => {
        state.erro = "";
      }, 6000);
    }
  });


  const calcular = $(() => {
    if (Object.keys(state.form.analise).length > 0) {
      state.valores = state.camposNecessarios.map((campo) => `${campo}: ${state.form.analise[campo] ?? "0"}`);
      const parametroSelecionado = state.form.parametro;
      if (parametroSelecionado?.formula) {
        let formula = parametroSelecionado.formula;
        state.camposNecessarios.forEach((campo) => {
          const valor = Number(state.form.analise[campo]) || 0;
          const regex = new RegExp(`\\b${campo}\\b`, "g");
          formula = formula.replace(regex, valor.toString());
        });
        state.formulaPreenchida = formula;
        const resultado = evaluateExpression(formula);
        if (Number.isFinite(resultado)) {
          state.formulaPreenchida = resultado;
          state.resultadoFormulaPreenchida = resultado;
        } else {
          state.formulaPreenchida = "Erro na fórmula";
          state.resultadoFormulaPreenchida = 0;
        }
      }
    }
  });

  const addAnalise = $((e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const dados = Object.fromEntries(new FormData(form).entries());

    const novaAnalise: Analise = {
      id: crypto.randomUUID(),
      proforma: state.form.analise.proforma!,
      parametro: state.form.analise.parametro!,
      valorfinal: state.resultadoFormulaPreenchida,
      data: new Date().toLocaleDateString("pt-BR"),
      ...state.camposNecessarios.reduce(
        (acc, campo) => ({
          ...acc,
          [campo]: Number(dados[campo]) || 0,
        }),
        {}
      ),
    };

    state.analises.push(novaAnalise);
    // Atualiza o estado da proforma para "analisada" após adicionar análise
    const proformaIndex = state.proformas.findIndex((p) => p.id === novaAnalise.proforma);
    if (proformaIndex !== -1) {
      state.proformas[proformaIndex].estado = "analisada";
    }
    form.reset();
    state.mensagem = "Análise salva com sucesso!";
  });

  const gerarRelatorioPDF = $(() => {
    if (!state.dadosParaRelatorio ) {
      state.erro = "Dados incompletos para o relatório";
      console.log(state.dadosParaRelatorio)
      return;
    }
    
    relatorioEmPDF2({
      dado: state.dadosParaRelatorio,
      titulo: "Relatório de Escolas",
    });
  });




  return (
    <>
      <Header/>
      {carregando.value && (
        <div class="p-4 max-w-screen-lg mx-auto flex min-h-screen items-center justify-center bg-gray-100">
          <div class="bg-white p-8 rounded-2xl shadow-lg text-center w-full max-w-md">
            <p class="text-gray-600 mb-6">Estamos carregando seu ambiente personalizado...</p>
            <div class="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid mx-auto"></div>
          </div>
        </div>
      )}
      <main class="p-4 max-w-screen-lg mx-auto mt-10">
        <h2 class="text-lg font-semibold uppercase">Calcular</h2>
        <form preventdefault:submit onSubmit$={addAnalise} class="bg-white p-4 rounded-xl shadow mb-6">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              name="proforma"
              value={state.form.analise.proforma}
              class="border p-2 rounded"
              onChange$={(e) => (state.form.analise.proforma = (e.target as HTMLInputElement).value)}
            >
              <option disabled selected>
                Selecione a proforma
              </option>
              {state.proformas
                .filter((d) => d.estado === "por analisar")
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {`${state.clientes.find((dc) => dc.id === d.cliente)?.nome ?? "Desconhecido"} --- ${d.nome} --- ${d.data} --- ${d.parametros}`}
                  </option>
                ))}
            </select>
            <select
              name="parametro"
              value={state.form.analise.parametro}
              class="border p-2 rounded"
              onChange$={(e) => (state.form.analise.parametro = (e.target as HTMLInputElement).value)}
            >
              <option disabled selected>
                Selecione o parametro
              </option>
              {state.parametrosEs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id}
                </option>
              ))}
            </select>
            {state.camposNecessarios.map((campo) => (
              <input
                key={campo}
                name={campo}
                placeholder={campo}
                type="number"
                required
                class="border p-2 rounded"
                onChange$={(e) => (state.form.analise[campo] = Number((e.target as HTMLInputElement).value))}
              />
            ))}
          </div>
          <div class="mt-4 text-right">
            <label class="me-10">Resultado do cálculo: {state.resultadoFormulaPreenchida}</label>
            <button type="button" onClick$={calcular} class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 me-2">
              Calcular
            </button>
            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Salvar
            </button>
          </div>
        </form>
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold uppercase">Análises terminadas</h2>
          <button
            class="text-sm text-blue-700 underline"
            onClick$={() => (visualizacaoTabela.value = !visualizacaoTabela.value)}
          >
            {visualizacaoTabela.value ? "Cartões" : "Tabela"}
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {state.proformas
            .filter((d) => d.estado === "analisada")
            .map((proforma, i) => {
              const analises = state.analises.filter((a) => a.proforma === proforma.id);
              return (
                <div key={i} class="bg-white border border-gray-200 p-6 rounded-2xl shadow-md">
                  <div class="mb-4">
                    <h3 class="font-bold text-gray-800 uppercase">
                      {state.clientes.find((d) => d.id === proforma.cliente)?.nome ?? "Desconhecido"}
                    </h3>
                    <p class="text-sm text-blue-500">{proforma.nome}::{proforma.data}</p>
                  </div>
                  <div class="space-y-2">
                    {analises.length > 0 ? (
                      analises.map((analise, j) => (
                        <div key={j} class="bg-gray-50 rounded-lg p-3 border">
                          <p class="text-sm text-gray-700">
                            <strong class="text-gray-900">Parâmetro:</strong> {analise.parametro} - {elementosQuimicos118.find((p) => p.id === analise.parametro)?.nome ?? analise.parametro}
                          </p>
                          <p class="text-sm text-gray-700">
                            <strong class="text-gray-900">Resultado:</strong> {analise.valorfinal}
                          </p>
                          <p class="text-sm text-gray-700">
                            <strong class="text-gray-900">Data:</strong> {analise.data}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p class="italic text-gray-400 text-sm">Nenhuma análise encontrada.</p>
                    )}
                  </div>
                  <div class="mt-4 flex justify-end">
                    <button
                      class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow"
                      onClick$={() => {
                        isSelected.value = proforma;
                        isActiveModalCliente.value = "relatorio";
                      }}
                    >
                      Ver Relatório
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </main>
      {isActiveModalCliente.value === "relatorio" && (
        <div class="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-start overflow-y-auto">
          <div class="bg-white p-6 mt-10 rounded-xl shadow-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button
              class="absolute top-2 right-2 text-gray-600 hover:text-black"
              onClick$={() => (isActiveModalCliente.value = null)}
            >
              ✕
            </button>
            <h3 class="text-lg font-semibold mb-4">Relatório da Proforma</h3>
            {isSelected.value && (
              <>
                <div id="relatorio-pdf" class="p-4 bg-white">
                  <p>
                    <strong>Cliente:</strong>{" "}
                    {state.clientes.find((c) => c.id === isSelected.value?.cliente)?.nome ?? "Desconhecido"}
                  </p>
                  <p>
                    <strong>Proforma:</strong> {isSelected.value.nome}
                  </p>
                  <p>
                    <strong>Data:</strong> {isSelected.value.data}
                  </p>
                  <p>
                    <strong>Parâmetros:</strong>
                  </p>
                  <div class="grid grid-cols-3 gap-2 mt-2">
                    {isSelected.value?.parametros?.split(',').map((pid) => {
                      const parametro = elementosQuimicos118.find(p => p.id === pid.trim());
                      return parametro ? (
                        <div
                          class={`border p-2 rounded ${
                            state.analises.find((d) => d.parametro === parametro.id && d.proforma === isSelected.value?.id)?.valorfinal
                              ? 'bg-green-100'
                              : 'bg-red-50'
                          }`}
                          key={pid}
                        >
                          <p class="text-sm font-semibold">{parametro.nome}</p>
                          <p class="text-xs text-gray-600">{parametro.id}</p>
                          <p class="text-xs text-gray-600">{state.parametros.find((d)=> d.id === parametro.id)?.valor} MZN</p>
                          <p class="text-xs text-gray-600">{state.analises.find((d)=> d.parametro === parametro.id && d.proforma === isSelected.value?.id )?.valorfinal || "Por analisar"}</p>
                        </div>
                      ) : (
                        <div class="border p-2 rounded bg-red-100" key={pid}>
                          <p class="text-sm text-red-600">Não encontrado: {pid}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p>
                    <strong>Total pago:</strong> {isSelected.value.totalpagar}
                  </p>
                </div>
                <button
                  onClick$={() => {
                    state.dadosParaRelatorio.cliente = state.clientes.find((c) => c.id === isSelected.value?.cliente) || {};
                    state.dadosParaRelatorio.proforma = isSelected.value || {};
                    state.dadosParaRelatorio.parametros = state.parametros;
                    state.dadosParaRelatorio.analises = state.analises;
                    gerarRelatorioPDF();
                  }}
                  class="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Baixar PDF
                </button>


              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Mensagem */}
      {state.mensagem && (
        <div class="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div class="bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded shadow-xl max-w-sm text-center relative">
            <button class="absolute top-2 right-2 text-green-700 hover:text-green-900" onClick$={() => state.mensagem = ""}>✕</button>
            <p>{state.mensagem}</p>
          </div>
        </div>
      )}

      {/* Modal de Erro */}
      {state.erro && (
        <div class="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div class="bg-red-100 border border-red-400 text-red-800 px-6 py-4 rounded shadow-xl max-w-sm text-center relative">
            <button class="absolute top-2 right-2 text-red-700 hover:text-red-900" onClick$={() => state.erro = ""}>✕</button>
            <p>{state.erro}</p>
          </div>
        </div>
      )}  

      <Footer />
    </>
  );
});
