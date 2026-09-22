import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Database, Search, AlertCircle, RefreshCw, CheckCircle2, CircleDot } from 'lucide-react';
import { getSQLProblems } from '../api';
import { useDebounce } from '../hooks/useDebounce';
import { PAGE_CONTAINER, CARD_CLASSES } from '../utils/ui';

const DIFF_STYLES = {
  easy: 'text-green-400 bg-green-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  hard: 'text-red-400 bg-red-400/10',
};

export default function SQLPractice() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [difficulty, setDifficulty] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (difficulty) params.difficulty = difficulty;
      if (debouncedSearch) params.search = debouncedSearch;
      params.limit = 50;
      const { data } = await getSQLProblems(params);
      if (data.success) setProblems(data.data || []);
      else setError(data.message || 'Failed to load SQL problems');
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) return; // interceptor redirects to login
      setError(
        status === 403 ? 'You are not authorized to view SQL problems.'
        : status >= 500 ? 'Server error. Please try again.'
        : err.message || 'Network error. Please try again.'
      );
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [difficulty, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(fetchProblems, 0);
    return () => clearTimeout(timer);
  }, [fetchProblems]);

  return (
    <div className={PAGE_CONTAINER}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Database className="w-7 h-7 text-blue-400" /> SQL Practice
        </h1>
        <p className="text-gray-400">Write real SQL against sandboxed databases. Run to test, submit to solve.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          aria-label="Filter by difficulty"
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-800 rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-300 text-sm flex-1">{error}</p>
          <button onClick={fetchProblems} className="flex items-center gap-1 px-3 py-1.5 bg-red-900/30 text-red-300 rounded-lg text-xs hover:bg-red-900/50 transition-colors">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2" role="status" aria-label="Loading SQL problems">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-shimmer h-16 rounded-lg" />
          ))}
        </div>
      ) : !error && problems.length === 0 ? (
        <div className={`${CARD_CLASSES} text-center py-12`}>
          <Database className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No SQL problems yet</p>
          <p className="text-gray-500 text-sm">
            {search || difficulty
              ? 'No problems match your filters. Try clearing them.'
              : 'SQL problems will appear here once they are added to the platform.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {problems.map((problem) => (
            <Link
              key={problem._id}
              to={`/practice/sql/${problem.slug}`}
              className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 hover:border-blue-500/50 transition-all hover:bg-gray-800/80 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {problem.userStatus === 'solved' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                ) : problem.userStatus === 'attempted' ? (
                  <CircleDot className="w-5 h-5 text-yellow-400 shrink-0" />
                ) : (
                  <Database className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors shrink-0" />
                )}
                <div className="min-w-0">
                  <h3 className="text-white font-medium truncate">
                    {problem.problemNumber ? `${problem.problemNumber}. ` : ''}{problem.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${DIFF_STYLES[problem.difficulty] || 'text-gray-400 bg-gray-400/10'}`}>
                      {problem.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">{problem.topic}</span>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                {(problem.topics || []).slice(0, 3).map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">{t}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && problems.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <span className="font-medium text-gray-300">
            {problems.length} problem{problems.length !== 1 ? 's' : ''} shown
          </span>
          {(search || difficulty) && (
            <span className="ml-2 inline-flex items-center gap-1.5 text-gray-500">
              <span className="text-gray-600">filtered by</span>
              {difficulty && (
                <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700 capitalize">
                  {difficulty}
                </span>
              )}
              {search && (
                <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                  “{search}”
                </span>
              )}
              <button
                type="button"
                onClick={() => { setDifficulty(''); setSearch(''); }}
                className="ml-1 text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
              >
                Clear filters
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
