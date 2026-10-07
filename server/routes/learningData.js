const express = require('express');
const { protect } = require('../middleware/auth');
const { resetLearningData } = require('../controllers/learningDataController');

const router = express.Router();

// Full learning-data reset for the authenticated user only. protect() must
// run first so the handler can scope every deleteMany to req.user._id.
router.delete('/', protect, resetLearningData);

module.exports = router;