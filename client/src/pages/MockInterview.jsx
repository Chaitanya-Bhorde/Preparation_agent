import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Mic, MicOff, Volume2, VolumeX, Loader2, Send, CheckCircle, AlertCircle, ArrowRight, Award, Brain, RefreshCw } from 'lucide-react';
import { PAGE_CONTAINER, STAT_CARD_CLASSES } from '../utils/ui';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function MockInterview() {
  const [interviewId, setInterviewId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [hints, setHints] = useState([]);
  const [category, setCategory] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [topic, setTopic] = useState('DSA');
  const [level, setLevel] = useState('beginner');
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const startSpeechRecognition = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript((prev) => prev + finalTranscript);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      if (!synthRef.current) return resolve();
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      synthRef.current.speak(utterance);
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const startInterview = async () => {
    setLoading(true);
    setError(null);
    setHistory([]);
    setTranscript('');
    setFeedback(null);
    setIsComplete(false);
    setStarted(true);
    try {
      const res = await fetch('/api/mock-interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ topic, level }),
      });
      const data = await res.json();
      if (data.success) {
        setInterviewId(data.data.interviewId);
        setQuestion(data.data.question);
        setHints(data.data.hints || []);
        setCategory(data.data.category || 'technical');
        speak(data.data.question);
      } else {
        setError(data.message || 'Failed to start interview');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError(null);
    stopSpeechRecognition();
    try {
      const res = await fetch('/api/mock-interview/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          interviewId,
          question,
          answer: transcript.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHistory((prev) => [
          ...prev,
          { question, answer: transcript.trim(), score: data.data.score, feedback: data.data.feedback },
        ]);
        setFeedback(data.data);
        setTranscript('');

        if (data.data.isComplete) {
          setIsComplete(true);
          speak(`Interview complete! Your overall score: ${data.data.score}/10. ${data.data.feedback}`);
        } else {
          setQuestion(data.data.nextQuestion);
          setHints([]);
          speak(data.data.nextQuestion);
        }
      } else {
        setError(data.message || 'Failed to submit answer');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && transcript.trim()) {
      e.preventDefault();
      submitAnswer();
    }
  };

  if (!started) {
    return (
    <div className={PAGE_CONTAINER}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-8 mb-8 text-center">
            <Bot className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">AI Mock Interview</h1>
            <p className="text-pink-100">Practice with voice-based AI interviews. Get real-time feedback on your answers.</p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Configure Your Interview</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Topic</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="DSA">DSA (Data Structures & Algorithms)</option>
                  <option value="SQL">SQL</option>
                  <option value="Aptitude">Aptitude</option>
                  <option value="System Design">System Design</option>
                  <option value="General">General Technical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Difficulty Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <button
                onClick={startInterview}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Start Interview'}
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">How it works</h2>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center flex-shrink-0 text-xs">1</div>
                <p>Configure your interview topic and difficulty level</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center flex-shrink-0 text-xs">2</div>
                <p>The AI will ask you questions using voice synthesis</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center flex-shrink-0 text-xs">3</div>
                <p>Speak your answer using your microphone</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center flex-shrink-0 text-xs">4</div>
                <p>Get instant feedback and a final score</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE_CONTAINER}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-pink-400" /> Mock Interview
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-full capitalize">{level}</span>
            <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-full">{topic}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {history.length > 0 && (
          <div className="mb-6 space-y-3">
            {history.map((item, idx) => (
              <div key={idx} className="bg-gray-900 rounded-lg border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Q{idx + 1}</span>
                  <span className={`text-xs font-medium ${item.score >= 7 ? 'text-green-400' : item.score >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                    Score: {item.score}/10
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">{item.question}</p>
                <p className="text-xs text-gray-500 mb-2">Your answer: {item.answer}</p>
                <p className="text-xs text-gray-400">{item.feedback}</p>
              </div>
            ))}
          </div>
        )}

        {isComplete ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
            <Award className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Interview Complete!</h2>
            <p className="text-gray-400 mb-4">You answered {history.length} questions</p>
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">{feedback?.score || 0}</p>
                <p className="text-xs text-gray-500">Final Score</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{history.length}</p>
                <p className="text-xs text-gray-500">Questions</p>
              </div>
            </div>
            {feedback?.strengths?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-green-400 mb-2">Strengths</h3>
                {feedback.strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                    <CheckCircle className="w-3 h-3 text-green-400" /> {s}
                  </div>
                ))}
              </div>
            )}
            {feedback?.weaknesses?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-red-400 mb-2">Areas to Improve</h3>
                {feedback.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                    <AlertCircle className="w-3 h-3 text-red-400" /> {w}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={startInterview}
              className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />Start New Interview
            </button>
          </div>
        ) : !loading ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-pink-400" />
              <span className="text-xs px-2 py-0.5 bg-pink-900/30 text-pink-400 rounded-full">{category}</span>
            </div>
            <h2 className="text-lg text-white font-medium mb-4">{question}</h2>

            {hints.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-400 font-medium mb-2">Hints</p>
                {hints.map((hint, idx) => (
                  <p key={idx} className="text-sm text-gray-400 mb-1">- {hint}</p>
                ))}
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">Your Answer</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleListening}
                    className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    title={isListening ? 'Stop recording' : 'Start recording'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : speak(question)}
                    className={`p-2 rounded-lg transition-colors ${isSpeaking ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    title={isSpeaking ? 'Stop speaking' : 'Read question aloud'}
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <textarea
                value={transcript + (interimTranscript ? ' ' + interimTranscript : '')}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Listening... Speak your answer' : 'Type your answer or use the microphone...'}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm min-h-[100px] focus:outline-none focus:border-blue-500 resize-none"
                disabled={loading}
              />
              {isListening && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs text-red-400">Recording... Speak clearly</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={submitAnswer}
                disabled={!transcript.trim() || loading}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Answer
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-pink-400 mx-auto mb-2" />
            <p className="text-gray-400">Processing your answer...</p>
          </div>
        )}

        {feedback && !isComplete && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Feedback</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-400">Score:</span>
              <span className={`text-lg font-bold ${feedback.score >= 7 ? 'text-green-400' : feedback.score >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                {feedback.score}/10
              </span>
            </div>
            <p className="text-sm text-gray-300 mb-3">{feedback.feedback}</p>
            {feedback.suggestedImprovement && (
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-400 font-medium mb-1">Suggested Improvement</p>
                <p className="text-sm text-gray-300">{feedback.suggestedImprovement}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}