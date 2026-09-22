'use strict';

/**
 * Analytics controller — every value is derived from the authenticated user's
 * real database activity. No fake/hardcoded/random values.
 * All queries are scoped to req.user (never an untrusted userId param).
 */

const Submission = require('../models/Submission');
const SQLSubmission = require('../models/SQLSubmission');
const AptitudeSubmission = require('../models/AptitudeSubmission');
const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');
const svc = require('../services/analyticsService');
const { buildHeatmap, computeMonthlyFromEvents, dateStr, percent, countActiveDays, computeStreaks } = svc;

const uid = (req) => (req.user ? String(req.user.id || req.user._id) : null);

/** Enforce user isolation: a :userId param (if supplied) must be the caller. */
function ownScope(req) {
  const caller = uid(req);
  if (!caller) return false;
  const param = req.params && req.params.userId ? String(req.params.userId) : null;
  return !param || param === caller;
}

const badScope = (res) => res.status(403).json({ success: false, message: 'Not authorized to view these analytics' });

const unknownCategory = (res, category) =>
  res.status(400).json({ success: false, message: `Unknown category '${category}'` });

/* ------------------------------------------------------------- loaders */

async function loadDsaSubmissions(userId) {
  return Submission.find({ user: userId, type: 'submit' })
    .select('status problem problemDifficulty problemTags category createdAt')
    .lean();
}

async function loadSqlSubmissions(userId) {
  return SQLSubmission.find({ user: userId, type: 'submit' })
    .select('status problem difficulty topics createdAt')
    .lean();
}

async function loadAptitudeSubmissions(userId) {
  return AptitudeSubmission.find({ userId })
    .select('category correctCount totalCount totalQuestions score createdAt')
    .lean();
}

async function loadCompletedInterviews(userId) {
  return InterviewSession.find({ user: userId, status: 'COMPLETED' })
    .select('score finalReport topics totalQuestions mode difficulty completedAt createdAt')
    .lean();
}

/* --------------------------------------------------------- aggregations */

function dsaStats(subs) {
  const attempted = new Set();
  const solved = new Set();
  const difficulty = { easy: 0, medium: 0, hard: 0 };
  let accepted = 0;
  subs.forEach((s) => {
    if (s.problem) attempted.add(String(s.problem));
    if (s.status === 'accepted') {
      accepted += 1;
      if (s.problem) {
        solved.add(String(s.problem));
        const d = (s.problemDifficulty || 'easy').toLowerCase();
        if (difficulty[d] !== undefined) difficulty[d] += 1;
      }
    }
  });
  return {
    totalSubmissions: subs.length,
    acceptedSubmissions: accepted,
    totalAttempted: attempted.size,
    totalSolved: solved.size,
    acceptanceRate: percent(accepted, subs.length),
    difficulty,
  };
}

function sqlStats(subs) {
  const attempted = new Set();
  const solved = new Set();
  const difficulty = { easy: 0, medium: 0, hard: 0 };
  let accepted = 0;
  subs.forEach((s) => {
    if (s.problem) attempted.add(String(s.problem));
    if (s.status === 'accepted') {
      accepted += 1;
      if (s.problem) {
        solved.add(String(s.problem));
        const d = (s.difficulty || 'easy').toLowerCase();
        if (difficulty[d] !== undefined) difficulty[d] += 1;
      }
    }
  });
  return {
    totalSubmissions: subs.length,
    acceptedSubmissions: accepted,
    totalAttempted: attempted.size,
    totalSolved: solved.size,
    acceptanceRate: percent(accepted, subs.length),
    difficulty,
  };
}

function aptitudeStats(subs) {
  let attempted = 0;
  let correct = 0;
  let questions = 0;
  const category = {};
  subs.forEach((s) => {
    attempted += 1;
    const c = Number(s.correctCount) || 0;
    const t = Number(s.totalCount) || Number(s.totalQuestions) || 0;
    correct += c;
    questions += t;
    const cat = s.category || 'general';
    if (!category[cat]) category[cat] = { attempted: 0, correct: 0, questions: 0 };
    category[cat].attempted += 1;
    category[cat].correct += c;
    category[cat].questions += t;
  });
  return {
    totalSubmissions: attempted,
    totalAttempted: attempted,
    correct,
    questions,
    accuracy: percent(correct, questions),
    category,
  };
}


