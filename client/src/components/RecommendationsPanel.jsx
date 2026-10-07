import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Loader2, AlertCircle, Sparkles, ArrowRight, Target, Trophy, X, RotateCcw } from 'lucide-react';
import { getRecommendations } from '../api';
import { CARD_CLASSES } from '../utils/ui';
import {
  onAnalyticsUpdated,
  isSuggestionDismissed,
  dismissSuggestion,
  getDismissedSuggestions,
  clearDismissedSuggestions,
  suggestionId,
} from '../utils/analyticsEvents';

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

function RecommendationRow({ item, onDismiss }) {
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
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.path && (
            <Link
              to={item.path}
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              Practise <ArrowRight className="w-3 h-3" />
            </Link>
          )}
          {/* Suggestion dismiss (X): removes the card immediately and persists
              in localStorage so it stays hidden across reloads. */}
          <button
            type="button"
            onClick={() => onDismiss(item)}
            aria-label={`Dismiss suggestion: ${item.title}`}
            title="Dismiss this suggestion"
            className="p-1 rounded text-gray-500 hover:text-red-300 hover:bg-red-900/30 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
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
  // Bumped on every dismiss/restore so the visible list re-derives from
  // localStorage without refetching the server.
  const [dismissVersion, setDismissVersion] = useState(0);

  // Latest-wins guard: with rapid consecutive events, an older in-flight
  // response must never overwrite newer data (or a newer error).
  const loadSeqRef = useRef(0);

  const load = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    const seq = ++loadSeqRef.current;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await getRecommendations();
      if (seq !== loadSeqRef.current) return; // a newer refetch superseded this one
      setData(res.data?.data || null);
      setError(null);
    } catch (e) {
      if (seq !== loadSeqRef.current) return; // stale failure must not clobber newer data
      // A recommendation failure only affects this card — it must never break
      // the dashboard, and analytics themselves stay LLM-free.
      setError(e.response?.data?.message || 'Could not load recommendations.');
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time analytics: silently refetch (no spinner flash) whenever a
  // submission event reports that the DB now holds new records.
  useEffect(() => onAnalyticsUpdated(() => load({ silent: true })), [load]);

  const handleDismiss = useCallback((item) => {
    dismissSuggestion(item);
    setDismissVersion((v) => v + 1);
  }, []);

  const handleRestore = useCallback(() => {
    clearDismissedSuggestions();
    setDismissVersion((v) => v + 1);
  }, []);

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

  const allRecommendations = data?.recommendations || [];
  const recommendations = allRecommendations.filter((item) => !isSuggestionDismissed(item));
  const strongTopics = data?.ml?.strongTopics || [];
  const dismissedCount = Object.keys(getDismissedSuggestions()).length;
  const dismissedBadge = dismissedCount > 0 ? (
    <button
      type="button"
      onClick={handleRestore}
      className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors"
      title="Restore all dismissed suggestions"
    >
      <RotateCcw className="w-3 h-3" /> Restore ({dismissedCount})
    </button>
  ) : null;

  return (
    <div className={CARD_CLASSES}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" /> Recommended for you
          </h3>
          {data?.source === 'python-ml' && (
            <p className="text-[11px] text-gray-500 mb-4">
              Ranked from your real practice history by the Python ML service.
            </p>
          )}
        </div>
        {dismissVersion > 0 && dismissedBadge}
      </div>

      {!data?.hasEnoughData || allRecommendations.length === 0 ? (
        <div className="py-6 text-center">
          <Brain className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            {data?.message
              || 'No performance data yet. Complete a few practice questions or a mock interview to receive personalized recommendations.'}
          </p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-6 text-center">
          <Brain className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            All suggestions dismissed. Restore them or practice more to see new ones.
          </p>
          <button
            type="button"
            onClick={handleRestore}
            className="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            <RotateCcw className="w-3 h-3" /> Restore dismissed suggestions
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((item, i) => (
            <RecommendationRow
              key={`${suggestionId(item)}-${i}`}
              item={item}
              onDismiss={handleDismiss}
            />
          ))}
          {dismissedBadge && (
            <div className="text-center text-[11px] text-gray-500">{dismissedBadge}</div>
          )}
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