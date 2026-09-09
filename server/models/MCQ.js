const mongoose = require('mongoose');

const MCQSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  question: { type: String, required: true },
  options: {
    type: [{ type: String, required: true }],
    validate: [opts => opts.length >= 2, 'At least 2 options required'],
  },
  correctAnswer: { type: Number, required: true, min: 0 },
  explanation: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

MCQSchema.index({ subject: 1, topic: 1, difficulty: 1 });

module.exports = mongoose.model('MCQ', MCQSchema);
