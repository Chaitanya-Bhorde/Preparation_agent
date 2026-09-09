const mongoose = require('mongoose');

const CoreInterviewQuestionSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  explanation: { type: String, default: '' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  followUps: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

CoreInterviewQuestionSchema.index({ subject: 1, topic: 1, difficulty: 1 });

module.exports = mongoose.model('CoreInterviewQuestion', CoreInterviewQuestionSchema);
