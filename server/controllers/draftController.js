const Draft = require('../models/Draft');

// @desc    Save draft code (upsert)
// @route   POST /api/drafts
// @access  Private
exports.saveDraft = async (req, res) => {
  try {
    const { problemId, language, code } = req.body;
    if (!problemId || !language || code === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide problemId, language, and code' });
    }
    const draft = await Draft.findOneAndUpdate(
      { user: req.user.id, problem: problemId, language },
      { code, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, data: draft });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get draft for a problem+language
// @route   GET /api/drafts
// @access  Private
exports.getDraft = async (req, res) => {
  try {
    const { problemId, language } = req.query;
    if (!problemId || !language) {
      return res.status(400).json({ success: false, message: 'Please provide problemId and language' });
    }
    const draft = await Draft.findOne({ user: req.user.id, problem: problemId, language }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: draft });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all drafts for a user (optional)
// @route   GET /api/drafts/all
// @access  Private
exports.getAllDrafts = async (req, res) => {
  try {
    const drafts = await Draft.find({ user: req.user.id })
      .populate('problem', 'title slug difficulty')
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: drafts.length, data: drafts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete draft
// @route   DELETE /api/drafts
// @access  Private
exports.deleteDraft = async (req, res) => {
  try {
    const { problemId, language } = req.body;
    if (!problemId || !language) {
      return res.status(400).json({ success: false, message: 'Please provide problemId and language' });
    }
    await Draft.findOneAndDelete({ user: req.user.id, problem: problemId, language });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};