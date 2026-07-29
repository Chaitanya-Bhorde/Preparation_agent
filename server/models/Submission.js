const mongoose = require('mongoose');
const SubmissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'typescript', 'sql'],
    },
    type: {
      type: String,
      enum: ['run', 'submit'],
      default: 'submit',
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error'],
      default: 'pending',
    },
    errorType: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    testCaseResults: [
      {
        testCase: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem.testCases' },
        passed: Boolean,
        input: String,
        expectedOutput: String,
        actualOutput: String,
        executionTime: Number,
        memoryUsed: Number,
        errorType: String,
        errorMessage: String,
      },
    ],
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    executionTime: { type: Number, default: 0 },
    memoryUsed: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    problemDifficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    problemTags: [String],
    category: {
      type: String,
      enum: ['dsa', 'sql', 'aptitude'],
      default: 'dsa',
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model('Submission', SubmissionSchema);