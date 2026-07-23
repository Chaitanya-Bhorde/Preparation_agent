const express = require('express');
const { protect } = require('../middleware/auth');
const { computeJDMatch } = require('../utils/jdMatcher');

const router = express.Router();

router.post('/match', protect, async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ success: false, message: 'Please provide both resumeText and jobDescription' });
    }
    const result = computeJDMatch(resumeText, jobDescription);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;