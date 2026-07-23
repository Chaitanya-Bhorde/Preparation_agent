const mongoose = require('mongoose');

const RoleRequirementSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  requiredSkills: [
    {
      skill: { type: String, required: true },
      weight: { type: Number, default: 1 },
      category: { type: String, enum: ['technical', 'soft', 'domain', 'tool'], default: 'technical' },
    },
  ],
  keywords: [String],
  minExperience: {
    years: { type: Number, default: 0 },
    description: String,
  },
  educationRequirements: [String],
  preferredSkills: [String],
  scoringWeights: {
    technicalSkills: { type: Number, default: 0.3 },
    experience: { type: Number, default: 0.25 },
    education: { type: Number, default: 0.15 },
    projects: { type: Number, default: 0.15 },
    achievements: { type: Number, default: 0.1 },
    keywordDensity: { type: Number, default: 0.05 },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('RoleRequirements', RoleRequirementSchema);