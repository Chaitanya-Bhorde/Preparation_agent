const mongoose = require('mongoose');

const SQLSubmissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'SQLProblem', required: true, index: true },
    query: { type: String, required: true },
    status: {
      type: String,
      enum: ['accepted', 'wrong_answer', 'runtime_error', 'time_limit', 'syntax_error', 'pending'],
      default: 'pending',
      index: true,
    },
    type: { type: String, enum: ['run', 'submit'], default: 'run', index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    topics: [{ type: String }],
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    runtimeMs: { type: Number, default: 0 },
    executionTime: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

SQLSubmissionSchema.index({ user: 1, problem: 1, type: 1, status: 1 });
SQLSubmissionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SQLSubmission', SQLSubmissionSchema);
