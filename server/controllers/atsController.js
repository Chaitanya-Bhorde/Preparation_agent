const { analyzeResume, parseResumeText } = require('../utils/atsAnalyzer');
const User = require('../models/User');
exports.analyzeResumeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a resume file' });
    }
    const text = parseResumeText(req.file.buffer, req.file.mimetype);
    const result = analyzeResume(text);
    await User.findByIdAndUpdate(req.user.id, {
      'profile.atsScore': result.overallScore,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.analyzeResumeText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Please provide resume text' });
    }
    const result = analyzeResume(text);
    await User.findByIdAndUpdate(req.user.id, {
      'profile.atsScore': result.overallScore,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};