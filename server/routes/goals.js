const express = require('express');
const { updateGoals, getGoalProgress } = require('../controllers/goalController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.patch('/', protect, updateGoals);
router.get('/progress', protect, getGoalProgress);
module.exports = router;