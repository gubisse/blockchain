// src/components/Header.tsx
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { AlegarLogin, VerificarLogin, formatarDataMZ } from '~/components/util';


export const HeaderLogin = component$(() => {
  const mostrarMenu = useSignal(false);
  const nome = useSignal('');
  const senha = useSignal('');
  const mensagem = useSignal('');

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
              <div class="text-right">
                <button
                  type="submit"
                  class="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
});



export const Header = component$(() => {
  const mostrarMenu = useSignal(false);

  const logado = useSignal(false);

  // Verifica o login no lado do cliente
  useVisibleTask$(async () => {
    logado.value = await VerificarLogin();
  });

  return (
    <header class="bg-blue-600 text-white shadow px-4 py-3 fixed top-0 w-full z-50 flex justify-between items-center">
      <h1 class="text-sm font-bold">Plataforma Blockchain</h1>
      <h1 class="text-sm font-bold">{"Data e hora do acesso: " + formatarDataMZ(logado.value.data)}</h1>

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
