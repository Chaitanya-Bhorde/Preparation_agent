const mongoose = require('mongoose');

const FunctionParamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
}, { _id: false });

const FunctionSignatureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  params: [FunctionParamSchema],
  returnType: { type: String, required: true },
}, { _id: false });

const TestCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  explanation: String,
});

const CodingProblemSchema = new mongoose.Schema(
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
    topic: {
      type: String,
      required: true,
    },
    tags: [String],
    constraints: [String],
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    visibleTestCases: [TestCaseSchema],
    hiddenTestCases: [TestCaseSchema],
    starterCode: {
      cpp: { type: String, default: '' },
      java: { type: String, default: '' },
      python: { type: String, default: '' },
      javascript: { type: String, default: '' },
    },
    functionSignature: {
      java: FunctionSignatureSchema,
      cpp: FunctionSignatureSchema,
      python: FunctionSignatureSchema,
      javascript: FunctionSignatureSchema,
    },
    timeLimitMs: {
      type: Number,
      default: 2000,
    },
    memoryLimitKb: {
      type: Number,
      default: 256,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

CodingProblemSchema.pre('save', function () {
  this.slug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
});

module.exports = mongoose.model('CodingProblem', CodingProblemSchema);