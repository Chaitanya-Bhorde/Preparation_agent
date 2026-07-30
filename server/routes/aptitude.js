const express = require('express');
const {
  getQuestions,
  submitAnswer,
  getCategories,
  getCompanies,
} = require('../controllers/aptitudeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/questions', protect, getQuestions);
router.get('/categories', protect, getCategories);
router.get('/companies', protect, getCompanies);
router.post('/submit', protect, submitAnswer);

module.exports = router;