const User = require('../models/User');
const Submission = require('../models/Submission');

exports.updateGoals = async (req, res) => {
  try {
    const { dailyGoal, weeklyGoal } = req.body;
    const user = await User.findById(req.user.id);
    user.stats.dailyGoal = dailyGoal || user.stats.dailyGoal;
    user.stats.weeklyGoal = weeklyGoal || user.stats.weeklyGoal;
    await user.save();
    res.status(200).json({ success: true, data: user.stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getGoalProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const today = new Date().toISOString().split('T')[0];
    const todaySubmissions = await Submission.find({ user: req.user.id, createdAt: { $gte: new Date(today) } });
    const dailySolved = todaySubmissions.filter(s => s.status === 'accepted').length;
    const updatedUser = await User.findById(req.user.id);
    const currentStreak = updatedUser.stats.streak || 0;
    res.status(200).json({ success: true, data: { dailyGoal: updatedUser.stats.dailyGoal, weeklyGoal: updatedUser.stats.weeklyGoal, dailySolved, currentStreak } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};