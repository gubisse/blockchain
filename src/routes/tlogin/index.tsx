import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { Header, HeaderLogin } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { VerificarLogin, TerminarLogin } from "~/components/util";

export default component$(() => {
  const logado = useSignal(false);
  const mensagem = useSignal('');

  // Verifica o login no lado do cliente
  useVisibleTask$(() => {
    logado.value = await VerificarLogin();
  });

  // Função para logout
  const logout = $(async () => {
    TerminarLogin();
    mensagem.value = 'Sessão terminada com sucesso.';
    logado.value = false;
    // Redireciona para a página inicial
    location.href = '/';
  });

  return (
    <>
      {logado.value ? <Header /> : <HeaderLogin />}

      <div class="flex min-h-screen items-center justify-center bg-gray-100"> 
        <div class="bg-white p-8 rounded-2xl shadow-lg text-center w-full max-w-md">
          <h1 class="uppercase text-2xl font-bold text-blue-600 mb-4">Terminar Sessão</h1>
          <p class="text-gray-600 mb-6">
            Você está prestes a encerrar sua sessão. Todos os dados temporários serão descartados.
          </p>

          {mensagem.value && (
            <p class="mb-4 text-green-600 font-medium">{mensagem.value}</p>
          )}

          {logado.value ? (
            <form
              preventdefault:submit
              onSubmit$={logout}
            >
              <div class="text-right">
                <button
                  type="submit"
                  class="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                >
                  Terminar sessão mesmo!
                </button>
              </div>
            </form>
          ) : (
            <p>Você não está logado.</p>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
});
