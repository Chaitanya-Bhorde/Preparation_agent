import { useState, useEffect } from 'react';
import { Loader2, BrainCircuit, Target, Trophy, Flame, Gauge, Star, Award } from 'lucide-react';
import { getAptitudeProgress } from '../../api';
import { CARD_CLASSES } from '../../utils/ui';

const BADGES = [
  { id: 'first-hundred', name: 'First Hundred', icon: '🎯', need: 100, scope: 'total' },
  { id: 'five-hundred', name: 'Five Hundred', icon: '⭐', need: 500, scope: 'total' },
  { id: 'thousand-master', name: 'Thousand Master', icon: '👑', need: 1000, scope: 'total' },
  { id: 'quantitative-master', name: 'Quantitative Master', icon: '🧮', need: 100, scope: 'quantitative' },
  { id: 'logical-king', name: 'Logical King', icon: '🧠', need: 100, scope: 'logical' },
  { id: 'verbal-ace', name: 'Verbal Ace', icon: '📚', need: 100, scope: 'verbal' },
];

export default function AptitudeAnalyticsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await getAptitudeProgress();
        if (live) setStats(res.data.data);
      } catch (e) {
        if (live) setError(e.response?.data?.message || 'Failed to load aptitude stats.');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  if (error) return <p className="text-red-300 text-sm">{error}</p>;
  if (!stats) return null;

  const earned = new Set((stats.badges || []).map(b => b.id));
  const cats = stats.categoryCounts || {};

  const cards = [
    { label: 'Attempted', value: stats.totalQuestionsAttempted, icon: BrainCircuit, accent: 'bg-purple-500/20 text-purple-400' },
    { label: 'Correct', value: stats.totalCorrect, icon: Target, accent: 'bg-green-500/20 text-green-400' },
    { label: 'Accuracy', value: `${stats.accuracy}%`, icon: Gauge, accent: 'bg-yellow-500/20 text-yellow-400' },
    { label: 'Mock Tests', value: stats.mockTestsTaken, icon: Trophy, accent: 'bg-blue-500/20 text-blue-400' },
    { label: 'Best Score', value: `${stats.bestScore}%`, icon: Award, accent: 'bg-pink-500/20 text-pink-400' },
    { label: 'Streak', value: stats.currentStreak, icon: Flame, accent: 'bg-orange-500/20 text-orange-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.accent} mb-2`}><Icon className="w-5 h-5" /></div>
              <p className="text-xl font-bold text-white">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={CARD_CLASSES}>
          <h3 className="text-lg font-semibold text-white mb-4">Section Breakdown</h3>
          <div className="space-y-4">
            {['quantitative', 'logical', 'verbal'].map(key => {
              const c = cats[key] || { attempted: 0, correct: 0 };
              const acc = c.attempted > 0 ? Math.round((c.correct / c.attempted) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-300 capitalize">{key}</span>
                    <span className="text-xs text-gray-500">{c.correct}/{c.attempted} · {acc}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${acc}%`, backgroundColor: acc >= 70 ? '#22c55e' : acc >= 40 ? '#eab308' : '#ef4444' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={CARD_CLASSES}>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" /> Badges</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BADGES.map(b => {
              const has = earned.has(b.id);
              const cur = b.scope === 'total' ? stats.totalCorrect : ((cats[b.scope] || {}).correct || 0);
              const pct = Math.min(100, Math.round((cur / b.need) * 100));
              return (
                <div key={b.id} className={`p-3 rounded-lg border ${has ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-gray-800'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xl ${has ? '' : 'grayscale opacity-40'}`}>{b.icon}</span>
                    <p className={`text-sm font-medium truncate ${has ? 'text-yellow-300' : 'text-gray-400'}`}>{b.name}</p>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${has ? 'bg-yellow-400' : 'bg-gray-600'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">{has ? 'Earned!' : `${cur}/${b.need}`}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}