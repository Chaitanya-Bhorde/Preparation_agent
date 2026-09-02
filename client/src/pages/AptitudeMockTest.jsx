import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Trophy, Clock, RotateCcw, TimerReset, Eye, EyeOff } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { PAGE_CONTAINER, LOADING_SPINNER, BUTTON_CLASSES } from '../utils/ui';
import { generateAptitudeMock, submitAptitudeMock, getAptitudeResults } from '../api';
import MockResultView from '../components/aptitude/MockResultView';

// Live countdown chip for the mock test header. Turns amber/red as time runs low.
function TimerChip({ seconds, visible, onToggle }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const danger = seconds <= 60;
  const warn = seconds <= 300;
  const color = danger ? 'bg-red-900/40 border-red-500/60 text-red-300'
    : warn ? 'bg-amber-900/30 border-amber-500/50 text-amber-300'
    : 'bg-gray-800/70 border-gray-600 text-green-300';
  return (
    <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-mono ${color}`}>
      <Clock className="w-3.5 h-3.5" />
      {visible ? `${m}:${String(s).padStart(2, '0')}` : '--:--'}
      <button onClick={onToggle} title={visible ? 'Hide timer' : 'Show timer'} className="ml-1 opacity-60 hover:opacity-100">
        {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

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
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerVisible, setTimerVisible] = useState(true);
  const submittedRef = useRef(false);

  const isGenerate = mockTestId === 'generate' || !mockTestId;
  const category = searchParams.get('category') || 'full';

  // Reset submitted-flag on every new paper / fresh mount.
  useEffect(() => { submittedRef.current = false; }, [isGenerate, mockTestId]);

  const startFreshPaper = useCallback(async () => {
    setPhase('loading');
    setError(null);
    setResult(null);
    setDetails(null);
    setAnswers({});
    submittedRef.current = false;
    try {
      const res = await generateAptitudeMock(category);
      setMockTest(res.data.mock);
      setQuestions(res.data.questions || []);
      setTimeLeft((res.data.mock && res.data.mock.duration ? res.data.mock.duration : 30) * 60);
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
          setTimeLeft((res.data.mock && res.data.mock.duration ? res.data.mock.duration : 30) * 60);
          setPhase('running');
        } else {
          const { getAptitudeMockQuestions } = await import('../api');
          const res = await getAptitudeMockQuestions(mockTestId);
          if (!live) return;
          setMockTest(res.data.mock || null);
          setQuestions(res.data.questions || []);
          setTimeLeft((res.data.mock && res.data.mock.duration ? res.data.mock.duration : 30) * 60);
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

  // Live countdown while the test is running. Auto-submits when it hits 0.
  const handleSubmitRef = useRef(null);
  handleSubmitRef.current = handleSubmit;
  useEffect(() => {
    if (phase !== 'running') return undefined;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (!submittedRef.current) {
            submittedRef.current = true;
            // fire-and-forget auto submit on timeout
            handleSubmitRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

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
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <Link to="/practice/aptitude" className="text-blue-400 text-sm flex items-center gap-1 hover:text-blue-300"><ArrowLeft className="w-4 h-4" /> Exit test</Link>
        <div className="flex items-center gap-3">
          {mockTest && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <TimerReset className="w-3.5 h-3.5" /> {mockTest.duration} min
            </span>
          )}
          <TimerChip seconds={timeLeft} visible={timerVisible} onToggle={() => setTimerVisible(v => !v)} />
          <span className="text-xs text-gray-400">answered {answeredCount}/{questions.length}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {questions.map((q, i) => {
          const labels = ['A', 'B', 'C', 'D'];
          const sel = answers[q._id];
          const qText = q.questionText && String(q.questionText).trim() && q.questionText !== 'undefined' ? q.questionText : 'Question text is being updated — please try the next question.';
          return (
            <div key={q._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-gray-500">Question {i + 1} of {questions.length}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${q.difficulty === 'easy' ? 'text-green-400 bg-green-900/30' : q.difficulty === 'hard' ? 'text-red-400 bg-red-900/30' : 'text-yellow-400 bg-yellow-900/30'}`}>
                  {q.difficulty}
                </span>
              </div>
              <p className="text-white whitespace-pre-line mb-3">{qText}</p>
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