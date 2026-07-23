const mongoose = require('mongoose');

const CompanyInfoSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  testPattern: String,
  rounds: [String],
  eligibility: String,
  topics: [String],
  packageRange: String,
  interviewQuestions: [
    {
      question: { type: String, required: true },
      category: { type: String, enum: ['Technical', 'HR', 'Aptitude', 'Coding', 'System Design'], default: 'Technical' },
      difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
      hint: String,
      expectedAnswer: String,
    }
  ],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('CompanyInfo', CompanyInfoSchema);