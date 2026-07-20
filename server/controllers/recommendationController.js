const User = require('../models/User');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
exports.getRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const weakTopics = user.weakTopics || [];
    const solvedProblemIds = await Submission.find({
      user: req.user.id,
      status: 'accepted',
    }).distinct('problem');
    let recommendations = [];
    if (weakTopics.length > 0) {
      const weakProblems = await Problem.find({
        tags: { $in: weakTopics },
        _id: { $nin: solvedProblemIds },
        isActive: true,
      })
        .select('-testCases -solution')
        .limit(5)
        .sort({ acceptanceRate: 1 });
      recommendations.push(...weakProblems);
    }
    const recentSubmissions = await Submission.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    const recentSuccessRate = recentSubmissions.filter((s) => s.status === 'accepted').length / Math.max(recentSubmissions.length, 1);
    let targetDifficulty;
    if (recentSuccessRate > 0.7) {
      targetDifficulty = 'hard';
    } else if (recentSuccessRate > 0.4) {
      targetDifficulty = 'medium';
    } else {
      targetDifficulty = 'easy';
    }
    const remainingCount = 10 - recommendations.length;
    if (remainingCount > 0) {
      const adaptiveProblems = await Problem.find({
        difficulty: targetDifficulty,
        _id: { $nin: [...solvedProblemIds, ...recommendations.map((r) => r._id)] },
        isActive: true,
      })
        .select('-testCases -solution')
        .limit(remainingCount)
        .sort({ acceptanceRate: -1 });
      recommendations.push(...adaptiveProblems);
    }
    const revisionProblems = await Problem.find({
      _id: { $in: user.revisionQueue.map((r) => r.problem) },
    }).select('-testCases -solution');
    res.status(200).json({
      success: true,
      data: {
        recommendations,
        revisionQueue: revisionProblems,
        weakTopics,
        targetDifficulty,
        recentSuccessRate: Math.round(recentSuccessRate * 100),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.addToRevision = async (req, res) => {
  try {
    const { problemId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $addToSet: { revisionQueue: { problem: problemId } },
      },
      { new: true }
    );
    res.status(200).json({ success: true, data: user.revisionQueue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.removeFromRevision = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: { revisionQueue: { problem: req.params.problemId } },
      },
      { new: true }
    );
    res.status(200).json({ success: true, data: user.revisionQueue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};