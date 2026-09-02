import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Layers, Trophy } from 'lucide-react';

export default function MockTestGrid({ mocks }) {
  const navigate = useNavigate();
  return (
    <div>
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" /> Mock Tests
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {mocks.map((mt) => (
          <button
            key={mt._id}
            onClick={() => navigate(`/practice/aptitude/mock/generate?category=${mt.category}`)}
            className="text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-yellow-500/40 hover:bg-gray-800/60 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-medium">{mt.name}</h3>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{mt.totalQuestions} Q</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">{mt.description}</p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><BrainCircuit className="w-3 h-3 text-purple-400" /> Mixed</span>
              <span className="flex items-center gap-1"><Layers className="w-3 h-3 text-blue-400" /> {mt.duration} min</span>
              <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-400" /> {mt.passingScore}%</span>
            </div>
          </button>
        ))}
        {mocks.length === 0 && <p className="text-gray-500 text-sm">No mock tests available yet.</p>}
      </div>
    </div>
  );
}