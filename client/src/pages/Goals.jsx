import { useState, useEffect } from 'react';
import { getGoalProgress, updateGoals } from '../api';
import { useAuth } from '../context/AuthContext';
import { PAGE_CONTAINER, LOADING_SPINNER } from '../utils/ui';
import { Target, Flame, Loader2, Calendar, TrendingUp } from 'lucide-react';

export default function Goals() {
  const { user } = useAuth();
  const [goalData, setGoalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [weeklyGoal, setWeeklyGoal] = useState(35);
  useEffect(() => { loadGoals(); }, []);
  const loadGoals = async () => {
    try {
      const { data } = await getGoalProgress();
      setGoalData(data.data);
      setDailyGoal(data.data.dailyGoal);
      setWeeklyGoal(data.data.weeklyGoal);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    await updateGoals({ dailyGoal, weeklyGoal });
    alert('Goals updated!');
  };
  if (loading) return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  return (
    <div className={PAGE_CONTAINER}>
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><Target className="w-8 h-8" /> Daily & Weekly Goals</h1>
        <p className="text-green-100">Set targets, build streaks, stay consistent</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Flame className="w-6 h-6 text-orange-400" />
            <div>
              <p className="text-gray-400 text-sm">Current Streak</p>
              <p className="text-2xl font-bold text-white">{user?.stats?.streak || 0} days</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">Today's Progress</p>
              <p className="text-2xl font-bold text-white">{goalData?.dailySolved || 0} / {goalData?.dailyGoal || 0}</p>
            </div>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${goalData?.dailyGoal > 0 ? Math.min((goalData.dailySolved / goalData.dailyGoal) * 100, 100) : 0}%` }}></div>
          </div>
        </div>
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> Set Your Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Daily Target</label>
            <input type="number" value={dailyGoal} onChange={(e) => setDailyGoal(parseInt(e.target.value) || 0)} className="w-full bg-gray-800 text-white rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Weekly Target</label>
            <input type="number" value={weeklyGoal} onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 0)} className="w-full bg-gray-800 text-white rounded px-3 py-2" />
          </div>
        </div>
        <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">Save Goals</button>
      </div>
    </div>
  );
}