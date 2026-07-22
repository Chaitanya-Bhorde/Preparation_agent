const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const { runCode, submitCode } = require('../utils/judge0');
const { executeSQL } = require('../utils/sqlRunner');

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
    });
    const signature = problem.functionSignature ? problem.functionSignature[language] : null;
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Function signature not found for selected language' });
    }
    const results = await submitCode(code, language, problem.testCases, signature);
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
    } else if (passedCount === problem.testCases.length) {
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
    submission.score = Math.round((passedCount / problem.testCases.length) * 100);
    submission.errorType = errorType;
    submission.errorMessage = errorMessage;
    await submission.save();
    problem.totalSubmissions += 1;
    if (status === 'accepted') problem.acceptedSubmissions += 1;
    problem.acceptanceRate = Math.round((problem.acceptedSubmissions / problem.totalSubmissions) * 100);
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
};

exports.getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('problem', 'title slug difficulty tags')
      .populate('user', 'name email');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    if (submission.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
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
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    const visibleCases = problem.testCases.filter(tc => !tc.isHidden);
    const casesToRun = visibleCases.length > 0 ? visibleCases : problem.testCases.slice(0, 2);
    const results = [];
    for (const tc of casesToRun) {
      const sqlResult = await executeSQL(code);
      if (!sqlResult.success) {
        results.push({
          passed: false,
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || '',
          actualOutput: sqlResult.error,
          errorType: 'runtime_error',
          errorMessage: sqlResult.error,
          executionTime: 0,
          memoryUsed: 0,
          isSample: tc.isSample,
        });
      } else {
        const actualOutput = JSON.stringify(sqlResult.data.rows);
        const passed = actualOutput === tc.expectedOutput;
        results.push({
          passed,
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || '',
          actualOutput,
          errorType: passed ? null : 'wrong_answer',
          errorMessage: passed ? null : `Expected ${tc.expectedOutput} but got ${actualOutput}`,
          executionTime: 0,
          memoryUsed: 0,
          isSample: tc.isSample,
        });
      }
    }
    const passedCount = results.filter(r => r.passed).length;
    const status = passedCount === casesToRun.length ? 'accepted' : 'wrong_answer';
    const submission = await Submission.create({
      user: req.user.id,
      problem: problemId,
      code,
      language: 'sql',
      status,
      type: 'run',
      passedTestCases: passedCount,
      totalTestCases: casesToRun.length,
      testCaseResults: results.map(r => ({
        passed: r.passed,
        input: r.input,
        expectedOutput: r.expectedOutput,
        actualOutput: r.actualOutput,
        errorType: r.errorType,
        errorMessage: r.errorMessage,
        executionTime: r.executionTime,
        memoryUsed: r.memoryUsed,
      })),
      score: Math.round((passedCount / casesToRun.length) * 100),
    });
    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitSQL = async (req, res) => {
  try {
    const { problemId, code } = req.body;
    if (!problemId || !code) {
      return res.status(400).json({ success: false, message: 'Please provide problemId and code' });
    }
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    const results = [];
    for (const tc of problem.testCases) {
      const sqlResult = await executeSQL(code);
      if (!sqlResult.success) {
        results.push({
          passed: false,
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || '',
          actualOutput: sqlResult.error,
          errorType: 'runtime_error',
          errorMessage: sqlResult.error,
          executionTime: 0,
          memoryUsed: 0,
          isSample: tc.isSample,
        });
      } else {
        const actualOutput = JSON.stringify(sqlResult.data.rows);
        const passed = actualOutput === tc.expectedOutput;
        results.push({
          passed,
          input: tc.isSample ? tc.input || '' : '',
          expectedOutput: tc.isSample ? tc.expectedOutput : '',
          actualOutput,
          errorType: passed ? null : 'wrong_answer',
          errorMessage: passed ? null : `Expected ${tc.expectedOutput} but got ${actualOutput}`,
          executionTime: 0,
          memoryUsed: 0,
          isSample: tc.isSample,
        });
      }
    }
    const passedCount = results.filter(r => r.passed).length;
    let status = passedCount === problem.testCases.length ? 'accepted' : 'wrong_answer';
    const submission = await Submission.create({
      user: req.user.id,
      problem: problemId,
      code,
      language: 'sql',
      status,
      type: 'submit',
      passedTestCases: passedCount,
      totalTestCases: problem.testCases.length,
      testCaseResults: results.map(r => ({
        passed: r.passed,
        input: r.input,
        expectedOutput: r.expectedOutput,
        actualOutput: r.actualOutput,
        errorType: r.errorType,
        errorMessage: r.errorMessage,
        executionTime: r.executionTime,
        memoryUsed: r.memoryUsed,
      })),
      score: Math.round((passedCount / problem.testCases.length) * 100),
    });
    problem.totalSubmissions += 1;
    if (status === 'accepted') problem.acceptedSubmissions += 1;
    problem.acceptanceRate = Math.round((problem.acceptedSubmissions / problem.totalSubmissions) * 100);
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
        await User.findByIdAndUpdate(req.user.id, {
          $inc: { 'stats.mediumSolved': 1, 'stats.totalSolved': 1, 'stats.totalSubmissions': 1 },
        });
      } else {
        await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.totalSubmissions': 1 } });
      }
    } else {
      await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.totalSubmissions': 1 } });
    }
    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};