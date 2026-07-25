import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getSQLProblems, getSQLTopics, getSQLTags } from '../api';
import { Search, CheckCircle, Circle, Clock, Database } from 'lucide-react';
import { DIFFICULTY_COLORS, SELECT_CLASSES } from '../utils/ui';
export default function SQLProblems() {
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [selectedTopic, setSelectedTopic] = useState(searchParams.get('topic') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tags') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  useEffect(() => { loadFilters(); }, []);
  useEffect(() => { loadProblems(); }, [page, difficulty, selectedTopic, selectedTag, search]);
  const loadFilters = async () => {
    try {
      const [topicsRes, tagsRes] = await Promise.all([getSQLTopics(), getSQLTags()]);
      setTopics(topicsRes.data.data || []);
      setTags(tagsRes.data.data || []);
    } catch (error) { console.error('Failed to load filters:', error); }
  };
  const loadProblems = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (difficulty) params.difficulty = difficulty;
      if (selectedTopic) params.topic = selectedTopic;
      if (selectedTag) params.tags = selectedTag;
      if (search) params.search = search;
      const { data } = await getSQLProblems(params);
      setProblems(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) { console.error('Failed to load SQL problems:', error); }
    finally { setLoading(false); }
  };
  const handleSearch = (e) => { e.preventDefault(); setPage(1); };
  const difficultyColor = (d) => DIFFICULTY_COLORS[d] || DIFFICULTY_COLORS.easy;
  const StatusIcon = ({ status }) => {
    if (status === 'solved') return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status === 'attempted') return <Clock className="w-4 h-4 text-orange-400" />;
    return <Circle className="w-4 h-4 text-gray-600" />;
  };
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-purple-400" />
        <h1 className="text-2xl font-bold text-white">SQL Practice</h1>
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SQL problems..." className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
          </form>
          <select value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }} className={SELECT_CLASSES}>
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select value={selectedTopic} onChange={(e) => { setSelectedTopic(e.target.value); setPage(1); }} className={SELECT_CLASSES}>
            <option value="">All Topics</option>
            {topics.map((topic) => (<option key={topic} value={topic}>{topic}</option>))}
          </select>
          <select value={selectedTag} onChange={(e) => { setSelectedTag(e.target.value); setPage(1); }} className={SELECT_CLASSES}>
            <option value="">All Tags</option>
            {tags.map((tag) => (<option key={tag} value={tag}>{tag}</option>))}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading SQL problems...</div>
      ) : problems.length === 0 ? (
        <div className="text-gray-400 text-center py-12">No SQL problems found matching your filters.</div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-800/50 text-gray-400 text-xs font-medium uppercase tracking-wider">
            <div className="col-span-5">Title</div>
            <div className="col-span-2">Difficulty</div>
            <div className="col-span-2">Topic</div>
            <div className="col-span-2">Tags</div>
            <div className="col-span-1 text-center">Status</div>
          </div>
          <div className="divide-y divide-gray-800">
            {problems.map((problem) => (
              <Link key={problem._id} to={`/sql/${problem.slug}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-gray-800/50 transition-colors items-center">
                <div className="md:col-span-5">
                  <h3 className="text-white font-medium text-sm truncate">{problem.title}</h3>
                  <div className="flex md:hidden items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
                    <StatusIcon status={problem.userStatus} />
                  </div>
                </div>
                <div className="hidden md:block md:col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
                </div>
                <div className="hidden md:block md:col-span-2">
                  <span className="text-gray-400 text-xs">{problem.topic}</span>
                </div>
                <div className="hidden md:flex md:col-span-2 gap-1 flex-wrap">
                  {problem.tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-gray-500 text-xs bg-gray-800 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
                <div className="hidden md:flex md:col-span-1 justify-center">
                  <StatusIcon status={problem.userStatus} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700">Previous</button>
          <span className="px-4 py-2 text-gray-400">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700">Next</button>
        </div>
      )}
    </div>
  );
}