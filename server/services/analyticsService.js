'use strict';

/**
 * Analytics Service — shared helpers for all 4 domains
 * (DSA, SQL, Aptitude, Mock Interviews).
 *
 * Every value produced here originates from real database activity for a single
 * authenticated user. No synthetic/placeholder values are generated. Dates with
 * no activity are simply absent from heatmaps so the frontend can render them
 * as empty calendar cells.
 */

const { HEATMAP_INTENSITY } = require('./ml/featureEngineering');

const DAY_MS = 24 * 60 * 60 * 1000;

/** 'YYYY-MM-DD' in UTC — matches how Mongo stores/aggregates timestamps. */
function dateStr(d) {
  const x = new Date(d);
  return (
    x.getUTCFullYear() +
    '-' +
    String(x.getUTCMonth() + 1).padStart(2, '0') +
    '-' +
    String(x.getUTCDate()).padStart(2, '0')
  );
}

/** 'YYYY-MM' in UTC. */
function monthKey(d) {
  const x = new Date(d);
  return x.getUTCFullYear() + '-' + String(x.getUTCMonth() + 1).padStart(2, '0');
}

function safeDiv(a, b) {
  return b > 0 ? a / b : 0;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function percent(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

function computeIntensity(count) {
  if (!count) return HEATMAP_INTENSITY.empty;
  if (count === 1) return HEATMAP_INTENSITY.low;
  if (count <= 3) return HEATMAP_INTENSITY.medium.min;
  if (count <= 5) return HEATMAP_INTENSITY.high.min;
  return HEATMAP_INTENSITY.veryHigh.min;
}

/**
 * Streaks from a descending list of 'YYYY-MM-DD' strings.
 * `currentStreak` only counts a run that includes today or yesterday.
 */
function computeStreaks(sortedDescDates) {
  if (!sortedDescDates || !sortedDescDates.length) {
    return { currentStreak: 0, maxStreak: 0 };
  }
  const days = [...new Set(sortedDescDates)].sort().reverse();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = dateStr(today);
  const yesterdayStr = dateStr(new Date(today.getTime() - DAY_MS));

  let currentStreak = 0;
  if (days[0] === todayStr || days[0] === yesterdayStr) {
    let cursor = new Date(days[0] + 'T00:00:00.000Z');
    for (const ds of days) {
      if (dateStr(cursor) === ds) {
        currentStreak += 1;
        cursor = new Date(cursor.getTime() - DAY_MS);
      } else break;
    }
  }

  let maxStreak = 0;
  let temp = 0;
  let prev = null;
  for (const ds of days) {
    if (prev) {
      const diff = Math.round((new Date(prev).getTime() - new Date(ds).getTime()) / DAY_MS);
      temp = diff === 1 ? temp + 1 : 1;
    } else {
      temp = 1;
    }
    if (temp > maxStreak) maxStreak = temp;
    prev = ds;
  }
  return { currentStreak, maxStreak };
}

/**
 * Build a calendar heatmap from real activity events.
 *
 * @param {Array<{date: Date|string, intensity?: number, accepted?: boolean}>} events
 * @param {number} days lookback window (default 365)
 * @returns {{heatmap: Object, currentStreak: number, maxStreak: number,
 *            activeDays: number, totalEvents: number}}
 *
 * `heatmap` contains ONLY dates that have real activity — never fabricated
 * cells. Counts are true event counts for that UTC date.
 */
function buildHeatmap(events, days) {
  const window = days || 365;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startMs = today.getTime() - (window - 1) * DAY_MS;

  const heatmap = {};
  const activeDates = [];
  let totalEvents = 0;

  (events || []).forEach((ev) => {
    if (!ev || !ev.date) return;
    const d = new Date(ev.date);
    if (Number.isNaN(d.getTime())) return;
    if (d.getTime() < startMs) return;
    const ds = dateStr(d);
    const increment = Number.isFinite(ev.intensity) && ev.intensity > 0 ? ev.intensity : 1;
    if (!heatmap[ds]) heatmap[ds] = { count: 0, intensity: 0 };
    heatmap[ds].count += increment;
    heatmap[ds].intensity = computeIntensity(heatmap[ds].count);
    totalEvents += increment;
    activeDates.push(ds);
  });

  const streaks = computeStreaks(activeDates);
  return {
    heatmap,
    currentStreak: streaks.currentStreak,
    maxStreak: streaks.maxStreak,
    activeDays: Object.keys(heatmap).length,
    totalEvents,
  };
}

/**
 * Count of distinct UTC dates represented by the events.
 */
function countActiveDays(events) {
  const set = new Set();
  (events || []).forEach((ev) => {
    if (ev && ev.date) {
      const d = new Date(ev.date);
      if (!Number.isNaN(d.getTime())) set.add(dateStr(d));
    }
  });
  return set.size;
}

/** Every 'YYYY-MM' key for a calendar year, in order. */
function monthKeysForYear(year) {
  return Array.from({ length: 12 }, (_, i) => year + '-' + String(i + 1).padStart(2, '0'));
}

/**
 * Month-by-month aggregation for one calendar year.
 *
 * Returns all 12 months of `year` in chronological order. A month with no
 * activity reports true zeros (never fabricated activity).
 *
 * @param {Array} events normalised activity events (see buildEvents helpers)
 * @param {string} eventType 'dsa' | 'sql' | 'aptitude' | 'interview'
 * @param {number} year calendar year (UTC)
 */
function computeMonthlyFromEvents(events, eventType, year) {
  const targetYear = Number(year) || new Date().getUTCFullYear();
  const buckets = {};
  monthKeysForYear(targetYear).forEach((key) => {
    buckets[key] = {
      month: key.slice(5),
      year: targetYear,
      key,
      solved: 0,
      attempted: 0,
      submissions: 0,
      accepted: 0,
      correct: 0,
      questions: 0,
      activeDays: 0,
      interviews: 0,
      scoreSum: 0,
      maxScoreSum: 0,
      _attempted: new Set(),
      _solved: new Set(),
      _dates: new Set(),
    };
  });

  const allDates = new Set();

  (events || []).forEach((ev) => {
    if (!ev || !ev.date) return;
    const d = new Date(ev.date);
    if (Number.isNaN(d.getTime())) return;
    const bucket = buckets[monthKey(d)];
    if (!bucket) return;

    const ds = dateStr(d);
    bucket._dates.add(ds);
    allDates.add(ds);

    if (eventType === 'dsa' || eventType === 'sql') {
      bucket.submissions += 1;
      if (ev.problemId) bucket._attempted.add(String(ev.problemId));
      if (ev.accepted) {
        bucket.accepted += 1;
        if (ev.problemId) bucket._solved.add(String(ev.problemId));
        else bucket.solved += 1;
      }
    } else if (eventType === 'aptitude') {
      const total = Number(ev.total) || 0;
      const correct = Number(ev.correct) || 0;
      bucket.submissions += 1;
      bucket.questions += total;
      bucket.correct += correct;
      bucket.accepted += correct;
      bucket.solved += correct;
      if (ev.attemptId) bucket._attempted.add(String(ev.attemptId));
    } else if (eventType === 'interview') {
      bucket.submissions += 1;
      bucket.interviews += 1;
      bucket.solved += 1;
      bucket.scoreSum += Number(ev.score) || 0;
      bucket.maxScoreSum += Number(ev.maxScore) || 0;
    }
  });

  const months = monthKeysForYear(targetYear).map((key) => {
    const b = buckets[key];
    const attempted = b._attempted.size;
    const solved = b._solved.size || b.solved;
    const month = {
      month: b.month,
      year: b.year,
      key: b.key,
      solved,
      attempted,
      submissions: b.submissions,
      accepted: b.accepted,
      correct: b.correct,
      questions: b.questions,
      activeDays: b._dates.size,
      acceptanceRate:
        eventType === 'aptitude'
          ? percent(b.correct, b.questions)
          : percent(b.accepted, b.submissions),
      averagePercentage:
        eventType === 'interview' && b.maxScoreSum > 0
          ? percent(b.scoreSum, b.maxScoreSum)
          : 0,
    };
    return month;
  });

  return {
    year: targetYear,
    months,
    activeDays: allDates.size,
    totalMonthsWithActivity: months.filter((m) => m.submissions > 0).length,
  };
}

module.exports = {
  DAY_MS,
  HEATMAP_INTENSITY,
  dateStr,
  monthKey,
  monthKeysForYear,
  safeDiv,
  round1,
  percent,
  computeIntensity,
  computeStreaks,
  countActiveDays,
  buildHeatmap,
  computeMonthlyFromEvents,
};
