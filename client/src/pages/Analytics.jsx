import { useState, useEffect } from 'react';
import { getAnalytics, exportProgress } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Code2, Award, Target, Loader2, Database, Brain, Download, Calendar } from 'lucide-react';
import CalendarHeatmap from '../components/CalendarHeatmap';
import { SkeletonStats, SkeletonChart, SkeletonCard } from '../components/Skeleton';
import { usePageTitle } from '../hooks/usePageTitle';
import { PAGE_CONTAINER, STAT_CARD_CLASSES, LOADING_SPINNER } from '../utils/ui';
const COLORS = ['#22c55e', '#eab308', '#ef4444'];
const RADIAN = Math.PI / 2;

export default function Analytics() {
  usePageTitle('Analytics');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [range, setRange] = useState('monthly');

  useEffect(() => {
    loadAnalytics();
  }, [range]);

  useEffect(() => {
    const handler = () => { loadAnalytics(); };
    window.addEventListener('profile-updated', handler);
    return () => window.removeEventListener('profile-updated', handler);
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const { data: res } = await getAnalytics({ range });
      setData(res.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportProgress = async () => {
    try {
      const { data } = await exportProgress();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'prepagent-progress.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export progress:', error);
    }
  };

  if (loading) {
    return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  }

  const difficultyData = data?.difficultyDistribution ? [
    { name: 'Easy', value: data.difficultyDistribution.easy },
    { name: 'Medium', value: data.difficultyDistribution.medium },
    { name: 'Hard', value: data.difficultyDistribution.hard },
  ] : [];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'dsa', label: 'DSA', icon: Code2 },
    { key: 'sql', label: 'SQL', icon: Database },
    { key: 'aptitude', label: 'Aptitude', icon: Brain },
  ];

  const catData = (key) => data?.[key] || { totalSolved: 0, totalAccepted: 0, rangeSolved: 0, rangeAccepted: 0, acceptanceRate: 0, topics: [] };

  return (
    <div className={PAGE_CONTAINER}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Your Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-900 rounded-lg border border-gray-700 p-1">
            {['weekly', 'monthly', 'all-time'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  range === r ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {r === 'weekly' ? 'Weekly' : r === 'monthly' ? 'Monthly' : 'All Time'}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportProgress}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs hover:bg-gray-700 transition-colors"
          >
            <Download className="w-3 h-3" /> Export
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={STAT_CARD_CLASSES}>
              <div className="flex items-center gap-3 mb-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400 text-sm">Total Solved</span>
              </div>
              <p className="text-2xl font-bold text-white">{data?.overallStats?.totalSolved || 0}</p>
            </div>
            <div className={STAT_CARD_CLASSES}>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-gray-400 text-sm">Acceptance Rate</span>
              </div>
              <p className="text-2xl font-bold text-white">{data?.overallStats?.acceptanceRate || 0}%</p>
            </div>
            <div className={STAT_CARD_CLASSES}>
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-purple-400" />
                <span className="text-gray-400 text-sm">Total Submissions</span>
              </div>
              <p className="text-2xl font-bold text-white">{data?.overallStats?.totalSubmissions || 0}</p>
            </div>
            <div className={STAT_CARD_CLASSES}>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-400 text-sm">Your Rank</span>
              </div>
              <p className="text-2xl font-bold text-white">#{data?.rank || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-4">Difficulty Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={difficultyData} cx="50%" cy="50%" labelLine={false} label={renderCustomLabel}
                    outerRadius={100} fill="#8884d8" dataKey="value">
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500"></div><span className="text-gray-400 text-sm">Easy: {data?.difficultyDistribution?.easy || 0}</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-yellow-500"></div><span className="text-gray-400 text-sm">Medium: {data?.difficultyDistribution?.medium || 0}</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500"></div><span className="text-gray-400 text-sm">Hard: {data?.difficultyDistribution?.hard || 0}</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-4">Topic Performance</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(data?.topicPerformance || []).slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <YAxis dataKey="topic" type="category" stroke="#6b7280" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="successRate" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Daily Activity (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.dailyActivity || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={(val) => val.slice(5)} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="submissions" stroke="#3b82f6" strokeWidth={2} dot={false} name="Submissions" />
                <Line type="monotone" dataKey="accepted" stroke="#22c55e" strokeWidth={2} dot={false} name="Accepted" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Contribution Heatmap (Last 12 Months)</h2>
            <CalendarHeatmap data={data?.heatmapData || {}} />
          </div>
        </>
      )}

      {activeTab === 'dsa' && (
        <CategorySection title="DSA Analytics" icon={Code2} data={catData('dsa')} color="#3b82f6" />
      )}

      {activeTab === 'sql' && (
        <CategorySection title="SQL Analytics" icon={Database} data={catData('sql')} color="#22c55e" />
      )}

      {activeTab === 'aptitude' && (
        <CategorySection title="Aptitude Analytics" icon={Brain} data={catData('aptitude')} color="#a855f7" />
      )}
    </div>
  );
}

function CategorySection({ title, icon: Icon, data, color }) {
  const weakTopics = data.topics.filter(t => t.successRate < 50).map(t => t.topic);
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={STAT_CARD_CLASSES}>
          <div className="flex items-center gap-3 mb-2">
            <Icon className="w-5 h-5" style={{ color }} />
            <span className="text-gray-400 text-sm">Total Solved</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.totalSolved}</p>
        </div>
        <div className={STAT_CARD_CLASSES}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-gray-400 text-sm">Accepted</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.totalAccepted}</p>
        </div>
        <div className={STAT_CARD_CLASSES}>
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Range Solved</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.rangeSolved}</p>
        </div>
        <div className={STAT_CARD_CLASSES}>
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-purple-400" />
            <span className="text-gray-400 text-sm">Acceptance</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.acceptanceRate}%</p>
        </div>
      </div>

      {weakTopics.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Weak Areas (Below 50%)</h2>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((t) => (
              <span key={t} className="px-3 py-1 bg-red-900/30 text-red-400 rounded-full text-xs">{t}</span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Topic-wise Breakdown</h2>
        {data.topics.length > 0 ? (
          <div className="space-y-3">
            {data.topics.map((t) => (
              <div key={t.topic} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-300 capitalize">{t.topic}</span>
                    <span className="text-xs text-gray-500">{t.accepted}/{t.total} solved</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${t.successRate}%`,
                        backgroundColor: t.successRate >= 70 ? '#22c55e' : t.successRate >= 40 ? '#eab308' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
                <span className={`ml-3 text-xs font-medium ${
                  t.successRate >= 70 ? 'text-green-400' : t.successRate >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {t.successRate}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No data yet. Start solving problems!</p>
        )}
      </div>
    </div>
  );
}