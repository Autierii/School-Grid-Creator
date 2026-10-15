import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Pencil, Plus, Trash2, User } from 'lucide-react';
import { Alert, Button, EmptyState, IconBadge, IconButton, Modal, PageHeader, QuickAdd, SearchInput, Select, TileButton, quickAddInputClass } from '../components/ui';
import { api, mensagemDeErro, plural } from '../lib/api';
import { corDa } from '../lib/grade';
import { useDialogs } from '../lib/dialogs';
import { useAction, useSchool } from '../lib/hooks';
import type { SubjectWithTeachers, Teacher } from '../lib/types';

export default function Subjects() {
  const { school } = useSchool();
  const { confirm, prompt } = useDialogs();
  const schoolId = school?.id;

  const [subjects, setSubjects] = useState<SubjectWithTeachers[] | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [nome, setNome] = useState('');
  const [sigla, setSigla] = useState('');
  const [busca, setBusca] = useState('');
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [teacherToAdd, setTeacherToAdd] = useState('');
  const selected = subjects?.find(s => s.id === selectedId) ?? null;

  const fetchSubjects = useCallback(() => {
    if (!schoolId) return;
    api<SubjectWithTeachers[]>(`/schools/${schoolId}/subjects`).then(setSubjects).catch(e => setError(mensagemDeErro(e)));
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId) return;
    fetchSubjects();
    api<Teacher[]>(`/schools/${schoolId}/teachers`).then(setTeachers).catch(() => {});
  }, [schoolId, fetchSubjects]);

  const run = useAction(fetchSubjects);

  // Sugere a sigla a partir do nome (ex.: "Matemática" -> "MAT") enquanto o usuário não digitar uma.
  const [siglaManual, setSiglaManual] = useState(false);
  const sugerirSigla = (n: string) => n.normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();

  const handleCreate = () => {
    if (!nome.trim() || !sigla.trim()) return;
    run(() => api(`/schools/${schoolId}/subjects`, { method: 'POST', json: { name: nome, sigla } }), 'Disciplina criada.');
    setNome('');
    setSigla('');
    setSiglaManual(false);
  };

  const linkTeacher = () => {
    if (!selected || !teacherToAdd) return;
    run(() => api(`/teachers/${teacherToAdd}/subjects/${selected.id}`, { method: 'POST' }));
    setTeacherToAdd('');
  };

  const unlinkTeacher = (teacherId: string) =>
    selected && run(() => api(`/teachers/${teacherId}/subjects/${selected.id}`, { method: 'DELETE' }));

  const handleEdit = async () => {
    if (!selected) return;
    const r = await prompt({
      title: 'Editar disciplina',
      fields: [
        { name: 'nome', label: 'Nome', value: selected.name },
        { name: 'sigla', label: 'Sigla', value: selected.sigla, maxLength: 6, uppercase: true },
      ],
    });
    if (r) run(() => api(`/subjects/${selected.id}`, { method: 'PUT', json: { name: r.nome, sigla: r.sigla } }), 'Disciplina atualizada.');
  };

  const handleDelete = async () => {
    if (!selected) return;
    const ok = await confirm({
      title: `Excluir ${selected.name}?`,
      message: 'Todas as aulas desta disciplina nas turmas também serão removidas.',
      confirmLabel: 'Excluir disciplina',
      danger: true,
    });
    if (!ok) return;
    setSelectedId(null);
    run(() => api(`/subjects/${selected.id}`, { method: 'DELETE' }), 'Disciplina excluída.');
  };

  const termo = busca.trim().toLowerCase();
  const filtradas = subjects?.filter(s => s.name.toLowerCase().includes(termo) || s.sigla.toLowerCase().includes(termo));

  return (
    <>
      <PageHeader
        title="Disciplinas"
        description="As matérias ensinadas na escola. A sigla é o que aparece em cada célula da grade."
        actions={subjects && subjects.length > 8 && <SearchInput value={busca} onChange={setBusca} placeholder="Buscar disciplina..." />}
      />
      {error && <Alert tone="error" className="mb-6">{error}</Alert>}

      <QuickAdd onSubmit={handleCreate}>
        <input
          value={nome}
          onChange={e => { setNome(e.target.value); if (!siglaManual) setSigla(sugerirSigla(e.target.value)); }}
          placeholder="Nome da disciplina (ex.: Matemática)"
          aria-label="Nome da disciplina"
          className={quickAddInputClass}
        />
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <input
          value={sigla}
          onChange={e => { setSigla(e.target.value.toUpperCase()); setSiglaManual(true); }}
          placeholder="Sigla"
          aria-label="Sigla"
          maxLength={6}
          className={`${quickAddInputClass} uppercase sm:max-w-32 sm:flex-none`}
        />
        <Button type="submit" size="lg" icon={Plus} disabled={!nome.trim() || !sigla.trim()}>Criar</Button>
      </QuickAdd>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtradas?.map(s => (
          <TileButton key={s.id} onClick={() => setSelectedId(s.id)} className="items-center text-center">
            <span className={`rounded-xl px-3 py-2 font-display text-lg font-bold tracking-wide ring-1 ${corDa(s.sigla)}`}>{s.sigla}</span>
            <h3 className="mt-3 w-full truncate font-semibold text-slate-900" title={s.name}>{s.name}</h3>
            <p className="mt-1 text-xs text-slate-500">{s.teachers.length ? plural(s.teachers.length, 'professor', 'professores') : 'Sem professor'}</p>
          </TileButton>
        ))}
        {subjects?.length === 0 && (
          <EmptyState icon={BookOpen} title="Nenhuma disciplina cadastrada" description="Crie a primeira no campo acima: nome + sigla curta." />
        )}
        {subjects && subjects.length > 0 && filtradas?.length === 0 && (
          <EmptyState icon={BookOpen} title="Nenhum resultado" description={`Nenhuma disciplina com "${busca}".`} />
        )}
      </div>

      {selected && (
        <Modal
          title={selected.name}
          subtitle={<>Sigla <strong className="text-slate-700">{selected.sigla}</strong></>}
          icon={<IconBadge icon={BookOpen} />}
          headerActions={
            <>
              <IconButton icon={Pencil} label="Editar" onClick={handleEdit} />
              <IconButton icon={Trash2} label="Excluir disciplina" tone="danger" onClick={handleDelete} />
            </>
          }
          footer={<Button variant="secondary" onClick={() => setSelectedId(null)}>Fechar</Button>}
          onClose={() => setSelectedId(null)}
        >
          <div className="space-y-4 p-6">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900"><User size={18} className="text-brand-500" /> Professores que lecionam</h3>

            <form className="flex gap-2" onSubmit={e => { e.preventDefault(); linkTeacher(); }}>
              <Select value={teacherToAdd} onChange={e => setTeacherToAdd(e.target.value)} aria-label="Professor para vincular">
                <option value="">Selecione um professor...</option>
                {teachers.filter(t => !selected.teachers.some(st => st.id === t.id)).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
              <Button type="submit" icon={Plus} disabled={!teacherToAdd}>Vincular</Button>
            </form>

            <ul className="space-y-2">
              {selected.teachers.map(t => (
                <li key={t.id} className="flex items-center justify-between rounded-xl p-2 pl-3 ring-1 ring-slate-200">
                  <div className="flex items-center gap-3">
                    <IconBadge icon={User} tone="slate" size="sm" />
                    <span className="font-medium text-slate-700">{t.name}</span>
                  </div>
                  <IconButton icon={Trash2} label="Desvincular professor" tone="danger" onClick={() => unlinkTeacher(t.id)} />
                </li>
              ))}
            </ul>
            {selected.teachers.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">Nenhum professor vinculado ainda.</p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
