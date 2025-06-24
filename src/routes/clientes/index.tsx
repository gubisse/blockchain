import { component$, useSignal, useStore, $, useTask$, useComputed$ } from "@builder.io/qwik";
import { routeLoader$ } from '@builder.io/qwik-city';
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import type { Cliente, Proforma, Parametro, Comprovativo } from "~/components/entidade";
import { elementosQuimicos118 } from "~/components/dado";
import { getAllDados } from "~/components/DTO";
import { formatarDataHora } from "~/components/util";
import { createAddClienteAction, createEditClienteAction, createAddProformaAction, createAddComprovativoAction } from '~/lib/action';

export const useGetClientes = routeLoader$(async () => getAllDados<Cliente>('cliente'));
export const useGetProformas = routeLoader$(async () => getAllDados<Proforma>('proforma'));
export const useGetParametros = routeLoader$(async () => getAllDados<Parametro>('parametro'));
export const useGetComprovativos = routeLoader$(async () => getAllDados<Comprovativo>('comprovativo'));

export const useAddCliente = createAddClienteAction<Cliente>("cliente")
export const useAddProforma = createAddProformaAction<Proforma>("proforma")
export const useAddComprovativo = createAddComprovativoAction<Comprovativo>("comprovativo")

export const useEditCliente = createEditClienteAction<Cliente>("cliente")

