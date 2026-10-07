import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2, AlertCircle, Trophy, TrendingUp, Lightbulb, ShieldCheck,
  Activity, RefreshCw, X, RotateCcw,
} from 'lucide-react';
import {
  getOverallPerformance,
  getTopicPerformance,
  getStrengths,
  getImprovements,
  getPersonalizedSuggestions,
} from '../api';
import { CARD_CLASSES } from '../utils/ui';
import {
  onAnalyticsUpdated,
  isSuggestionDismissed,
  dismissSuggestion,
  getDismissedSuggestions,
  clearDismissedSuggestions,
} from '../utils/analyticsEvents';

const NOT_ATTEMPTED = '—';

const SECTION_ORDER = [
  { key: 'dsa', label: 'DSA', accent: 'text-blue-400', bar: '#3b82f6' },
  { key: 'aptitude', label: 'Aptitude', accent: 'text-purple-400', bar: '#a855f7' },
  { key: 'sql', label: 'SQL', accent: 'text-emerald-400', bar: '#10b981' },
  { key: 'mockInterview', label: 'Mock Interview', accent: 'text-pink-400', bar: '#ec4899' },
];

const PRIORITY_STYLES = {
  HIGH: 'bg-red-900/30 text-red-300 border-red-700/50',
  MEDIUM: 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50',
  LOW: 'bg-gray-800 text-gray-300 border-gray-700',
};

function perfColor(value) {
  if (value >= 70) return 'text-green-400';
  if (value >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function barColor(value) {
  if (value >= 70) return '#22c55e';
  if (value >= 40) return '#eab308';
  return '#ef4444';
}

/** Five panels, each: { data, loading, error }. */
function createPanelStates() {
  return Array.from({ length: 5 }, () => ({ data: null, loading: true, error: null }));
}

/**
 * Turn one settled request into the matching panel state. A rejected request
 * becomes an explicit error for that panel only — it is never replaced with
 * stale or placeholder data.
 */
function toPanel(result) {
  if (result.status === 'fulfilled') {
    return { data: result.value?.data?.data ?? null, loading: false, error: null };
  }
  return {
    data: null,
    loading: false,
    error: result.reason?.response?.data?.message || 'Unable to load data.',
  };
}

/**
 * Renders exactly one of: loading / error / empty / children.
 * The three states are mutually exclusive and visually distinct, so a failed
 * request is never confused with "no data yet".
 */
function PanelState({ loading, error, onRetry, empty, emptyText, children }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-6 text-center" role="alert">
        <div className="flex items-center justify-center gap-2 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-200 hover:bg-gray-800"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        )}
      </div>
    );
  }
  if (empty) {
    return <p className="text-gray-500 text-sm py-6 text-center">{emptyText}</p>;
  }
  return children;
}

/** One section's score. `null` renders as an explicit "Not Attempted". */
function ScoreTile({ section, value }) {
  const missing = value === null || value === undefined;
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-semibold uppercase tracking-wide ${section.accent}`}>
          {section.label}
        </span>
        {missing ? (
          <span className="text-xs text-gray-600" title="Not Attempted">{NOT_ATTEMPTED}</span>
        ) : (
          <span className={`text-2xl font-bold ${perfColor(value)}`}>{value}</span>
        )}
      </div>
      {missing ? (
        <p className="text-[11px] text-gray-500 mt-1">Not Attempted</p>
      ) : (
        <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
          <div
            className="h-1.5 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: section.bar }}
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------- Overall Performance */

function OverallPerformance({ data, loading, error, onRetry }) {
  if (loading || error || !data?.hasAnyActivity) {
    return (
      <div className={CARD_CLASSES}>
        <h3 className="text-lg font-semibold text-white mb-1">Overall Performance</h3>
        <PanelState
          loading={loading}
          error={error}
          onRetry={onRetry}
          empty={!loading && !error && !data?.hasAnyActivity}
          emptyText={data?.emptyState}
        />
      </div>
    );
  }

  const overall = data.overall;

  return (
    <div className={CARD_CLASSES}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" /> Overall Performance
        </h3>
        {data.rank ? (
          <span className="text-xs text-gray-400">
            Rank <strong className="text-white">#{data.rank}</strong> of {data.totalRankedUsers}
          </span>
        ) : null}
      </div>

      <div className="flex items-end gap-4 mb-5">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Overall Score</p>
          <p className={`text-4xl font-bold ${overall === null ? 'text-gray-600' : perfColor(overall)}`}>
            {overall === null ? NOT_ATTEMPTED : overall}
          </p>
        </div>
        <p className="text-xs text-gray-500 pb-2">
          Based on {data.sectionsCompleted} of 4 sections attempted
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SECTION_ORDER.map((s) => (
          <ScoreTile key={s.key} section={s} value={data[s.key]} />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------- Topic Performance */

function TopicPerformance({ data, loading, error, onRetry }) {
  const sections = SECTION_ORDER.filter((s) => data?.sections?.[s.key]);

  return (
    <div className={CARD_CLASSES}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-400" /> Topic Performance
      </h3>
      <PanelState
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!loading && !error && !data?.hasAnyActivity}
        emptyText={data?.emptyState}
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {sections.map((s) => (
            <div key={s.key}>
              <p className={`text-sm font-semibold ${s.accent} mb-2`}>{s.label}</p>
              <div className="space-y-2">
                {data.sections[s.key].slice(0, 8).map((t) => (
                  <div key={`${s.key}-${t.topic}`}>
                    <div className="flex justify-between mb-1 text-xs">
                      <span className="text-gray-300 truncate">{t.topic}</span>
                      <span className="text-gray-500 ml-2 shrink-0">{t.acceptanceRate}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0, t.acceptanceRate))}%`,
                          backgroundColor: barColor(t.acceptanceRate),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PanelState>
    </div>
  );
}

