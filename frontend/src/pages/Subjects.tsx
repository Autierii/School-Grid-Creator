import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

export default function Subjects() {
  const { schoolId } = useParams();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [sigla, setSigla] = useState('');

  const fetchSubjects = () => {
    fetch(`${API_URL}/schools/${schoolId}/subjects`)
      .then(r => r.json())
      .then(setSubjects);
  };

  useEffect(() => {
    fetchSubjects();
  }, [schoolId]);

  const handleCreate = async () => {
    if (!name || !sigla) return;
    await fetch(`${API_URL}/schools/${schoolId}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sigla })
    });
    setName('');
    setSigla('');
    fetchSubjects();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Matérias</h2>
      
      <div className="bg-[#1a1025] p-6 rounded-xl border border-[#3b2559] mb-8">
        <h3 className="text-xl mb-4 font-semibold text-purple-300">Nova Matéria</h3>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Nome (ex: Matemática)" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-[#130c1a] border border-[#3b2559] p-3 rounded-lg flex-1 text-white focus:outline-none focus:border-purple-500"
          />
          <input 
            type="text" 
            placeholder="Sigla (ex: MAT)" 
            value={sigla}
            onChange={e => setSigla(e.target.value)}
            className="bg-[#130c1a] border border-[#3b2559] p-3 rounded-lg w-32 text-white focus:outline-none focus:border-purple-500"
          />
          <button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-colors">
            Adicionar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subjects.map(s => (
          <div key={s.id} className="bg-[#1a1025] border border-[#3b2559] p-6 rounded-xl shadow-lg text-center">
            <h4 className="text-2xl font-bold text-purple-400">{s.sigla}</h4>
            <p className="text-gray-400 mt-2">{s.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
