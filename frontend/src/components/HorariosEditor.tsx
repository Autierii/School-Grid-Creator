import { useState } from 'react';
import { Plus, X } from 'lucide-react';

const MODELOS = [
  { nome: 'Manhã · 5 aulas', horarios: ['7h', '7h50', '8h40', '9h50', '10h40'] },
  { nome: 'Manhã · 6 aulas', horarios: ['7h', '7h45', '8h30', '9h35', '10h20', '11h05'] },
  { nome: 'Tarde · 5 aulas', horarios: ['13h', '13h50', '14h40', '15h50', '16h40'] },
  { nome: 'Noite · 4 aulas', horarios: ['19h', '19h45', '20h40', '21h25'] },
];

/** Lista editável de blocos de aula: digite e Enter (ou vírgula) para adicionar. */
export default function HorariosEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [novo, setNovo] = useState('');

  const adicionar = (texto: string) => {
    const itens = texto.split(',').map(h => h.trim()).filter(h => h && !value.includes(h));
    if (itens.length) onChange([...value, ...new Set(itens)]);
    setNovo('');
  };

  return (
    <div className="space-y-3">
      <div className="flex min-h-14 flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15">
        {value.map((h, i) => (
          <span key={h} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 py-1.5 pr-1 pl-2.5 text-sm font-semibold text-brand-800 ring-1 ring-brand-200/70 ring-inset">
            <span className="text-xs font-bold text-brand-400 tabular-nums">{i + 1}ª</span>
            {h}
            <button onClick={() => onChange(value.filter(x => x !== h))} className="rounded p-0.5 text-brand-400 hover:bg-brand-100 hover:text-brand-800" aria-label={`Remover ${h}`}>
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          value={novo}
          onChange={e => (e.target.value.includes(',') ? adicionar(e.target.value) : setNovo(e.target.value))}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); adicionar(novo); }
            if (e.key === 'Backspace' && !novo && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => novo.trim() && adicionar(novo)}
          placeholder={value.length ? 'Adicionar horário...' : 'Digite um horário (ex.: 7h) e Enter'}
          aria-label="Adicionar horário"
          className="h-9 min-w-40 flex-1 bg-transparent px-2 text-sm focus:outline-none"
        />
        {novo.trim() && (
          <button onClick={() => adicionar(novo)} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50" aria-label="Adicionar"><Plus size={16} /></button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500">Modelos:</span>
        {MODELOS.map(m => (
          <button
            key={m.nome}
            onClick={() => onChange(m.horarios)}
            className="rounded-full bg-white px-3 py-1 font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:text-brand-700 hover:ring-brand-300"
          >
            {m.nome}
          </button>
        ))}
      </div>
    </div>
  );
}
