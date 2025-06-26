import { component$, useSignal, useStore, $, useTask$ } from "@builder.io/qwik";
import { routeLoader$ } from '@builder.io/qwik-city';
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import type { Cliente, Proforma, Parametro, Analise, Comprovativo } from "~/components/entidade";
import { elementosQuimicos118 } from "~/components/dado";
import { getAllDados } from "~/components/DTO";
import { formatarDataMZ } from "~/components/util";
import { relatorioEmPDF2  } from "~/components/geradorRelatorio";
import { createAddAnaliseAction, createEditProformaAction } from '~/lib/action';



export const useGetClientes = routeLoader$(async () => getAllDados<Cliente>('cliente'));
export const useGetProformas = routeLoader$(async () => getAllDados<Proforma>('proforma'));
export const useGetParametros = routeLoader$(async () => getAllDados<Parametro>('parametro'));
export const useGetAnalises = routeLoader$(async () => getAllDados<Analise>('analise'));
export const useGetComprovativos = routeLoader$(async () => getAllDados<Comprovativo>('comprovativo'));

export const useAddAnalise = createAddAnaliseAction<Analise>("analise")
export const useEditProforma = createEditProformaAction<Proforma>("proforma")

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


  const isSearch = useSignal("");
  const selectedColumn = useSignal<keyof Cliente>("nome");
  const itemsPerPage = 9;
  const paginaCorrente = useSignal(1);

  const clientesLoader = useGetClientes();
  const proformasLoader = useGetProformas();
  const analisesLoader = useGetAnalises();
  const parametrosLoader = useGetParametros();
  const comprovativosLoader = useGetComprovativos();

  const addAnaliseAction = useAddAnalise();
  const editProformaAction = useEditProforma();

  const state = useStore<{
    clientes: Cliente[];
    parametros: Parametro[];
    parametrosEs: Parametro[];
    parametrosNaoEncontrados: Parametro[];
    proformas: Proforma[];
    comprovativos: Comprovativo[];
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
    parametrosNaoEncontrados: [],
    proformas: [],
    comprovativos: [],
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


  useTask$(async ({ track }) => {
    const clientes = await track(() => clientesLoader.value);
    const proformas = await track(() => proformasLoader.value);
    const analises = await track(() => analisesLoader.value);
    const parametros = await track(() => parametrosLoader.value);
    const comprovativos = await track(() => comprovativosLoader.value);

    state.clientes = clientes;
    state.proformas = proformas;
    state.analises = analises;
    state.parametros = parametros;
    state.comprovativos = comprovativos;
  });


  useTask$(({ track }) => {
    track(() => state.form.analise.proforma);
    if (!state.form.analise.proforma) return;

    const proforma = state.proformas.find((d) => d.id === state.form.analise.proforma);
    if (proforma) {

      // Encontrados
      state.parametrosEs = proforma.parametros
        .split(",")
        .map((param) => state.parametros.find((p) => p.id === param))
        .filter(Boolean); // remove undefined

      // Não encontrados
      state.parametrosNaoEncontrados = proforma.parametros
        .split(",")
        .filter((param) => !state.parametros.some((p) => p.id === param));

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
    if (Object.keys(state.form.analise.campos || {}).length > 0) {
      // Exibir os valores que serão usados na fórmula
      state.valores = state.camposNecessarios.map(
        (campo) => `${campo}: ${state.form.analise.campos[campo] ?? "0"}`
      );

      const parametroSelecionado = state.form.parametro;
      if (parametroSelecionado?.formula) {
        let formula = parametroSelecionado.formula;

        // Substitui os campos na fórmula com os valores preenchidos
        state.camposNecessarios.forEach((campo) => {
          const valor = Number(state.form.analise.campos[campo]) || 0;
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


  const addAnalise = $( async (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const dados = Object.fromEntries(new FormData(form).entries());

    const proformaId = state.form.analise.proforma!;
    const parametro = state.form.analise.parametro!;

    // Verifica se já existe uma análise com a mesma proforma e parâmetro
    const jaExiste = state.analises.some(
      (a) => a.proforma === proformaId && a.parametro === parametro
    );
    if (jaExiste) {
      state.mensagem = "Já existe uma análise com esta proforma e este parâmetro.";
      return;
    }

    const novaAnalise: Analise = {
      proforma: proformaId,
      parametro,
      valorfinal: state.resultadoFormulaPreenchida,
      data: new Date().toISOString(),
      campos: state.camposNecessarios.reduce(
        (acc, campo) => ({
          ...acc,
          [campo]: Number(dados[campo]) || 0,
        }),
        {}
      ),
    };

    let r = await addAnaliseAction.submit(novaAnalise as unknown as Record<string, unknown>);
    
    state.analises.push(novaAnalise);
    

    // Atualiza o estado da proforma para "analisada"
    const proformaFind = state.proformas.find((p) => p.id === proformaId);

    if (proformaFind) {
      const esperados = proformaFind.parametros
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p); // remove vazios, se houver

      const analisados = state.analises
        .filter((a) => a.proforma === proformaId)
        .map((a) => a.parametro);

      const naoAnalisados = esperados.filter((param) => !analisados.includes(param));
      const todosAnalisados = naoAnalisados.length === 0;

      proformaFind.estado = todosAnalisados ? "completa" : "incompleta";

      let estadoFinal: string;
      if (analisados.length === 0 && proformaFind.estado === "incompleta" ) {
        estadoFinal = "pendente";
      }else if(analisados.length !== 0 && proformaFind.estado === "incompleta" ){
        estadoFinal = "incompleta";
      }else if(analisados.length !== 0 && proformaFind.estado === "completa" ){
        estadoFinal = "completa";
      }
      proformaFind.estado = estadoFinal;
      
      let rep = await editProformaAction.submit(proformaFind as unknown as Record<string, unknown>);

      console.log(
        "%c[DEBUG ANALISE PROFORMA]",
        "color: blue; font-weight: bold;",
        {
          esperados,
          analisados,
          naoAnalisados,
          proformaAtualizado: proformaFind,
          analiseNovaResposta: r,
          proformaAtualizadoResposta: rep,

        }
      );
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
      titulo: "Relatório da analises da pro-forma",
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
        <form preventdefault:submit onSubmit$={addAnalise} class="bg-white p-6 rounded-xl shadow space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Seleção da Proforma */}
            <div class="flex flex-col">
              <label class="text-sm font-semibold text-gray-700 mb-2">Proforma</label>
              <select
                name="proforma"
                value={state.form.analise.proforma}
                class="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange$={(e) =>
                  (state.form.analise.proforma = (e.target as HTMLSelectElement).value)
                }
              >
                <option selected value="">Selecione a proforma</option>

                {state.proformas
                  .filter((proforma) =>
                    proforma.estado !== "completa" &&
                    state.comprovativos.some((c) => c.proforma === proforma.id)
                  )
                  .map((proforma) => {
                    const cliente = state.clientes.find((c) => c.id === proforma.cliente)?.nome ?? "Desconhecido";
                    const dataFormatada = formatarDataMZ(proforma.data);
                    const label = `${cliente} — ${proforma.nome} — ${dataFormatada} — [${proforma.parametros}]`;
                    return (
                      <option key={proforma.id} value={proforma.id}>
                        {label}
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Campo Parâmetro (aparece somente se tiver parâmetros disponíveis) */}
            {state.parametrosEs.length > 0 && (
              <div class="flex flex-col">
                <label class="text-sm font-semibold text-gray-700 mb-2">Parâmetro</label>
                <select
                  name="parametro"
                  value={state.form.analise.parametro}
                  class="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange$={(e) =>
                    (state.form.analise.parametro = (e.target as HTMLSelectElement).value)
                  }
                >
                  <option value="">Selecione o parâmetro</option>
                  {state.parametrosEs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Campos dinâmicos */}
            {state.camposNecessarios.map((campo) => (
              <div key={campo} class="flex flex-col">
                <label class="text-sm font-semibold text-gray-700 mb-2 capitalize">{campo}</label>
                <input
                  name={campo}
                  placeholder={`Informe o valor de ${campo}`}
                  type="number"
                  required
                  class="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange$={(e) =>
                    (state.form.analise[campo] = Number((e.target as HTMLInputElement).value))
                  }
                />
              </div>
            ))}
          </div>

          {/* Se houver parâmetros não encontrados */}
          {state.parametrosNaoEncontrados.length > 0 && (
            <div class="p-4 bg-red-50 border border-red-300 rounded-lg space-y-2">
              <h2 class="text-red-600 font-semibold">Parâmetros não encontrados:</h2>
              <div class="flex flex-wrap gap-2">
                {state.parametrosNaoEncontrados.map((d) => (
                  <span key={d} class="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full border border-red-300">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resultado e botões */}
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <label class="text-lg font-medium text-gray-800">
              Resultado do cálculo:{" "}
              <span class="font-bold text-blue-700">{state.resultadoFormulaPreenchida}</span>
            </label>
            <div class="flex gap-3">
              <button
                type="button"
                onClick$={calcular}
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold shadow"
              >
                Calcular
              </button>
              <button
                type="submit"
                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold shadow"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>


        <div class="flex justify-between items-center mb-3 mt-3">
          <h2 class="text-lg font-semibold uppercase">Análises terminadas</h2>
                    {/* Filtros e alternância de visualização */}
          <div class="flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center">
            {/* Seletor de coluna para filtrar */}
            <select
              class="border p-2 rounded text-sm"
              onChange$={(e) =>
                (selectedColumn.value = (e.target as HTMLSelectElement).value as keyof Cliente)
              }
            >
              <option value="">Pesquisar por</option>
              <option value="nome">Nome</option>
              <option value="telefone">Telefone</option>
              <option value="email">Email</option>
              <option value="morada">Morada</option>
              <option value="data">Data</option>
            </select>

            {/* Campo de pesquisa */}
            <input
              type="text"
              class="border p-2 rounded text-sm"
              placeholder={selectedColumn.value ? `Procurar por ${selectedColumn.value}...` : "Pesquisar..."}
              onInput$={(e) => {
                isSearch.value = (e.target as HTMLInputElement).value;
                paginaCorrente.value = 1;
              }}
            />

          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {state.proformas
            .filter((proforma) => 
              proforma.estado === "completa" &&
              state.comprovativos.some((c) => c.proforma === proforma.id)
            )
            .map((proforma, i) => {
              const cliente = state.clientes.find((c) => c.id === proforma.cliente);
              const analises = state.analises.filter((a) => a.proforma === proforma.id);

              return (
                <div key={i} class="bg-white border border-gray-200 p-6 rounded-2xl shadow-md">
                  <div class="mb-4">
                    <h3 class="font-bold text-gray-800 uppercase">
                      {cliente?.nome ?? "Desconhecido"}
                    </h3>
                    <p class="text-sm text-blue-500">
                      {proforma.nome} :: {formatarDataMZ(proforma.data)}
                    </p>
                  </div>

                  <div class="space-y-2">
                    {analises.length > 0 ? (
                      analises.map((analise) => (
                        <div key={analise.id} class="bg-gray-50 rounded-lg p-3 border">
                          <p class="text-sm text-gray-700">
                            <strong class="text-gray-900">Parâmetro:</strong>{" "}
                            {analise.parametro} -{" "}
                            {elementosQuimicos118.find((p) => p.id === analise.parametro)?.nome ?? analise.parametro}
                          </p>
                          <p class="text-sm text-gray-700">
                            <strong class="text-gray-900">Resultado:</strong> {analise.valorfinal}
                          </p>
                          <p class="text-sm text-gray-700">
                            <strong class="text-gray-900">Data:</strong> {formatarDataMZ(analise.data)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p class="italic text-gray-400 text-sm">Sem análises encontradas.</p>
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
                    <strong>Data:</strong> {formatarDataMZ(isSelected.value.data)}
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
