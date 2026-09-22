import { useState } from 'react';
import { Wand2, Image as ImageIcon, FileText } from 'lucide-react';
import { useParams } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

export default function MagicImport({ onImportComplete }: { onImportComplete: () => void }) {
  const { schoolId } = useParams();
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProcess = async () => {
    const provider = localStorage.getItem('ai_provider');
    const token = localStorage.getItem('ai_token');
    
    if (!token) {
      setError("Por favor, configure sua API Key nas configurações primeiro.");
      return;
    }
    if (!text && !image) {
      setError("Forneça um texto ou envie uma imagem fotográfica dos horários.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('provider', provider || 'gemini');
      formData.append('token', token);
      if (text) formData.append('text', text);
      if (image) formData.append('image', image);

      const res = await fetch(`${API_URL}/schools/${schoolId}/ai-import`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setText('');
        setImage(null);
        onImportComplete();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao processar.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1025] to-[#2a1b42] p-6 rounded-xl border border-purple-500/30 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Wand2 size={120} />
      </div>
      
      <h3 className="text-2xl mb-2 font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-2">
        <Wand2 size={24} className="text-purple-400" />
        Importação Mágica
      </h3>
      <p className="text-gray-400 mb-6 text-sm max-w-2xl">
        Cole um texto longo descrevendo as turmas e restrições, ou envie uma foto de uma tabela. A Inteligência Artificial irá entender e cadastrar tudo automaticamente para você!
      </p>

      <div className="flex flex-col md:flex-row gap-4 relative z-10">
        <textarea 
          placeholder="Ex: O João dá aula de Matemática nas Segundas as 7h para o 1ºA, e a Maria..."
          value={text}
          onChange={e => setText(e.target.value)}
          className="bg-[#130c1a]/80 backdrop-blur border border-[#3b2559] p-4 rounded-lg flex-1 text-white focus:outline-none focus:border-purple-500 resize-none h-32"
        />
        <div className="flex flex-col gap-4 w-full md:w-64">
          <label className="flex items-center justify-center gap-2 bg-[#130c1a]/80 border border-dashed border-[#3b2559] hover:border-purple-500 cursor-pointer p-4 rounded-lg text-gray-400 hover:text-white transition-colors h-14">
            <ImageIcon size={20} />
            {image ? image.name.slice(0,15)+'...' : 'Enviar Imagem'}
            <input type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files?.[0] || null)} />
          </label>
          <button 
            onClick={handleProcess}
            disabled={loading}
            className="h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? 'Extraindo...' : <><Wand2 size={20} /> Processar Dados</>}
          </button>
        </div>
      </div>
      {error && <div className="mt-4 text-red-400 font-semibold">{error}</div>}
    </div>
  );
}
