const mongoose = require('mongoose');

const CoreSubjectSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  questionType: { type: String, enum: ['mcq', 'interview'], required: true },
  selectedAnswer: Number, // for MCQs: index of selected option
  isCorrect: Boolean,
  timeTaken: Number, // seconds
  difficulty: String,
}, { timestamps: true });

CoreSubjectSubmissionSchema.index({ userId: 1, subject: 1, topic: 1 });
CoreSubjectSubmissionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CoreSubjectSubmission', CoreSubjectSubmissionSchema);
