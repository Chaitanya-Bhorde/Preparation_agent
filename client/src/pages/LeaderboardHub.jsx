import { useState, useEffect } from 'react';
import { Loader2, Trophy, Code2, BrainCircuit, Database, AlertCircle } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { PAGE_CONTAINER, LOADING_SPINNER, CARD_CLASSES } from '../utils/ui';
import { getLeaderboardSection } from '../api';

const TABS = [
  { key: 'dsa', label: 'DSA', icon: Code2, color: 'text-blue-400', metric: 'problems solved' },
  { key: 'aptitude', label: 'Aptitude', icon: BrainCircuit, color: 'text-purple-400', metric: 'correct answers' },
  { key: 'sql', label: 'SQL', icon: Database, color: 'text-emerald-400', metric: 'problems solved' },
];

export default function LeaderboardHub() {
  usePageTitle('Leaderboard');
  const [tab, setTab] = useState('dsa');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getLeaderboardSection(tab, { limit: 50 });
        if (!live) return;
        setRows(res.data.leaderboard || []);
      } catch (e) {
        if (live) setError(e.response?.data?.error || 'Failed to load leaderboard.');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [tab]);

  return (
    <div className={PAGE_CONTAINER}>
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-7 h-7 text-yellow-400" />
        <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${active ? `bg-gray-800 border-gray-500 ${t.color}` : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'}`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className={CARD_CLASSES + ' text-center'}>
          <p className="text-gray-400">No rankings yet for this section. Be the first to practice!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((u, i) => {
            const rank = i + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
            return (
              <div
                key={(u.userId || u._id || '') + '-' + rank}
                className={`flex items-center gap-4 bg-gray-900 border rounded-xl px-4 py-3 ${rank <= 3 ? 'border-yellow-500/30' : 'border-gray-800'}`}
              >
                <span className={`w-8 text-center font-bold shrink-0 ${rank <= 3 ? 'text-lg' : 'text-gray-500'}`}>
                  {medal || rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium truncate">{u.username || u.name || 'Anonymous'}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                {tab === 'dsa' && (
                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <span className="text-blue-400 font-semibold">{u.totalProblems ?? 0} solved</span>
                    <span className="text-gray-500">{u.acceptanceRate ?? 0}% acc</span>
                    <span className="hidden sm:inline text-green-400">E:{u.easyCount ?? 0} M:{u.mediumCount ?? 0} H:{u.hardCount ?? 0}</span>
                  </div>
                )}
                {tab === 'aptitude' && (
                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <span className="text-purple-400 font-semibold">{u.questionsCorrect ?? 0} correct</span>
                    <span className="text-gray-500">{u.accuracy ?? 0}% acc</span>
                    <span className="hidden sm:inline text-gray-400">best {u.bestScore ?? 0}% · {u.mockTestsCompleted ?? 0} mocks</span>
                  </div>
                )}
                {tab === 'sql' && (
                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <span className="text-emerald-400 font-semibold">{u.solvedCount ?? 0} solved</span>
                    <span className="text-gray-500">{u.acceptanceRate ?? 0}% acc</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}