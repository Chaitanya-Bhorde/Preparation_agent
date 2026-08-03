import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getPracticeLanguages } from '../../api';
import { CARD_CLASSES } from '../../utils/ui';

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#ec4899'];

export default function LanguageBreakdown({ userId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLanguages();
  }, [userId]);

  const loadLanguages = async () => {
    try {
      setLoading(true);
      const { data: res } = await getPracticeLanguages(userId);
      setData(res.data || []);
    } catch (error) {
      console.error('Failed to load languages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={CARD_CLASSES}>
        <h3 className="text-lg font-semibold text-white mb-4">Languages</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={CARD_CLASSES}>
        <h3 className="text-lg font-semibold text-white mb-4">Languages</h3>
        <p className="text-gray-500 text-sm">No data yet</p>
      </div>
    );
  }

  return (
    <div className={CARD_CLASSES}>
      <h3 className="text-lg font-semibold text-white mb-4">Languages</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="language" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
              formatter={(value) => [`${value} problems`, 'Solved']}
            />
            <Bar dataKey="solvedCount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {data.map((item, idx) => (
          <span key={item.language} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
            {item.language}: {item.solvedCount}
          </span>
        ))}
      </div>
    </div>
  );
}
