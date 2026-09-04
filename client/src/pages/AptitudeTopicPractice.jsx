import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, ListOrdered, RotateCcw } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { PAGE_CONTAINER, LOADING_SPINNER, BUTTON_CLASSES } from '../utils/ui';
import { getAptitudeQuestions, submitAptitudeAnswer } from '../api';
import QuestionCard from '../components/aptitude/QuestionCard';

const DIFFS = [
  { key: 'easy', label: 'Easy', active: 'border-green-500/60 bg-green-900/20 text-green-300' },
  { key: 'medium', label: 'Medium', active: 'border-yellow-500/60 bg-yellow-900/20 text-yellow-300' },
  { key: 'hard', label: 'Hard', active: 'border-red-500/60 bg-red-900/20 text-red-300' },
];
const IDLE_TAB = 'border-gray-700 bg-gray-800/40 hover:border-gray-500 text-gray-400';

export default function AptitudeTopicPractice() {
  usePageTitle('Topic Practice');
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState('easy');
  const [questions, setQuestions] = useState([]);
  const [counts, setCounts] = useState({ easy: 0, medium: 0, hard: 0 });
  const [topicName, setTopicName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  // Cache per-question solution (explanation + steps) returned by submit-answer,
  // since the questions endpoint intentionally hides it until answered.
  const [solutions, setSolutions] = useState({});

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      setError(null);
      setIdx(0);
      setAnswers({});
      setSolutions({});
      setFinished(false);
      try {
        const res = await getAptitudeQuestions(topicId, difficulty);
        if (!live) return;
        setQuestions(res.data.questions || []);
        setCounts(res.data.counts || { easy: 0, medium: 0, hard: 0 });
        setTopicName(res.data.questions?.[0]?.topic || 'Topic');
      } catch (e) {
        if (live) setError(e.response?.data?.error || 'Failed to load questions.');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [topicId, difficulty]);

  const handleSelect = useCallback(async (label) => {
    const q = questions[idx];
    if (!q || answers[q._id] !== undefined) return;
    setAnswers(prev => ({ ...prev, [q._id]: label }));
    try {
      const res = await submitAptitudeAnswer({ questionId: q._id, selectedAnswer: label, timeTaken: 30 });
      if (res?.data?.explanation) {
        setSolutions(prev => ({
          ...prev,
          [q._id]: {
            explanation: res.data.explanation,
            solutionSteps: res.data.solutionSteps || [],
            correctAnswer: res.data.correctAnswer || q.correctAnswer,
          },
        }));
      }
    } catch (e) {
      console.error('submit-answer failed (feedback still shown locally):', e?.message);
    }
  }, [questions, idx, answers]);

  // Clear an answer so the green/red feedback disappears (after ~18s) and the user can retry.
  const clearAnswer = useCallback((qid) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[qid];
      return next;
    });
    setSolutions(prev => {
      const next = { ...prev };
      delete next[qid];
      return next;
    });
  }, []);

  const sol = solutions[questions[idx]?._id];
  // Merge cached solution (if answered) back into the question so QuestionCard
  // can render explanation + steps under "View solution".
  const q = sol ? { ...questions[idx], ...sol } : questions[idx];

  if (loading) return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;

  if (error) {
    return (
      <div className={PAGE_CONTAINER}>
        <Link to="/practice/aptitude" className="text-blue-400 text-sm flex items-center gap-1 mb-4 hover:text-blue-300"><ArrowLeft className="w-4 h-4" /> Back to topics</Link>
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  if (finished) {
    // Practice mode: NO scoring, NO result calculation. Just restart or leave.
    return (
      <div className={PAGE_CONTAINER}>
        <div className="max-w-xl mx-auto text-center bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <ListOrdered className="w-12 h-12 mx-auto mb-3 text-purple-400" />
          <h1 className="text-2xl font-bold text-white mb-1">Practice set done!</h1>
          <p className="text-gray-400 mb-6">You've gone through this set. Jump to Mock Tests when you're ready to track a score.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => { setIdx(0); setAnswers({}); setSolutions({}); setFinished(false); }} className={BUTTON_CLASSES.secondary}>
              <RotateCcw className="w-4 h-4" /> Practice again
            </button>
            <button onClick={() => navigate('/practice/aptitude')} className={BUTTON_CLASSES.primary}>
              <ListOrdered className="w-4 h-4" /> More topics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE_CONTAINER}>
      <div className="flex items-center justify-between mb-4">
        <Link to="/practice/aptitude" className="text-blue-400 text-sm flex items-center gap-1 hover:text-blue-300"><ArrowLeft className="w-4 h-4" /> All topics</Link>
        <span className="text-sm text-gray-400">{topicName}</span>
      </div>

      {/* Difficulty tabs: 50 easy / 50 medium / 50 hard per topic */}
      <div className="flex gap-2 mb-6">
        {DIFFS.map((d) => (
          <button
            key={d.key}
            onClick={() => setDifficulty(d.key)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${difficulty === d.key ? d.active : IDLE_TAB}`}
          >
            {d.label} · {counts[d.key] ?? 0}
          </button>
        ))}
      </div>

      <div className="w-full bg-gray-800 rounded-full h-1.5 mb-6 overflow-hidden">
        <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>

      {q && (
        <div className="max-w-2xl mx-auto">
          <QuestionCard
            q={q}
            index={idx}
            total={questions.length}
            selected={answers[q._id]}
            onSelect={handleSelect}
            autoClearMs={18000}
            onAutoClear={clearAnswer}
            correctAnswer={solutions[q._id]?.correctAnswer}
          />
          <div className="flex items-center justify-between mt-4">
            <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className={BUTTON_CLASSES.secondary + ' disabled:opacity-40'}>
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            {idx < questions.length - 1 ? (
              <button onClick={() => setIdx(i => i + 1)} className={BUTTON_CLASSES.primary}>
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setFinished(true)} className={BUTTON_CLASSES.primary}>
                <ListOrdered className="w-4 h-4" /> Finish set
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}