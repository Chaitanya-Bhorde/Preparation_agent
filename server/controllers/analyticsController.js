const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const User = require('../models/User');
const Problem = require('../models/Problem');
const SQLSubmission = require('../models/SQLSubmission');
const SQLProblem = require('../models/SQLProblem');
const InterviewSession = require('../models/InterviewSession');
const { generateRecommendations } = require('../services/ml/recommendationEngine');
const { buildHeatmap, computeMonthly, safeDiv } = require('../services/analyticsService');

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

// @desc    SQL-specific analytics overview
// @route   GET /api/analytics/sql/overview
exports.getSQLAnalytics = async (req, res) => {
  try {
    const { userId } = req.user;
    if (!assertOwnScope(userId, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const subs = await SQLSubmission.find({ user: userId, type: 'submit' })
      .select('status difficulty topics createdAt').lean();

    const attempted = new Set();
    const solved = new Set();
    const difficultyStats = { easy: { attempted: 0, solved: 0, submissions: 0, accepted: 0 }, medium: { attempted: 0, solved: 0, submissions: 0, accepted: 0 }, hard: { attempted: 0, solved: 0, submissions: 0, accepted: 0 } };
    const topicMap = {};

    subs.forEach((sub) => {
      if (sub.problem) attempted.add(sub.problem.toString());
      const diff = sub.difficulty || 'easy';
      difficultyStats[diff].submissions += 1;
      if (sub.status === 'accepted') {
        if (sub.problem) solved.add(sub.problem.toString());
        difficultyStats[diff].solved += 1;
        difficultyStats[diff].accepted += 1;
      }
      (sub.topics || ['general']).forEach((tag) => {
        if (!topicMap[tag]) topicMap[tag] = { attempts: 0, accepted: 0, submissions: 0 };
        topicMap[tag].attempts += 1;
        topicMap[tag].submissions += 1;
        if (sub.status === 'accepted') topicMap[tag].accepted += 1;
      });
    });

    const acceptanceRate = subs.length > 0 ? Math.round((subs.filter(s => s.status === 'accepted').length / subs.length) * 100) : 0;
    const finalTopicData = Object.entries(topicMap).map(([topic, data]) => ({
      topic, attempts: data.attempts, solved: data.accepted, acceptanceRate: data.submissions > 0 ? Math.round((data.accepted / data.submissions) * 100) : 0,
    })).sort((a, b) => b.attempts - a.attempts);

    res.status(200).json({
      success: true,
      data: {
        totalSolved: solved.size,
        totalAttempted: attempted.size,
        totalSubmissions: subs.length,
        acceptedSubmissions: subs.filter(s => s.status === 'accepted').length,
        acceptanceRate,
        difficulty: {
          easy: { solved: difficultyStats.easy.solved, submissions: difficultyStats.easy.submissions, acceptanceRate: difficultyStats.easy.submissions > 0 ? Math.round((difficultyStats.easy.accepted / difficultyStats.easy.submissions) * 100) : 0 },
          medium: { solved: difficultyStats.medium.solved, submissions: difficultyStats.medium.submissions, acceptanceRate: difficultyStats.medium.submissions > 0 ? Math.round((difficultyStats.medium.accepted / difficultyStats.medium.submissions) * 100) : 0 },
          hard: { solved: difficultyStats.hard.solved, submissions: difficultyStats.hard.submissions, acceptanceRate: difficultyStats.hard.submissions > 0 ? Math.round((difficultyStats.hard.accepted / difficultyStats.hard.submissions) * 100) : 0 },
        },
        topics: finalTopicData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }

// @desc    SQL activity heatmap
// @route   GET /api/analytics/sql/heatmap
exports.getSQLHeatmap = async (req, res) => {
  try {
    const { userId } = req.user;
    if (!assertOwnScope(userId, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const subs = await SQLSubmission.find({ user: userId, status: 'accepted' })
      .select('createdAt').lean();

    const events = subs.map((s) => ({ date: s.createdAt, intensity: 1, accepted: true }));
    const result = buildHeatmap(events, 365);
    res.status(200).json({ success: true, data: { ...result, userId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    SQL topic analysis
// @route   GET /api/analytics/sql/topics
exports.getSQLTopics = async (req, res) => {
  try {
    const { userId } = req.user;
    if (!assertOwnScope(userId, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const subs = await SQLSubmission.find({ user: userId, type: 'submit' })
      .select('status topics').lean();

    const topicMap = {};
    subs.forEach((sub) => {
      (sub.topics || ['general']).forEach((tag) => {
        if (!topicMap[tag]) topicMap[tag] = { attempts: 0, accepted: 0, submissions: 0 };
        topicMap[tag].attempts += 1;
        topicMap[tag].submissions += 1;
        if (sub.status === 'accepted') topicMap[tag].accepted += 1;
      });
    });

    const topics = Object.entries(topicMap).map(([topic, data]) => ({
      topic, total: data.attempts, solved: data.accepted,
      acceptanceRate: data.submissions > 0 ? Math.round((data.accepted / data.submissions) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    res.status(200).json({ success: true, data: { topics } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }

exports.getAptitudeHeatmap = async (req, res) => {
  try {
    const userId = req.user.id;
    const aptSubs = await AptitudeSubmission.find({ userId }).select('correct totalQuestions createdAt').lean();
    const events = [];
    aptSubs.forEach((sub) => {
      if (sub.totalQuestions > 0) {
        events.push({ date: sub.createdAt, intensity: 1, accepted: sub.correct > 0 });
      }
    });
    const result = await buildHeatmap(events, 365);
    res.status(200).json({ success: true, data: { category: 'aptitude', userId, ...result } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMockInterviewAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const interviews = await InterviewSession.find({ user: userId, status: 'completed' })
      .select('-_id status score selectedTopics questions createdAt')
      .lean();
    const total = interviews.length;
    const scores = interviews.map(i => i.score || 0);
    const maxScores = interviews.map(i => (i.selectedQuestions || i.questions || []).length * 2);
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const avgPct = scores.length && maxScores.length ? scores.reduce((a, i) => a + (i / maxScores[scores.indexOf(i)] * 100), 0) / scores.length : 0;
    const highestScore = scores.length ? Math.max(...scores) : 0;
    const lowestScore = scores.length ? Math.min(...scores) : 0;
    const questionsAnswered = interviews.reduce((acc, i) => acc + (i.questions || 0), 0);

    const topicPerf = {};
    interviews.forEach((i) => {
      const topics = i.selectedTopics || [];
      const maxS = Math.max(...maxScores) || 1;
      topics.forEach((t) => {
        if (!topicPerf[t]) topicPerf[t] = { interviews: 0, totalScore: 0, count: 0 };
        topicPerf[t].interviews += 1;
        topicPerf[t].totalScore += (i.score || 0) / maxS * 100;
        topicPerf[t].count += 1;
      });
    });

    const strong = interviews.filter(i => (i.score || 0) / (Math.max(...maxScores) || 1) * 100 >= 70).length;
    const medium = interviews.filter(i => { const pct = (i.score || 0) / (Math.max(...maxScores) || 1) * 100; return pct >= 40 && pct < 70; }).length;
    const weak = interviews.filter(i => (i.score || 0) / (Math.max(...maxScores) || 1) * 100 < 40).length;

    res.status(200).json({
      success: true,
      data: {
        totalInterviews: total,
        averageScore: Math.round(avgScore * 10) / 10,
        averagePercentage: Math.round(avgPct * 10) / 10,
        highestScore,
        lowestScore,
        questionsAnswered,
        performanceDistribution: { strong, medium, weak },
        topicPerformance: Object.entries(topicPerf).map(([t, d]) => ({ topic: t, avgPerformance: Math.round(d.totalScore / d.count), interviews: d.interviews })).sort((a, b) => b.avgPerformance - a.avgPerformance),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getAptitudeHeatmap = async (req, res) => {
  try {
    const userId = req.user.id;
    const aptSubs = await AptitudeSubmission.find({ userId }).select('correct totalQuestions createdAt').lean();
    const events = [];
    aptSubs.forEach((sub) => {
      if (sub.totalQuestions > 0) {
        events.push({ date: sub.createdAt, intensity: 1, accepted: sub.correct > 0 });
      }
    });
    const result = await buildHeatmap(events, 365);
    res.status(200).json({ success: true, data: { category: 'aptitude', userId, ...result } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMockInterviewHeatmap = async (req, res) => {
  try {
    const userId = req.user.id;
    const interviews = await InterviewSession.find({ user: userId, status: 'completed' }).select('createdAt').lean();
    const events = interviews.map((i) => ({ date: i.createdAt, intensity: 1, accepted: true }));
    const result = await buildHeatmap(events, 365);
    res.status(200).json({ success: true, data: { category: 'mock-interview', userId, ...result } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMonthlyAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { domain } = req.query;
    const domains = domain ? [domain] : ['dsa', 'sql', 'aptitude', 'mock-interview'];
    const monthly = {};
    for (const d of domains) {
      monthly[d] = await computeMonthly(userId, d);
    }
    res.status(200).json({ success: true, data: { monthly, userId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWeakAreas = async (req, res) => {
  try {
    const userId = req.user.id;
    const features = await getDSAFeatures(userId);
    const sqlFeatures = await getSQLFeatures(userId);
    const aptFeatures = await getAptitudeFeatures(userId);
    const interviewFeatures = await getMockInterviewFeatures(userId);
    const all = [features, sqlFeatures, aptFeatures, interviewFeatures].filter(Boolean);
    const weakAreas = [];
    all.forEach((f, idx) => {
      if (!f || !f.topics) return;
      const domain = ['DSA', 'SQL', 'Aptitude', 'Mock Interview'][idx];
      f.topics.forEach((t) => {
        if (t.status === 'WEAK' || t.status === 'UNDER_PRACTICED') {
          weakAreas.push({ domain, ...t });
        }
      });
    });
    weakAreas.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    res.status(200).json({ success: true, data: { weakAreas } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const features = await getDSAFeatures(userId);
    const sqlFeatures = await getSQLFeatures(userId);
    const aptFeatures = await getAptitudeFeatures(userId);
    const interviewFeatures = await getMockInterviewFeatures(userId);
    const all = [features, sqlFeatures, aptFeatures, interviewFeatures].filter(Boolean);
    const recs = [];
    all.forEach((f, idx) => {
      if (!f || !f.recommendations) return;
      const domain = ['DSA', 'SQL', 'Aptitude', 'Mock Interview'][idx];
      (f.recommendations || []).forEach((r) => {
        recs.push({ domain, ...r });
      });
    });
    recs.sort((a, b) => {
      const order = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (order[b.priority] || 0) - (order[a.priority] || 0);
    });
    res.status(200).json({ success: true, data: { recommendations: recs } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getMLFeatures = async (req, res) => {
  try {
    const userId = req.user.id;
    const feat = {
      dsa: await getDSAFeatures(userId),
      sql: await getSQLFeatures(userId),
      aptitude: await getAptitudeFeatures(userId),
      mockInterviews: await getMockInterviewFeatures(userId),
    };
    res.status(200).json({ success: true, data: { features: feat, userId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