/* --------------------------------------------------------- Your Strengths */

function Strengths({ data, loading, error, onRetry }) {
  const strengths = data?.strengths || [];

  return (
    <div className={CARD_CLASSES}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-green-400" /> Your Strengths
      </h3>
      <PanelState
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!loading && !error && strengths.length === 0}
        emptyText={data?.emptyState}
      >
        <ul className="space-y-2">
          {strengths.map((s) => (
            <li key={`${s.section}-${s.topic}`} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-gray-200 min-w-0">
                <span className="text-green-400">&#10003;</span>
                <span className="truncate">{s.topic}</span>
                <span className="text-[10px] uppercase tracking-wide text-gray-500 shrink-0">
                  {s.sectionLabel}
                </span>
              </span>
              <span className="text-green-400 font-medium shrink-0">{s.accuracy}%</span>
            </li>
          ))}
        </ul>
      </PanelState>
    </div>
  );
}

/* --------------------------------------------- Areas That Need Improvement */

function Improvements({ data, loading, error, onRetry }) {
  const rows = data?.weakAreas || [];

  return (
    <div className={CARD_CLASSES}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-orange-400" /> Areas That Need Improvement
      </h3>
      <PanelState
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!loading && !error && rows.length === 0}
        emptyText={data?.emptyState}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-800">
                <th className="py-2 pr-3">Section</th>
                <th className="py-2 pr-3">Topic</th>
                <th className="py-2 pr-3 text-right">Performance</th>
                <th className="py-2 pr-3 text-right">Attempts</th>
                <th className="py-2 pr-3">Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.section}-${r.topic}`} className="border-b border-gray-800/60 last:border-0">
                  <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">{r.sectionLabel}</td>
                  <td className="py-2 pr-3 text-gray-200">
                    {r.topic}
                    {!r.confirmed && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-500">
                        needs more data
                      </span>
                    )}
                  </td>
                  <td className={`py-2 pr-3 text-right font-medium ${perfColor(r.performance)}`}>
                    {r.performance}%
                  </td>
                  <td className="py-2 pr-3 text-right text-gray-400">{r.attempts}</td>
                  <td className="py-2 pr-3 text-gray-400">{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelState>
    </div>
  );
}

/* ------------------------------------------------- Personalized Suggestions */

function Suggestions({ data, loading, error, onRetry }) {
  const [, setDismissVersion] = useState(0);
  const rawBySection = data?.bySection || {};
  // Filter out dismissed suggestions (persisted in localStorage), so the X
  // hides a card immediately and keeps it hidden across reloads.
  const bySection = Object.fromEntries(
    Object.entries(rawBySection).map(([key, rows]) => [
      key,
      (rows || []).filter((r) => !isSuggestionDismissed({ ...r, section: key })),
    ])
  );
  const groups = SECTION_ORDER.filter((s) => (bySection[s.key] || []).length > 0);
  const dismissedCount = Object.keys(getDismissedSuggestions()).length;

  const handleDismiss = (key, r) => {
    dismissSuggestion({ ...r, section: key });
    setDismissVersion((v) => v + 1);
  };
  const handleRestore = () => {
    clearDismissedSuggestions();
    setDismissVersion((v) => v + 1);
  };

  return (
    <div className={CARD_CLASSES}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" /> Personalized Suggestions
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Derived from your own practice history — each suggestion names the topic and
            the real score behind it.
          </p>
        </div>
        {dismissedCount > 0 && (
          <button
            type="button"
            onClick={handleRestore}
            className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors"
            title="Restore all dismissed suggestions"
          >
            <RotateCcw className="w-3 h-3" /> Restore ({dismissedCount})
          </button>
        )}
      </div>
      <PanelState
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!loading && !error && !data?.hasAny}
        emptyText={data?.emptyState}
      >
        <div className="space-y-5">
          {groups.map((s) => (
            <div key={s.key}>
              <p className={`text-sm font-semibold ${s.accent} mb-2`}>{s.label}</p>
              <ul className="space-y-2">
                {bySection[s.key].map((r, i) => (
                  <li key={`${s.key}-${r.topic}-${i}`} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-medium text-white">{r.topic}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.priority && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[r.priority] || PRIORITY_STYLES.LOW}`}>
                            {r.priority}
                          </span>
                        )}
                        {/* Suggestion dismiss (X): immediate UI removal + persistence. */}
                        <button
                          type="button"
                          onClick={() => handleDismiss(s.key, r)}
                          aria-label={`Dismiss suggestion: ${r.topic}`}
                          title="Dismiss this suggestion"
                          className="p-1 rounded text-gray-500 hover:text-red-300 hover:bg-red-900/30 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {r.suggestion && <p className="text-xs text-gray-400 mt-1">{r.suggestion}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {(data?.crossDomain || []).length > 0 && (
            <div>
              <p className="text-sm font-semibold text-amber-400 mb-2">Across sections</p>
              <ul className="space-y-2">
                {data.crossDomain.map((r, i) => (
                  <li key={`${r.topic}-${i}`} className="rounded-lg border border-amber-700/40 bg-amber-900/10 p-3">
                    <p className="text-sm font-medium text-amber-200">{r.topic}</p>
                    <p className="text-xs text-amber-200/70 mt-1">{r.reason}</p>
                    {r.suggestion && <p className="text-xs text-gray-400 mt-1">{r.suggestion}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </PanelState>
    </div>
  );
}

/* ------------------------------------------------------------- container */

/**
 * PerformanceAnalyticsPanel
 *
 * Renders, in order:
 *   Overall Performance -> Topic Performance -> Your Strengths
 *   -> Areas That Need Improvement -> Personalized Suggestions
 *
 * Each panel owns its own loading / error / empty state so one failing request
 * never blanks the whole page, and so a failure is never masked by another
 * panel's data.
 */
export default function PerformanceAnalyticsPanel() {
  const [panels, setPanels] = useState(createPanelStates);

  /**
   * The five requests settle independently via `Promise.allSettled`, so one
   * rejected request marks only its own panel as errored instead of tearing
   * down the page or leaving a spinner running forever.
   */
  // Latest-wins guard: rapid consecutive submission events fire overlapping
  // refetch waves; the slower, older response must never win.
  const loadSeqRef = useRef(0);

  const load = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    const seq = ++loadSeqRef.current;
    if (!silent) setPanels(createPanelStates());
    const results = await Promise.allSettled([
      getOverallPerformance(),
      getTopicPerformance(),
      getStrengths(),
      getImprovements(),
      getPersonalizedSuggestions(),
    ]);
    if (seq !== loadSeqRef.current) return; // stale response loses to the newer one
    setPanels(results.map(toPanel));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time analytics: silently refresh all five panels when a submission
  // event reports new DB records — deterministic data only, no LLM calls.
  useEffect(() => onAnalyticsUpdated(() => load({ silent: true })), [load]);

  return (
    <div className="space-y-6">
      <OverallPerformance {...panels[0]} onRetry={load} />
      <TopicPerformance {...panels[1]} onRetry={load} />
      <Strengths {...panels[2]} onRetry={load} />
      <Improvements {...panels[3]} onRetry={load} />
      <Suggestions {...panels[4]} onRetry={load} />
    </div>
  );
}
