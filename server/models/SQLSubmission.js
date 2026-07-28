const mongoose = require('mongoose');

const SQLSubmissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SQLProblem',
    required: true,
  },
  submittedQuery: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['passed', 'failed'],
    default: 'failed',
  },
  testCasesPassed: { type: Number, default: 0 },
  totalTestCases: { type: Number, default: 0 },
  testCaseResults: [
    {
      passed: Boolean,
      isSample: Boolean,
      error: String,
      actualRows: [mongoose.Schema.Types.Mixed],
      expectedRows: [mongoose.Schema.Types.Mixed],
      missingRows: [mongoose.Schema.Types.Mixed],
      extraRows: [mongoose.Schema.Types.Mixed],
      wrongValueRows: [
        {
          index: Number,
          mismatchedColumns: [String],
          actual: mongoose.Schema.Types.Mixed,
          expected: mongoose.Schema.Types.Mixed,
        },
      ],
    },
  ],
  executionTime: { type: Number, default: 0 },
  type: {
    type: String,
    enum: ['run', 'submit'],
    default: 'submit',
  },
  problemDifficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  problemTags: [String],
  category: {
    type: String,
    enum: ['dsa', 'sql', 'aptitude'],
    default: 'sql',
  },
});

module.exports = mongoose.model('SQLSubmission', SQLSubmissionSchema);