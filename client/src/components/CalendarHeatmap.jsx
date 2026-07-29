import { useMemo } from 'react';

const CELL_SIZE = 12;
const CELL_GAP = 3;
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildYearGrid(year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const cells = [];
  // Align to nearest Sunday of start week
  const firstSunday = new Date(start);
  firstSunday.setDate(start.getDate() - start.getDay());
  const cursor = new Date(firstSunday);
  while (cursor <= end || cells.length % 7 !== 0) {
    cells.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

function colorForCount(count) {
  if (!count) return '#1f2937';
  if (count <= 2) return '#166534';
  if (count <= 5) return '#15803d';
  if (count <= 9) return '#22c55e';
  return '#4ade80';
}

export default function CalendarHeatmap({ data = {} }) {
  const now = new Date();
  const year = now.getFullYear();
  const cells = useMemo(() => buildYearGrid(year), [year]);

  const dayCounts = useMemo(() => {
    const counts = {};
    Object.entries(data).forEach(([date, count]) => {
      counts[date] = count;
    });
    return counts;
  }, [data]);

  const weeks = useMemo(() => {
    const weeksArray = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeksArray.push(cells.slice(i, i + 7));
    }
    return weeksArray;
  }, [cells]);

  const width = weeks.length * (CELL_SIZE + CELL_GAP);
  const height = 7 * (CELL_SIZE + CELL_GAP);

  return (
    <div className="w-full overflow-x-auto">
      <svg width={Math.max(width, 700)} height={height + 24} className="mx-auto">
        <g transform={`translate(50, 10)`}>
          {weeks.map((week, wIndex) => (
            <g key={wIndex} transform={`translate(${wIndex * (CELL_SIZE + CELL_GAP)}, 0)`}>
              {week.map((date, dIndex) => {
                const dateStr = date.toISOString().split('T')[0];
                const count = dayCounts[dateStr] || 0;
                // Only render cells within the current year (avoid overflow days from partial weeks at year-end)
                const inYear = date.getFullYear() === year;
                return (
                  <rect
                    key={dIndex}
                    x={dIndex * (CELL_SIZE + CELL_GAP)}
                    y={0}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={2}
                    fill={inYear ? colorForCount(count) : 'transparent'}
                    stroke={inYear ? '#111827' : 'transparent'}
                    strokeWidth={1}
                  >
                    {inYear && (
                      <title>{`${dateStr}: ${count} accepted`}</title>
                    )}
                  </rect>
                );
              })}
            </g>
          ))}
          {/* Day labels */}
          {DAY_LABELS.map((label, i) => (
            <text
              key={`day-${i}`}
              x={-6}
              y={i * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 1}
              textAnchor="end"
              fontSize={9}
              fill="#9ca3af"
            >
              {label}
            </text>
          ))}
        </g>
      </svg>
      <div className="flex justify-end items-center gap-2 text-xs text-gray-400 mt-2">
        <span>Less</span>
        {[0,1,2,3,4].map((level) => (
          <svg key={level} width={CELL_SIZE} height={CELL_SIZE}>
            <rect width={CELL_SIZE} height={CELL_SIZE} rx={2} fill={colorForCount(level === 0 ? 0 : level === 1 ? 1 : level === 2 ? 3 : level === 3 ? 6 : 10)} stroke="#111827" strokeWidth={1} />
          </svg>
        ))}
        <span>More</span>
      </div>
    </div>
  );
}