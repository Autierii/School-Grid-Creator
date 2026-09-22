import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

export default function Teachers() {
  const { schoolId } = useParams();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [name, setName] = useState('');
  
  // A simple way to handle restrictions: string format e.g. ["Segunda-7h", "Terça-8h"]
  // For simplicity we will leave it as an empty string to be managed later, or a simple text area.
  const [restrictions, setRestrictions] = useState('[]'); 

  const fetchTeachers = () => {
    fetch(`${API_URL}/schools/${schoolId}/teachers`)
      .then(r => r.json())
      .then(setTeachers);
  };

  useEffect(() => {
    fetchTeachers();
  }, [schoolId]);

  const handleCreate = async () => {
    if (!name) return;
    await fetch(`${API_URL}/schools/${schoolId}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, restrictions })
    });
    setName('');
    fetchTeachers();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Professores</h2>
      
      <div className="bg-[#1a1025] p-6 rounded-xl border border-[#3b2559] mb-8">
        <h3 className="text-xl mb-4 font-semibold text-purple-300">Novo Professor</h3>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Nome do Professor" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-[#130c1a] border border-[#3b2559] p-3 rounded-lg flex-1 text-white focus:outline-none focus:border-purple-500"
          />
          <button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-colors">
            Adicionar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map(t => (
          <div key={t.id} className="bg-[#1a1025] border border-[#3b2559] p-6 rounded-xl shadow-lg">
            <h4 className="text-lg font-bold text-white">{t.name}</h4>
          </div>
        ))}
      </div>
    </div>
  );
}