function interviewStats(sessions) {
  let selected = 0;
  let mainAnswered = 0;
  let followUpsAnswered = 0;
  const scores = [];
  const percentages = [];
  const distribution = { Strong: 0, Medium: 0, Weak: 0 };
  const typeCounts = {};
  const topicMap = {};
  sessions.forEach((s) => {
    const rep = s.finalReport || {};
    const st = rep.stats || {};
    selected += Number(st.selectedQuestionCount) || Number(s.totalQuestions) || 0;
    mainAnswered += Number(st.mainQuestionsAnswered) || 0;
    followUpsAnswered += Number(st.followUpsAnswered) || 0;
    const score = Number(rep.score);
    if (Number.isFinite(score)) scores.push(score);
    const pct = Number(rep.percentage);
    if (Number.isFinite(pct)) {
      percentages.push(pct);
      if (pct >= 70) distribution.Strong += 1;
      else if (pct >= 40) distribution.Medium += 1;
      else distribution.Weak += 1;
    }
    const type = s.mode || 'text';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
    (rep.topicPerformance || []).forEach((t) => {
      if (!t.topic) return;
      if (!topicMap[t.topic]) topicMap[t.topic] = { scoreSum: 0, asked: 0 };
      topicMap[t.topic].scoreSum += Number(t.averageScore) || 0;
      topicMap[t.topic].asked += Number(t.questionsAsked) || 0;
    });
  });
  return {
    totalInterviews: sessions.length,
    totalCompleted: sessions.length,
    totalSelectedQuestions: selected,
    totalMainQuestionsAnswered: mainAnswered,
    totalFollowUpsAnswered: followUpsAnswered,
    averageScore: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
    highestScore: scores.length ? Math.max(...scores) : 0,
    lowestScore: scores.length ? Math.min(...scores) : 0,
    averagePercentage: percentages.length ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0,
    distribution,
    typeDistribution: typeCounts,
    topicPerformance: Object.entries(topicMap)
      .map(([topic, t]) => ({
        topic,
        averageScore: Math.round((t.scoreSum / t.asked) * 10) / 10,
        questionsAsked: t.asked,
      }))
      .sort((a, b) => b.questionsAsked - a.questionsAsked),
  };
}

