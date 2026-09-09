const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  keyPoints: [String],
  examples: [{
    title: String,
    code: String,
    language: { type: String, default: 'text' },
  }],
  commonMistakes: [String],
  interviewTips: [String],
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

NoteSchema.index({ subject: 1, topic: 1 });

module.exports = mongoose.model('Note', NoteSchema);
