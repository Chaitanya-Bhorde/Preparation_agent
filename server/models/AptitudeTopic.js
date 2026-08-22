const mongoose = require('mongoose');

const AptitudeTopicSchema = new mongoose.Schema({
  name: String, // 'Percentages', 'Number Series', etc.
  category: { type: String, enum: ['quantitative', 'logical', 'verbal'], required: true },
  description: String,
  priority: { type: String, enum: ['must-do', 'high', 'medium', 'low'] },
  subtopics: [String], // e.g., ['Simple Percentages', 'Compound Percentages']
  resources: [String], // Links to tutorials, formulas, etc.
  estimatedTime: Number, // minutes to complete 50 questions
  totalQuestions: { type: Number, default: 50 },
  createdAt: { type: Date, default: Date.now },
});

AptitudeTopicSchema.index({ category: 1, priority: -1 });

module.exports = mongoose.model('AptitudeTopic', AptitudeTopicSchema);
