const express = require('express');
const {
  getSQLProblems,
  getSQLProblem,
  runSQL,
  submitSQL,
  getSQLSubmissions,
  getSQLSubmission,
  getSQLTopics,
  getSQLTags,
  getSQLCompanies,
} = require('../controllers/sqlController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/topics', protect, getSQLTopics);
router.get('/tags', protect, getSQLTags);
router.get('/companies', protect, getSQLCompanies);
router.get('/problems', protect, getSQLProblems);
router.get('/problems/:slug', protect, getSQLProblem);
router.post('/run', protect, runSQL);
router.post('/submit', protect, submitSQL);
router.get('/submissions', protect, getSQLSubmissions);
router.get('/submissions/:id', protect, getSQLSubmission);

module.exports = router;