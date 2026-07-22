const User = require('../models/User');
const Submission = require('../models/Submission');

exports.getInterviewReadiness = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const totalSubmissions = await Submission.countDocuments({ user: userId });
    const acceptedSubmissions = await Submission.countDocuments({ user: userId, status: 'accepted' });
    const codingAccuracy = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;
    const aptitudeScore = 85;
    const atsScore = user.profile?.atsScore || 0;
    const mockInterviewScore = 70;
    const weights = { coding: 0.5, aptitude: 0.2, ats: 0.15, mock: 0.15 };
    const score = Math.round((codingAccuracy * weights.coding) + (aptitudeScore * weights.aptitude) + (atsScore * weights.ats) + (mockInterviewScore * weights.mock));
    let label = 'Beginner';
    if (score >= 80) label = 'Interview Ready';
    else if (score >= 60) label = 'Almost There';
    else if (score >= 40) label = 'In Progress';
    res.status(200).json({ success: true, data: { score: Math.min(score, 100), label, breakdown: { codingAccuracy, aptitudeScore, atsScore, mockInterviewScore, weights } } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};