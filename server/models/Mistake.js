const mongoose = require('mongoose');

const MistakeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  mistakeType: { type: String, required: true },
  personalNote: { type: String, default: '' },
  topic: { type: String },
  status: { type: String, enum: ['open', 'learning', 'mastered'], default: 'open' },
}, { timestamps: true });

module.exports = mongoose.model('Mistake', MistakeSchema);