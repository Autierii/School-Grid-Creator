import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, Clock, Info, Pencil, Plus, Trash2, User, UserPlus, Users, X } from 'lucide-react';
import { Alert, Badge, Button, EmptyState, IconBadge, IconButton, Modal, PageHeader, QuickAdd, SearchInput, Select, Tabs, TileButton, quickAddInputClass } from '../components/ui';
import { api, DIAS, mensagemDeErro, parseRestricoes, plural } from '../lib/api';
import { useDialogs } from '../lib/dialogs';
import { useAction, useSchool } from '../lib/hooks';
import type { Restricao, Subject, Teacher } from '../lib/types';

export default function Teachers() {
  const { school } = useSchool();
  const { confirm, prompt, toast } = useDialogs();
  const schoolId = school?.id;
  const horarios = school?.horarios ?? [];

  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [nome, setNome] = useState('');
  const [busca, setBusca] = useState('');
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aba, setAba] = useState<'materias' | 'restricoes'>('materias');
  const [subjectToAdd, setSubjectToAdd] = useState('');

  const selected = teachers?.find(t => t.id === selectedId) ?? null;
  const restList = parseRestricoes(selected?.restrictions);

  const fetchTeachers = useCallback(() => {
    if (!schoolId) return;
    api<Teacher[]>(`/schools/${schoolId}/teachers`).then(setTeachers).catch(e => setError(mensagemDeErro(e)));
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId) return;
    fetchTeachers();
    api<Subject[]>(`/schools/${schoolId}/subjects`).then(setSubjects).catch(() => {});
  }, [schoolId, fetchTeachers]);

  const run = useAction(fetchTeachers);

  const handleCreate = () => {
    if (!nome.trim()) return;
    run(() => api(`/schools/${schoolId}/teachers`, { method: 'POST', json: { name: nome, restrictions: [] } }), 'Professor adicionado.');
    setNome('');
  };

  const linkSubject = () => {
    if (!selected || !subjectToAdd) return;
    run(() => api(`/teachers/${selected.id}/subjects/${subjectToAdd}`, { method: 'POST' }));
    setSubjectToAdd('');
  };

  const unlinkSubject = (subjectId: string) =>
    selected && run(() => api(`/teachers/${selected.id}/subjects/${subjectId}`, { method: 'DELETE' }));

  const saveRestrictions = async (list: Restricao[]) => {
    if (!selected) return;
    // Atualização otimista para o clique na grade parecer instantâneo
    setTeachers(ts => ts?.map(t => (t.id === selected.id ? { ...t, restrictions: JSON.stringify(list) } : t)) ?? null);
    try {
      await api(`/teachers/${selected.id}/restrictions`, { method: 'PUT', json: { restrictions: list } });
    } catch (e) {
      toast(mensagemDeErro(e), 'error');
      fetchTeachers();
    }
  };

  const isBlocked = (dia: string, hora: string) => restList.some(r => r.dia === dia && r.hora === hora);
  const toggle = (dia: string, hora: string) =>
    saveRestrictions(isBlocked(dia, hora) ? restList.filter(r => !(r.dia === dia && r.hora === hora)) : [...restList, { dia, hora }]);
  const toggleDia = (dia: string) => {
    const todos = horarios.every(h => isBlocked(dia, h));
    const semDia = restList.filter(r => !(r.dia === dia && horarios.includes(r.hora)));
    saveRestrictions(todos ? semDia : [...semDia, ...horarios.map(hora => ({ dia, hora }))]);
  };
  const toggleHora = (hora: string) => {
    const todos = DIAS.every(d => isBlocked(d, hora));
    const semHora = restList.filter(r => r.hora !== hora);
    saveRestrictions(todos ? semHora : [...semHora, ...DIAS.map(dia => ({ dia, hora }))]);
  };
  const outras = restList.filter(r => !horarios.includes(r.hora));

  const handleRename = async () => {
    if (!selected) return;
    const r = await prompt({ title: 'Renomear professor', fields: [{ name: 'nome', label: 'Nome', value: selected.name }] });
    if (r && r.nome !== selected.name) run(() => api(`/teachers/${selected.id}`, { method: 'PUT', json: { name: r.nome } }), 'Nome atualizado.');
  };

  const handleDelete = async () => {
    if (!selected) return;
    const ok = await confirm({
      title: `Excluir ${selected.name}?`,
      message: 'Todas as aulas atribuídas a este professor nas turmas também serão removidas.',
      confirmLabel: 'Excluir professor',
      danger: true,
    });
    if (!ok) return;
    setSelectedId(null);
    run(() => api(`/teachers/${selected.id}`, { method: 'DELETE' }), 'Professor excluído.');
  };

  const livresDe = (t: Teacher) => DIAS.length * horarios.length - parseRestricoes(t.restrictions).filter(r => horarios.includes(r.hora)).length;
  const filtrados = teachers?.filter(t => t.name.toLowerCase().includes(busca.trim().toLowerCase()));

  return (
    <>
      <PageHeader
        title="Professores"
        description="Cadastre o corpo docente, as disciplinas de cada um e os horários em que não podem dar aula."
        actions={teachers && teachers.length > 6 && <SearchInput value={busca} onChange={setBusca} placeholder="Buscar professor..." />}
      />
      {error && <Alert tone="error" className="mb-6">{error}</Alert>}

      <QuickAdd onSubmit={handleCreate}>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do professor..." aria-label="Nome do professor" className={quickAddInputClass} />
        <Button type="submit" size="lg" icon={UserPlus} disabled={!nome.trim()}>Adicionar</Button>
      </QuickAdd>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtrados?.map(t => {
          const nRest = parseRestricoes(t.restrictions).length;
          const livres = livresDe(t);
          const sobrecarga = horarios.length > 0 && t.totalAulas > livres;
          return (
            <TileButton key={t.id} warning={sobrecarga} onClick={() => { setSelectedId(t.id); setAba('materias'); }}>
              <div className="flex w-full items-center gap-3">
                <IconBadge icon={User} />
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-slate-900" title={t.name}>{t.name}</h3>
                  <p className="truncate text-xs text-slate-500">{t.subjects.map(s => s.sigla).join(' · ') || 'Sem disciplinas'}</p>
                </div>
              </div>
              <dl className="mt-4 w-full space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5 text-slate-500"><Clock size={14} /> Restrições</dt>
                  <dd className={nRest > 0 ? 'font-bold text-amber-600' : 'text-slate-400'}>{nRest}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5 text-slate-500"><CalendarDays size={14} /> Aulas / horários livres</dt>
                  <dd className={sobrecarga ? 'font-bold text-red-600' : 'font-medium text-slate-700'} title={sobrecarga ? 'Mais aulas do que horários disponíveis!' : undefined}>
                    {t.totalAulas} / {horarios.length ? livres : '?'}
                  </dd>
                </div>
              </dl>
            </TileButton>
          );
        })}
        {teachers?.length === 0 && (
          <EmptyState icon={Users} title="Nenhum professor cadastrado" description="Adicione o primeiro professor no campo acima." />
        )}
        {teachers && teachers.length > 0 && filtrados?.length === 0 && (
          <EmptyState icon={Users} title="Nenhum resultado" description={`Nenhum professor com "${busca}".`} />
        )}
      </div>

      {selected && (
        <Modal
          size="lg"
          title={selected.name}
          subtitle={`${plural(selected.totalAulas, 'aula semanal', 'aulas semanais')} atribuídas`}
          icon={<IconBadge icon={User} />}
          headerActions={
            <>
              <IconButton icon={Pencil} label="Renomear" onClick={handleRename} />
              <IconButton icon={Trash2} label="Excluir professor" tone="danger" onClick={handleDelete} />
            </>
          }
          footer={<Button variant="secondary" onClick={() => setSelectedId(null)}>Concluído</Button>}
          onClose={() => setSelectedId(null)}
        >
          <div className="px-6 pt-5">
            <Tabs
              value={aba}
              onChange={setAba}
              tabs={[
                { value: 'materias', label: 'Disciplinas', icon: BookOpen, count: selected.subjects.length },
                { value: 'restricoes', label: 'Restrições de horário', icon: Clock, count: restList.length },
              ]}
            />
          </div>

          <div className="min-h-[320px] p-6">
            {aba === 'materias' && (
              <div className="animate-fade-in space-y-4">
                <form className="flex gap-2" onSubmit={e => { e.preventDefault(); linkSubject(); }}>
                  <Select value={subjectToAdd} onChange={e => setSubjectToAdd(e.target.value)} aria-label="Disciplina para vincular">
                    <option value="">Selecione uma disciplina para vincular...</option>
                    {subjects.filter(s => !selected.subjects.some(ts => ts.id === s.id)).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.sigla})</option>
                    ))}
                  </Select>
                  <Button type="submit" icon={Plus} disabled={!subjectToAdd}>Vincular</Button>
                </form>

                <ul className="space-y-2">
                  {selected.subjects.map(s => (
                    <li key={s.id} className="flex items-center justify-between rounded-xl bg-white p-3 pl-4 ring-1 ring-slate-200">
                      <div className="flex items-center gap-3">
                        <Badge tone="brand">{s.sigla}</Badge>
                        <span className="font-medium text-slate-700">{s.name}</span>
                      </div>
                      <IconButton icon={Trash2} label="Desvincular disciplina" tone="danger" onClick={() => unlinkSubject(s.id)} />
                    </li>
                  ))}
                </ul>
                {selected.subjects.length === 0 && (
                  <EmptyState
                    icon={BookOpen}
                    title="Nenhuma disciplina vinculada"
                    description={subjects.length === 0 ? 'Cadastre disciplinas primeiro na tela Disciplinas.' : 'Vincule acima, ou atribua aulas na tela de Turmas (o vínculo é criado automaticamente).'}
                  />
                )}
              </div>
            )}

            {aba === 'restricoes' && (
              <div className="animate-fade-in space-y-5">
                <Alert tone="warning">
                  Clique nos horários em que <strong>{selected.name}</strong> <strong>não pode</strong> dar aula. Clique no dia ou no horário para marcar a linha/coluna inteira.
                  Os horários são configurados em <Link to="../generate" className="font-semibold underline">Gerar nova grade</Link>.
                </Alert>

                <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase">Horário</th>
                        {DIAS.map(d => (
                          <th key={d} className="border-l border-slate-200 p-1.5">
                            <button onClick={() => toggleDia(d)} className="w-full rounded-md px-2 py-1.5 text-xs font-bold text-slate-500 uppercase hover:bg-amber-100 hover:text-amber-800" title={`Bloquear/liberar ${d} inteira`}>
                              {d}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {horarios.map(h => (
                        <tr key={h} className="border-t border-slate-200">
                          <td className="p-1.5">
                            <button onClick={() => toggleHora(h)} className="w-full rounded-md px-2 py-1.5 text-left font-semibold whitespace-nowrap text-slate-600 hover:bg-amber-100 hover:text-amber-800" title={`Bloquear/liberar ${h} em todos os dias`}>
                              {h}
                            </button>
                          </td>
                          {DIAS.map(d => {
                            const b = isBlocked(d, h);
                            return (
                              <td key={d} className="border-l border-slate-200 p-1.5">
                                <button
                                  onClick={() => toggle(d, h)}
                                  aria-pressed={b}
                                  aria-label={`${d} ${h}: ${b ? 'bloqueado' : 'livre'}`}
                                  className={`flex h-10 w-full items-center justify-center gap-1 rounded-lg text-xs font-semibold transition-colors ${b ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                                >
                                  {b ? <><X size={14} /> Bloqueado</> : 'Livre'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {outras.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Info size={16} className="text-slate-400" /> Restrições em horários que não existem mais (ignoradas pelo gerador)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {outras.map(r => (
                        <span key={`${r.dia}|${r.hora}`} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 py-1 pr-1 pl-3 text-xs font-semibold text-slate-600">
                          {r.dia} · {r.hora}
                          <button onClick={() => saveRestrictions(restList.filter(o => o !== r))} className="rounded p-1 hover:bg-slate-200 hover:text-red-600" aria-label="Remover restrição"><X size={14} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
