const Submission = require('../models/Submission');
const User = require('../models/User');
const Problem = require('../models/Problem');
exports.getAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSubmissions = await Submission.find({
      user: req.user.id,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: 1 });
    const dailyActivity = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dailyActivity[date] = { submissions: 0, accepted: 0 };
    }
    recentSubmissions.forEach((sub) => {
      const date = sub.createdAt.toISOString().split('T')[0];
      if (dailyActivity[date]) {
        dailyActivity[date].submissions += 1;
        if (sub.status === 'accepted') dailyActivity[date].accepted += 1;
      }
    });
    const difficultyDistribution = {
      easy: user.stats.easySolved || 0,
      medium: user.stats.mediumSolved || 0,
      hard: user.stats.hardSolved || 0,
    };
    const allSubmissions = await Submission.find({ user: req.user.id, type: 'submit' });
    // Track distinct problems per tag (not per-submission)
    const tagProblemSets = {};
    const tagAcceptedSets = {};
    allSubmissions.forEach((sub) => {
      // BUG 2 FIX: Use problemTags field for DSA/CodingProblem submissions (where problem ref is CodingProblem, not Problem)
      // Fall back to sub.problem.tags for legacy Problem-model submissions
      let tags = sub.problemTags;
      if ((!tags || tags.length === 0) && sub.problem && sub.problem.tags) {
        tags = sub.problem.tags;
      }
      if (tags && tags.length > 0) {
        const pid = sub.problem ? sub.problem._id.toString() : sub._id.toString();
        tags.forEach((tag) => {
          if (!tagProblemSets[tag]) tagProblemSets[tag] = new Set();
          if (!tagAcceptedSets[tag]) tagAcceptedSets[tag] = new Set();
          tagProblemSets[tag].add(pid);
          if (sub.status === 'accepted') {
            tagAcceptedSets[tag].add(pid);
          }
        });
      }
    });
    const topicPerformance = {};
    Object.keys(tagProblemSets).forEach((tag) => {
      topicPerformance[tag] = {
        total: tagProblemSets[tag].size,
        accepted: tagAcceptedSets[tag] ? tagAcceptedSets[tag].size : 0,
      };
    });
    const overallStats = {
      totalSolved: user.stats.totalSolved || 0,
      totalSubmissions: user.stats.totalSubmissions || 0,
      acceptanceRate: user.stats.totalSubmissions > 0
        ? Math.round((user.stats.totalSolved / user.stats.totalSubmissions) * 100)
        : 0,
      currentStreak: user.stats.streak || 0,
      atsScore: user.profile.atsScore || 0,
    };
    const rank = await User.countDocuments({
      'stats.totalSolved': { $gt: user.stats.totalSolved },
    });
    res.status(200).json({
      success: true,
      data: {
        overallStats,
        difficultyDistribution,
        dailyActivity: Object.entries(dailyActivity)
          .map(([date, data]) => ({ date, ...data }))
          .reverse(),
        topicPerformance: Object.entries(topicPerformance).map(([topic, data]) => ({
          topic,
          total: data.total,
          accepted: data.accepted,
          successRate: Math.round((data.accepted / data.total) * 100) || 0,
        })),
        rank: rank + 1,
        weakTopics: user.weakTopics || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalProblems = await Problem.countDocuments({ isActive: true });
    const totalSubmissions = await Submission.countDocuments();
    const easyCount = await Problem.countDocuments({ difficulty: 'easy', isActive: true });
    const mediumCount = await Problem.countDocuments({ difficulty: 'medium', isActive: true });
    const hardCount = await Problem.countDocuments({ difficulty: 'hard', isActive: true });
    const topStudents = await User.find({ role: 'student' })
      .sort({ 'stats.totalSolved': -1 })
      .limit(5)
      .select('name email stats.totalSolved profile.college');
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalProblems,
        totalSubmissions,
        problemDistribution: { easy: easyCount, medium: mediumCount, hard: hardCount },
        topStudents,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};