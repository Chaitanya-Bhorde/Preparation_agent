const express = require('express');
const { runCode, submitCode, computeVerdict } = require('../utils/judge0Coding');
const CodeSubmission = require('../models/CodeSubmission');
const CodingProblem = require('../models/CodingProblem');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/run', protect, async (req, res) => {
  try {
    const { problemId, language, code } = req.body;
    const problem = await CodingProblem.findById(problemId);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    const allTestCases = [...(problem.visibleTestCases || []), ...(problem.hiddenTestCases || [])];
    const results = await runCode(code, language, allTestCases);

    const response = results.map((r) => ({
      input: r.input,
      expectedOutput: r.expectedOutput,
      actualOutput: r.output,
      passed: r.passed,
      executionTime: r.executionTime,
      memoryUsed: r.memoryUsed,
      error: r.error,
      errorType: r.errorType,
    }));

    res.status(200).json({ success: true, data: { status: 'completed', testCaseResults: response } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/submit', protect, async (req, res) => {
  try {
    const { problemId, language, code } = req.body;
    const userId = req.user.id;
    const problem = await CodingProblem.findById(problemId);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    const allTestCases = [...(problem.visibleTestCases || []), ...(problem.hiddenTestCases || [])];
    const results = await submitCode(code, language, allTestCases);
    const { verdict, passedTestCases, totalTestCases, firstFailedInput, firstFailedExpected, firstFailedActual } = computeVerdict(results);

    const submission = await CodeSubmission.create({
      user: userId,
      problem: problem._id,
      language,
      code,
      verdict,
      passedTestCases,
      totalTestCases,
      runtimeMs: Math.max(...results.map((r) => r.executionTime || 0), 0),
      memoryKb: Math.max(...results.map((r) => r.memoryUsed || 0), 0),
      testCaseResults: results.map((r) => ({
        input: r.input,
        expectedOutput: r.expectedOutput,
        actualOutput: r.output,
        passed: r.passed,
        executionTime: r.executionTime,
        memoryUsed: r.memoryUsed,
        errorType: r.errorType,
        errorMessage: r.error || null,
      })),
      firstFailedInput,
      firstFailedExpected,
      firstFailedActual,
    });

    // Update problem stats
    await CodingProblem.findByIdAndUpdate(problem._id, {
      $inc: { totalSubmissions: 1, ...(verdict === 'Accepted' ? { acceptedSubmissions: 1 } : {}) },
    });

    // Update user stats and leaderboard
    const User = require('../models/User');
    const Leaderboard = require('../models/Leaderboard');
    const Submission = require('../models/Submission');

    const status = verdict === 'Accepted' ? 'accepted' : 'wrong_answer';
    
    // Create a Submission record for leaderboard tracking
    await Submission.create({
      user: userId,
      problem: problemId,
      code,
      language,
      status,
      type: 'submit',
      passedTestCases,
      totalTestCases,
      problemDifficulty: problem.difficulty,
      problemTags: problem.tags,
      testCaseResults: results.map((r) => ({
        testCase: null,
        passed: r.passed,
        input: r.input,
        expectedOutput: r.expectedOutput,
        actualOutput: r.output,
        executionTime: r.executionTime,
        memoryUsed: r.memoryUsed,
        errorType: r.errorType,
        errorMessage: r.error || null,
        isSample: false,
      })),
      score: Math.round((passedTestCases / totalTestCases) * 100),
    });

    // Update user stats
    if (status === 'accepted') {
      const existingAccepted = await Submission.findOne({
        user: userId,
        problem: problemId,
        status: 'accepted',
        type: 'submit',
      });
      if (!existingAccepted) {
        const solvedIncrement = problem.difficulty === 'easy'
          ? { 'stats.easySolved': 1, 'stats.totalSolved': 1 }
          : problem.difficulty === 'medium'
          ? { 'stats.mediumSolved': 1, 'stats.totalSolved': 1 }
          : { 'stats.hardSolved': 1, 'stats.totalSolved': 1 };
        await User.findByIdAndUpdate(userId, { $inc: solvedIncrement });
      }
    }
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.totalSubmissions': 1 } });

    // Update leaderboard
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const weeklySolved = await Submission.countDocuments({ user: userId, createdAt: { $gte: oneWeekAgo }, type: 'submit', status: 'accepted' });
    const monthlySolved = await Submission.countDocuments({ user: userId, createdAt: { $gte: oneMonthAgo }, type: 'submit', status: 'accepted' });
    const totalSubs = await Submission.countDocuments({ user: userId, type: 'submit' });
    const acceptedSubs = await Submission.countDocuments({ user: userId, type: 'submit', status: 'accepted' });
    const user = await User.findById(userId);
    const acceptanceRate = totalSubs > 0 ? Math.round((acceptedSubs / totalSubs) * 100) : 0;

    await Leaderboard.findOneAndUpdate(
      { user: userId },
      {
        totalSolved: user.stats.totalSolved,
        easySolved: user.stats.easySolved,
        mediumSolved: user.stats.mediumSolved,
        hardSolved: user.stats.hardSolved,
        totalSubmissions: user.stats.totalSubmissions,
        acceptanceRate,
        atsScore: user.profile.atsScore || 0,
        streak: user.stats.streak || 0,
        weeklySolved,
        monthlySolved,
        lastUpdated: Date.now(),
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      data: {
        ...submission.toObject(),
        status: verdict === 'Accepted' ? 'accepted' : 'wrong_answer',
        verdict,
        passedTestCases,
        totalTestCases,
        runtimeMs: submission.runtimeMs,
        memoryKb: submission.memoryKb,
        firstFailedInput,
        firstFailedExpected,
        firstFailedActual,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/submissions', protect, async (req, res) => {
  try {
    const { problemId, page = 1, limit = 20 } = req.query;
    const query = { user: req.user.id };
    if (problemId) query.problem = problemId;

    const total = await CodeSubmission.countDocuments(query);
    const submissions = await CodeSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: submissions.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: submissions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/submissions/:id', protect, async (req, res) => {
  try {
    const submission = await CodeSubmission.findOne({ _id: req.params.id, user: req.user.id });
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;