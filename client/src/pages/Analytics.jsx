import { useState, useEffect } from 'react';
import { getAnalytics } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Code2, Award, Target, Loader2 } from 'lucide-react';
const COLORS = ['#22c55e', '#eab308', '#ef4444'];
const RADIAN = Math.PI / 180;
export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadAnalytics();
  }, []);
  const loadAnalytics = async () => {
    try {
      const { data: res } = await getAnalytics();
      setData(res.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
    </div>;
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
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Your Analytics</h1>
      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Total Solved</span>
          </div>
          <p className="text-2xl font-bold text-white">{data?.overallStats?.totalSolved || 0}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-gray-400 text-sm">Acceptance Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">{data?.overallStats?.acceptanceRate || 0}%</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-purple-400" />
            <span className="text-gray-400 text-sm">Total Submissions</span>
          </div>
          <p className="text-2xl font-bold text-white">{data?.overallStats?.totalSubmissions || 0}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-yellow-400" />
            <span className="text-gray-400 text-sm">Your Rank</span>
          </div>
          <p className="text-2xl font-bold text-white">#{data?.rank || '-'}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {}
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
        {}
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
      {}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
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
    </div>
  );
}