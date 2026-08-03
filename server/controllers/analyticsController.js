const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const User = require('../models/User');
const Problem = require('../models/Problem');

const CATEGORIES = ['dsa', 'sql', 'aptitude', 'overall'];

function isValidCategory(cat) {
  return CATEGORIES.includes(cat);
}

function categoryMatch(category, userId) {
  const match = { type: 'submit', user: new mongoose.Types.ObjectId(userId) };
  if (category !== 'overall') match.category = category;
  return match;
}

function assertOwnScope(userId, reqUser) {
  return userId === reqUser.id || reqUser.role === 'admin';
}

function dateStr(d) {
  const x = new Date(d);
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, '0')}-${String(x.getUTCDate()).padStart(2, '0')}`;
}

async function aggregateUserStats(category, userId) {
  const docs = await Submission.find(categoryMatch(category, userId))
    .select('status problem problemDifficulty problemTags createdAt')
    .lean();
  const attempted = new Set();
  const solved = new Set();
  const solvedByDifficulty = { easy: new Set(), medium: new Set(), hard: new Set() };
  const tagTotal = {};
  const tagSolved = {};
  let totalSubmissions = 0;
  let acceptedSubmissions = 0;
  docs.forEach((sub) => {
    totalSubmissions += 1;
    if (sub.status === 'accepted') acceptedSubmissions += 1;
    const pid = sub.problem ? sub.problem.toString() : null;
    if (pid) {
      attempted.add(pid);
      if (sub.status === 'accepted') {
        solved.add(pid);
        const diff = sub.problemDifficulty || 'easy';
        const bucket = solvedByDifficulty[diff] || solvedByDifficulty.easy;
        bucket.add(pid);
      }
    }
    (sub.problemTags || []).forEach((tag) => {
      if (!tagTotal[tag]) { tagTotal[tag] = new Set(); tagSolved[tag] = new Set(); }
      if (pid) tagTotal[tag].add(pid);
      if (pid && sub.status === 'accepted') tagSolved[tag].add(pid);
    });
  });
  return { attempted, solved, solvedByDifficulty, tagTotal, tagSolved, totalSubmissions, acceptedSubmissions };
}

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
    }).select('createdAt category');
    // Global heatmap (overview) + per-category heatmaps so DSA/SQL/Aptitude each render their OWN chart.
    const heatmapData = {};
    const heatmapByCategory = { dsa: {}, sql: {}, aptitude: {} };
    yearSubmissions.forEach((sub) => {
      const date = sub.createdAt.toISOString().split('T')[0];
      heatmapData[date] = (heatmapData[date] || 0) + 1;
      const cat = sub.category || 'dsa';
      if (heatmapByCategory[cat]) {
        heatmapByCategory[cat][date] = (heatmapByCategory[cat][date] || 0) + 1;
      }
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
        heatmapDataDsa: heatmapByCategory.dsa,
        heatmapDataSql: heatmapByCategory.sql,
        heatmapDataAptitude: heatmapByCategory.aptitude,
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

// @desc    Per-module summary for a user (dsa | sql | aptitude | overall)
// @route   GET /api/analytics/:category/summary/:userId
exports.getCategorySummary = async (req, res) => {
  try {
    const { category, userId } = req.params;
    if (!isValidCategory(category)) {
      return res.status(400).json({ success: false, message: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` });
    }
    if (!assertOwnScope(userId, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this user' });
    }

    const { attempted, solved, solvedByDifficulty, totalSubmissions, acceptedSubmissions } = await aggregateUserStats(category, userId);
    const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        category,
        userId,
        totalSolved: solved.size,
        totalAttempted: attempted.size,
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate,
        difficulty: {
          easy: solvedByDifficulty.easy.size,
          medium: solvedByDifficulty.medium.size,
          hard: solvedByDifficulty.hard.size,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Per-module daily activity heatmap + streak
// @route   GET /api/analytics/:category/heatmap/:userId
exports.getCategoryHeatmap = async (req, res) => {
  try {
    const { category, userId } = req.params;
    if (!isValidCategory(category)) {
      return res.status(400).json({ success: false, message: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` });
    }
    if (!assertOwnScope(userId, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this user' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const match = categoryMatch(category, userId);
    match.createdAt = { $gte: oneYearAgo };
    const subs = await Submission.find(match).select('status createdAt').lean();

    const heatmap = {};
    for (let i = 0; i < 365; i++) {
      const d = new Date(oneYearAgo);
      d.setDate(d.getDate() + i);
      heatmap[dateStr(d)] = { count: 0, accepted: 0 };
    }
    const acceptedDates = [];
    subs.forEach((sub) => {
      const ds = dateStr(sub.createdAt);
      if (heatmap[ds]) {
        heatmap[ds].count += 1;
        if (sub.status === 'accepted') {
          heatmap[ds].accepted += 1;
          acceptedDates.push(ds);
        }
      }
    });

    const uniqueAccepted = [...new Set(acceptedDates)].sort().reverse();

    let currentStreak = 0;
    if (uniqueAccepted.length > 0) {
      const todayStr = dateStr(today);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = dateStr(yesterday);
      let cursor = uniqueAccepted[0] === todayStr ? new Date(today) : (uniqueAccepted[0] === yesterdayStr ? yesterday : null);
      if (cursor) {
        for (const ds of uniqueAccepted) {
          if (dateStr(cursor) === ds) {
            currentStreak += 1;
            cursor.setDate(cursor.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    let maxStreak = 0;
    let temp = 0;
    let prev = null;
    for (const ds of uniqueAccepted) {
      if (prev) {
        const a = new Date(prev);
        const b = new Date(ds);
        temp = Math.round((a - b) / (1000 * 60 * 60 * 24)) === 1 ? temp + 1 : 1;
      } else {
        temp = 1;
      }
      maxStreak = Math.max(maxStreak, temp);
      prev = ds;
    }

    res.status(200).json({
      success: true,
      data: { category, userId, currentStreak, maxStreak, heatmap },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Per-module topic-wise solved breakdown
// @route   GET /api/analytics/:category/topics/:userId
exports.getCategoryTopics = async (req, res) => {
  try {
    const { category, userId } = req.params;
    if (!isValidCategory(category)) {
      return res.status(400).json({ success: false, message: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` });
    }
    if (!assertOwnScope(userId, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this user' });
    }

    const docs = await Submission.find(categoryMatch(category, userId))
      .select('status problem problemDifficulty problemTags')
      .lean();

    const tagTotal = {};
    const tagSolved = {};
    const tagSolvedByDiff = {};
    docs.forEach((sub) => {
      const pid = sub.problem ? sub.problem.toString() : null;
      (sub.problemTags || []).forEach((tag) => {
        if (!tagTotal[tag]) {
          tagTotal[tag] = new Set();
          tagSolved[tag] = new Set();
          tagSolvedByDiff[tag] = { easy: new Set(), medium: new Set(), hard: new Set() };
        }
        if (pid) tagTotal[tag].add(pid);
        if (pid && sub.status === 'accepted') {
          tagSolved[tag].add(pid);
          const diff = sub.problemDifficulty || 'easy';
          const bucket = tagSolvedByDiff[tag][diff] || tagSolvedByDiff[tag].easy;
          bucket.add(pid);
        }
      });
    });

    const topics = Object.keys(tagTotal).map((key) => ({
      topic: key,
      total: tagTotal[key].size,
      solved: tagSolved[key].size,
      acceptanceRate: tagTotal[key].size > 0 ? Math.round((tagSolved[key].size / tagTotal[key].size) * 100) : 0,
      difficulty: {
        easy: tagSolvedByDiff[key].easy.size,
        medium: tagSolvedByDiff[key].medium.size,
        hard: tagSolvedByDiff[key].hard.size,
      },
    })).sort((a, b) => b.solved - a.solved || b.total - a.total);

    res.status(200).json({ success: true, data: { category, userId, topics } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Platform-wide insights across ALL users (admin-only)
// @route   GET /api/analytics/overall/allusers
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const totalUsers = await Submission.aggregate([
      { $match: { type: 'submit' } },
      { $group: { _id: '$user' } },
      { $count: 'activeUsers' },
    ]);
    const activeUsers = totalUsers[0] ? totalUsers[0].activeUsers : 0;

    const totalStats = await Submission.aggregate([
      { $match: { type: 'submit' } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          acceptedSubmissions: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
        },
      },
    ]);
    const stats = totalStats[0] || { totalSubmissions: 0, acceptedSubmissions: 0 };

    const mostSolved = await Submission.aggregate([
      { $match: { type: 'submit', status: 'accepted' } },
      { $group: { _id: '$problem', solvedCount: { $sum: 1 } } },
      { $sort: { solvedCount: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, problemId: '$_id', solvedCount: 1 } },
    ]);

    const trendingTopics = await Submission.aggregate([
      { $match: { type: 'submit' } },
      { $unwind: { path: '$problemTags', preserveNullAndEmptyArrays: true } },
      { $match: { problemTags: { $ne: null } } },
      { $group: { _id: '$problemTags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, topic: '$_id', count: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: activeUsers,
        totalSubmissions: stats.totalSubmissions,
        acceptedSubmissions: stats.acceptedSubmissions,
        overallAcceptanceRate: stats.totalSubmissions > 0
          ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100)
          : 0,
        mostSolved,
        trendingTopics,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};