const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/interviewController');

// Selectable interview fields/config (auth-gated like the rest of the app)
router.get('/fields', protect, ctrl.getFields);

// Session lifecycle
router.post('/sessions', protect, ctrl.createSession);
router.get('/sessions/active', protect, ctrl.getActiveSession);
router.get('/sessions/:id', protect, ctrl.getSession);
router.post('/sessions/:id/start', protect, ctrl.startSession);
router.post('/sessions/:id/answer', protect, ctrl.submitAnswer);
router.post('/sessions/:id/complete', protect, ctrl.completeSession);
router.post('/sessions/:id/abandon', protect, ctrl.abandonSession);
router.get('/sessions/:id/report', protect, ctrl.getReport);

module.exports = router;
