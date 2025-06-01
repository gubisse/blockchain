import { supabase } from '~/lib/supabase';

// Interface para tipar objetos com campos de data
interface HasDateFields {
  [key: string]: any;
  data?: string | Date | null;
  ultimaModificacao?: string | Date | null;
}

// Converte strings de data em Date
const parseDates = <T extends HasDateFields>(data: any): T => {
  const result = { ...data };
  for (const key in result) {
    if (key === 'data' || key === 'ultimamodificacao') {
      result[key] = result[key] ? new Date(result[key]) : null;
    }
  }
  return result as T;
};


const serializeDates = <T extends Record<string, any>>(data: T): T => {
  const result = { ...data };

  for (const key of Object.keys(result)) {
    const value = result[key];
    if (
      value instanceof Date &&
      (key === 'data' || key === 'ultimamodificacao')
    ) {
      (result as any)[key] = value.toISOString().split('T')[0];
    }
  }

  return result;
};


export async function getAllDados<T extends HasDateFields>(collection: string): Promise<T[]> {
  try {
    const { data, error } = await supabase.from(collection).select('*');
    if (error) throw error;
    return data.map(item => parseDates<T>(item));
  } catch (error) {
    console.error(`Erro ao ler ${collection}:`, error);
    return [];
  }
}

export async function addDado<T extends HasDateFields>(collection: string, dado: T): Promise<void> {
  try {
    const serializedDado = serializeDates(dado);
    const { error } = await supabase.from(collection).insert(serializedDado);
    if (error) throw error;
  } catch (error) {
    console.error(`Erro ao adicionar em ${collection}:`, error);
    throw new Error(`Falha ao salvar em ${collection}`);
  }
}

export async function updateDado<T extends HasDateFields>(collection: string, id: string, updatedData: Partial<T>): Promise<void> {
  try {
    const serializedData = serializeDates(updatedData);
    const { error } = await supabase
      .from(collection)
      .update(serializedData)
      .eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error(`Erro ao atualizar em ${collection}:`, error);
    throw new Error(`Falha ao atualizar em ${collection}`);
  }
}
export async function updateDadoEstoque<T extends HasDateFields>(collection: string, compra: string, updatedData: Partial<T>): Promise<void> {
  try {
    const serializedData = serializeDates(updatedData);
    const { error } = await supabase
      .from(collection)
      .update(serializedData)
      .eq('compra', compra);
    if (error) throw error;
  } catch (error) {
    console.error(`Erro ao atualizar em ${collection}:`, error);
    throw new Error(`Falha ao atualizar em ${collection}`);
  }
}