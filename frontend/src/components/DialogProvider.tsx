import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { DialogContext, type ConfirmOptions, type Dialogs, type PromptOptions, type Tom } from '../lib/dialogs';
import { Button, IconBadge, Input, Modal } from './ui';

type Pendente =
  | { tipo: 'confirm'; opts: ConfirmOptions; resolve: (ok: boolean) => void }
  | { tipo: 'prompt'; opts: PromptOptions; resolve: (v: Record<string, string> | null) => void };

type Toast = { id: number; message: string; tom: Tom };

const TOAST_ICONES = {
  success: <CheckCircle2 size={20} className="text-emerald-500" />,
  error: <XCircle size={20} className="text-red-500" />,
  info: <Info size={20} className="text-brand-500" />,
};

function PromptForm({ opts, onDone }: { opts: PromptOptions; onDone: (v: Record<string, string> | null) => void }) {
  const [valores, setValores] = useState(() => Object.fromEntries(opts.fields.map(f => [f.name, f.value ?? ''])));
  const limpos = Object.fromEntries(Object.entries(valores).map(([k, v]) => [k, v.trim()]));
  const valido = Object.values(limpos).every(Boolean);

  return (
    <Modal
      size="sm"
      title={opts.title}
      subtitle={opts.message}
      onClose={() => onDone(null)}
      footer={
        <>
          <Button variant="secondary" onClick={() => onDone(null)}>Cancelar</Button>
          <Button type="submit" form="prompt-form" disabled={!valido}>{opts.confirmLabel ?? 'Salvar'}</Button>
        </>
      }
    >
      <form id="prompt-form" className="space-y-4 p-6" onSubmit={e => { e.preventDefault(); if (valido) onDone(limpos); }}>
        {opts.fields.map(f => (
          <label key={f.name} className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">{f.label}</span>
            <Input
              value={valores[f.name]}
              placeholder={f.placeholder}
              maxLength={f.maxLength}
              onChange={e => setValores(v => ({ ...v, [f.name]: f.uppercase ? e.target.value.toUpperCase() : e.target.value }))}
            />
          </label>
        ))}
      </form>
    </Modal>
  );
}

export default function DialogProvider({ children }: { children: ReactNode }) {
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const proximoId = useRef(0);

  const fecharToast = useCallback((id: number) => setToasts(ts => ts.filter(t => t.id !== id)), []);

  const dialogs = useMemo<Dialogs>(() => ({
    confirm: opts => new Promise(resolve => setPendente({ tipo: 'confirm', opts, resolve })),
    prompt: opts => new Promise(resolve => setPendente({ tipo: 'prompt', opts, resolve })),
    toast: (message, tom = 'success') => {
      const id = ++proximoId.current;
      setToasts(ts => [...ts.slice(-3), { id, message, tom }]);
      setTimeout(() => fecharToast(id), tom === 'error' ? 7000 : 3500);
    },
  }), [fecharToast]);

  const concluir = (valor: boolean | Record<string, string> | null) => {
    if (!pendente) return;
    (pendente.resolve as (v: typeof valor) => void)(valor);
    setPendente(null);
  };

  return (
    <DialogContext.Provider value={dialogs}>
      {children}

      {pendente?.tipo === 'confirm' && (
        <Modal
          size="sm"
          title={pendente.opts.title}
          icon={<IconBadge icon={pendente.opts.danger ? AlertTriangle : Info} tone={pendente.opts.danger ? 'red' : 'brand'} />}
          onClose={() => concluir(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => concluir(false)}>Cancelar</Button>
              <Button variant={pendente.opts.danger ? 'danger' : 'primary'} onClick={() => concluir(true)}>
                {pendente.opts.confirmLabel ?? 'Confirmar'}
              </Button>
            </>
          }
        >
          {pendente.opts.message && <p className="px-6 py-5 text-slate-600">{pendente.opts.message}</p>}
        </Modal>
      )}

      {pendente?.tipo === 'prompt' && <PromptForm opts={pendente.opts} onDone={concluir} />}

      {createPortal(
        <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] flex flex-col items-end gap-2 sm:left-auto">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-white p-4 text-sm text-slate-700 shadow-xl ring-1 shadow-slate-900/10 ring-slate-200 animate-pop-in">
              {TOAST_ICONES[t.tom]}
              <p className="flex-1 font-medium">{t.message}</p>
              <button onClick={() => fecharToast(t.id)} className="text-slate-400 hover:text-slate-700" aria-label="Fechar aviso"><X size={16} /></button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </DialogContext.Provider>
  );
}
