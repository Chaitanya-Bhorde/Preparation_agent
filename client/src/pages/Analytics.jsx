import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCategorySummary, getCategoryHeatmap, getCategoryTopics } from '../api';
import CalendarHeatmap from '../components/CalendarHeatmap';
import AptitudeAnalyticsPanel from '../components/aptitude/AptitudeAnalyticsPanel';
import { Loader2, TrendingUp, Code2, Database, Brain, CheckCircle2, Target, Gauge, Flame } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { PAGE_CONTAINER, LOADING_SPINNER, CARD_CLASSES } from '../utils/ui';

const TABS = [
  { key: 'overall', label: 'Overall', icon: TrendingUp },
  { key: 'dsa', label: 'DSA', icon: Code2 },
  { key: 'sql', label: 'SQL', icon: Database },
  { key: 'aptitude', label: 'Aptitude', icon: Brain },
];

const DIFF_COLORS = { easy: 'text-green-400', medium: 'text-yellow-400', hard: 'text-red-400' };
const DIFF_BARS = { easy: 'bg-green-500', medium: 'bg-yellow-500', hard: 'bg-red-500' };

function toCountMap(heatmap) {
  if (!heatmap) return {};
  const out = {};
  Object.entries(heatmap).forEach(([date, val]) => {
    out[date] = typeof val === 'object' && val !== null ? val.count : val;
  });
  return out;
}

function SummaryCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function Analytics() {
  usePageTitle('Analytics');
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState('overall');
  const [summary, setSummary] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || authLoading) return;
    loadTab(activeTab);
  }, [activeTab, userId, authLoading]);

  const loadTab = async (category) => {
    setLoading(true);
    try {
      const [s, h, t] = await Promise.all([
        getCategorySummary(category, userId),
        getCategoryHeatmap(category, userId),
        getCategoryTopics(category, userId),
      ]);
      setSummary(s.data.data);
      setHeatmap(h.data.data);
      setTopics(t.data.data.topics || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setSummary(null); setHeatmap(null); setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className={PAGE_CONTAINER}><div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div></div>;
  }

  if (!userId) {
    return <div className={PAGE_CONTAINER}><p className="text-gray-400">Please log in to view analytics.</p></div>;
  }

  const difficulty = summary?.difficulty || { easy: 0, medium: 0, hard: 0 };
  const maxDiff = Math.max(difficulty.easy, difficulty.medium, difficulty.hard, 1);

  return (
    <div className={PAGE_CONTAINER}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === t.key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'aptitude' ? (
        <AptitudeAnalyticsPanel />
      ) : loading ? (
        <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard label="Problems Solved" value={summary?.totalSolved || 0} icon={CheckCircle2} accent="bg-green-500/20 text-green-400" />
            <SummaryCard label="Total Attempts" value={summary?.totalSubmissions || 0} icon={Target} accent="bg-blue-500/20 text-blue-400" />
            <SummaryCard label="Acceptance Rate" value={`${summary?.acceptanceRate || 0}%`} icon={Gauge} accent="bg-yellow-500/20 text-yellow-400" />
            <SummaryCard label="Current Streak" value={`${heatmap?.currentStreak || 0}d`} icon={Flame} accent="bg-orange-500/20 text-orange-400" />
          </div>

          {/* Difficulty distribution */}
          <div className={CARD_CLASSES}>
            <h3 className="text-lg font-semibold text-white mb-4">Difficulty Breakdown</h3>
            <div className="space-y-3">
              {['easy', 'medium', 'hard'].map((d) => (
                <div key={d} className="flex items-center gap-3">
                  <span className={`w-16 text-sm capitalize ${DIFF_COLORS[d]}`}>{d}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-full rounded-full ${DIFF_BARS[d]}`} style={{ width: `${(difficulty[d] / maxDiff) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right text-sm text-gray-300">{difficulty[d]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap */}
          <div className={CARD_CLASSES}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Activity Heatmap</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-orange-400 flex items-center gap-1"><Flame className="w-4 h-4" /> {heatmap?.currentStreak || 0} current</span>
                <span className="text-purple-400 flex items-center gap-1"><Flame className="w-4 h-4" /> {heatmap?.maxStreak || 0} max</span>
              </div>
            </div>
            <CalendarHeatmap data={toCountMap(heatmap?.heatmap)} />
          </div>

          {/* Topic breakdown */}
          <div className={CARD_CLASSES}>
            <h3 className="text-lg font-semibold text-white mb-4">Topics</h3>
            {topics.length === 0 ? (
              <p className="text-gray-500 text-sm">No data yet. Start solving problems!</p>
            ) : (
              <div className="space-y-3">
                {topics.map((t) => (
                  <div key={t.topic} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300 capitalize">{t.topic}</span>
                        <span className="text-xs text-gray-500">{t.solved}/{t.total} solved · E:{t.difficulty.easy} M:{t.difficulty.medium} H:{t.difficulty.hard}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${t.acceptanceRate}%`,
                            backgroundColor: t.acceptanceRate >= 70 ? '#22c55e' : t.acceptanceRate >= 40 ? '#eab308' : '#ef4444',
                          }}
                        />
                      </div>
                    </div>
                    <span className={`ml-3 text-xs font-medium ${t.acceptanceRate >= 70 ? 'text-green-400' : t.acceptanceRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {t.acceptanceRate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
