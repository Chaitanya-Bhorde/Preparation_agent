import { useState, useEffect } from 'react';
import { getLeaderboard, getMyLeaderboardStats } from '../api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Medal, TrendingUp, Users, Loader2, Crown, Star, Zap, Award } from 'lucide-react';
import { PAGE_CONTAINER, LOADING_SPINNER, BUTTON_CLASSES } from '../utils/ui';

const RANK_COLORS = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-orange-400',
};

const RANK_BG = {
  1: 'bg-yellow-900/20 border-yellow-500/30',
  2: 'bg-gray-800/50 border-gray-500/30',
  3: 'bg-orange-900/20 border-orange-500/30',
};

const RANK_ICONS = {
  1: Crown,
  2: Medal,
  3: Award,
};

export default function Leaderboard() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadLeaderboard();
    loadMyStats();
  }, [period, page]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const { data: res } = await getLeaderboard({ period, page, limit: 50 });
      setData(res.data || []);
      setTotalPages(res.totalPages || 1);
      setMyRank(res.userRank);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyStats = async () => {
    try {
      const { data: res } = await getMyLeaderboardStats();
      setMyStats(res.data);
    } catch (error) {
      console.error('Failed to load my stats:', error);
    }
  };

  const periods = [
    { value: 'all', label: 'All Time', icon: Trophy },
    { value: 'monthly', label: 'This Month', icon: TrendingUp },
    { value: 'weekly', label: 'This Week', icon: Zap },
  ];

  const getRankDisplay = (index) => {
    const rank = (page - 1) * 50 + index + 1;
    if (rank <= 3) {
      const Icon = RANK_ICONS[rank];
      return <Icon className={`w-5 h-5 ${RANK_COLORS[rank]}`} />;
    }
    return <span className="text-gray-500 text-sm w-5 text-center">{rank}</span>;
  };

  if (loading && data.length === 0) {
    return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  }

  return (
    <div className={PAGE_CONTAINER}>
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8" /> Leaderboard
        </h1>
        <p className="text-yellow-100">Compete with peers and track your ranking</p>
      </div>

      {/* My Rank Card */}
      {myStats && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <div>
                <p className="text-white font-semibold">{user?.name}</p>
                <p className="text-gray-400 text-sm">Rank #{myRank || '-'} • {myStats.totalSolved || 0} solved</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-400">Streak</p>
                <p className="text-white font-bold">{myStats.streak || 0}d</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">ATS</p>
                <p className="text-white font-bold">{myStats.atsScore || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Rate</p>
                <p className="text-white font-bold">{myStats.acceptanceRate || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Period Tabs */}
      <div className="flex gap-2 mb-6">
        {periods.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.value}
              onClick={() => { setPeriod(p.value); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Leaderboard List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-800/50 text-gray-400 text-xs font-medium uppercase tracking-wider">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">User</div>
          <div className="col-span-2 text-center">Solved</div>
          <div className="col-span-2 text-center">Acceptance</div>
          <div className="col-span-1 text-center">Streak</div>
          <div className="col-span-2 text-center">ATS Score</div>
        </div>
        <div className="divide-y divide-gray-800">
          {data.map((entry, index) => {
            const rank = (page - 1) * 50 + index + 1;
            const isMe = entry.user?._id === user?.id;
            const rankStyle = rank <= 3 ? RANK_BG[rank] : '';
            return (
              <div
                key={entry._id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 items-center transition-colors ${
                  isMe ? 'bg-blue-900/20 border-l-2 border-blue-500' : `hover:bg-gray-800/50 ${rankStyle}`
                }`}
              >
                <div className="md:col-span-1 flex items-center justify-center md:justify-start">
                  {getRankDisplay(index)}
                </div>
                <div className="md:col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">
                        {entry.user?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {entry.user?.name || 'Unknown'}
                        {isMe && <span className="text-blue-400 text-xs ml-1">(You)</span>}
                      </p>
                      <p className="text-gray-500 text-xs truncate">
                        {entry.user?.profile?.college || ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 text-center">
                  <span className="text-white font-bold">{entry.totalSolved || 0}</span>
                  <div className="text-xs text-gray-500">
                    E:{entry.easySolved || 0} M:{entry.mediumSolved || 0} H:{entry.hardSolved || 0}
                  </div>
                </div>
                <div className="md:col-span-2 text-center">
                  <span className="text-sm text-gray-300">{entry.acceptanceRate || 0}%</span>
                </div>
                <div className="md:col-span-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span className="text-sm text-gray-300">{entry.streak || 0}</span>
                  </div>
                </div>
                <div className="md:col-span-2 text-center">
                  <span className="text-sm text-gray-300">{entry.atsScore || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className={BUTTON_CLASSES.secondary}
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-400 text-sm">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className={BUTTON_CLASSES.secondary}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}