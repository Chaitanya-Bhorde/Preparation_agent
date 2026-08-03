import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboardByCategory } from '../api';
import { Trophy, Crown, Medal, Award, Loader2, TrendingUp, Code2, Database, Brain } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { PAGE_CONTAINER, LOADING_SPINNER, BUTTON_CLASSES } from '../utils/ui';

const TABS = [
  { key: 'overall', label: 'Overall', icon: TrendingUp },
  { key: 'dsa', label: 'DSA', icon: Code2 },
  { key: 'sql', label: 'SQL', icon: Database },
  { key: 'aptitude', label: 'Aptitude', icon: Brain },
];

const RANK_ICONS = { 1: Crown, 2: Medal, 3: Award };
const RANK_COLORS = { 1: 'text-yellow-400', 2: 'text-gray-300', 3: 'text-orange-400' };
const RANK_BG = {
  1: 'bg-yellow-900/20 border-yellow-500/30',
  2: 'bg-gray-800/50 border-gray-500/30',
  3: 'bg-orange-900/20 border-orange-500/30',
};

export default function Leaderboard() {
  usePageTitle('Leaderboard');
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overall');
  const [data, setData] = useState([]);
  const [userRank, setUserRank] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTab(activeTab, page);
  }, [activeTab, page]);

  const loadTab = async (category, pageNum) => {
    setLoading(true);
    try {
      const { data: res } = await getLeaderboardByCategory(category, { page: pageNum, limit: 50 });
      setData(res.data || []);
      setUserRank(res.userRank || 0);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank <= 3) {
      const Icon = RANK_ICONS[rank];
      return <Icon className={`w-5 h-5 ${RANK_COLORS[rank]}`} />;
    }
    return <span className="text-gray-500 text-sm w-5 text-center">{rank}</span>;
  };

  return (
    <div className={PAGE_CONTAINER}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-400" /> Leaderboard</h1>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === t.key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* My rank banner */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 px-4 py-2 mb-6 flex items-center justify-between text-sm">
        <span className="text-gray-400">Your rank</span>
        <span className="text-white font-semibold">#{userRank && userRank > 0 ? userRank : '—'} <span className="text-gray-500 font-normal">of {total} ranked</span></span>
      </div>

      {loading && data.length === 0 ? (
        <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-3 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
            <div className="md:col-span-1">Rank</div>
            <div className="md:col-span-6">User</div>
            <div className="md:col-span-2 text-center">Solved</div>
            <div className="md:col-span-3 text-center">Acceptance</div>
          </div>
          <div className="divide-y divide-gray-800">
            {data.length === 0 && (
              <p className="text-gray-500 text-center py-10">No ranked users yet in this category.</p>
            )}
            {data.map((entry) => {
              const isMe = entry.userId === user?.id;
              const rankStyle = entry.rank <= 3 ? RANK_BG[entry.rank] : '';
              return (
                <div
                  key={entry.userId}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 items-center transition-colors ${isMe ? 'bg-blue-900/20 border-l-2 border-blue-500' : rankStyle}`}
                >
                  <div className="md:col-span-1 flex items-center justify-center md:justify-start">
                    {getRankBadge(entry.rank)}
                  </div>
                  <div className="md:col-span-6">
                    <p className="text-white text-sm font-medium truncate">
                      {entry.name || 'Unknown'}
                      {isMe && <span className="text-blue-400 text-xs ml-1">(You)</span>}
                    </p>
                  </div>
                  <div className="md:col-span-2 text-center">
                    <span className="text-white font-bold">{entry.solvedCount}</span>
                  </div>
                  <div className="md:col-span-3 text-center">
                    <span className="text-sm text-gray-300">{entry.acceptanceRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={BUTTON_CLASSES.secondary}>Previous</button>
          <span className="px-4 py-2 text-gray-400 text-sm">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className={BUTTON_CLASSES.secondary}>Next</button>
        </div>
      )}
    </div>
  );
}
