import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProblems, getTags } from '../api';
import { Search, Filter } from 'lucide-react';
export default function Problems() {
  const [problems, setProblems] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tags') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  useEffect(() => {
    loadTags();
  }, []);
  useEffect(() => {
    loadProblems();
  }, [page, difficulty, selectedTag]);
  const loadTags = async () => {
    try {
      const { data } = await getTags();
      setTags(data.data || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };
  const loadProblems = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (difficulty) params.difficulty = difficulty;
      if (selectedTag) params.tags = selectedTag;
      if (search) params.search = search;
      const { data } = await getProblems(params);
      setProblems(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadProblems();
  };
  const difficultyColor = (d) => {
    if (d === 'easy') return 'text-green-400 bg-green-900/30';
    if (d === 'medium') return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
  };
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Problem Bank</h1>
      {}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search problems..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </form>
          <select value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select value={selectedTag} onChange={(e) => { setSelectedTag(e.target.value); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
            <option value="">All Topics</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>
      {}
      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading problems...</div>
      ) : problems.length === 0 ? (
        <div className="text-gray-400 text-center py-12">No problems found matching your filters.</div>
      ) : (
        <div className="space-y-2">
          {problems.map((problem) => (
            <Link key={problem._id} to={`/problems/${problem.slug}`}
              className="block bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{problem.title}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                    {problem.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-gray-500 text-xs">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right text-gray-500 text-sm">
                  <div>{problem.acceptanceRate || 0}%</div>
                  <div className="text-xs">acceptance</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700">
            Previous
          </button>
          <span className="px-4 py-2 text-gray-400">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700">
            Next
          </button>
        </div>
      )}
    </div>
  );
}