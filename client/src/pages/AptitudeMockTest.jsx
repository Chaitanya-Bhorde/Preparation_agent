import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Trophy, Clock } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { PAGE_CONTAINER, LOADING_SPINNER, BUTTON_CLASSES } from '../utils/ui';
import { getAptitudeMockQuestions, submitAptitudeMock, getAptitudeResults } from '../api';
import MockResultView from '../components/aptitude/MockResultView';

export default function AptitudeMockTest() {
  usePageTitle('Mock Test');
  const { mockTestId } = useParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('loading');
  const [meta, setMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await getAptitudeMockQuestions(mockTestId);
        if (!live) return;
        setQuestions(res.data.questions || []);
        setMeta(res.data.mock || null);
        setPhase('running');
      } catch (e) {
        if (live) setError(e.response?.data?.error || 'Failed to load mock test.');
      }
    })();
    return () => { live = false; };
  }, [mockTestId]);

  const pick = useCallback((qid, label) => setAnswers(prev => ({ ...prev, [qid]: label })), []);

  const handleSubmit = useCallback(async () => {
    setPhase('submitting');
    try {
      const payload = {
        mockTestId,
        answers: questions.map(q => ({ questionId: q._id, selectedAnswer: answers[q._id] || 'Z', timeTaken: 20 })),
      };
      const r = await submitAptitudeMock(payload);
      setResult(r.data);
      try {
        const d = await getAptitudeResults(r.data.submissionId);
        setDetails(d.data.submission);
      } catch (e) { /* solutions optional */ }
      setPhase('result');
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Submit failed.');
      setPhase('running');
    }
  }, [mockTestId, questions, answers]);

  if (phase === 'loading') return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  if (phase === 'submitting') return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /><p className="text-gray-400 mt-3">Grading your test...</p></div>;

  if (error && phase === 'running') {
    return (
      <div className={PAGE_CONTAINER}>
        <Link to="/practice/aptitude" className="text-blue-400 text-sm flex items-center gap-1 mb-4 hover:text-blue-300"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  if (phase === 'result' && result) {
    return <MockResultView mockName={meta ? meta.name : 'Mock Test'} result={result} details={details} onBack={() => navigate('/practice/aptitude')} />;
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className={PAGE_CONTAINER}>
      <div className="flex items-center justify-between mb-4">
        <Link to="/practice/aptitude" className="text-blue-400 text-sm flex items-center gap-1 hover:text-blue-300"><ArrowLeft className="w-4 h-4" /> Exit test</Link>
        <span className="flex items-center gap-1.5 text-sm text-gray-400">
          <Clock className="w-4 h-4" /> {meta ? `${meta.duration} min` : ''} · answered {answeredCount}/{questions.length}
        </span>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {questions.map((q, i) => {
          const labels = ['A', 'B', 'C', 'D'];
          const sel = answers[q._id];
          return (
            <div key={q._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-2">Question {i + 1} of {questions.length}</p>
              <p className="text-white whitespace-pre-line mb-3">{q.questionText}</p>
              <div className="space-y-2">
                {(q.options || []).map((opt, oi) => {
                  const label = opt.label || labels[oi];
                  const active = sel === label;
                  return (
                    <button key={label} onClick={() => pick(q._id, label)} className={`w-full flex items-start gap-3 text-left px-4 py-2.5 rounded-lg border transition-all ${active ? 'border-blue-500/70 bg-blue-900/20' : 'border-gray-700 hover:border-gray-500 bg-gray-800/40'}`}>
                      <span className="text-sm font-semibold text-gray-400 shrink-0 w-5">{label}.</span>
                      <span className="text-sm text-gray-200 flex-1">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="sticky bottom-4 flex justify-center">
          <button onClick={handleSubmit} disabled={answeredCount === 0} className={BUTTON_CLASSES.primary + ' shadow-xl'}>
            <Trophy className="w-4 h-4" /> Submit test ({answeredCount}/{questions.length})
          </button>
        </div>
      </div>
    </div>
  );
}