import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useLocation } from 'react-router-dom';
import { Calendar, School, Users, BookOpen, Layers, Trash2, Settings, ChevronLeft } from 'lucide-react';

import Teachers from './pages/Teachers';
import Subjects from './pages/Subjects';
import Classes from './pages/Classes';
import Generate from './pages/Generate';
import Schedules from './pages/Schedules';
import AiConfigModal from './components/AiConfigModal';
import { api } from './api';

function SidebarItem({ to, icon: Icon, label, isActive }: { to: string, icon: any, label: string, isActive: boolean }) {
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
      {label}
    </Link>
  );
}

function Sidebar() {
  return (
    <div className="w-72 bg-white border-r border-slate-200 min-h-screen p-6 flex flex-col gap-2 relative z-10">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
          <Calendar className="text-white" size={24} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Grid Creator</h1>
      </div>
      
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4">Menu Principal</div>
      <SidebarItem to="/" icon={School} label="Minhas Escolas" isActive={true} />
    </div>
  );
}

function SchoolDashboard() {
  const { schoolId } = useParams();
  const location = useLocation();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    api(`/schools/${schoolId}`).then(s => setSchoolName(s.name)).catch(() => setSchoolName(''));
  }, [schoolId]);

  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <div className="w-72 bg-white border-r border-slate-200 min-h-screen p-6 flex flex-col gap-2 relative z-10">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <Calendar className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Grid Creator</h1>
        </div>
        
        <Link to="/" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 px-2 transition-colors">
          <ChevronLeft size={16} /> Voltar para Escolas
        </Link>

        {schoolName && <div className="px-4 py-3 mb-2 rounded-xl bg-slate-50 border border-slate-100 font-semibold text-slate-800 truncate" title={schoolName}>{schoolName}</div>}
        
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4 mb-2 px-4">Gestão Escolar</div>
        <SidebarItem to={`/school/${schoolId}/teachers`} icon={Users} label="Professores" isActive={isActive('teachers')} />
        <SidebarItem to={`/school/${schoolId}/subjects`} icon={BookOpen} label="Disciplinas" isActive={isActive('subjects')} />
        <SidebarItem to={`/school/${schoolId}/classes`} icon={Layers} label="Turmas" isActive={isActive('classes')} />
        
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-8 mb-2 px-4">Operações</div>
        <SidebarItem to={`/school/${schoolId}/generate`} icon={Calendar} label="Gerar Nova Grade" isActive={isActive('generate')} />
        <SidebarItem to={`/school/${schoolId}/schedules`} icon={BookOpen} label="Histórico de Grades" isActive={isActive('schedules')} />
        
        <div className="mt-auto pt-6 border-t border-slate-100">
          <button 
            onClick={() => setIsConfigOpen(true)} 
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
          >
            <Settings size={20} className="text-slate-400" />
            Configurações de IA
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-10 max-h-screen overflow-y-auto">
        <Routes>
          <Route path="teachers" element={<Teachers />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="classes" element={<Classes />} />
          <Route path="generate" element={<Generate />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="*" element={
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto fade-in">
              <div className="bg-indigo-50 p-6 rounded-full mb-6">
                <School size={48} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Painel da Escola</h2>
              <p className="text-slate-500">Selecione uma opção no menu lateral para começar a gerenciar os dados desta escola e gerar grades.</p>
            </div>
          } />
        </Routes>
      </div>
      <AiConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </div>
  );
}

function Schools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/schools').then(setSchools).catch(e => setError(e.message));
  }, []);

  const handleCreate = async () => {
    if (!newSchoolName.trim()) return;
    try {
      const newSchool = await api('/schools', { method: 'POST', json: { name: newSchoolName } });
      setSchools([...schools, { ...newSchool, _count: { teachers: 0, classes: 0, subjects: 0, schedules: 0 } }]);
      setNewSchoolName('');
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Deseja realmente excluir esta escola e TODOS os dados dela?')) return;
    
    try {
      await api(`/schools/${id}`, { method: 'DELETE' });
      setSchools(schools.filter(s => s.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto fade-in">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Suas Escolas</h2>
              <p className="text-slate-500">Gerencie todas as instituições de ensino em um só lugar.</p>
            </div>
          </div>

          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl max-w-2xl">{error}</div>}

          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center mb-10 w-full max-w-2xl">
            <input 
              type="text" 
              placeholder="Digite o nome da nova escola..." 
              value={newSchoolName}
              onChange={e => setNewSchoolName(e.target.value)}
              className="bg-transparent border-none p-4 flex-1 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-0"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <button 
              onClick={handleCreate} 
              disabled={!newSchoolName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-sm"
            >
              Criar Escola
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {schools.map(school => (
              <Link 
                key={school.id} 
                to={`/school/${school.id}`} 
                className="group relative bg-white border border-slate-200 p-6 rounded-2xl hover:border-indigo-300 transition-all hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 flex flex-col h-48"
              >
                <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
                  <School className="text-slate-400 group-hover:text-indigo-600 transition-colors" size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 pr-8 line-clamp-2 leading-tight">{school.name}</h3>
                {school._count && (
                  <p className="text-xs text-slate-500 mt-2">
                    {school._count.teachers} professores · {school._count.classes} turmas · {school._count.subjects} disciplinas
                  </p>
                )}
                <p className="text-indigo-600 font-medium mt-auto text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Acessar painel <ChevronLeft size={16} className="rotate-180" />
                </p>
                
                <button 
                  onClick={(e) => handleDelete(e, school.id)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors z-10"
                  title="Excluir Escola"
                >
                  <Trash2 size={18} />
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen text-slate-900 bg-slate-50">
        <Routes>
          <Route path="/" element={<Schools />} />
          <Route path="/school/:schoolId/*" element={<SchoolDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}
