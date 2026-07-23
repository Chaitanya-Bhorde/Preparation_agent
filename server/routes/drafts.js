const express = require('express');
const { saveDraft, getDraft, getAllDrafts, deleteDraft } = require('../controllers/draftController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.post('/', protect, saveDraft);
router.get('/', protect, getDraft);
router.get('/all', protect, getAllDrafts);
router.delete('/', protect, deleteDraft);
module.exports = router;