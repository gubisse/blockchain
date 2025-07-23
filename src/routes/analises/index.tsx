import { component$, useSignal, useStore, $, useTask$, useComputed$, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$ } from '@builder.io/qwik-city';
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import type { Usuario, Cliente, Proforma, Parametro, Analise, Comprovativo } from "~/components/entidade";
import { elementosQuimicos118 } from "~/components/dado";
import { getAllDados } from "~/components/DTO";
import { formatarDataMZ, formatarDataHora, VerificarLogin } from "~/components/util";
import { relatorioEmPDF2  } from "~/components/geradorRelatorio";
import { createAddAnaliseAction, createEditProformaAction, createDeleteByIdAction } from '~/lib/action';

export const useGetUsuarios = routeLoader$(async () => getAllDados<Usuario>('usuario'));
export const useGetClientes = routeLoader$(async () => getAllDados<Cliente>('cliente'));
export const useGetProformas = routeLoader$(async () => getAllDados<Proforma>('proforma'));
export const useGetParametros = routeLoader$(async () => getAllDados<Parametro>('parametro'));
export const useGetAnalises = routeLoader$(async () => getAllDados<Analise>('analise'));
export const useGetComprovativos = routeLoader$(async () => getAllDados<Comprovativo>('comprovativo'));

export const useDeleteCliente = createDeleteByIdAction("cliente");

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
  const isActiveModalCliente = useSignal<null | "relatorio">(null);
  const isSelected = useSignal<Partial<Proforma> | null>(null);

  const logado = useSignal<Usuario | null>(null);

  // Verifica o login no lado do cliente
  useVisibleTask$(async () => {
    const logar = await VerificarLogin();
    logado.value = logar.usuario;
  });

  // Usado para pesquisar
  const isSearch = useSignal("");
  
  const selectedColumn = useSignal<keyof Cliente | keyof Analise>("nome"); // valor inicial em branco

  const itemsPerPage = 9;
  const paginaCorrente = useSignal(1);

  // Loader de dados

  const usuariosLoader = useGetUsuarios();
  const clientesLoader = useGetClientes();
  const proformasLoader = useGetProformas();
  const analisesLoader = useGetAnalises();
  const parametrosLoader = useGetParametros();
  const comprovativosLoader = useGetComprovativos();

  const addAnaliseAction = useAddAnalise();
  const editProformaAction = useEditProforma();

  const state = useStore<{
    usuarios: Usuario[];
    clientes: Cliente[];
    parametros: Parametro[];
    parametrosEs: Parametro[];
    parametrosNaoEncontrados: string[];
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
      usuario: Partial<Usuario>;
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
    usuarios: [],
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
      usuario: {},
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

  // escutador de novos dados
  useTask$(async ({ track }) => {
    const usuarios = await track(() => usuariosLoader.value);
    const clientes = await track(() => clientesLoader.value);
    const proformas = await track(() => proformasLoader.value);
    const analises = await track(() => analisesLoader.value);
    const parametros = await track(() => parametrosLoader.value);
    const comprovativos = await track(() => comprovativosLoader.value);

    state.usuarios = usuarios;
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
    if (!proforma) return;

    const ids = proforma.parametros.split(",").map((id) => id.trim());

    // Parâmetros encontrados
    state.parametrosEs = ids
      .map((id) => state.parametros.find((p) => p.id === id))
      .filter((p): p is Parametro => p !== undefined);

    // Parâmetros não encontrados
    state.parametrosNaoEncontrados = ids.filter(
      (id) => !state.parametros.some((p) => p.id === id)
    );

    // Limpa os campos e valores anteriores
    state.camposNecessarios = [];
    state.valores = [];
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

  // Calculador
  const calcular = $(() => {
    if (Object.keys(state.form.analise).length === 0) return;
    console.log("Calculando ", state.form.analise)
    // Geração de valores visuais (ex: "altura: 10")
    state.valores = state.camposNecessarios.map((campo) => {
      const val = state.form.analise.campos?.[campo];
      return `${campo}: ${val ?? "0"}`;
    });

    const parametroSelecionado = state.form.parametro;
    if (!parametroSelecionado?.formula) return;

    let formula = parametroSelecionado.formula;

    state.camposNecessarios.forEach((campo) => {
      const raw = state.form.analise.campos?.[campo];
      let valor = Number(raw);
      if (isNaN(valor)) valor = 0;

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
  });

  // Função para adicionar uma nova análise
  const addAnalise = $(async (e: Event) => {
    e.preventDefault(); // Impede o recarregamento da página após o submit
    carregando.value = true; // Ativa o indicador de carregamento

    // Captura os dados do formulário
    const form = e.target as HTMLFormElement;
    const dados = Object.fromEntries(new FormData(form).entries());

    // ID da proforma e parâmetro selecionado no formulário
    const proformaId = state.form.analise.proforma!;
    const parametro = state.form.analise.parametro!;

    // Verifica se já existe uma análise para essa proforma e esse parâmetro
    const jaExiste = state.analises.some(
      (a) => a.proforma === proformaId && a.parametro === parametro
    );
    if (jaExiste) {
      carregando.value = false;
      state.erro = "Já existe uma análise com esta proforma e este parâmetro.";
      return; // Interrompe se já existir
    }

    // Monta o objeto novaAnalise com os campos necessários
    const novaAnalise: Analise = {
      proforma: proformaId,
      parametro,
      valorfinal: state.resultadoFormulaPreenchida, // resultado calculado
      data: new Date().toISOString(), // data atual no formato ISO
      campos: state.camposNecessarios.reduce(
        (acc, campo) => ({ ...acc, [campo]: Number(dados[campo]) || 0 }),
        {} // objeto com os campos preenchidos convertidos em números
      ),
      usuario: logado.value?.id || '' // ID do usuário logado
    };

    // Envia a nova análise para o backend
    const r = await addAnaliseAction.submit(novaAnalise as unknown as Record<string, unknown>);
    if (!r?.value?.success) {
      carregando.value = false;
      state.erro = r?.value?.message; // Exibe erro, se houver
      return;
    }
    state.analises.push(novaAnalise)

    // Busca a proforma correspondente para atualizar seu estado
    const proformaFind = state.proformas.find((p) => p.id === proformaId);
    if (proformaFind) {
      // Lista de parâmetros esperados (definidos na proforma)
      const esperados = proformaFind.parametros
        .split(",") // separa por vírgula
        .map(p => p.trim()) // remove espaços
        .filter(Boolean); // remove strings vazias

      // Parâmetros que já foram analisados
      const analisados = state.analises
        .filter(a => a.proforma === proformaId)
        .map(a => a.parametro);

      // Define o estado da proforma conforme a situação das análises
      let estadoFinal = "Pendente";
      if (analisados.length > 0) {
        const faltando = esperados.filter(p => !analisados.includes(p));
        estadoFinal = faltando.length === 0 ? "Completa" : "inCompleta";
      }
      proformaFind.estado = estadoFinal; // Atualiza o estado da proforma

      // Envia a proforma atualizada para o backend
      const rep = await editProformaAction.submit(proformaFind as unknown as Record<string, unknown>);
      if (!rep?.value?.success) {
        carregando.value = false;
        state.erro = rep?.value?.message; // Exibe erro, se houver
        return;
      }
    }

    form.reset(); // Limpa o formulário
    carregando.value = false; // Desativa o carregamento
    state.mensagem = "Análise salva com sucesso!"; // Mensagem de sucesso
  });




  // Filtragem e paginação
  const filtrado = useComputed$(() => {
    const termo = isSearch.value?.toLowerCase().trim();

    const proformasValidas = state.proformas.filter(
      (proforma) =>
        (proforma.estado === "Completa" || proforma.estado === "inCompleta") &&
        state.comprovativos.some((c) => c.proforma === proforma.id)
    );

    const lista = proformasValidas.map((proforma) => {
      const cliente = state.clientes.find((c) => c.id === proforma.cliente);
      const analises = state.analises.filter((a) => a.proforma === proforma.id);
      return { proforma, cliente, analises };
    });

    // Se não há busca, retorna tudo
    if (!termo || !selectedColumn.value) return lista;

    return lista.filter(({ cliente, analises }) => {
      const campo = selectedColumn.value;
      if (!campo || !termo) return true; // nenhum filtro ativo

      // 1. Tentativa com cliente
      const valorCliente = cliente?.[campo as keyof Cliente];
      if (typeof valorCliente === "string" && valorCliente.toLowerCase().includes(termo)) {
        return true;
      }

      // 2. Tentativa com análises (apenas se existir alguma)
      return analises.some((analise) => {
        const valor = analise[campo as keyof Analise];
        if (!valor) return false;

        if (campo === "data") {
          return formatarDataHora(valor.toString())?.includes(termo);
        }

        return valor.toString().toLowerCase().includes(termo);
      });
    });
  });

  const totalPaginas = useComputed$(() => Math.ceil(filtrado.value.length / itemsPerPage));
  const paginado = useComputed$(() => {
    const start = (paginaCorrente.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filtrado.value.slice(start, end);
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
                    proforma.estado !== "Completa" &&
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
                  onChange$={(e) => {
                    if (!state.form.analise.campos) {
                      state.form.analise.campos = {};
                    }
                    state.form.analise.campos[campo] = Number((e.target as HTMLInputElement).value || "0");
                  }}
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
              value={selectedColumn.value}
              onChange$={(e) =>
                (selectedColumn.value = (e.target as HTMLSelectElement).value as any)
              }
            >
              <option value="">Pesquisar por</option>
              <option value="nome">Nome</option>
              <option value="telefone">Telefone</option>
              <option value="email">Email</option>
              <option value="morada">Morada</option>
              <option value="data">Data da Análise</option>
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
          {paginado.value.map(({ proforma, cliente, analises }) => (
            <div key={proforma.id} class="bg-white border border-gray-200 p-6 rounded-2xl shadow-md">
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
          ))}
        </div>

        {paginado?.value?.length !== 0 && totalPaginas.value !== 1 && (
          <div class="flex justify-center items-center mt-3 gap-3">
            <button
              class="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              onClick$={() => (paginaCorrente.value = Math.max(1, paginaCorrente.value - 1))}
              disabled={paginaCorrente.value === 1}
            >
              Anterior
            </button>
            <span>
              {paginaCorrente.value} de {totalPaginas.value}
            </span>
            <button
              class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              onClick$={() => (paginaCorrente.value = Math.min(totalPaginas.value, paginaCorrente.value + 1))}
              disabled={paginaCorrente.value === totalPaginas.value}
            >
              Próxima
            </button>
          </div>
        )}
        {paginado?.value?.length === 0 && (
          <div class="bg-white border p-4 rounded-xl shadow-sm mt-4">
            <p class="text-sm text-gray-600"><strong>Nenhuma analise cadastrada</strong></p>
          </div>
        )}


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
                    <strong>Data:</strong> {formatarDataMZ(isSelected.value.data || "")}
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
                          <hr/>
                          <p class="text-xs text-gray-600">
                            {
                              state.usuarios.find((u) =>
                                u.id === state.analises.find((d) =>
                                  d.parametro === parametro.id &&
                                  d.proforma === isSelected.value?.id
                                )?.usuario
                              )?.nome || "Sem usuário"
                            }
                          </p>

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
                    state.dadosParaRelatorio.usuario = logado.value || {};
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
      {carregando.value && (
        <div class="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div class="bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded shadow-xl max-w-sm text-center relative">
            {carregando.value && (
              <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div class="bg-white p-8 rounded-2xl shadow-lg text-center w-full max-w-md">
                  <p class="text-gray-600 mb-6">Trabalhando...</p>
                  <div class="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid mx-auto"></div>
                </div>
              </div>
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
