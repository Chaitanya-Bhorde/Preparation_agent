const express = require('express');
const multer = require('multer');
const { analyzeResumeFile, analyzeResumeText } = require('../controllers/atsController');
const { protect } = require('../middleware/auth');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
router.post('/analyze', protect, upload.single('resume'), analyzeResumeFile);
router.post('/analyze-text', protect, analyzeResumeText);
module.exports = router;