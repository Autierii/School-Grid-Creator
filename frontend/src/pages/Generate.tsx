import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Gauge, Layers, Play, Save, Users } from 'lucide-react';
import HorariosEditor from '../components/HorariosEditor';
import { GradeModal, GradeView } from '../components/GradeView';
import { Alert, Button, Card, IconBadge, Input, PageHeader } from '../components/ui';
import { api, ApiError, DIAS, mensagemDeErro } from '../lib/api';
import { useDialogs } from '../lib/dialogs';
import { useSchool } from '../lib/hooks';
import type { ResultadoGrade } from '../lib/types';

export default function Generate() {
  const { school, reloadSchool } = useSchool();
  const { toast } = useDialogs();

  // `null` = ainda não editado: usa os horários salvos na escola.
  const [editados, setEditados] = useState<string[] | null>(null);
  const horarios = editados ?? school?.horarios ?? [];
  const alterado = editados !== null && editados.join('|') !== school?.horarios.join('|');

  const [resultado, setResultado] = useState<ResultadoGrade | null>(null);
  const [loading, setLoading] = useState(false);
  const [salvandoHorarios, setSalvandoHorarios] = useState(false);
  const [error, setError] = useState('');
  const [problemas, setProblemas] = useState<string[]>([]);
  const [nomeGrade, setNomeGrade] = useState('');
  const [salva, setSalva] = useState(false);

  if (!school) return null;

  const slots = DIAS.length * horarios.length;

  const handleSaveHorarios = async () => {
    setSalvandoHorarios(true);
    try {
      await api(`/schools/${school.id}`, { method: 'PUT', json: { horarios } });
      setEditados(null);
      reloadSchool();
      toast('Horários salvos.');
    } catch (e) {
      toast(mensagemDeErro(e), 'error');
    }
    setSalvandoHorarios(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setProblemas([]);
    setResultado(null);
    setSalva(false);
    try {
      const data = await api<ResultadoGrade>(`/schools/${school.id}/generate`, { method: 'POST', json: { horarios } });
      setResultado(data);
      setNomeGrade(`Grade de ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`);
      setEditados(null);
      reloadSchool(); // o backend salva os horários usados
    } catch (err) {
      setError(mensagemDeErro(err));
      if (err instanceof ApiError && Array.isArray(err.data?.problemas)) setProblemas(err.data.problemas);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!resultado) return;
    try {
      await api(`/schools/${school.id}/schedules`, {
        method: 'POST',
        json: { name: nomeGrade.trim() || 'Grade sem nome', data: JSON.stringify(resultado.grade) },
      });
      setSalva(true);
      reloadSchool();
      toast('Grade salva no histórico.');
    } catch (err) {
      toast(mensagemDeErro(err), 'error');
    }
  };

  return (
    <>
      <PageHeader title="Gerar nova grade" description="Defina os horários de aula e deixe o sistema distribuir as aulas sem choques de professor." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <IconBadge icon={Clock} size="sm" />
            <div>
              <h2 className="font-bold text-slate-900">Horários das aulas</h2>
              <p className="text-sm text-slate-500">Os mesmos para os 5 dias da semana, na ordem em que acontecem.</p>
            </div>
          </div>

          <HorariosEditor value={horarios} onChange={setEditados} />

          {alterado && (
            <Alert tone="warning" className="mt-4">
              As restrições dos professores usam os <strong>nomes</strong> dos horários. Se você renomeou algum, revise as restrições na tela de Professores.
            </Alert>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            {alterado && (
              <Button variant="secondary" icon={Save} loading={salvandoHorarios} onClick={handleSaveHorarios} disabled={!horarios.length}>
                Salvar horários
              </Button>
            )}
            <Button size="lg" icon={Play} loading={loading} onClick={handleGenerate} disabled={!horarios.length}>
              {loading ? 'Gerando...' : 'Gerar grade'}
            </Button>
          </div>

          {error && (
            <Alert tone="error" title={error} className="mt-5">
              {problemas.length > 0 && (
                <ul className="mt-1 list-disc space-y-1 pl-5">{problemas.map(p => <li key={p}>{p}</li>)}</ul>
              )}
            </Alert>
          )}
        </Card>

        <Card className="h-fit p-6">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900"><Gauge size={18} className="text-slate-400" /> Resumo</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="flex items-center gap-2 text-slate-500"><Layers size={15} /> Turmas</dt><dd className="font-semibold">{school._count.classes}</dd></div>
            <div className="flex justify-between"><dt className="flex items-center gap-2 text-slate-500"><Users size={15} /> Professores</dt><dd className="font-semibold">{school._count.teachers}</dd></div>
            <div className="flex justify-between"><dt className="flex items-center gap-2 text-slate-500"><Clock size={15} /> Aulas possíveis por turma</dt><dd className="font-semibold">{slots}</dd></div>
            <div className="flex justify-between border-t border-slate-100 pt-3"><dt className="text-slate-500">Aulas atribuídas (total)</dt><dd className="font-semibold">{school.totalAulas ?? 0}</dd></div>
          </dl>
          <p className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
            O gerador garante: nenhum professor em duas turmas ao mesmo tempo, horários bloqueados respeitados e no máximo 2 aulas da mesma disciplina por dia em cada turma.
          </p>
        </Card>
      </div>

      {resultado && (
        <GradeModal
          titulo={resultado.completa ? 'Grade gerada com sucesso!' : 'Grade gerada com conflitos'}
          subtitulo={resultado.completa
            ? `Nenhum choque de horário · resolvida em ${resultado.tempoMs < 1000 ? `${resultado.tempoMs} ms` : `${(resultado.tempoMs / 1000).toFixed(1)} s`}`
            : 'Não foi possível eliminar todos os choques. Veja os detalhes abaixo.'}
          icone={<IconBadge icon={resultado.completa ? CheckCircle2 : AlertTriangle} tone={resultado.completa ? 'emerald' : 'amber'} />}
          acoes={
            <>
              <Input
                value={nomeGrade}
                onChange={e => setNomeGrade(e.target.value)}
                disabled={salva}
                className="w-full sm:w-64"
                placeholder="Nome da grade"
                aria-label="Nome da grade"
              />
              <Button variant={salva ? 'secondary' : 'success'} icon={salva ? CheckCircle2 : Save} onClick={handleSave} disabled={salva}>
                {salva ? 'Salva no histórico' : 'Salvar grade'}
              </Button>
            </>
          }
          onClose={() => setResultado(null)}
        >
          {(resultado.conflitos.length > 0 || resultado.avisos.length > 0) && (
            <div className="no-print mx-auto mb-6 max-w-[1400px] space-y-3">
              {resultado.conflitos.length > 0 && (
                <Alert tone="error" title={`Conflitos (${resultado.conflitos.length})`}>
                  <ul className="list-disc space-y-0.5 pl-5">{resultado.conflitos.map(c => <li key={c}>{c}</li>)}</ul>
                </Alert>
              )}
              {resultado.avisos.length > 0 && (
                <Alert tone="warning" title={`Avisos (${resultado.avisos.length})`}>
                  <ul className="list-disc space-y-0.5 pl-5">{resultado.avisos.map(a => <li key={a}>{a}</li>)}</ul>
                </Alert>
              )}
            </div>
          )}
          <GradeView grade={resultado.grade} horarios={resultado.horarios} nome={nomeGrade || 'grade'} />
        </GradeModal>
      )}
    </>
  );
}
