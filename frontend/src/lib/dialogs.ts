import { createContext, useContext } from 'react';

export type Tom = 'success' | 'error' | 'info';

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
};

export type PromptField = {
  name: string;
  label: string;
  value?: string;
  placeholder?: string;
  maxLength?: number;
  uppercase?: boolean;
};

export type PromptOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  fields: PromptField[];
};

export type Dialogs = {
  /** Pergunta sim/não. Resolve `true` se confirmado. */
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  /** Formulário curto. Resolve com os valores (já sem espaços nas pontas) ou `null` se cancelado. */
  prompt: (opts: PromptOptions) => Promise<Record<string, string> | null>;
  /** Mensagem temporária no canto da tela. */
  toast: (message: string, tom?: Tom) => void;
};

export const DialogContext = createContext<Dialogs | null>(null);

/** Substitui alert/confirm/prompt do navegador por diálogos com a cara do app. */
export function useDialogs() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialogs precisa estar dentro de <DialogProvider>.');
  return ctx;
}
