/**
 * analyticsEvents — one tiny client-side event bus for real-time analytics.
 *
 * Flow (NO React Query / Redux / WebSockets in this codebase):
 *   activity page (DSA/SQL/Aptitude/Mock) succeeds
 *   → emits `prepagent:analytics-updated` with { domain }
 *   → Analytics / Dashboard / suggestion panels listening for it refetch
 *   → deterministic suggestions recalculate from the fresh DB rows
 *
 * LLM stays optional: a failed suggestion fetch never blocks this event.
 */
export const ANALYTICS_UPDATED_EVENT = 'prepagent:analytics-updated';

export const ANALYTICS_DOMAINS = ['dsa', 'sql', 'aptitude', 'mock'];

export function emitAnalyticsUpdated(domain, detail = {}) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  window.dispatchEvent(
    new CustomEvent(ANALYTICS_UPDATED_EVENT, { detail: { domain, ...detail } })
  );
}

/**
 * Subscribe to analytics updates. Returns an unsubscribe function.
 * `domains` optionally narrows to e.g. ['dsa'] — empty = all domains.
 */
export function onAnalyticsUpdated(handler, domains = []) {
  if (typeof window === 'undefined') return () => {};
  const listener = (event) => {
    const domain = event?.detail?.domain;
    if (domains.length > 0 && domain && !domains.includes(domain)) return;
    try {
      handler(event?.detail || {});
    } catch (err) {
      // One crashing panel must never break the emit for other listeners —
      // analytics refresh stays non-blocking by design.
      console.error('[analyticsEvents] listener failed:', err);
    }
  };
  window.addEventListener(ANALYTICS_UPDATED_EVENT, listener);
  return () => window.removeEventListener(ANALYTICS_UPDATED_EVENT, listener);
}

const DISMISS_KEY = 'prepagent:dismissed-suggestions:v1';

function readDismissed() {
  try {
    if (typeof localStorage === 'undefined') return {};
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

/** Stable id for one suggestion card (section + topic + priority). */
export function suggestionId(s) {
  const section = s.section || s.domain || 'general';
  return `${String(section).toLowerCase()}::${String(s.topic || 'general').toLowerCase()}::${String(s.priority || 'low').toUpperCase()}`;
}

export function getDismissedSuggestions() {
  return readDismissed();
}

export function isSuggestionDismissed(s) {
  return Boolean(readDismissed()[suggestionId(s)]);
}

export function dismissSuggestion(s) {
  try {
    if (typeof localStorage === 'undefined') return;
    const map = readDismissed();
    map[suggestionId(s)] = Date.now();
    localStorage.setItem(DISMISS_KEY, JSON.stringify(map));
  } catch {
    /* dismissal is best-effort; analytics must never break on storage errors */
  }
}

export function clearDismissedSuggestions() {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(DISMISS_KEY);
  } catch {
    /* ignore */
  }
}
