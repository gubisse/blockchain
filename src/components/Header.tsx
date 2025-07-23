// src/components/Header.tsx
import { component$, useSignal, useVisibleTask$, useStore } from '@builder.io/qwik';
import { AlegarLogin, VerificarLogin, formatarDataMZ } from '~/components/util';
import type { Usuario } from '~/components/entidade';

export const HeaderLogin = component$(() => {
  const carregando = useSignal(false);
  const mostrarMenu = useSignal(false);
  const nome = useSignal('');
  const senha = useSignal('');
  const mensagem = useSignal('');

  const state = useStore<{
    form: {
      usuario: Partial<Usuario>;
      erro: string;
      mensagem: string;
    };
    erro: string;
    mensagem: string;
  }>({
    form: {
      usuario: {},
      erro: "",
      mensagem: "",
    },
    erro: "",
    mensagem: "",
  });

  useVisibleTask$(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menu = document.getElementById('menu-login');
      const button = document.getElementById('botao-login');

      if (
        menu &&
        !menu.contains(e.target as Node) &&
        button &&
        !button.contains(e.target as Node)
      ) {
        mostrarMenu.value = false;
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

  return (
    <header class="bg-blue-600 text-white shadow px-4 py-3 fixed top-0 w-full z-50 flex justify-between items-center">
      <h1 class="text-sm font-bold">Plataforma Blockchain</h1>

      {/* Dropdown de Ações */}
      <div class="relative">
        <button
          id="botao-login"
          class="bg-white text-black text-sm font-medium px-3 py-1 rounded shadow-sm flex items-center gap-1"
          onClick$={() => (mostrarMenu.value = !mostrarMenu.value)}
        >
          ⚙️ Login
        </button>

        {mostrarMenu.value && (
          <div
            id="menu-login"
            class="absolute right-0 mt-2 bg-white text-black shadow-lg rounded-lg w-64 p-4 z-50"
          >
            <form
              preventdefault:submit
              onSubmit$={async () => {
                const resultado = await AlegarLogin(nome.value, senha.value);
                mensagem.value = resultado.mensagem;

                if (resultado.sucesso) {
                  mostrarMenu.value = false;
                  // Redireciona para a página inicial
                  location.href = '/';
                  // OU, se preferir apenas recarregar a página atual:
                  // location.reload();
                }
              }}
            >

              <div class="mb-3">
                <label
                  for="nome"
                  class="block text-sm font-medium text-gray-700"
                >
                  Nome
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  bind:value={nome}
                  class="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              <div class="mb-3">
                <label
                  for="senha"
                  class="block text-sm font-medium text-gray-700"
                >
                  Senha
                </label>
                <input
                  type="password"
                  id="senha"
                  name="senha"
                  bind:value={senha}
                  class="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              {mensagem.value && (
                <div class="text-sm text-red-600 mb-2">{mensagem.value}</div>
              )}
              <div class="flex justify-between">
                <button
                  type="submit"
                  class="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600"
                >
                  Entrar
                </button>

              </div>

            </form>
          </div>
        )}
      </div>


      {/* Modal de Mensagem */}
      {carregando.value && (
        <div class="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div class="bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded shadow-xl max-w-sm text-center relative">
            {carregando.value && (
              <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div class="bg-white p-8 rounded-2xl shadow-lg text-center w-full max-w-md">
                  <p class="text-gray-600 mb-6">{state.form.mensagem}</p>
                  <p class="text-gray-600 mb-6">{state.form.erro}</p>
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
    </header>
  );
});



export const Header = component$(() => {
  const mostrarMenu = useSignal(false);

  const logado = useSignal<Usuario | null>(null);

  // Verifica o login no lado do cliente
  useVisibleTask$(async () => {
    const logar = await VerificarLogin();
    logado.value = logar.usuario;
  });

  return (
    <header class="bg-blue-600 text-white shadow px-4 py-3 fixed top-0 w-full z-50 flex justify-between items-center">
      <h1 class="text-sm font-bold">Plataforma Blockchain</h1>
      <h1 class="text-sm font-bold">
        {"Data e hora do acesso: " + formatarDataMZ(logado.value?.data || "")}
      </h1>


      {/* Dropdown de Ações */}
      <div class="relative">
        <button
          class="bg-white text-black text-sm font-medium px-3 py-1 rounded shadow-sm flex items-center gap-1"
          onClick$={() => (mostrarMenu.value = !mostrarMenu.value)}
        >
          ⚙️ Ações
        </button>

        {mostrarMenu.value && (
          <ul class="absolute right-0 mt-2 bg-white text-black shadow rounded w-50 text-sm z-50">
            
            <li>
              <a href="/clientes" class="block px-4 py-2 hover:bg-gray-100">
                Clientes
              </a>
            </li>
            <li>
              <a href="/analises" class="block px-4 py-2 hover:bg-gray-100">
                Analises
              </a>
            </li>
            <li>
              <a href="/configuracoes" class="block px-4 py-2 hover:bg-gray-100">
                Configurações
              </a>
            </li>
            <li>
              <hr class="my-1 border-t border-gray-200" />
            </li>
            <li>
              <a class="block px-4 py-2 hover:bg-gray-100">
                {logado.value?.nome}
              </a>
            </li>
            <li>
              <a class="block px-4 py-2 hover:bg-gray-100">
                {formatarDataMZ(logado.value?.data || "")}
              </a>
            </li>
            <li>
              <hr class="my-1 border-t border-gray-200" />
            </li>
            <li>
              <a
                href="/tlogin"
                class="block px-4 py-2 text-red-600 hover:bg-red-50"
              >
                Sair
              </a>
            </li>
          </ul>
        )}
      </div>
      

    </header>



  );
});
