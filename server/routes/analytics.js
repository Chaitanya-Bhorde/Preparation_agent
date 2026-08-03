const express = require('express');
const {
  getAnalytics,
  getAdminAnalytics,
  getCategorySummary,
  getCategoryHeatmap,
  getCategoryTopics,
  getPlatformAnalytics,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Platform-wide insight (admin-only, aggregates across ALL users) — must be registered
// before the /:category routes so 'overall' is not treated as a category shortcut.
router.get('/overall/allusers', protect, authorize('admin'), getPlatformAnalytics);
router.get('/:category/summary/:userId', protect, getCategorySummary);
router.get('/:category/heatmap/:userId', protect, getCategoryHeatmap);
router.get('/:category/topics/:userId', protect, getCategoryTopics);

router.get('/', protect, getAnalytics);
router.get('/admin', protect, authorize('admin'), getAdminAnalytics);
module.exports = router;