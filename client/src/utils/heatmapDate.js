/**
 * Single canonical date utility for ALL heatmaps.
 * Backend normalizes activity dates to 'YYYY-MM-DD' in UTC (analyticsService.dateStr).
 * To guarantee DB date == calendar cell date (no timezone shift), every heatmap
 * parses/positions dates in UTC. One implementation, no per-component duplication.
 */

export function parseDayKey(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return { y, m, d };
}

export function dayKeyUTC(y, m, d) {
  return (
    String(y).padStart(4, '0') + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0')
  );
}

/** Weekday 0=Sun..6=Sat for a UTC calendar date. */
export function weekdayUTC(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function daysInMonthUTC(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * Build LeetCode-style month grid: columns = calendar weeks, rows = weekday.
 * Returns { weeks, totalDays } where weeks[w][weekday] = dayKey|null (padding=null, NOT fake activity).
 * Never chunks dates into groups of 7 — positions come from the real weekday.
 */
export function buildMonthGrid(year, month) {
  const totalDays = daysInMonthUTC(year, month);
  const firstWeekday = weekdayUTC(year, month, 1);
  const totalCells = firstWeekday + totalDays;
  const weekCount = Math.ceil(totalCells / 7);
  const weeks = Array.from({ length: weekCount }, () => Array(7).fill(null));
  for (let day = 1; day <= totalDays; day += 1) {
    const cellIndex = firstWeekday + (day - 1);
    const w = Math.floor(cellIndex / 7);
    const wd = cellIndex % 7;
    weeks[w][wd] = dayKeyUTC(year, month, day);
  }
  return { weeks, totalDays, weekCount };
}

/** 'September 15, 2026' from a day key (UTC parts, no Date-shift). */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export function formatDayKey(key) {
  const { y, m, d } = parseDayKey(key);
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

export function formatMonthTitle(year, month) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Shift a {year,month} selection by delta months. */
export function shiftMonth(year, month, delta) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/**
 * Normalize any backend activity payload to { 'YYYY-MM-DD': count }.
 * Backend returns { 'YYYY-MM-DD': { date, count, intensity } } — use .count.
 * Legacy callers may pass raw numbers — accept those too.
 */
export function toCountMap(heatmap) {
  if (!heatmap) return {};
  if (Array.isArray(heatmap)) {
    const out = {};
    heatmap.forEach((entry) => {
      if (!entry) return;
      if (typeof entry === 'string') out[entry] = (out[entry] || 0) + 1;
      else if (entry.date) {
        const key = String(entry.date).slice(0, 10);
        out[key] = (out[key] || 0) + (Number(entry.count) || 1);
      }
    });
    return out;
  }
  const out = {};
  Object.entries(heatmap).forEach(([date, val]) => {
    const key = String(date).slice(0, 10);
    out[key] = val && typeof val === 'object' ? Number(val.count) || 0 : Number(val) || 0;
  });
  return out;
}

/**
 * Intensity 0..4 from a true activity count.
 * Mirrors server/services/analyticsService.computeIntensity thresholds
 * (0 / 1 / 2-3 / 4-5 / 6+). Single source for the legend mapping.
 */
export function intensityForCount(count) {
  if (!count || count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}
