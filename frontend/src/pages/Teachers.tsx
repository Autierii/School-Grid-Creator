import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { UserPlus, User, X, BookOpen, Trash2, Plus, Clock, Info, Pencil, CalendarDays } from 'lucide-react';
import { api, DIAS, parseRestricoes, type Restricao } from '../api';

type Subject = { id: string; name: string; sigla: string };
type Teacher = { id: string; name: string; restrictions: string | null; subjects: Subject[]; totalAulas: number };

export default function Teachers() {
  const { schoolId } = useParams();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'materias' | 'restricoes'>('materias');
  const [subjectToAdd, setSubjectToAdd] = useState('');

  const selected = teachers.find(t => t.id === selectedId) ?? null;
  const restList = parseRestricoes(selected?.restrictions);

  const fetchTeachers = useCallback(() => {
    api<Teacher[]>(`/schools/${schoolId}/teachers`).then(setTeachers).catch(e => setError(e.message));
  }, [schoolId]);

  useEffect(() => {
    fetchTeachers();
    api<Subject[]>(`/schools/${schoolId}/subjects`).then(setSubjects).catch(() => {});
    api(`/schools/${schoolId}`).then(s => setHorarios(s.horarios)).catch(() => {});
  }, [schoolId, fetchTeachers]);

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      alert((e as Error).message);
    }
    fetchTeachers();
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    run(() => api(`/schools/${schoolId}/teachers`, { method: 'POST', json: { name, restrictions: [] } }));
    setName('');
  };

  const linkSubject = () => {
    if (!selected || !subjectToAdd) return;
    run(() => api(`/teachers/${selected.id}/subjects/${subjectToAdd}`, { method: 'POST' }));
    setSubjectToAdd('');
  };

  const unlinkSubject = (subjectId: string) =>
    selected && run(() => api(`/teachers/${selected.id}/subjects/${subjectId}`, { method: 'DELETE' }));

  const saveRestrictions = (list: Restricao[]) => {
    if (!selected) return;
    // Atualização otimista para o clique na grade parecer instantâneo
    setTeachers(ts => ts.map(t => (t.id === selected.id ? { ...t, restrictions: JSON.stringify(list) } : t)));
    run(() => api(`/teachers/${selected.id}/restrictions`, { method: 'PUT', json: { restrictions: list } }));
  };

  const isBlocked = (dia: string, hora: string) => restList.some(r => r.dia === dia && r.hora === hora);
  const toggle = (dia: string, hora: string) =>
    saveRestrictions(isBlocked(dia, hora) ? restList.filter(r => !(r.dia === dia && r.hora === hora)) : [...restList, { dia, hora }]);
  const toggleDia = (dia: string) => {
    const todos = horarios.every(h => isBlocked(dia, h));
    const semDia = restList.filter(r => !(r.dia === dia && horarios.includes(r.hora)));
    saveRestrictions(todos ? semDia : [...semDia, ...horarios.map(hora => ({ dia, hora }))]);
  };
  const outras = restList.filter(r => !horarios.includes(r.hora));

  const handleRename = () => {
    if (!selected) return;
    const novo = prompt('Nome do professor:', selected.name)?.trim();
    if (novo && novo !== selected.name) run(() => api(`/teachers/${selected.id}`, { method: 'PUT', json: { name: novo } }));
  };

  const handleDelete = () => {
    if (!selected) return;
    if (!confirm(`Excluir ${selected.name}? Todas as aulas atribuídas a este professor também serão removidas.`)) return;
    setSelectedId(null);
    run(() => api(`/teachers/${selected.id}`, { method: 'DELETE' }));
  };

  const slotsLivres = (t: Teacher) => DIAS.length * horarios.length - parseRestricoes(t.restrictions).filter(r => horarios.includes(r.hora)).length;

  return (
    <>
      <div className="max-w-5xl mx-auto fade-in">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Professores</h2>
          <p className="text-slate-500 mt-1">Gerencie o corpo docente, disciplinas e bloqueios de horários.</p>
        </div>
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center mb-10 w-full">
          <input
            type="text"
            placeholder="Nome completo do professor..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-transparent border-none p-4 flex-1 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-0"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <UserPlus size={20} />
            Adicionar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {teachers.map(t => {
            const nRest = parseRestricoes(t.restrictions).length;
            const livres = slotsLivres(t);
            const sobrecarga = horarios.length > 0 && t.totalAulas > livres;
            return (
              <div
                key={t.id}
                onClick={() => { setSelectedId(t.id); setActiveTab('materias'); }}
                className={`bg-white border p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-400 cursor-pointer transition-all flex flex-col gap-4 group ${sobrecarga ? 'border-red-300' : 'border-slate-200'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <User size={24} />
                  </div>
                  <h4 className="font-bold text-slate-900 truncate flex-1" title={t.name}>{t.name}</h4>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1"><BookOpen size={14} /> Matérias</span>
                    <span className={t.subjects.length > 0 ? 'font-bold text-indigo-600' : 'font-medium text-slate-400'}>{t.subjects.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1"><Clock size={14} /> Restrições</span>
                    <span className={nRest > 0 ? 'font-bold text-amber-600' : 'font-medium text-slate-400'}>{nRest}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1"><CalendarDays size={14} /> Aulas / disponíveis</span>
                    <span className={sobrecarga ? 'font-bold text-red-600' : 'font-medium text-slate-600'} title={sobrecarga ? 'Mais aulas do que horários disponíveis!' : undefined}>
                      {t.totalAulas} / {horarios.length ? livres : '?'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {teachers.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              Nenhum professor cadastrado ainda.
            </div>
          )}
        </div>
      </div>

      {selected && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in" onClick={() => setSelectedId(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 text-indigo-600 p-3 rounded-2xl"><User size={28} /></div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{selected.name}</h3>
                  <p className="text-sm text-slate-500">{selected.totalAulas} aulas semanais atribuídas</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={handleRename} className="text-slate-400 hover:text-indigo-600 hover:bg-slate-200 p-2 rounded-xl transition-colors" title="Renomear"><Pencil size={20} /></button>
                <button onClick={handleDelete} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors" title="Excluir professor"><Trash2 size={20} /></button>
                <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-900 hover:bg-slate-200 p-2 rounded-xl transition-colors"><X size={24} /></button>
              </div>
            </div>

            <div className="flex px-6 pt-4 bg-white border-b border-slate-100 gap-6">
              <button
                onClick={() => setActiveTab('materias')}
                className={`pb-4 px-2 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'materias' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <BookOpen size={18} /> Matérias Lecionadas
              </button>
              <button
                onClick={() => setActiveTab('restricoes')}
                className={`pb-4 px-2 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'restricoes' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <Clock size={18} /> Restrições de Horário
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1 min-h-[300px]">
              {activeTab === 'materias' && (
                <div className="fade-in">
                  <div className="flex gap-3 mb-6 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                    <select value={subjectToAdd} onChange={e => setSubjectToAdd(e.target.value)} className="bg-transparent border-none p-3 flex-1 text-slate-900 focus:outline-none focus:ring-0">
                      <option value="">Selecione uma disciplina para vincular...</option>
                      {subjects.filter(s => !selected.subjects.some(ts => ts.id === s.id)).map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.sigla})</option>
                      ))}
                    </select>
                    <button
                      onClick={linkSubject}
                      disabled={!subjectToAdd}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-all shadow-sm font-semibold flex items-center gap-2"
                    >
                      Vincular <Plus size={18} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selected.subjects.map(s => (
                      <div key={s.id} className="flex justify-between items-center p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-white shadow-sm transition-all">
                        <div className="flex items-center gap-4">
                          <span className="bg-indigo-50 text-indigo-700 text-sm font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">{s.sigla}</span>
                          <span className="font-semibold text-slate-700">{s.name}</span>
                        </div>
                        <button onClick={() => unlinkSubject(s.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors" title="Remover disciplina">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    {selected.subjects.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                        <BookOpen size={32} className="mb-3 text-slate-300" />
                        <p>Nenhuma disciplina vinculada.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'restricoes' && (
                <div className="fade-in">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
                    <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-amber-800 text-sm">
                      Clique nos horários em que <strong>{selected.name}</strong> <strong>NÃO</strong> pode dar aula. Clique no nome do dia para bloquear o dia inteiro.
                      Os horários vêm da tela <em>Gerar Nova Grade</em>.
                    </p>
                  </div>

                  {horarios.length > 0 ? (
                    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className="p-3 bg-slate-50 text-slate-400 text-xs uppercase text-left">Horário</th>
                            {DIAS.map(d => (
                              <th key={d} className="p-2 bg-slate-50 border-l border-slate-100">
                                <button onClick={() => toggleDia(d)} className="text-xs uppercase font-bold text-slate-500 hover:text-amber-600 w-full">{d}</button>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {horarios.map(h => (
                            <tr key={h}>
                              <td className="p-3 border-t border-slate-100 font-semibold text-slate-600 whitespace-nowrap">{h}</td>
                              {DIAS.map(d => {
                                const b = isBlocked(d, h);
                                return (
                                  <td key={d} className="p-1.5 border-t border-l border-slate-100">
                                    <button
                                      onClick={() => toggle(d, h)}
                                      className={`w-full h-10 rounded-lg font-semibold text-xs transition-colors ${b ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                                    >
                                      {b ? 'Bloqueado' : 'Livre'}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">Carregando horários...</p>
                  )}

                  {outras.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-bold text-slate-700 mb-2">Restrições com horários que não existem na configuração atual (são ignoradas pelo gerador):</h4>
                      <div className="flex flex-wrap gap-2">
                        {outras.map(r => (
                          <span key={`${r.dia}|${r.hora}`} className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 text-xs font-semibold pl-3 pr-1 py-1 rounded-lg">
                            {r.dia} · {r.hora}
                            <button onClick={() => saveRestrictions(restList.filter(o => o !== r))} className="hover:text-red-600 p-1"><X size={14} /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
              <button onClick={() => setSelectedId(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-2xl transition-all shadow-md">
                Concluído
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
