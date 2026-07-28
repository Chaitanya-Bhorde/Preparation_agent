const mongoose = require('mongoose');

const AptitudeResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    testType: {
      type: String,
      default: 'general',
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: ['dsa', 'sql', 'aptitude'],
      default: 'aptitude',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AptitudeResult', AptitudeResultSchema);
