import { component$, useSignal, useStore, $, useTask$ } from "@builder.io/qwik";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import type { Cliente, Proforma, Parametro } from "~/components/entidade";

export default component$(() => {
  
  const carregando = useSignal(false);
  const visualizacaoTabela = useSignal(false);

  const isActiveModalCliente = useSignal<null | 'novop' | 'editarc' | 'proformas'>(null);
  const isSelectedCliente = useSignal<Partial<Cliente> | null>(null);
  

  const state = useStore<{
    clientes: Partial<Cliente>[];
    parametros: Partial<Parametro>[];
    proformas: Partial<Proforma>[];
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

  useTask$(() => {
    state.clientes = [
      {id: "a1", nome: "Antonio Miguel Antonio", telefone: "845421639", email: "e@gmail.com", morada: "Bairro 5 Chimoio", data: "12/05/2022"},
      {id: "a2", nome: "Merdi Mutombo", telefone: "875421632", email: "r@gmail.com", morada: "Bairro 5 Chimoio", data: "12/05/2023"},
      {id: "a12", nome: "Albano Antonio", telefone: "875421633", email: "ew@gmail.com", morada: "Bairro 5 Chimoio", data: "12/05/2025"},
    ]

    state.parametros = [
      // Categoria: Agua
      {id: "a11e", categoria: "Agua", nome: "Cinzas", valor: 1100, formula: "x/y"},
      {id: "a12e", categoria: "Agua", nome: "Sódio", valor: 500, formula: "x*y/z"},
      {id: "a13e", categoria: "Agua", nome: "Magnésio", valor: 750, formula: "x/z + y"},
      
      // Categoria: Alimento
      {id: "a14e", categoria: "Alimento", nome: "Zinco", valor: 900, formula: "x*y/z"},
      {id: "a15e", categoria: "Alimento", nome: "Ferro", valor: 300, formula: "x - y * z"},
      {id: "a16e", categoria: "Alimento", nome: "Cálcio", valor: 1200, formula: "x/y + z"},
      
      // Categoria: Agua e Alimento
      {id: "a17e", categoria: "Agua e Alimento", nome: "Cálcio", valor: 1000, formula: "x/y*x/z"},
      {id: "a18e", categoria: "Agua e Alimento", nome: "Fósforo", valor: 400, formula: "x - y * z"},
      {id: "a19e", categoria: "Agua e Alimento", nome: "Potássio", valor: 800, formula: "(x + y) / z"},
    ];

    state.proformas = [
      {id: "a11e", cliente: "a1", nome: "Analise de Agua", parametros: "pa1,pa2,pa3,", totalpagar: 1000, data: "12/05/2022", estado: "resolvido"},
      {id: "a1e1", cliente: "a1", nome: "Analise de Alimentos", parametros: "pa1,pa2,pa3,", totalpagar: 1000, data: "12/05/2022", estado: "nresolvido"}
    ]

  })

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




  const addCliente = $((e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const dados = Object.fromEntries(new FormData(form).entries());

    state.clientes.push({
      nome: dados.nome as string,
      telefone: dados.telefone as string,
      email: dados.email as string,
      morada: dados.morada as string,
      data: dados.data as string,
    });

    form.reset();
    state.mensagem = "Cliente salvo com sucesso!";
  });
  const addProforma = $((e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    // Verificando se o cliente foi selecionado
    if (!isSelectedCliente.value) {
      state.erro = "Por favor, selecione um cliente!";
      return;
    }

    // Verificando se o nome, parâmetros e total a pagar estão corretos
    if (!state.form.proforma.nome?.trim()) {
      state.erro = "O nome da proforma não pode ser vazio!";
      return;
    }

    if (!state.form.proforma.parametros?.trim()) {
      state.erro = "Os parâmetros não podem ser vazios!";
      return;
    }

    if (Number(state.form.proforma.totalpagar) <= 0) {
      state.erro = "O valor total a pagar deve ser maior que zero!";
      return;
    }

    const novaProforma: Proforma = {
      cliente: isSelectedCliente.value?.id?.trim() as string,
      nome: state.form.proforma.nome as string,
      parametros: state.form.proforma.parametros as string,
      totalpagar: +(state.form.proforma.totalpagar ?? "0"),
      estado: "Pendente",
      data: new Date().toISOString(),
      id: String(state.proformas.length + 1),
    };


    // Salvando a proforma
    state.proformas.push(novaProforma);

    console.log("Proforma salva:", novaProforma); // Log da nova proforma

    form.reset(); // Resetando o formulário
    isSelectedCliente.value = null; 
    isActiveModalCliente.value = null; 
    state.form.proforma = {};
    state.mensagem = "Proforma salva com sucesso!"; // Exibindo a mensagem de sucesso
    state.erro = ""; // Limpando qualquer erro anterior
  });


return (
    <>
      <Header />

      {carregando.value && (
        <div class="p-4 max-w-screen-lg mx-auto flex min-h-screen items-center justify-center bg-gray-100">
          <div class="bg-white p-8 rounded-2xl shadow-lg text-center w-full max-w-md">
            <p class="text-gray-600 mb-6">Estamos carregando seu ambiente personalizado...</p>
            <div class="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid mx-auto"></div>
          </div>
        </div>
      )}

      <main class="p-4 max-w-screen-lg mx-auto mt-10">
        <h2 class="text-lg font-semibold uppercase">Cadastro do cliente</h2>

        <form
          preventdefault:submit
          onSubmit$={addCliente}
          class="bg-white p-4 rounded-xl shadow mb-6"
        >
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input name="nome" placeholder="Nome" required class="border p-2 rounded" />
            <input name="telefone" placeholder="Telefone" required class="border p-2 rounded" />
            <input name="email" placeholder="Email" type="email" required class="border p-2 rounded" />
            <input name="morada" placeholder="Morada" required class="border p-2 rounded" />
            <input name="data" placeholder="Data" required class="border p-2 rounded" />
          </div>
          <div class="mt-4 text-right">
            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Salvar
            </button>
          </div>
        </form>

        {state.mensagem && (
          <div class="text-green-600 mb-4">{state.mensagem}</div>
        )}

        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold uppercase">Clientes Cadastrados</h2>
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
                    <td class="p-2 border-b">{c.data}</td>
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
                <p class="text-sm"><strong>Data:</strong> {c.data}</p>
                <div class="flex justify-between items-center mt-3">
                  <button
                    class="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                    onClick$={() => {
                      isSelectedCliente.value = c;
                      isActiveModalCliente.value = "editarc";
                    }}
                  >
                    Editar
                  </button>
                  <button
                    class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    onClick$={() => {
                      isSelectedCliente.value = c;
                      isActiveModalCliente.value = "novop";
                    }}
                  >
                    + Proforma
                  </button>
                  <button
                    class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    onClick$={() => {
                      isSelectedCliente.value = c;
                      isActiveModalCliente.value = "proformas";
                    }}
                  >
                    Proformas {state.proformas.filter((d) => d.cliente === c.id)?.length}
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
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select name="nome" value={state.form.proforma.nome} class="border p-2 rounded" onChange$={(e) => state.form.proforma.nome = (e.target as HTMLInputElement).value}>
                      <option disabled selected>Selecione categoria</option>
                      {[...new Set(state.parametros.map((d) => d.categoria))].map((nome) => (
                        <option key={nome} value={nome}>
                          {nome}
                        </option>
                      ))}
                    </select>

                    {state.parametros.filter((d) => d.categoria === (state.form.proforma.nome)).map((d) => (
                      <div key={d.id}>
                        <input
                          type="checkbox"
                          id={d.id}
                          onChange$={(e) => parametroSelecionadoTipadorFormProforma(d, (e.target as HTMLInputElement).checked)}
                        />
                        <label for={d.id} class="ml-2">
                          {d.nome} ({d.valor} MZN)
                        </label>
                      </div>
                    ))}

                    <input name="parametros" value={state.form.proforma.parametros || ""} required class="border p-2 rounded" />
                    <input name="totalpagar" value={state.form.proforma.totalpagar || 0} required class="border p-2 rounded" />
                  </div>

                  <div class="mt-4 text-right">
                    <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      Salvar
                    </button>
                  </div>
                </form>
              </>
            )}


            {isActiveModalCliente.value === "editarc" && (
              <>
                <h2 class="text-lg font-bold mb-4">Editar :: {isSelectedCliente.value?.nome}</h2>
              </>
            )}

            {isActiveModalCliente.value === "proformas" && (
              <>
                <h2 class="text-lg font-bold mb-4">Proformas :: {isSelectedCliente.value?.nome}</h2>
                <div class="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                  {state.proformas.filter((d) => d.cliente === isSelectedCliente.value?.id).map((c, i) => (
                    <div key={i} class="bg-white border p-4 rounded-xl shadow-sm">
                      <h3 class="text-lg font-bold uppercase">{c.nome}</h3>
                      <p class="text-sm"><strong>Cliente:</strong> {c.cliente}</p>
                      <p class="text-sm"><strong>Parametros:</strong> {c.parametros}</p>
                      <p class="text-sm"><strong>Total:</strong> {c.totalpagar}</p>
                      <p class="text-sm"><strong>Data:</strong> {c.data}</p>
                      
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
});
