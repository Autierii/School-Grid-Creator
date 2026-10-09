import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X } from 'lucide-react';

const ler = (chave: string, padrao: string) => {
  try {
    return localStorage.getItem(chave) || padrao;
  } catch {
    return padrao;
  }
};

function Conteudo({ onClose }: { onClose: () => void }) {
  const [provider, setProvider] = useState(() => ler('ai_provider', 'gemini'));
  const [token, setToken] = useState(() => ler('ai_token', ''));

  const handleSave = () => {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('ai_token', token.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in" onClick={onClose}>
      <div className="bg-white p-8 rounded-3xl max-w-md w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100">
          <X size={22} />
        </button>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900">
          <Settings className="text-violet-600" /> Configurações de IA
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Provedor de IA</label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-900 focus:outline-none focus:border-violet-500"
            >
              <option value="gemini">Google Gemini (recomendado para imagens)</option>
              <option value="claude">Anthropic Claude</option>
              <option value="cohere">Cohere (apenas texto)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sua API Key</label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Cole sua chave aqui..."
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-900 focus:outline-none focus:border-violet-500"
            />
            <p className="text-xs text-slate-500 mt-2">
              A chave fica salva apenas neste navegador e é enviada ao seu backend local somente na hora da importação.
            </p>
          </div>
        </div>

        <button onClick={handleSave} className="w-full mt-8 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-colors">
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}

export default function AiConfigModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return isOpen ? createPortal(<Conteudo onClose={onClose} />, document.body) : null;
}
