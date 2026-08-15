const express = require('express');
const {
  getCodingProblems,
  getCodingProblem,
  getCodingTags,
  getCodingTopics,
  getCodingCompanies,
  getCodingProblemStats,
  likeCodingProblem,
} = require('../controllers/codingProblemController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/tags', protect, getCodingTags);
router.get('/topics', protect, getCodingTopics);
router.get('/companies', protect, getCodingCompanies);
router.get('/stats', protect, getCodingProblemStats);
router.get('/', protect, getCodingProblems);
router.get('/:slug', protect, getCodingProblem);
router.post('/:id/like', protect, likeCodingProblem);

module.exports = router;