const mongoose = require('mongoose');

const CodeExampleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, default: 'javascript' },
});

const ConceptNoteSchema = new mongoose.Schema({
  topic: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  summary: { type: String, required: true },
  coreConcept: { type: String, required: true },
  keyPoints: [String],
  commonMistakes: [String],
  codeExamples: [CodeExampleSchema],
  relatedTopics: [String],
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ConceptNote', ConceptNoteSchema);