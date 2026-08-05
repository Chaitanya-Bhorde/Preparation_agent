import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import DifficultyFilter from '../components/DifficultyFilter';

export default function DSAPractice() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [difficulty, setDifficulty] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchProblems();
  }, [difficulty, debouncedSearch]);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (difficulty) params.set('difficulty', difficulty);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('limit', '50');
      const res = await fetch(`/api/coding-problems?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) setProblems(data.data);
      else setError(data.message || 'Failed to load problems');
    } catch (error) {
      console.error('Failed to fetch DSA problems:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [difficulty, debouncedSearch]);

  const getStatusColor = (status) => {
    if (status === 'solved') return 'text-green-400 bg-green-400/10';
    if (status === 'attempted') return 'text-yellow-400 bg-yellow-400/10';
    return 'text-gray-400 bg-gray-400/10';
  };

  const getDifficultyColor = (d) => {
    if (d === 'easy') return 'text-green-400 bg-green-400/10';
    if (d === 'medium') return 'text-yellow-400 bg-yellow-400/10';
    if (d === 'hard') return 'text-red-400 bg-red-400/10';
    return 'text-gray-400 bg-gray-400/10';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">DSA Practice</h1>
        <p className="text-gray-400">Solve coding problems with real-time code execution</p>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <DifficultyFilter value={difficulty} onChange={setDifficulty} className="self-start" />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search problems by title or tag..."
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
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-shimmer h-16 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {problems.map((problem) => (
            <Link
              key={problem._id}
              to={`/coding-problems/${problem.slug}`}
              className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 hover:border-blue-500/50 transition-all hover:bg-gray-800/80 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <BookOpen className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-white font-medium truncate">{problem.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(problem.userStatus)}`}>
                      {problem.userStatus}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                    {problem.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                {problem.companies?.length > 0 && (
                  <span className="hidden sm:block">{problem.companies.slice(0, 2).join(', ')}</span>
                )}
                <span className="text-gray-600">{problem.acceptanceRate || 0}%</span>
              </div>
            </Link>
          ))}
          {problems.length === 0 && !loading && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No problems found matching your filters</p>
              <button onClick={() => { setSearch(''); setDifficulty(''); }} className="text-blue-400 text-sm mt-2 hover:text-blue-300">
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}