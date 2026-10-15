import { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { BookOpen, CalendarClock, ChevronLeft, LayoutDashboard, Layers, Users, Wand2 } from 'lucide-react';
import AppShell, { NavItem, NavSection } from '../components/AppShell';
import { Alert } from '../components/ui';
import { api, mensagemDeErro } from '../lib/api';
import type { SchoolContext } from '../lib/hooks';
import type { School } from '../lib/types';

/** Painel de uma escola: menu com as seções e as páginas filhas no <Outlet>. */
export default function SchoolLayout() {
  const { schoolId } = useParams();
  const [school, setSchool] = useState<School | null>(null);
  const [error, setError] = useState('');

  const reloadSchool = useCallback(() => {
    api<School>(`/schools/${schoolId}`)
      .then(s => { setSchool(s); setError(''); })
      .catch(e => setError(mensagemDeErro(e)));
  }, [schoolId]);

  useEffect(reloadSchool, [reloadSchool]);

  const base = `/school/${schoolId}`;
  const c = school?._count;

  const sidebar = (
    <>
      <div className="space-y-3">
        <Link to="/" className="flex items-center gap-1 px-3 text-sm font-medium text-slate-400 transition-colors hover:text-white">
          <ChevronLeft size={16} /> Todas as escolas
        </Link>
        <div className="truncate rounded-xl bg-white/5 px-3 py-3 font-display font-semibold text-white ring-1 ring-white/10" title={school?.name}>
          {school?.name ?? '...'}
        </div>
      </div>
      <NavSection title="Escola">
        <NavItem to={base} end icon={LayoutDashboard} label="Visão geral" />
      </NavSection>
      <NavSection title="Cadastros">
        <NavItem to={`${base}/teachers`} icon={Users} label="Professores" badge={c?.teachers} />
        <NavItem to={`${base}/subjects`} icon={BookOpen} label="Disciplinas" badge={c?.subjects} />
        <NavItem to={`${base}/classes`} icon={Layers} label="Turmas" badge={c?.classes} />
      </NavSection>
      <NavSection title="Grades">
        <NavItem to={`${base}/generate`} icon={Wand2} label="Gerar nova grade" />
        <NavItem to={`${base}/schedules`} icon={CalendarClock} label="Histórico" badge={c?.schedules} />
      </NavSection>
    </>
  );

  return (
    <AppShell sidebar={sidebar}>
      {error && !school ? (
        <Alert tone="error" title="Não foi possível abrir esta escola">
          {error} <Link to="/" className="font-semibold underline">Voltar para a lista de escolas</Link>.
        </Alert>
      ) : (
        <Outlet context={{ school, reloadSchool } satisfies SchoolContext} />
      )}
    </AppShell>
  );
}
