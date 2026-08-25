import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Trophy, RotateCcw, ListOrdered } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { PAGE_CONTAINER, LOADING_SPINNER, BUTTON_CLASSES } from '../utils/ui';
import { getAptitudeQuestions, submitAptitudeAnswer } from '../api';
import QuestionCard from '../components/aptitude/QuestionCard';

export default function AptitudeTopicPractice() {
  usePageTitle('Topic Practice');
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [topicName, setTopicName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  // Cache per-question solution (explanation + steps) returned by submit-answer,
  // since the questions endpoint intentionally hides it until answered.
  const [solutions, setSolutions] = useState({});

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAptitudeQuestions(topicId);
        if (!live) return;
        setQuestions(res.data.questions || []);
        setTopicName(res.data.questions?.[0]?.topic || 'Topic');
      } catch (e) {
        if (live) setError(e.response?.data?.error || 'Failed to load questions.');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [topicId]);

  const handleSelect = useCallback(async (label) => {
    const q = questions[idx];
    if (!q || answers[q._id] !== undefined) return;
    setAnswers(prev => ({ ...prev, [q._id]: label }));
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  }, [questions, idx, answers]);

  const correctCount = questions.filter(q => answers[q._id] === q.correctAnswer).length;
  const answeredCount = Object.keys(answers).length;
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
    const pct = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
    return (
      <div className={PAGE_CONTAINER}>
        <div className="max-w-xl mx-auto text-center bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <Trophy className={`w-12 h-12 mx-auto mb-3 ${pct >= 70 ? 'text-yellow-400' : pct >= 40 ? 'text-orange-400' : 'text-gray-500'}`} />
          <h1 className="text-2xl font-bold text-white mb-1">{topicName} — Session complete!</h1>
          <p className="text-gray-400 mb-4">You answered {correctCount}/{questions.length} correctly ({pct}%).</p>
          <div className="w-full bg-gray-800 rounded-full h-3 mb-6 overflow-hidden">
            <div className={`h-full rounded-full ${pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => { setAnswers({}); setIdx(0); setFinished(false); }} className={BUTTON_CLASSES.secondary}>
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
        <span className="text-sm text-gray-400">{topicName} · answered {answeredCount}/{questions.length} · correct {correctCount}</span>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2 mb-6 overflow-hidden">
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
          />
          <div className="flex items-center justify-between mt-4">
            <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className={BUTTON_CLASSES.secondary + ' disabled:opacity-40'}>
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            {saving && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
            {idx < questions.length - 1 ? (
              <button onClick={() => setIdx(i => i + 1)} className={BUTTON_CLASSES.primary}>
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setFinished(true)} className={BUTTON_CLASSES.primary}>
                <Trophy className="w-4 h-4" /> Finish
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}