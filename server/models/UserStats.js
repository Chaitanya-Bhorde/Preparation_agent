const mongoose = require('mongoose');

const UserStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    totalProblems: { type: Number, default: 0 },           // Total problems solved
    easyCount: { type: Number, default: 0 },              // Easy problems solved
    mediumCount: { type: Number, default: 0 },            // Medium problems solved
    hardCount: { type: Number, default: 0 },              // Hard problems solved
    totalSubmissions: { type: Number, default: 0 },       // All submissions (pass + fail)
    successfulSubmissions: { type: Number, default: 0 },  // Successful submissions only
    currentStreak: { type: Number, default: 0 },          // Days of consecutive solves
    longestStreak: { type: Number, default: 0 },          // Best streak ever
    lastSolveDate: { type: Date, default: null },         // For streak calculation
    acceptanceRate: { type: Number, default: 0 },         // successfulSubmissions / totalSubmissions * 100
    rankingTier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
      default: 'Bronze'
    },
    languageStats: {
      JavaScript: { type: Number, default: 0 },
      Java: { type: Number, default: 0 },
      Python: { type: Number, default: 0 },
      'C++': { type: Number, default: 0 },
      C: { type: Number, default: 0 },
      'C#': { type: Number, default: 0 }
    },
    categoryStats: {
      // DSA categories: will have format { categoryName: problemCount }
      // e.g., "Binary Search": 5, "Linked List": 3, etc.
      type: Map,
      of: Number,
      default: new Map()
    }
  },
  { timestamps: true }
);

// Index for fast leaderboard queries
UserStatsSchema.index({ totalProblems: -1, totalSubmissions: -1 });
UserStatsSchema.index({ easyCount: -1, mediumCount: -1, hardCount: -1 });
UserStatsSchema.index({ currentStreak: -1 });
UserStatsSchema.index({ acceptanceRate: -1 });

module.exports = mongoose.model('UserStats', UserStatsSchema);