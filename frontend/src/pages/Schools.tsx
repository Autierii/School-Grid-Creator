import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Layers, Plus, School as SchoolIcon, Trash2, Users } from 'lucide-react';
import AppShell, { NavItem, NavSection } from '../components/AppShell';
import { Alert, Button, EmptyState, IconBadge, PageHeader, QuickAdd, quickAddInputClass } from '../components/ui';
import { api, mensagemDeErro } from '../lib/api';
import { useDialogs } from '../lib/dialogs';
import type { School } from '../lib/types';

export default function Schools() {
  const { confirm, toast } = useDialogs();
  const [schools, setSchools] = useState<School[] | null>(null);
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api<School[]>('/schools').then(setSchools).catch(e => setError(mensagemDeErro(e)));
  }, []);

  const handleCreate = async () => {
    if (!nome.trim()) return;
    try {
      const nova = await api<School>('/schools', { method: 'POST', json: { name: nome } });
      setSchools(s => [...(s ?? []), nova]);
      setNome('');
      toast(`Escola "${nova.name}" criada.`);
    } catch (e) {
      toast(mensagemDeErro(e), 'error');
    }
  };

  const handleDelete = async (school: School) => {
    const ok = await confirm({
      title: `Excluir "${school.name}"?`,
      message: 'Todos os professores, disciplinas, turmas e grades salvas desta escola serão apagados. Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir escola',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/schools/${school.id}`, { method: 'DELETE' });
      setSchools(s => s?.filter(x => x.id !== school.id) ?? null);
      toast('Escola excluída.');
    } catch (e) {
      toast(mensagemDeErro(e), 'error');
    }
  };

  return (
    <AppShell sidebar={<NavSection title="Menu"><NavItem to="/" end icon={SchoolIcon} label="Minhas escolas" badge={schools?.length} /></NavSection>}>
      <PageHeader title="Suas escolas" description="Cada escola tem seus próprios professores, disciplinas, turmas e grades." />

      {error && <Alert tone="error" title="Não foi possível carregar as escolas" className="mb-6">{error}</Alert>}

      <QuickAdd onSubmit={handleCreate}>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da nova escola..." aria-label="Nome da nova escola" className={quickAddInputClass} />
        <Button type="submit" size="lg" icon={Plus} disabled={!nome.trim()}>Criar escola</Button>
      </QuickAdd>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {schools?.map(school => (
          <div key={school.id} className="group relative">
            <Link
              to={`/school/${school.id}`}
              className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70 hover:ring-brand-300"
            >
              <IconBadge icon={SchoolIcon} />
              <h2 className="mt-4 line-clamp-2 pr-8 text-lg font-bold leading-snug text-slate-900">{school.name}</h2>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Users size={15} /> {school._count.teachers}</span>
                <span className="flex items-center gap-1.5"><BookOpen size={15} /> {school._count.subjects}</span>
                <span className="flex items-center gap-1.5"><Layers size={15} /> {school._count.classes}</span>
              </div>
              <span className="mt-6 flex items-center gap-1 text-sm font-semibold text-brand-600">
                Abrir painel <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <button
              onClick={() => handleDelete(school)}
              className="absolute top-4 right-4 rounded-lg p-2 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Excluir escola"
              aria-label={`Excluir ${school.name}`}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {schools?.length === 0 && (
          <EmptyState
            icon={SchoolIcon}
            title="Nenhuma escola ainda"
            description="Digite o nome da sua escola acima para começar. Dica: rode npm run seed no backend para criar uma escola de exemplo completa."
          />
        )}
      </div>
    </AppShell>
  );
}
