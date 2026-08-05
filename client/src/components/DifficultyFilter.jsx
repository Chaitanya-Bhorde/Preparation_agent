// Shared Easy/Medium/Hard difficulty filter (chip buttons).
// Used as the PRIMARY filter in the DSA/Practice lists and reused by the
// Aptitude topic-layer (A3). Difficulty is the primary facet; topic/tag filters
// stay secondary in each parent.
const DIFFICULTY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function DifficultyFilter({ value, onChange, allowAll = true, className = '' }) {
  const activeClass = (o) => {
    if (value !== o.value) return 'bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500';
    if (o.value === 'easy') return 'bg-green-600 border-green-500 text-white';
    if (o.value === 'medium') return 'bg-yellow-600 border-yellow-500 text-white';
    if (o.value === 'hard') return 'bg-red-600 border-red-500 text-white';
    return 'bg-blue-600 border-blue-500 text-white';
  };
  const options = allowAll ? DIFFICULTY_OPTIONS : DIFFICULTY_OPTIONS.filter((o) => o.value !== '');
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`} role="group" aria-label="Filter by difficulty">
      {options.map((o) => (
        <button
          key={o.value || 'all'}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeClass(o)}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
