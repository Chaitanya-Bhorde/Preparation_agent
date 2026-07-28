const express = require('express');
const {
  getQuestions,
  submitAnswer,
  getCategories,
} = require('../controllers/aptitudeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/questions', protect, getQuestions);
router.get('/categories', protect, getCategories);
router.post('/submit', protect, submitAnswer);

module.exports = router;