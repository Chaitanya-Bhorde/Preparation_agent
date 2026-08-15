import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getCodingProblems, getCodingTags, getCodingTopics,
  getCodingCompanies, getCodingProblemStats,
} from '../api';
import {
  Search, CheckCircle, Circle, Clock, ChevronDown,
  TrendingUp,
} from 'lucide-react';
import { DIFFICULTY_COLORS, SELECT_CLASSES, BUTTON_CLASSES } from '../utils/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useDebounce } from '../hooks/useDebounce';
import { SkeletonTable } from '../components/Skeleton';

function MultiSelectDropdown({ label, options, selected, onChange, loading }) {
  const [open, setOpen] = useState(false);
  const toggle = (val) => {
    const arr = selected.includes(val)
      ? selected.filter((s) => s !== val) : [...selected, val];
    onChange(arr);
  };
  const clearAll = () => onChange([]);
  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setOpen(!open)} className={`${SELECT_CLASSES} min-w-[140px]`}>
        {label} <ChevronDown className="w-4 h-4 ml-1 inline" />
        {selected.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">{selected.length}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-48 max-h-64 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
            <div className="sticky top-0 bg-gray-900 px-3 py-2 border-b border-gray-700 flex justify-between items-center">
              <span className="text-xs font-medium text-gray-400">{label}</span>
              {selected.length > 0 && <button type="button" onClick={clearAll} className="text-xs text-blue-400 hover:text-blue-300">Clear</button>}
            </div>
            {loading && <div className="px-3 py-2 text-xs text-gray-500">Loading...</div>}
            {!loading && options.length === 0 && <div className="px-3 py-2 text-xs text-gray-500">None available</div>}
            {!loading && options.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <label key={opt} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 cursor-pointer text-sm">
                  <input type="checkbox" checked={checked} onChange={() => toggle(opt)} className="w-3 h-3 rounded border-gray-600 text-blue-600 focus:ring-blue-500" />
                  <span className={checked ? 'text-white' : 'text-gray-400'}>{opt}</span>
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SingleSelect({ options, value, onChange, placeholder = 'All' }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASSES}>
      <option value="">{placeholder}</option>
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' }, { value: 'solved', label: 'Solved' },
  { value: 'attempted', label: 'Attempted' }, { value: 'unsolved', label: 'Unsolved' },
];
const SORT_OPTIONS = [
  { value: '', label: 'Default' }, { value: 'difficulty', label: 'Difficulty (Easy→Hard)' },
  { value: 'difficulty-desc', label: 'Difficulty (Hard→Easy)' }, { value: 'acceptanceRate', label: 'Acceptance Rate (High)' },
  { value: 'acceptanceRate-asc', label: 'Acceptance Rate (Low)' }, { value: 'likes', label: 'Most Liked' },
  { value: 'title', label: 'Title (A→Z)' }, { value: 'title-desc', label: 'Title (Z→A)' },
  { value: 'newest', label: 'Newest First' },
];
export default function CodingProblems() {
  usePageTitle('Coding Problems');

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 400);
  const [difficulty, setDifficulty] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  const [problems, setProblems] = useState([]);
  const [tags, setTags] = useState([]);
  const [topics, setTopics] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (difficulty) params.difficulty = difficulty;
    if (selectedTags.length) params.tags = selectedTags.join(',');
    if (selectedTopics.length) params.topic = selectedTopics.join(',');
    if (selectedCompanies.length) params.company = selectedCompanies.join(',');
    if (statusFilter) params.status = statusFilter;
    if (sortBy) params.sort = sortBy;
    params.page = String(page);
    params.limit = '20';
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, difficulty, selectedTags, selectedTopics, selectedCompanies, statusFilter, sortBy, page, setSearchParams]);

  useEffect(() => { loadTagsAndTopics(); loadCompanies(); loadStats(); }, []);
  useEffect(() => { loadProblems(); }, [page, difficulty, selectedTags, selectedTopics, selectedCompanies, statusFilter, sortBy, debouncedSearch]);

  const loadTagsAndTopics = async () => {
    setTagsLoading(true);
    try {
      const [tagsRes, topicsRes] = await Promise.all([getCodingTags(), getCodingTopics()]);
      setTags(tagsRes.data.data || []);
      setTopics(topicsRes.data.data || []);
    } catch (error) { console.error('Failed to load tags/topics:', error); }
    finally { setTagsLoading(false); }
  };

  const loadCompanies = async () => {
    try {
      const res = await getCodingCompanies();
      setCompanies(res.data.data || []);
    } catch (error) { console.error('Failed to load companies:', error); }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await getCodingProblemStats();
      setStats(res.data.data);
    } catch (error) { console.error('Failed to load stats:', error); }
    finally { setStatsLoading(false); }
  };

  const loadProblems = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (difficulty) params.difficulty = difficulty;
      if (selectedTags.length) params.tags = selectedTags.join(',');
      if (selectedTopics.length) params.topic = selectedTopics.join(',');
      if (selectedCompanies.length) params.company = selectedCompanies.join(',');
      if (statusFilter) params.status = statusFilter;
      if (sortBy) params.sort = sortBy;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await getCodingProblems(params);
      setProblems(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) { console.error('Failed to load coding problems:', error); }
    finally { setLoading(false); }
  };
