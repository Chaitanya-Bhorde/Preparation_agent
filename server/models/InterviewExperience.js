const mongoose = require('mongoose');

const InterviewExperienceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true,
  },
  role: {
    type: String,
    required: [true, 'Please add the role you applied for'],
    trim: true,
  },
  year: {
    type: String,
    required: [true, 'Please add the year'],
    default: new Date().getFullYear().toString(),
  },
  roundType: {
    type: String,
    enum: ['Online Assessment', 'Technical Round 1', 'Technical Round 2', 'HR Round', 'Managerial Round', 'Other'],
    default: 'Technical Round 1',
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Very Hard'],
    default: 'Medium',
  },
  questions: [{
    question: { type: String, required: true },
    answer: String,
    topic: String,
  }],
  experience: {
    type: String,
    required: [true, 'Please share your interview experience'],
    maxlength: [5000, 'Experience cannot be more than 5000 characters'],
  },
  tips: {
    type: String,
    maxlength: [2000, 'Tips cannot be more than 2000 characters'],
  },
  offerReceived: {
    type: Boolean,
    default: false,
  },
  packageOffered: String,
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
InterviewExperienceSchema.index({ company: 1, createdAt: -1 });
InterviewExperienceSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewExperience', InterviewExperienceSchema);