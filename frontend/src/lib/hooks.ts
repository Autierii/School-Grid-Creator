import { useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { mensagemDeErro } from './api';
import { useDialogs } from './dialogs';
import type { School } from './types';

export type SchoolContext = {
  school: School | null;
  /** Recarrega a escola (nome, horários e contadores do menu). */
  reloadSchool: () => void;
};

/** Escola aberta no painel (fornecida por SchoolLayout). */
export const useSchool = () => useOutletContext<SchoolContext>();

/**
 * Executa uma ação na API mostrando erro (ou sucesso) em um toast e,
 * no fim, recarrega os dados da tela e os contadores da escola.
 */
export function useAction(refresh?: () => void) {
  const { toast } = useDialogs();
  const { reloadSchool } = useSchool();
  return useCallback(async (fn: () => Promise<unknown>, sucesso?: string) => {
    try {
      await fn();
      if (sucesso) toast(sucesso);
    } catch (e) {
      toast(mensagemDeErro(e), 'error');
    }
    refresh?.();
    reloadSchool();
  }, [toast, refresh, reloadSchool]);
}
