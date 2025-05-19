import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { Header, HeaderLogin } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { VerificarLogin } from "~/components/util";

export default component$(() => {
  const logado = useSignal(false);

  // Verifica o login no lado do cliente
  useVisibleTask$(async () => {
    logado.value = await VerificarLogin();
  });

  return (
    <>
      {logado.value ? <Header /> : <HeaderLogin />}
      <div class="flex min-h-screen items-center justify-center bg-gray-100"> 
        <div class="bg-white p-8 rounded-2xl shadow-lg text-center w-full max-w-md">
          <h1 class="uppercase text-2xl font-bold text-blue-600 mb-4">Blockchain</h1>
          <p class="text-gray-600 mb-6">
            Parabéns por estar a utilizar esta plataforma moderna e segura baseada em tecnologia Blockchain! <br />
            Com este conjunto de serviços, garantimos maior transparência, rastreabilidade e confiança nos seus processos. <br />
            Estamos felizes por fazer parte da sua jornada digital.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
});
