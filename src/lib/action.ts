import { routeAction$, type JSONObject } from '@builder.io/qwik-city';
import { addDado, updateDado } from '~/components/DTO';
import type { Cliente, Proforma } from '~/components/entidade';

// Factory function to create an add action for a given collection
export function createAddClienteAction<T extends { id: string; nome: string }>(collectionName: string) {
  return routeAction$(async (form: JSONObject, { fail }) => {
    try {
      if (!form || !form.nome || typeof form.nome !== 'string') {
        return fail(400, { message: `Nome é obrigatório para adicionar ${collectionName}.` });
      }
      const dado = form as T;
      await addDado(collectionName, dado);
      return { success: true, message: `${collectionName} adicionado com sucesso.`, dado };
    } catch (error) {
      return fail(500, { message: `Erro interno ao salvar ${collectionName}: ${error}` });
    }
  });
}

export function createAddProformaAction<T extends { id: string; nome: string }>(collectionName: string) {
  return routeAction$(async (form: JSONObject, { fail }) => {
    try {
      if (!form || !form.nome || typeof form.nome !== 'string') {
        return fail(400, { message: `Nome é obrigatório para adicionar ${collectionName}.` });
      }
      const dado = form as T;
      await addDado(collectionName, dado);
      return { success: true, message: `${collectionName} adicionado com sucesso.`, dado };
    } catch (error) {
      return fail(500, { message: `Erro interno ao salvar ${collectionName}: ${error}` });
    }
  });
}

export function createAddComprovativoAction<T extends { id: string }>(collectionName: string) {
  return routeAction$(async (form: JSONObject, { fail }) => {
    try {
      if (!form.proforma) { return fail(400, { message: `Proforma é obrigatório para adicionar ${collectionName}.` }); }
      if (!form.data) { return fail(400, { message: `Data é obrigatório para adicionar ${collectionName}.` }); }
      
      const dado = form as T;
      await addDado(collectionName, dado);
      return { success: true, message: `${collectionName} adicionado com sucesso.`, dado };
    } catch (error) {
      return fail(500, { message: `Erro interno ao salvar ${collectionName}: ${error}` });
    }
  });
}

export function createAddParametroAction<T extends { id: string}>(collectionName: string) {
  return routeAction$(async (form: JSONObject, { fail }) => {
    try {
      if (!form.id) { return fail(400, { message: `ID é obrigatório para adicionar ${collectionName}.` }); }
      if (!form.categoria) { return fail(400, { message: `Categoria é obrigatório para adicionar ${collectionName}.` }); }
      if (!form.valor) { return fail(400, { message: `Valor é obrigatório para adicionar ${collectionName}.` }); }
      if (!form.campos) { return fail(400, { message: `Campos é obrigatório para adicionar ${collectionName}.` }); }
      if (!form.formula) { return fail(400, { message: `Formula é obrigatório para adicionar ${collectionName}.` }); }
      
      const dado = form as T;
      await addDado(collectionName, dado);
      return { success: true, message: `${collectionName} adicionado com sucesso.`, dado };
    } catch (error) {
      return fail(500, { message: `Erro interno ao salvar ${collectionName}: ${error}` });
    }
  });
}


export function createEditClienteAction<T extends { id: string }>(collectionName: string) {
  return routeAction$(async (form: JSONObject, { fail }) => {
    try {
      if (!form || !form.id || typeof form.id !== 'string') {
        return fail(400, { message: `ID é obrigatório para editar ${collectionName}.` });
      }

      const dado = form as T;

      await updateDado(collectionName, dado.id, dado);

      return { success: true, message: `${collectionName} editado com sucesso.`, dado };
    } catch (error) {
      return fail(500, { message: `Erro interno ao editar ${collectionName}: ${error}` });
    }
  });
}

export function createEditProformaAction<T extends { id: string; nome: string }>(collectionName: string) {
  return routeAction$(async (form: JSONObject, { fail }) => {
    try {
      if (!form || !form.id || !form.nome || typeof form.nome !== 'string') {
        return fail(400, { message: `ID e nome são obrigatórios para editar ${collectionName}.` });
      }
      const dado = form as T;
      await updateDado(collectionName, dado.id, {
        ...dado,
      });
      return { success: true, message: `${collectionName} editado com sucesso.`, dado };
    } catch (error) {
      return fail(500, { message: `Erro interno ao editar ${collectionName}: ${error}` });
    }
  });
}
export function createEditParametroAction<T extends { id: string }>(collectionName: string) {
  return routeAction$(async (form: JSONObject, { fail }) => {
    try {
      if (!form || !form.id || typeof form.id !== 'string') {
        return fail(400, { message: `ID é obrigatório para editar ${collectionName}.` });
      }

      const dado = form as T;

      await updateDado(collectionName, dado.id, dado);

      return { success: true, message: `${collectionName} editado com sucesso.`, dado };
    } catch (error) {
      return fail(500, { message: `Erro interno ao editar ${collectionName}: ${error}` });
    }
  });
}

/*export const useAddCliente = routeAction$(async (form: JSONObject, { fail }) => {
  try {
    const dado = form as unknown as Cliente;
    await addDado("clientes", dado);
    return { success: true, message: "Adicionado com sucesso.", dado };
  } catch (error) {
    return fail(500, { message: `Erro interno ao salvar: ${error}` });
  }
});

export const useAddProforma = routeAction$(async (form: JSONObject, { fail }) => {
  try {
    const dado = form as unknown as Proforma;
    await addDado("clientes", dado);
    return { success: true, message: "Adicionado com sucesso.", dado };
  } catch (error) {
    return fail(500, { message: `Erro interno ao salvar: ${error}` });
  }
});*/


export function createAddAnaliseAction<T extends { id: string}>(collectionName: string) {
  return routeAction$(async (form: JSONObject, { fail }) => {
    try {
      if (!form || !form.proforma || typeof form.proforma !== 'string') {
        return fail(400, { message: `Proforma é obrigatório para adicionar ${collectionName}.` });
      }
      if (!form || !form.parametro || typeof form.parametro !== 'string') {
        return fail(400, { message: `Parametro é obrigatório para adicionar ${collectionName}.` });
      }
      if (!form || !form.data || typeof form.data !== "string") {
        return fail(400, { message: `Data é obrigatória para adicionar ${collectionName}.` });
      }

      const dataValida = new Date(form.data);
      if (isNaN(dataValida.getTime())) {
        return fail(400, { message: "Formato de data inválido. Use um formato ISO (YYYY-MM-DDTHH:mm:ssZ)." });
      }

      const dado = form as T;
      await addDado(collectionName, dado);
      return { success: true, message: `${collectionName} adicionado com sucesso.`, dado };
    } catch (error) {
      return fail(500, { message: `Erro interno ao salvar ${collectionName}: ${error}` });
    }
  });
}