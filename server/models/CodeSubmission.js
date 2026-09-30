const mongoose = require('mongoose');

const TestCaseResultSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expected: { type: String, required: true },
  actualOutput: { type: String, default: '' },
  passed: { type: Boolean, required: true },
  executionTime: { type: Number, default: 0 },
  memoryUsed: { type: Number, default: 0 },
  errorType: { type: String, default: null },
  errorMessage: { type: String, default: null },
}, { _id: false });

const CodeSubmissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'typescript'],
    },
    code: {
      type: String,
      required: true,
    },
    verdict: {
      type: String,
      enum: ['Accepted', 'WrongAnswer', 'TLE', 'RuntimeError', 'CompileError'],
      required: true,
    },
    category: {
      type: String,
      enum: ['dsa', 'sql', 'aptitude'],
      default: 'dsa',
    },
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    runtimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
    testCaseResults: [TestCaseResultSchema],
    firstFailedInput: { type: String, default: null },
    firstFailedExpected: { type: String, default: null },
    firstFailedActual: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

// Indexes are derived from this codebase's actual query patterns rather than
// copied from a sibling model:
//   { user, createdAt } - GET /api/coding/submissions and the merged history in
//                         submissionController filter on `user` (optionally plus
//                         `problem`) and sort createdAt desc with skip/limit.
//   { user, problem }    - the solved/attempted lookups
//                         (findOne { user, problem [, verdict] }) and the
//                         `problem: { $in: [...] }` batches in
//                         codingProblemController.
// No standalone user/problem index is declared: both are the leading field of
// these compounds, so a separate one would be redundant. `category` is
// deliberately not indexed (3 distinct values, always queried together with
// `user`, so the user prefix already narrows the scan).
CodeSubmissionSchema.index({ user: 1, createdAt: -1 });
CodeSubmissionSchema.index({ user: 1, problem: 1 });

module.exports = mongoose.model('CodeSubmission', CodeSubmissionSchema);