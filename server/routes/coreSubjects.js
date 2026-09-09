const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/CoreSubjectsController');

router.get('/', protect, ctrl.getSubjects);
router.get('/:subjectSlug', protect, ctrl.getSubject);
router.get('/:subjectSlug/topics', protect, ctrl.getTopics);
router.get('/:subjectSlug/notes', protect, ctrl.getNotes);
router.get('/:subjectSlug/mcqs', protect, ctrl.getMCQs);
router.get('/:subjectSlug/interview-questions', protect, ctrl.getInterviewQuestions);
router.post('/:subjectSlug/mcqs/:questionId/attempt', protect, ctrl.submitMCQAttempt);
router.post('/:subjectSlug/interview-questions/:questionId/attempt', protect, ctrl.submitInterviewAttempt);
router.get('/:subjectSlug/progress', protect, ctrl.getProgress);

module.exports = router;
