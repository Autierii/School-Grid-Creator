import { DIAS, parseAula } from './api';
import type { Grade } from './types';

// Paleta das disciplinas na grade: tons suaves e distintos entre si.
const CORES = [
  'bg-brand-50 text-brand-800 ring-brand-200/70',
  'bg-emerald-50 text-emerald-800 ring-emerald-200/70',
  'bg-amber-50 text-amber-900 ring-amber-200/70',
  'bg-rose-50 text-rose-800 ring-rose-200/70',
  'bg-sky-50 text-sky-800 ring-sky-200/70',
  'bg-violet-50 text-violet-800 ring-violet-200/70',
  'bg-lime-50 text-lime-900 ring-lime-200/70',
  'bg-orange-50 text-orange-800 ring-orange-200/70',
  'bg-teal-50 text-teal-800 ring-teal-200/70',
  'bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200/70',
  'bg-cyan-50 text-cyan-800 ring-cyan-200/70',
  'bg-pink-50 text-pink-800 ring-pink-200/70',
];
export const COR_CHOQUE = 'bg-red-100 text-red-800 ring-red-300';

/** Mesma disciplina = mesma cor, em qualquer tela. */
export function corDa(texto: string) {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CORES[h % CORES.length];
}

export type Celula = { titulo: string; detalhe: string; cor: string } | null;
export type Tabela = { nome: string; celulas: Record<string, Record<string, Celula>> };

/** Grades antigas do histórico não guardam os horários: usa a ordem das chaves. */
export function horariosDaGrade(grade: Grade) {
  const primeira = Object.values(grade)[0];
  return primeira ? Object.keys(primeira[DIAS[0]] ?? {}) : [];
}

export function porTurma(grade: Grade, horarios: string[]): Tabela[] {
  return Object.keys(grade).map(turma => {
    const celulas: Tabela['celulas'] = {};
    for (const dia of DIAS) {
      celulas[dia] = {};
      for (const hora of horarios) {
        const aula = parseAula(grade[turma]?.[dia]?.[hora]);
        celulas[dia][hora] = aula && { titulo: aula.materia, detalhe: aula.professor, cor: corDa(aula.materia) };
      }
    }
    return { nome: turma, celulas };
  });
}

export function porProfessor(grade: Grade, horarios: string[]): Tabela[] {
  const mapa = new Map<string, Tabela>();
  for (const turma of Object.keys(grade)) {
    for (const dia of DIAS) {
      for (const hora of horarios) {
        const aula = parseAula(grade[turma]?.[dia]?.[hora]);
        if (!aula?.professor) continue;
        let t = mapa.get(aula.professor);
        if (!t) {
          t = { nome: aula.professor, celulas: Object.fromEntries(DIAS.map(d => [d, {}])) };
          mapa.set(aula.professor, t);
        }
        const atual = t.celulas[dia][hora];
        t.celulas[dia][hora] = atual
          ? { ...atual, detalhe: `${atual.detalhe}, ${turma}`, cor: COR_CHOQUE } // choque
          : { titulo: turma, detalhe: aula.materia, cor: corDa(aula.materia) };
      }
    }
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome));
}

/** Baixa as tabelas como CSV (separador ";" e BOM, para o Excel em português). */
export function exportarCsv(nomeArquivo: string, tabelas: Tabela[], horarios: string[]) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const linhas: string[] = [];
  for (const t of tabelas) {
    linhas.push(esc(t.nome));
    linhas.push(['Horário', ...DIAS].map(esc).join(';'));
    for (const hora of horarios) {
      linhas.push([hora, ...DIAS.map(d => {
        const c = t.celulas[d]?.[hora];
        return c ? `${c.titulo} (${c.detalhe})` : '';
      })].map(esc).join(';'));
    }
    linhas.push('');
  }
  const blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nomeArquivo.replace(/[^\p{L}\p{N}\-_ ]+/gu, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