const clearAllFilters = () => {
    setDifficulty(''); setSelectedTags([]); setSelectedTopics([]);
    setSelectedCompanies([]); setStatusFilter(''); setSortBy('');
    setSearch(''); setPage(1);
  };

  const hasActiveFilters = difficulty || selectedTags.length || selectedTopics.length ||
    selectedCompanies.length || statusFilter || sortBy || debouncedSearch;

  const statusClass = (status) => {
    switch (status) {
      case 'solved': return 'bg-green-900/30 text-green-400 border-green-800';
      case 'attempted': return 'bg-yellow-900/30 text-yellow-400 border-yellow-800';
      default: return 'bg-gray-900/30 text-gray-500 border-gray-800';
    }
  };

  const firstTimeUser = !statsLoading && stats && stats.solved === 0 && stats.attempted === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {!statsLoading && stats && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span><span className="text-white font-medium">{stats.solved}</span>/{stats.total} solved</span>
            <span>•</span>
            <span>{stats.acceptanceRate}% acceptance rate</span>
          </div>
        </div>
      )}

      {firstTimeUser && (
        <div className="mb-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-2">Welcome to PrepAgent!</h2>
          <p className="text-gray-300 mb-4">
            Start your coding journey by solving problems. Begin with Easy problems below
            or use the filters to find exactly what you need.
          </p>
          <Link to="/coding-problems?difficulty=easy" onClick={() => setDifficulty('easy')}
            className={BUTTON_CLASSES.primaryCompact}>Start with Easy Problems</Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search problems..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
        </div>

        <SingleSelect
          options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]}
          value={difficulty} onChange={(v) => { setDifficulty(v); setPage(1); }} placeholder="All Difficulties" />

        <MultiSelectDropdown label="Tags" options={tags} selected={selectedTags}
          onChange={(v) => { setSelectedTags(v); setPage(1); }} loading={tagsLoading} />
        <MultiSelectDropdown label="Categories" options={topics} selected={selectedTopics}
          onChange={(v) => { setSelectedTopics(v); setPage(1); }} loading={false} />
        <MultiSelectDropdown label="Companies" options={companies} selected={selectedCompanies}
          onChange={(v) => { setSelectedCompanies(v); setPage(1); }} loading={false} />

        <SingleSelect options={STATUS_OPTIONS} value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }} placeholder="All Statuses" />
        <SingleSelect options={SORT_OPTIONS} value={sortBy}
          onChange={(v) => { setSortBy(v); setPage(1); }} placeholder="Default" />

        {hasActiveFilters && (
          <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-white underline">Clear all</button>
        )}
      </div>
{loading ? (<SkeletonTable rows={5} />) : problems.length === 0 ? (
        <div className="text-center py-12">
          {debouncedSearch && <p className="text-gray-400">Try different keywords</p>}
          {!debouncedSearch && hasActiveFilters && <p className="text-gray-400">No problems found matching your filters</p>}
          {!debouncedSearch && !hasActiveFilters && <p className="text-gray-400">No problems available yet</p>}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-800/50 text-gray-400 text-xs font-medium uppercase tracking-wider">
            <div className="col-span-4">Title</div>
            <div className="col-span-1">Difficulty</div>
            <div className="col-span-2">Acceptance</div>
            <div className="col-span-2">Companies</div>
            <div className="col-span-2 text-center">Status</div>
          </div>
          <div className="divide-y divide-gray-800">
            {problems.map((problem) => {
              const accRate = problem.acceptanceRate ?? 0;
              const accColor = accRate >= 70 ? 'text-green-400' : accRate >= 40 ? 'text-yellow-400' : 'text-red-400';
              return (
                <Link key={problem._id} to={`/coding-problems/${problem.slug}`}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-gray-800/50 transition-colors items-center">
                  <div className="md:col-span-4">
                    <h3 className="text-white font-medium text-sm truncate">{problem.title}</h3>
                    <div className="flex md:hidden items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[problem.difficulty] || DIFFICULTY_COLORS.easy}`}>{problem.difficulty}</span>
                    </div>
                  </div>
                  <div className="hidden md:block md:col-span-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[problem.difficulty] || DIFFICULTY_COLORS.easy}`}>{problem.difficulty}</span>
                  </div>
                  <div className="hidden md:flex md:col-span-2 items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-gray-500" />
                    <span className={`text-sm font-medium ${accColor}`}>{accRate}%</span>
                  </div>
                  <div className="hidden md:flex md:col-span-2 flex-wrap gap-1">
                    {(problem.companies || []).slice(0, 2).map((c) => (
                      <span key={c} className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{c}</span>
                    ))}
                    {(problem.companies || []).length > 2 && <span className="text-xs text-gray-500">+{problem.companies.length - 2}</span>}
                  </div>
                  <div className="hidden md:flex md:col-span-2 justify-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${statusClass(problem.userStatus)}`}>
                      {problem.userStatus === 'solved' && <CheckCircle className="w-3 h-3" />}
                      {problem.userStatus === 'attempted' && <Clock className="w-3 h-3" />}
                      {problem.userStatus === 'unsolved' && <Circle className="w-3 h-3" />}
                      {problem.userStatus}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700">Previous</button>
          <span className="px-4 py-2 text-gray-400">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700">Next</button>
        </div>
      )}
    </div>
  );
}