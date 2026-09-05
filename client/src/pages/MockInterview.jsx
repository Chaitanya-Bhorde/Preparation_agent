import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Bot, Mic, MicOff, Volume2, VolumeX, Loader2, Send, CheckCircle, AlertCircle,
  ArrowRight, Award, Brain, RefreshCw, Clock, ChevronRight, X, Search,
  MessageSquare, BarChart3, Target, Lightbulb, BookOpen, Star, TrendingUp,
} from 'lucide-react';
import { PAGE_CONTAINER } from '../utils/ui';
import {
  getInterviewFields, createInterviewSession, getActiveInterviewSession,
  submitInterviewAnswer, completeInterviewSession, abandonInterviewSession,
  getInterviewReport,
} from '../api';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';

// ─── Helpers ────────────────────────────────────────────────────────────────

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function scoreColor(score) {
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-emerald-400';
  if (score >= 4) return 'text-yellow-400';
  if (score >= 2) return 'text-orange-400';
  return 'text-red-400';
}

function scoreBg(score) {
  if (score >= 8) return 'bg-green-900/30 border-green-800';
  if (score >= 6) return 'bg-emerald-900/30 border-emerald-800';
  if (score >= 4) return 'bg-yellow-900/30 border-yellow-800';
  if (score >= 2) return 'bg-orange-900/30 border-orange-800';
  return 'bg-red-900/30 border-red-800';
}

function verdictLabel(verdict) {
  if (!verdict) return 'Not evaluated';
  const map = { correct: 'Correct', partially_correct: 'Partially Correct', incorrect: 'Incorrect' };
  return map[verdict] || verdict;
}


// ─── Topic Selector ─────────────────────────────────────────────────────────

