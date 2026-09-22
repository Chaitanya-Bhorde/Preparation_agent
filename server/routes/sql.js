const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SQLProblem = require('../models/SQLProblem');
const SQLSubmission = require('../models/SQLSubmission');
const { protect } = require('../middleware/auth');
const { runSQL, submitSQL } = require('../controllers/submissionController');

// Compute solved/attempted status for the authenticated user across problem ids.
// A problem is 'solved' if ANY accepted submit exists, else 'attempted' if any
// submit exists. RUN records never affect official status.
async function getUserStatusSets(userId, problemIds) {
  const subs = await SQLSubmission.find({
    user: userId,
    problem: { $in: problemIds },
    type: 'submit',
  }).select('problem status').lean();

  const solved = new Set();
  const attempted = new Set();
  subs.forEach((s) => {
    const pid = String(s.problem);
    attempted.add(pid);
    if (s.status === 'accepted') solved.add(pid);
  });
  return { solved, attempted };
}

// GET /api/sql/problems - List all SQL problems (with per-user solved/attempted status)
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
      .select('-hiddenTestCases -referenceSolutionSQL -schemaSetupSQL')
      .lean();

    if (problems.length > 0) {
      const { solved, attempted } = await getUserStatusSets(
        req.user.id,
        problems.map((p) => p._id)
      );
      problems.forEach((p) => {
        const pid = String(p._id);
        p.userStatus = solved.has(pid) ? 'solved' : attempted.has(pid) ? 'attempted' : null;
      });
    }

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

// GET /api/sql/problems/:slug - Single problem detail for the authenticated user.
// hiddenTestCases are never exposed. referenceSolutionSQL is only returned after
// the user has an accepted submission for this problem.
router.get('/problems/:slug', protect, async (req, res) => {
  try {
    const problem = await SQLProblem.findOne({ slug: req.params.slug, isActive: true })
      .select('-hiddenTestCases')
      .lean();

    if (!problem) {
      return res.status(404).json({ success: false, message: 'SQL problem not found' });
    }

    const { solved, attempted } = await getUserStatusSets(req.user.id, [problem._id]);
    const pid = String(problem._id);
    problem.userStatus = solved.has(pid) ? 'solved' : attempted.has(pid) ? 'attempted' : null;

    if (!solved.has(pid)) {
      delete problem.referenceSolutionSQL;
    }

    res.status(200).json({ success: true, data: problem });
  } catch (error) {
    console.error('Error fetching SQL problem:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/sql/submissions - Authenticated user's official SQL submissions.
// Scoped strictly to req.user; optionally filtered by problemId.
router.get('/submissions', protect, async (req, res) => {
  try {
    const { problemId, limit = 20 } = req.query;
    const query = { user: req.user.id, type: 'submit' };
    if (problemId && mongoose.Types.ObjectId.isValid(problemId)) {
      query.problem = problemId;
    }
    const submissions = await SQLSubmission.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit) || 20, 100))
      .select('problem status passedTestCases totalTestCases runtimeMs errorMessage createdAt')
      .lean();

    res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    console.error('Error fetching SQL submissions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;