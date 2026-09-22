import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

export default function Classes() {
  const { schoolId } = useParams();
  const [classes, setClasses] = useState<any[]>([]);
  const [name, setName] = useState('');

  // Form para associar professor à turma
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [aulas, setAulas] = useState('1');

  const fetchData = () => {
    fetch(`${API_URL}/schools/${schoolId}/classes`).then(r => r.json()).then(setClasses);
    fetch(`${API_URL}/schools/${schoolId}/teachers`).then(r => r.json()).then(setTeachers);
    fetch(`${API_URL}/schools/${schoolId}/subjects`).then(r => r.json()).then(setSubjects);
    fetch(`${API_URL}/schools/${schoolId}/lessons`).then(r => r.json()).then(setLessons);
  };

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  const handleCreateClass = async () => {
    if (!name) return;
    await fetch(`${API_URL}/schools/${schoolId}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    setName('');
    fetchData();
  };

  const handleCreateLesson = async () => {
    if (!selectedClass || !selectedTeacher || !selectedSubject) return;
    await fetch(`${API_URL}/schools/${schoolId}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classId: selectedClass,
        teacherId: selectedTeacher,
        subjectId: selectedSubject,
        aulas: parseInt(aulas)
      })
    });
    fetchData();
  };

  const handleDeleteLesson = async (id: string) => {
    await fetch(`${API_URL}/lessons/${id}`, { method: 'DELETE' });
    fetchData();
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Turmas e Aulas</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Nova Turma */}
        <div className="bg-[#1a1025] p-6 rounded-xl border border-[#3b2559]">
          <h3 className="text-xl mb-4 font-semibold text-purple-300">Nova Turma</h3>
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="Nome (ex: 1º Ano A)" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-[#130c1a] border border-[#3b2559] p-3 rounded-lg flex-1 text-white focus:outline-none focus:border-purple-500"
            />
            <button onClick={handleCreateClass} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-colors">
              Adicionar
            </button>
          </div>
        </div>

        {/* Associar Aula */}
        <div className="bg-[#1a1025] p-6 rounded-xl border border-[#3b2559]">
          <h3 className="text-xl mb-4 font-semibold text-purple-300">Atribuir Aula</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="bg-[#130c1a] border border-[#3b2559] p-3 rounded-lg text-white focus:outline-none focus:border-purple-500">
              <option value="">Selecione a Turma</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} className="bg-[#130c1a] border border-[#3b2559] p-3 rounded-lg text-white focus:outline-none focus:border-purple-500">
              <option value="">Selecione o Professor</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="bg-[#130c1a] border border-[#3b2559] p-3 rounded-lg text-white focus:outline-none focus:border-purple-500">
              <option value="">Selecione a Matéria</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input 
              type="number" 
              placeholder="Qtd. Aulas" 
              value={aulas}
              onChange={e => setAulas(e.target.value)}
              min="1"
              className="bg-[#130c1a] border border-[#3b2559] p-3 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <button onClick={handleCreateLesson} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors">
            Atribuir
          </button>
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-4 border-b border-[#3b2559] pb-2">Aulas Atribuídas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(c => {
          const classLessons = lessons.filter(l => l.classId === c.id);
          return (
            <div key={c.id} className="bg-[#1a1025] border border-[#3b2559] p-6 rounded-xl shadow-lg">
              <h4 className="text-xl font-bold text-white mb-4 flex justify-between">
                {c.name}
                <span className="text-sm bg-purple-900 text-purple-200 px-2 py-1 rounded-full">{classLessons.reduce((acc, l) => acc + l.aulas, 0)} aulas/sem</span>
              </h4>
              <div className="space-y-2">
                {classLessons.map(l => (
                  <div key={l.id} className="flex justify-between items-center bg-[#130c1a] p-2 rounded border border-[#3b2559]">
                    <div className="text-sm">
                      <span className="font-bold text-purple-400">{l.subject?.sigla}</span> - {l.teacher?.name} ({l.aulas}x)
                    </div>
                    <button onClick={() => handleDeleteLesson(l.id)} className="text-red-400 hover:text-red-300">X</button>
                  </div>
                ))}
                {classLessons.length === 0 && <p className="text-gray-500 text-sm italic">Nenhuma aula atribuída.</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
