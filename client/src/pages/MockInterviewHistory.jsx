import { useState, useEffect } from 'react';
import { Award, Clock, Mic, Keyboard, AlertCircle, ChevronRight, Loader2, BarChart3 } from 'lucide-react';
import { PAGE_CONTAINER } from '../utils/ui';
import { getInterviewHistory } from '../api';
import { useNavigate } from 'react-router-dom';

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' • ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function scoreColor(pct) {
  if (pct >= 80) return 'text-green-400';
  if (pct >= 60) return 'text-emerald-400';
  if (pct >= 40) return 'text-yellow-400';
  if (pct >= 20) return 'text-orange-400';
  return 'text-red-400';
}

export default function MockInterviewHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await getInterviewHistory();
      if (data.success) setHistory(data.data);
      else setError(data.message || 'Failed to load history.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load interview history.');
    } finally { setLoading(false); }
  };

  const viewDetail = (id) => navigate(`/mock-interview/report/${id}`);

  if (loading) {
    return (
      <div className={PAGE_CONTAINER}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <span className="ml-3 text-gray-400">Loading interview history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE_CONTAINER}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mock Interview History</h1>
        <p className="text-gray-400">Review your past mock interviews and track your progress.</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {history.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No interviews yet</h2>
          <p className="text-gray-400 mb-6">Complete your first mock interview to see your history here.</p>
          <button onClick={() => navigate('/mock-interview')} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Start New Interview
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const pct = item.maxScore > 0 ? Math.round((item.score / item.maxScore) * 100) : 0;
            return (
              <div key={item.id} className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors cursor-pointer" onClick={() => viewDetail(item.id)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white truncate">{item.topics?.join(', ') || 'General'}</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 capitalize">{item.mode}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 capitalize">{item.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <span className="flex items-center gap-1">{item.mode === 'voice' ? <Mic className="w-3.5 h-3.5" /> : <Keyboard className="w-3.5 h-3.5" />}{item.mode === 'voice' ? 'Voice' : 'Text'}</span>
                      <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />{item.totalQuestions} Questions</span>
                      {item.followUpCount > 0 && <span className="text-xs text-gray-500">{item.followUpCount} follow-ups</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(item.completedAt || item.createdAt)}</span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-gray-400">Score</span>
                        <span className={`font-bold ${scoreColor(pct)}`}>{item.score}/{item.maxScore} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct >= 60 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.strongTopics?.slice(0, 3).map((t, i) => (<span key={i} className="text-xs bg-green-900/20 text-green-400 px-2 py-0.5 rounded">✓ {t}</span>))}
                      {item.weakTopics?.slice(0, 3).map((t, i) => (<span key={i} className="text-xs bg-red-900/20 text-red-400 px-2 py-0.5 rounded">⚠ {t}</span>))}
                    </div>
                    {item.submissionReason === 'PROCTORING_VIOLATION' && (
                      <div className="mt-2 text-xs text-orange-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Auto-submitted due to proctoring violations</div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0 mt-2" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}