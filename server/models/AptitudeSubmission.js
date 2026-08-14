const mongoose = require('mongoose');

const AptitudeSubmissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeQuestion', required: true },
    selectedIndex: { type: Number, required: true },
    correct: { type: Boolean, required: true },
    category: { type: String },
    difficulty: { type: String },
    tags: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('AptitudeSubmission', AptitudeSubmissionSchema);
