import { component$, useSignal, useStore, $, useTask$ } from "@builder.io/qwik";
import { routeLoader$ } from '@builder.io/qwik-city';
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import type { Cliente, Proforma, Parametro, Comprovativo } from "~/components/entidade";
import { elementosQuimicos118 } from "~/components/dado";
import { getAllDados } from "~/components/DTO";
import { createAddParametroAction, createEditParametroAction } from '~/lib/action';

interface FormState {
  id?: string;
  categoria: string;
  valor: number;
  campos: string;
  formula: string;
  teste: {
    valores: Record<string, number>;
    resultado: string | number;
  };
  erro: string;
  mensagem: string;
}

interface AppState {
  clientes: Partial<Cliente>[];
  parametros: Partial<Parametro>[];
  proformas: Partial<Proforma>[];
  comprovativos: Partial<Comprovativo>[];
  parametrosSelecionados: string[];
  form: FormState;
  erro: string;
  mensagem: string;
}

export const useGetClientes = routeLoader$(() => getAllDados<Cliente>('cliente'));
export const useGetProformas = routeLoader$(() => getAllDados<Proforma>('proforma'));
export const useGetParametros = routeLoader$(() => getAllDados<Parametro>('parametro'));
export const useGetComprovativos = routeLoader$(() => getAllDados<Comprovativo>('comprovativo'));

export const useAddParametro = createAddParametroAction<Parametro>("parametro");
export const useEditParametro = createEditParametroAction<Parametro>("parametro");

