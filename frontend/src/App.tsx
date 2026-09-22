import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { Calendar, School, Users, BookOpen, Layers } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

function Sidebar() {
  return (
    <div className="w-64 bg-[#130c1a] border-r border-[#3b2559] min-h-screen p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-purple-400 mb-8 flex items-center gap-2">
        <Calendar /> Grade Creator
      </h1>
      <Link to="/" className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-[#3b2559] p-2 rounded-lg transition-colors">
        <School /> Escolas
      </Link>
    </div>
  );
}

function SchoolDashboard() {
  const { schoolId } = useParams();
  return (
    <div className="flex">
      <div className="w-64 bg-[#130c1a] border-r border-[#3b2559] min-h-screen p-4 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-purple-400 mb-8 flex items-center gap-2">
          <Calendar /> Grade Creator
        </h1>
        <Link to="/" className="text-sm text-gray-400 hover:text-white mb-4">← Voltar</Link>
        <Link to={`/school/${schoolId}/teachers`} className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-[#3b2559] p-2 rounded-lg transition-colors">
          <Users /> Professores
        </Link>
        <Link to={`/school/${schoolId}/subjects`} className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-[#3b2559] p-2 rounded-lg transition-colors">
          <BookOpen /> Matérias
        </Link>
        <Link to={`/school/${schoolId}/classes`} className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-[#3b2559] p-2 rounded-lg transition-colors">
          <Layers /> Turmas
        </Link>
        <Link to={`/school/${schoolId}/generate`} className="flex items-center gap-2 text-purple-300 hover:text-white hover:bg-purple-900 p-2 rounded-lg transition-colors mt-auto">
          <Calendar /> Gerar Grade
        </Link>
      </div>
      <div className="flex-1 p-8">
        <Routes>
          <Route path="teachers" element={<div>Professores Management...</div>} />
          <Route path="subjects" element={<div>Matérias Management...</div>} />
          <Route path="classes" element={<div>Turmas Management...</div>} />
          <Route path="generate" element={<div>Gerador de Grade...</div>} />
          <Route path="" element={<div className="text-xl">Selecione uma opção no menu lateral para gerenciar sua escola.</div>} />
        </Routes>
      </div>
    </div>
  );
}

function Schools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [newSchoolName, setNewSchoolName] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/schools`).then(r => r.json()).then(setSchools);
  }, []);

  const handleCreate = async () => {
    if (!newSchoolName) return;
    const res = await fetch(`${API_URL}/schools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSchoolName })
    });
    const newSchool = await res.json();
    setSchools([...schools, newSchool]);
    setNewSchoolName('');
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6">Suas Escolas</h2>
        <div className="flex gap-4 mb-8">
          <input 
            type="text" 
            placeholder="Nome da Nova Escola" 
            value={newSchoolName}
            onChange={e => setNewSchoolName(e.target.value)}
            className="bg-[#1a1025] border border-[#3b2559] p-3 rounded-lg flex-1 text-white focus:outline-none focus:border-purple-500"
          />
          <button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]">
            Criar Escola
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map(school => (
            <Link key={school.id} to={`/school/${school.id}`} className="block bg-[#1a1025] hover:bg-[#251736] border border-[#3b2559] hover:border-purple-500 p-6 rounded-xl transition-all hover:scale-105 group cursor-pointer shadow-lg hover:shadow-purple-900/50">
              <h3 className="text-xl font-bold text-white group-hover:text-purple-300">{school.name}</h3>
              <p className="text-gray-400 mt-2 text-sm">Acessar painel de gestão →</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen text-gray-100 bg-[#0b0710]">
        <Routes>
          <Route path="/" element={<Schools />} />
          <Route path="/school/:schoolId/*" element={<SchoolDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}
