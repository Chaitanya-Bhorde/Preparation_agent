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
  isSample: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
  explanation: String,
});

const SqlColumnSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
}, { _id: false });

const SqlTableSchema = new mongoose.Schema({
  name: { type: String, required: true },
  columns: [SqlColumnSchema],
  sampleData: [mongoose.Schema.Types.Mixed],
}, { _id: false });

const ProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Please add a title'], trim: true, unique: true },
    slug: { type: String, unique: true },
    description: { type: String, required: [true, 'Please add a description'] },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    tags: [String],
    companies: [String],
    constraints: String,
    category: { type: String, enum: ['DSA', 'SQL'], default: 'DSA' },
    examples: [{ input: String, output: String, explanation: String }],
    testCases: [TestCaseSchema],
    functionSignature: {
      java: FunctionSignatureSchema,
      cpp: FunctionSignatureSchema,
      python: FunctionSignatureSchema,
      javascript: FunctionSignatureSchema,
    },
    driverTemplate: {
      javascript: { type: String, default: '' },
      python: { type: String, default: '' },
      java: { type: String, default: '' },
      cpp: { type: String, default: '' },
      c: { type: String, default: '' },
    },
    starterCode: {
      javascript: { type: String, default: '' },
      python: { type: String, default: '' },
      java: { type: String, default: '' },
      cpp: { type: String, default: '' },
      c: { type: String, default: '' },
    },
    solution: { type: String },
    timeLimit: { type: Number, default: 2 },
    memoryLimit: { type: Number, default: 256 },
    totalSubmissions: { type: Number, default: 0 },
    acceptedSubmissions: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sqlSchema: { tables: [SqlTableSchema] },
    expectedResultSet: [mongoose.Schema.Types.Mixed],
    schemaSetup: { type: String, default: '' },
  },
  { timestamps: true }
);

ProblemSchema.pre('save', function () {
  this.slug = this.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
});

module.exports = mongoose.model('Problem', ProblemSchema);
