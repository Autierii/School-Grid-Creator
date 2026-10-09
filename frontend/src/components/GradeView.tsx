import { useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Download, Printer, Users, Layers, X } from 'lucide-react';
import { DIAS, parseAula, type Grade } from '../api';

const CORES = [
  'bg-indigo-50 text-indigo-700 border-indigo-100',
  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'bg-amber-50 text-amber-800 border-amber-100',
  'bg-rose-50 text-rose-700 border-rose-100',
  'bg-sky-50 text-sky-700 border-sky-100',
  'bg-violet-50 text-violet-700 border-violet-100',
  'bg-lime-50 text-lime-800 border-lime-100',
  'bg-orange-50 text-orange-700 border-orange-100',
  'bg-teal-50 text-teal-700 border-teal-100',
  'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
];

function corDa(texto: string) {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CORES[h % CORES.length];
}

type Celula = { titulo: string; detalhe: string; cor: string } | null;
type Tabela = { nome: string; celulas: Record<string, Record<string, Celula>> };

function horariosDaGrade(grade: Grade) {
  const primeira = Object.values(grade)[0];
  return primeira ? Object.keys(primeira[DIAS[0]] ?? {}) : [];
}

function porTurma(grade: Grade, horarios: string[]): Tabela[] {
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

function porProfessor(grade: Grade, horarios: string[]): Tabela[] {
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
          ? { ...atual, detalhe: `${atual.detalhe}, ${turma}`, cor: 'bg-red-50 text-red-700 border-red-200' } // choque
          : { titulo: turma, detalhe: aula.materia, cor: corDa(aula.materia) };
      }
    }
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome));
}

function exportarCsv(nomeArquivo: string, tabelas: Tabela[], horarios: string[]) {
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
  // BOM para o Excel abrir acentos corretamente
  const blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nomeArquivo.replace(/[^\w\- ]+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function GradeView({ grade, horarios, nome }: { grade: Grade; horarios?: string[]; nome: string }) {
  const [modo, setModo] = useState<'turma' | 'professor'>('turma');
  const horas = horarios?.length ? horarios : horariosDaGrade(grade);
  const tabelas = useMemo(
    () => (modo === 'turma' ? porTurma(grade, horas) : porProfessor(grade, horas)),
    [grade, horas, modo]
  );

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
        <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {([['turma', 'Por turma', Layers], ['professor', 'Por professor', Users]] as const).map(([valor, label, Icon]) => (
            <button
              key={valor}
              onClick={() => setModo(valor)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${modo === valor ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportarCsv(`${nome} - ${modo}`, tabelas, horas)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
            <Download size={16} /> Exportar CSV
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {tabelas.map(t => (
          <div key={t.nome} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm print-break">
            <div className="bg-slate-900 px-5 py-4">
              <h3 className="text-xl font-bold text-white text-center">{t.nome}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 border-b border-slate-200 bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider w-36">Horário</th>
                    {DIAS.map(dia => (
                      <th key={dia} className="p-4 border-b border-l border-slate-200 bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider text-center w-1/5">{dia}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {horas.map(hora => (
                    <tr key={hora}>
                      <td className="p-4 border-b border-slate-100 font-semibold text-slate-600 bg-slate-50/50 text-sm whitespace-nowrap">{hora}</td>
                      {DIAS.map(dia => {
                        const c = t.celulas[dia]?.[hora];
                        return (
                          <td key={dia} className="p-2 border-b border-l border-slate-100 text-center align-middle">
                            {c ? (
                              <div className={`rounded-xl border px-2 py-2 ${c.cor}`}>
                                <div className="font-bold">{c.titulo}</div>
                                <div className="text-xs font-medium opacity-80 mt-0.5">{c.detalhe}</div>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tela cheia usada para exibir uma grade (gerada ou do histórico).
export function GradeModal({ titulo, subtitulo, icone, acoes, onClose, children }: {
  titulo: string;
  subtitulo?: ReactNode;
  icone?: ReactNode;
  acoes?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  return createPortal(
    <div className="print-root fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex fade-in">
      <div className="bg-slate-50 w-full h-full flex flex-col">
        <div className="p-6 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center bg-white shrink-0 shadow-sm z-10 no-print">
          <div className="flex items-center gap-4">
            {icone}
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{titulo}</h3>
              {subtitulo && <div className="text-sm text-slate-500">{subtitulo}</div>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {acoes}
            <button onClick={onClose} className="bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition-colors">
              <X size={20} /> Fechar
            </button>
          </div>
        </div>
        <div className="p-8 overflow-y-auto flex-1 print-scroll">
          <h2 className="hidden print-only text-2xl font-bold mb-4">{titulo}</h2>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
