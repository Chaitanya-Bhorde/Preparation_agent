const express = require('express');
const {
  getProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
  getTags,
} = require('../controllers/problemController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();
router.get('/tags', protect, getTags);
router.get('/', protect, getProblems);
router.get('/:slug', protect, getProblem);
router.post('/', protect, authorize('admin'), createProblem);
router.put('/:id', protect, authorize('admin'), updateProblem);
router.delete('/:id', protect, authorize('admin'), deleteProblem);
module.exports = router;