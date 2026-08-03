const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { startInterview, submitAnswer, getInterviewResult } = require('../controllers/mockInterviewController');

router.post('/start', protect, startInterview);
router.post('/answer', protect, submitAnswer);
router.get('/result/:id', protect, getInterviewResult);

module.exports = router;