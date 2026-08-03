const mongoose = require('mongoose');
const PracticeHistory = require('../models/PracticeHistory');
const Problem = require('../models/Problem');
const { getTagTier } = require('../config/tagTiers');

function mapStatusToVerdict(status) {
  const map = {
    accepted: 'Accepted',
    wrong_answer: 'Wrong Answer',
    runtime_error: 'Runtime Error',
    time_limit_exceeded: 'Time Limit Exceeded',
    memory_limit_exceeded: 'Memory Limit Exceeded',
    compilation_error: 'Compilation Error',
    pending: 'Wrong Answer',
    running: 'Wrong Answer',
  };
  return map[status] || 'Wrong Answer';
}

function mapLanguage(lang) {
  const map = {
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C++',
    go: 'JavaScript',
    rust: 'JavaScript',
    typescript: 'JavaScript',
    sql: 'JavaScript',
  };
  return map[lang] || 'JavaScript';
}

exports.createPracticeRecord = async (submission) => {
  try {
    const problem = await Problem.findById(submission.problem).select('title slug difficulty tags');
    if (!problem) return null;
    const verdict = mapStatusToVerdict(submission.status);
    const language = mapLanguage(submission.language);
    const existingCount = await PracticeHistory.countDocuments({ userId: submission.user, problemId: submission.problem });
    const existingAccepted = await PracticeHistory.findOne({ userId: submission.user, problemId: submission.problem, verdict: 'Accepted' });
    let attemptCount = existingCount + 1;
    if (existingAccepted) attemptCount = existingCount;
    const record = await PracticeHistory.create({
      userId: submission.user,
      problemId: submission.problem,
      problemTitle: problem.title,
      problemSlug: problem.slug,
      problemUrl: `/coding-problems/${problem.slug}`,
      difficulty: problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1),
      verdict,
      language,
      attemptCount,
      submittedAt: submission.createdAt || new Date(),
      code: submission.code || null,
      tags: problem.tags || [],
    });
    return record;
  } catch (error) {
    console.error('Failed to create practice history record:', error.message);
    return null;
  }
};

exports.getHistory = async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id;
    const { difficulty, verdict, page = 1, limit = 20, search = '' } = req.query;
    const query = { userId: new mongoose.Types.ObjectId(userId) };
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;
    if (verdict && verdict !== 'all') query.verdict = verdict;
    if (search) query.problemTitle = { $regex: search, $options: 'i' };
    const total = await PracticeHistory.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const data = await PracticeHistory.find(query).sort({ submittedAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)).lean();
    res.status(200).json({ success: true, count: data.length, total, totalPages, currentPage: parseInt(page), data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const totalSubmissions = await PracticeHistory.countDocuments({ userId });
    const acceptedSubmissions = await PracticeHistory.countDocuments({ userId, verdict: 'Accepted' });
    const distinctAccepted = await PracticeHistory.distinct('problemId', { userId, verdict: 'Accepted' });
    const totalSolved = distinctAccepted.length;
    const easySolved = await PracticeHistory.countDocuments({ userId, verdict: 'Accepted', difficulty: 'Easy' });
    const mediumSolved = await PracticeHistory.countDocuments({ userId, verdict: 'Accepted', difficulty: 'Medium' });
    const hardSolved = await PracticeHistory.countDocuments({ userId, verdict: 'Accepted', difficulty: 'Hard' });
    const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;
    res.status(200).json({ success: true, data: { totalSolved, easySolved, mediumSolved, hardSolved, totalSubmissions, acceptanceRate } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLanguages = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const pipeline = [
      { $match: { userId, verdict: 'Accepted' } },
      { $group: { _id: '$language', solvedSet: { $addToSet: '$problemId' } } },
      { $project: { language: '$_id', solvedCount: { $size: '$solvedSet' }, _id: 0 } },
      { $sort: { solvedCount: -1 } },
    ];
    const data = await PracticeHistory.aggregate(pipeline);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSkills = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const pipeline = [
      { $match: { userId, verdict: 'Accepted' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', solvedSet: { $addToSet: '$problemId' } } },
      { $project: { tag: '$_id', solvedCount: { $size: '$solvedSet' }, _id: 0 } },
      { $sort: { solvedCount: -1 } },
    ];
    const rawData = await PracticeHistory.aggregate(pipeline);
    const data = rawData.map((item) => ({ ...item, tier: getTagTier(item.tag) }));
    const bucketed = {
      Fundamental: data.filter((d) => d.tier === 'Fundamental'),
      Intermediate: data.filter((d) => d.tier === 'Intermediate'),
      Advanced: data.filter((d) => d.tier === 'Advanced'),
    };
    res.status(200).json({ success: true, data: bucketed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStreak = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const limit = parseInt(req.query.limit) || 10;
    const acceptedSubmissions = await PracticeHistory.find({ userId, verdict: 'Accepted' }).sort({ submittedAt: -1 }).select('submittedAt').lean();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const heatmap = {};
    const allSubs = await PracticeHistory.find({ userId, submittedAt: { $gte: oneYearAgo } }).select('submittedAt verdict').lean();
    for (let i = 0; i < 365; i++) {
      const d = new Date(oneYearAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      heatmap[dateStr] = { count: 0, accepted: 0 };
    }
    allSubs.forEach((sub) => {
      const dateStr = sub.submittedAt.toISOString().split('T')[0];
      if (heatmap[dateStr]) {
        heatmap[dateStr].count += 1;
        if (sub.verdict === 'Accepted') heatmap[dateStr].accepted += 1;
      }
    });
    const acceptedDates = [...new Set(acceptedSubmissions.map((s) => new Date(s.submittedAt).toISOString().split('T')[0]))].sort().reverse();
    let currentStreak = 0;
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (acceptedDates.length > 0) {
      const checkDate = new Date(today);
      if (acceptedDates[0] !== todayStr) {
        if (acceptedDates[0] === yesterdayStr) {
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          currentStreak = 0;
        }
      }
      if (currentStreak === 0 || acceptedDates[0] === todayStr || acceptedDates[0] === yesterdayStr) {
        let streakDate = acceptedDates[0] === todayStr ? new Date(today) : new Date(yesterday);
        for (const dateStr of acceptedDates) {
          const expected = streakDate.toISOString().split('T')[0];
          if (dateStr === expected) {
            currentStreak++;
            streakDate.setDate(streakDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }
    let maxStreak = 0;
    let tempStreak = 0;
    let prevDate = null;
    for (const dateStr of acceptedDates) {
      if (prevDate) {
        const prev = new Date(prevDate);
        const curr = new Date(dateStr);
        const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) { tempStreak++; } else { tempStreak = 1; }
      } else {
        tempStreak = 1;
      }
      maxStreak = Math.max(maxStreak, tempStreak);
      prevDate = dateStr;
    }
    const recentAccepted = await PracticeHistory.find({ userId, verdict: 'Accepted' }).sort({ submittedAt: -1 }).limit(limit).select('problemTitle problemSlug problemUrl difficulty submittedAt language verdict').lean();
    res.status(200).json({ success: true, data: { currentStreak, maxStreak, heatmap, recentAccepted } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecentAccepted = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const limit = parseInt(req.query.limit) || 10;
    const data = await PracticeHistory.find({ userId, verdict: 'Accepted' }).sort({ submittedAt: -1 }).limit(limit).select('problemTitle problemSlug problemUrl difficulty submittedAt language verdict').lean();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
