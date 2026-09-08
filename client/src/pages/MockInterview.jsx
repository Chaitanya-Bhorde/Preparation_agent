import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Bot, Mic, MicOff, Volume2, VolumeX, Loader2, Send, CheckCircle, AlertCircle,
  ArrowRight, Award, Brain, RefreshCw, Clock, ChevronRight, X, Search,
  MessageSquare, BarChart3, Target, Lightbulb, BookOpen, Star, TrendingUp, Keyboard,
} from 'lucide-react';
import { PAGE_CONTAINER } from '../utils/ui';
import {
  getInterviewFields, createInterviewSession, getActiveInterviewSession,
  getInterviewSession, submitInterviewAnswer, requestNextInterviewQuestion,
  completeInterviewSession, abandonInterviewSession, getInterviewReport,
} from '../api';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import useProctoring from '../hooks/useProctoring';

// --- Helpers ----------------------------------------------------------------

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

function verdictColor(verdict) {
  if (!verdict) return 'bg-gray-800 text-gray-400';
  if (verdict === 'correct') return 'bg-green-900/30 text-green-400';
  if (verdict === 'partially_correct') return 'bg-yellow-900/30 text-yellow-400';
  if (verdict === 'incorrect') return 'bg-red-900/30 text-red-400';
  return 'bg-gray-800 text-gray-400';
}


// --- Dynamic Typing Hook ----------------------------------------------------
// ChatGPT-style character-by-character text reveal. Returns the currently
// visible slice of `text` plus an `isTyping` flag so the UI can disable
// controls while the question is being "typed" by the AI interviewer.

function useDynamicTyping(text, speed = 28) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Reset and start typing whenever the source text changes.
    if (!text) {
      setDisplayedText('');
      setIsTyping(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    let index = 0;

    intervalRef.current = setInterval(() => {
      index++;
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
      } else {
        setIsTyping(false);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, speed]);

  return { displayedText, isTyping };
}

// --- Dynamic Typing Text Component ------------------------------------------
// Renders text with a character-by-character typing animation and a blinking
// cursor while typing. Used for the current interview question.

function DynamicTypingText({ text, speed = 28, className = '' }) {
  const { displayedText, isTyping } = useDynamicTyping(text, speed);

  return (
    <span className={className}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-0.5 h-5 bg-blue-400 ml-0.5 animate-pulse align-middle" />
      )}
    </span>
  );
}

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
              <button type="button"
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
                      <button type="button" key={field.id}
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

// --- Setup Screen -----------------------------------------------------------

