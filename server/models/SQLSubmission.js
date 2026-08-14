const mongoose = require('mongoose');

const SQLSubmissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'SQLProblem', required: true },
    query: { type: String, required: true },
    status: { type: String, enum: ['passed', 'failed', 'pending', 'error'], default: 'pending' },
    type: { type: String, enum: ['run', 'submit'], default: 'run' },
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    runtimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SQLSubmission', SQLSubmissionSchema);
