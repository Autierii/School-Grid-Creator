import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { BookOpen, Plus, User, Trash2, X, Pencil } from 'lucide-react';
import { api } from '../api';

type Teacher = { id: string; name: string };
type Subject = { id: string; name: string; sigla: string; teachers: Teacher[] };

export default function Subjects() {
  const { schoolId } = useParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [name, setName] = useState('');
  const [sigla, setSigla] = useState('');
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [teacherToAdd, setTeacherToAdd] = useState('');
  const selected = subjects.find(s => s.id === selectedId) ?? null;

  const fetchSubjects = useCallback(() => {
    api<Subject[]>(`/schools/${schoolId}/subjects`).then(setSubjects).catch(e => setError(e.message));
  }, [schoolId]);

  useEffect(() => {
    fetchSubjects();
    api<Teacher[]>(`/schools/${schoolId}/teachers`).then(setTeachers).catch(() => {});
  }, [schoolId, fetchSubjects]);

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      alert((e as Error).message);
    }
    fetchSubjects();
  };

  const handleCreate = () => {
    if (!name.trim() || !sigla.trim()) return;
    run(() => api(`/schools/${schoolId}/subjects`, { method: 'POST', json: { name, sigla } }));
    setName('');
    setSigla('');
  };

  const linkTeacher = () => {
    if (!selected || !teacherToAdd) return;
    run(() => api(`/teachers/${teacherToAdd}/subjects/${selected.id}`, { method: 'POST' }));
    setTeacherToAdd('');
  };

  const unlinkTeacher = (teacherId: string) =>
    selected && run(() => api(`/teachers/${teacherId}/subjects/${selected.id}`, { method: 'DELETE' }));

  const handleEdit = () => {
    if (!selected) return;
    const novoNome = prompt('Nome da disciplina:', selected.name)?.trim();
    if (!novoNome) return;
    const novaSigla = prompt('Sigla:', selected.sigla)?.trim().toUpperCase();
    if (!novaSigla) return;
    run(() => api(`/subjects/${selected.id}`, { method: 'PUT', json: { name: novoNome, sigla: novaSigla } }));
  };

  const handleDelete = () => {
    if (!selected) return;
    if (!confirm(`Excluir ${selected.name}? Todas as aulas desta disciplina nas turmas também serão removidas.`)) return;
    setSelectedId(null);
    run(() => api(`/subjects/${selected.id}`, { method: 'DELETE' }));
  };

  return (
    <>
      <div className="max-w-5xl mx-auto fade-in">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Disciplinas</h2>
          <p className="text-slate-500 mt-1">Cadastre as matérias ensinadas nesta escola e veja quem as leciona.</p>
        </div>
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center mb-10 w-full gap-2">
          <input
            type="text"
            placeholder="Nome da Disciplina (ex: Matemática)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-transparent border-none p-4 flex-1 w-full text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-0"
          />
          <div className="hidden sm:block w-px h-8 bg-slate-200"></div>
          <input
            type="text"
            placeholder="Sigla (ex: MAT)"
            value={sigla}
            onChange={e => setSigla(e.target.value.toUpperCase())}
            maxLength={6}
            className="bg-transparent border-none p-4 w-full sm:w-36 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-0 uppercase"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !sigla.trim()}
            className="bg-indigo-600 w-full sm:w-auto hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Criar
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {subjects.map(s => (
            <div
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-400 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center group"
            >
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-full mb-1 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <BookOpen size={24} />
              </div>
              <h4 className="font-bold text-slate-900 w-full truncate" title={s.name}>{s.name}</h4>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">{s.sigla}</span>
              <div className="mt-2 text-xs font-medium text-slate-400">{s.teachers.length} prof(s)</div>
            </div>
          ))}
          {subjects.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              Nenhuma disciplina cadastrada.
            </div>
          )}
        </div>
      </div>

      {selected && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in" onClick={() => setSelectedId(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><BookOpen size={24} /></div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selected.name}</h3>
                  <p className="text-sm text-slate-500">Sigla: {selected.sigla}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={handleEdit} className="text-slate-400 hover:text-indigo-600 hover:bg-slate-200 p-2 rounded-lg transition-colors" title="Editar"><Pencil size={18} /></button>
                <button onClick={handleDelete} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Excluir disciplina"><Trash2 size={18} /></button>
                <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-900 hover:bg-slate-200 p-2 rounded-lg transition-colors"><X size={20} /></button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User size={18} className="text-indigo-500" /> Professores Vinculados
              </h4>

              <div className="flex gap-2 mb-6">
                <select
                  value={teacherToAdd}
                  onChange={e => setTeacherToAdd(e.target.value)}
                  className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex-1 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="">Selecione um professor...</option>
                  {teachers.filter(t => !selected.teachers.some(st => st.id === t.id)).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button onClick={linkTeacher} disabled={!teacherToAdd} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-3 rounded-xl transition-all shadow-sm flex items-center justify-center">
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-2">
                {selected.teachers.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:border-indigo-100 bg-white shadow-sm transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><User size={16} /></div>
                      <span className="font-medium text-slate-700">{t.name}</span>
                    </div>
                    <button onClick={() => unlinkTeacher(t.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Remover professor">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {selected.teachers.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                    Esta matéria ainda não possui professores vinculados.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 mt-auto">
              <button onClick={() => setSelectedId(null)} className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-all">
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
