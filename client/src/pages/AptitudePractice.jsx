import { useState, useEffect, useCallback } from 'react';
import { getAptitudeQuestions, submitAptitudeAnswer } from '../api';
import { CheckCircle, XCircle, Loader2, BookOpen, BarChart3, ArrowLeft, Calculator, Brain, MessageSquareText, PieChart, Filter, Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

// Topic groups -> existing DB category slugs (no invented categories).
const APTITUDE_TOPICS = [
  {
    key: 'quant',
    label: 'Quantitative Aptitude',
    icon: Calculator,
    color: 'from-blue-600 to-indigo-700',
    iconColor: 'text-blue-400',
    desc: 'Numbers, percentages, profit & loss, time & work, speed/distance, interest, probability & more.',
    categories: ['quant', 'number-system', 'percentages', 'profit-loss', 'ratio-proportion', 'averages', 'partnership', 'mixture-allegation', 'time-work', 'pipes-cisterns', 'time-speed-distance', 'boats-streams', 'trains', 'simple-interest', 'compound-interest', 'ages', 'clocks', 'calendars', 'permutation-combination', 'probability', 'progressions', 'geometry', 'mensuration', 'number-series'],
  },
  {
    key: 'logical',
    label: 'Logical Reasoning',
    icon: Brain,
    color: 'from-purple-600 to-fuchsia-700',
    iconColor: 'text-purple-400',
    desc: 'Syllogisms, blood relations, direction sense, coding-decoding, puzzles, seating arrangements & more.',
    categories: ['logical', 'blood-relations', 'direction-sense', 'coding-decoding', 'seating-arrangement', 'puzzles', 'syllogism', 'statement-conclusion', 'statement-assumption', 'cause-effect', 'input-output', 'ranking', 'alphabet-series', 'analogy', 'odd-one-out', 'cubes-dice', 'mirror-image', 'paper-folding', 'pattern-recognition', 'critical-reasoning', 'decision-making'],
  },
  {
    key: 'verbal',
    label: 'Verbal Ability',
    icon: MessageSquareText,
    color: 'from-emerald-600 to-teal-700',
    iconColor: 'text-emerald-400',
    desc: 'Grammar, vocabulary, sentence correction, reading comprehension, para jumbles & more.',
    categories: ['verbal', 'reading-comprehension', 'grammar', 'error-detection', 'sentence-improvement', 'sentence-correction', 'fill-blanks', 'para-jumbles', 'sentence-arrangement', 'vocabulary', 'synonyms', 'antonyms', 'idioms-phrases', 'one-word-substitution', 'active-passive-voice', 'direct-indirect-speech', 'cloze-test'],
  },
  {
    key: 'data',
    label: 'Data Interpretation',
    icon: PieChart,
    color: 'from-amber-600 to-orange-700',
    iconColor: 'text-amber-400',
    desc: 'Tables, charts and data sufficiency questions asked across placement tests.',
    categories: ['data-interpretation', 'data-sufficiency'],
  },
];

const SELECT_CLASSES = 'px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500';

export default function AptitudePractice() {
  const [activeTopic, setActiveTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [difficulty, setDifficulty] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState({ total: 0, correct: 0 });

  const loadQuestions = useCallback(async () => {
    if (!activeTopic) return;
    setLoading(true);
    try {
      const params = { limit: 20, topic: activeTopic.categories.join(',') };
      if (difficulty) params.difficulty = difficulty;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await getAptitudeQuestions(params);
      setQuestions(data.data || []);
      setCurrentIndex(0);
      setResult(null);
      setSelectedOption(null);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTopic, difficulty, debouncedSearch]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const selectTopic = (topic) => {
    setActiveTopic(topic);
    setDifficulty('');
    setSearch('');
  };

  const handleSubmitAnswer = async () => {
    if (selectedOption === null || !questions[currentIndex]) return;
    setSubmitting(true);
    try {
      const { data } = await submitAptitudeAnswer({
        questionId: questions[currentIndex]._id,
        selectedIndex: selectedOption,
      });
      setResult(data.data);
      setStats((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (data.data.correct ? 1 : 0),
      }));
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setResult(null);
    } else {
      loadQuestions();
    }
  };

  const question = questions[currentIndex];

  // ---- TOPIC CARDS LANDING ---- //
  if (!activeTopic) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-400" /> Aptitude Practice
          </h1>
          <p className="text-gray-400">Pick a topic to start practicing. Refine by difficulty inside each topic.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {APTITUDE_TOPICS.map((topic) => (
            <button
              key={topic.key}
              onClick={() => selectTopic(topic)}
              className={`text-left bg-gradient-to-br ${topic.color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all group`}
            >
              <topic.icon className="w-8 h-8 mb-3 opacity-90" />
              <h2 className="text-xl font-bold mb-1">{topic.label}</h2>
              <p className="text-sm text-white/80 mb-3">{topic.desc}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/20 px-3 py-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
                Start Practicing →
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---- QUIZ + FILTERS (inside topic) ---- //
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTopic(null)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Topics
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <activeTopic.icon className="w-6 h-6" /> {activeTopic.label}
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1"><BarChart3 className="w-4 h-4" /> Accuracy: <span className="text-white font-medium">{accuracy}%</span></span>
          <span>Solved: <span className="text-white font-medium">{stats.correct}</span></span>
        </div>
      </div>

      {/* Filters - same pattern as DSA/SQL practice */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
        </div>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={SELECT_CLASSES}>
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /> Loading questions...</div>
      ) : !question ? (
        <div className="text-center py-12">
          <Filter className="w-10 h-10 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No questions found matching your filters</p>
          <button onClick={() => { setDifficulty(''); setSearch(''); }} className="text-blue-400 text-sm mt-2 hover:text-blue-300">Clear filters</button>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="text-xs text-gray-500 mb-2">Question {currentIndex + 1} of {questions.length}</div>
          <h2 className="text-white text-lg font-medium mb-4">{question.question}</h2>
          <div className="space-y-2 mb-4">
            {(question.options || []).map((opt, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOption(idx)}
                disabled={!!result}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  selectedOption === idx ? 'border-blue-500 bg-blue-900/20' : 'border-gray-800 hover:border-gray-700'
                } ${result ? (idx === question.correctIndex ? 'border-green-500 bg-green-900/20' : 'opacity-60') : ''}`}
              >
                <span className="text-gray-300 text-sm">{opt.text}</span>
                {result && idx === question.correctIndex && <CheckCircle className="w-4 h-4 text-green-400 inline ml-2" />}
                {result && selectedOption === idx && idx !== question.correctIndex && <XCircle className="w-4 h-4 text-red-400 inline ml-2" />}
              </button>
            ))}
          </div>

          {!result ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null || submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-500"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className={`p-3 rounded-lg border ${result.correct ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                <p className={`text-sm font-medium ${result.correct ? 'text-green-400' : 'text-red-400'}`}>
                  {result.correct ? 'Correct!' : `Wrong. Correct answer: ${question.options[question.correctIndex]?.text}`}
                </p>
              </div>
              {question.explanation && (
                <div className="p-3 bg-gray-950 rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-400 font-medium mb-1">Explanation</p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{question.explanation}</p>
                </div>
              )}
              <button onClick={handleNext} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                {currentIndex < questions.length - 1 ? 'Next Question' : 'Restart'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

