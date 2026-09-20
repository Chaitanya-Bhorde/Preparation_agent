const express = require('express');
const {
  getAnalytics,
  getAdminAnalytics,
  getCategorySummary,
  getCategoryHeatmap,
  getCategoryTopics,
  getPlatformAnalytics,
  getSQLAnalytics,
  getMockInterviewAnalytics,
  getWeakAreas,
  getRecommendations,
  getMonthlyTrends,
  getSQLHeatmap,
  getSQLTopics,
  getAptitudeAnalytics,
  getAptitudeHeatmap,
  getAptitudeTopics,
  getInterviewHeatmap,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/overall/allusers', protect, authorize('admin'), getPlatformAnalytics);
router.get('/:category/summary/:userId', protect, getCategorySummary);
router.get('/:category/heatmap/:userId', protect, getCategoryHeatmap);
router.get('/:category/topics/:userId', protect, getCategoryTopics);

router.get('/sql/overview', protect, getSQLAnalytics);
router.get('/sql/heatmap', protect, getSQLHeatmap);
router.get('/sql/topics', protect, getSQLTopics);
router.get('/sql/monthly', protect, getMonthlyTrends);

router.get('/aptitude/overview', protect, getAptitudeAnalytics);
router.get('/aptitude/heatmap', protect, getAptitudeHeatmap);
router.get('/aptitude/topics', protect, getAptitudeTopics);
router.get('/aptitude/monthly', protect, getMonthlyTrends);

router.get('/interview/overview', protect, getMockInterviewAnalytics);
router.get('/interview/heatmap', protect, getInterviewHeatmap);
router.get('/interview/monthly', protect, getMonthlyTrends);

router.get('/weak-areas', protect, getWeakAreas);
router.get('/recommendations', protect, getRecommendations);
router.get('/monthly', protect, getMonthlyTrends);

router.get('/', protect, getAnalytics);
router.get('/admin', protect, authorize('admin'), getAdminAnalytics);
module.exports = router;