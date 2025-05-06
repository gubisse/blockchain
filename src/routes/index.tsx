import { component$, useSignal } from "@builder.io/qwik";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

export default component$(() => {
  const carregando = useSignal(true);

  return (
    <>
      <Header />
      {carregando.value &&        
        <div class="flex min-h-screen items-center justify-center bg-gray-100">
          <div class="bg-white p-8 rounded-2xl shadow-lg text-center w-full max-w-md">
            <p class="text-gray-600 mb-6">Estamos carregando seu ambiente personalizado...</p>
            <div class="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid mx-auto"></div>
          </div>
        </div>
      }
      <Footer />
    </>

  );
});
