// src/components/Header.tsx
import { component$, useSignal } from "@builder.io/qwik";

export const Header = component$(() => {
  const mostrarMenu = useSignal(false);

  return (
    <header class="bg-blue-600 text-white shadow px-4 py-3 fixed top-0 w-full z-50 flex justify-between items-center">
      <h1 class="text-sm font-bold">Plataforma Blockchain</h1>

      {/* Dropdown de Ações */}
      <div class="relative">
        <button
          class="bg-white text-black text-sm font-medium px-3 py-1 rounded shadow-sm flex items-center gap-1"
          onClick$={() => (mostrarMenu.value = !mostrarMenu.value)}
        >
          ⚙️ Ações
        </button>

        {mostrarMenu.value && (
          <ul class="absolute right-0 mt-2 bg-white text-black shadow rounded w-40 text-sm z-50">
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
                href="/"
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
