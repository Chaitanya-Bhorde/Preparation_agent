const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  totalSolved: { type: Number, default: 0 },
  easySolved: { type: Number, default: 0 },
  mediumSolved: { type: Number, default: 0 },
  hardSolved: { type: Number, default: 0 },
  totalSubmissions: { type: Number, default: 0 },
  acceptanceRate: { type: Number, default: 0 },
  atsScore: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  weeklySolved: { type: Number, default: 0 },
  monthlySolved: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

LeaderboardSchema.index({ totalSolved: -1 });
LeaderboardSchema.index({ weeklySolved: -1 });
LeaderboardSchema.index({ monthlySolved: -1 });

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);