const mongoose = require('mongoose');

const AptitudeMockTestSchema = new mongoose.Schema({
  name: String, // 'Mock Test 1', 'Full Aptitude Test', etc.
  description: String,
  category: String, // 'full', 'quantitative-only', 'logical-only', 'verbal-only'
  questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeQuestion' }],
  totalQuestions: { type: Number, default: 30 },
  duration: { type: Number, default: 60 }, // minutes
  passingScore: { type: Number, default: 60 }, // percentage
  difficultyMix: {
    easy: Number,
    medium: Number,
    hard: Number,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AptitudeMockTest', AptitudeMockTestSchema);
