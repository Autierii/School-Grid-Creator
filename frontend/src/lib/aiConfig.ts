// Configuração da Importação Mágica, guardada só no navegador.

const PROVIDER_KEY = 'ai_provider';
const TOKEN_KEY = 'ai_token';

const ler = (chave: string, padrao = '') => {
  try {
    return localStorage.getItem(chave) || padrao;
  } catch {
    return padrao;
  }
};

export const lerAiConfig = () => ({ provider: ler(PROVIDER_KEY, 'gemini'), token: ler(TOKEN_KEY) });

/** Lança erro se o navegador bloquear o armazenamento (ex.: modo privado). */
export function salvarAiConfig(provider: string, token: string) {
  localStorage.setItem(PROVIDER_KEY, provider);
  localStorage.setItem(TOKEN_KEY, token.trim());
}
