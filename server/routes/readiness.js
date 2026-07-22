const express = require('express');
const { getInterviewReadiness } = require('../controllers/readinessController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.get('/', protect, getInterviewReadiness);
module.exports = router;