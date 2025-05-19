import { component$, useSignal, useStore, $, useTask$ } from "@builder.io/qwik";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import type { Parametro, Proforma, Analise } from "~/components/entidade";
import { clientes, parametros, proformas, analises, elementosQuimicos118 } from "~/components/dado";

// Função para avaliar expressões matemáticas simples
const evaluateExpression = (expression: string): number => {
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

export default component$(() => {
  const isModalOpen = useSignal(false);
  const editingParametro = useSignal<Parametro | null>(null);
  const mensagem = useSignal("");
  const erro = useSignal("");

  const state = useStore<{
    parametros: Parametro[];
    proformas: Proforma[];
    analises: Analise[];
    form: {
      id?: string;
      categoria: string;
      nome: string;
      valor: number;
      campos: string;
      formula: string;
      testValues: { [key: string]: number };
      testResult: string | number;
    };
  }>({
    parametros: [],
    proformas: [],
    analises: [],
    form: {
      categoria: "",
      nome: "",
      valor: 0,
      campos: "",
      formula: "",
      testValues: {},
      testResult: "",
    },
  });

  // Carrega parâmetros iniciais (mockados, podem vir de uma API)
  useTask$(() => {
    state.parametros = parametros;
    state.proformas = proformas;
    state.analises = analises;
  });

    // Atualiza valores de teste quando os campos mudam
    useTask$(({ track }) => {
      track(() => state.form.campos);
      state.form.testValues = {};
      state.form.testResult = "";
      const campos = state.form.campos.split(",").filter((c) => c.trim());
      campos.forEach((campo) => {
        state.form.testValues[campo] = 0;
      });
    });

    useTask$(({ track }) => {
      track(() => mensagem.value);
      if (mensagem.value) {
        setTimeout(() => {
          mensagem.value = "";
        }, 4000);
      }
    });

  useTask$(({ track }) => {
    track(() => erro.value);
    if (erro.value) {
      setTimeout(() => {
        erro.value = "";
      }, 6000);
    }
  });


  // Função para testar a fórmula
  const testarFormula = $(() => {
    const { formula, testValues } = state.form;
    if (!formula) {
      state.form.testResult = "Fórmula vazia";
      return;
    }

    let formulaSubstituida = formula;
    Object.entries(testValues).forEach(([campo, valor]) => {
      const regex = new RegExp(`\\b${campo}\\b`, "g");
      formulaSubstituida = formulaSubstituida.replace(regex, valor.toString());
    });

    const resultado = evaluateExpression(formulaSubstituida);
    state.form.testResult = Number.isFinite(resultado) ? resultado : "Erro na fórmula";
  });

  // Função para salvar ou atualizar parâmetro
  const salvarParametro = $(async (e: Event) => {
    e.preventDefault();
    const { id, categoria, nome, valor, campos, formula } = state.form;

    if (!categoria || !nome || !valor || !campos || !formula ) {
      erro.value = "Todos os campos são obrigatórios";
      return;
    }

    const novoParametro: Parametro = {
      id: id || crypto.randomUUID(),
      categoria,
      valor: Number(valor),
      campos,
      formula,
    };

    if (id) {
      // Atualiza parâmetro existente
      const index = state.parametros.findIndex((p) => p.id === id);
      if (index !== -1) {
        state.parametros[index] = novoParametro;
        mensagem.value = "Parâmetro atualizado com sucesso!";
      }
    } else {
      // Adiciona novo parâmetro
      state.parametros.push(novoParametro);
      mensagem.value = "Parâmetro adicionado com sucesso!";
    }

    // Reseta formulário e fecha modal
    state.form = { categoria: "", nome: "", valor: 0, campos: "", formula: "", testValues: {}, testResult: "" };
    isModalOpen.value = false;
    editingParametro.value = null;
    erro.value = "";
  });

  // Função para editar parâmetro
  const editarParametro = $((parametro: Parametro) => {
    //Procurar se o parametro esta associado a alguma proforma
    const parametroNaAnalise = state.proformas.filter((d) =>
      d.parametros.split(",").includes(parametro.id)
    );

    if(parametroNaAnalise.length === 0){
      state.form = {
        id: parametro.id,
        categoria: parametro.categoria,
        valor: parametro.valor,
        campos: parametro.campos,
        formula: parametro.formula,
        testValues: parametro.campos.split(",").reduce((acc, campo) => ({ ...acc, [campo]: 0 }), {}),
        testResult: "",
      };
      erro.value = "";
      editingParametro.value = parametro;
      isModalOpen.value = true;
    }else{
      erro.value = "Não é possível editar este parâmetro, pois ele já está vinculado a uma operação em proformas.";
    }
  });

  // Função para remover parâmetro
  const removerParametro = $((id: string) => {
    //Procurar se o parametro esta associado a alguma proforma
    const parametroNaAnalise = state.proformas.filter((d) =>
      d.parametros.split(",").includes(id)
    );

    if(parametroNaAnalise.length === 0){
      state.parametros = state.parametros.filter((p) => p.id !== id);
      mensagem.value = "Parâmetro removido com sucesso!";
    }else{
      erro.value = "Não é possível eliminar este parâmetro, pois ele já está vinculado a uma operação em proformas.";
    }
  });

  return (
    <>
      <Header />
      <main class="p-4 max-w-screen-lg mx-auto mt-10">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg font-semibold uppercase">Configuração de Parâmetros</h2>
          <button
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick$={() => {
              state.form = { categoria: "", nome: "", valor: 0, campos: "", formula: "", testValues: {}, testResult: "" };
              editingParametro.value = null;
              isModalOpen.value = true;
            }}
          >
            Adicionar parâmetro
          </button>
        </div>

        {/* Lista de Parâmetros como Cards */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {state.parametros.map((parametro) => (
            <div key={parametro.id} class="bg-white rounded-xl shadow p-4 space-y-2">
              <h3 class="text-lg font-semibold text-blue-700">{parametro.id} - {elementosQuimicos118.find((d) => d.id === parametro.id)?.nome}</h3>
              <div class="grid grid-cols-2 between">
                <p><span class="font-medium text-gray-600">Categoria:</span> {parametro.categoria}</p>
                <p><span class="font-medium text-gray-600">Valor:</span> {parametro.valor}</p>
              </div>
              <div class="grid grid-cols-2 between">
                <p><span class="font-medium text-gray-600">Campos:</span> {parametro.campos}</p>
                <p><span class="font-medium text-gray-600">Fórmula:</span> {parametro.formula}</p>
              </div>
              <p>{elementosQuimicos118.find((d) => d.id === parametro.id)?.descricao}</p>
              <div class="flex justify-end gap-2 pt-2">
                <button
                  class="text-sm text-blue-600 hover:underline"
                  onClick$={() => editarParametro(parametro)}
                >
                  Editar
                </button>
                <button
                  class="text-sm text-red-600 hover:underline"
                  onClick$={() => removerParametro(parametro.id)}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Modal para Adicionar/Editar Parâmetro */}
      {isModalOpen.value && (
        <div class="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-start overflow-y-auto">
          <div class="bg-white p-6 mt-10 rounded-xl shadow-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button
              class="absolute top-2 right-2 text-gray-600 hover:text-black"
              onClick$={() => {
                isModalOpen.value = false;
                state.form = { categoria: "", nome: "", valor: 0, campos: "", formula: "", testValues: {}, testResult: "" };
                editingParametro.value = null;
              }}
            >
              ✕
            </button>
            <h3 class="text-lg font-semibold mb-4">
              {editingParametro.value ? "Editar Parâmetro" : "Adicionar Parâmetro"}
            </h3>
            <form preventdefault:submit onSubmit$={salvarParametro}>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">Categoria</label>
                <select name="nome" value={state.form.categoria} class="border p-2 rounded w-full" onChange$={(e) => state.form.categoria = (e.target as HTMLInputElement).value}>
                  <option disabled selected>Selecione categoria</option>
                  {[...new Set(state.parametros.map((d) => d.categoria))].map((nome) => (
                    <option key={nome} value={nome}>
                      {nome}
                    </option>
                  ))}
                </select>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">Nome</label>
                <select name="nome" value={state.form.id} class="border p-2 rounded w-full" onChange$={(e) => state.form.id = (e.target as HTMLInputElement).value}>
                  <option disabled selected>Selecione categoria</option>
                  {[
                    ...new Map(elementosQuimicos118.map((item) => [item.id, item])).values()
                  ]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome}
                      </option>
                  ))}

                </select>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">Valor</label>
                <input
                  type="number"
                  class="border p-2 rounded w-full"
                  value={state.form.valor}
                  onInput$={(e) => (state.form.valor = Number((e.target as HTMLInputElement).value))}
                  required
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">Campos (ex.: x,y,z)</label>
                <input
                  type="text"
                  class="border p-2 rounded w-full"
                  value={state.form.campos}
                  onInput$={(e) => (state.form.campos = (e.target as HTMLInputElement).value)}
                  required
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">Fórmula (ex.: x/y)</label>
                <input
                  type="text"
                  class="border p-2 rounded w-full"
                  value={state.form.formula}
                  onInput$={(e) => (state.form.formula = (e.target as HTMLInputElement).value)}
                  required
                />
              </div>
              {/* Campos para testar a fórmula */}
              {state.form.campos.split(",").filter((c) => c.trim()).map((campo) => (
                <div key={campo} class="mb-4">
                  <label class="block text-sm font-medium text-gray-700">{`Valor de ${campo}`}</label>
                  <input
                    type="number"
                    class="border p-2 rounded w-full"
                    value={state.form.testValues[campo] || 0}
                    onInput$={(e) =>
                      (state.form.testValues[campo] = Number((e.target as HTMLInputElement).value))
                    }
                  />
                </div>
              ))}
              <div class="mb-4">
                <button
                  type="button"
                  class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
                  onClick$={testarFormula}
                >
                  Testar Fórmula
                </button>
                <span class="text-sm text-gray-700">
                  Resultado: {state.form.testResult || "Não testado"}
                </span>
              </div>
              {erro.value && <div class="text-red-600 mb-4">{erro.value}</div>}
              <div class="text-right">
                <button
                  type="submit"
                  class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>


      )}

      {/* Modal de Mensagem */}
      {mensagem.value && (
        <div class="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div class="bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded shadow-xl max-w-sm text-center relative">
            <button class="absolute top-2 right-2 text-green-700 hover:text-green-900" onClick$={() => mensagem.value = ""}>✕</button>
            <p>{mensagem.value}</p>
          </div>
        </div>
      )}

      {/* Modal de Erro */}
      {erro.value && (
        <div class="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div class="bg-red-100 border border-red-400 text-red-800 px-6 py-4 rounded shadow-xl max-w-sm text-center relative">
            <button class="absolute top-2 right-2 text-red-700 hover:text-red-900" onClick$={() => erro.value = ""}>✕</button>
            <p>{erro.value}</p>
          </div>
        </div>
      )}  

      <Footer />
    </>
  );
});