import type { Restricao } from './types';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
export const VAGO = '—';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// fetch + JSON com tratamento de erro padronizado.
export async function api<T = any>(path: string, options: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: json !== undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. O backend está rodando (npm run dev)?', 0, null);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error || `Erro ${res.status}`, res.status, data);
  return data as T;
}

export const mensagemDeErro = (e: unknown) => (e instanceof Error ? e.message : 'Erro inesperado.');

export function parseRestricoes(raw: string | null | undefined): Restricao[] {
  try {
    const lista = JSON.parse(raw || '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

// "MAT (João (Manhã))" -> { materia: "MAT", professor: "João (Manhã)" }
export function parseAula(valor: string | undefined) {
  if (!valor || valor === VAGO) return null;
  const m = valor.match(/^(.*?) \((.*)\)$/);
  return m ? { materia: m[1], professor: m[2] } : { materia: valor, professor: '' };
}

/** "1 aula" / "3 aulas" */
export const plural = (n: number, singular: string, pluralForm = `${singular}s`) => `${n} ${n === 1 ? singular : pluralForm}`;
