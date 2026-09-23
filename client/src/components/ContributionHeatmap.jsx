import { useMemo, useState } from 'react';
import {
  buildMonthGrid,
  formatDayKey,
  formatMonthTitle,
  shiftMonth,
  intensityForCount,
} from '../utils/heatmapDate';

const CELL = 13;
const GAP = 3;
const PITCH = CELL + GAP;

const LEVEL_COLORS = ['#1f2937', '#166534', '#15803d', '#22c55e', '#4ade80'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function colorForCount(count) {
  return LEVEL_COLORS[intensityForCount(count)];
}

function unitLabel(count, unit) {
  if (!count) return 'No activity';
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

/**
 * Canonical LeetCode-style contribution heatmap (single implementation for all domains).
 *
 * - month grid: columns = calendar weeks, rows = weekday (Sun..Sat)
 * - each cell = exactly one calendar date, positioned by its real weekday
 * - padding cells before/after the month render empty (NOT activity)
 * - only `activity` counts from the backend drive intensity
 */
export default function ContributionHeatmap({
  title = 'Activity',
  activity = {},
  unit = 'activity',
  initialYear,
  initialMonth,
  onMonthChange,
}) {
  const now = new Date();
  const [view, setView] = useState({
    year: initialYear || now.getFullYear(),
    month: initialMonth || now.getMonth() + 1,
  });

  const { weeks, totalDays } = useMemo(
    () => buildMonthGrid(view.year, view.month),
    [view.year, view.month],
  );

  const monthTotal = useMemo(() => {
    const prefix = `${String(view.year).padStart(4, '0')}-${String(view.month).padStart(2, '0')}-`;
    return Object.entries(activity || {}).reduce(
      (sum, [k, v]) => (k.startsWith(prefix) ? sum + (Number(v) || 0) : sum),
      0,
    );
  }, [activity, view.year, view.month]);

  const gotoMonth = (delta) => {
    const next = shiftMonth(view.year, view.month, delta);
    setView(next);
    if (onMonthChange) onMonthChange(next);
  };

  const width = weeks.length * PITCH;
  const height = 7 * PITCH;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 gap-2">
        <button
          type="button"
          onClick={() => gotoMonth(-1)}
          className="px-2.5 py-1 text-xs rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800"
          aria-label="Previous month"
        >
          {'< Prev'}
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{formatMonthTitle(view.year, view.month)}</p>
          <p className="text-[11px] text-gray-500">
            {monthTotal > 0 ? `Total activity: ${monthTotal}` : 'No activity this month'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => gotoMonth(1)}
          className="px-2.5 py-1 text-xs rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800"
          aria-label="Next month"
        >
          {'Next >'}
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          width={Math.max(width + 44, 320)}
          height={height + 12}
          role="img"
          aria-label={`${title} activity for ${formatMonthTitle(view.year, view.month)} (${totalDays} days)`}
        >
          <g transform="translate(40, 6)">
            {weeks.map((week, w) => (
              <g key={w} transform={`translate(${w * PITCH}, 0)`}>
                {week.map((dayKey, weekday) => {
                  if (!dayKey) {
                    return (
                      <rect
                        key={weekday}
                        x={0}
                        y={weekday * PITCH}
                        width={CELL}
                        height={CELL}
                        rx={2}
                        fill="transparent"
                      />
                    );
                  }
                  const count = Number(activity[dayKey]) || 0;
                  return (
                    <rect
                      key={weekday}
                      x={0}
                      y={weekday * PITCH}
                      width={CELL}
                      height={CELL}
                      rx={2}
                      fill={colorForCount(count)}
                      stroke="#111827"
                      strokeWidth={1}
                    >
                      <title>{`${formatDayKey(dayKey)}\n${unitLabel(count, unit)}`}</title>
                    </rect>
                  );
                })}
              </g>
            ))}
            {DAY_LABELS.map((label, i) => (
              <text
                key={label}
                x={-6}
                y={i * PITCH + CELL - 1}
                textAnchor="end"
                fontSize={9}
                fill="#9ca3af"
              >
                {label}
              </text>
            ))}
          </g>
        </svg>
      </div>

      <div className="flex justify-end items-center gap-1.5 text-[11px] text-gray-400 mt-2">
        <span>Less</span>
        {LEVEL_COLORS.map((c) => (
          <span key={c} className="inline-block w-3 h-3 rounded-[3px] border border-gray-900" style={{ backgroundColor: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
