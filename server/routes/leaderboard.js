const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const leaderboardService = require('../services/leaderboardService');
const overallPerformanceService = require('../services/overallPerformanceService');
const { protect } = require('../middleware/auth');

/**
 * GET /api/leaderboard/overall
 * ---------------------------------------------------------------------------
 * The real application-wide performance leaderboard:
 *
 *   Rank | Name | DSA | Aptitude | SQL | Mock Interview | Overall
 *
 * Every number is aggregated live from the caller's own persisted activity
 * (codesubmissions / sqlsubmissions / aptitudesubmissions / interviewsessions)
 * by services/overallPerformanceService. There is no snapshot collection and
 * no stored rank, so the board can never drift from what people actually did.
 *
 * Requires authentication only so the response can carry `currentUser` (the
 * caller's own row and rank) for the highlight in the UI. No email address,
 * profile picture or any other private field is published — `name` only.
 *
 * Query params: ?limit=50&page=1
 */
router.get('/overall', protect, async (req, res) => {
  try {
    const result = await overallPerformanceService.getOverallLeaderboard({
      limit: req.query.limit,
      page: req.query.page,
      currentUserId: req.user.id || req.user._id,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Unable to load leaderboard', message: err.message });
  }
});

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
    // A non-ObjectId in the path is a malformed request, not a server fault.
    // Without this guard the value reaches Mongoose, throws a CastError, and the
    // catch below answers 500 while echoing the driver message (model name and
    // path included). Guarding here keeps the status class honest and the detail
    // server-side - the same pattern routes/sql.js already uses for problemId.
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
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
      { $unwind: '$u' },
      { $match: { 'u.isTestAccount': { $ne: true } } },
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
    const totalAgg = await AptitudeSubmission.aggregate([
      { $group: { _id: '$userId' } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
      { $unwind: '$u' },
      { $match: { 'u.isTestAccount': { $ne: true } } },
      { $count: 'n' },
    ]);
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
      // Attach the real account and drop automated test accounts so they can
      // never appear on a public ranking (see utils/testAccount.js). `$unwind`
      // without preserveNull also drops rows whose user no longer exists.
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'u' } },
      { $unwind: '$u' },
      // Qualified path: `$unwind` keeps the looked-up document under `u`, and
      // `{ $ne: true }` would otherwise match the MISSING top-level field and
      // let every test account back onto the board.
      { $match: { 'u.isTestAccount': { $ne: true } } },
      { $project: { userId: 1, username: { $ifNull: ['$u.name', ''] }, avatar: '$u.avatar', acceptedSubmissions: 1, totalSubmissions: 1, solvedCount: 1, acceptanceRate: 1 } },
      { $sort: { solvedCount: -1, acceptanceRate: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);
    const totalAgg = await Submission.aggregate([
      { $match: { user: { $exists: true }, category: 'sql' } },
      { $group: { _id: '$user' } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
      { $unwind: '$u' },
      { $match: { 'u.isTestAccount': { $ne: true } } },
      { $count: 'n' },
    ]);
    const total = totalAgg[0] ? totalAgg[0].n : 0;
    res.json({ leaderboard: rows, pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leaderboard/dsa
 * DSA rankings computed directly from real Accepted submissions.
 *
 * It previously read the `userstats` collection, which the DSA submit path never
 * wrote (only the legacy SQL path does, and that collection held 0 documents
 * here), so the tab silently fell back to a stale snapshot and real users such
 * as "manan" never appeared. See services/dsaLeaderboardService.
 */
router.get('/dsa', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const { getDsaLeaderboard } = require('../services/dsaLeaderboardService');
    const { leaderboard, pagination } = await getDsaLeaderboard({ limit, page });
    // The client renders the DSA tab with the global-leaderboard column names,
    // so `totalProblems` carries the UNIQUE solved-problem count.
    res.json({
      leaderboard: leaderboard.map((r) => ({
        userId: r.userId,
        username: r.username || '',
        totalProblems: r.solvedCount,
        totalSubmissions: r.acceptedOnSolved,
        easyCount: r.easyCount,
        mediumCount: r.mediumCount,
        hardCount: r.hardCount,
      })),
      pagination,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
