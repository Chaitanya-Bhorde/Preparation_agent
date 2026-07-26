const express = require('express');
const {
  getLeaderboard,
  updateLeaderboard,
  getMyLeaderboardStats,
} = require('../controllers/leaderboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getLeaderboard);
router.get('/me', protect, getMyLeaderboardStats);
router.post('/update', protect, updateLeaderboard);

module.exports = router;