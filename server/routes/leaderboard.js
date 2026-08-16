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

module.exports = router;