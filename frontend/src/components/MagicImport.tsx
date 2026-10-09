import { useState } from 'react';
import { Wand2, Image as ImageIcon, ChevronDown, Loader2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

type Resumo = { disciplinas: number; professores: number; turmas: number; atribuicoes: number };

export default function MagicImport({ onImportComplete }: { onImportComplete: () => void }) {
  const { schoolId } = useParams();
  const [aberto, setAberto] = useState(false);
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resumo, setResumo] = useState<Resumo | null>(null);

  const handleProcess = async () => {
    const provider = localStorage.getItem('ai_provider') || 'gemini';
    const token = localStorage.getItem('ai_token');

    if (!token) {
      setError('Configure sua API Key em "Configurações" (menu lateral) primeiro.');
      return;
    }
    if (!text.trim() && !image) {
      setError('Forneça um texto ou envie uma imagem dos horários.');
      return;
    }

    setLoading(true);
    setError('');
    setResumo(null);
    try {
      const formData = new FormData();
      formData.append('provider', provider);
      formData.append('token', token);
      if (text.trim()) formData.append('text', text);
      if (image) formData.append('image', image);

      const data = await api<Resumo>(`/schools/${schoolId}/ai-import`, { method: 'POST', body: formData });
      setResumo(data);
      setText('');
      setImage(null);
      onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao processar.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl border border-violet-200 mb-10 overflow-hidden">
      <button onClick={() => setAberto(!aberto)} className="w-full flex items-center justify-between p-5 text-left">
        <div className="flex items-center gap-3">
          <div className="bg-violet-600 text-white p-2 rounded-xl"><Wand2 size={20} /></div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Importação Mágica com IA</h3>
            <p className="text-sm text-slate-500">Cole um texto ou envie uma foto e a IA cadastra professores, disciplinas e turmas.</p>
          </div>
        </div>
        <ChevronDown size={20} className={`text-slate-400 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="px-5 pb-5">
          <div className="flex flex-col md:flex-row gap-4">
            <textarea
              placeholder="Ex: O João dá 5 aulas de Matemática no 1º A e 3 no 2º B, e não pode na segunda às 7h. A Maria dá História..."
              value={text}
              onChange={e => setText(e.target.value)}
              className="bg-white border border-violet-200 p-4 rounded-xl flex-1 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none h-32"
            />
            <div className="flex flex-col gap-3 w-full md:w-64">
              <label className="flex items-center justify-center gap-2 bg-white border border-dashed border-violet-300 hover:border-violet-500 cursor-pointer p-4 rounded-xl text-slate-500 hover:text-violet-700 transition-colors h-14 min-w-0">
                <ImageIcon size={20} className="shrink-0" />
                <span className="truncate">{image ? image.name : 'Enviar Imagem'}</span>
                {image && (
                  <button onClick={e => { e.preventDefault(); setImage(null); }} className="shrink-0 hover:text-red-600"><X size={16} /></button>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={e => { setImage(e.target.files?.[0] || null); e.target.value = ''; }} />
              </label>
              <button
                onClick={handleProcess}
                disabled={loading}
                className="h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 flex justify-center items-center gap-2"
              >
                {loading ? <><Loader2 size={20} className="animate-spin" /> Extraindo...</> : <><Wand2 size={20} /> Processar Dados</>}
              </button>
            </div>
          </div>
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">{error}</div>}
          {resumo && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium">
              Importação concluída: {resumo.professores} professor(es), {resumo.disciplinas} disciplina(s) e {resumo.turmas} turma(s) novos; {resumo.atribuicoes} atribuição(ões) de aulas.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
