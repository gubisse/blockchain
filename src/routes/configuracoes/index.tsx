import { component$, useSignal, useStore, $, useTask$, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$ } from '@builder.io/qwik-city';
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import type { Usuario, Cliente, Proforma, Parametro, Comprovativo, Deletar } from "~/components/entidade";
import { VerificarLogin, AlegarRestauracao, ConfirmarSenhaDoUsuarioLogado, formatarDataMZ, CodificadorMD5 } from '~/components/util';
import { elementosQuimicos118 } from "~/components/dado";
import { getAllDados } from "~/components/DTO";
import {
  createAddParametroAction,
  createAddUsuarioAction,
  createEditParametroAction,
  createEditUsuarioAction,
  createDeleteAllUoAction,
  createDeleteAllAeAction,
  createDeleteAllCeAction,
  createDeleteAllPoAction,
  createDeleteAllPaAction,
  createDeleteAllCoAction
} from '~/lib/action';

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
export const useAddUsuario = createAddUsuarioAction<Usuario>("usuario");
export const useEditParametro = createEditParametroAction<Parametro>("parametro");
export const useEditUsuario = createEditUsuarioAction<Usuario>("usuario")

export const useDeleteUsuarios = createDeleteAllUoAction('usuario');
export const useDeleteClientes = createDeleteAllCeAction('cliente');
export const useDeleteAnalises = createDeleteAllAeAction('analise');
export const useDeleteParametros = createDeleteAllPoAction('parametro');
export const useDeleteProformas = createDeleteAllPaAction('proforma');
export const useDeleteComprovativos = createDeleteAllCoAction('comprovativo');

