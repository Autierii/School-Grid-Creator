import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { Layers, Plus, Link as LinkIcon, Trash2, GraduationCap, X, BookOpen, User, Pencil } from 'lucide-react';
import { api, DIAS } from '../api';
import MagicImport from '../components/MagicImport';

type Subject = { id: string; name: string; sigla: string };
type Teacher = { id: string; name: string; subjects: Subject[] };
type ClassItem = { id: string; name: string };
type Lesson = { id: string; classId: string; aulas: number; teacher: Teacher; subject: Subject };

export default function Classes() {
  const { schoolId } = useParams();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [slotsSemana, setSlotsSemana] = useState(0);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedClass = classes.find(c => c.id === selectedId) ?? null;

  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [aulas, setAulas] = useState('1');

  const fetchData = useCallback(() => {
    Promise.all([
      api<ClassItem[]>(`/schools/${schoolId}/classes`),
      api<Teacher[]>(`/schools/${schoolId}/teachers`),
      api<Subject[]>(`/schools/${schoolId}/subjects`),
      api<Lesson[]>(`/schools/${schoolId}/lessons`),
      api(`/schools/${schoolId}`),
    ])
      .then(([c, t, s, l, school]) => {
        setClasses(c);
        setTeachers(t);
        setSubjects(s);
        setLessons(l);
        setSlotsSemana(DIAS.length * school.horarios.length);
        setError('');
      })
      .catch(e => setError(e.message));
  }, [schoolId]);

  useEffect(fetchData, [fetchData]);

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      alert((e as Error).message);
    }
    fetchData();
  };

  const handleCreateClass = () => {
    if (!name.trim()) return;
    run(() => api(`/schools/${schoolId}/classes`, { method: 'POST', json: { name } }));
    setName('');
  };

  const handleCreateLesson = () => {
    if (!selectedClass || !selectedTeacher || !selectedSubject) return;
    run(() => api(`/schools/${schoolId}/lessons`, {
      method: 'POST',
      json: { classId: selectedClass.id, teacherId: selectedTeacher, subjectId: selectedSubject, aulas: parseInt(aulas) },
    }));
    setSelectedTeacher('');
    setSelectedSubject('');
    setAulas('1');
  };

  const handleUpdateAulas = (lesson: Lesson, valor: string) => {
    const n = parseInt(valor);
    if (!Number.isInteger(n) || n < 1 || n === lesson.aulas) return;
    run(() => api(`/lessons/${lesson.id}`, { method: 'PUT', json: { aulas: n } }));
  };

  const handleDeleteLesson = (id: string) => run(() => api(`/lessons/${id}`, { method: 'DELETE' }));

  const handleRenameClass = () => {
    if (!selectedClass) return;
    const novo = prompt('Nome da turma:', selectedClass.name)?.trim();
    if (novo && novo !== selectedClass.name) run(() => api(`/classes/${selectedClass.id}`, { method: 'PUT', json: { name: novo } }));
  };

  const handleDeleteClass = () => {
    if (!selectedClass) return;
    if (!confirm(`Excluir a turma ${selectedClass.name} e todas as suas aulas atribuídas?`)) return;
    setSelectedId(null);
    run(() => api(`/classes/${selectedClass.id}`, { method: 'DELETE' }));
  };

  // Se o professor tem disciplinas vinculadas, mostra só elas
  const teacherObj = teachers.find(t => t.id === selectedTeacher);
  const filteredSubjects = teacherObj?.subjects.length ? teacherObj.subjects : subjects;

  const lessonsDa = (classId: string) => lessons.filter(l => l.classId === classId);
  const totalDa = (classId: string) => lessonsDa(classId).reduce((acc, l) => acc + l.aulas, 0);

  return (
    <>
      <div className="max-w-6xl mx-auto fade-in">
        <MagicImport onImportComplete={fetchData} />

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Turmas</h2>
          <p className="text-slate-500 mt-1">Gerencie suas turmas e atribua professores às matérias de cada uma.</p>
        </div>
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center mb-10 w-full max-w-2xl">
          <input
            type="text"
            placeholder="Nome da nova turma (ex: 1º Ano A)..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-transparent border-none p-4 flex-1 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-0"
            onKeyDown={e => e.key === 'Enter' && handleCreateClass()}
          />
          <button
            onClick={handleCreateClass}
            disabled={!name.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Layers size={20} />
            Criar Turma
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {classes.map(c => {
            const total = totalDa(c.id);
            const excede = slotsSemana > 0 && total > slotsSemana;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-400 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <GraduationCap size={28} />
                </div>
                <h4 className="text-lg font-bold text-slate-900 w-full truncate" title={c.name}>{c.name}</h4>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg w-full ${excede ? 'bg-red-50 text-red-700' : total > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                  {total}{slotsSemana > 0 && ` / ${slotsSemana}`} aulas
                </span>
              </div>
            );
          })}
          {classes.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              Nenhuma turma criada ainda.
            </div>
          )}
        </div>
      </div>

      {selectedClass && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in" onClick={() => setSelectedId(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col h-[85vh] max-h-[800px] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 text-indigo-600 p-3 rounded-2xl"><GraduationCap size={28} /></div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Turma: {selectedClass.name}</h3>
                  <p className="text-sm text-slate-500">Gestão de Atribuição de Aulas</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={handleRenameClass} className="text-slate-400 hover:text-indigo-600 hover:bg-slate-200 p-2 rounded-xl transition-colors" title="Renomear"><Pencil size={20} /></button>
                <button onClick={handleDeleteClass} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors" title="Excluir turma"><Trash2 size={20} /></button>
                <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-900 hover:bg-slate-200 p-2 rounded-xl transition-colors"><X size={24} /></button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              <div className="w-full md:w-5/12 bg-white border-r border-slate-100 p-6 overflow-y-auto shrink-0 flex flex-col">
                <h4 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <LinkIcon size={18} className="text-indigo-500" /> Nova Atribuição
                </h4>

                <div className="flex flex-col gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Professor</label>
                    <div className="relative">
                      <div className="absolute left-3 top-3.5 text-slate-400 pointer-events-none"><User size={16} /></div>
                      <select
                        value={selectedTeacher}
                        onChange={e => { setSelectedTeacher(e.target.value); setSelectedSubject(''); }}
                        className="bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl text-slate-900 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                      >
                        <option value="">Selecione o Professor</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Disciplina</label>
                    <div className="relative">
                      <div className="absolute left-3 top-3.5 text-slate-400 pointer-events-none"><BookOpen size={16} /></div>
                      <select
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value)}
                        disabled={!selectedTeacher}
                        className="bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl text-slate-900 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none disabled:opacity-50"
                      >
                        <option value="">{selectedTeacher ? 'Selecione a Matéria' : 'Escolha o professor primeiro'}</option>
                        {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.sigla})</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Quantidade de Aulas Semanais</label>
                    <input
                      type="number"
                      value={aulas}
                      onChange={e => setAulas(e.target.value)}
                      min="1"
                      className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-900 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <button
                    onClick={handleCreateLesson}
                    disabled={!selectedTeacher || !selectedSubject || !(parseInt(aulas) >= 1)}
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-200 flex justify-center gap-2"
                  >
                    Atribuir à Turma <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="w-full md:w-7/12 bg-slate-50 p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-5">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Layers size={18} className="text-slate-500" /> Aulas Atribuídas
                  </h4>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${slotsSemana > 0 && totalDa(selectedClass.id) > slotsSemana ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    Total: {totalDa(selectedClass.id)}{slotsSemana > 0 && ` de ${slotsSemana}`} aulas
                  </span>
                </div>

                <div className="space-y-3">
                  {lessonsDa(selectedClass.id).map(l => (
                    <div key={l.id} className="group flex justify-between items-center p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white shadow-sm transition-all">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-14 bg-slate-50 rounded-lg border border-slate-100 py-1">
                          <input
                            key={l.aulas}
                            type="number"
                            min="1"
                            defaultValue={l.aulas}
                            onBlur={e => handleUpdateAulas(l, e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                            className="w-12 text-center text-lg font-bold text-slate-700 bg-transparent focus:outline-none focus:bg-white rounded"
                            title="Clique para alterar a quantidade"
                          />
                          <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">Aulas</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-indigo-700">{l.subject.name} <span className="text-slate-400 text-xs ml-1 font-normal">({l.subject.sigla})</span></span>
                          <span className="text-sm font-medium text-slate-600 mt-0.5">{l.teacher.name}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteLesson(l.id)}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl md:opacity-0 group-hover:opacity-100 transition-all"
                        title="Remover atribuição"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}

                  {lessonsDa(selectedClass.id).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                      <Layers size={40} className="mb-4 text-slate-300" />
                      <p className="font-medium text-slate-500">Nenhuma aula atribuída ainda.</p>
                      <p className="text-sm mt-1">Use o formulário ao lado para adicionar disciplinas.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
