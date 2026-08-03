import { SELECT_CLASSES, INPUT_CLASSES } from '../../utils/ui';

const DIFFICULTIES = ['all', 'Easy', 'Medium', 'Hard'];
const VERDICTS = ['all', 'Accepted', 'Wrong Answer', 'Runtime Error', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Compilation Error'];

export default function HistoryFilters({ filters, setFilters }) {
  const update = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <select
        value={filters.difficulty || 'all'}
        onChange={(e) => update('difficulty', e.target.value)}
        className={SELECT_CLASSES}
      >
        {DIFFICULTIES.map((d) => (
          <option key={d} value={d}>{d === 'all' ? 'All Difficulties' : d}</option>
        ))}
      </select>

      <select
        value={filters.verdict || 'all'}
        onChange={(e) => update('verdict', e.target.value)}
        className={SELECT_CLASSES}
      >
        {VERDICTS.map((v) => (
          <option key={v} value={v}>{v === 'all' ? 'All Verdicts' : v}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Search problems..."
        value={filters.search || ''}
        onChange={(e) => update('search', e.target.value)}
        className={INPUT_CLASSES + ' w-64'}
      />
    </div>
  );
}
