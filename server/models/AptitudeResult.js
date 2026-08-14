const mongoose = require('mongoose');

const AptitudeResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testType: { type: String, default: 'aptitude_practice' },
    category: { type: String, default: 'aptitude' },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AptitudeResult', AptitudeResultSchema);