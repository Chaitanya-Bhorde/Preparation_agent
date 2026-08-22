const mongoose = require('mongoose');

const AptitudeSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['single-question', 'mock-test'], required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeTopic' },
  mockTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeMockTest' },
  category: String, // 'quantitative', 'logical', 'verbal'
  totalQuestions: Number,
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeQuestion' },
      selectedAnswer: String, // 'A', 'B', 'C', 'D'
      isCorrect: Boolean,
      timeTaken: Number, // seconds
    },
  ],
  correctCount: Number,
  totalCount: Number,
  score: Number, // percentage
  passed: Boolean,
  startTime: Date,
  endTime: Date,
  duration: Number, // seconds taken
  verdict: { type: String, enum: ['Excellent', 'Good', 'Average', 'Poor', 'Failed'] },
  createdAt: { type: Date, default: Date.now },
});

AptitudeSubmissionSchema.index({ userId: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('AptitudeSubmission', AptitudeSubmissionSchema);

