const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

TopicSchema.index({ subject: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Topic', TopicSchema);