export default component$(() => {
  
  const carregando = useSignal(false);
  const visualizacaoTabela = useSignal(false);

  const isSearch = useSignal("");
  const selectedColumn = useSignal<keyof Cliente>("nome");
  const itemsPerPage = 9;
  const paginaCorrente = useSignal(1);

  const isActiveModalCliente = useSignal<null | 'novop' | 'editarc' | 'proformas'>(null);
  const isSelectedCliente = useSignal<Partial<Cliente> | null>(null);

  const clientesLoader = useGetClientes();
  const proformasLoader = useGetProformas();
  const comprovativosLoader = useGetComprovativos();
  const parametrosLoader = useGetParametros();
  
  const addCAction = useAddCliente();
  const addPAction = useAddProforma();
  const addCPAction = useAddComprovativo();
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
    track(() => comprovativosLoader.value);

    // Atribui os valores ao estado
    state.clientes = await clientesLoader.value;
    state.proformas = await proformasLoader.value;
    state.comprovativos = await comprovativosLoader.value;
    state.parametros = await parametrosLoader.value;
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
      dados.id = isSelectedCliente!.value!.id || "";
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

    dados.cliente = isSelectedCliente!.value!.id || "";
    dados.estado = "Pendente";
    dados.data = new Date().toISOString();

    const r = await addPAction.submit(dados as unknown as Record<string, unknown>);
      
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

  const addComprovativo = $( async (e: Event, proformaId: string) => {

    carregando.value = true;

    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const dados = Object.fromEntries(new FormData(form).entries());

    const now = new Date();
    const dataFormatada = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    dados.proforma = proformaId || "";
    dados.data = dataFormatada;

    const r = await addCPAction.submit(dados as unknown as Record<string, unknown>);
      
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


    // Filtragem e paginação
  const filtrado = useComputed$(() => {
    let result = state.clientes;
    
    if (isSearch.value) {
      result = result.filter((dado) => {
        if(selectedColumn.value === "data"){
          
          const value = dado[selectedColumn.value]?.toString().toLowerCase();
          return formatarDataHora(value)?.includes(isSearch.value.toLowerCase());
          
        }else{
          const value = dado[selectedColumn.value]?.toString().toLowerCase();
          return value?.includes(isSearch.value.toLowerCase());

        }
      });
    }
    return result;
  });


  const totalPaginas = useComputed$(() => Math.ceil(filtrado.value.length / itemsPerPage));
  const paginado = useComputed$(() => {
    const start = (paginaCorrente.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    if(filtrado){

      return filtrado?.value?.slice(start, end);

    }
  });




return (
    <>
      <Header />

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

        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-4">
          {/* Título com total de clientes */}
          <h2 class="text-lg font-semibold uppercase">
            <span class="text-blue-700">{state.clientes.length}</span> Clientes Cadastrados
          </h2>

          {/* Filtros e alternância de visualização */}
          <div class="flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center">
            {/* Seletor de coluna para filtrar */}
            <select
              class="border p-2 rounded text-sm"
              onChange$={(e) =>
                (selectedColumn.value = (e.target as HTMLSelectElement).value as keyof Cliente)
              }
            >
              <option value="">Pesquisar por</option>
              <option value="nome">Nome</option>
              <option value="telefone">Telefone</option>
              <option value="email">Email</option>
              <option value="morada">Morada</option>
              <option value="data">Data</option>
            </select>

            {/* Campo de pesquisa */}
            <input
              type="text"
              class="border p-2 rounded text-sm"
              placeholder={selectedColumn.value ? `Procurar por ${selectedColumn.value}...` : "Pesquisar..."}
              onInput$={(e) => {
                isSearch.value = (e.target as HTMLInputElement).value;
                paginaCorrente.value = 1;
              }}
            />

            {/* Botão de alternância entre Tabela e Cartões */}
            <button
              class="bg-blue-900 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition"
              onClick$={() => (visualizacaoTabela.value = !visualizacaoTabela.value)}
            >
              {visualizacaoTabela.value ? "Cartões" : "Tabela"}
            </button>
          </div>
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
                {(paginado?.value ?? [])
                .map((dado: Cliente, index) => {
                return (
                  <tr key={dado.id} class="hover:bg-gray-50 text-sm">
                    <td class="p-2 border-b">{dado.nome}</td>
                    <td class="p-2 border-b">{dado.telefone}</td>
                    <td class="p-2 border-b">{dado.email}</td>
                    <td class="p-2 border-b">{dado.morada}</td>
                    <td class="p-2 border-b">{formatarDataHora(dado.data)}</td>
                  </tr>
                )
                })}
              </tbody>
            </table>
            
          </div>
        ) : (
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(paginado?.value ?? [])
            .map((c) => (
              <div key={c.id} class="bg-white border p-4 rounded-xl shadow-sm">
                <h3 class="text-lg font-bold uppercase">{c.nome}</h3>
                <p class="text-sm"><strong>Telefone:</strong> {c.telefone}</p>
                <p class="text-sm"><strong>Email:</strong> {c.email}</p>
                <p class="text-sm"><strong>Morada:</strong> {c.morada}</p>
                <p class="text-sm"><strong>Data:</strong> {formatarDataHora(c.data)}</p>
                <div class="grid gap-1">
                  <button
                    class="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                    onClick$={() => {
                      isSelectedCliente.value = c;
                      state.form.cliente = c;
                      isActiveModalCliente.value = "editarc";
                    }}
                  >                    
                    Editar cliente
                  </button>
                  <button
                    class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    onClick$={() => {
                      isSelectedCliente.value = c;
                      isActiveModalCliente.value = "novop";
                    }}
                  >
                    Novo proforma
                  </button>
                  <button
                    class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    onClick$={() => {
                      isSelectedCliente.value = c;
                      isActiveModalCliente.value = "proformas";
                    }}
                  >
                    {"Listar proformas <<" + state.proformas.filter((d) => d.cliente === c.id)?.length+">>"}
                  </button>
                  <button
                    class="bg-red-900 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    onClick$={() => {
                      state.erro = "Nao e possivel eliminar o cliente, vai contra as norma."
                    }}
                  >
                    Deletar proforma
                  </button>
                </div>
              </div>
            ))}

          </div>

        )}
        {paginado?.value?.length !== 0 && (
          <div class="flex justify-center items-center mt-3 gap-3">
            <button
              class="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              onClick$={() => (paginaCorrente.value = Math.max(1, paginaCorrente.value - 1))}
              disabled={paginaCorrente.value === 1}
            >
              Anterior
            </button>
            <span>
              {paginaCorrente.value} de {totalPaginas.value}
            </span>
            <button
              class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              onClick$={() => (paginaCorrente.value = Math.min(totalPaginas.value, paginaCorrente.value + 1))}
              disabled={paginaCorrente.value === totalPaginas.value}
            >
              Próxima
            </button>
          </div>
        )}
        {paginado?.value?.length === 0 && (
          <div class="bg-white border p-4 rounded-xl shadow-sm mt-4">
            <p class="text-sm text-gray-600"><strong>Nenhum cliente cadastrado</strong></p>
          </div>
        )}
      </main>

      {/* Modal */}
      {isActiveModalCliente.value && (
        <div class="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-start overflow-y-auto">
          <div class="bg-white p-6 mt-10 rounded-xl shadow-xl w-full max-w-xl relative max-h-[90vh] overflow-y-auto">
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
