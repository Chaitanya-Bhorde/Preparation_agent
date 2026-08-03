const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const practiceHistoryController = require('../controllers/practiceHistoryController');
const submissionController = require('../controllers/submissionController');

// POST /api/submissions - create practice history record (called by execution flow)
router.post('/', protect, async (req, res) => {
  try {
    const { submissionId } = req.body;
    if (!submissionId) {
      return res.status(400).json({ success: false, message: 'submissionId is required' });
    }
    const Submission = require('../models/Submission');
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    if (submission.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const record = await practiceHistoryController.createPracticeRecord(submission);
    if (!record) {
      return res.status(500).json({ success: false, message: 'Failed to create practice history record' });
    }
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/submissions/history
router.get('/history', protect, practiceHistoryController.getHistory);

// GET /api/submissions/summary/:userId
router.get('/summary/:userId', protect, practiceHistoryController.getSummary);

// GET /api/submissions/languages/:userId
router.get('/languages/:userId', protect, practiceHistoryController.getLanguages);

// GET /api/submissions/skills/:userId
router.get('/skills/:userId', protect, practiceHistoryController.getSkills);

// GET /api/submissions/streak/:userId
router.get('/streak/:userId', protect, practiceHistoryController.getStreak);

// GET /api/submissions/recent/:userId
router.get('/recent/:userId', protect, practiceHistoryController.getRecentAccepted);

module.exports = router;
