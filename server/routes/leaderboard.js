const express = require('express');
const router = express.Router();
const leaderboardService = require('../services/leaderboardService');
const { protect } = require('../middleware/auth');

/**
 * GET /api/leaderboard/global
 * Fetch global leaderboard
 * Query params: ?limit=50&page=1
 */
router.get('/global', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;

    const result = await leaderboardService.getLeaderboard('Global', { limit, page });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leaderboard/college/:collegeId
 * Fetch college-specific leaderboard
 * Query params: ?limit=50&page=1
 */
router.get('/college/:collegeId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const { collegeId } = req.params;

    const result = await leaderboardService.getLeaderboard('College', {
      collegeId,
      limit,
      page
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leaderboard/friends
 * Fetch authenticated user's friend leaderboard
 * Query params: ?limit=50&page=1
 */
router.get('/friends', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;

    const result = await leaderboardService.getLeaderboard('Friend', {
      limit,
      page,
      userId: req.user._id
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leaderboard/rank/:userId
 * Fetch a specific user's global rank
 */
router.get('/rank/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const rank = await leaderboardService.getUserGlobalRank(userId);

    if (rank === null) {
      return res.status(404).json({ error: 'User not found in leaderboard' });
    }

    res.json({ userId, rank });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/leaderboard/compute (admin only)
 * Trigger manual leaderboard computation
 * Body: { type: 'global' | 'college' | 'friend', userId?: string (for friend leaderboards) }
 */
router.post('/compute', protect, async (req, res) => {
  try {
    const { type, userId } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'type is required (global, college, or friend)' });
    }

    let result;

    switch (type.toLowerCase()) {
      case 'global':
        result = await leaderboardService.computeGlobalLeaderboard();
        break;
      case 'college':
        result = await leaderboardService.computeCollegeLeaderboards();
        break;
      case 'friend':
        if (!userId) {
          return res.status(400).json({ error: 'userId required for friend leaderboard' });
        }
        result = await leaderboardService.computeFriendLeaderboard(userId);
        break;
      default:
        return res.status(400).json({ error: 'Invalid type' });
    }

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/**
 * GET /api/leaderboard/aptitude
 * Rank users by aptitude effort (questionsCorrect, bestScore, mock tests)
 */
router.get('/aptitude', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const AptitudeSubmission = require('../models/AptitudeSubmission');
    const rows = await AptitudeSubmission.aggregate([
      { $group: {
          _id: '$userId',
          questionsAttempted: { $sum: '$totalCount' },
          questionsCorrect: { $sum: '$correctCount' },
          mockTestsCompleted: { $sum: { $cond: [{ $eq: ['$type', 'mock-test'] }, 1, 0] } },
          bestScore: { $max: '$score' },
          avgScore: { $avg: '$score' },
        } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
      { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
      { $project: {
          userId: '$_id',
          username: { $ifNull: ['$u.name', 'Unknown'] },
          email: '$u.email',
          questionsAttempted: 1,
          questionsCorrect: 1,
          mockTestsCompleted: 1,
          bestScore: 1,
          avgScore: 1,
          accuracy: { $round: [{ $multiply: [{ $divide: ['$questionsCorrect', { $max: ['$questionsAttempted', 1] }] }, 100] }, 0] },
        } },
      { $sort: { questionsCorrect: -1, accuracy: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);
    const totalAgg = await AptitudeSubmission.aggregate([{ $group: { _id: '$userId' } }, { $count: 'n' }]);
    const total = totalAgg[0] ? totalAgg[0].n : 0;
    res.json({ leaderboard: rows, pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leaderboard/sql
 * Rank users by SQL accepted distinct problems + acceptance rate.
 */
router.get('/sql', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const Submission = require('../models/Submission');
    const rows = await Submission.aggregate([
      { $match: { type: 'submit', category: 'sql' } },
      { $group: {
          _id: '$user',
          acceptedSubmissions: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          totalSubmissions: { $sum: 1 },
          problemsSolved: { $addToSet: { $cond: [{ $eq: ['$status', 'accepted'] }, '$problem', '$REMOVE'] } },
        } },
      { $addFields: { solvedCount: { $size: '$problemsSolved' } } },
      { $project: { userId: '$_id', acceptedSubmissions: 1, totalSubmissions: 1, solvedCount: 1, acceptanceRate: { $round: [{ $multiply: [{ $divide: ['$acceptedSubmissions', { $max: ['$totalSubmissions', 1] }] }, 100] }, 0] } } },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'u' } },
      { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
      { $project: { userId: 1, username: { $ifNull: ['$u.name', ''] }, avatar: '$u.avatar', acceptedSubmissions: 1, totalSubmissions: 1, solvedCount: 1, acceptanceRate: 1 } },
      { $sort: { solvedCount: -1, acceptanceRate: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);
    const totalAgg = await Submission.aggregate([{ $match: { user: { $exists: true }, category: 'sql' } }, { $group: { _id: '$user' } }, { $count: 'n' }]);
    const total = totalAgg[0] ? totalAgg[0].n : 0;
    res.json({ leaderboard: rows, pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leaderboard/dsa
 * DSA rankings from UserStats (kept consistent with the global leaderboard).
 */
router.get('/dsa', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const UserStats = require('../models/UserStats');
    const rows = await UserStats.aggregate([
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'u' } },
      { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
      { $project: { userId: 1, username: { $ifNull: ['$u.name', ''] }, totalProblems: 1, acceptanceRate: 1, easyCount: 1, mediumCount: 1, hardCount: 1, streak: '$currentStreak' } },
      { $sort: { totalProblems: -1, acceptanceRate: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);
    let total = await UserStats.countDocuments({});
    if (rows.length === 0 && total === 0) {
      // Fallback: reuse the persisted Global snapshot so the tab is never empty.
      const leaderboardService = require('../services/leaderboardService');
      const snap = await leaderboardService.getLeaderboard('Global', { limit, page });
      const mapped = (snap.leaderboard || []).map(r => ({
        userId: r.userId,
        username: r.username || '',
        totalProblems: r.totalProblems || 0,
        acceptanceRate: r.acceptanceRate || 0,
        easyCount: r.easyCount || 0,
        mediumCount: r.mediumCount || 0,
        hardCount: r.hardCount || 0,
      }));
      return res.json({ leaderboard: mapped, pagination: snap.pagination });
    }
    res.json({ leaderboard: rows, pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;