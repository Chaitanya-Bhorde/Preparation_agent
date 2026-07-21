const express = require('express');
const { runSubmission, submitSolution, getSubmissions, getSubmission } = require('../controllers/submissionController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.post('/run', protect, runSubmission);
router.post('/submit', protect, submitSolution);
router.get('/', protect, getSubmissions);
router.get('/:id', protect, getSubmission);
module.exports = router;