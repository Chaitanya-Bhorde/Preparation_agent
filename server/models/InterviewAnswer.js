const mongoose = require('mongoose');

/**
 * InterviewAnswer — the candidate's response to one InterviewQuestion plus its
 * structured evaluation. Text mode stores the typed answer; voice mode stores
 * the speech-to-text transcript (and optionally the raw transcript).
 */
const EvaluationSchema = new mongoose.Schema(
  {
    overall: { type: Number, min: 0, max: 10 },
    correctness: { type: Number, min: 0, max: 10 },
    technicalAccuracy: { type: Number, min: 0, max: 10 },
    completeness: { type: Number, min: 0, max: 10 },
    clarity: { type: Number, min: 0, max: 10 },
    depth: { type: Number, min: 0, max: 10 },
    communication: { type: Number, min: 0, max: 10 },
    verdict: {
      type: String,
      enum: ['correct', 'partially_correct', 'incorrect'],
      default: 'partially_correct',
    },
    strengths: [{ type: String }],
    missingConcepts: [{ type: String }],
    feedback: { type: String }, // concise in-interview feedback
    detailedFeedback: { type: String }, // full feedback shown in the final report
    followUpNeeded: { type: Boolean, default: false },
  },
  { _id: false }
);

const InterviewAnswerSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true,
      index: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewQuestion',
      required: true,
    },
    answerType: { type: String, enum: ['text', 'voice'], required: true },
    text: { type: String, required: true }, // typed answer or edited transcript
    rawTranscript: { type: String }, // unedited speech-to-text output (voice mode)
    evaluation: EvaluationSchema,
    durationSeconds: { type: Number, default: 0 }, // time taken to answer
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One answer per question — guarantees idempotent answer submission.
InterviewAnswerSchema.index({ session: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('InterviewAnswer', InterviewAnswerSchema);
