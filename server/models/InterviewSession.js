const mongoose = require('mongoose');

/**
 * InterviewSession — one AI mock interview run.
 * Interview-level state lives here; questions and answers live in their own
 * collections and reference this document.
 */
const FinalReportSchema = new mongoose.Schema(
  {
    overallScore: { type: Number, min: 0, max: 100 },
    maxScore: { type: Number, default: 100 },
    topicPerformance: [
      {
        topic: String,
        averageScore: Number, // 0-10
        questionsAsked: Number,
      },
    ],
    skills: {
      conceptualUnderstanding: Number, // 0-10
      problemSolving: Number, // 0-10
      technicalDepth: Number, // 0-10
      accuracy: Number, // 0-10
    },
    communication: {
      clarity: Number, // 0-10
      conciseness: Number, // 0-10
      confidenceIndicator: String, // 'not_available' | 'low' | 'moderate' | 'good' | 'strong'
      notes: String,
    },
    strengths: [String],
    areasToImprove: [String],
    assessment: String, // final AI assessment paragraph
    recommendedTopics: [String],
    generatedBy: { type: String, enum: ['ai', 'deterministic-fallback'], default: 'ai' },
  },
  { _id: false }
);

const InterviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topics: [{ type: String, required: true }], // canonical field labels
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      required: true,
    },
    experienceLevel: {
      type: String,
      enum: ['fresher', 'junior', 'intermediate', 'advanced'],
      default: 'fresher',
    },
    mode: {
      type: String,
      enum: ['text', 'voice'],
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 5,
      max: 20,
    },
    status: {
      type: String,
      enum: ['CREATED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ABANDONED'],
      default: 'CREATED',
      index: true,
    },
    currentQuestionIndex: { type: Number, default: 0 }, // main questions answered so far
    score: { type: Number, default: 0, min: 0, max: 100 }, // filled on completion
    finalReport: FinalReportSchema,
    startedAt: { type: Date },
    lastActivityAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Only one "active" session per user is surfaced for resume.
InterviewSessionSchema.index({ user: 1, status: 1, lastActivityAt: -1 });

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);
