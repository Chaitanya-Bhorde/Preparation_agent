const express = require('express');
const { getRecommendations, addToRevision, removeFromRevision } = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.get('/', protect, getRecommendations);
router.post('/revision', protect, addToRevision);
router.delete('/revision/:problemId', protect, removeFromRevision);
module.exports = router;