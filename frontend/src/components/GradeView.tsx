import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Download, Layers, Printer, Users, X } from 'lucide-react';
import { DIAS } from '../lib/api';
import { exportarCsv, horariosDaGrade, porProfessor, porTurma } from '../lib/grade';
import type { Grade } from '../lib/types';
import { Button, SearchInput, Tabs } from './ui';

export function GradeView({ grade, horarios, nome }: { grade: Grade; horarios?: string[]; nome: string }) {
  const [modo, setModo] = useState<'turma' | 'professor'>('turma');
  const [busca, setBusca] = useState('');
  const horas = useMemo(() => (horarios?.length ? horarios : horariosDaGrade(grade)), [grade, horarios]);
  const tabelas = useMemo(
    () => (modo === 'turma' ? porTurma(grade, horas) : porProfessor(grade, horas)),
    [grade, horas, modo],
  );
  const visiveis = tabelas.filter(t => t.nome.toLowerCase().includes(busca.trim().toLowerCase()));

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={modo}
          onChange={setModo}
          tabs={[
            { value: 'turma', label: 'Por turma', icon: Layers, count: Object.keys(grade).length },
            { value: 'professor', label: 'Por professor', icon: Users },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          {tabelas.length > 4 && <SearchInput value={busca} onChange={setBusca} placeholder={modo === 'turma' ? 'Filtrar turma...' : 'Filtrar professor...'} />}
          <Button variant="secondary" icon={Download} onClick={() => exportarCsv(`${nome} - por ${modo}`, visiveis, horas)}>CSV</Button>
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Imprimir</Button>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        {visiveis.map(t => (
          <section key={t.nome} className="print-break overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                {modo === 'turma' ? <Layers size={16} /> : <Users size={16} />}
              </span>
              <h3 className="text-lg font-bold text-slate-900">{t.nome}</h3>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="w-28 px-4 py-2.5 text-xs font-semibold tracking-wider text-slate-400 uppercase">Horário</th>
                    {DIAS.map(dia => (
                      <th key={dia} className="px-2 py-2.5 text-center text-xs font-semibold tracking-wider text-slate-500 uppercase">{dia}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {horas.map(hora => (
                    <tr key={hora} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-sm font-semibold whitespace-nowrap text-slate-600">{hora}</td>
                      {DIAS.map(dia => {
                        const c = t.celulas[dia]?.[hora];
                        return (
                          <td key={dia} className="p-1.5 text-center align-middle">
                            {c ? (
                              <div className={`rounded-lg px-2 py-1.5 ring-1 ring-inset ${c.cor}`}>
                                <div className="truncate text-sm font-bold">{c.titulo}</div>
                                <div className="truncate text-[11px] font-medium opacity-75" title={c.detalhe}>{c.detalhe}</div>
                              </div>
                            ) : (
                              <div className="flex h-[46px] items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-300">livre</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Tela cheia usada para exibir uma grade (gerada ou do histórico). */
export function GradeModal({ titulo, subtitulo, icone, acoes, onClose, children }: {
  titulo: string;
  subtitulo?: ReactNode;
  icone?: ReactNode;
  acoes?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const fechar = useRef(onClose);
  useEffect(() => { fechar.current = onClose; });

  useEffect(() => {
    // Esc fecha, a menos que um diálogo (ex.: confirmação) esteja aberto por cima.
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !document.querySelector('[role="dialog"][aria-labelledby]') && fechar.current();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, []);

  return createPortal(
    <div className="print-root fixed inset-0 z-50 flex bg-slate-950/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="flex h-full w-full flex-col bg-slate-50">
        <div className="no-print z-10 flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            {icone}
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{titulo}</h2>
              {subtitulo && <div className="text-sm text-slate-500">{subtitulo}</div>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {acoes}
            <Button variant="ghost" icon={X} onClick={onClose}>Fechar</Button>
          </div>
        </div>
        <div className="print-scroll flex-1 overflow-y-auto p-4 sm:p-8">
          <h1 className="print-only mb-4 text-2xl font-bold">{titulo}</h1>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
