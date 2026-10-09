import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar as CalendarIcon, CheckCircle2, AlertTriangle, Play, Save, Loader2 } from 'lucide-react';
import { api, ApiError, type Grade } from '../api';
import { GradeModal, GradeView } from '../components/GradeView';

type Resultado = {
  grade: Grade;
  horarios: string[];
  completa: boolean;
  conflitos: string[];
  avisos: string[];
  tempoMs: number;
};

export default function Generate() {
  const { schoolId } = useParams();
  const [horarios, setHorarios] = useState('');
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [problemas, setProblemas] = useState<string[]>([]);
  const [nomeGrade, setNomeGrade] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    api(`/schools/${schoolId}`)
      .then(s => setHorarios(s.horarios.join(', ')))
      .catch(() => setHorarios('7h, 8h, 9h, 10h, 11h'));
  }, [schoolId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setProblemas([]);
    setResultado(null);
    setSaveSuccess(false);
    try {
      const parsedHorarios = horarios.split(',').map(h => h.trim()).filter(h => h);
      const data = await api<Resultado>(`/schools/${schoolId}/generate`, { method: 'POST', json: { horarios: parsedHorarios } });
      setResultado(data);
      setNomeGrade(`Grade de ${new Date().toLocaleString('pt-BR')}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao gerar grade.');
      if (err instanceof ApiError && Array.isArray(err.data?.problemas)) setProblemas(err.data.problemas);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!resultado) return;
    try {
      await api(`/schools/${schoolId}/schedules`, {
        method: 'POST',
        json: { name: nomeGrade.trim() || 'Grade sem nome', data: JSON.stringify(resultado.grade) },
      });
      setSaveSuccess(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar grade.');
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto fade-in">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Gerar Nova Grade</h2>
          <p className="text-slate-500 mt-1">Defina os parâmetros e deixe o sistema resolver os conflitos de horários para você.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
              <CalendarIcon size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Configuração de Horários</h3>
          </div>

          <label className="block text-sm font-medium text-slate-700 mb-2">Blocos de Aula (separados por vírgula)</label>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={horarios}
              onChange={e => setHorarios(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && handleGenerate()}
              className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex-1 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !horarios.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-wait text-white font-semibold py-4 px-8 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Processando...</> : <><Play size={20} fill="currentColor" /> Gerar Solução</>}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Exemplo: 7h, 7h50, 8h40, 9h50, 10h40. As restrições dos professores precisam usar exatamente estes mesmos nomes de horário.
          </p>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              <div className="font-bold">{error}</div>
              {problemas.length > 0 && (
                <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
                  {problemas.map(p => <li key={p}>{p}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {resultado && (
        <GradeModal
          titulo={resultado.completa ? 'Grade gerada com sucesso!' : 'Grade gerada com conflitos'}
          subtitulo={resultado.completa
            ? `Nenhum choque de horário. Resolvido em ${(resultado.tempoMs / 1000).toFixed(1)}s.`
            : 'Não foi possível eliminar todos os choques. Revise os avisos abaixo.'}
          icone={
            <div className={`p-3 rounded-xl ${resultado.completa ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              {resultado.completa ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            </div>
          }
          acoes={
            <>
              <input
                value={nomeGrade}
                onChange={e => setNomeGrade(e.target.value)}
                disabled={saveSuccess}
                className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-900 w-64 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                placeholder="Nome da grade"
              />
              <button
                onClick={handleSave}
                disabled={saveSuccess}
                className={`font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-sm ${saveSuccess ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
              >
                {saveSuccess ? <><CheckCircle2 size={20} /> Salva no Histórico</> : <><Save size={20} /> Salvar Grade</>}
              </button>
            </>
          }
          onClose={() => setResultado(null)}
        >
          {(resultado.conflitos.length > 0 || resultado.avisos.length > 0) && (
            <div className="max-w-[1400px] mx-auto mb-6 space-y-3 no-print">
              {resultado.conflitos.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                  <div className="font-bold mb-1">Conflitos ({resultado.conflitos.length})</div>
                  <ul className="list-disc ml-5 text-sm space-y-0.5">{resultado.conflitos.map(c => <li key={c}>{c}</li>)}</ul>
                </div>
              )}
              {resultado.avisos.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
                  <div className="font-bold mb-1">Avisos ({resultado.avisos.length})</div>
                  <ul className="list-disc ml-5 text-sm space-y-0.5">{resultado.avisos.map(a => <li key={a}>{a}</li>)}</ul>
                </div>
              )}
            </div>
          )}
          <GradeView grade={resultado.grade} horarios={resultado.horarios} nome={nomeGrade || 'grade'} />
        </GradeModal>
      )}
    </>
  );
}
