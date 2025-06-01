import { component$, useSignal, useStore, $, useTask$ } from "@builder.io/qwik";
import { routeLoader$, routeAction$, type JSONObject } from '@builder.io/qwik-city';
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import type { Cliente, Proforma, Parametro, Comprovativo } from "~/components/entidade";
import { clientes, parametros, proformas, comprovativos, elementosQuimicos118 } from "~/components/dado";
import { getAllDados, addDado, updateDado } from "~/components/DTO";
import { formatarDataHora } from "~/components/util";
import { createAddClienteAction, createEditClienteAction, createAddProformaAction } from '~/lib/action';

export const useGetClientes = routeLoader$(async () => getAllDados<Cliente>('cliente'));
export const useGetProformas = routeLoader$(async () => getAllDados<Proforma>('proforma'));

// Export specific add actions
export const useAddCliente = createAddClienteAction<Cliente>("cliente")
export const useEditCliente = createEditClienteAction<Cliente>("cliente")
export const useAddProforma = createAddProformaAction<Proforma>("proforma")

export default component$(() => {
  
  const carregando = useSignal(false);
  const visualizacaoTabela = useSignal(false);

  const isActiveModalCliente = useSignal<null | 'novop' | 'editarc' | 'proformas'>(null);
  const isSelectedCliente = useSignal<Partial<Cliente> | null>(null);

  const clientesLoader = useGetClientes();
  const proformasLoader = useGetProformas();
  
  const addCAction = useAddCliente();
  const addPAction = useAddProforma();
  
  const editCAction = useEditCliente();

  const state = useStore<{
    clientes: Partial<Cliente>[];
    parametros: Partial<Parametro>[];
    proformas: Partial<Proforma>[];
    comprovativos: Partial<Comprovativo>[];
    parametrosSelecionados: string[]; // Aqui estava o problema
    form: {
      cliente: Partial<Cliente>;
      parametro: Partial<Parametro>;
      proforma: Partial<Proforma>;
      erro: string;
      mensagem: string;
    };
    erro: string;
    mensagem: string;
  }>({
    clientes: [],
    parametros: [],
    proformas: [],
    comprovativos: [],
    parametrosSelecionados: [],
    form: {
      cliente: {},
      parametro: {},
      proforma: {},
      erro: "",
      mensagem: "",
    },
    erro: "",
    mensagem: "",
  });

  // Tarefa para inicializar o estado
  useTask$(async ({ track }) => {
    // Rastreia mudanças no clientesLoader
    track(() => clientesLoader.value);
    track(() => proformasLoader.value);

    // Atribui os valores ao estado
    state.clientes = await clientesLoader.value;
    state.proformas = await proformasLoader.value;
    state.parametros = parametros;
    state.comprovativos = comprovativos;
    console.log(state.clientes);
  })

  useTask$(({ track }) => {
    track(() => state.mensagem);
    if (state.mensagem) {
      setTimeout(() => {
        state.mensagem = "";
      }, 4000);
    }
  });

  useTask$(({ track }) => {
    track(() => state.erro);
    if (state.erro) {
      setTimeout(() => {
        state.erro = "";
      }, 6000);
    }
  });
  useTask$(({ track }) => {
    track(() => state.form.proforma.nome);
    if (state.form.proforma.nome) {
      state.parametrosSelecionados = [];      
      state.form.proforma.parametros = ""
      state.form.proforma.totalpagar = 0
    }
  });


  const parametroSelecionadoTipadorFormProforma = $((dado: any, marcado: boolean) => {
    const id = String(dado.id);

    // Garante que totalpagar começa com número
    if (typeof state.form.proforma.totalpagar !== 'number') {
      state.form.proforma.totalpagar = 0;
    }

    if (marcado) {
      if (!state.parametrosSelecionados.includes(id)) {
        state.parametrosSelecionados.push(id);
        state.form.proforma.totalpagar += Number(dado.valor);
      }
    } else {
      state.parametrosSelecionados = state.parametrosSelecionados.filter((i) => i !== id);
      state.form.proforma.totalpagar -= Number(dado.valor);
    }

    state.form.proforma.parametros = state.parametrosSelecionados.join(',');
  });



  const salvarCliente = $(async (e: Event) => {
    carregando.value = true;

    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const dados = Object.fromEntries(new FormData(form).entries());

    console.log(isActiveModalCliente.value)

    let r: any; 
    if(isActiveModalCliente.value === null ){
      r= await addCAction.submit(dados as unknown as Record<string, unknown>);
    }else if( isActiveModalCliente.value === "editarc" ){
      dados.id = isSelectedCliente!.value!.id;
      r= await editCAction.submit(dados as unknown as Record<string, unknown>);
    }
      
    form.reset();
    isSelectedCliente.value = null;
    isActiveModalCliente.value = null;
    carregando.value = false;
    
    if(r?.value?.success){

      state.mensagem = r?.value?.message;
      state.erro = "";
    
      state.clientes.push({
        nome: dados.nome as string,
        telefone: dados.telefone as string,
        email: dados.email as string,
        morada: dados.morada as string,
        data: dados.data as string,

      });

    }else{
      state.mensagem  = "";
      state.erro = r?.value?.message;
    }


  });
  const addProforma = $(async (e: Event) => {

    carregando.value = true;

    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const dados = Object.fromEntries(new FormData(form).entries());

    console.log(isActiveModalCliente.value)

    let r: any; 
    dados.cliente = isSelectedCliente!.value!.id;
    dados.estado = "Pendente";
    dados.data = new Date().toISOString();

    r= await addPAction.submit(dados as unknown as Record<string, unknown>);
      
    form.reset();
    isSelectedCliente.value = null;
    isActiveModalCliente.value = null;
    carregando.value = false;
    
    if(r?.value?.success){

      state.mensagem = r?.value?.message;
      state.erro = "";
    
      state.proformas.push(dados);

    }else{
      state.mensagem  = "";
      state.erro = r?.value?.message;
    }


  });

  const addComprovativo = $((e: Event, proformaId: string) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    if (!isSelectedCliente.value) {
      state.erro = "Por favor, selecione um cliente!";
      return;
    }

    const now = new Date();
    const dataFormatada = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const novo: Comprovativo = {
      id: String(state.comprovativos.length + 1),
      proforma: proformaId,
      data: dataFormatada, // ✅ agora está no formato desejado
    };

    state.comprovativos.push(novo);

    console.log("Comprovativo salvo:", novo);

    form.reset();
    isSelectedCliente.value = null;
    isActiveModalCliente.value = null;
    state.form.proforma = {};
    state.mensagem = "Comprovativo salvo com sucesso!";
    state.erro = "";
  });




return (
    <>
      <Header />

      {/* Full-screen loading overlay */}
      {carregando.value && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div class="bg-white p-8 rounded-2xl shadow-lg text-center w-full max-w-md">
            <p class="text-gray-600 mb-6">Trabalhando...</p>
            <div class="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid mx-auto"></div>
          </div>
        </div>
      )}

      <main class="p-4 max-w-screen-lg mx-auto mt-10">
        <h2 class="text-lg font-semibold uppercase">Cadastro do cliente</h2>

        <form
          preventdefault:submit
          onSubmit$={salvarCliente}
          class="bg-white p-4 rounded-xl shadow mb-6"
        >
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input type="text" name="nome" placeholder="Nome" required class="border p-2 rounded" />
            <input type="text" name="telefone" placeholder="Telefone" required class="border p-2 rounded" />
            <input type="email" name="email" placeholder="Email" required class="border p-2 rounded" />
            <input type="text" name="morada" placeholder="Morada" required class="border p-2 rounded" />
            <input
              type="datetime-local"
              value={new Date().toLocaleString('pt-PT', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              }).replace(', ', 'T').slice(0, 16)}
              name="data"
              placeholder="Data"
              required
              class="border p-2 rounded"
            />
          </div>
          <div class="mt-4 text-right">
            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Salvar
            </button>
          </div>
        </form>

        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold uppercase"><span class="text-blue-700">{""+state.clientes.length}</span> Clientes Cadastrados</h2>
          <button
            class="text-sm text-blue-700 underline"
            onClick$={() => (visualizacaoTabela.value = !visualizacaoTabela.value)}
          >
            {visualizacaoTabela.value ? "Cartões" : "Tabela"}
          </button>
        </div>

        {visualizacaoTabela.value ? (
          <div class="overflow-x-auto">
            <table class="min-w-full border border-gray-300 bg-white shadow rounded-xl">
              <thead>
                <tr class="bg-gray-100 text-left text-sm">
                  <th class="p-2 border-b">Nome</th>
                  <th class="p-2 border-b">Telefone</th>
                  <th class="p-2 border-b">Email</th>
                  <th class="p-2 border-b">Morada</th>
                  <th class="p-2 border-b">Data</th>
                </tr>
              </thead>
              <tbody>
                {state.clientes.map((c, i) => (
                  <tr key={i} class="hover:bg-gray-50 text-sm">
                    <td class="p-2 border-b">{c.nome}</td>
                    <td class="p-2 border-b">{c.telefone}</td>
                    <td class="p-2 border-b">{c.email}</td>
                    <td class="p-2 border-b">{c.morada}</td>
                    <td class="p-2 border-b">{formatarDataHora(c.data)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {state.clientes.map((c, i) => (
              <div key={i} class="bg-white border p-4 rounded-xl shadow-sm">
                <h3 class="text-lg font-bold uppercase">{c.nome}</h3>
                <p class="text-sm"><strong>Telefone:</strong> {c.telefone}</p>
                <p class="text-sm"><strong>Email:</strong> {c.email}</p>
                <p class="text-sm"><strong>Morada:</strong> {c.morada}</p>
                <p class="text-sm"><strong>Data:</strong> {formatarDataHora(c.data)}</p>
                <div class="flex justify-between items-center mt-3">
                  <button
                    class="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                    onClick$={() => {
                      isSelectedCliente.value = c;
                      state.form.cliente = c;
                      isActiveModalCliente.value = "editarc";
                    }}
                  >                    
                    <img
                      src="/public/cliente.png" // Substitua pelo caminho da sua imagem
                      alt="Ícone Proforma"
                      class="w-10 h-10" // Ajuste o tamanho conforme necessário
                    />
                  </button>
                  <button
                    class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-2"
                    onClick$={() => {
                      isSelectedCliente.value = c;
                      isActiveModalCliente.value = "novop";
                    }}
                  >
                    <img
                      src="/public/save-proforma.png" // Substitua pelo caminho da sua imagem
                      alt="Ícone Proforma"
                      class="w-10 h-10" // Ajuste o tamanho conforme necessário
                    />
                  </button>
                  <button
                    class="flex bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    onClick$={() => {
                      isSelectedCliente.value = c;
                      isActiveModalCliente.value = "proformas";
                    }}
                  >
                    <img
                      src="/public/lista-proformas.png" // Substitua pelo caminho da sua imagem
                      alt="Ícone Proforma"
                      class="w-10 h-10" // Ajuste o tamanho conforme necessário
                    /> {state.proformas.filter((d) => d.cliente === c.id)?.length}
                  </button>
                  <button
                    class="bg-red-900 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center gap-2"
                    onClick$={() => {
                      state.erro = "Nao e possivel eliminar o cliente, vai contra as norma."
                    }}
                  >
                    <img
                      src="/public/deletar.png" // Substitua pelo caminho da sua imagem
                      alt="Ícone Proforma"
                      class="w-10 h-10" // Ajuste o tamanho conforme necessário
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {state.clientes.length === 0 && (
          <div class="bg-white border p-4 rounded-xl shadow-sm mt-4">
            <p class="text-sm text-gray-600"><strong>Nenhum cliente cadastrado</strong></p>
          </div>
        )}
      </main>

      {/* Modal */}
      {isActiveModalCliente.value && (
        <div class="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-start overflow-y-auto">
          <div class="bg-white p-6 mt-10 rounded-xl shadow-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button
              class="absolute top-2 right-2 text-gray-600 hover:text-black"
              onClick$={() => isActiveModalCliente.value = null}
            >
              ✕
            </button>

            {isActiveModalCliente.value === "novop" && (
              <>
                <h2 class="text-lg font-bold mb-4">Novo Proforma :: {isSelectedCliente.value?.nome}</h2>
                <form
                  preventdefault:submit
                  onSubmit$={addProforma}
                  class="bg-white p-4 rounded-xl shadow mb-6"
                >
                  <div class="grid grid-cols-1 md:grid-cols-1 gap-4 mb-2">
                    <select name="nome" value={state.form.proforma.nome} class="border p-2 rounded" onChange$={(e) => state.form.proforma.nome = (e.target as HTMLInputElement).value}>
                      <option disabled selected>Selecione categoria</option>
                      {[...new Set(state.parametros.map((d) => d.categoria))].map((nome) => (
                        <option key={nome} value={nome}>
                          {nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">

                    {state.parametros.filter((d) => d.categoria === (state.form.proforma.nome)).map((d) => (
                      <div key={d.id}>
                        <input
                          type="checkbox"
                          id={d.id}
                          onChange$={(e) => parametroSelecionadoTipadorFormProforma(d, (e.target as HTMLInputElement).checked)}
                        />
                        <label for={d.id} class="ml-2">
                          {d.id} ({d.valor} MZN)
                        </label>
                      </div>
                    ))}
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-1 gap-4 mt-2">
                    <input name="parametros" value={state.form.proforma.parametros || "[ <elementos quimicos> ]"} required class="border p-2 rounded" readOnly />
                    <input name="totalpagar" value={state.form.proforma.totalpagar || "[ <valor a pagar> ]"} required class="border p-2 rounded" readOnly/>
                  </div>

                  {state.form.proforma.parametros &&

                    <div class="mt-4 text-right">
                      <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Salvar
                      </button>
                    </div>
                  }
                </form>
              </>
            )}


            {isActiveModalCliente.value === "editarc" && (
              <>
                <h2 class="text-lg font-bold mb-4">Editar :: {isSelectedCliente.value?.nome}</h2>
                <form preventdefault:submit onSubmit$={salvarCliente}>
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700">Nome</label>
                    <input
                      name="nome"
                      type="text"
                      class="border p-2 rounded w-full"
                      value={isSelectedCliente.value?.nome}
                      onInput$={(e) => (state.form.cliente.nome = (e.target as HTMLInputElement).value)}
                      required
                    />
                  </div>  
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700">Telefone</label>
                    <input
                      name="telefone"
                      type="text"
                      class="border p-2 rounded w-full"
                      value={isSelectedCliente.value?.telefone}
                      onInput$={(e) => (state.form.cliente.telefone = (e.target as HTMLInputElement).value)}
                      required
                    />
                  </div>  
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      name="email"
                      type="email"
                      class="border p-2 rounded w-full"
                      value={isSelectedCliente.value?.email}
                      onInput$={(e) => (state.form.cliente.email = (e.target as HTMLInputElement).value)}
                      required
                    />
                  </div>  
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700">Morada</label>
                    <input
                      name="morada"
                      type="text"
                      class="border p-2 rounded w-full"
                      value={isSelectedCliente.value?.morada}
                      onInput$={(e) => (state.form.cliente.morada = (e.target as HTMLInputElement).value)}
                      required
                    />
                  </div>  
                  
                  <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Salvar
                  </button>
                </form>
              </>
            )}

            {isActiveModalCliente.value === "proformas" && (
              <>
                <h2 class="text-lg font-bold mb-4">Proformas :: {isSelectedCliente.value?.nome}</h2>
                <div class="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                  {state.proformas.filter((d) => d.cliente === isSelectedCliente.value?.id).map((c, i) => (
                    <div key={i} class="bg-white border p-4 rounded-xl shadow-sm">
                      <h3 class="text-lg font-bold uppercase">{c.nome}</h3>
                      <p class="text-sm font-bold">Parâmetros:</p>
                      <div class="grid grid-cols-2 gap-2 mt-2">
                        {c.parametros?.split(',').map((pid) => {
                          const parametro = elementosQuimicos118.find(p => p.id === pid.trim());
                          return parametro ? (
                            <div class="border p-2 rounded bg-gray-100" key={pid}>
                              <p class="text-sm font-semibold">{parametro.nome}</p>
                              {/* Adicione mais detalhes se desejar */}
                              <p class="text-xs text-gray-600">{parametro.id}</p>
                            </div>
                          ) : (
                            <div class="border p-2 rounded bg-red-100" key={pid}>
                              <p class="text-sm text-red-600">Não encontrado: {pid}</p>
                            </div>
                          );
                        })}
                      </div>

                      <p class="text-sm"><strong>Total:</strong> {c.totalpagar}</p>
                      <p class="text-sm"><strong>Data:</strong> {formatarDataHora(c.data)}</p>
                      {state.comprovativos.find(d => d.proforma === c.id)?.data ? (
                        <>
                          <p class="text-sm font-bold uppercase mt-3 text-green-600">Comprovada</p>
                          <p class="text-sm">
                            <strong>Data:</strong> {formatarDataHora(state.comprovativos.find(d => d.proforma === c.id)?.data)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p class="text-sm italic text-red-600 mt-3">Ainda sem comprovativo registrado.</p>

                          {c?.id ? (
                            <form preventdefault:submit onSubmit$={(e) => addComprovativo(e, c.id as string)} class="mt-2 space-y-2">
                              <label class="flex items-center space-x-2 text-sm">
                                <input type="checkbox" required class="border" />
                                <span>Confirmar pagamento</span>
                              </label>
                              <button type="submit" class="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700">
                                Registrar Comprovativo
                              </button>
                            </form>
                          ) : (
                            <p class="text-sm italic text-red-600 mt-3">Ainda sem comprovativo registrado.</p>
                          )}

                        </>

                      )}

                      
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}


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
