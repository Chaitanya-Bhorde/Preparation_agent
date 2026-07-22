const express = require('express');
const { getCompanies, getCompanyProblems, getCompanyInfo } = require('../controllers/companyController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.get('/', protect, getCompanies);
router.get('/:company/problems', protect, getCompanyProblems);
router.get('/:company', protect, getCompanyInfo);
module.exports = router;