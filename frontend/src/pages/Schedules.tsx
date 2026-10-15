import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Eye, LayoutGrid, Pencil, Trash2, Wand2 } from 'lucide-react';
import { GradeModal, GradeView } from '../components/GradeView';
import { Alert, Button, EmptyState, IconBadge, IconButton, PageHeader } from '../components/ui';
import { api, mensagemDeErro } from '../lib/api';
import { useDialogs } from '../lib/dialogs';
import { useAction, useSchool } from '../lib/hooks';
import type { Grade, Schedule } from '../lib/types';

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function Schedules() {
  const { school } = useSchool();
  const { confirm, prompt, toast } = useDialogs();
  const navigate = useNavigate();
  const schoolId = school?.id;

  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [selected, setSelected] = useState<{ id: string; name: string; grade: Grade } | null>(null);
  const [error, setError] = useState('');

  const fetchSchedules = useCallback(() => {
    if (!schoolId) return;
    api<Schedule[]>(`/schools/${schoolId}/schedules`).then(setSchedules).catch(e => setError(mensagemDeErro(e)));
  }, [schoolId]);

  useEffect(fetchSchedules, [fetchSchedules]);

  const run = useAction(fetchSchedules);

  const handleDelete = async (s: Schedule) => {
    const ok = await confirm({ title: `Excluir "${s.name}"?`, message: 'A grade será removida do histórico.', confirmLabel: 'Excluir', danger: true });
    if (ok) run(() => api(`/schedules/${s.id}`, { method: 'DELETE' }), 'Grade excluída.');
  };

  const handleRename = async (s: Schedule) => {
    const r = await prompt({ title: 'Renomear grade', fields: [{ name: 'nome', label: 'Nome', value: s.name }] });
    if (r && r.nome !== s.name) run(() => api(`/schedules/${s.id}`, { method: 'PUT', json: { name: r.nome } }), 'Grade renomeada.');
  };

  const handleView = (s: Schedule) => {
    try {
      setSelected({ id: s.id, name: s.name, grade: JSON.parse(s.data) });
    } catch {
      toast('Os dados desta grade estão corrompidos.', 'error');
    }
  };

  const turmasDa = (s: Schedule) => {
    try {
      return Object.keys(JSON.parse(s.data)).length;
    } catch {
      return 0;
    }
  };

  return (
    <>
      <PageHeader title="Histórico de grades" description="Grades salvas: visualize, exporte para o Excel ou imprima quando quiser." />
      {error && <Alert tone="error" className="mb-6">{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schedules?.map(s => (
          <div key={s.id} className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <IconBadge icon={CalendarClock} />
              <div className="flex">
                <IconButton icon={Pencil} label="Renomear" onClick={() => handleRename(s)} />
                <IconButton icon={Trash2} label="Excluir do histórico" tone="danger" onClick={() => handleDelete(s)} />
              </div>
            </div>
            <h2 className="mt-4 line-clamp-2 font-bold text-slate-900">{s.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{dataHora(s.createdAt)} · {turmasDa(s)} turmas</p>
            <Button variant="secondary" icon={Eye} className="mt-5 w-full" onClick={() => handleView(s)}>Abrir grade</Button>
          </div>
        ))}
        {schedules?.length === 0 && (
          <EmptyState
            icon={CalendarClock}
            title="Nenhuma grade salva"
            description='Gere uma grade e clique em "Salvar grade" para guardá-la aqui.'
            action={<Button icon={Wand2} onClick={() => navigate('../generate')}>Gerar nova grade</Button>}
          />
        )}
      </div>

      {selected && (
        <GradeModal
          titulo={selected.name}
          subtitulo="Grade salva no histórico"
          icone={<IconBadge icon={LayoutGrid} />}
          onClose={() => setSelected(null)}
        >
          <GradeView grade={selected.grade} nome={selected.name} />
        </GradeModal>
      )}
    </>
  );
}
