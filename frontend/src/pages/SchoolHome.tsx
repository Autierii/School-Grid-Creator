import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarClock, Check, Clock, Layers, Pencil, Users, Wand2, type LucideIcon } from 'lucide-react';
import { Button, Card, IconBadge, PageHeader } from '../components/ui';
import { api, DIAS } from '../lib/api';
import { useDialogs } from '../lib/dialogs';
import { useAction, useSchool } from '../lib/hooks';

function Stat({ icon, label, value, to }: { icon: LucideIcon; label: string; value: number | string; to: string }) {
  return (
    <Link to={to} className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all hover:ring-brand-300">
      <IconBadge icon={icon} />
      <div>
        <div className="font-display text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </Link>
  );
}

function Passo({ n, feito, titulo, descricao, to, acao }: { n: number; feito: boolean; titulo: string; descricao: string; to: string; acao: string }) {
  return (
    <li className="flex items-start gap-4 p-5">
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${feito ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'}`}>
        {feito ? <Check size={16} strokeWidth={3} /> : n}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`font-semibold ${feito ? 'text-slate-500' : 'text-slate-900'}`}>{titulo}</div>
        <p className="text-sm text-slate-500">{descricao}</p>
      </div>
      <Link to={to} className="hidden shrink-0 items-center gap-1 self-center text-sm font-semibold text-brand-600 hover:text-brand-800 sm:flex">
        {acao} <ArrowRight size={15} />
      </Link>
    </li>
  );
}

export default function SchoolHome() {
  const { school } = useSchool();
  const { prompt } = useDialogs();
  const run = useAction();

  if (!school) return null;
  const c = school._count;
  const slots = DIAS.length * school.horarios.length;

  const handleRename = async () => {
    const r = await prompt({ title: 'Renomear escola', fields: [{ name: 'nome', label: 'Nome da escola', value: school.name }] });
    if (r && r.nome !== school.name) run(() => api(`/schools/${school.id}`, { method: 'PUT', json: { name: r.nome } }), 'Escola renomeada.');
  };

  const passos = [
    { feito: c.subjects > 0, titulo: 'Cadastre as disciplinas', descricao: 'Nome e sigla de cada matéria (ex.: Matemática / MAT).', to: 'subjects', acao: 'Disciplinas' },
    { feito: c.teachers > 0, titulo: 'Cadastre os professores', descricao: 'E marque os horários em que cada um não pode dar aula.', to: 'teachers', acao: 'Professores' },
    { feito: (school.totalAulas ?? 0) > 0, titulo: 'Monte as turmas', descricao: 'Para cada turma: professor + disciplina + aulas por semana.', to: 'classes', acao: 'Turmas' },
    { feito: c.schedules > 0, titulo: 'Gere e salve a grade', descricao: 'O sistema distribui as aulas sem choques de horário.', to: 'generate', acao: 'Gerar' },
  ];
  const pronto = passos.slice(0, 3).every(p => p.feito);

  return (
    <>
      <PageHeader
        title={school.name}
        description="Visão geral da escola e próximos passos para montar a grade."
        actions={<Button variant="secondary" icon={Pencil} onClick={handleRename}>Renomear</Button>}
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Users} label="Professores" value={c.teachers} to="teachers" />
        <Stat icon={BookOpen} label="Disciplinas" value={c.subjects} to="subjects" />
        <Stat icon={Layers} label="Turmas" value={c.classes} to="classes" />
        <Stat icon={CalendarClock} label="Grades salvas" value={c.schedules} to="schedules" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Primeiros passos</h2>
          </div>
          <ol className="divide-y divide-slate-100">
            {passos.map((p, i) => <Passo key={p.to} n={i + 1} {...p} />)}
          </ol>
        </Card>

        <div className="flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-lg shadow-brand-600/20">
            <div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/10" />
            <Wand2 size={28} className="relative" />
            <h2 className="relative mt-4 text-xl font-bold">{pronto ? 'Tudo pronto para gerar!' : 'Gerar a grade'}</h2>
            <p className="relative mt-1 text-sm text-brand-100">
              {pronto ? 'Os cadastros básicos estão completos.' : 'Complete os passos ao lado e gere a grade em segundos.'}
            </p>
            <Link to="generate" className="relative mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50">
              Gerar nova grade <ArrowRight size={16} />
            </Link>
          </div>

          <Card className="p-5">
            <div className="flex items-center gap-2 font-semibold text-slate-900"><Clock size={18} className="text-slate-400" /> Semana letiva</div>
            <p className="mt-2 text-sm text-slate-500">
              {DIAS.length} dias × {school.horarios.length} horários = <strong className="text-slate-700">{slots} aulas possíveis</strong> por turma.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              <strong className="text-slate-700">{school.totalAulas ?? 0}</strong> aulas semanais atribuídas no total.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {school.horarios.map(h => <span key={h} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{h}</span>)}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
