const express = require('express');
const { createSubmission, getSubmissions, getSubmission } = require('../controllers/submissionController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.post('/', protect, createSubmission);
router.get('/', protect, getSubmissions);
router.get('/:id', protect, getSubmission);
module.exports = router;