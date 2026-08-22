const mongoose = require('mongoose');

const UserAchievementsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  badges: [
    {
      id: String, // 'first-hundred-qa', 'quantitative-master', 'logic-king', 'verbal-ace', etc.
      name: String,
      description: String,
      icon: String, // emoji or image URL
      earnedAt: Date,
      category: String, // 'dsa', 'aptitude', 'general'
    },
  ],
  statistics: {
    totalQuestionsAttempted: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalMockTestsTaken: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    categoryCounts: {
      quantitative: { attempted: { type: Number, default: 0 }, correct: { type: Number, default: 0 } },
      logical: { attempted: { type: Number, default: 0 }, correct: { type: Number, default: 0 } },
      verbal: { attempted: { type: Number, default: 0 }, correct: { type: Number, default: 0 } },
    },
  },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserAchievements', UserAchievementsSchema);
