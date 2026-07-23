const express = require('express');
const { protect } = require('../middleware/auth');
const RoleRequirements = require('../models/RoleRequirements');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const roles = await RoleRequirements.find({ isActive: true }).sort({ role: 1 });
    const simplified = roles.map(r => ({
      role: r.role,
      description: r.description,
      requiredSkills: r.requiredSkills,
      keywords: r.keywords,
      educationRequirements: r.educationRequirements,
    }));
    res.status(200).json({ success: true, data: simplified });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;