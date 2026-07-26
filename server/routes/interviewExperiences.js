const express = require('express');
const {
  createExperience,
  getExperiences,
  getExperience,
  updateExperience,
  deleteExperience,
  voteExperience,
  getMyExperiences,
} = require('../controllers/interviewExperienceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getExperiences)
  .post(protect, createExperience);

router.get('/my', protect, getMyExperiences);
router.post('/:id/vote', protect, voteExperience);

router.route('/:id')
  .get(protect, getExperience)
  .put(protect, updateExperience)
  .delete(protect, deleteExperience);

module.exports = router;