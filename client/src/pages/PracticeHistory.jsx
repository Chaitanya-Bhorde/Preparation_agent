import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getPracticeSummary, getPracticeHistory } from '../api';
import { LOADING_SPINNER, PAGE_CONTAINER } from '../utils/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import SummaryCards from '../components/PracticeHistory/SummaryCards';
import LanguageBreakdown from '../components/PracticeHistory/LanguageBreakdown';
import SkillsTags from '../components/PracticeHistory/SkillsTags';
import StreakHeatmap from '../components/PracticeHistory/StreakHeatmap';
import PracticeHistoryTable from '../components/PracticeHistory/PracticeHistoryTable';
import HistoryFilters from '../components/PracticeHistory/HistoryFilters';
import RecentSubmissions from '../components/PracticeHistory/RecentSubmissions';
import { useAuth } from '../context/AuthContext';

export default function PracticeHistory() {
  usePageTitle('Practice History');
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = user?.id;

  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    difficulty: searchParams.get('difficulty') || 'all',
    verdict: searchParams.get('verdict') || 'all',
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page')) || 1,
  });

  useEffect(() => {
    if (!userId) return;
    loadSummary();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    loadHistory();
  }, [userId, filters]);

  const loadSummary = async () => {
    try {
      const { data: res } = await getPracticeSummary(userId);
      setSummary(res.data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      const params = {
        userId,
        difficulty: filters.difficulty !== 'all' ? filters.difficulty : undefined,
        verdict: filters.verdict !== 'all' ? filters.verdict : undefined,
        search: filters.search || undefined,
        page: filters.page,
        limit: 20,
      };
      const { data: res } = await getPracticeHistory(params);
      setHistory(res.data || []);
      setTotalPages(res.totalPages || 1);
      setCurrentPage(res.currentPage || 1);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      if (key !== 'page') {
        newFilters.page = 1;
      }
      const params = new URLSearchParams();
      if (newFilters.difficulty !== 'all') params.set('difficulty', newFilters.difficulty);
      if (newFilters.verdict !== 'all') params.set('verdict', newFilters.verdict);
      if (newFilters.search) params.set('search', newFilters.search);
      if (newFilters.page > 1) params.set('page', newFilters.page);
      setSearchParams(params);
      return newFilters;
    });
  };

  if (!userId) {
    return (
      <div className={LOADING_SPINNER}>
        <p className="text-gray-400">Please log in to view practice history</p>
      </div>
    );
  }

  return (
    <div className={PAGE_CONTAINER}>
      <h1 className="text-2xl font-bold text-white mb-6">Practice History</h1>

      <SummaryCards data={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <StreakHeatmap userId={userId} />
        </div>
        <div>
          <RecentSubmissions userId={userId} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <LanguageBreakdown userId={userId} />
        </div>
        <div>
          <SkillsTags userId={userId} />
        </div>
      </div>

      <div className="mb-6">
        <HistoryFilters filters={filters} setFilters={updateFilter} />
        {loading ? (
          <div className={LOADING_SPINNER}>
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <>
            <PracticeHistoryTable data={history} />
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => updateFilter('page', Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-400 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => updateFilter('page', Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
