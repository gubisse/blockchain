import { component$, useSignal, useStore, $, useTask$ } from "@builder.io/qwik";
import { evaluate } from "mathjs";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import type { Cliente, Proforma, Parametro, Analise } from "~/components/entidade";

export default component$(() => {
  const carregando = useSignal(false);
  const visualizacaoTabela = useSignal(false);
  const isActiveModalCliente = useSignal<null | "relatorio">(null);
  const isSelectedCliente = useSignal<Partial<Proforma> | null>(null);

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
    state.clientes = [
      { id: "a1", nome: "Antonio Miguel Antonio", telefone: "845421639", email: "e@gmail.com", morada: "Bairro 5 Chimoio", data: "12/05/2022" },
      // ... outros dados
    ];
    state.parametros = [
      { id: "Zn", categoria: "Agua", nome: "Cinzas", valor: 1100, campos: "x,y", formula: "x/y" },
      // ... outros dados
    ];
    state.proformas = [
      { id: "a11e", cliente: "a1", nome: "Analise de Agua", parametros: "Zn,Na,Mg", totalpagar: 1000, data: "12/05/2022", estado: "pendentes" },
      { id: "a1e1e", cliente: "a1", nome: "Analise de Agua", parametros: "Zn,Na,Mg", totalpagar: 1000, data: "12/05/2022", estado: "por analisar" },
      // ... outros dados
    ];
    state.analises = [
      { id: "b", proforma: "a11e", parametro: "Zn", valorfinal: 5284, data: "12/05/2022", x: 0, y: 0, z: 2 },
      // ... outros dados
    ];
  });

  useTask$(({ track }) => {
    track(() => state.form.analise.proforma);
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
    const parametro = state.parametros.find((d) => d.id === state.form.analise.parametro);
    if (parametro) {
      state.form.parametro = parametro;
      state.camposNecessarios = parametro.campos?.split(",") || [];
    }
    state.valores = [];
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
        try {
          const resultado = evaluate(formula);
          state.formulaPreenchida = resultado.toFixed(2);
          state.resultadoFormulaPreenchida = resultado;
        } catch (error) {
          console.error("Erro ao calcular fórmula:", error);
          state.formulaPreenchida = "Erro na fórmula";
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
    form.reset();
    state.mensagem = "Análise salva com sucesso!";
  });

  return (
    <>
      <Header />
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
                    {state.clientes.find((dc) => dc.id === d.cliente)?.nome}---{d.nome}---{d.data}---{d.parametros}
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
                  {d.nome}
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
        {state.mensagem && <div class="text-green-600 mb-4">{state.mensagem}</div>}
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
            .filter((d) => d.estado === "pendentes" || d.estado === "analisada")
            .map((proforma, i) => {
              const analises = state.analises.filter((a) => a.proforma === proforma.id);
              return (
                <div key={i} class="bg-white border border-gray-200 p-6 rounded-2xl shadow-md">
                  <div class="mb-4">
                    <h3 class="font-bold text-gray-800 uppercase">
                      {state.clientes.find((d) => d.id === proforma.cliente)?.nome}
                    </h3>
                    <p class="text-sm text-gray-500">{proforma.nome}</p>
                  </div>
                  <div class="space-y-2">
                    {analises.length > 0 ? (
                      analises.map((analise, j) => (
                        <div key={j} class="bg-gray-50 rounded-lg p-3 border">
                          <p class="text-sm text-gray-700">
                            <strong class="text-gray-900">Parâmetro:</strong> {analise.parametro}
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
                        isSelectedCliente.value = proforma;
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
            {isSelectedCliente.value && (
              <>
                <p>
                  <strong>Cliente:</strong>{" "}
                  {state.clientes.find((c) => c.id === isSelectedCliente.value.cliente)?.nome}
                </p>
                <p>
                  <strong>Proforma:</strong> {isSelectedCliente.value.nome}
                </p>
                <p>
                  <strong>Data:</strong> {isSelectedCliente.value.data}
                </p>
                <p>
                  <strong>Parâmetros:</strong> {isSelectedCliente.value.parametros}
                </p>
                <p>
                  <strong>Total a Pagar:</strong> {isSelectedCliente.value.totalpagar}
                </p>
              </>
            )}
          </div>
        </div>
      )}
      <Footer />
    </>
  );
});