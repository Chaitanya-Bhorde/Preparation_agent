const User = require('../models/User');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const AptitudeResult = require('../models/AptitudeResult');
const InterviewSession = require('../models/InterviewSession');

exports.getInterviewReadiness = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const totalProblemsInBank = await Problem.countDocuments({ isActive: true });
    const solvedProblemIds = await Submission.find({
      user: userId,
      status: 'accepted',
    }).distinct('problem');
    const problemsSolved = solvedProblemIds.length;
    const codingAccuracy = totalProblemsInBank > 0
      ? Math.round((problemsSolved / totalProblemsInBank) * 100)
      : 0;

    const aptitudeResults = await AptitudeResult.find({ user: userId }).select('score');
    const aptitudeScore = aptitudeResults.length > 0
      ? Math.round(aptitudeResults.reduce((sum, r) => sum + r.score, 0) / aptitudeResults.length)
      : 0;

    const atsScore = user.profile?.atsScore || 0;
    const hasResume = !!(user.profile?.resumeUrl);

    const mockInterviews = await InterviewSession.find({ user: userId, status: 'COMPLETED' }).select('score');
    const mockInterviewScore = mockInterviews.length > 0
      ? Math.round(mockInterviews.reduce((sum, m) => sum + (m.score || 0), 0) / mockInterviews.length)
      : 0;

    const weights = { coding: 0.5, aptitude: 0.2, ats: 0.15, mock: 0.15 };
    const categories = [
      { value: codingAccuracy, weight: weights.coding, hasData: problemsSolved > 0 },
      { value: aptitudeScore, weight: weights.aptitude, hasData: aptitudeResults.length > 0 },
      { value: atsScore, weight: weights.ats, hasData: hasResume },
      { value: mockInterviewScore, weight: weights.mock, hasData: mockInterviews.length > 0 },
    ];
    const availableCategories = categories.filter((c) => c.hasData);
    let score = 0;
    if (availableCategories.length > 0) {
      const weightedSum = availableCategories.reduce((sum, c) => sum + c.value * c.weight, 0);
      const weightSum = availableCategories.reduce((sum, c) => sum + c.weight, 0);
      score = Math.round(weightedSum / weightSum);
    }

    let label = 'Beginner';
    if (score >= 80) label = 'Interview Ready';
    else if (score >= 60) label = 'Almost There';
    else if (score >= 40) label = 'In Progress';

    res.status(200).json({
      success: true,
      data: {
        score: Math.min(score, 100),
        label,
        breakdown: {
          codingAccuracy,
          aptitudeScore,
          atsScore,
          mockInterviewScore,
          weights,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
