const mongoose = require('mongoose');

const AptitudeQuestionSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeTopic', required: true },
  category: { type: String, enum: ['quantitative', 'logical', 'verbal'], required: true },
  topic: String, // 'Percentages', 'Number Series', etc.
  subtopic: String, // Optional: 'Simple Percentages', 'Compound Percentages', etc.
  questionText: String,
  questionHTML: String, // For rich text (tables, equations, etc.)
  options: [
    {
      label: String, // 'A', 'B', 'C', 'D'
      text: String,
      isCorrect: Boolean,
    },
  ],
  correctAnswer: String, // 'A', 'B', 'C', or 'D'
  explanation: String, // Why this is correct
  solutionSteps: [String], // Step-by-step solution
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  timeLimit: Number, // seconds to solve
  source: String, // 'TCS NQT', 'Cognizant', 'Custom', etc.
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

AptitudeQuestionSchema.index({ topicId: 1, category: 1, difficulty: 1 });

module.exports = mongoose.model('AptitudeQuestion', AptitudeQuestionSchema);

