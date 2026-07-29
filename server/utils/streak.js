const User = require('../models/User');

/**
 * Update streak for a user after an accepted submission.
 * Can be called from any route/controller that processes accepted submissions.
 */
const updateStreak = async (userId) => {
  try {
    const user = await User.findById(userId).select('stats.streak stats.lastActiveDate');
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = user.stats.lastActiveDate ? new Date(user.stats.lastActiveDate) : null;
    if (lastActive) {
      lastActive.setHours(0, 0, 0, 0);
    }
    const diffDays = lastActive ? Math.round((today - lastActive) / (1000 * 60 * 60 * 24)) : null;
    let newStreak;
    if (diffDays === null) {
      newStreak = 1;
    } else if (diffDays === 0) {
      newStreak = user.stats.streak;
    } else if (diffDays === 1) {
      newStreak = (user.stats.streak || 0) + 1;
    } else {
      newStreak = 1;
    }
    await User.findByIdAndUpdate(userId, {
      $set: {
        'stats.streak': newStreak,
        'stats.lastActiveDate': today,
      },
    });
  } catch (error) {
    console.error('Streak update failed:', error.message);
  }
};

module.exports = { updateStreak };