const Submission = require('../models/Submission');
const User = require('../models/User');
const Problem = require('../models/Problem');

function getDateRange(range) {
  const now = Date.now();
  if (range === 'weekly') return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (range === 'monthly') return new Date(now - 30 * 24 * 60 * 60 * 1000);
  return new Date(0);
}

exports.getAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const range = req.query.range || 'monthly';
    const rangeDate = getDateRange(range);

    const baseQuery = { user: req.user.id, type: 'submit' };
    const rangeQuery = { ...baseQuery, createdAt: { $gte: rangeDate } };

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

    const allSubmissions = await Submission.find(baseQuery).populate('problem', 'tags');
    const tagProblemSets = {};
    const tagAcceptedSets = {};
    allSubmissions.forEach((sub) => {
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
          if (sub.status === 'accepted') tagAcceptedSets[tag].add(pid);
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

    function getCategoryStats(category) {
      const catSubs = allSubmissions.filter(s => s.category === category);
      const catRangeSubs = catSubs.filter(s => s.createdAt >= rangeDate);
      const solved = new Set();
      const accepted = new Set();
      const tagSets = {};
      const tagAccepted = {};

      catSubs.forEach((sub) => {
        const pid = sub.problem ? sub.problem._id.toString() : sub._id.toString();
        solved.add(pid);
        if (sub.status === 'accepted') accepted.add(pid);
        const tags = sub.problemTags || [];
        tags.forEach((tag) => {
          if (!tagSets[tag]) tagSets[tag] = new Set();
          if (!tagAccepted[tag]) tagAccepted[tag] = new Set();
          tagSets[tag].add(pid);
          if (sub.status === 'accepted') tagAccepted[tag].add(pid);
        });
      });

      const rangeSolved = new Set();
      const rangeAccepted = new Set();
      catRangeSubs.forEach((sub) => {
        const pid = sub.problem ? sub.problem._id.toString() : sub._id.toString();
        rangeSolved.add(pid);
        if (sub.status === 'accepted') rangeAccepted.add(pid);
      });

      const topics = Object.keys(tagSets).map((tag) => ({
        topic: tag,
        total: tagSets[tag].size,
        accepted: tagAccepted[tag] ? tagAccepted[tag].size : 0,
        successRate: tagSets[tag].size > 0 ? Math.round((tagAccepted[tag]?.size || 0) / tagSets[tag].size * 100) : 0,
      })).sort((a, b) => b.total - a.total);

      return {
        totalSolved: solved.size,
        totalAccepted: accepted.size,
        rangeSolved: rangeSolved.size,
        rangeAccepted: rangeAccepted.size,
        acceptanceRate: solved.size > 0 ? Math.round(accepted.size / solved.size * 100) : 0,
        topics,
      };
    }

    const overallStats = {
      totalSolved: user.stats.totalSolved || 0,
      totalSubmissions: user.stats.totalSubmissions || 0,
      acceptanceRate: user.stats.totalSubmissions > 0
        ? Math.round((user.stats.totalSolved / user.stats.totalSubmissions) * 100) : 0,
      currentStreak: user.stats.streak || 0,
      atsScore: user.profile.atsScore || 0,
    };

    const rank = await User.countDocuments({ 'stats.totalSolved': { $gt: user.stats.totalSolved } });

    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const yearSubmissions = await Submission.find({
      user: req.user.id,
      createdAt: { $gte: oneYearAgo },
      status: 'accepted',
    }).select('createdAt');
    const heatmapData = {};
    yearSubmissions.forEach((sub) => {
      const date = sub.createdAt.toISOString().split('T')[0];
      heatmapData[date] = (heatmapData[date] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        overallStats,
        difficultyDistribution,
        dailyActivity: Object.entries(dailyActivity).map(([date, d]) => ({ date, ...d })).reverse(),
        topicPerformance: Object.entries(topicPerformance).map(([topic, data]) => ({
          topic,
          total: data.total,
          accepted: data.accepted,
          successRate: Math.round((data.accepted / data.total) * 100) || 0,
        })),
        rank: rank + 1,
        weakTopics: user.weakTopics || [],
        heatmapData,
        dsa: getCategoryStats('dsa'),
        sql: getCategoryStats('sql'),
        aptitude: getCategoryStats('aptitude'),
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
      .sort({ 'stats.totalSolved': -1 }).limit(5)
      .select('name email stats.totalSolved profile.college');
    res.status(200).json({
      success: true,
      data: {
        totalUsers, totalStudents, totalProblems, totalSubmissions,
        problemDistribution: { easy: easyCount, medium: mediumCount, hard: hardCount },
        topStudents,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};