import { Code2, TrendingUp, Award, Target } from 'lucide-react';
import { STAT_CARD_CLASSES } from '../../utils/ui';

const DIFFICULTY_COLORS = {
  Easy: 'text-green-400',
  Medium: 'text-yellow-400',
  Hard: 'text-red-400',
};

export default function SummaryCards({ data }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className={STAT_CARD_CLASSES}>
        <div className="flex items-center gap-3 mb-2">
          <Code2 className="w-5 h-5 text-blue-400" />
          <span className="text-gray-400 text-sm">Total Solved</span>
        </div>
        <p className="text-2xl font-bold text-white">{data.totalSolved || 0}</p>
      </div>
      <div className={STAT_CARD_CLASSES}>
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <span className="text-gray-400 text-sm">Acceptance Rate</span>
        </div>
        <p className="text-2xl font-bold text-white">{data.acceptanceRate || 0}%</p>
      </div>
      <div className={STAT_CARD_CLASSES}>
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-5 h-5 text-purple-400" />
          <span className="text-gray-400 text-sm">Total Submissions</span>
        </div>
        <p className="text-2xl font-bold text-white">{data.totalSubmissions || 0}</p>
      </div>
      <div className={STAT_CARD_CLASSES}>
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-5 h-5 text-yellow-400" />
          <span className="text-gray-400 text-sm">Difficulty</span>
        </div>
        <div className="flex gap-3 text-sm">
          <span className={DIFFICULTY_COLORS.Easy}>E: {data.easySolved || 0}</span>
          <span className={DIFFICULTY_COLORS.Medium}>M: {data.mediumSolved || 0}</span>
          <span className={DIFFICULTY_COLORS.Hard}>H: {data.hardSolved || 0}</span>
        </div>
      </div>
    </div>
  );
}