export default component$(() => {
  const carregando = useSignal(false);
  const isSelected = useSignal<Partial<Parametro> | null>(null);

  const clientesLoader = useGetClientes();
  const proformasLoader = useGetProformas();
  const comprovativosLoader = useGetComprovativos();
  const parametrosLoader = useGetParametros();
  
  const addPAction = useAddParametro();
  const editPAction = useEditParametro();


  const state = useStore<AppState>({
    clientes: [],
    parametros: [],
    proformas: [],
    comprovativos: [],
    parametrosSelecionados: [],
    form: {
      categoria: "",
      valor: 0,
      campos: "",
      formula: "",
      teste: {
        valores: {},
        resultado: "",
      },
      erro: "",
      mensagem: "",
    },
    erro: "",
    mensagem: "",
  });

  const limparMensagens = $(() => {
    if (state.mensagem || state.erro) {
      const timeout = setTimeout(() => {
        state.mensagem = "";
        state.erro = "";
      }, state.mensagem ? 4000 : 6000);
      return () => clearTimeout(timeout);
    }
  });

  useTask$(async ({ track }) => {
    track(() => [
      clientesLoader.value,
      proformasLoader.value,
      comprovativosLoader.value,
      parametrosLoader.value
    ]);
    state.clientes = await clientesLoader.value ?? [];
    state.proformas = await proformasLoader.value ?? [];
    state.comprovativos = await comprovativosLoader.value ?? [];
    state.parametros = await parametrosLoader.value ?? [];
  });

  useTask$(({ track }) => {
    track(() => [state.mensagem, state.erro]);
    return limparMensagens();
  });

  useTask$(({ track }) => {
    track(() => state.form.campos);
    state.form.teste.valores = {};
    state.form.teste.resultado = "";
    if (state.form.campos) {
      state.form.campos
        .split(",")
        .map(c => c.trim())
        .filter(Boolean)
        .forEach(campo => {
          state.form.teste.valores[campo] = 0;
        });
    }
  });

  const testarFormula = $(() => {
    const { formula, teste } = state.form;
    if (!formula) {
      state.form.teste.resultado = "Fórmula vazia";
      return;
    }

    try {
      let formulaSubstituida = formula;
      Object.entries(teste.valores).forEach(([campo, valor]) => {
        const regex = new RegExp(`\\b${campo}\\b`, "g");
        formulaSubstituida = formulaSubstituida.replace(regex, valor.toString());
      });

      const resultado = eval(formulaSubstituida); // Substituir por evaluateExpression
      state.form.teste.resultado = Number.isFinite(resultado) ? resultado : "Erro na fórmula";
    } catch (error) {
      state.form.teste.resultado = "Erro na fórmula";
    }
  });

  const salvarParametro = $(async (e: Event) => {
    e.preventDefault();
    carregando.value = true;

    try {
      const form = e.target as HTMLFormElement;
      const dados = Object.fromEntries(new FormData(form).entries());
      let action = addPAction
      if(isSelected.value){ 
        action = editPAction
        dados.id = isSelected!.value!.id || "";
      }
      const response = await action.submit(dados as Record<string, unknown>);

      if (response?.value?.success) {
        state.mensagem = response.value.message;
        state.erro = "";
        form.reset();
        state.form = {
          categoria: "",
          valor: 0,
          campos: "",
          formula: "",
          teste: { valores: {}, resultado: "" },
          erro: "",
          mensagem: "",
        };
        isSelected.value = null;
      } else {
        state.erro = response?.value?.message ?? "Erro ao salvar parâmetro";
        state.mensagem = "";
      }
    } catch (error) {
      state.erro = "Erro inesperado ao salvar parâmetro";
    } finally {
      carregando.value = false;
    }
  });

  const editarParametro = $((parametro: string) => {

    const p = state.parametros.find(d => d.id === parametro);

    const parametroNaAnalise = state.proformas.some(p => 
      p.parametros?.split(",").includes(parametro)
    );

    if (!parametroNaAnalise) {
      state.form = {
        id: p.id,
        categoria: p.categoria ?? "",
        valor: p.valor ?? 0,
        campos: p.campos ?? "",
        formula: p.formula ?? "",
        teste: {
          valores: p.campos?.split(",")
            .map(c => c.trim())
            .filter(Boolean)
            .reduce((acc, campo) => ({ ...acc, [campo]: 0 }), {}) ?? {},
          resultado: "",
        },
        erro: "",
        mensagem: "",
      };
      isSelected.value = p;
      state.erro = "";
    } else {
      state.erro = "Não é possível editar este parâmetro, pois ele já está vinculado a uma operação em proformas.";
    }
  });

  const removerParametro = $((id: string) => {
    const parametroNaAnalise = state.proformas.some(p => 
      p.parametros?.split(",").includes(id)
    );

    if (!parametroNaAnalise) {
      state.parametros = state.parametros.filter(p => p.id !== id);
      state.mensagem = "Parâmetro removido com sucesso!";
      state.erro = "";
    } else {
      state.erro = "Não é possível eliminar este parâmetro, pois ele já está vinculado a uma operação em proformas.";
    }
  });

  return (
    <>
      <Header />
      <main class="p-6 max-w-screen-lg mx-auto mt-10 space-y-8">
        <h2 class="text-2xl font-semibold uppercase text-gray-800">Configuração de Parâmetros</h2>

        {carregando.value && (
          <div class="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-3 rounded flex items-center justify-center">
            <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500 mr-3"></div>
            <p>Trabalhando...</p>
          </div>
        )}
        {state.mensagem && (
          <div class="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded flex items-center justify-between">
            <p>{state.mensagem}</p>
            <button class="text-green-700 hover:text-green-900" onClick$={() => state.mensagem = ""}>✕</button>
          </div>
        )}
        {state.erro && (
          <div class="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded flex items-center justify-between">
            <p>{state.erro}</p>
            <button class="text-red-700 hover:text-red-900" onClick$={() => state.erro = ""}>✕</button>
          </div>
        )}

        <div class="bg-white p-6 rounded-xl shadow-md">
          <h3 class="text-lg font-semibold mb-4 text-gray-700">
            {isSelected.value ? "Editar Parâmetro" : "Adicionar Parâmetro"}
          </h3>
          <form preventdefault:submit onSubmit$={salvarParametro} class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Categoria</label>
              <select 
                name="categoria" 
                value={state.form.categoria} 
                class="mt-1 border p-2 rounded w-full disabled:opacity-50 focus:ring-2 focus:ring-blue-500" 
                disabled={carregando.value}
                onChange$={(e) => state.form.categoria = (e.target as HTMLSelectElement).value}
                required
              >
                <option value="" disabled>Selecione categoria</option>
                {['Agua', 'Alimento', 'Agua e Alimento'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Nome</label>
              <select 
                name="id" 
                value={state.form.id} 
                class="mt-1 border p-2 rounded w-full disabled:opacity-50 focus:ring-2 focus:ring-blue-500"
                disabled={carregando.value || !!isSelected.value}
                onChange$={(e) => state.form.id = (e.target as HTMLSelectElement).value}
                required
              >
                <option value="" disabled>Selecione nome</option>
                {[...new Map(elementosQuimicos118.map(item => [item.id, item])).values()]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map(d => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Valor</label>
              <input
                name="valor"
                type="number"
                class="mt-1 border p-2 rounded w-full disabled:opacity-50 focus:ring-2 focus:ring-blue-500"
                value={state.form.valor}
                onInput$={(e) => state.form.valor = Number((e.target as HTMLInputElement).value)}
                required
                disabled={carregando.value}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Campos (ex.: x,y,z)</label>
              <input
                name="campos"
                type="text"
                class="mt-1 border p-2 rounded w-full disabled:opacity-50 focus:ring-2 focus:ring-blue-500"
                value={state.form.campos}
                onInput$={(e) => state.form.campos = (e.target as HTMLInputElement).value}
                required
                disabled={carregando.value}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Fórmula (ex.: x/y)</label>
              <input
                name="formula"
                type="text"
                class="mt-1 border p-2 rounded w-full disabled:opacity-50 focus:ring-2 focus:ring-blue-500"
                value={state.form.formula}
                onInput$={(e) => state.form.formula = (e.target as HTMLInputElement).value}
                required
                disabled={carregando.value}
              />
            </div>

            {state.form.campos?.split(",").map(c => c.trim()).filter(Boolean).map(campo => (
              <div key={campo}>
                <label class="block text-sm font-medium text-gray-700">{`Valor de ${campo}`}</label>
                <input
                  type="number"
                  class="mt-1 border p-2 rounded w-full disabled:opacity-50 focus:ring-2 focus:ring-blue-500"
                  value={state.form.teste.valores[campo] ?? 0}
                  onInput$={(e) => state.form.teste.valores[campo] = Number((e.target as HTMLInputElement).value)}
                  disabled={carregando.value}
                />
              </div>
            ))}

            <div class="flex items-center gap-4">
              <button
                type="button"
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={carregando.value}
                onClick$={testarFormula}
              >
                Testar Fórmula
              </button>
              <span class="text-sm text-gray-700">
                Resultado: {state.form.teste.resultado || "Não testado"}
              </span>
            </div>

            <div class="flex justify-between gap-4">
              <button
                type="button"
                class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
                disabled={carregando.value}
                onClick$={() => {
                  state.form = {
                    categoria: "",
                    valor: 0,
                    campos: "",
                    formula: "",
                    teste: { valores: {}, resultado: "" },
                    erro: "",
                    mensagem: "",
                  };
                  isSelected.value = null;
                }}
              >
                Limpar
              </button>
              <button
                type="submit"
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={carregando.value}
              >
                {carregando.value ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.parametros.map((parametro) => {
            const elemento = elementosQuimicos118.find(d => d.id === parametro.id);
            return (
              <div key={parametro.id} class="bg-white rounded-xl shadow-md p-4 space-y-2">
                <h3 class="text-lg font-semibold text-blue-700">
                  {parametro.id} - {elemento?.nome ?? 'Desconhecido'}
                </h3>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <p><span class="font-medium text-gray-600">Categoria:</span> {parametro.categoria ?? 'N/A'}</p>
                  <p><span class="font-medium text-gray-600">Valor:</span> {parametro.valor ?? 'N/A'}</p>
                  <p><span class="font-medium text-gray-600">Campos:</span> {parametro.campos ?? 'N/A'}</p>
                  <p><span class="font-medium text-gray-600">Fórmula:</span> {parametro.formula ?? 'N/A'}</p>
                </div>
                <p class="text-gray-600 text-sm">{elemento?.descricao ?? 'Sem descrição'}</p>
                <div class="flex justify-end gap-2">
                  <button
                    class="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    disabled={carregando.value}
                    onClick$={() => editarParametro(parametro.id)}
                  >
                    Editar
                  </button>
                  <button
                    class="text-sm text-red-600 hover:underline disabled:opacity-50"
                    disabled={carregando.value}
                    onClick$={() => removerParametro(parametro.id!)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
});