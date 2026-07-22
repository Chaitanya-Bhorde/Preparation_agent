const express = require('express');
const { getTopicProgress, getTopicDetails, getConceptNotes } = require('../controllers/topicController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.get('/progress', protect, getTopicProgress);
router.get('/:topic', protect, getTopicDetails);
router.get('/notes/all', protect, getConceptNotes);
module.exports = router;