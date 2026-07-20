const mongoose = require('mongoose');
const TestCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isSample: { type: Boolean, default: false },
  explanation: String,
});
const ProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    tags: [String],
    constraints: String,
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    testCases: [TestCaseSchema],
    solution: {
      type: String,
    },
    timeLimit: {
      type: Number,
      default: 2, 
    },
    memoryLimit: {
      type: Number,
      default: 256, 
    },
    totalSubmissions: { type: Number, default: 0 },
    acceptedSubmissions: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);
ProblemSchema.pre('save', function () {
  this.slug = this.title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-');
});
module.exports = mongoose.model('Problem', ProblemSchema);