const express = require('express');
const { exportProgress } = require('../controllers/progressExportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/export', protect, exportProgress);

module.exports = router;