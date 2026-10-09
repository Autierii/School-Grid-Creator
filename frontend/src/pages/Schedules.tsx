import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Trash2, Eye, CalendarClock, LayoutGrid, Pencil } from 'lucide-react';
import { api, type Grade } from '../api';
import { GradeModal, GradeView } from '../components/GradeView';

type Schedule = { id: string; name: string; data: string; createdAt: string };

export default function Schedules() {
  const { schoolId } = useParams();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selected, setSelected] = useState<{ id: string; name: string; grade: Grade } | null>(null);
  const [error, setError] = useState('');

  const fetchSchedules = useCallback(() => {
    api<Schedule[]>(`/schools/${schoolId}/schedules`).then(setSchedules).catch(e => setError(e.message));
  }, [schoolId]);

  useEffect(fetchSchedules, [fetchSchedules]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta grade salva?')) return;
    try {
      await api(`/schedules/${id}`, { method: 'DELETE' });
      setSchedules(schedules.filter(s => s.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleRename = async (s: Schedule) => {
    const name = prompt('Novo nome da grade:', s.name)?.trim();
    if (!name || name === s.name) return;
    try {
      await api(`/schedules/${s.id}`, { method: 'PUT', json: { name } });
      fetchSchedules();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleView = (s: Schedule) => {
    try {
      setSelected({ id: s.id, name: s.name, grade: JSON.parse(s.data) });
    } catch {
      alert('Os dados desta grade estão corrompidos.');
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto fade-in">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Histórico de Grades</h2>
          <p className="text-slate-500 mt-1">Visualize, exporte e gerencie as soluções de horários salvas anteriormente.</p>
        </div>
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

        <div className="grid gap-6 mb-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {schedules.map(s => (
            <div key={s.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                  <CalendarClock size={24} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleView(s)} className="text-slate-400 hover:text-indigo-600 p-2 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors" title="Visualizar grade">
                    <Eye size={18} />
                  </button>
                  <button onClick={() => handleRename(s)} className="text-slate-400 hover:text-indigo-600 p-2 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors" title="Renomear">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="text-slate-400 hover:text-red-500 p-2 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors" title="Excluir do histórico">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <button onClick={() => handleView(s)} className="text-left">
                <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2 hover:text-indigo-700">{s.name}</h3>
                <p className="text-sm text-slate-500">
                  Criado em {new Date(s.createdAt).toLocaleDateString('pt-BR')} às {new Date(s.createdAt).toLocaleTimeString('pt-BR')}
                </p>
              </button>
            </div>
          ))}
          {schedules.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
              <CalendarClock size={48} className="text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Nenhuma grade salva</h3>
              <p>Gere uma nova grade e clique em "Salvar" para manter o histórico.</p>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <GradeModal
          titulo={selected.name}
          subtitulo="Grade salva no histórico"
          icone={<div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl"><LayoutGrid size={24} /></div>}
          onClose={() => setSelected(null)}
        >
          <GradeView grade={selected.grade} nome={selected.name} />
        </GradeModal>
      )}
    </>
  );
}
