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
    // § scoring spec — headline score in MARKS (maxScore = selected × 2).
    score: { type: Number, min: 0 },
    maxScore: { type: Number, min: 0 },
    percentage: { type: Number, min: 0, max: 100 },
    // Deterministic activity stats — main questions vs follow-ups
    stats: {
      selectedQuestionCount: Number,
      mainQuestionsAsked: Number, // ONLY main questions (the selected count)
      mainQuestionsAnswered: Number, // scored main questions
      questionsAsked: Number, // legacy alias of mainQuestionsAsked
      questionsAnswered: Number, // legacy alias of mainQuestionsAnswered
      followUpCount: Number, // adaptive probes (do NOT count toward limit/score)
      followUpsAnswered: Number,
      fullCount: Number, // mains scored 2/2
      partialCount: Number, // mains scored 1/2
      incorrectCount: Number, // mains scored 0/2
      mistakesCount: Number,
    },
    // Per-main-question analysis (the scored set — one row per main question)
    mainQuestions: [{
      questionNumber: Number,
      question: String,
      topic: String,
      userAnswer: String,
      score: Number, // 0 | 1 | 2
      maxScore: Number, // always 2
      result: String, // 'correct' | 'partial' | 'incorrect'
      verdict: String,
      explanation: String,
      missingConcepts: [String],
      expectedAnswer: String,
    }],
    // Supporting AI follow-up conversation (context only — NEVER scored)
    followUps: [{
      question: String,
      userAnswer: String,
      feedback: String,
    }],
    mistakes: [String], // detected mistakes from MAIN answers only
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
    submissionReason: {
      type: String,
      enum: ['COMPLETED', 'PROCTORING_VIOLATION', 'USER_EXITED', 'ABANDONED'],
      default: 'COMPLETED',
    },
    proctoringViolations: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Transient failure trace (§ state machine): records the last recoverable
    // AI/analysis failure so it is observable for resume + debugging. Cleared
    // automatically once the pipeline recovers. The session `status` itself is
    // NEVER flipped to a failure state — a transient LLM blip must not block
    // the interview lifecycle.
    transientFailure: {
      type: {
        type: String,
        enum: ['GENERATION_FAILED', 'ANALYSIS_FAILED', 'SUBMISSION_FAILED'],
      },
      message: { type: String, default: '' },
      at: { type: Date },
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
