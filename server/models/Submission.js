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
// Indexes are derived from this codebase's actual query patterns:
//   { user, type }      - the dominant analytics path: loadDsaSubmissions and the
//                         overview in analyticsController, topicController and
//                         featureEngineering all filter { user, type: 'submit' }.
//   { user, createdAt } - paginated submission history in submissionController
//                         (filter `user`, sort createdAt desc, skip/limit).
//   { type, status }    - platform-wide aggregates that are NOT user-scoped:
//                         countDocuments({ type: 'submit' }),
//                         countDocuments({ type: 'submit', status: 'accepted' })
//                         and distinct('user', { type: 'submit' }).
// The leaderboard aggregates ($match on `category`) are deliberately left
// unindexed: they scan broadly to group by user, so a low-cardinality index
// would not help.
SubmissionSchema.index({ user: 1, type: 1 });
SubmissionSchema.index({ user: 1, createdAt: -1 });
SubmissionSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Submission', SubmissionSchema);