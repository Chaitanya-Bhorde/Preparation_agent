const mongoose = require('mongoose');

const SQLTestCaseSchema = new mongoose.Schema({
  inputStateSQL: { type: String },
  expectedOutputRows: [mongoose.Schema.Types.Mixed],
}, { _id: false });

const SQLSchemaTableSchema = new mongoose.Schema({
  tableName: { type: String, required: true },
  columns: [{
    name: { type: String, required: true },
    type: { type: String, required: true }
  }],
  notes: String,
}, { _id: false });

const SQLExampleSchema = new mongoose.Schema({
  exampleNumber: { type: Number, required: true },
  inputTables: [{
    tableName: { type: String, required: true },
    rows: [mongoose.Schema.Types.Mixed],
  }],
  outputTable: {
    columns: [String],
    rows: [mongoose.Schema.Types.Mixed],
  },
  explanation: String,
}, { _id: false });

const SQLProblemSchema = new mongoose.Schema({
  problemNumber: { type: Number, unique: true, sparse: true },
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
  topics: [{ type: String }],
  tags: [String],
  companies: [String],
  schemaTables: [SQLSchemaTableSchema],
  examples: [SQLExampleSchema],
  constraints: [String],
  schemaSetupSQL: {
    type: String,
    required: true,
  },
  sampleTestCases: [SQLTestCaseSchema],
  hiddenTestCases: [SQLTestCaseSchema],
  referenceSolutionSQL: {
    type: String,
    default: '',
  },
  isActive: { type: Boolean, default: true },
  totalSubmissions: { type: Number, default: 0 },
  acceptedSubmissions: { type: Number, default: 0 },
  acceptanceRate: { type: Number, default: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

SQLProblemSchema.pre('save', function () {
  this.slug = this.title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-');
});

module.exports = mongoose.model('SQLProblem', SQLProblemSchema);