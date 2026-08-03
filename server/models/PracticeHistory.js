const mongoose = require('mongoose');

const PracticeHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    problemTitle: {
      type: String,
      required: true,
    },
    problemSlug: {
      type: String,
      required: true,
    },
    problemUrl: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
    },
    verdict: {
      type: String,
      enum: ['Accepted', 'Wrong Answer', 'Runtime Error', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Compilation Error'],
      required: true,
    },
    language: {
      type: String,
      enum: ['C++', 'Java', 'Python', 'JavaScript'],
      required: true,
    },
    attemptCount: {
      type: Number,
      required: true,
      default: 1,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    code: {
      type: String,
      default: null,
    },
    tags: [String],
  },
  {
    timestamps: false,
  }
);

PracticeHistorySchema.index({ userId: 1, submittedAt: -1 });
PracticeHistorySchema.index({ userId: 1, problemId: 1 });

module.exports = mongoose.model('PracticeHistory', PracticeHistorySchema);
