const express = require('express');
const {
  getCodingProblems,
  getCodingProblem,
  getCodingTags,
  getCodingTopics,
  getCodingCompanies,
} = require('../controllers/codingProblemController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/tags', protect, getCodingTags);
router.get('/topics', protect, getCodingTopics);
router.get('/companies', protect, getCodingCompanies);
router.get('/', protect, getCodingProblems);
router.get('/:slug', protect, getCodingProblem);

module.exports = router;