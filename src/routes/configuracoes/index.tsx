import { component$, useSignal, useStore, $, useTask$ } from "@builder.io/qwik";
import { evaluate } from "mathjs";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import type { Parametro } from "~/components/entidade";

export default component$(() => {
  const isModalOpen = useSignal(false);
  const editingParametro = useSignal<Parametro | null>(null);
  const mensagem = useSignal("");
  const erro = useSignal("");

  const state = useStore<{
    parametros: Parametro[];
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
    state.parametros = [
      { id: "Zn", categoria: "Agua", nome: "Cinzas", valor: 1100, campos: "x,y", formula: "x/y" },
      { id: "Na", categoria: "Agua", nome: "Sódio", valor: 500, campos: "x,y,z", formula: "x*y/z" },
      { id: "Mg", categoria: "Agua", nome: "Magnésio", valor: 750, campos: "x,y,z", formula: "x/z + y" },
      { id: "a14e", categoria: "Alimento", nome: "Zinco", valor: 900, campos: "x,y,z", formula: "x*y/z" },
      { id: "a15e", categoria: "Alimento", nome: "Ferro", valor: 300, campos: "x,y,z", formula: "x - y * z" },
      { id: "a17e", categoria: "Agua e Alimento", nome: "Cálcio", valor: 1000, campos: "x,y,z", formula: "x/y*x/z" },
    ];
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

    try {
      const resultado = evaluate(formulaSubstituida);
      state.form.testResult = Number.isFinite(resultado) ? resultado.toFixed(2) : "Resultado inválido";
    } catch (error) {
      state.form.testResult = "Erro na fórmula";
    }
  });

  // Função para salvar ou atualizar parâmetro
  const salvarParametro = $(async (e: Event) => {
    e.preventDefault();
    const { id, categoria, nome, valor, campos, formula } = state.form;

    if (!categoria || !nome || !valor || !campos || !formula) {
      erro.value = "Todos os campos são obrigatórios";
      return;
    }

    const novoParametro: Parametro = {
      id: id || crypto.randomUUID(),
      categoria,
      nome,
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
    state.form = {
      id: parametro.id,
      categoria: parametro.categoria,
      nome: parametro.nome,
      valor: parametro.valor,
      campos: parametro.campos,
      formula: parametro.formula,
      testValues: parametro.campos.split(",").reduce((acc, campo) => ({ ...acc, [campo]: 0 }), {}),
      testResult: "",
    };
    editingParametro.value = parametro;
    isModalOpen.value = true;
  });

  // Função para remover parâmetro
  const removerParametro = $((id: string) => {
    state.parametros = state.parametros.filter((p) => p.id !== id);
    mensagem.value = "Parâmetro removido com sucesso!";
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
            Adicionar Parâmetro
          </button>
        </div>

        {mensagem.value && <div class="text-green-600 mb-4">{mensagem.value}</div>}
        {erro.value && <div class="text-red-600 mb-4">{erro.value}</div>}

        {/* Tabela de Parâmetros */}
        <div class="bg-white p-4 rounded-xl shadow mb-6">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-gray-100">
                <th class="p-3">Nome</th>
                <th class="p-3">Categoria</th>
                <th class="p-3">Valor</th>
                <th class="p-3">Campos</th>
                <th class="p-3">Fórmula</th>
                <th class="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {state.parametros.map((parametro) => (
                <tr key={parametro.id} class="border-t">
                  <td class="p-3">{parametro.nome}</td>
                  <td class="p-3">{parametro.categoria}</td>
                  <td class="p-3">{parametro.valor}</td>
                  <td class="p-3">{parametro.campos}</td>
                  <td class="p-3">{parametro.formula}</td>
                  <td class="p-3">
                    <button
                      class="text-blue-600 hover:underline mr-2"
                      onClick$={() => editarParametro(parametro)}
                    >
                      Editar
                    </button>
                    <button
                      class="text-red-600 hover:underline"
                      onClick$={() => removerParametro(parametro.id)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                <input
                  type="text"
                  class="border p-2 rounded w-full"
                  value={state.form.categoria}
                  onInput$={(e) => (state.form.categoria = (e.target as HTMLInputElement).value)}
                  required
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  class="border p-2 rounded w-full"
                  value={state.form.nome}
                  onInput$={(e) => (state.form.nome = (e.target as HTMLInputElement).value)}
                  required
                />
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

      <Footer />
    </>
  );
});