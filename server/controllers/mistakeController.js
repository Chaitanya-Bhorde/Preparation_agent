const Mistake = require('../models/Mistake');
const Submission = require('../models/Submission');

exports.createMistake = async (req, res) => {
  try {
    const { submissionId, mistakeType, personalNote, topic } = req.body;
    const mistake = await Mistake.create({ user: req.user.id, submission: submissionId, problem: req.body.problemId || null, mistakeType, personalNote: personalNote || '', topic: topic || '' });
    res.status(201).json({ success: true, data: mistake });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getMyMistakes = async (req, res) => {
  try {
    const { type, topic } = req.query;
    const query = { user: req.user.id };
    if (type) query.mistakeType = type;
    if (topic) query.topic = topic;
    const mistakes = await Mistake.find(query).populate('problem', 'title slug tags').populate('submission', 'status createdAt').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: mistakes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateMistakeStatus = async (req, res) => {
  try {
    const mistake = await Mistake.findById(req.params.id);
    if (!mistake) return res.status(404).json({ success: false, message: 'Mistake not found' });
    if (mistake.user.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    mistake.status = req.body.status || mistake.status;
    await mistake.save();
    res.status(200).json({ success: true, data: mistake });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};