function SetupScreen({ onStart, activeState, onResume }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [experienceLevel, setExperienceLevel] = useState('fresher');
  const [mode, setMode] = useState('text');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const [pendingActiveSession, setPendingActiveSession] = useState(
    activeState ? {
      sessionId: activeState.session?.id,
      session: activeState.session,
      nextQuestion: activeState.nextQuestion,
      answeredCount: activeState.answeredCount,
    } : null
  );

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
      setPendingActiveSession(null);
      onStart(data.data);
    } catch (err) {
      const responseData = err.response?.data;
      if (err.response?.status === 409 && responseData?.data?.code === 'ACTIVE_SESSION_EXISTS') {
        const d = responseData.data;
        setPendingActiveSession({
          sessionId: d.existingSessionId || d.session?.id,
          session: d.session,
          nextQuestion: d.nextQuestion,
          answeredCount: d.answeredCount || 0,
        });
        setError(null);
        return;
      }
      const msg = responseData?.message || 'Failed to start the interview. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbandonAndStart = async () => {
    if (!pendingActiveSession?.sessionId) return;
    setAbandoning(true);
    setError(null);
    try {
      await abandonInterviewSession(pendingActiveSession.sessionId);
      setPendingActiveSession(null);
      await handleSubmit();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not abandon the previous session. Please try again.';
      setError(msg);
    } finally {
      setAbandoning(false);
    }
  };

  const handleResumeClick = () => {
    const sessionId = pendingActiveSession?.sessionId || activeState?.session?.id;
    if (sessionId) {
      onResume(sessionId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (pendingActiveSession || activeState) {
    const sess = pendingActiveSession?.session || activeState?.session;
    const answeredCount = pendingActiveSession?.answeredCount ?? activeState?.answeredCount ?? 0;
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-800 rounded-full px-4 py-1.5 mb-4">
            <Brain className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Active Interview Found</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Resume Your Interview?</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            You have an incomplete interview session. Choose how to continue.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Current Session</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Topics:</span>
              <span className="text-white">{sess?.topics?.join(', ') || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Mode:</span>
              <span className="text-white capitalize">{sess?.mode || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Difficulty:</span>
              <span className="text-white capitalize">{sess?.difficulty || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Progress:</span>
              <span className="text-white">{answeredCount}/{sess?.totalQuestions} questions answered</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button type="button" onClick={handleResumeClick}
            className="py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" /> Resume Interview
          </button>
          <button type="button" onClick={handleAbandonAndStart}
            disabled={abandoning || submitting}
            className="py-4 bg-gray-800 border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {abandoning ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Abandoning...</>
            ) : (
              <><RefreshCw className="w-5 h-5" /> Abandon & Start New</>
            )}
          </button>
        </div>
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
            <button type="button" key={m}
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
                  <button type="button" onClick={() => setSelectedTopics((p) => p.filter((x) => x !== tid))} className="hover:text-white">
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
              <button type="button" key={d}
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
              <button type="button" key={l}
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
            <button type="button" key={c}
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

      <button type="button" onClick={handleSubmit}
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

// --- Interview Session ------------------------------------------------------

function InterviewSession({ sessionData, onComplete, onAbandon }) {
  const { sessionId, mode, totalQuestions } = sessionData;

  const [question, setQuestion] = useState(sessionData.question);
  const [questionId, setQuestionId] = useState(sessionData.question?.id || null);
  const [nextQuestion, setNextQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);   // POST /answer in flight
  const [generating, setGenerating] = useState(false);   // POST /next in flight
  const [generationFailed, setGenerationFailed] = useState(false);
  const [conversation, setConversation] = useState(() => {
    // Seed from server-side history when resuming an interview.
    const hist = Array.isArray(sessionData.history) ? sessionData.history : [];
    const turns = [];
    for (const h of hist) {
      if (h.question) turns.push({ role: 'ai', text: h.question, isFollowUp: h.isFollowUp });
      if (h.answer) {
        turns.push({
          role: 'user',
          text: h.answer,
          score: h.score ?? null,
          verdict: h.verdict ?? null,
          feedback: h.feedback ?? null,
        });
      }
    }
    return turns;
  });
  const [feedback, setFeedback] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [completedReport, setCompletedReport] = useState(null);
  const [voiceFallback, setVoiceFallback] = useState(false); // typed answer in voice mode
  const conversationEndRef = useRef(null);

  const stt = useSpeechRecognition();
  const tts = useSpeechSynthesis();
  // Only speak each question ONCE (the `tts` object identity changes every
  // render, so naively depending on it would restart the audio constantly).
  const lastSpokenQuestionRef = useRef(null);

  // Proctoring: camera, face detection, tab switch monitoring
  const proctoring = useProctoring({
    enabled: !!sessionId && !isComplete,
    onViolation: (reason, count) => {
      console.log(`[Proctoring] Warning ${count}/2: ${reason}`);
    },
    onAutoSubmit: (reason) => {
      console.log(`[Proctoring] Auto-submit triggered: ${reason}`);
      autoSubmitDueToProctoring(reason);
    },
  });
  // Diagnostics: last answer-submit request/response for the debug strip.
  const [lastSubmitDiag, setLastSubmitDiag] = useState(null); // { url, status, ok, at }
  const [lastTts, setLastTts] = useState(null); // { text, ok, at } of last TTS call


  // Start camera when interview begins
  useEffect(() => {
    if (sessionId && !isComplete && !proctoring.cameraActive && !proctoring.cameraError) {
      proctoring.startCamera();
    }
  }, [sessionId, isComplete, proctoring.cameraActive, proctoring.cameraError]);

  // Stop camera on completion
  useEffect(() => {
    if (isComplete) {
      proctoring.stopCamera();
    }
  }, [isComplete]);
  // Auto-fallback to typing when speech recognition fails/unsupported (� voice failure handling)
  useEffect(() => {
    if (mode === 'voice' && (stt.error || !stt.isSupported)) setVoiceFallback(true);
  }, [mode, stt.error, stt.isSupported]);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const qid = question?.id;
    if (mode === 'voice' && qid && tts.isSupported && lastSpokenQuestionRef.current !== qid) {
      lastSpokenQuestionRef.current = qid;
      tts.speak(question.text)
        .then(() => setLastTts({ text: question.text, ok: true, at: new Date().toLocaleTimeString() }))
        .catch(() => setLastTts({ text: question.text, ok: false, at: new Date().toLocaleTimeString() }));
    }
  }, [question?.id]);

  useEffect(() => {
    return () => { tts.cancel(); stt.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [conversation.length, submitted]);

  // Log question changes for debugging - tracks AI vs fallback and question progression
  useEffect(() => {
    if (question?.id) {
      console.log('[Interview] Question changed:', {
        sessionId,
        questionId: question.id,
        questionNumber: currentIndex,
        totalQuestions,
        source: question.source,
        isFollowUp: question.isFollowUp,
        text: question.text?.slice(0, 100),
        mode,
      });
    }
  }, [question?.id, currentIndex, mode, sessionId, totalQuestions, question?.source, question?.isFollowUp, question?.text]);


  const autoSubmittedRef = useRef(false);

  // Auto-submit due to proctoring violation (3rd violation)
  const autoSubmitDueToProctoring = useCallback(async (reason) => {
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    console.log('[Interview] Auto-submitting due to proctoring: ' + reason);

    // Stop all media
    proctoring.stopCamera();
    stt.stop();
    tts.cancel();

    try {
      // Submit current answer if there is one
      const currentAnswer = mode === 'voice' && !voiceFallback
        ? (stt.transcript + (stt.interimTranscript ? ' ' + stt.interimTranscript : '')).trim()
        : answer.trim();

      if (currentAnswer && question?.id && !submitting) {
        await submitInterviewAnswer(sessionId, {
          questionId: question.id,
          answer: currentAnswer,
          answerType: mode === 'voice' ? 'voice' : 'text',
          transcript: mode === 'voice' ? stt.transcript : undefined,
          submissionReason: 'PROCTORING_VIOLATION',
        });
      }

      // Complete the session
      const { data } = await completeInterviewSession(sessionId);
      setIsComplete(true);
      setCompletedReport(data.data?.report || null);
      setTimeout(() => onComplete(sessionId), 1500);
    } catch (err) {
      console.error('[Interview] Auto-submit failed:', err);
      setIsComplete(true);
      setTimeout(() => onComplete(sessionId), 1500);
    }
  }, [sessionId, mode, voiceFallback, stt.transcript, stt.interimTranscript, answer, question?.id, submitting, proctoring, stt, tts, onComplete]);
  // Recovery: no question loaded (resumed session with lost generation, or a
  // submit whose next-question generation failed). Ask the backend for the
  // pending/next question. Safe to retry � the backend is idempotent.
  const loadNextQuestion = useCallback(async () => {
    if (generating || isComplete) return;
    setGenerating(true);
    setError(null);
    try {
      const { data } = await requestNextInterviewQuestion(sessionId);
      if (data.data.completed) {
        setIsComplete(true);
        setCompletedReport(data.data.report || null);
        setTimeout(() => onComplete(sessionId), 2000);
      } else if (data.data.nextQuestion) {
        setQuestion(data.data.nextQuestion);
        setQuestionId(data.data.nextQuestion.id || null);
        setGenerationFailed(false);
      } else {
        setGenerationFailed(true);
      }
    } catch (err) {
      setGenerationFailed(true);
      setError(err.response?.data?.message || 'AI interviewer temporarily unavailable. Please retry.');
    } finally {
      setGenerating(false);
    }
  }, [sessionId, generating, isComplete, onComplete]);

  useEffect(() => {
    if (!question && !submitted && !generating && !generationFailed) {
      loadNextQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  const handleSubmit = async () => {
    const text = mode === 'voice' && !voiceFallback
      ? (stt.transcript + (stt.interimTranscript ? ' ' + stt.interimTranscript : '')).trim()
      : answer.trim();

    if (!text) {
      setError('Please provide an answer before submitting.');
      return;
    }
    if (submitting) return; // double-submit guard (� prevent double submission)
    if (!question?.id) {
      setError('Question data is missing. Please retry or resume the interview.');
      return;
    }

    setError(null);
    setSubmitting(true);
    stt.stop();

    try {
      const submitUrl = `/api/interview/sessions/${sessionId}/answer`;
      const { data } = await submitInterviewAnswer(sessionId, {
        questionId: question.id, // always the EXACT currently displayed question
        answer: text,
        answerType: mode === 'voice' ? 'voice' : 'text',
        transcript: mode === 'voice' ? stt.transcript : undefined,
      });
      setLastSubmitDiag({
        url: submitUrl,
        status: '200 OK',
        ok: true,
        at: new Date().toLocaleTimeString(),
        questionId: question.id,
      });

      const evalRes = data.data.evaluation || {};
      setFeedback(evalRes);
      setSubmitted(true);
      // Add the completed exchange to the conversation transcript.
      setConversation((prev) => [
        ...prev,
        { role: 'ai', text: question.text, isFollowUp: question.isFollowUp },
        { role: 'user', text, score: evalRes.overall ?? null, verdict: evalRes.verdict ?? null, feedback: evalRes.feedback ?? null },
      ]);

      // Backend signals interview completion with `completed: true` (report included).
      if (data.data.completed) {
        setIsComplete(true);
        setCompletedReport(data.data.report || null);
        setTimeout(() => onComplete(sessionId), 2000);
      } else if (data.data.generationFailed || !data.data.nextQuestion) {
        // Answer accepted + evaluated, but the next question could not be
        // generated right now. Recoverable via "Retry" (POST /next is
        // idempotent and regenerates from the stored answer/context).
        setNextQuestion(null);
        setGenerationFailed(true);
        if (data.data.message) setError(null);
      } else {
        setNextQuestion(data.data.nextQuestion);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit answer. Please try again.';
      setLastSubmitDiag({
        url: `/api/interview/sessions/${sessionId}/answer`,
        status: String(err.response?.status || 'network-error'),
        ok: false,
        at: new Date().toLocaleTimeString(),
        questionId: question.id,
      });
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    // Completion is driven by the backend (`completed: true` handled in submit).
    // Here we only guard against a missing next question (network hiccup etc.).
    if (isComplete) {
      onComplete(sessionId);
      return;
    }
    // Frontend enforcement: never go beyond selected main question count
    if (currentIndex >= totalQuestions) {
      setIsComplete(true);
      onComplete(sessionId);
      return;
    }
    if (!nextQuestion) {
      setGenerationFailed(true);
      setError('Next question could not be loaded. Please retry.');
      return;
    }
    setQuestion(nextQuestion);
    setQuestionId(nextQuestion.id || null);
    setNextQuestion(null);
    setFeedback(null);
    setSubmitted(false);
    setAnswer('');
    setGenerationFailed(false);
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
        {completedReport?.overallScore != null && (
          <p className="text-white text-lg mb-1">Overall Score: {completedReport.score ?? completedReport.overallScore} / {completedReport.maxScore ?? 10}</p>
        )}
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
        <button type="button" onClick={handleAbandon} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
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


      {/* Proctoring Status Bar */}
      {sessionId && !isComplete && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-24 h-18 bg-black rounded-lg overflow-hidden flex-shrink-0">
                <video
                  ref={proctoring.videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!proctoring.cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <span className="text-xs text-gray-500">No Camera</span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className={proctoring.cameraActive ? 'w-2 h-2 bg-green-500 rounded-full' : 'w-2 h-2 bg-red-500 rounded-full'} />
                  <span className={proctoring.cameraActive ? 'text-green-400' : 'text-red-400'}>
                    {proctoring.cameraActive ? 'Camera Active' : proctoring.cameraError || 'Camera Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Face: {proctoring.faceDetected ? '✓ Detected' : '✗ Not Detected'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Warnings: {proctoring.violationCount}/{proctoring.maxWarnings}</span>
                </div>
              </div>
            </div>
            {proctoring.lastWarning && (
              <div className="flex-1 min-w-[200px]">
                <div className={proctoring.lastWarning.count >= 2 ? 'bg-red-900/30 border border-red-700 rounded-lg p-3' : 'bg-yellow-900/30 border border-yellow-700 rounded-lg p-3'}>
                  <p className={proctoring.lastWarning.count >= 2 ? 'text-red-300 text-sm' : 'text-yellow-300 text-sm'}>
                    ⚠️ {proctoring.lastWarning.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conversation transcript (ChatGPT-like continuity, � conversational UI) */}
      {conversation.length > 0 && (
        <details className="bg-gray-900/60 rounded-xl border border-gray-800">
          <summary className="cursor-pointer px-5 py-3 text-sm text-gray-400 hover:text-white flex items-center gap-2 select-none">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            Conversation so far ({conversation.filter((t) => t.role === 'user').length} answered)
          </summary>
          <div className="px-5 pb-4 space-y-3 max-h-72 overflow-y-auto">
            {conversation.map((turn, i) => (
              turn.role === 'ai' ? (
                <div key={i} className="flex items-start gap-2">
                  <Bot className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-200 leading-relaxed">{turn.text}</p>
                    {turn.isFollowUp && <span className="text-xs text-amber-400/80">follow-up</span>}
                  </div>
                </div>
              ) : (
                <div key={i} className="ml-6 pl-3 border-l-2 border-gray-800">
                  <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{turn.text}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {turn.score != null && (
                      <span className={classNames('text-xs font-semibold', scoreColor(turn.score))}>{turn.score}/2</span>
                    )}
                    {turn.verdict && (
                      <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{verdictLabel(turn.verdict)}</span>
                    )}
                  </div>
                  {turn.feedback && <p className="text-xs text-gray-500 italic mt-1">{turn.feedback}</p>}
                </div>
              )
            ))}
            <div ref={conversationEndRef} />
          </div>
        </details>
      )}

      {/* Question card */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-600/20 border border-blue-700 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-400 mb-1 flex items-center gap-2">
              AI Interviewer
              {question?.source && (
                <span className={classNames(
                  'text-[10px] px-1.5 py-0.5 rounded font-mono uppercase',
                  question.source === 'ai' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-amber-300'
                )}>
                  {question.source === 'ai' ? 'AI-generated' : 'fallback'}
                </span>
              )}
              {question?.isFollowUp && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300">follow-up</span>
              )}
            </h3>
            {question?.text ? (
              mode === 'voice' ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm leading-relaxed">
                  <Volume2 className="w-5 h-5 text-blue-400 animate-pulse" />
                  <span>AI is speaking the question. Listen carefully, then speak or type your answer.</span>
                </div>
              ) : (
                <div className="text-white text-lg leading-relaxed"><DynamicTypingText text={question.text} speed={25} /></div>
              )
            ) : generationFailed ? (
              <p className="text-amber-300 text-sm">Couldn&apos;t generate the next question.</p>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-gray-400">Preparing question...</span>
              </div>
            )}
          </div>
        </div>

        {/* Voice controls: TTS + Recording */}
        {mode === 'voice' && (
          <div className="space-y-3 mt-4">
            {/* TTS Speak Button - Primary action in voice mode */}
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => {
                if (tts.isSpeaking) {
                  tts.cancel();
                } else {
                  // Speak the current question - triggered by user click (no autoplay policy issue)
                  tts.speak(question?.text)
                    .then(() => setLastTts({ text: question?.text, ok: true, at: new Date().toLocaleTimeString() }))
                    .catch((err) => {
                      console.error('[TTS] Speech failed:', err);
                      setLastTts({ text: question?.text, ok: false, at: new Date().toLocaleTimeString() });
                    });
                }
              }}
                className={classNames(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  tts.isSpeaking
                    ? 'bg-blue-600 text-white animate-pulse'
                    : 'bg-blue-600/20 text-blue-300 border border-blue-700 hover:bg-blue-600/30'
                )}
              >
                {tts.isSpeaking ? (
                  <><VolumeX className="w-4 h-4" /> Speaking... (click to stop)</>
                ) : (
                  <><Volume2 className="w-4 h-4" /> 🔊 Listen to Question</>
                )}
              </button>
            </div>

            {/* Recording controls */}
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => stt.isListening ? stt.stop() : stt.start()}
                disabled={submitted || submitting}
                className={classNames(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  stt.isListening ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
                  (submitted || submitting) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {stt.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {stt.isListening ? 'Stop Recording' : 'Start Recording'}
              </button>
              {stt.isListening && (
                <span className="flex items-center gap-1.5 text-xs text-red-400">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Listening...
                </span>
              )}
              {tts.isSupported && (
                <span className="text-xs text-gray-500 ml-auto">
                  TTS: {tts.isSupported ? '? supported' : '? unavailable'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Answer area */}
      {mode === 'voice' ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Your Answer (Voice)</h3>
            <button type="button" onClick={() => setVoiceFallback((v) => !v)}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
              disabled={submitted || submitting}
            >
              {voiceFallback ? <Mic className="w-3.5 h-3.5" /> : <Keyboard className="w-3.5 h-3.5" />}
              {voiceFallback ? 'Use microphone instead' : 'Voice unavailable? Type instead'}
            </button>
          </div>
          {voiceFallback ? (
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Voice input unavailable or inconvenient � type your answer here..."
              disabled={submitted || submitting}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-white text-sm min-h-[120px] focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
            />
          ) : (
            <>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-h-[100px] text-white text-sm">
                {stt.transcript}
                {stt.interimTranscript && <span className="text-gray-500">{stt.interimTranscript}</span>}
                {!stt.transcript && !stt.interimTranscript && !stt.isListening && (
                  <span className="text-gray-600">Click &quot;Start Recording&quot; to begin...</span>
                )}
              </div>
              {stt.error && (
                <div className="text-xs text-red-400 mt-2">
                  <p>{stt.error}</p>
                  <button type="button" onClick={() => setVoiceFallback(true)} className="underline hover:text-red-300 mt-1">
                    Type your answer instead
                  </button>
                </div>
              )}
              {!stt.isSupported && (
                <p className="text-xs text-yellow-400 mt-2">
                  Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari � or type your answer above.
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Your Answer</h3>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            disabled={submitted || submitting}
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

      {generationFailed && submitted && !error && (
        <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">
            Your answer was saved and evaluated. The next question could not be generated right now � click Retry. Nothing is lost; the retry resumes from your stored answer.
          </p>
        </div>
      )}

      {/* Submit / Next */}
      {!submitted ? (
        <button type="button" onClick={handleSubmit}
          disabled={submitting || (mode === 'voice' && !voiceFallback ? !stt.transcript.trim() : !answer.trim())}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating your answer &amp; preparing the next question...</>
          ) : (
            <><Send className="w-4 h-4" /> Submit Answer</>
          )}
        </button>
      ) : generationFailed ? (
        <button type="button" onClick={loadNextQuestion}
          disabled={generating}
          className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating next question...</>
          ) : (
            <><RefreshCw className="w-4 h-4" /> Retry</>
          )}
        </button>
      ) : (
        <button type="button" onClick={handleNext}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <>Next Question <ArrowRight className="w-4 h-4" /></>
        </button>
      )}

      {/* Feedback */}
      {feedback && !isComplete && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Feedback</h3>
          <div className="flex items-center gap-4 mb-3">
            <div className={classNames('text-2xl font-bold', scoreColor(feedback.overall))}>
              {feedback.marks ?? feedback.overall}/{feedback.maxMarks ?? 2}
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

      {/* Diagnostics strip � session/question IDs, question source, submit
          request+response, TTS invocation. Collapsible; useful for verifying
          that questions are LLM-generated (source=ai) and voice speaks them. */}
      <details className="bg-gray-950 border border-gray-800 rounded-lg px-4 py-2">
        <summary className="cursor-pointer text-xs text-gray-500 hover:text-white select-none">
          Diagnostics (session / question / source / API / TTS)
        </summary>
        <div className="space-y-1.5 mt-2 text-[11px] font-mono text-gray-500">
          <div>sessionId = {sessionId}</div>
          <div>questionId = {question?.id ?? 'n/a'}</div>
          <div>questionNumber = {currentIndex} / {totalQuestions}</div>
          <div>questionSource = <span className={question?.source === 'ai' ? 'text-green-400' : 'text-amber-400'}>{question?.source ?? 'n/a'}</span> (ai = LLM-generated, fallback = static bank)</div>
          <div>questionFollowUp = {question?.isFollowUp ? 'true' : 'false'}</div>
          <div>questionText = {question?.question ? `"${String(question.question).slice(0, 80)}..."` : 'n/a'}</div>
          <div>evaluator = {feedback?.evaluator ? feedback.evaluator : 'ai unless degraded'}</div>
          <div>lastSubmitUrl = {lastSubmitDiag?.url ?? 'n/a'}</div>
          <div>lastSubmitStatus = {lastSubmitDiag ? `${lastSubmitDiag.status}${lastSubmitDiag.ok ? '' : ' (error shown above)'} @ ${lastSubmitDiag.at}` : 'n/a'}</div>
          <div>ttsSupported = {tts.isSupported ? 'true' : 'false'}</div>
          <div>ttsSpeaking = {tts.isSpeaking ? 'true' : 'false'}</div>
          <div>lastTts = {lastTts ? `${lastTts.ok ? '? spoken' : '? failed'} ('${String(lastTts.text).slice(0, 50)}...') @ ${lastTts.at}` : 'n/a'}</div>
          <div>mode = {mode}</div>
          <div>conversationLength = {conversation.length} turns</div>
        </div>
      </details>
    </div>
  );
}

// --- Report Screen ----------------------------------------------------------

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
        <button type="button" onClick={onRestart} className="mt-4 text-blue-400 hover:text-blue-300 text-sm">
          Start New Interview
        </button>
      </div>
    );
  }

  const { session, report: reportData, questions } = report;
  const overallScore = reportData?.overallScore ?? null;
  const score = reportData?.score ?? null;
  const maxScore = reportData?.maxScore ?? (session?.totalQuestions ? session.totalQuestions * 2 : 10);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/30 border border-green-700 rounded-full mb-4">
          <Award className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Interview Report</h1>
        <p className="text-gray-400">
          {session?.topics?.join(' � ')} � <span className="capitalize">{session?.difficulty}</span>
        </p>
      </div>

      {score != null && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
          <div className="text-sm text-gray-400 mb-2">Overall Score</div>
          <div className={classNames('text-6xl font-bold mb-2', scoreColor(score / maxScore * 10))}>
            {score}<span className="text-2xl text-gray-500">/{maxScore}</span>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm">
            <span className="text-green-400">✓ {reportData?.stats?.fullCount ?? 0} correct</span>
            <span className="text-yellow-400">◐ {reportData?.stats?.partialCount ?? 0} partial</span>
            <span className="text-red-400">✗ {reportData?.stats?.incorrectCount ?? 0} incorrect</span>
          </div>
          {reportData?.communication?.confidenceIndicator && reportData.communication.confidenceIndicator !== 'not_available' && (
            <p className="text-sm text-gray-500 capitalize mb-2">Confidence: {reportData.communication.confidenceIndicator}</p>
          )}
          {reportData?.assessment && (
            <p className="text-gray-400 max-w-2xl mx-auto">{reportData.assessment}</p>
          )}
        </div>
      )}

      {/* Interview activity stats (deterministic � from actual interview data) */}
      {reportData?.stats && (
        <div className="space-y-3">
          {/* Selected count indicator */}
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 text-center">
            <span className="text-blue-300 text-sm">
              Interview Length: <strong>{reportData.stats.selectedQuestionCount}</strong> main questions selected
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Main Questions', value: reportData.stats.questionsAsked, sub: 'selected count' },
              { label: 'Answered', value: reportData.stats.questionsAnswered, sub: 'main questions' },
              { label: 'Follow-ups', value: reportData.stats.followUpCount, sub: 'adaptive probes' },
              { label: 'Mistakes Found', value: reportData.stats.mistakesCount, sub: 'from main answers' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
                <div className="text-2xl font-bold text-white">{s.value ?? 0}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                <div className="text-xs text-gray-600">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportData?.topicPerformance && Array.isArray(reportData.topicPerformance) && reportData.topicPerformance.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Topic Performance
          </h2>
          <div className="space-y-3 mb-4">
            {reportData.topicPerformance.map((tp) => {
              const pct = Math.min(100, Math.max(0, (tp.averageScore / 10) * 100));
              const barColor = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-emerald-500' : pct >= 40 ? 'bg-yellow-500' : pct >= 20 ? 'bg-orange-500' : 'bg-red-500';
              return (
                <div key={tp.topic} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300 font-medium">{tp.topic}</span>
                    <span className={classNames('font-semibold', scoreColor(tp.averageScore))}>{tp.averageScore}/10</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div className={classNames('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-gray-500">{tp.questionsAsked} question{tp.questionsAsked === 1 ? '' : 's'}</div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {reportData.topicPerformance.map((tp) => (
              <div key={tp.topic} className={classNames('rounded-lg border p-3', scoreBg(tp.averageScore))}>
                <div className="text-xs text-gray-400">{tp.topic}</div>
                <div className={classNames('text-lg font-bold', scoreColor(tp.averageScore))}>{tp.averageScore}/10</div>
                <div className="text-xs text-gray-600">{tp.questionsAsked} question{tp.questionsAsked === 1 ? '' : 's'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong vs Weak Topics - derived from actual interview performance */}
      {reportData?.topicPerformance && Array.isArray(reportData.topicPerformance) && reportData.topicPerformance.length > 0 && (() => {
        const sorted = [...reportData.topicPerformance].sort((a, b) => b.averageScore - a.averageScore);
        const strong = sorted.filter((t) => t.averageScore >= 7);
        const avg = sorted.filter((t) => t.averageScore >= 4 && t.averageScore < 7);
        const weak = sorted.filter((t) => t.averageScore < 4);
        return (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Strong vs Weak Topics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full" /> Strong Topics
                </h3>
                {strong.length > 0 ? strong.map((t) => (
                  <div key={t.topic} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>{t.topic}</span>
                    <span className="text-xs text-gray-500 ml-auto">{t.averageScore}/10</span>
                  </div>
                )) : <p className="text-xs text-gray-500">No topics scored ≥7 yet</p>}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-yellow-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full" /> Average
                </h3>
                {avg.length > 0 ? avg.map((t) => (
                  <div key={t.topic} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-yellow-400">•</span>
                    <span>{t.topic}</span>
                    <span className="text-xs text-gray-500 ml-auto">{t.averageScore}/10</span>
                  </div>
                )) : <p className="text-xs text-gray-500">No topics in 4-7 range</p>}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-400 rounded-full" /> Weak Topics
                </h3>
                {weak.length > 0 ? weak.map((t) => (
                  <div key={t.topic} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-red-400">⚠</span>
                    <span>{t.topic}</span>
                    <span className="text-xs text-gray-500 ml-auto">{t.averageScore}/10</span>
                  </div>
                )) : <p className="text-xs text-gray-500">No topics scored &lt;4</p>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Question-wise Score Chart - visual bar chart for each main question */}
      {questions.filter((q) => !q.isFollowUp).length > 0 && (() => {
        const mainQs = questions.filter((q) => !q.isFollowUp);
        return (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Question-wise Score
            </h2>
            <div className="space-y-3">
              {mainQs.map((q, i) => {
                const pct = Math.min(100, Math.max(0, ((q.score ?? 0) / (q.maxScore || 2)) * 100));
                const barColor = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300 font-medium">Q{i + 1}</span>
                      <span className={classNames('font-semibold', scoreColor((q.score ?? 0) / (q.maxScore || 2) * 10))}>
                        {q.score ?? '-'}/{q.maxScore ?? 2}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div className={classNames('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 truncate">{q.question}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {reportData?.skills && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Technical Skills
            </h2>
            <div className="space-y-2">
              {[
                ['Conceptual Understanding', reportData.skills.conceptualUnderstanding],
                ['Problem Solving', reportData.skills.problemSolving],
                ['Technical Depth', reportData.skills.technicalDepth],
                ['Accuracy', reportData.skills.accuracy],
              ].map(([key, val]) => (
                typeof val === 'number' && (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">{key}</span>
                    <span className={classNames('text-sm font-semibold', scoreColor(val))}>{val}/10</span>
                  </div>
                )
              ))}
            </div>
          </div>
          {reportData.communication && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                Communication
              </h2>
              <div className="space-y-2">
                {[
                  ['Clarity', reportData.communication.clarity],
                  ['Conciseness', reportData.communication.conciseness],
                ].map(([key, val]) => (
                  typeof val === 'number' && (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">{key}</span>
                      <span className={classNames('text-sm font-semibold', scoreColor(val))}>{val}/10</span>
                    </div>
                  )
                ))}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Confidence</span>
                  <span className="text-sm font-semibold text-white capitalize">{reportData.communication.confidenceIndicator || 'not_available'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {reportData?.mistakes?.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            Mistakes &amp; Misconceptions Detected
          </h2>
          <ul className="space-y-2">
            {reportData.mistakes.map((m, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">�</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          Question Analysis
          <span className="text-xs text-gray-500 font-normal ml-2">
            ({questions.filter(q => !q.isFollowUp).length} main + {questions.filter(q => q.isFollowUp).length} follow-ups)
          </span>
        </h2>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className={classNames('bg-gray-800 rounded-lg p-4', q.isFollowUp && 'border-l-4 border-amber-600')}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <span className="text-xs text-gray-500">
                    {q.isFollowUp ? '? Follow-up' : `Q${questions.slice(0, i).filter(x => !x.isFollowUp).length + 1}`}
                  </span>
                  <p className="text-sm text-white font-medium">{q.question}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {q.isFollowUp && <span className="text-xs bg-amber-900/30 text-amber-300 px-2 py-0.5 rounded">follow-up</span>}
                  {q.topic && <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded">{q.topic}</span>}
                  <span className={classNames('text-sm font-bold', scoreColor((q.score / (q.maxScore || 2)) * 10))}>{q.score ?? '-'}/10</span>
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
        <button type="button" onClick={onRestart}
          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> New Interview
        </button>
      </div>
    </div>
  );
}

// --- Main Page --------------------------------------------------------------

export default function MockInterview() {
  const [phase, setPhase] = useState('setup');
  const [sessionData, setSessionData] = useState(null);
  const [reportSessionId, setReportSessionId] = useState(null);
  const [checkingActive, setCheckingActive] = useState(true);
  const [resumeError, setResumeError] = useState(null);
  // Store the full active-session payload: { session, nextQuestion, answeredCount }
  const [activeState, setActiveState] = useState(null);

  useEffect(() => {
    getActiveInterviewSession()
      .then((res) => {
        if (res.data.data?.hasActiveSession) {
          setActiveState({
            session: res.data.data.session,
            nextQuestion: res.data.data.nextQuestion,
            answeredCount: res.data.data.answeredCount || 0,
          });
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
    setActiveState(null);
  };

    const handleResume = async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await getInterviewSession(sessionId);
      const state = res.data.data;
      setActiveState(null);
      // Edge case: every question answered but session not finalized
      // (e.g. network dropped on the final submit). Finalize ? report.
      // NOTE: a session with ZERO answered questions and no pending question
      // is recoverable (e.g. first-question generation failed at creation) �
      // POST /next handles CREATED sessions by generating the first question.
      if (!state.nextQuestion) {
        if ((state.answeredCount || 0) === 0 && ['CREATED', 'IN_PROGRESS'].includes(state.session.status)) {
          try {
            const retry = await requestNextInterviewQuestion(sessionId);
            if (retry.data.data.nextQuestion) {
              setSessionData({
                sessionId: state.session.id,
                mode: state.session.mode,
                totalQuestions: state.session.totalQuestions,
                question: retry.data.data.nextQuestion,
                history: state.history || [],
              });
              setPhase('interview');
              return;
            }
          } catch (_) { /* fall through to finalize attempt below */ }
        }
        try { await completeInterviewSession(state.session.id); } catch (_) { /* may already be completed */ }
        setReportSessionId(state.session.id);
        setPhase('report');
        return;
      }
      setSessionData({
        sessionId: state.session.id,
        mode: state.session.mode,
        totalQuestions: state.session.totalQuestions,
        question: state.nextQuestion,
        history: state.history || [],
      });
      setPhase('interview');
    } catch (err) {
      console.error('Failed to resume session:', err);
      setResumeError('Could not resume the interview. Please retry.');
      setActiveState(null);
      setPhase('setup');
    }
  };

  const handleRestart = () => {
    setPhase('setup');
    setSessionData(null);
    setReportSessionId(null);
    setActiveState(null);
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
      {resumeError && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-300">{resumeError}</p>
            <button type="button" onClick={() => setResumeError(null)} className="text-xs text-gray-400 hover:text-white mt-1 underline">
              Dismiss
            </button>
          </div>
        </div>
      )}
      {phase === 'setup' && (
        <SetupScreen
          onStart={handleStart}
          activeState={activeState}
          onResume={handleResume}
        />
      )}
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
