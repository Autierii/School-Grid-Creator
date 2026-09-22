import { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';

export default function AiConfigModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [provider, setProvider] = useState('gemini');
  const [token, setToken] = useState('');

  useEffect(() => {
    if (isOpen) {
      setProvider(localStorage.getItem('ai_provider') || 'gemini');
      setToken(localStorage.getItem('ai_token') || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('ai_token', token);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#1a1025] border border-[#3b2559] p-8 rounded-xl max-w-md w-full relative shadow-2xl shadow-purple-900/20">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-purple-300">
          <Settings /> Configuração Mágica
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Provedor de IA</label>
            <select 
              value={provider} 
              onChange={e => setProvider(e.target.value)}
              className="w-full bg-[#130c1a] border border-[#3b2559] p-3 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="gemini">Google Gemini (Recomendado para Imagens)</option>
              <option value="claude">Anthropic Claude</option>
              <option value="cohere">Cohere (Apenas Texto)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sua API Key (Token)</label>
            <input 
              type="password" 
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Cole sua chave aqui..."
              className="w-full bg-[#130c1a] border border-[#3b2559] p-3 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-2">
              Sua chave é salva apenas localmente no seu navegador (`localStorage`).
            </p>
          </div>
        </div>

        <button 
          onClick={handleSave} 
          className="w-full mt-8 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors"
        >
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}
