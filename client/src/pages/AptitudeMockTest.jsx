import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Trophy, Clock, RotateCcw } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { PAGE_CONTAINER, LOADING_SPINNER, BUTTON_CLASSES } from '../utils/ui';
import { generateAptitudeMock, submitAptitudeMock, getAptitudeResults } from '../api';
import MockResultView from '../components/aptitude/MockResultView';

export default function AptitudeMockTest() {
  usePageTitle('Mock Test');
  const { mockTestId } = useParams(); // 'generate' arrives from the grid
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('loading');
  const [mockTest, setMockTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [details, setDetails] = useState(null);

  const isGenerate = mockTestId === 'generate' || !mockTestId;
  const category = searchParams.get('category') || 'full';

  const startFreshPaper = useCallback(async () => {
    setPhase('loading');
    setError(null);
    setResult(null);
    setDetails(null);
    setAnswers({});
    try {
      const res = await generateAptitudeMock(category);
      setMockTest(res.data.mock);
      setQuestions(res.data.questions || []);
      setPhase('running');
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to create mock test.');
      setPhase('running');
    }
  }, [category]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        if (isGenerate) {
          const res = await generateAptitudeMock(category);
          if (!live) return;
          setMockTest(res.data.mock);
          setQuestions(res.data.questions || []);
          setPhase('running');
        } else {
          const { getAptitudeMockQuestions } = await import('../api');
          const res = await getAptitudeMockQuestions(mockTestId);
          if (!live) return;
          setMockTest(res.data.mock || null);
          setQuestions(res.data.questions || []);
          setPhase('running');
        }
      } catch (e) {
        if (live) setError(e.response?.data?.error || 'Failed to load mock test.');
      }
    })();
    return () => { live = false; };
  }, [isGenerate, mockTestId, category]);

  const pick = useCallback((qid, label) => setAnswers(prev => ({ ...prev, [qid]: label })), []);

  const handleSubmit = useCallback(async () => {
    setPhase('submitting');
    try {
      const payload = {
        mockTestId: isGenerate ? mockTest._id : mockTestId,
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
  }, [isGenerate, mockTest, mockTestId, questions, answers]);

  if (phase === 'loading') return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  if (phase === 'submitting') return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /><p className="text-gray-400 mt-3">Grading your test...</p></div>;

  if (error && phase === 'running') {
    return (
      <div className={PAGE_CONTAINER}>
        <Link to="/practice/aptitude" className="text-blue-400 text-sm flex items-center gap-1 mb-4 hover:text-blue-300"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <p className="text-red-300">{error}</p>
        <button onClick={startFreshPaper} className={BUTTON_CLASSES.primary + ' mt-4'}>
          <RotateCcw className="w-4 h-4" /> Try again
        </button>
      </div>
    );
  }

  if (phase === 'result' && result) {
    return (
      <MockResultView
        mockName={mockTest ? mockTest.name : 'Mock Test'}
        result={result}
        details={details}
        onBack={() => navigate('/practice/aptitude')}
        onResetPaper={startFreshPaper}
      />
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className={PAGE_CONTAINER}>
      <div className="flex items-center justify-between mb-4">
        <Link to="/practice/aptitude" className="text-blue-400 text-sm flex items-center gap-1 hover:text-blue-300"><ArrowLeft className="w-4 h-4" /> Exit test</Link>
        <span className="flex items-center gap-1.5 text-sm text-gray-400">
          <Clock className="w-4 h-4" /> {mockTest ? `${mockTest.duration} min` : ''} · answered {answeredCount}/{questions.length}
        </span>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {questions.map((q, i) => {
          const labels = ['A', 'B', 'C', 'D'];
          const sel = answers[q._id];
          return (
            <div key={q._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-gray-500">Question {i + 1} of {questions.length}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${q.difficulty === 'easy' ? 'text-green-400 bg-green-900/30' : q.difficulty === 'hard' ? 'text-red-400 bg-red-900/30' : 'text-yellow-400 bg-yellow-900/30'}`}>
                  {q.difficulty}
                </span>
              </div>
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

        <div className="sticky bottom-4 flex justify-center gap-3">
          <button onClick={startFreshPaper} className={BUTTON_CLASSES.secondary}>
            <RotateCcw className="w-4 h-4" /> New paper
          </button>
          <button onClick={handleSubmit} disabled={answeredCount === 0} className={BUTTON_CLASSES.primary + ' shadow-xl'}>
            <Trophy className="w-4 h-4" /> Submit test ({answeredCount}/{questions.length})
          </button>
        </div>
      </div>
    </div>
  );
}