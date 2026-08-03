import { useState, useEffect } from 'react';
import { Flame, Calendar } from 'lucide-react';
import CalendarHeatmap from '../CalendarHeatmap';
import { getPracticeStreak } from '../../api';
import { CARD_CLASSES } from '../../utils/ui';

export default function StreakHeatmap({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, [userId]);

  const loadStreak = async () => {
    try {
      setLoading(true);
      const { data: res } = await getPracticeStreak(userId);
      setData(res.data);
    } catch (error) {
      console.error('Failed to load streak:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={CARD_CLASSES}>
        <h3 className="text-lg font-semibold text-white mb-4">Activity Heatmap</h3>
        <div className="h-32 bg-gray-800 rounded animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={CARD_CLASSES}>
        <h3 className="text-lg font-semibold text-white mb-4">Activity Heatmap</h3>
        <p className="text-gray-500 text-sm">No data yet</p>
      </div>
    );
  }

  const { currentStreak, maxStreak, heatmap } = data;

  return (
    <div className={CARD_CLASSES}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Activity Heatmap
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-orange-400">
            <Flame className="w-4 h-4" />
            <span>Current: {currentStreak} days</span>
          </div>
          <div className="flex items-center gap-1 text-purple-400">
            <Flame className="w-4 h-4" />
            <span>Max: {maxStreak} days</span>
          </div>
        </div>
      </div>
      <CalendarHeatmap data={heatmap} />
    </div>
  );
}
