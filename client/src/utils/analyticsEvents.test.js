/**
 * analyticsEvents.test.js — real-time analytics bus + suggestion dismissal.
 *
 * Covers:
 *   - emit/on round trip with { domain, ...detail }
 *   - unsubscribe stops delivery
 *   - domain filtering
 *   - suggestion ids are stable across equivalent shapes (domain vs section)
 *   - dismiss persists in localStorage and survives "reload" (fresh module read)
 *   - clear resets everything (used by the learning-data reset)
 *   - storage failures never throw (best-effort dismissal)
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ANALYTICS_UPDATED_EVENT,
  ANALYTICS_DOMAINS,
  emitAnalyticsUpdated,
  onAnalyticsUpdated,
  suggestionId,
  getDismissedSuggestions,
  isSuggestionDismissed,
  dismissSuggestion,
  clearDismissedSuggestions,
} from './analyticsEvents';

describe('emit/on analytics bus', () => {
  afterEach(() => {
    clearDismissedSuggestions();
  });

  it('emits a CustomEvent named prepagent:analytics-updated', () => {
    const seen = [];
    const off = onAnalyticsUpdated((detail) => seen.push(detail));
    emitAnalyticsUpdated('dsa', { accepted: true });
    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({ domain: 'dsa', accepted: true });
    off();
  });

  it('supports the four submission domains from real pages', () => {
    const seen = [];
    const off = onAnalyticsUpdated((d) => seen.push(d.domain));
    ANALYTICS_DOMAINS.forEach((d) => emitAnalyticsUpdated(d));
    expect(seen).toEqual(['dsa', 'sql', 'aptitude', 'mock']);
    // 'reset' (post wipe) is also broadcast so panels refetch empty states.
    emitAnalyticsUpdated('reset');
    expect(seen).toContain('reset');
    off();
  });

  it('unsubscribe stops delivery', () => {
    const seen = [];
    const off = onAnalyticsUpdated((d) => seen.push(d));
    emitAnalyticsUpdated('sql');
    off();
    emitAnalyticsUpdated('sql');
    expect(seen).toHaveLength(1);
  });

  it('filters by domain when domains are provided', () => {
    const seen = [];
    const off = onAnalyticsUpdated((d) => seen.push(d.domain), ['aptitude']);
    emitAnalyticsUpdated('dsa');
    emitAnalyticsUpdated('aptitude');
    expect(seen).toEqual(['aptitude']);
    off();
  });

  it('never throws when a listener handler fails', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const off = onAnalyticsUpdated(() => { throw new Error('panel crashed'); });
    expect(() => emitAnalyticsUpdated('mock')).not.toThrow();
    off();
    spy.mockRestore();
  });
});

describe('suggestion dismissal (localStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearDismissedSuggestions();
  });

  it('derives a stable id from section/domain + topic + priority', () => {
    const a = suggestionId({ domain: 'DSA', topic: 'Arrays', priority: 'HIGH' });
    const b = suggestionId({ section: 'dsa', topic: 'arrays', priority: 'high' });
    expect(a).toBe(b);
    expect(a).toBe('dsa::arrays::HIGH');
  });

  it('dismissal persists and filters equivalent suggestion shapes', () => {
    const item = { section: 'dsa', topic: 'Two Pointers', priority: 'HIGH', reason: 'weak' };
    expect(isSuggestionDismissed(item)).toBe(false);
    dismissSuggestion(item);
    expect(isSuggestionDismissed(item)).toBe(true);
    // Equivalent shape (domain instead of section, different casing) is hidden too.
    expect(isSuggestionDismissed({ domain: 'DSA', topic: 'two pointers', priority: 'high' })).toBe(true);
    // Persisted: a fresh read of localStorage (as after a reload) still sees it.
    expect(getDismissedSuggestions()[suggestionId(item)]).toBeTruthy();
  });

  it('clearing restores every suggestion (learning-data reset path)', () => {
    dismissSuggestion({ topic: 'Graphs', priority: 'MEDIUM' });
    dismissSuggestion({ topic: 'Joins', priority: 'LOW' });
    expect(Object.keys(getDismissedSuggestions())).toHaveLength(2);
    clearDismissedSuggestions();
    expect(getDismissedSuggestions()).toEqual({});
    expect(isSuggestionDismissed({ topic: 'Graphs', priority: 'MEDIUM' })).toBe(false);
  });

  it('storage failures never throw (best-effort dismissal)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('quota/exposed mode');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota/exposed mode');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('quota/exposed mode');
    });
    expect(() => dismissSuggestion({ topic: 'DP' })).not.toThrow();
    expect(() => clearDismissedSuggestions()).not.toThrow();
    expect(getDismissedSuggestions()).toEqual({}); // falls back to empty map
    expect(isSuggestionDismissed({ topic: 'DP' })).toBe(false);
    vi.restoreAllMocks();
    spy.mockRestore();
  });

  it('corrupted stored JSON is ignored, not thrown', () => {
    localStorage.setItem('prepagent:dismissed-suggestions:v1', '{not json');
    expect(getDismissedSuggestions()).toEqual({});
    expect(isSuggestionDismissed({ topic: 'OS' })).toBe(false);
    expect(() => dismissSuggestion({ topic: 'OS' })).not.toThrow();
    expect(isSuggestionDismissed({ topic: 'OS' })).toBe(true);
  });
});

describe('event constant', () => {
  it('matches the window event name used across pages', () => {
    expect(ANALYTICS_UPDATED_EVENT).toBe('prepagent:analytics-updated');
    const handler = vi.fn();
    window.addEventListener(ANALYTICS_UPDATED_EVENT, handler);
    emitAnalyticsUpdated('dsa');
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(ANALYTICS_UPDATED_EVENT, handler);
  });
});