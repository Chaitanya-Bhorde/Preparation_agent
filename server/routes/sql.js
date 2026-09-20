const express = require('express');
const router = express.Router();
const SQLProblem = require('../models/SQLProblem');
const SQLSubmission = require('../models/SQLSubmission');
const { protect } = require('../middleware/auth');
const { runSQL, submitSQL } = require('../controllers/submissionController');

// GET /api/sql/problems - List all SQL problems
router.get('/problems', protect, async (req, res) => {
  try {
    const { difficulty, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    
    if (difficulty) query.difficulty = difficulty.toLowerCase();
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    const total = await SQLProblem.countDocuments(query);
    const problems = await SQLProblem.find(query)
      .sort({ problemNumber: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-hiddenTestCases -referenceSolutionSQL -schemaSetupSQL');
    
    res.status(200).json({
      success: true,
      count: problems.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: problems
    });
  } catch (error) {
    console.error('Error fetching SQL problems:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});