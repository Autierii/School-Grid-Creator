import { useState } from 'react';
import { ChevronDown, ImagePlus, Wand2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api, mensagemDeErro } from '../lib/api';
import { lerAiConfig } from '../lib/aiConfig';
import { Alert, Button } from './ui';

type Resumo = { disciplinas: number; professores: number; turmas: number; atribuicoes: number };

const EXEMPLO = 'O João dá 5 aulas de Matemática no 1º A e 3 no 2º B, e não pode na segunda às 7h. A Maria dá 4 aulas de História no 1º A...';

export default function MagicImport({ onImportComplete }: { onImportComplete: () => void }) {
  const { schoolId } = useParams();
  const [aberto, setAberto] = useState(false);
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resumo, setResumo] = useState<Resumo | null>(null);

  const handleProcess = async () => {
    const { provider, token } = lerAiConfig();
    if (!token) {
      setError('Configure sua API Key em "Configurações de IA" (menu lateral) primeiro.');
      return;
    }
    if (!text.trim() && !image) {
      setError('Escreva um texto ou envie uma imagem dos horários.');
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
      setError(mensagemDeErro(err));
    }
    setLoading(false);
  };

  return (
    <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 ring-1 ring-violet-200">
      <button onClick={() => setAberto(!aberto)} aria-expanded={aberto} className="flex w-full items-center gap-4 p-5 text-left">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/30">
          <Wand2 size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-slate-900">Importação Mágica com IA</h2>
          <p className="text-sm text-slate-500">Cole um texto ou envie a foto de uma tabela e a IA cadastra professores, disciplinas, turmas e restrições.</p>
        </div>
        <ChevronDown size={20} className={`shrink-0 text-slate-400 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="animate-fade-in px-5 pb-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <textarea
              placeholder={`Ex.: ${EXEMPLO}`}
              value={text}
              onChange={e => setText(e.target.value)}
              aria-label="Texto com os dados da escola"
              className="h-36 flex-1 resize-y rounded-xl border border-violet-200 bg-white p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15 focus:outline-none"
            />
            <div className="flex w-full flex-col gap-3 md:w-64">
              <label className="flex h-full min-h-14 min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-violet-200 bg-white p-3 text-sm text-slate-500 transition-colors hover:border-violet-400 hover:text-violet-700">
                <ImagePlus size={22} className="shrink-0" />
                <span className="flex max-w-full items-center gap-1">
                  <span className="truncate">{image ? image.name : 'Enviar imagem'}</span>
                  {image && (
                    <button onClick={e => { e.preventDefault(); setImage(null); }} className="shrink-0 rounded p-0.5 hover:text-red-600" aria-label="Remover imagem"><X size={14} /></button>
                  )}
                </span>
                <input type="file" accept="image/*" className="sr-only" onChange={e => { setImage(e.target.files?.[0] || null); e.target.value = ''; }} />
              </label>
              <Button variant="magic" size="lg" icon={Wand2} loading={loading} onClick={handleProcess}>
                {loading ? 'Extraindo...' : 'Processar dados'}
              </Button>
            </div>
          </div>
          {error && <Alert tone="error" className="mt-4">{error}</Alert>}
          {resumo && (
            <Alert tone="success" title="Importação concluída" className="mt-4">
              {resumo.professores} professor(es), {resumo.disciplinas} disciplina(s) e {resumo.turmas} turma(s) novos; {resumo.atribuicoes} atribuição(ões) de aulas.
              Confira os dados abaixo e nas telas de Professores e Disciplinas.
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
