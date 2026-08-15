const mongoose = require('mongoose');

const InputFormatSchema = new mongoose.Schema({
  paramName: { type: String, required: true },
  type: { type: String, required: true },
  constraints: { type: String },
}, { _id: false });

const OutputFormatSchema = new mongoose.Schema({
  type: { type: String, required: true },
  description: { type: String },
}, { _id: false });

const SampleTestSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String },
}, { _id: false });

const HiddenTestSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
}, { _id: false });

const FunctionParamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
}, { _id: false });

const FunctionSignatureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  params: [FunctionParamSchema],
  returnType: { type: String, required: true },
}, { _id: false });

const CodingProblemSchema = new mongoose.Schema(
  {
    problemId: {
      type: String,
      required: [true, 'Please add a problemId'],
      unique: true,
      trim: true,
    },
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
    companies: [String],
    inputFormat: [InputFormatSchema],
    outputFormat: OutputFormatSchema,
    sampleTests: [SampleTestSchema],
    hiddenTests: [HiddenTestSchema],
    // Metadata-driven reference solver. `code` is a self-contained JS function
    // expression (`function solve(...) {...}`) taking the problem's positional
    // args; consumed by genericValidator.computeExpectedFromReference when a
    // stored expected output is absent. Not exposed to learners.
    referenceSolution: {
      code: { type: String, default: '' },
      language: { type: String, default: 'javascript' },
    },
    constraints: [String],
    starterCode: {
      javascript: { type: String, default: '' },
      python: { type: String, default: '' },
      java: { type: String, default: '' },
      cpp: { type: String, default: '' },
      c: { type: String, default: '' },
      csharp: { type: String, default: '' },
    },
    functionSignature: {
      javascript: FunctionSignatureSchema,
      python: FunctionSignatureSchema,
      java: FunctionSignatureSchema,
      cpp: FunctionSignatureSchema,
      c: FunctionSignatureSchema,
      csharp: FunctionSignatureSchema,
    },
         timeLimitMs: {
      type: Number,
      default: 2000,
    },
    memoryLimitKb: {
      type: Number,
      default: 256000,
    },
    likes: {
      type: Number,
      default: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
    },
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    dislikedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
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

CodingProblemSchema.index({ topic: 1 });
CodingProblemSchema.index({ difficulty: 1 });
CodingProblemSchema.index({ title: 1 });
CodingProblemSchema.index({ topic: 1, difficulty: 1 });
CodingProblemSchema.index({ problemId: 1 });

CodingProblemSchema.pre('save', function () {
  this.slug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
});

module.exports = mongoose.model('CodingProblem', CodingProblemSchema);