export default component$(() => {
  const carregando = useSignal(false);
  const isSelected = useSignal<Partial<Parametro> | null>(null);

  const funNovaSenha = useSignal(false);
  const funNovoUsuario = useSignal(false);
  const funRestaurarSys = useSignal(false);

  const clientesLoader = useGetClientes();
  const proformasLoader = useGetProformas();
  const comprovativosLoader = useGetComprovativos();
  const parametrosLoader = useGetParametros();
  
  const addPAction = useAddParametro();
  const addUAction = useAddUsuario();
  const editPAction = useEditParametro();
  const editUAction = useEditUsuario();

  const deleteUsuariosAction = useDeleteUsuarios();
  const deleteClientesAction = useDeleteClientes();
  const deleteAnalisesAction = useDeleteAnalises();
  const deleteParametrosAction = useDeleteParametros();
  const deleteProformasAction = useDeleteProformas();
  const deleteComprovativosAction = useDeleteComprovativos();

  const state0 = useStore<{
    form: {
      deletar: Partial<Deletar>; 
      erro: string;
      mensagem: string;
    }
  }>({
    form: {
      deletar: {},
      erro: "",
      mensagem: "",
    }
  });
  const stateNovoUsuario = useStore<{
    form: {
      usuario: Partial<Usuario>; 
      erro: string;
      mensagem: string;
    }
  }>({
    form: {
      usuario: {},
      erro: "",
      mensagem: "",
    }
  });
  const stateNovaSenhaUsuario = useStore<{
    form: {
      usuario: Partial<Usuario>; 
      erro: string;
      mensagem: string;
    }
  }>({
    form: {
      usuario: {},
      erro: "",
      mensagem: "",
    }
  });

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

  useVisibleTask$(async () => {
    const login = VerificarLogin();

    if (login?.usuario?.nome === "admin") {
      funNovoUsuario.value = true;
      funRestaurarSys.value = true;
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

    if ( p && !parametroNaAnalise) {
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

  const salvarUsuario = $(async (e: Event) => {
    e.preventDefault(); // Impede recarregamento do formulário

    carregando.value = true;

    // Limpa mensagens anteriores
    stateNovoUsuario.form.mensagem = "";
    stateNovoUsuario.form.erro = "";

    const usuario = stateNovoUsuario.form.usuario;

    // Validação mínima
    if (!usuario.nome?.trim() || !usuario.senha?.trim()) {
      stateNovoUsuario.form.erro = "Nome e senha são obrigatórios.";
      carregando.value = false;
      return;
    }

    // Codifica a senha com MD5
    usuario.senha = CodificadorMD5(usuario.senha.trim());

    console.log("🔒 Usuário a salvar:", usuario);

    // Submete via action
    const r = await addUAction.submit(usuario as Record<string, unknown>);

    carregando.value = false;

    if (r?.value?.success) {
      stateNovoUsuario.form.mensagem = r.value.message;
    } else {
      stateNovoUsuario.form.erro = r?.value?.message || "Erro ao salvar usuário.";
    }

    console.log("🧾 Resultado:", r);
  });


  return (
    <>
      <Header />
      <main class="p-6 max-w-screen-lg mx-auto mt-10 space-y-8">
        <h2 class="text-2xl font-semibold uppercase text-gray-800">Configuração de Parâmetros</h2>

        <div class="bg-white p-6 rounded-xl shadow-md">
          <h3 class="text-lg font-semibold mb-4 text-gray-700">
            {isSelected.value ? "Editar Parâmetro" : "Adicionar Parâmetro"}
          </h3>
            
          <form preventdefault:submit onSubmit$={salvarParametro} class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

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
                <label class="block text-sm font-medium text-gray-700"></label>
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

            </div>
            <div class="grid grid-cols-1 md:grid-cols-1 gap-4">



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
                    onClick$={() => editarParametro(parametro?.id || "N/A")}
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
        <div class="hr"><hr/></div>
        {funNovoUsuario.value && (
        <div>
          <p class="uppercase"><strong>Novo usuario</strong></p>
          <p><strong>Esta funcionalidade pode ser executada, com a permissao do admin</strong></p>
          <div>
            <form
              preventdefault:submit
              onSubmit$={salvarUsuario}
            >
              <input
                type="text"
                onChange$={(e) => (stateNovoUsuario.form.usuario.nome = (e.target as HTMLSelectElement).value) }
                placeholder="Usuario"
                class="w-full border border-gray-300 px-3 py-2 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-describedby="mensagem-erro"
                maxLength={10}
              />
              <input
                type="text"
                onChange$={(e) => (stateNovoUsuario.form.usuario.senha = (e.target as HTMLSelectElement).value) }
                placeholder="Senha"
                class="w-full border border-gray-300 px-3 py-2 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-describedby="mensagem-erro"
                maxLength={20}
              />
              {stateNovoUsuario.form.mensagem && (
                <div id="mensagem-erro" class="text-sm text-center text-green-500 mb-3">
                  {stateNovoUsuario.form.mensagem}
                </div>
              )}
              {stateNovoUsuario.form.erro && (
                <div id="mensagem-erro" class="text-sm text-center text-red-500 mb-3">
                  {stateNovoUsuario.form.erro}
                </div>
              )}
              <div class="flex justify-end gap-2">
                <button
                  type="reset"
                  class="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 text-sm"
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                >
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
        )}

        <div class="hr"><hr/></div>
        {!funNovaSenha.value && (
        <div>
          <p class="uppercase"><strong>Nova senha do usuario</strong></p>
          <p><strong>Confirme sua senha para proceguir</strong></p>
          <div>
            <form
              preventdefault:submit
              onSubmit$={async () => {
                carregando.value = true;

                // Limpa mensagens anteriores
                stateNovaSenhaUsuario.form.mensagem = '';
                stateNovaSenhaUsuario.form.erro = '';

                const senhaAtual = stateNovaSenhaUsuario.form.usuario.senha?.trim();

                // Validação
                if (!senhaAtual) {
                  stateNovaSenhaUsuario.form.erro = "A senha atual é obrigatória.";
                  carregando.value = false;
                  return;
                }

                // Confirmação da senha
                const resultado = await ConfirmarSenhaDoUsuarioLogado(senhaAtual);
                carregando.value = false;

                if (resultado.sucesso) {
                  stateNovaSenhaUsuario.form.mensagem = resultado.mensagem;
                  stateNovaSenhaUsuario.form.usuario = resultado.usuario;
                  funNovaSenha.value = true;
                } else {
                  stateNovaSenhaUsuario.form.erro = resultado.mensagem;
                }
              }}
            >
              <input
                type="password"
                placeholder="Sua senha atual"
                maxLength={24}
                class="w-full border border-gray-300 px-3 py-2 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                onChange$={(e) =>
                  (stateNovaSenhaUsuario.form.usuario.senha = (e.target as HTMLInputElement).value)
                }
                aria-describedby="mensagem-status"
              />

              {stateNovaSenhaUsuario.form.mensagem && (
                <div id="mensagem-status" class="text-sm text-center text-green-600 mb-3">
                  {stateNovaSenhaUsuario.form.mensagem}
                </div>
              )}
              {stateNovaSenhaUsuario.form.erro && (
                <div id="mensagem-status" class="text-sm text-center text-red-600 mb-3">
                  {stateNovaSenhaUsuario.form.erro}
                </div>
              )}

              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  class="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 text-sm"
                  onClick$={() => (funNovaSenha.value = false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                >
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
        )}

        {funNovaSenha.value && (
          <div class="mb-4 p-2 text-sm text-green-700 bg-green-100 border border-green-300 rounded">
            <div>
              <p class="uppercase"><strong>Nova senha do usuario</strong></p>
              <div>
                <form
                  preventdefault:submit
                  onSubmit$={async () => {
                    carregando.value = true;

                    // Limpa mensagens anteriores
                    stateNovaSenhaUsuario.form.mensagem = '';
                    stateNovaSenhaUsuario.form.erro = '';

                    const senhaAtual = stateNovaSenhaUsuario.form.usuario.senha?.trim();

                    // Validação
                    if (!senhaAtual) {
                      stateNovaSenhaUsuario.form.erro = "A senha atual é obrigatória.";
                      carregando.value = false;
                      return;
                    }
                    let senhaMD5 = CodificadorMD5(senhaAtual)
                    // Confirmação da senha
                    stateNovaSenhaUsuario.form.usuario.senha = senhaMD5;
                    const resultado = await editUAction.submit(stateNovaSenhaUsuario.form.usuario as Record<string, unknown>);
                    carregando.value = false;

                    if (resultado.value?.sucesso) {
                      const login = VerificarLogin();
                      const objetoLogin = {
                        usuario: stateNovaSenhaUsuario.form.usuario,
                        data: login.data,
                      };

                      localStorage.setItem('login', JSON.stringify(objetoLogin));

                      stateNovaSenhaUsuario.form.mensagem = resultado.value?.mensagem;
                      funNovaSenha.value = true;
                    } else {
                      stateNovaSenhaUsuario.form.erro = resultado.value?.mensagem;
                    }
                  }}
                >
                  <input
                    type="text"
                    onChange$={(e) => (stateNovaSenhaUsuario.form.usuario.senha = (e.target as HTMLSelectElement).value) }
                    placeholder="Nova senha"
                    class="w-full border border-gray-300 px-3 py-2 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-describedby="mensagem-erro"
                    maxLength={24}
                  />
                  {stateNovaSenhaUsuario.form.mensagem && (
                    <div id="mensagem-erro" class="text-sm text-center text-green-500 mb-3">
                      {stateNovaSenhaUsuario.form.mensagem}
                    </div>
                  )}
                  {stateNovaSenhaUsuario.form.erro && (
                    <div id="mensagem-erro" class="text-sm text-center text-red-500 mb-3">
                      {stateNovaSenhaUsuario.form.erro}
                    </div>
                  )}
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 text-sm"
                      onClick$={() => (funNovaSenha.value = false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                    >
                      Enviar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div class="hr"><hr/></div>
        
        {funRestaurarSys.value && (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              class=" bg-red-900 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              onClick$={async () => {
                carregando.value = true;
                const result = await deleteUsuariosAction.submit({});
                carregando.value = false;
                if (result?.value?.success) {
                  state.mensagem = result?.value?.message;
                } else {
                  state.erro = result?.value?.message;
                }

              }}
            >
              Deletar usuarios
            </button>
            <button
              class="bg-red-900 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              onClick$={async () => {
                carregando.value = true;
                const result = await deleteComprovativosAction.submit({});
                carregando.value = false;
                if (result?.value?.success) {
                  state.mensagem = result?.value?.message;
                } else {
                  state.erro = result?.value?.message;
                }

              }}
            >
              Deletar comprovativos
            </button>
            
            <button
              class="bg-red-900 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              onClick$={async () => {
                carregando.value = true;
                const result = await deleteClientesAction.submit({});
                carregando.value = false;
                if (result?.value?.success) {
                  state.mensagem = result?.value?.message;
                } else {
                  state.erro = result?.value?.message;
                }

              }}
            >
              Deletar clientes
            </button>
            <button
              class="bg-red-900 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              onClick$={async () => {
                carregando.value = true;
                const result = await deleteAnalisesAction.submit({});
                carregando.value = false;
                if (result?.value?.success) {
                  state.mensagem = result?.value?.message;
                } else {
                  state.erro = result?.value?.message;
                }

              }}
            >
              Deletar analises
            </button>
            <button
              class="bg-red-900 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              onClick$={async () => {
                carregando.value = true;
                const result = await deleteParametrosAction.submit({});
                carregando.value = false;
                if (result?.value?.success) {
                  state.mensagem = result?.value?.message;
                } else {
                  state.erro = result?.value?.message;
                }

              }}
            >
              Deletar parametros
            </button>
            <button
              class="bg-red-900 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              onClick$={async () => {
                carregando.value = true;
                const result = await deleteProformasAction.submit({});
                carregando.value = false;
                if (result?.value?.success) {
                  state.mensagem = result?.value?.message;
                } else {
                  state.erro = result?.value?.message;
                }

              }}
            >
              Deletar proformas
            </button>
          </div>
        )}
      </main>


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