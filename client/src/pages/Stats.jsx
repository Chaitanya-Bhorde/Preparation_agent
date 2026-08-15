import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, CheckCircle, Clock, BarChart2, TrendingUp, User, Calendar, PieChart, Globe, Heart } from 'lucide-react';
import { DIFFICULTY_COLORS, BUTTON_CLASSES, SELECT_CLASSES } from '../utils/ui';
import { useDebounce } from '../hooks/useDebounce';
import { LOADING_SPINNER, LOADING_BAR } from '../utils/ui';

const STATS_TIMEOUT = 10000;

export default function Stats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetch('/api/analytics/my-stats', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Failed to load stats');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
    setTimeout(() => setRefreshing(false), STATS_TIMEOUT);
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-200 mb-4">Statistics</h2>
        <p className="text-gray-500">Log in to view your stats</p>
      </div>
    );
  }

  if (loading && !refreshing) {
    return (
      <div className="p-8">
        <LOADING_SPINNER>
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <span className="ml-2 text-gray-400">Loading stats...</span>
        </LOADING_SPINNER>
      </div>
    );
  }

  if (refreshing) {
    return (
      <div className="p-8">
        <LOADING_BAR>
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <span className="ml-2 text-gray-400">Refreshing stats...</span>
        </LOADING_BAR>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-900/20 border border-red-800 rounded-lg">
        <h3 className="text-red-400 mb-2">Error</h3>
        <p className="text-gray-300">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-3 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No stats available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 min-h-[600px]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Overall Stats */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-3">Overall Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-xs uppercase">Problems Solved</p>
              <p className="text-3xl font-bold text-white">{stats.problemsSolved ?? 0}/{stats.totalProblems || 51}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs acceptance-rate">Acceptance Rate</p>
              <p className="text-3xl font-bold {stats.acceptanceRate >= 70 ? 'text-green-400' : stats.acceptanceRate >= 40 ? 'text-yellow-400' : 'text-red-400'}">{stats.acceptanceRate ?? 0}%</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Total Submissions</p>
              <p className="text-3xl font-bold text-white">{stats.totalSubmissions ?? 0}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-gray-400 text-xs">Streak</p>
            <p className="text-2xl font-bold text-green-400">{stats.streak ?? 0} days</p>
          </div>
        </div>
      </div>

      {/* Card 2: Difficulty Breakdown */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4">
        <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-3">Difficulty Breakdown</h3>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-xs font-medium text-green-400">Easy</span>
            <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden mt-1">
              <div className={`h-full bg-green-500 rounded-full transition-width duration-300`} style={{ width: `${stats.easySolved / 20 * 100}%` }} />
            </div>
            <span className="text-xs text-gray-300">({(stats.easySolved / 20 * 100 || 0)}%)</span>
          </div>
          <div>
            <span className="text-xs font-medium text-yellow-400">Medium</span>
            <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden mt-1">
              <div className={`h-full bg-yellow-500 rounded-full transition-width duration-300`} style={{ width: `${stats.mediumSolved / 20 * 100}%` }} />
            </div>
            <span className="text-xs text-gray-300">({(stats.mediumSolved / 20 * 100 || 0)}%)</span>
          </div>
          <div>
            <span className="text-xs font-medium text-red-400">Hard</span>
            <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden mt-1">
              <div className={`h-full bg-red-500 rounded-full transition-width duration-300`} style={{ width: `${stats.hardSolved / 11 * 100}%` }} />
            </div>
            <span className="text-xs text-gray-300">({(stats.hardSolved / 11 * 100 || 0)}%)</span>
          </div>
        </div>
      </div>
    </div>

    {/* Card 3: Category Breakdown */}
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4">
      <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-3">Category Breakdown</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-300 truncate">Arrays</span>
          <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden mt-1">
            <div className={`h-full bg-green-500 rounded-full transition-width duration-300`} style={{ width: `${(stats.arraysSolved ?? 0) / 8 * 100}%` }} />
          </div>
          <span className="text-xs text-gray-300">{(stats.arraysSolved ?? 0) / 8 * 100 || 0}%</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-300 truncate">Trees</span>
          <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden mt-1">
            <div className={`h-full bg-green-500 rounded-full transition-width duration-300`} style={{ width: `${(stats.treesSolved ?? 0) / 5 * 100}%` }} />
          </div>
          <span className="text-xs text-gray-300">{(stats.treesSolved ?? 0) / 5 * 100 || 0}%</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-300 truncate">Graphs</span>
          <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden mt-1">
            <div className={`h-full bg-green-500 rounded-full transition-width duration-300`} style={{ width: `${(stats.graphsSolved ?? 0) / 6 * 100}%` }} />
          </div>
          <span className="text-xs text-gray-300">{(stats.graphsSolved ?? 0) / 6 * 100 || 0}%</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-300 truncate">DP</span>
          <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden mt-1">
            <div className={`h-full bg-green-500 rounded-full transition-width duration-300`} style={{ width: `${(stats.dpSolved ?? 0) / 8 * 100}%` }} />
          </div>
          <span className="text-xs text-gray-300">{(stats.dpSolved ?? 0) / 8 * 100 || 0}%</span>
        </div>
      </div>
    </div>
  </div>

  {/* Card 4: Company-wise */}
  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4">
    <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-3">Company-wise</h3>
    <div className="grid grid-cols-3 gap-2">
      <div className="flex flex-col items-start">
        <span className="text-xs text-gray-300">Cognizant</span>
        <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full bg-green-500 rounded-full transition-width duration-300`} style={{ width: `${(stats.cognizant ?? 0) / 10 * 100}%` }} />
        </div>
        <span className="text-xs text-gray-300">{(stats.cognizant ?? 0) / 10 * 100 || 0}%</span>
      </div>
      <div className="flex flex-col items-start">
        <span className="text-xs text-gray-300">Godrej</span>
        <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full bg-green-500 rounded-full transition-width duration-300`} style={{ width: `${(stats.godrej ?? 0) / 5 * 100}%` }} />
        </div>
        <span className="text-xs text-gray-300">{(stats.godrej ?? 0) / 5 * 100 || 0}%</span>
      </div>
      <div className="flex flex-col items-start">
        <span className="text-xs text-gray-300">TCS</span>
        <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full bg-green-500 rounded-full transition-width duration-300`} style={{ width: `${(stats.tcs ?? 0) / 12 * 100}%` }} />
        </div>
        <span className="text-xs text-gray-300">{(stats.tcs ?? 0) / 12 * 100 || 0}%</span>
      </div>
    </div>
  </div>

  {/* Card 5: Recent Activity */}
  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4">
    <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-3">Recent Activity</h3>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Last submitted:</span>
        <span className="text-white font-medium">{stats.lastSubmitted || '—'}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">This week:</span>
        <span className="text-white font-medium">{stats.thisWeek || 0}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">This month:</span>
        <span className="text-white font-medium">{stats.thisMonth || 0}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Last solved:</span>
        <span className="text-white font-medium">{stats.lastSolved || '—'}</span>
      </div>
    </div>
  </div>

  {/* Card 6: Heatmap */}
  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4">
    <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-3">Activity Heatmap</h3>
    <CalendarHeatmap data={stats.heatmapData || []} />
  </div>
}

const CalendarHeatmap = ({ data }) => {
  const heatmapData = data.map((day) => ({
    date: new Date(day.date),
    count: day.count || 0,
  }));

  return (
    <div className="grid grid-cols-7 gap-1 grid-rows-6 bg-gray-800 p-1">
      <div className="text-xs text-gray-400">Sun</div>
      <div className="text-xs text-gray-400">Mon</div>
      <div className="text-xs text-gray-400">Tue</div>
      <div className="text-xs text-gray-400">Wed</div>
      <div className="text-xs text-gray-400">Thu</div>
      <div className="text-xs text-gray-400">Fri</div>
      <div className="text-xs text-gray-400">Sat</div>
      {heatmapData.map((day) => {
        const maxCount = Math.max(...heatmapData.map((d) => d.count), 1);
        const intensity = Math.min((day.count / maxCount) * 4, 4);
        const colors = ['text-gray-300', 'text-green-300', 'text-green-500', 'text-green-700'];
        return (
          <div
            key={day.date}
            className={`h-2 bg-gray-800 rounded ${colors[intensity]}`
          } style={{ height: `${intensity * 10 + 4}px` }} />
        );
      })}
    </div>
  );
};
