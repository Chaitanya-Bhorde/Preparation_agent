const express = require('express');
const { analyzeResumeFile, analyzeResumeText, uploadProfilePicture } = require('../controllers/atsController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const router = express.Router();
router.post('/analyze', protect, upload.single('resume'), analyzeResumeFile);
router.post('/upload-profile-picture', protect, upload.single('profile'), uploadProfilePicture);
module.exports = router;