/** Unified per-category summary used by the Analytics page trio. */
async function categorySummary(req, res, category) {
  try {
    if (!ownScope(req)) return badScope(res);
    const userId = uid(req);

    const base = {
      totalSubmissions: 0, acceptedSubmissions: 0, totalAttempted: 0,
      totalSolved: 0, acceptanceRate: 0, difficulty: { easy: 0, medium: 0, hard: 0 },
    };
    let subs = [];
    if (category === 'dsa' || category === 'overall') {
      subs = await loadDsaSubmissions(userId);
      Object.assign(base, dsaStats(subs));
    } else if (category === 'sql') {
      subs = await loadSqlSubmissions(userId);
      Object.assign(base, sqlStats(subs));
    } else if (category === 'aptitude') {
      subs = await loadAptitudeSubmissions(userId);
      const a = aptitudeStats(subs);
      Object.assign(base, {
        totalSubmissions: a.totalSubmissions,
        acceptedSubmissions: a.correct,
        totalAttempted: a.totalAttempted,
        totalSolved: a.correct,
        acceptanceRate: a.accuracy,
      });
    } else if (category === 'interview') {
      subs = await loadCompletedInterviews(userId);
      const s = interviewStats(subs);
      Object.assign(base, {
        totalSubmissions: s.totalInterviews,
        acceptedSubmissions: s.totalCompleted,
        totalAttempted: s.totalInterviews,
        totalSolved: s.totalCompleted,
        acceptanceRate: s.averagePercentage,
      });
    } else {
      return unknownCategory(res, category);
    }

    const eventDates = subs.map((s) => s.createdAt).filter(Boolean).map((d) => dateStr(d)).sort().reverse();
    const { currentStreak, maxStreak } = computeStreaks(eventDates);

    return res.status(200).json({
      success: true,
      data: {
        category,
        ...base,
        activeDays: countActiveDays(eventDates),
        currentStreak,
        maxStreak,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}


/** Unified per-category heatmap — only real activity dates, never fabricated. */
async function categoryHeatmap(req, res, category) {
  try {
    if (!ownScope(req)) return badScope(res);
    const userId = uid(req);
    let events = [];
    if (category === 'dsa' || category === 'overall') {
      const subs = await loadDsaSubmissions(userId);
      events = subs.map((s) => ({ date: s.createdAt, accepted: s.status === 'accepted' }));
    } else if (category === 'sql') {
      const subs = await loadSqlSubmissions(userId);
      events = subs.map((s) => ({ date: s.createdAt, accepted: s.status === 'accepted' }));
    } else if (category === 'aptitude') {
      const subs = await loadAptitudeSubmissions(userId);
      events = subs.map((s) => ({ date: s.createdAt, accepted: (Number(s.correctCount) || 0) > 0 }));
    } else if (category === 'interview') {
      const subs = await loadCompletedInterviews(userId);
      events = subs.map((s) => ({ date: s.createdAt, accepted: true }));
    } else {
      return unknownCategory(res, category);
    }
    const result = buildHeatmap(events, 365);
    return res.status(200).json({ success: true, data: { category, userId, ...result } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/** Unified per-category topic breakdown. */
async function categoryTopics(req, res, category) {
  try {
    if (!ownScope(req)) return badScope(res);
    const userId = uid(req);
    let topics = [];
    if (category === 'dsa' || category === 'overall') {
      const subs = await loadDsaSubmissions(userId);
      topics = topicRows(subs, (s) => (s.problemTags && s.problemTags.length ? s.problemTags : ['general']), (s) => s.problemDifficulty);
    } else if (category === 'sql') {
      const subs = await loadSqlSubmissions(userId);
      topics = topicRows(subs, (s) => (s.topics && s.topics.length ? s.topics : ['general']), (s) => s.difficulty);
    } else if (category === 'aptitude') {
      const subs = await loadAptitudeSubmissions(userId);
      topics = aptitudeTopicRows(subs);
    } else if (category === 'interview') {
      const sessions = await loadCompletedInterviews(userId);
      topics = interviewTopicRows(sessions);
    } else {
      return unknownCategory(res, category);
    }
    return res.status(200).json({ success: true, data: { topics: topics.sort((a, b) => b.total - a.total) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

function topicRows(subs, tagsOf, difficultyOf) {
  const map = {};
  subs.forEach((s) => {
    tagsOf(s).forEach((tag) => {
      if (!map[tag]) map[tag] = { attempted: 0, accepted: 0, solved: new Set(), difficulty: { easy: 0, medium: 0, hard: 0 } };
      map[tag].attempted += 1;
      if (s.status === 'accepted') {
        map[tag].accepted += 1;
        if (s.problem) map[tag].solved.add(String(s.problem));
        const d = (difficultyOf(s) || 'easy').toLowerCase();
        if (map[tag].difficulty[d] !== undefined) map[tag].difficulty[d] += 1;
      }
    });
  });
  return Object.entries(map).map(([topic, t]) => ({
    topic,
    total: t.solved.size,
    solved: t.solved.size,
    difficulty: t.difficulty,
    acceptanceRate: percent(t.accepted, t.attempted),
  }));
}

function aptitudeTopicRows(subs) {
  const map = {};
  subs.forEach((s) => {
    const cat = s.category || 'general';
    if (!map[cat]) map[cat] = { attempted: 0, correct: 0, questions: 0, difficulty: { easy: 0, medium: 0, hard: 0 } };
    map[cat].attempted += 1;
    map[cat].correct += Number(s.correctCount) || 0;
    map[cat].questions += Number(s.totalCount) || Number(s.totalQuestions) || 0;
  });
  return Object.entries(map).map(([topic, t]) => ({
    topic,
    total: t.attempted,
    solved: t.correct,
    difficulty: t.difficulty,
    acceptanceRate: percent(t.correct, t.questions),
  }));
}

function interviewTopicRows(sessions) {
  const map = {};
  sessions.forEach((s) => {
    ((s.finalReport && s.finalReport.topicPerformance) || []).forEach((t) => {
      if (!t.topic) return;
      if (!map[t.topic]) map[t.topic] = { attempted: 0, scoreSum: 0, difficulty: { easy: 0, medium: 0, hard: 0 } };
      map[t.topic].attempted += Number(t.questionsAsked) || 0;
      map[t.topic].scoreSum += Number(t.averageScore) || 0;
    });
  });
  return Object.entries(map).map(([topic, t]) => ({
    topic,
    total: t.attempted,
    solved: t.attempted,
    difficulty: t.difficulty,
    acceptanceRate: t.attempted ? Math.round((t.scoreSum / t.attempted) * 10) : 0,
  }));
}

/* --------------------------------------------- client-facing trio routes */

// @route GET /api/analytics/:category/summary/:userId
exports.getCategorySummary = (req, res) => categorySummary(req, res, req.params.category);

// @route GET /api/analytics/:category/heatmap/:userId
exports.getCategoryHeatmap = (req, res) => categoryHeatmap(req, res, req.params.category);

// @route GET /api/analytics/:category/topics/:userId
exports.getCategoryTopics = (req, res) => categoryTopics(req, res, req.params.category);

function topicRows(subs, tagsOf, difficultyOf) {
  const map = {};
  subs.forEach((s) => {
    const tags = tagsOf(s);
    if (!tags || !tags.length) tags = ['general'];
    const diff = difficultyOf(s);
    tags.forEach((tag) => {
      if (!map[tag]) map[tag] = { total: 0, accepted: 0, difficulty: { easy: 0, medium: 0, hard: 0 } };
      map[tag].total += 1;
      if (s.status === 'accepted') {
        map[tag].accepted += 1;
        if (map[tag].difficulty[diff] !== undefined) map[tag].difficulty[diff] += 1;
      }
    });
  });
  return Object.entries(map).map(([topic, v]) => ({
    topic,
    total: v.total,
    accepted: v.accepted,
    successRate: percent(v.accepted, v.total),
    difficulty: v.difficulty,
  }));
}

function aptitudeTopicRows(subs) {
  const map = {};
  subs.forEach((s) => {
    const cat = s.category || 'general';
    if (!map[cat]) map[cat] = { total: 0, correct: 0, questions: 0 };
    map[cat].total += 1;
    map[cat].correct += Number(s.correctCount) || 0;
    map[cat].questions += Number(s.totalCount) || Number(s.totalQuestions) || 0;
  });
  return Object.entries(map).map(([topic, v]) => ({
    topic,
    total: v.total,
    correct: v.correct,
    questions: v.questions,
    successRate: v.questions > 0 ? Math.round((v.correct / v.questions) * 100) : 0,
  }));
}

function interviewTopicRows(sessions) {
  const map = {};
  sessions.forEach((s) => {
    const rep = s.finalReport || {};
    const tp = rep.topicPerformance || [];
    tp.forEach((t) => {
      if (!map[t.topic]) map[t.topic] = { total: 0, scoreSum: 0, count: 0 };
      map[t.topic].total += 1;
      if (typeof t.averageScore === 'number') { map[t.topic].scoreSum += t.averageScore; map[t.topic].count += 1; }
    });
  });
  return Object.entries(map).map(([topic, v]) => ({
    topic,
    total: v.total,
    averageScore: v.count > 0 ? round1(v.scoreSum / v.count) : 0,
  }));
}


async function categoryTopics(req, res, category) {
  try {
    if (!ownScope(req)) return badScope(res);
    if (category !== 'dsa' && category !== 'sql' && category !== 'aptitude' && category !== 'interview') {
      return unknownCategory(res, category);
    }
    const userId = uid(req);
    const subs = await categoryLoaders[category](userId);
    let topics;
    if (category === 'dsa') {
      topics = topicRows(subs, (s) => s.problemTags, (s) => s.problemDifficulty || 'easy').sort((a, b) => b.total - a.total);
    } else if (category === 'sql') {
      topics = topicRows(subs, (s) => s.topics, (s) => s.difficulty || 'easy').sort((a, b) => b.total - a.total);
    } else if (category === 'aptitude') {
      topics = aptitudeTopicRows(subs).sort((a, b) => b.total - a.total);
    } else {
      topics = interviewTopicRows(subs).sort((a, b) => b.total - a.total);
    }
    return res.status(200).json({ success: true, data: { category, userId, topics } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ------------------------------------------------------- legacy overall */

// @desc    Legacy overall analytics (preserved response shape)
// @route   GET /api/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const user = await User.findById(uid(req));
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const stats = user.stats || {};
    const profile = user.profile || {};

    const subs = await Submission.find({ user: uid(req), type: 'submit' })
      .select('status problem problemDifficulty problemTags category createdAt')
      .lean();

    const rangeDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };
    const dailyActivity = {};
    subs.forEach((s) => {
      if (!s.problem) return;
      if (s.status === 'accepted') {
        const d = (s.problemDifficulty || 'easy').toLowerCase();
        if (difficultyDistribution[d] !== undefined) difficultyDistribution[d] += 1;
      }
      const date = dateStr(s.createdAt);
      if (!dailyActivity[date]) dailyActivity[date] = { solved: 0, attempted: 0 };
      dailyActivity[date].attempted += 1;
      if (s.status === 'accepted') dailyActivity[date].solved += 1;
    });

    function getCategoryStats(category) {
      const catSubs = subs.filter((s) => (s.category || 'dsa') === category);
      const solved = new Set();
      const accepted = new Set();
      const tagSets = {};
      const tagAccepted = {};
      catSubs.forEach((sub) => {
        if (!sub.problem) return;
        const pid = String(sub.problem);
        solved.add(pid);
        if (sub.status === 'accepted') accepted.add(pid);
        (sub.problemTags || []).forEach((tag) => {
          if (!tagSets[tag]) { tagSets[tag] = new Set(); tagAccepted[tag] = new Set(); }
          tagSets[tag].add(pid);
          if (sub.status === 'accepted') tagAccepted[tag].add(pid);
        });
      });
      const rangeSubs = catSubs.filter((s) => s.createdAt >= rangeDate);
      const topics = Object.keys(tagSets).map((tag) => ({
        topic: tag,
        total: tagSets[tag].size,
        accepted: tagAccepted[tag].size,
        successRate: tagSets[tag].size > 0 ? Math.round((tagAccepted[tag].size / tagSets[tag].size) * 100) : 0,
      })).sort((a, b) => b.total - a.total);
      return {
        totalSolved: solved.size,
        totalAccepted: accepted.size,
        rangeSolved: rangeSubs.filter((s) => s.status === 'accepted').length,
        rangeAccepted: rangeSubs.filter((s) => s.status === 'accepted').length,
        acceptanceRate: solved.size > 0 ? Math.round((accepted.size / solved.size) * 100) : 0,
        topics,
      };
    }

    const rank = await User.countDocuments({ 'stats.totalSolved': { $gt: stats.totalSolved || 0 } });

    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const heatmapData = {};
    const heatmapByCategory = { dsa: {}, sql: {}, aptitude: {} };
    subs.filter((s) => s.createdAt >= oneYearAgo && s.status === 'accepted').forEach((sub) => {
      const date = dateStr(sub.createdAt);
      heatmapData[date] = (heatmapData[date] || 0) + 1;
      const cat = sub.category || 'dsa';
      if (heatmapByCategory[cat]) heatmapByCategory[cat][date] = (heatmapByCategory[cat][date] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      data: {
        overallStats: {
          totalSolved: stats.totalSolved || 0,
          totalSubmissions: stats.totalSubmissions || 0,
          acceptanceRate: stats.totalSubmissions > 0
            ? Math.round(((stats.totalSolved || 0) / stats.totalSubmissions) * 100) : 0,
          currentStreak: stats.streak || 0,
          atsScore: profile.atsScore || 0,
        },
        difficultyDistribution,
        dailyActivity: Object.entries(dailyActivity).map(([date, d]) => ({ date, ...d })).reverse(),
        topicPerformance: [],
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
    return res.status(500).json({ success: false, message: error.message });
  }
};


// @route GET /api/analytics/admin
exports.getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSubmissions = await Submission.countDocuments({ type: 'submit' });
    const acceptedSubmissions = await Submission.countDocuments({ type: 'submit', status: 'accepted' });
    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalSubmissions,
        acceptedSubmissions,
        overallAcceptanceRate: totalSubmissions > 0
          ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Platform-wide insights (admin-only)
// @route GET /api/analytics/overall/allusers
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const activeAgg = await Submission.aggregate([
      { $match: { type: 'submit' } },
      { $group: { _id: '$user' } },
      { $count: 'activeUsers' },
    ]);
    const statsAgg = await Submission.aggregate([
      { $match: { type: 'submit' } },
      { $group: { _id: null, totalSubmissions: { $sum: 1 }, acceptedSubmissions: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } } } },
    ]);
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
    const stats = statsAgg[0] || { totalSubmissions: 0, acceptedSubmissions: 0 };
    return res.status(200).json({
      success: true,
      data: {
        totalUsers: activeAgg[0] ? activeAgg[0].activeUsers : 0,
        totalSubmissions: stats.totalSubmissions,
        acceptedSubmissions: stats.acceptedSubmissions,
        overallAcceptanceRate: stats.totalSubmissions > 0
          ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100) : 0,
        mostSolved,
        trendingTopics,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ------------------------------------------------- SQL domain endpoints */

// @desc    SQL-specific analytics overview
// @route   GET /api/analytics/sql/overview
exports.getSQLAnalytics = async (req, res) => {
  try {
    if (!ownScope(req)) return badScope(res);
    const userId = uid(req);
    const subs = await loadSqlSubmissions(userId);
    const stats = sqlStats(subs);
    const recent = await SQLSubmission.find({ user: userId, type: 'submit' })
      .sort({ createdAt: -1 }).limit(10)
      .select('status difficulty topics createdAt')
      .lean();
    const events = subs.filter((s) => s.status === 'accepted')
      .map((s) => ({ date: s.createdAt, intensity: 1, accepted: true }));
    const heat = buildHeatmap(events, 365);
    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        topics: topicRows(subs, (s) => (s.topics && s.topics.length ? s.topics : ['general']), (s) => s.difficulty).sort((a, b) => b.total - a.total),
        recentSubmissions: recent,
        activeDays: heat.activeDays,
        currentStreak: heat.currentStreak,
        maxStreak: heat.maxStreak,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/analytics/sql/heatmap
exports.getSQLHeatmap = async (req, res) => {
  try {
    if (!ownScope(req)) return badScope(res);
    const subs = await SQLSubmission.find({ user: uid(req), type: 'submit' })
      .select('createdAt').lean();
    const events = subs.map((s) => ({ date: s.createdAt, intensity: 1, accepted: true }));
    return res.status(200).json({ success: true, data: { category: 'sql', userId: uid(req), ...buildHeatmap(events, 365) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/analytics/sql/topics
exports.getSQLTopics = async (req, res) => {
  try {
    if (!ownScope(req)) return badScope(res);
    const subs = await loadSqlSubmissions(uid(req));
    return res.status(200).json({
      success: true,
      data: { topics: topicRows(subs, (s) => (s.topics && s.topics.length ? s.topics : ['general']), (s) => s.difficulty).sort((a, b) => b.total - a.total) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


/* --------------------------------------------- Aptitude domain endpoints */

// @desc    Aptitude analytics overview
// @route   GET /api/analytics/aptitude/overview
exports.getAptitudeAnalytics = async (req, res) => {
  try {
    if (!ownScope(req)) return badScope(res);
    const userId = uid(req);
    const subs = await loadAptitudeSubmissions(userId);
    const a = aptitudeStats(subs);
    const heat = buildHeatmap(subs.map((s) => ({ date: s.createdAt, intensity: 1, accepted: (Number(s.correctCount) || 0) > 0 })), 365);
    return res.status(200).json({
      success: true,
      data: {
        totalSubmissions: a.totalSubmissions,
        totalAttempted: a.totalAttempted,
        correct: a.correct,
        questions: a.totalQuestions,
        accuracy: a.accuracy,
        category: a.category,
        activeDays: heat.activeDays,
        currentStreak: heat.currentStreak,
        maxStreak: heat.maxStreak,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/analytics/aptitude/heatmap
exports.getAptitudeHeatmap = async (req, res) => {
  try {
    if (!ownScope(req)) return badScope(res);
    const subs = await AptitudeSubmission.find({ userId: uid(req) })
      .select('correctCount createdAt').lean();
    const events = subs.map((s) => ({ date: s.createdAt, intensity: 1, accepted: (Number(s.correctCount) || 0) > 0 }));
    return res.status(200).json({ success: true, data: { category: 'aptitude', userId: uid(req), ...buildHeatmap(events, 365) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/analytics/aptitude/topics
exports.getAptitudeTopics = async (req, res) => {
  try {
    if (!ownScope(req)) return badScope(res);
    const subs = await loadAptitudeSubmissions(uid(req));
    return res.status(200).json({
      success: true,
      data: { topics: aptitudeTopicRows(subs).sort((a, b) => b.total - a.total) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


/* ------------------------------------------- Interview domain endpoints */

// @desc    Mock interview analytics overview
// @route   GET /api/analytics/interview/overview
exports.getMockInterviewAnalytics = async (req, res) => {
  try {
    if (!ownScope(req)) return badScope(res);
    const userId = uid(req);
    const sessions = await loadCompletedInterviews(userId);
    const s = interviewStats(sessions);
    const heat = buildHeatmap(sessions.map((i) => ({ date: i.createdAt, intensity: 1, accepted: true })), 365);
    return res.status(200).json({
      success: true,
      data: {
        ...s,
        history: sessions
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
          .map((i) => ({
            score: i.score !== undefined ? i.score : (i.finalReport ? i.finalReport.score : null),
            percentage: i.finalReport ? i.finalReport.percentage : null,
            mode: i.mode,
            topics: i.topics,
            createdAt: i.createdAt,
          })),
        activeDays: heat.activeDays,
        currentStreak: heat.currentStreak,
        maxStreak: heat.maxStreak,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/analytics/interview/heatmap
exports.getInterviewHeatmap = async (req, res) => {
  try {
    if (!ownScope(req)) return badScope(res);
    const sessions = await InterviewSession.find({ user: uid(req), status: 'COMPLETED' })
      .select('createdAt').lean();
    const events = sessions.map((i) => ({ date: i.createdAt, intensity: 1, accepted: true }));
    return res.status(200).json({ success: true, data: { category: 'interview', userId: uid(req), ...buildHeatmap(events, 365) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


/* ------------------------------------ monthly / weak areas / recommend */

// @desc    Monthly activity trends (?domain=dsa|sql|aptitude|interview)
// @route   GET /api/analytics/:domain/monthly | /api/analytics/monthly
exports.getMonthlyTrends = async (req, res) => {
  try {
    if (!ownScope(req)) return badScope(res);
    const userId = uid(req);
    const domain = req.params.category || req.query.domain || 'overall';

    let events = [];
    if (domain === 'dsa') {
      events = (await loadDsaSubmissions(userId)).map((s) => ({ date: s.createdAt }));
    } else if (domain === 'sql') {
      events = (await loadSqlSubmissions(userId)).map((s) => ({ date: s.createdAt }));
    } else if (domain === 'aptitude') {
      events = (await loadAptitudeSubmissions(userId)).map((s) => ({ date: s.createdAt }));
    } else if (domain === 'interview') {
      events = (await loadCompletedInterviews(userId)).map((s) => ({ date: s.createdAt }));
    } else {
      const [dsa, sql, apt, iv] = await Promise.all([
        loadDsaSubmissions(userId),
        loadSqlSubmissions(userId),
        loadAptitudeSubmissions(userId),
        loadCompletedInterviews(userId),
      ]);
      events = [
        ...dsa.map((s) => ({ date: s.createdAt })),
        ...sql.map((s) => ({ date: s.createdAt })),
        ...apt.map((s) => ({ date: s.createdAt })),
        ...iv.map((s) => ({ date: s.createdAt })),
      ];
    }
    return res.status(200).json({ success: true, data: { domain, monthly: computeMonthlyFromEvents(events) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Weak / under-practiced areas (real feature engineering, no fake data)
// @route   GET /api/analytics/weak-areas
exports.getWeakAreas = async (req, res) => {
  try {
    if (!ownScope(req)) return badScope(res);
    const { getDSAFeatures, getSQLFeatures, getAptitudeFeatures, getMockInterviewFeatures } = require('../services/ml/featureEngineering');
    const userId = uid(req);
    const [dsa, sql, aptitude, interview] = await Promise.all([
      getDSAFeatures(userId), getSQLFeatures(userId), getAptitudeFeatures(userId), getMockInterviewFeatures(userId),
    ]);
    const weak = (arr) => arr.filter((f) => f && (f.status === 'WEAK' || f.status === 'WEAK_UNDERPRACTICED'));
    const under = (arr) => arr.filter((f) => f && (f.status === 'UNDER_PRACTICED' || f.status === 'NEVER_ATTEMPTED'));
    return res.status(200).json({
      success: true,
      data: {
        weak: { dsa: weak(dsa), sql: weak(sql), aptitude: weak(aptitude), interview: weak(interview) },
        underPracticed: { dsa: under(dsa), sql: under(sql), aptitude: under(aptitude), interview: under(interview) },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Recommendations from real ML features (existing engine)
// @route   GET /api/analytics/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    if (!ownScope(req)) return badScope(res);
    const { generateRecommendations } = require('../services/ml/recommendationEngine');
    const recommendations = await generateRecommendations(uid(req));
    return res.status(200).json({ success: true, data: { recommendations } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
