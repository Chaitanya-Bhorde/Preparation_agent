const mongoose = require('mongoose');

const AptitudeMockTestSchema = new mongoose.Schema({
  name: String, // 'Mock Test 1', 'Full Aptitude Test', etc.
  description: String,
  category: String, // 'full', 'quantitative-only', 'logical-only', 'verbal-only'
  questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeQuestion' }],
  // Per-question snapshot (with shuffled option order + relabeled correctAnswer)
  // used by generative "new paper / reset paper" mock tests.
  questions: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeQuestion' },
      questionText: String,
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
      options: [{ label: String, text: String }],
      correctAnswer: String,
    },
  ],
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
