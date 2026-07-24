const express = require('express');
const { analyzeResumeFile, analyzeResumeText, uploadProfilePicture } = require('../controllers/atsController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { evaluateResume } = require('../utils/strictAtsEvaluator');
const router = express.Router();
router.post('/analyze', protect, upload.single('resume'), analyzeResumeFile);
router.post('/upload-profile-picture', protect, upload.single('profile'), uploadProfilePicture);

// NEW: Strict ATS evaluation from raw text (no file upload needed)
router.post('/strict-analyze', protect, (req, res) => {
  try {
    const { resumeText, role } = req.body;
    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resume_text with at least 50 characters'
      });
    }
    const result = evaluateResume(resumeText, role || null);
    console.log('[STRICT_ATS] Analysis complete, total_score:', result.total_score);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[STRICT_ATS] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;