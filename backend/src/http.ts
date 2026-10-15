import { NextFunction, Request, Response } from 'express';
import { parseRestricoes } from './school-data';

/** Erro com status HTTP: lançado nas rotas e convertido em JSON pelo `errorHandler`. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Texto obrigatório, sem espaços nas pontas. */
export function texto(valor: unknown, campo: string) {
  const s = typeof valor === 'string' ? valor.trim() : '';
  if (!s) throw new HttpError(400, `O campo "${campo}" é obrigatório.`);
  return s;
}

/** Inteiro >= 1 (quantidade de aulas). */
export function quantidadeAulas(valor: unknown) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'A quantidade de aulas deve ser um número inteiro maior que zero.');
  return n;
}

/** Aceita a lista de restrições como array ou string JSON e devolve o JSON normalizado para o banco. */
export function restricoesJson(valor: unknown) {
  const lista: any[] = typeof valor === 'string' ? parseRestricoes(valor) : Array.isArray(valor) ? valor : [];
  return JSON.stringify(lista
    .filter(r => r && typeof r.dia === 'string' && r.hora != null && String(r.hora).trim())
    .map(r => ({ dia: r.dia, hora: String(r.hora).trim() })));
}

/** Lista de horários (blocos de aula) limpa, sem vazios. */
export function listaHorarios(valor: unknown): string[] | undefined {
  if (!Array.isArray(valor)) return undefined;
  return valor.map(h => String(h).trim()).filter(Boolean);
}

export const DEFAULT_HORARIOS = ['7h', '8h', '9h', '10h', '11h'];

/** Horários salvos na escola, ou o padrão quando ainda não foram configurados. */
export function horariosDaEscola(raw: string | null) {
  try {
    const lista = JSON.parse(raw || '');
    if (Array.isArray(lista) && lista.length > 0) return lista.map(String);
  } catch { /* usa o padrão */ }
  return DEFAULT_HORARIOS;
}

/** Último middleware: transforma qualquer erro em `{ error: "mensagem" }`. */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
  } else if (err?.code === 'P2025') {
    res.status(404).json({ error: 'Registro não encontrado.' });
  } else if (err?.code === 'P2003') {
    res.status(404).json({ error: 'Registro relacionado não encontrado (a escola, professor ou disciplina pode ter sido excluído).' });
  } else if (err?.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'Imagem muito grande (máximo 10 MB).' });
  } else if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
  } else {
    console.error(err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}
