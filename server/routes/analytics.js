const express = require('express');
const { getAnalytics, getAdminAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();
router.get('/', protect, getAnalytics);
router.get('/admin', protect, authorize('admin'), getAdminAnalytics);
module.exports = router;