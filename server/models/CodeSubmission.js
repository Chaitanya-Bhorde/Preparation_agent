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

module.exports = mongoose.model('CodeSubmission', CodeSubmissionSchema);