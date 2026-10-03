import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Loader2, AlertCircle, Sparkles, ArrowRight, Target, Trophy } from 'lucide-react';
import { getRecommendations } from '../api';
import { CARD_CLASSES } from '../utils/ui';

const PRIORITY_STYLES = {
  HIGH: 'bg-red-900/30 text-red-300 border-red-700/50',
  MEDIUM: 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50',
  LOW: 'bg-gray-800 text-gray-300 border-gray-700',
};

const DOMAIN_STYLES = {
  DSA: 'text-blue-400',
  SQL: 'text-emerald-400',
  Aptitude: 'text-purple-400',
  Interview: 'text-pink-400',
};

function RecommendationRow({ item }) {
  return (
    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-white">{item.title}</h4>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.LOW}`}>
              {item.priority}
            </span>
            <span className={`text-[10px] ${DOMAIN_STYLES[item.domain] || 'text-gray-400'}`}>
              {item.domain}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{item.reason}</p>
          {item.action && <p className="text-xs text-gray-500 mt-1">{item.action}</p>}
        </div>
        {item.path && (
          <Link
            to={item.path}
            className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            Practise <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {item.evidence && (
        <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 mt-2">
          <span>attempts: {item.evidence.attempts}</span>
          <span>solved: {item.evidence.solved}</span>
          <span>accuracy: {item.evidence.smoothedAccuracy}%</span>
          {item.evidence.recentAttempts > 0 && <span>recent: {item.evidence.recentAccuracy}%</span>}
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRecommendations();
      setData(res.data?.data || null);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load recommendations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className={CARD_CLASSES}>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" /> Recommended for you
        </h3>
        <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Building your recommendations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={CARD_CLASSES}>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" /> Recommended for you
        </h3>
        <div className="flex items-center gap-2 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={load} className="ml-2 text-xs underline hover:text-red-200">Retry</button>
        </div>
      </div>
    );
  }

  const recommendations = data?.recommendations || [];
  const strongTopics = data?.ml?.strongTopics || [];

  return (
    <div className={CARD_CLASSES}>
      <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-yellow-400" /> Recommended for you
      </h3>
      {data?.source === 'python-ml' && (
        <p className="text-[11px] text-gray-500 mb-4">
          Ranked from your real practice history by the Python ML service.
        </p>
      )}

      {!data?.hasEnoughData || recommendations.length === 0 ? (
        <div className="py-6 text-center">
          <Brain className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            {data?.message
              || 'No performance data yet. Complete a few practice questions or a mock interview to receive personalized recommendations.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((item, i) => (
            <RecommendationRow key={`${item.domain}-${item.topic}-${i}`} item={item} />
          ))}
        </div>
      )}

      {strongTopics.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-800">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Your strong topics
          </h4>
          <div className="flex flex-wrap gap-2">
            {strongTopics.map((s) => (
              <span key={`${s.domain}-${s.topic}`} className="text-xs bg-green-900/20 text-green-300 px-2 py-1 rounded flex items-center gap-1">
                <Target className="w-3 h-3" /> {s.topic} · {s.accuracy}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}