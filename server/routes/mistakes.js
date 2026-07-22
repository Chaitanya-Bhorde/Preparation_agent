const express = require('express');
const { createMistake, getMyMistakes, updateMistakeStatus } = require('../controllers/mistakeController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.post('/', protect, createMistake);
router.get('/', protect, getMyMistakes);
router.patch('/:id', protect, updateMistakeStatus);
module.exports = router;