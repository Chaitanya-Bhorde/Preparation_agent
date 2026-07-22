import { useState, useEffect } from 'react';
import { getMyMistakes, updateMistakeStatus } from '../api';
import { PAGE_CONTAINER, LOADING_SPINNER, EMPTY_STATE_CLASSES } from '../utils/ui';
import { AlertTriangle, Loader2, CheckCircle, Clock, HelpCircle } from 'lucide-react';

export default function Mistakes() {
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  useEffect(() => { loadMistakes(); }, [filter]);
  const loadMistakes = async () => {
    try {
      const params = {};
      if (filter) params.type = filter;
      const { data } = await getMyMistakes(params);
      setMistakes(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleStatusUpdate = async (id, status) => {
    await updateMistakeStatus(id, status);
    loadMistakes();
  };
  const statusIcon = (s) => s === 'mastered' ? <CheckCircle className="w-4 h-4 text-green-400" /> : s === 'learning' ? <Clock className="w-4 h-4 text-yellow-400" /> : <HelpCircle className="w-4 h-4 text-red-400" />;
  if (loading) return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  return (
    <div className={PAGE_CONTAINER}>
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><AlertTriangle className="w-8 h-8" /> My Mistakes</h1>
        <p className="text-red-100">Review and learn from your errors</p>
      </div>
      <div className="flex gap-2 mb-6">
        {['', 'Logic Error', 'Wrong Data Structure', 'Off-by-One', 'Syntax Error', 'Time Limit Exceeded', 'Edge Case Missed', 'Other'].map((t) => (
          <button key={t || 'all'} onClick={() => setFilter(t)} className={`px-3 py-1 rounded-lg text-sm transition-colors ${filter === t ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'}`}>
            {t || 'All'}
          </button>
        ))}
      </div>
      {mistakes.length === 0 ? (
        <div className={EMPTY_STATE_CLASSES}><AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-500" /><p className="text-gray-500">No mistakes logged yet. Keep practicing!</p></div>
      ) : (
        <div className="space-y-3">
          {mistakes.map((m) => (
            <div key={m._id} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs px-2 py-1 bg-red-900/30 text-red-400 rounded">{m.mistakeType}</span>
                <div className="flex items-center gap-2">
                  {statusIcon(m.status)}
                  <select value={m.status} onChange={(e) => handleStatusUpdate(m._id, e.target.value)} className="bg-gray-800 text-white text-xs rounded px-2 py-1">
                    <option value="open">Open</option>
                    <option value="learning">Learning</option>
                    <option value="mastered">Mastered</option>
                  </select>
                </div>
              </div>
              {m.problem && <p className="text-white text-sm font-medium mb-1">{m.problem.title}</p>}
              {m.personalNote && <p className="text-gray-400 text-xs mb-2">{m.personalNote}</p>}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {m.submission && <span>Status: {m.submission.status}</span>}
                {m.topic && <span>Topic: {m.topic}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}