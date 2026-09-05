const mongoose = require('mongoose');

/**
 * InterviewQuestion — a single AI-generated (or fallback) interview question
 * belonging to an InterviewSession. Follow-up questions link to their parent.
 */
const InterviewQuestionSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true,
      index: true,
    },
    order: { type: Number, required: true }, // display order within the session (1-based)
    topic: { type: String, required: true }, // canonical field label
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ['conceptual', 'comparison', 'scenario', 'coding', 'troubleshooting'],
      default: 'conceptual',
    },
    expectedConcepts: [{ type: String }],
    expectedAnswer: { type: String }, // ideal answer used for evaluation + report
    isFollowUp: { type: Boolean, default: false },
    parentQuestion: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewQuestion' },
    source: { type: String, enum: ['ai', 'fallback'], default: 'ai' },
    askedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

InterviewQuestionSchema.index({ session: 1, order: 1 });

module.exports = mongoose.model('InterviewQuestion', InterviewQuestionSchema);
