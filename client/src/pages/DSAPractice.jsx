import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Filter, Search } from 'lucide-react';

export default function DSAPractice() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProblems();
  }, [difficulty, search]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (difficulty) params.set('difficulty', difficulty);
      if (search) params.set('search', search);
      const res = await fetch(`/api/coding-problems?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) setProblems(data.data);
    } catch (error) {
      console.error('Failed to fetch DSA problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'solved') return 'text-green-400 bg-green-400/10';
    if (status === 'attempted') return 'text-yellow-400 bg-yellow-400/10';
    return 'text-gray-400 bg-gray-400/10';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">DSA Practice</h1>
        <p className="text-gray-400">Solve coding problems with Judge0 execution</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading problems...</div>
      ) : (
        <div className="space-y-3">
          {problems.map((problem) => (
            <Link
              key={problem._id}
              to={`/coding-problems/${problem.slug}`}
              className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 hover:border-gray-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-gray-500" />
                <div>
                  <h3 className="text-white font-medium">{problem.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(problem.userStatus)}`}>
                      {problem.userStatus}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{problem.difficulty}</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {problem.acceptanceRate || 0}% acceptance
              </div>
            </Link>
          ))}
          {problems.length === 0 && (
            <div className="text-center text-gray-400 py-12">No problems found</div>
          )}
        </div>
      )}
    </div>
  );
}