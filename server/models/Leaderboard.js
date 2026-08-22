const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: { type: String, required: true },
    email: { type: String, required: true },
    rank: { type: Number, required: true },                // 1, 2, 3, ...
    totalProblems: { type: Number, required: true },
    acceptanceRate: { type: Number, required: true },
    rankingTier: { type: String, required: true },
    easyCount: { type: Number, required: true },
    mediumCount: { type: Number, required: true },
    hardCount: { type: Number, required: true },
        currentStreak: { type: Number, required: true },

    // --- Aptitude section (NEW) ---
    aptitude: {
      questionsAttempted: { type: Number, default: 0 },
      questionsCorrect: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      mockTestsCompleted: { type: Number, default: 0 },
      bestScore: { type: Number, default: 0 },
      rank: { type: Number, default: 0 },
    },

    // --- SQL section (NEW) ---
    sql: {
      problemsSolved: { type: Number, default: 0 },
      acceptedSubmissions: { type: Number, default: 0 },
      acceptanceRate: { type: Number, default: 0 },
      rank: { type: Number, default: 0 },
    },

    leaderboardType: {
      type: String,
      enum: ['Global', 'College', 'Friend'],
      default: 'Global',
      index: true
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null,
      index: true
    },
    snapshotDate: {
      type: Date,
      default: Date.now,
      index: true
      // Allows querying historical leaderboard snapshots
    }
  },
  { timestamps: true }
);

// Composite index for leaderboard queries
LeaderboardSchema.index({ leaderboardType: 1, snapshotDate: -1, rank: 1 });
LeaderboardSchema.index({ collegeId: 1, leaderboardType: 1, rank: 1 });
// Aptitude section indexes (NEW)
LeaderboardSchema.index({ 'aptitude.rank': 1, 'aptitude.bestScore': -1 });
// SQL section indexes (NEW)
LeaderboardSchema.index({ 'sql.rank': 1, 'sql.acceptanceRate': -1 });

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);