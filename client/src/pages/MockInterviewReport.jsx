import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, ArrowLeft, Loader2, AlertCircle, BarChart3, Target, TrendingUp, BookOpen } from 'lucide-react';
import { PAGE_CONTAINER } from '../utils/ui';
import { getInterviewHistoryDetail } from '../api';

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' • ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function scoreColor(score) {
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-emerald-400';
  if (score >= 4) return 'text-yellow-400';
  if (score >= 2) return 'text-orange-400';
  return 'text-red-400';
}

export default function MockInterviewReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadReport(); }, [id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getInterviewHistoryDetail(id);
      if (res.data.success) setData(res.data.data);
      else setError(res.data.message || 'Failed to load report.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load interview report.');
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className={PAGE_CONTAINER}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <span className="ml-3 text-gray-400">Loading report...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={PAGE_CONTAINER}>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-300 mb-4">{error || 'Report not found.'}</p>
          <button onClick={() => navigate('/mock-interview/history')} className="text-blue-400 hover:text-blue-300 text-sm">Back to History</button>
        </div>
      </div>
    );
  }

  const { session, report, questions } = data;
  const mainQuestions = questions.filter(q => !q.isFollowUp);
  const followUpQuestions = questions.filter(q => q.isFollowUp);
  const score = report?.score ?? 0;
  const maxScore = report?.maxScore ?? session.totalQuestions * 2;
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return (
    <div className={PAGE_CONTAINER}>
      <button onClick={() => navigate('/mock-interview/history')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm"><ArrowLeft className="w-4 h-4" /> Back to History</button>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Interview Report</h1>
        <p className="text-gray-400">{session.topics?.join(', ')} • {session.mode} • {formatDate(session.completedAt)}</p>
        {session.submissionReason === 'PROCTORING_VIOLATION' && <div className="mt-2 text-sm text-orange-400 flex items-center gap-1"><AlertCircle className="w-4 h-4" />Auto-submitted due to proctoring violations</div>}
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center mb-8">
        <div className="text-sm text-gray-400 mb-2">Overall Score</div>
        <div className={`text-6xl font-bold mb-2 ${scoreColor(score / maxScore * 10)}`}>{score}<span className="text-2xl text-gray-500">/{maxScore}</span></div>
        <div className="text-gray-400">{pct}% • {mainQuestions.length} main questions</div>
      </div>
      {report?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center"><div className="text-2xl font-bold text-white">{report.stats.mainQuestionsAsked ?? mainQuestions.length}</div><div className="text-xs text-gray-500">Main Questions</div></div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center"><div className="text-2xl font-bold text-white">{report.stats.followUpCount ?? followUpQuestions.length}</div><div className="text-xs text-gray-500">Follow-ups</div></div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center"><div className="text-2xl font-bold text-green-400">{report.stats.fullCount ?? 0}</div><div className="text-xs text-gray-500">Correct</div></div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center"><div className="text-2xl font-bold text-red-400">{report.stats.incorrectCount ?? 0}</div><div className="text-xs text-gray-500">Incorrect</div></div>
        </div>
      )}

      {/* Question-wise Score */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-blue-400" />Question-wise Score</h2>
        <div className="space-y-3">
          {mainQuestions.map((q, i) => {
            const p = Math.min(100, Math.max(0, ((q.marks ?? q.score ?? 0) / (q.maxMarks ?? 2)) * 100));
            const barColor = p >= 80 ? 'bg-green-500' : p >= 50 ? 'bg-yellow-500' : 'bg-red-500';
            return (<div key={i} className="space-y-1"><div className="flex justify-between items-center text-sm"><span className="text-gray-300 font-medium">Q{i + 1}</span><span className={`font-semibold ${scoreColor((q.marks ?? q.score ?? 0) / (q.maxMarks ?? 2) * 10)}`}>{q.marks ?? q.score ?? '-'}/{q.maxMarks ?? 2}</span></div><div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden"><div className={`h-full rounded-full ${barColor}`} style={{ width: `${p}%` }} /></div><div className="text-xs text-gray-500 truncate">{q.question}</div></div>);
          })}
        </div>
      </div>

      {/* Topic Performance */}
      {report?.topicPerformance?.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-purple-400" />Topic Performance</h2>
          <div className="space-y-3">
            {report.topicPerformance.map((tp) => { const p = Math.min(100, Math.max(0, (tp.averageScore / 10) * 100)); const barColor = p >= 80 ? 'bg-green-500' : p >= 60 ? 'bg-emerald-500' : p >= 40 ? 'bg-yellow-500' : p >= 20 ? 'bg-orange-500' : 'bg-red-500'; return (<div key={tp.topic} className="space-y-1"><div className="flex justify-between items-center text-sm"><span className="text-gray-300 font-medium">{tp.topic}</span><span className={`font-semibold ${scoreColor(tp.averageScore)}`}>{tp.averageScore}/10</span></div><div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden"><div className={`h-full rounded-full ${barColor}`} style={{ width: `${p}%` }} /></div></div>); })}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {report?.strengths?.length > 0 && (<div className="bg-gray-900 rounded-xl border border-gray-800 p-6"><h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" />Strengths</h2><ul className="space-y-2">{report.strengths.map((s, i) => (<li key={i} className="text-sm text-gray-300 flex items-start gap-2"><span className="text-green-400">✓</span>{s}</li>))}</ul></div>)}
        {report?.areasToImprove?.length > 0 && (<div className="bg-gray-900 rounded-xl border border-gray-800 p-6"><h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-400" />Areas to Improve</h2><ul className="space-y-2">{report.areasToImprove.map((s, i) => (<li key={i} className="text-sm text-gray-300 flex items-start gap-2"><span className="text-red-400">⚠</span>{s}</li>))}</ul></div>)}
      </div>

      {/* Question Details */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-400" />Question Details</h2>
        <div className="space-y-4">
                    {mainQuestions.map((q, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Q{i + 1} • {q.topic}</span>
                  <p className="text-sm text-white font-medium">{q.question}</p>
                </div>
                <span className={`text-sm font-bold ${scoreColor((q.marks ?? q.score ?? 0) / (q.maxMarks ?? 2) * 10)}`}>{q.marks ?? q.score ?? '-'}/{q.maxMarks ?? 2}</span>
              </div>
              <div className="mt-2 space-y-2"><div><span className="text-xs text-gray-500">Your answer:</span><p className="text-sm text-gray-300 mt-0.5">{q.answer || <span className="text-gray-600 italic">No answer</span>}</p></div>{q.feedback && <p className="text-xs text-gray-400 italic">{q.feedback}</p>}</div>
            </div>
          ))}
        </div>
      </div>

      {report?.assessment && (<div className="bg-gray-900 rounded-xl border border-gray-800 p-6"><h2 className="text-lg font-semibold text-white mb-4">AI Assessment</h2><p className="text-gray-300">{report.assessment}</p></div>)}
    </div>
  );
}