function TopicSelector({ categories, selected, onChange, disabled }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(() => categories.map((c) => c.id));

  const toggleCategory = (id) => {
    setExpanded((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleField = (fieldId) => {
    if (disabled) return;
    const next = selected.includes(fieldId)
      ? selected.filter((f) => f !== fieldId)
      : [...selected, fieldId];
    onChange(next);
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return categories;
    const q = query.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        fields: cat.fields.filter(
          (f) => f.label.toLowerCase().includes(q) || f.id.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.fields.length > 0);
  }, [categories, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics..."
          disabled={disabled}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
        {filtered.map((cat) => {
          const isOpen = expanded.includes(cat.id);
          return (
            <div key={cat.id}>
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
              >
                <ChevronRight className={classNames('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-90')} />
                {cat.label}
                <span className="ml-auto text-xs text-gray-500">
                  {cat.fields.filter((f) => selected.includes(f.id)).length}/{cat.fields.length}
                </span>
              </button>
              {isOpen && (
                <div className="ml-4 grid grid-cols-2 gap-1">
                  {cat.fields.map((field) => {
                    const isSelected = selected.includes(field.id);
                    return (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => toggleField(field.id)}
                        disabled={disabled}
                        className={classNames(
                          'text-left px-2 py-1.5 rounded text-xs transition-colors',
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white',
                          disabled && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {field.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Setup Screen ───────────────────────────────────────────────────────────

function SetupScreen({ onStart }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [experienceLevel, setExperienceLevel] = useState('fresher');
  const [mode, setMode] = useState('text');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getInterviewFields()
      .then((res) => setConfig(res.data.data))
      .catch(() => setError('Failed to load interview configuration. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (selectedTopics.length === 0) {
      setError('Please select at least one topic.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await createInterviewSession({
        topics: selectedTopics,
        difficulty,
        experienceLevel,
        mode,
        totalQuestions,
      });
      onStart(data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start the interview. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-800 rounded-full px-4 py-1.5 mb-4">
          <Brain className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-300">AI-Powered</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">AI Mock Interview</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Practice realistic technical interviews with an AI interviewer. Select your topics, choose a mode, and get personalized feedback.
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Interview Mode */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          Interview Mode
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {config?.modes?.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={classNames(
                'p-4 rounded-lg border text-left transition-all',
                mode === m
                  ? 'bg-blue-600/20 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              )}
            >
              <div className="font-medium capitalize">{m} Interview</div>
              <div className="text-xs mt-1 text-gray-500">
                {m === 'text' ? 'Type your answers' : 'Speak your answers aloud'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Topics */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Select Topics
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Choose one or more topics. The AI will only ask questions about your selected topics.
        </p>
        {config?.categories && (
          <TopicSelector
            categories={config.categories}
            selected={selectedTopics}
            onChange={setSelectedTopics}
          />
        )}
        {selectedTopics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {selectedTopics.map((tid) => {
              const label = config?.categories
                ?.flatMap((c) => c.fields)
                .find((f) => f.id === tid)?.label || tid;
              return (
                <span key={tid} className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-300 text-xs px-2 py-1 rounded">
                  {label}
                  <button onClick={() => setSelectedTopics((p) => p.filter((x) => x !== tid))} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Difficulty & Experience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-yellow-400" />
            Difficulty
          </h2>
          <div className="space-y-2">
            {config?.difficulties?.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={classNames(
                  'w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors',
                  difficulty === d
                    ? 'bg-blue-600/20 border border-blue-500 text-white'
                    : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Experience Level
          </h2>
          <div className="space-y-2">
            {config?.experienceLevels?.map((l) => (
              <button
                key={l}
                onClick={() => setExperienceLevel(l)}
                className={classNames(
                  'w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors',
                  experienceLevel === l
                    ? 'bg-blue-600/20 border border-blue-500 text-white'
                    : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600'
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Number of Questions */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          Number of Questions
        </h2>
        <div className="flex gap-3">
          {config?.questionCounts?.map((c) => (
            <button
              key={c}
              onClick={() => setTotalQuestions(c)}
              className={classNames(
                'flex-1 py-3 rounded-lg text-sm font-medium transition-colors',
                totalQuestions === c
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}

      <button
        onClick={handleSubmit}
        disabled={submitting || selectedTopics.length === 0}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        {submitting ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Starting...</>
        ) : (
          <>Start Interview <ArrowRight className="w-5 h-5" /></>
        )}
      </button>
    </div>
  );
}

// ─── Interview Session ──────────────────────────────────────────────────────

function InterviewSession({ sessionData, onComplete, onAbandon }) {
  const { sessionId, mode, totalQuestions } = sessionData;

  const [question, setQuestion] = useState(sessionData.question);
  const [nextQuestion, setNextQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const stt = useSpeechRecognition();
  const tts = useSpeechSynthesis();

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (mode === 'voice' && question?.text && tts.isSupported) {
      tts.speak(question.text);
    }
  }, [question, mode, tts]);

  useEffect(() => {
    return () => { tts.cancel(); stt.stop(); };
  }, [tts, stt]);

  const handleSubmit = async () => {
    const text = mode === 'voice'
      ? (stt.transcript + (stt.interimTranscript ? ' ' + stt.interimTranscript : '')).trim()
      : answer.trim();

    if (!text) {
      setError('Please provide an answer before submitting.');
      return;
    }
    if (loading) return;

    setError(null);
    setLoading(true);
    stt.stop();

    try {
      const { data } = await submitInterviewAnswer(sessionId, {
        answer: text,
        answerType: mode === 'voice' ? 'voice' : 'text',
        transcript: mode === 'voice' ? stt.transcript : undefined,
      });

      setFeedback(data.data.evaluation);
      setSubmitted(true);

      if (data.data.isComplete) {
        setIsComplete(true);
        setTimeout(() => onComplete(sessionId), 2000);
      } else {
        setNextQuestion(data.data.nextQuestion);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit answer. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (isComplete || currentIndex >= totalQuestions) {
      onComplete(sessionId);
      return;
    }
    setQuestion(nextQuestion);
    setNextQuestion(null);
    setFeedback(null);
    setSubmitted(false);
    setAnswer('');
    stt.reset();
    setCurrentIndex((i) => i + 1);
  };

  const handleAbandon = async () => {
    try { await abandonInterviewSession(sessionId); } catch (_) { /* ignore */ }
    onAbandon();
  };

  if (isComplete) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/30 border border-green-700 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Interview Complete!</h2>
        <p className="text-gray-400">Generating your report...</p>
        <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto mt-4" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-white font-mono">{formatTime(elapsed)}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
            <span className="text-sm text-gray-400">Question</span>
            <span className="text-sm text-white font-semibold">{currentIndex}/{totalQuestions}</span>
          </div>
          {question?.topic && (
            <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded">{question.topic}</span>
          )}
        </div>
        <button onClick={handleAbandon} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
          End Interview
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: (currentIndex / totalQuestions * 100) + '%' }}
        />
      </div>

      {/* Question card */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-600/20 border border-blue-700 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-400 mb-1">AI Interviewer</h3>
            {question?.text ? (
              <p className="text-white text-lg leading-relaxed">{question.text}</p>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-gray-400">Preparing question...</span>
              </div>
            )}
          </div>
        </div>

        {mode === 'voice' && (
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => stt.isListening ? stt.stop() : stt.start()}
              disabled={submitted || loading}
              className={classNames(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                stt.isListening ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
                (submitted || loading) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {stt.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {stt.isListening ? 'Stop Recording' : 'Start Recording'}
            </button>
            <button
              onClick={() => tts.isSpeaking ? tts.cancel() : tts.speak(question?.text)}
              className={classNames(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                tts.isSpeaking ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              )}
            >
              {tts.isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {tts.isSpeaking ? 'Stop' : 'Read Aloud'}
            </button>
            {stt.isListening && (
              <span className="flex items-center gap-1.5 text-xs text-red-400">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Listening...
              </span>
            )}
          </div>
        )}
      </div>

      {/* Answer area */}
      {mode === 'voice' ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Your Answer (Voice)</h3>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-h-[100px] text-white text-sm">
            {stt.transcript}
            {stt.interimTranscript && <span className="text-gray-500">{stt.interimTranscript}</span>}
            {!stt.transcript && !stt.interimTranscript && !stt.isListening && (
              <span className="text-gray-600">Click "Start Recording" to begin...</span>
            )}
          </div>
          {stt.error && <p className="text-xs text-red-400 mt-2">{stt.error}</p>}
          {!stt.isSupported && (
            <p className="text-xs text-yellow-400 mt-2">
              Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Your Answer</h3>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            disabled={submitted || loading}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-white text-sm min-h-[120px] focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Submit / Next */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={loading || (mode === 'voice' ? !stt.transcript.trim() : !answer.trim())}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</>
          ) : (
            <><Send className="w-4 h-4" /> Submit Answer</>
          )}
        </button>
      ) : (
        <button
          onClick={handleNext}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          {currentIndex >= totalQuestions ? (
            <><Award className="w-4 h-4" /> View Report</>
          ) : (
            <>Next Question <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      )}

      {/* Feedback */}
      {feedback && !isComplete && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Feedback</h3>
          <div className="flex items-center gap-4 mb-3">
            <div className={classNames('text-2xl font-bold', scoreColor(feedback.overall))}>
              {feedback.overall}/10
            </div>
            <span className={classNames('text-xs px-2 py-1 rounded capitalize', verdictColor(feedback.verdict))}>
              {verdictLabel(feedback.verdict)}
            </span>
          </div>
          {feedback.feedback && (
            <p className="text-sm text-gray-300">{feedback.feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Report Screen ──────────────────────────────────────────────────────────

function ReportScreen({ sessionId, onRestart }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getInterviewReport(sessionId)
      .then((res) => setReport(res.data.data))
      .catch(() => setError('Failed to load report.'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-gray-400">{error || 'Report not available.'}</p>
        <button onClick={onRestart} className="mt-4 text-blue-400 hover:text-blue-300 text-sm">
          Start New Interview
        </button>
      </div>
    );
  }

  const { session, report: reportData, questions } = report;
  const overallScore = reportData?.overallScore ?? null;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/30 border border-green-700 rounded-full mb-4">
          <Award className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Interview Report</h1>
        <p className="text-gray-400">
          {session?.topics?.join(' \u2022 ')} \u2022 <span className="capitalize">{session?.difficulty}</span>
        </p>
      </div>

      {overallScore != null && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
          <div className="text-sm text-gray-400 mb-2">Overall Score</div>
          <div className={classNames('text-6xl font-bold mb-2', scoreColor(overallScore / 10))}>
            {overallScore}<span className="text-2xl text-gray-500">/100</span>
          </div>
          {reportData?.summary && (
            <p className="text-gray-400 max-w-2xl mx-auto">{reportData.summary}</p>
          )}
        </div>
      )}

      {reportData?.topicPerformance && Object.keys(reportData.topicPerformance).length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Topic Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(reportData.topicPerformance).map(([topic, score]) => (
              <div key={topic} className={classNames('rounded-lg border p-3', scoreBg(score * 10))}>
                <div className="text-xs text-gray-400">{topic}</div>
                <div className={classNames('text-lg font-bold', scoreColor(score))}>{score}/10</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportData?.skills && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportData.skills.technical && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Technical Skills
              </h2>
              <div className="space-y-2">
                {Object.entries(reportData.skills.technical).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className={classNames('text-sm font-semibold', scoreColor(val))}>{val}/10</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {reportData.skills.communication && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                Communication
              </h2>
              <div className="space-y-2">
                {Object.entries(reportData.skills.communication).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className={classNames('text-sm font-semibold', scoreColor(val))}>{val}/10</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          Question Analysis
        </h2>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Q{i + 1}</span>
                  <p className="text-sm text-white font-medium">{q.question}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {q.topic && <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded">{q.topic}</span>}
                  <span className={classNames('text-sm font-bold', scoreColor(q.score))}>{q.score ?? '-'}/10</span>
                </div>
              </div>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="text-xs text-gray-500">Your answer:</span>
                  <p className="text-sm text-gray-300 mt-0.5">{q.answer || <span className="text-gray-600 italic">No answer</span>}</p>
                </div>
                {q.expectedAnswer && (
                  <div>
                    <span className="text-xs text-gray-500">Expected answer:</span>
                    <p className="text-sm text-gray-400 mt-0.5">{q.expectedAnswer}</p>
                  </div>
                )}
                {q.missingConcepts?.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500">Missing concepts:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {q.missingConcepts.map((c, j) => (
                        <span key={j} className="text-xs bg-yellow-900/20 text-yellow-300 px-2 py-0.5 rounded">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {q.feedback && (
                  <p className="text-xs text-gray-400 italic mt-1">{q.feedback}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {reportData?.recommendedTopics?.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Recommended Topics to Practice
          </h2>
          <div className="flex flex-wrap gap-2">
            {reportData.recommendedTopics.map((t, i) => (
              <span key={i} className="bg-yellow-900/20 text-yellow-300 text-sm px-3 py-1.5 rounded-lg">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> New Interview
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function MockInterview() {
  const [phase, setPhase] = useState('setup');
  const [sessionData, setSessionData] = useState(null);
  const [reportSessionId, setReportSessionId] = useState(null);
  const [checkingActive, setCheckingActive] = useState(true);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    getActiveInterviewSession()
      .then((res) => {
        if (res.data.data?.hasActiveSession) {
          setActiveSession(res.data.data.session);
        }
      })
      .catch(() => { /* no active session */ })
      .finally(() => setCheckingActive(false));
  }, []);

  const handleStart = (data) => {
    setSessionData(data);
    setPhase('interview');
  };

  const handleComplete = (sessionId) => {
    setReportSessionId(sessionId);
    setPhase('report');
  };

  const handleAbandon = () => {
    setPhase('setup');
    setSessionData(null);
    setActiveSession(null);
  };

  const handleResume = () => {
    if (activeSession) {
      setSessionData({
        sessionId: activeSession._id,
        mode: activeSession.mode,
        totalQuestions: activeSession.totalQuestions,
        question: activeSession.currentQuestion,
      });
      setPhase('interview');
    }
  };

  const handleRestart = () => {
    setPhase('setup');
    setSessionData(null);
    setReportSessionId(null);
    setActiveSession(null);
  };

  if (checkingActive) {
    return (
      <div className={PAGE_CONTAINER}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE_CONTAINER}>
      {activeSession && phase === 'setup' && (
        <div className="mb-6 bg-blue-900/20 border border-blue-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-300 font-medium">You have an incomplete interview</p>
            <p className="text-xs text-gray-400">
              {activeSession.topics?.join(', ')} \u2022 {activeSession.totalQuestions} questions
            </p>
          </div>
          <button
            onClick={handleResume}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Resume
          </button>
        </div>
      )}

      {phase === 'setup' && <SetupScreen onStart={handleStart} />}
      {phase === 'interview' && sessionData && (
        <InterviewSession
          sessionData={sessionData}
          onComplete={handleComplete}
          onAbandon={handleAbandon}
        />
      )}
      {phase === 'report' && reportSessionId && (
        <ReportScreen sessionId={reportSessionId} onRestart={handleRestart} />
      )}
    </div>
  );
}







