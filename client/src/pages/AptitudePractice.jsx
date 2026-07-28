import { useState, useEffect } from 'react';
import { getAptitudeQuestions, submitAptitudeAnswer, getAptitudeCategories } from '../api';
import { CheckCircle, XCircle, Loader2, BookOpen, BarChart3 } from 'lucide-react';

export default function AptitudePractice() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState({ total: 0, correct: 0 });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory !== undefined) loadQuestions();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const { data } = await getAptitudeCategories();
      setCategories(data.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (selectedCategory) params.category = selectedCategory;
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-400" /> Aptitude Practice
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1"><BarChart3 className="w-4 h-4" /> Accuracy: {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%</span>
          <span>Solved: {stats.total}</span>
        </div>
      </div>

      <div className="mb-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /> Loading questions...</div>
      ) : !question ? (
        <div className="text-gray-400 text-center py-12">No questions available.</div>
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