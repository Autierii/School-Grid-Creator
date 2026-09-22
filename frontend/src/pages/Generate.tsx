import { useState } from 'react';
import { useParams } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

export default function Generate() {
  const { schoolId } = useParams();
  const [horarios, setHorarios] = useState('7h, 8h, 9h, 10h, 11h');
  const [grade, setGrade] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setGrade(null);
    
    try {
      const parsedHorarios = horarios.split(',').map(h => h.trim()).filter(h => h);
      const res = await fetch(`${API_URL}/schools/${schoolId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horarios: parsedHorarios })
      });
      const data = await res.json();
      
      if (res.ok) {
        setGrade(data.grade);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    }
    setLoading(false);
  };

  const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        Gerar Grade Mágica
      </h2>
      
      <div className="bg-[#1a1025] p-6 rounded-xl border border-[#3b2559] mb-8">
        <p className="text-gray-400 mb-4">Defina os horários de aula (separados por vírgula). Ex: 7h, 8h, 9h</p>
        <div className="flex gap-4">
          <input 
            type="text" 
            value={horarios}
            onChange={e => setHorarios(e.target.value)}
            className="bg-[#130c1a] border border-[#3b2559] p-3 rounded-lg flex-1 text-white focus:outline-none focus:border-purple-500"
          />
          <button 
            onClick={handleGenerate} 
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] disabled:opacity-50"
          >
            {loading ? 'Calculando...' : 'GERAR AGORA ✨'}
          </button>
        </div>
        {error && <div className="mt-4 p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg">{error}</div>}
      </div>

      {grade && (
        <div className="space-y-12 fade-in">
          {Object.keys(grade).map(turma => (
            <div key={turma} className="bg-[#1a1025] border border-[#3b2559] rounded-xl overflow-hidden shadow-2xl">
              <div className="bg-[#2d1b4e] p-4 border-b border-[#3b2559]">
                <h3 className="text-2xl font-bold text-center text-white">{turma}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-4 border-b border-[#3b2559] bg-[#130c1a] text-purple-300 font-semibold w-32">Horário</th>
                      {dias.map(dia => (
                        <th key={dia} className="p-4 border-b border-l border-[#3b2559] bg-[#130c1a] text-purple-300 font-semibold text-center">{dia}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.split(',').map(h => h.trim()).filter(h => h).map((hora) => (
                      <tr key={hora} className="hover:bg-[#1f1332] transition-colors">
                        <td className="p-4 border-b border-[#3b2559] font-medium text-gray-400">{hora}</td>
                        {dias.map(dia => {
                          const aulaStr = grade[turma][dia][hora];
                          const isVago = aulaStr === "—";
                          return (
                            <td key={dia} className={`p-4 border-b border-l border-[#3b2559] text-center ${isVago ? 'text-gray-600' : 'text-white font-bold'}`}>
                              {isVago ? '-' : aulaStr}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
