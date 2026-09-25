const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const SQLProblem = require('../models/SQLProblem');
const SQLSubmission = require('../models/SQLSubmission');
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const { runCode, submitCode } = require('../utils/judge0');
const { evaluateSqlCase, summarizeSqlResults, shapeSqlResults } = require('../utils/sqlCaseRunner');
const { updateStreak } = require('../utils/streak');

// Helper to update user stats after submission (feeds global leaderboard aggregation)
const updateLeaderboardAfterSubmission = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const totalSubs = await Submission.countDocuments({ user: userId, type: 'submit' });
    const acceptedSubs = await Submission.countDocuments({ user: userId, type: 'submit', status: 'accepted' });
    const acceptanceRate = totalSubs > 0 ? Math.round((acceptedSubs / totalSubs) * 100) : 0;

    const totalSolved = user.stats.totalSolved || 0;
    const tierThresholds = [
      { min: 100, tier: 'Diamond' },
      { min: 60, tier: 'Platinum' },
      { min: 30, tier: 'Gold' },
      { min: 10, tier: 'Silver' },
    ];
    let rankingTier = 'Bronze';
    for (const t of tierThresholds) {
      if (totalSolved >= t.min) { rankingTier = t.tier; break; }
    }

    await UserStats.findOneAndUpdate(
      { userId },
      {
        userId,
        totalProblems: totalSolved,
        easyCount: user.stats.easySolved || 0,
        mediumCount: user.stats.mediumSolved || 0,
        hardCount: user.stats.hardSolved || 0,
        totalSubmissions: totalSubs,
        successfulSubmissions: acceptedSubs,
        currentStreak: user.stats.streak || 0,
        acceptanceRate,
        rankingTier,
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Leaderboard update failed:', error.message);
  }
};

