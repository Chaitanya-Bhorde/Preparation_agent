const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
}, { _id: false });

const AptitudeQuestionSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    question: { type: String, required: true },
    options: {
      type: [OptionSchema],
      required: true,
      validate: { validator: function (arr) { return Array.isArray(arr) && arr.length >= 2; }, message: 'At least 2 options are required' },
    },
    correctIndex: { type: Number, required: true, min: 0 },
    explanation: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    topic: { type: String },
    tags: [String],
    companies: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AptitudeQuestion', AptitudeQuestionSchema);
