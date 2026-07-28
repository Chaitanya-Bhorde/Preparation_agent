import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCodingProblems, getCodingTags, getCodingTopics } from '../api';
import { Search, CheckCircle, Circle, Clock } from 'lucide-react';
import { DIFFICULTY_COLORS, SELECT_CLASSES } from '../utils/ui';

export default function CodingProblems() {
  const [problems, setProblems] = useState([]);
  const [tags, setTags] = useState([]);
  const [topics, setTopics] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [tagsError, setTagsError] = useState(null);
  const [topicsError, setTopicsError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const backend = 'coding';

  useEffect(() => {
    setTagsLoading(true);
    setTopicsLoading(true);
    loadTagsAndTopics();
  }, []);

  useEffect(() => { loadProblems(); }, [page, difficulty, selectedTag, selectedTopic, search]);

  const loadTagsAndTopics = async () => {
    setTagsError(null);
    setTopicsError(null);
    try {
      const [tagsRes, topicsRes] = await Promise.all([getCodingTags(), getCodingTopics()]);
      const tagData = tagsRes.data.data || [];
      const topicData = topicsRes.data.data || [];
      setTags(tagData);
      setTopics(topicData);
      if (Array.isArray(tagData) && tagData.length === 0) {
        console.warn('[API] getCodingTags returned 200 with empty array - no tags in DB');
      }
      if (Array.isArray(topicData) && topicData.length === 0) {
        console.warn('[API] getCodingTopics returned 200 with empty array - no topics in DB');
      }
    } catch (error) {
      console.error('Failed to load tags/topics:', error);
      setTagsError('Failed to load tags');
      setTopicsError('Failed to load topics');
    } finally {
      setTagsLoading(false);
      setTopicsLoading(false);
    }
  };

  const loadProblems = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (difficulty) params.difficulty = difficulty;
      if (selectedTag) params.tags = selectedTag;
      if (selectedTopic) params.topic = selectedTopic;
      if (search) params.search = search;
      const { data } = await getCodingProblems(params);
      setProblems(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load coding problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor = (d) => DIFFICULTY_COLORS[d] || DIFFICULTY_COLORS.easy;
  const StatusIcon = ({ status }) => {
    if (status === 'solved') return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status === 'attempted') return <Clock className="w-4 h-4 text-orange-400" />;
    return <Circle className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Coding Problems</h1>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search problems..." className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <select value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }} className={SELECT_CLASSES}>
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select value={selectedTopic} onChange={(e) => { setSelectedTopic(e.target.value); setPage(1); }} className={SELECT_CLASSES}>
            <option value="">All Topics</option>
            {topicsLoading ? (<option value="" disabled>Loading topics...</option>) : null}
            {topicsError ? (<option value="" disabled>{topicsError}</option>) : null}
            {!topicsLoading && !topicsError && topics.length === 0 ? (<option value="" disabled>No topics available</option>) : null}
            {topics.map((topic) => (<option key={topic} value={topic}>{topic}</option>))}
          </select>
          <select value={selectedTag} onChange={(e) => { setSelectedTag(e.target.value); setPage(1); }} className={SELECT_CLASSES}>
            <option value="">All Tags</option>
            {tagsLoading ? (<option value="" disabled>Loading tags...</option>) : null}
            {tagsError ? (<option value="" disabled>{tagsError}</option>) : null}
            {!tagsLoading && !tagsError && tags.length === 0 ? (<option value="" disabled>No tags available</option>) : null}
            {tags.map((tag) => (<option key={tag} value={tag}>{tag}</option>))}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading problems...</div>
      ) : problems.length === 0 ? (
        <div className="text-gray-400 text-center py-12">No problems found matching your filters.</div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-800/50 text-gray-400 text-xs font-medium uppercase tracking-wider">
            <div className="col-span-5">Title</div>
            <div className="col-span-2">Difficulty</div>
            <div className="col-span-3">Topic / Tags</div>
            <div className="col-span-2 text-center">Status</div>
          </div>
          <div className="divide-y divide-gray-800">
            {problems.map((problem) => (
              <Link key={problem._id} to={`/coding-problems/${problem.slug}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-gray-800/50 transition-colors items-center">
                <div className="md:col-span-5">
                  <h3 className="text-white font-medium text-sm truncate">{problem.title}</h3>
                  <div className="flex md:hidden items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
                    <span className="text-xs text-gray-500">{problem.topic}</span>
                    <StatusIcon status={problem.userStatus} />
                  </div>
                </div>
                <div className="hidden md:block md:col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
                </div>
                <div className="hidden md:flex md:col-span-3 gap-1 flex-wrap">
                  <span className="text-gray-500 text-xs bg-gray-800 px-2 py-0.5 rounded">{problem.topic}</span>
                  {problem.tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-gray-500 text-xs bg-gray-800 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
                <div className="hidden md:flex md:col-span-2 justify-center">
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