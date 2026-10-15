import { useCallback, useEffect, useState } from 'react';
import { GraduationCap, Layers, Link as LinkIcon, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import MagicImport from '../components/MagicImport';
import { Alert, Badge, Button, EmptyState, Field, IconBadge, IconButton, Modal, PageHeader, QuickAdd, Select, TileButton, quickAddInputClass } from '../components/ui';
import { api, DIAS, mensagemDeErro } from '../lib/api';
import { corDa } from '../lib/grade';
import { useDialogs } from '../lib/dialogs';
import { useAction, useSchool } from '../lib/hooks';
import type { ClassItem, Lesson, Subject, Teacher } from '../lib/types';

export default function Classes() {
  const { school, reloadSchool } = useSchool();
  const { confirm, prompt } = useDialogs();
  const schoolId = school?.id;
  const slotsSemana = DIAS.length * (school?.horarios.length ?? 0);

  const [classes, setClasses] = useState<ClassItem[] | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedClass = classes?.find(c => c.id === selectedId) ?? null;

  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [aulas, setAulas] = useState(1);

  const fetchData = useCallback(() => {
    if (!schoolId) return;
    Promise.all([
      api<ClassItem[]>(`/schools/${schoolId}/classes`),
      api<Teacher[]>(`/schools/${schoolId}/teachers`),
      api<Subject[]>(`/schools/${schoolId}/subjects`),
      api<Lesson[]>(`/schools/${schoolId}/lessons`),
    ])
      .then(([c, t, s, l]) => {
        setClasses(c);
        setTeachers(t);
        setSubjects(s);
        setLessons(l);
        setError('');
      })
      .catch(e => setError(mensagemDeErro(e)));
  }, [schoolId]);

  useEffect(fetchData, [fetchData]);

  const run = useAction(fetchData);

  const handleCreateClass = () => {
    if (!nome.trim()) return;
    run(() => api(`/schools/${schoolId}/classes`, { method: 'POST', json: { name: nome } }), 'Turma criada.');
    setNome('');
  };

  const handleCreateLesson = () => {
    if (!selectedClass || !selectedTeacher || !selectedSubject) return;
    run(() => api(`/schools/${schoolId}/lessons`, {
      method: 'POST',
      json: { classId: selectedClass.id, teacherId: selectedTeacher, subjectId: selectedSubject, aulas },
    }), 'Aulas atribuídas.');
    setSelectedSubject('');
    setAulas(1);
  };

  const handleUpdateAulas = (lesson: Lesson, n: number) => {
    if (!Number.isInteger(n) || n < 1 || n === lesson.aulas) return;
    setLessons(ls => ls.map(l => (l.id === lesson.id ? { ...l, aulas: n } : l)));
    run(() => api(`/lessons/${lesson.id}`, { method: 'PUT', json: { aulas: n } }));
  };

  const handleDeleteLesson = (id: string) => run(() => api(`/lessons/${id}`, { method: 'DELETE' }));

  const handleRenameClass = async () => {
    if (!selectedClass) return;
    const r = await prompt({ title: 'Renomear turma', fields: [{ name: 'nome', label: 'Nome da turma', value: selectedClass.name }] });
    if (r && r.nome !== selectedClass.name) run(() => api(`/classes/${selectedClass.id}`, { method: 'PUT', json: { name: r.nome } }), 'Turma renomeada.');
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    const ok = await confirm({
      title: `Excluir a turma ${selectedClass.name}?`,
      message: 'Todas as aulas atribuídas a esta turma também serão removidas.',
      confirmLabel: 'Excluir turma',
      danger: true,
    });
    if (!ok) return;
    setSelectedId(null);
    run(() => api(`/classes/${selectedClass.id}`, { method: 'DELETE' }), 'Turma excluída.');
  };

  // Se o professor tem disciplinas vinculadas, mostra só elas
  const teacherObj = teachers.find(t => t.id === selectedTeacher);
  const filteredSubjects = teacherObj?.subjects.length ? teacherObj.subjects : subjects;

  const lessonsDa = (classId: string) => lessons.filter(l => l.classId === classId);
  const totalDa = (classId: string) => lessonsDa(classId).reduce((acc, l) => acc + l.aulas, 0);

  return (
    <>
      <PageHeader title="Turmas" description="Crie as turmas e diga quantas aulas semanais cada professor dá em cada uma." />

      <MagicImport onImportComplete={() => { fetchData(); reloadSchool(); }} />

      {error && <Alert tone="error" className="mb-6">{error}</Alert>}

      <QuickAdd onSubmit={handleCreateClass}>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da nova turma (ex.: 1º Ano A)..." aria-label="Nome da turma" className={quickAddInputClass} />
        <Button type="submit" size="lg" icon={Plus} disabled={!nome.trim()}>Criar turma</Button>
      </QuickAdd>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {classes?.map(c => {
          const total = totalDa(c.id);
          const excede = slotsSemana > 0 && total > slotsSemana;
          const pct = slotsSemana ? Math.min(100, (total / slotsSemana) * 100) : 0;
          return (
            <TileButton key={c.id} warning={excede} onClick={() => setSelectedId(c.id)} className="items-center text-center">
              <IconBadge icon={GraduationCap} size="lg" />
              <h3 className="mt-3 w-full truncate text-lg font-bold text-slate-900" title={c.name}>{c.name}</h3>
              <p className={`mt-1 text-xs font-semibold ${excede ? 'text-red-600' : 'text-slate-500'}`}>
                {total}{slotsSemana > 0 && ` / ${slotsSemana}`} aulas
              </p>
              {slotsSemana > 0 && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden>
                  <div className={`h-full rounded-full ${excede ? 'bg-red-500' : total === slotsSemana ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${pct}%` }} />
                </div>
              )}
            </TileButton>
          );
        })}
        {classes?.length === 0 && (
          <EmptyState icon={Layers} title="Nenhuma turma criada" description="Crie a primeira turma acima ou use a Importação Mágica." />
        )}
      </div>

      {selectedClass && (
        <Modal
          size="xl"
          title={`Turma ${selectedClass.name}`}
          subtitle="Atribuição de aulas"
          icon={<IconBadge icon={GraduationCap} />}
          headerActions={
            <>
              <IconButton icon={Pencil} label="Renomear" onClick={handleRenameClass} />
              <IconButton icon={Trash2} label="Excluir turma" tone="danger" onClick={handleDeleteClass} />
            </>
          }
          onClose={() => setSelectedId(null)}
        >
          <div className="flex flex-col md:flex-row">
            <form
              className="shrink-0 space-y-4 border-b border-slate-100 p-6 md:w-5/12 md:border-r md:border-b-0"
              onSubmit={e => { e.preventDefault(); handleCreateLesson(); }}
            >
              <h3 className="flex items-center gap-2 font-semibold text-slate-900"><LinkIcon size={18} className="text-brand-500" /> Nova atribuição</h3>

              <Field label="Professor">
                {id => (
                  <Select id={id} value={selectedTeacher} onChange={e => { setSelectedTeacher(e.target.value); setSelectedSubject(''); }}>
                    <option value="">Selecione o professor</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                )}
              </Field>

              <Field label="Disciplina">
                {id => (
                  <Select id={id} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!selectedTeacher}>
                    <option value="">{selectedTeacher ? 'Selecione a disciplina' : 'Escolha o professor primeiro'}</option>
                    {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.sigla})</option>)}
                  </Select>
                )}
              </Field>

              <Field label="Aulas por semana">
                {id => (
                  <div className="flex items-center gap-2">
                    <IconButton icon={Minus} label="Menos uma aula" onClick={() => setAulas(a => Math.max(1, a - 1))} className="ring-1 ring-slate-200" />
                    <input
                      id={id}
                      type="number"
                      min={1}
                      value={aulas}
                      onChange={e => setAulas(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-11 w-20 rounded-xl border border-slate-200 text-center text-lg font-bold text-slate-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
                    />
                    <IconButton icon={Plus} label="Mais uma aula" onClick={() => setAulas(a => a + 1)} className="ring-1 ring-slate-200" />
                  </div>
                )}
              </Field>

              {teachers.length === 0 && <Alert tone="info">Cadastre professores antes de atribuir aulas.</Alert>}

              <Button type="submit" size="lg" icon={Plus} className="w-full" disabled={!selectedTeacher || !selectedSubject}>
                Atribuir à turma
              </Button>
            </form>

            <div className="flex-1 bg-slate-50/60 p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Layers size={18} className="text-slate-400" /> Aulas atribuídas</h3>
                <Badge tone={slotsSemana > 0 && totalDa(selectedClass.id) > slotsSemana ? 'red' : 'brand'}>
                  Total: {totalDa(selectedClass.id)}{slotsSemana > 0 && ` de ${slotsSemana}`}
                </Badge>
              </div>

              <ul className="space-y-2">
                {lessonsDa(selectedClass.id).map(l => (
                  <li key={l.id} className="group flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
                    <span className={`w-14 shrink-0 rounded-lg py-1.5 text-center text-xs font-bold ring-1 ${corDa(l.subject.sigla)}`}>{l.subject.sigla}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-slate-800">{l.subject.name}</div>
                      <div className="truncate text-sm text-slate-500">{l.teacher.name}</div>
                    </div>
                    <div className="flex items-center rounded-lg ring-1 ring-slate-200">
                      <button onClick={() => handleUpdateAulas(l, l.aulas - 1)} disabled={l.aulas <= 1} className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30" aria-label="Menos uma aula"><Minus size={14} /></button>
                      <span className="w-7 text-center font-bold text-slate-800 tabular-nums" title="Aulas por semana">{l.aulas}</span>
                      <button onClick={() => handleUpdateAulas(l, l.aulas + 1)} className="p-2 text-slate-400 hover:text-slate-900" aria-label="Mais uma aula"><Plus size={14} /></button>
                    </div>
                    <IconButton icon={Trash2} label="Remover atribuição" tone="danger" onClick={() => handleDeleteLesson(l.id)} />
                  </li>
                ))}
              </ul>

              {lessonsDa(selectedClass.id).length === 0 && (
                <EmptyState icon={Layers} title="Nenhuma aula atribuída" description="Use o formulário ao lado para adicionar disciplinas a esta turma." />
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
