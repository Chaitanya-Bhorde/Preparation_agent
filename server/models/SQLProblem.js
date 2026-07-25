const mongoose = require('mongoose');

const SQLTestCaseSchema = new mongoose.Schema({
  inputStateSQL: { type: String, required: true },
  expectedOutputRows: [mongoose.Schema.Types.Mixed],
}, { _id: false });

const SQLProblemSchema = new mongoose.Schema({
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