exports.runSubmission = async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    if (!problemId || !code || !language) {
      return res.status(400).json({ success: false, message: 'Please provide problemId, code, and language' });
    }
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    const visibleCases = problem.testCases.filter(tc => !tc.isHidden);
    const casesToRun = visibleCases.length > 0 ? visibleCases : problem.testCases.slice(0, 2);

    const submission = await Submission.create({
      user: req.user.id,
      problem: problemId,
      code,
      language,
      status: 'pending',
      totalTestCases: casesToRun.length,
      type: 'run',
      problemDifficulty: problem.difficulty,
      problemTags: problem.tags,
    });
    const signature = problem.functionSignature ? problem.functionSignature[language] : null;
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Function signature not found for selected language' });
    }
    const results = await runCode(code, language, problem.testCases, signature);
    const passedCount = results.filter((r) => r.passed).length;
    let status = 'accepted';
    let errorType = null;
    let errorMessage = null;
    const hasError = results.some(r => r.errorType && r.errorType !== 'unknown');
    if (hasError) {
      const firstError = results.find(r => r.errorType);
      status = firstError.errorType === 'compilation_error' ? 'compilation_error'
        : firstError.errorType === 'time_limit_exceeded' ? 'time_limit_exceeded'
        : firstError.errorType === 'runtime_error' ? 'runtime_error'
        : 'wrong_answer';
      errorType = firstError.errorType;
      errorMessage = firstError.error;
    } else if (passedCount === submission.totalTestCases) {
      status = 'accepted';
    } else {
      status = 'wrong_answer';
    }
    submission.status = status;
    submission.testCaseResults = results.map((r, idx) => ({
      testCase: problem.testCases[idx]?._id || null,
      passed: r.passed,
      input: r.isSample ? (r.input || problem.testCases[idx]?.input || '') : '',
      expectedOutput: r.isSample ? r.expectedOutput : '',
      actualOutput: r.output || '',
      executionTime: r.executionTime || 0,
      memoryUsed: r.memoryUsed || 0,
      errorType: r.errorType || null,
      errorMessage: r.error || null,
      isSample: r.isSample || false,
    }));
    submission.passedTestCases = passedCount;
    submission.executionTime = Math.max(...results.map((r) => r.executionTime || 0));
    submission.memoryUsed = Math.max(...results.map((r) => r.memoryUsed || 0));
    submission.score = Math.round((passedCount / Math.max(submission.totalTestCases, 1)) * 100);
    submission.errorType = errorType;
    submission.errorMessage = errorMessage;
    await submission.save();
    updateLeaderboardAfterSubmission(req.user.id).catch(err => console.error('Leaderboard update failed:', err.message));
    const { createPracticeRecord } = require('./practiceHistoryController');
    createPracticeRecord(submission).catch(err => console.error('Practice history creation failed:', err.message));
    res.status(201).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitSolution = async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    if (!problemId || !code || !language) {
      return res.status(400).json({ success: false, message: 'Please provide problemId, code, and language' });
    }
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    const submission = await Submission.create({
      user: req.user.id,
      problem: problemId,
      code,
      language,
      status: 'pending',
      totalTestCases: problem.testCases.length,
      type: 'submit',
      problemDifficulty: problem.difficulty,
      problemTags: problem.tags,
      category: 'dsa',
    });
    const signature = problem.functionSignature ? problem.functionSignature[language] : null;
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Function signature not found for selected language' });
    }
    
    // Execute test cases with timeout enforcement
    const results = await submitCode(code, language, problem.testCases, signature, problem.timeLimit || 2000);
    const passedCount = results.filter((r) => r.passed).length;
    let status = 'accepted';
    let errorType = null;
    let errorMessage = null;
    
    // Check for TLE first - this takes priority
    const tleResult = results.find(r => r.errorType === 'time_limit_exceeded');
    if (tleResult) {
      status = 'time_limit_exceeded';
      errorType = 'time_limit_exceeded';
      errorMessage = tleResult.error || `Execution time ${tleResult.executionTime}ms exceeded limit`;
    } else {
      const hasError = results.some(r => r.errorType && r.errorType !== 'unknown');
      if (hasError) {
        const firstError = results.find(r => r.errorType);
        status = firstError.errorType === 'compilation_error' ? 'compilation_error'
          : firstError.errorType === 'time_limit_exceeded' ? 'time_limit_exceeded'
          : firstError.errorType === 'runtime_error' ? 'runtime_error'
          : 'wrong_answer';
        errorType = firstError.errorType;
        errorMessage = firstError.error;
      } else if (passedCount === problem.testCases.length) {
        status = 'accepted';
      } else {
        status = 'wrong_answer';
      }
    }
    
    submission.status = status;
    submission.testCaseResults = results.map((r, idx) => ({
      testCase: problem.testCases[idx]?._id || null,
      passed: r.passed,
      input: r.isSample ? (r.input || problem.testCases[idx]?.input || '') : '',
      expectedOutput: r.isSample ? r.expectedOutput : '',
      actualOutput: r.output || '',
      executionTime: r.executionTime || 0,
      memoryUsed: r.memoryUsed || 0,
      errorType: r.errorType || null,
      errorMessage: r.error || null,
      isSample: r.isSample || false,
    }));
    submission.passedTestCases = passedCount;
    submission.executionTime = Math.max(...results.map((r) => r.executionTime || 0));
    submission.memoryUsed = Math.max(...results.map((r) => r.memoryUsed || 0));
    submission.score = Math.round((passedCount / Math.max(problem.testCases.length, 1)) * 100);
    submission.errorType = errorType;
    submission.errorMessage = errorMessage;
    await submission.save();
    problem.totalSubmissions += 1;
    if (status === 'accepted') problem.acceptedSubmissions += 1;
    problem.acceptanceRate = Math.round((problem.acceptedSubmissions / Math.max(problem.totalSubmissions, 1)) * 100);
    await problem.save();
    if (status === 'accepted') {
      const existingAccepted = await Submission.findOne({
        user: req.user.id,
        problem: problemId,
        status: 'accepted',
        type: 'submit',
        _id: { $ne: submission._id },
      });
      if (!existingAccepted) {
        const solvedIncrement = problem.difficulty === 'easy' ? { 'stats.easySolved': 1, 'stats.totalSolved': 1, 'stats.totalSubmissions': 1 }
          : problem.difficulty === 'medium' ? { 'stats.mediumSolved': 1, 'stats.totalSolved': 1, 'stats.totalSubmissions': 1 }
          : { 'stats.hardSolved': 1, 'stats.totalSolved': 1, 'stats.totalSubmissions': 1 };
        await User.findByIdAndUpdate(req.user.id, { $inc: solvedIncrement });
      } else {
        await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.totalSubmissions': 1 } });
      }
    } else {
      await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.totalSubmissions': 1 } });
    }
    if (status !== 'accepted') {
      const user = await User.findById(req.user.id);
      const weakTopics = problem.tags.filter((tag) => !user.weakTopics.includes(tag));
      if (weakTopics.length > 0) {
        await User.findByIdAndUpdate(req.user.id, {
          $addToSet: { weakTopics: { $each: weakTopics } },
        });
      }
    }
    if (status === 'accepted') {
      updateStreak(req.user.id).catch(err => console.error('Streak update failed:', err.message));
    }
    updateLeaderboardAfterSubmission(req.user.id).catch(err => console.error('Leaderboard update failed:', err.message));
    const { createPracticeRecord } = require('./practiceHistoryController');
    createPracticeRecord(submission).catch(err => console.error('Practice history creation failed:', err.message));
    res.status(201).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const { problemId, page = 1, limit = 20 } = req.query;
    const query = { user: req.user.id };
    if (problemId) query.problem = problemId;
    const total = await Submission.countDocuments(query);
    const submissions = await Submission.find(query)
      .populate('problem', 'title slug difficulty tags')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const CodeSubmission = require('../models/CodeSubmission');
    const codeQuery = { user: req.user.id };
    if (problemId) codeQuery.problem = problemId;
    const codeSubmissions = await CodeSubmission.find(codeQuery)
      .populate('problem', 'title slug difficulty tags')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const merged = [
      ...submissions.map(s => ({ ...s.toObject(), source: 'submission' })),
      ...codeSubmissions.map(s => ({ ...s.toObject(), source: 'code' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const mergedTotal = total + await CodeSubmission.countDocuments(codeQuery);
    res.status(200).json({
      success: true,
      count: merged.length,
      total: mergedTotal,
      totalPages: Math.ceil(mergedTotal / limit),
      currentPage: parseInt(page),
      data: merged,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubmission = async (req, res) => {
  try {
    let submission = await Submission.findById(req.params.id)
      .populate('problem', 'title slug difficulty tags')
      .populate('user', 'name email');
    if (!submission) {
      const CodeSubmission = require('../models/CodeSubmission');
      submission = await CodeSubmission.findById(req.params.id)
        .populate('problem', 'title slug difficulty tags')
        .populate('user', 'name email');
    }
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    const ownerId = submission.user?._id?.toString() || submission.user?.toString();
    if (ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.runSQL = async (req, res) => {
  try {
    const { problemId, code } = req.body;
    if (!problemId || !code) {
      return res.status(400).json({ success: false, message: 'Please provide problemId and code' });
    }
    
    const problem = await SQLProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    
    // Sample cases only — evaluated through the shared comparator path
    // (utils/sqlCaseRunner.evaluateSqlCase) so each case's stored
    // inputStateSQL is applied to a fresh sandbox before comparison.
    const sampleCases = problem.sampleTestCases || [];
    const casesToRun = sampleCases.length > 0 ? sampleCases : [];

    const results = [];
    const schemaSetup = problem.schemaSetupSQL || '';

    for (const tc of casesToRun) {
      results.push(await evaluateSqlCase({
        query: code,
        schemaSetup,
        testCase: tc,
        isSample: true,
        timeoutMs: 5000,
      }));
    }

    const passedCount = results.filter((r) => r.passed).length;
    const firstFailure = results.find((r) => !r.passed);
    let status = 'wrong_answer';
    if (casesToRun.length === 0) status = 'accepted';
    else if (passedCount === casesToRun.length) status = 'accepted';
    else if (firstFailure && firstFailure.errorType) status = firstFailure.errorType;
    
    const submission = await SQLSubmission.create({
      user: req.user.id,
      problem: problemId,
      query: code,
      status,
      type: 'run',
      passedTestCases: passedCount,
      totalTestCases: casesToRun.length,
      runtimeMs: results.reduce((sum, r) => sum + (r.executionTime || 0), 0),
    });
    
    res.status(201).json({
      success: true,
      data: {
        ...submission.toObject(),
        testCaseResults: results,
        mode: 'run',
      }
    });
  } catch (error) {
    console.error('SQL run error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitSQL = async (req, res) => {
  try {
    const { problemId, code } = req.body;
    if (!problemId || !code) {
      return res.status(400).json({ success: false, message: 'Please provide problemId and code' });
    }

    const problem = await SQLProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const sampleCases = problem.sampleTestCases || [];
    const allCases = [...sampleCases, ...(problem.hiddenTestCases || [])];
    const results = [];
    const schemaSetup = problem.schemaSetupSQL || '';

    // Shared comparator path: every case (sample AND hidden) applies its own
    // stored inputStateSQL mutation to a fresh sandbox before comparison.
    for (let i = 0; i < allCases.length; i++) {
      results.push(await evaluateSqlCase({
        query: code,
        schemaSetup,
        testCase: allCases[i],
        isSample: i < sampleCases.length,
        timeoutMs: 8000,
      }));
    }

    const passedCount = results.filter((r) => r.passed).length;
    // Shared-path contract: zero executable cases must never be accepted.
    const { status, firstError } = summarizeSqlResults(results);

    const topics = [...new Set([...(problem.topics || []), ...(problem.tags || []), ...(problem.topic ? [problem.topic] : [])])];
    const totalRuntime = results.reduce((sum, r) => sum + (r.executionTime || 0), 0);

    const submission = await SQLSubmission.create({
      user: req.user.id,
      problem: problemId,
      query: code,
      status,
      type: 'submit',
      difficulty: problem.difficulty,
      topics,
      passedTestCases: passedCount,
      totalTestCases: allCases.length,
      runtimeMs: totalRuntime,
      executionTime: totalRuntime,
      errorMessage: status === 'accepted' ? null : (firstError || 'Wrong answer'),
    });

    problem.totalSubmissions = (problem.totalSubmissions || 0) + 1;
    if (status === 'accepted') problem.acceptedSubmissions = (problem.acceptedSubmissions || 0) + 1;
    problem.acceptanceRate = problem.totalSubmissions > 0
      ? Math.round(((problem.acceptedSubmissions || 0) / problem.totalSubmissions) * 100)
      : 0;
    await problem.save().catch(() => {});

    res.status(201).json({
      success: true,
      data: {
        ...submission.toObject(),
        testCaseResults: shapeSqlResults(results, sampleCases.length),
        mode: 'submit',
      },
    });
  } catch (error) {
    console.error('SQL submit error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};