// src/components/Footer.tsx
import { component$ } from "@builder.io/qwik";

export const Footer = component$(() => {
  return (
    <footer class="bg-gray-900 text-white text-center py-3 mt-auto w-full z-50">
      <div class="px-4 max-w-screen-lg mx-auto text-sm">
        <p class="block md:inline">
          © {new Date().getFullYear()} Sistema de Gestão Blockchain.
        </p>
        <br class="md:hidden" />
        <p class="block md:inline">Todos os direitos reservados.</p>
      </div>
    </footer>
  );
});
