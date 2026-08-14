const express = require('express');
const { runCode, submitCode, computeVerdict, buildDriverFromSignature, executeSingleCase } = require('../utils/judge0Coding');
const genericValidator = require('../utils/genericValidator');
const CodeSubmission = require('../models/CodeSubmission');
const CodingProblem = require('../models/CodingProblem');
const { protect } = require('../middleware/auth');
const { updateStreak } = require('../utils/streak');

const router = express.Router();

// ===========================================================================
// Phase 3.1 — Generic, metadata-driven submission validation.
// /submit-v2 validates via genericValidator.validateUserCode (normalized from
// the live CodingProblem document) instead of the legacy judge0Coding.submitCode
// path. The execution sandbox is reused unchanged via createSandboxExecutor
// (-> buildDriverFromSignature + executeSingleCase), which selects Judge0 or
// the localExecutor based on CODING_EXECUTION_ENGINE. No per-problem logic.
// ===========================================================================

/** Lazily-built, module-shared sandbox executor (reused across requests). */
let genericSandboxExecutor = null;
function getGenericSandboxExecutor() {
  if (!genericSandboxExecutor) {
    genericSandboxExecutor = genericValidator.createSandboxExecutor({
      buildDriverFromSignature: (code, language, signature) =>
        buildDriverFromSignature(code, language, signature),
      executeSingleCase: (fullCode, language, input, expectedOutput, returnType) =>
        executeSingleCase(fullCode, language, input, expectedOutput, returnType),
    });
  }
  return genericSandboxExecutor;
}

/** Map a generic-validator per-case result to the legacy judge0 result shape
 *  ({ input, output, expectedOutput, passed, executionTime, memoryUsed, error,
 *  errorType, status, status_id }) so persistence/response-shaping is unchanged. */
function toLegacyResult(r) {
  const errorType = r.errorType || null;
  const passed = !!r.passed;
  return {
    input: r.input != null ? String(r.input) : '',
    output: r.actual != null ? String(r.actual) : '',
    expectedOutput: r.expected != null ? String(r.expected) : '',
    passed,
    executionTime: r.time || 0,
    memoryUsed: 0,
    error: r.error || null,
    errorType,
    status: passed ? 'accepted' : (errorType ? String(errorType).toLowerCase().replace(/error$/, '_error') : 'wrong_answer'),
    status_id: passed ? 3 : 4,
  };
}

/** Derive a fine-grained verdict mirroring computeVerdict() from the legacy path. */
function verdictFromResults(results, passed, total) {
  if (total === 0) return 'WrongAnswer';
  if (passed === total) return 'Accepted';
  const firstFailed = results.find((r) => !r.passed);
  const et = firstFailed && firstFailed.errorType;
  if (et === 'CompileError') return 'CompileError';
  if (et === 'RuntimeError') return 'RuntimeError';
  if (et === 'TLE' || et === 'time_limit_exceeded') return 'TLE';
  return 'WrongAnswer';
}

/**
 * Validate a submission via the generic, metadata-driven engine.
 * normalizeProblem() adapts the live DB document (line-based sampleTests /
 * hiddenTests + functionSignature) into the engine shape; visible samples run
 * first as a LeetCode-style gate, then hidden cases only when every sample
 * passes (hidden CASE CONTENT is never returned — only aggregate counts).
 * @returns {{ verdict, results: legacy-shaped[], passedTestCases, totalTestCases }}
 */
async function validateViaGenericValidator(problem, code, language) {
  const normalized = genericValidator.normalizeProblem(problem);
  const executor = getGenericSandboxExecutor();
  const baseOpts = { runTestCase: executor };

  // 1) Visible samples (validateUserCode runs onlySample=true by default).
  const sampleRun = await genericValidator.validateUserCode(normalized, code, language, baseOpts);
  const sampleResults = (sampleRun.results || []).map(toLegacyResult);

  if (!sampleRun.allSamplesPassed) {
    const passed = sampleResults.filter((r) => r.passed).length;
    return {
      verdict: verdictFromResults(sampleResults, passed, sampleResults.length),
      results: sampleResults,
      passedTestCases: passed,
      totalTestCases: sampleResults.length,
    };
  }

  // 2) Hidden cases only after samples pass (content stays server-side).
  const hiddenTC = normalized.testCases.filter((tc) => tc.isHidden);
  const hiddenRun = await genericValidator.validateUserCode(normalized, code, language, {
    runTestCase: executor,
    onlySample: false,
    testCases: hiddenTC,
  });
  const hiddenResults = (hiddenRun.results || []).map(toLegacyResult);
  const results = sampleResults.concat(hiddenResults);
  const passed = results.filter((r) => r.passed).length;
  return {
    verdict: verdictFromResults(results, passed, results.length),
    results,
    passedTestCases: passed,
    totalTestCases: results.length,
  };
}

router.post('/run', protect, async (req, res) => {
  try {
    const { problemId, language, code } = req.body;
    const problem = await CodingProblem.findById(problemId);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    const normalizeTest = (tc) => ({ input: tc.input, expectedOutput: tc.output, isHidden: !!tc.isHidden });
    const sampleCases = (problem.sampleTests || []).filter((tc) => !tc.isHidden).map(normalizeTest);
    const casesToRun = sampleCases.length > 0 ? sampleCases : (problem.sampleTests || []).slice(0, 2).map(normalizeTest);
    const fullCode = buildDriverFromSignature(code, language, problem.functionSignature?.[language]);
    const returnType = problem.functionSignature?.[language]?.returnType || '';
    const results = await runCode(code, language, casesToRun, fullCode, returnType);

    const response = results.map((r) => ({
      input: r.input,
      expectedOutput: r.expectedOutput,
      actualOutput: r.output,
      passed: r.passed,
      executionTime: r.executionTime,
      memoryUsed: r.memoryUsed,
      error: r.error,
      errorType: r.errorType,
      errorMessage: r.error || null, // Show error message for all failures
      isSample: true,
    }));

    // LeetCode-style: Run only checks the sample/visible test cases. Report a
    // proper verdict/count so the frontend shows pass/fail instead of a generic
    // "completed" (which made the UI always toast an error after a passing run).
    const totalTestCases = results.length;
    const passedTestCases = results.filter((r) => r.passed).length;
    const firstFailed = results.find((r) => !r.passed);
    let status = 'wrong_answer';
    if (totalTestCases > 0 && passedTestCases === totalTestCases) status = 'accepted';
    else if (firstFailed && firstFailed.errorType === 'CompileError') status = 'compilation_error';
    else if (firstFailed && firstFailed.errorType === 'RuntimeError') status = 'runtime_error';
    else if (firstFailed && firstFailed.errorType === 'TLE') status = 'time_limit_exceeded';
    // Capitalized verdict keys must match the frontend STATUS_CONFIG.
    const verdictMap = {
      accepted: 'Accepted',
      wrong_answer: 'WrongAnswer',
      compilation_error: 'CompileError',
      runtime_error: 'RuntimeError',
      time_limit_exceeded: 'TLE',
    };

    res.status(200).json({
      success: true,
      data: {
        status,
        mode: 'run',
        verdict: verdictMap[status],
        passedTestCases,
        totalTestCases,
        errorMessage: firstFailed ? (firstFailed.error || null) : null,
        errorType: firstFailed ? (firstFailed.errorType || null) : null,
        testCaseResults: response,
      },
    });
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

    const normalizeTest = (tc) => ({ input: tc.input, expectedOutput: tc.output, isHidden: !!tc.isHidden });
    const allTestCases = [
      ...(problem.sampleTests || []).map(normalizeTest),
      ...(problem.hiddenTests || []).map(normalizeTest),
    ];
    const fullCode = buildDriverFromSignature(code, language, problem.functionSignature?.[language]);
    const returnType = problem.functionSignature?.[language]?.returnType || '';
    const results = await submitCode(code, language, allTestCases, fullCode, returnType);
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
        errorMessage: r.error || null, // Show error message for all failures
      })),
      firstFailedInput,
      firstFailedExpected,
      firstFailedActual,
    });

    await CodingProblem.findByIdAndUpdate(problem._id, {
      $inc: { totalSubmissions: 1, ...(verdict === 'Accepted' ? { acceptedSubmissions: 1 } : {}) },
    });

    const User = require('../models/User');
    const Leaderboard = require('../models/Leaderboard');
    const Submission = require('../models/Submission');

    const status = verdict === 'Accepted' ? 'accepted' : 'wrong_answer';
    
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
      category: 'dsa',
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
      // BUG 1 FIX: Update streak for DSA/Judge0 accepted submissions
      updateStreak(userId).catch(err => console.error('Streak update failed:', err.message));
    }
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.totalSubmissions': 1 } });

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

    const visibleCount = (problem.sampleTests || []).length;
    // Shape the HTTP response so hidden test-case content is never leaked to the
    // frontend over the network. The persisted CodeSubmission keeps full data.
    const shapedResults = results.map((r, idx) => {
      const isSample = idx < visibleCount;
      if (isSample) {
        return {
          input: r.input,
          expectedOutput: r.expectedOutput,
          actualOutput: r.output,
          passed: r.passed,
          executionTime: r.executionTime,
          memoryUsed: r.memoryUsed,
          errorType: r.errorType,
          errorMessage: r.error || null,
          isSample: true,
        };
      }
      // Hidden case: strip all content-bearing fields.
      return {
        input: null,
        expectedOutput: null,
        actualOutput: null,
        passed: r.passed,
        executionTime: r.executionTime,
        memoryUsed: r.memoryUsed,
        errorType: r.errorType,
        errorMessage: null,
        isSample: false,
      };
    });
    const firstFailedIdx = results.findIndex((r) => !r.passed);
    const firstFailedIsHidden = firstFailedIdx >= visibleCount;
    const safeFirstFailedInput = firstFailedIsHidden ? null : firstFailedInput;
    const safeFirstFailedExpected = firstFailedIsHidden ? null : firstFailedExpected;
    const safeFirstFailedActual = firstFailedIsHidden ? null : firstFailedActual;

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
        firstFailedInput: safeFirstFailedInput,
        firstFailedExpected: safeFirstFailedExpected,
        firstFailedActual: safeFirstFailedActual,
        mode: 'submit',
        testCaseResults: shapedResults,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** Persist a submission + ledger side-effects (mirrors legacy /submit). Returns
 *  the created CodeSubmission plus the first-failed index for response shaping. */
async function persistSubmissionRecords(req, problem, code, language, verdict, results, passedTestCases, totalTestCases) {
  const userId = req.user.id;
  const firstFailedIdx = results.findIndex((r) => !r.passed);
  const firstFailed = firstFailedIdx >= 0 ? results[firstFailedIdx] : null;

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
    firstFailedInput: firstFailed ? firstFailed.input : null,
    firstFailedExpected: firstFailed ? firstFailed.expectedOutput : null,
    firstFailedActual: firstFailed ? firstFailed.output : null,
  });

  await CodingProblem.findByIdAndUpdate(problem._id, {
    $inc: { totalSubmissions: 1, ...(verdict === 'Accepted' ? { acceptedSubmissions: 1 } : {}) },
  });

  const User = require('../models/User');
  const Leaderboard = require('../models/Leaderboard');
  const Submission = require('../models/Submission');
  const status = verdict === 'Accepted' ? 'accepted' : 'wrong_answer';

  await Submission.create({
    user: userId,
    problem: problem._id,
    code,
    language,
    status,
    type: 'submit',
    passedTestCases,
    totalTestCases,
    problemDifficulty: problem.difficulty,
    problemTags: problem.tags,
    category: 'dsa',
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

  if (status === 'accepted') {
    const existingAccepted = await Submission.findOne({ user: userId, problem: problem._id, status: 'accepted', type: 'submit' });
    if (!existingAccepted) {
      const solvedIncrement = problem.difficulty === 'easy'
        ? { 'stats.easySolved': 1, 'stats.totalSolved': 1 }
        : problem.difficulty === 'medium'
        ? { 'stats.mediumSolved': 1, 'stats.totalSolved': 1 }
        : { 'stats.hardSolved': 1, 'stats.totalSolved': 1 };
      await User.findByIdAndUpdate(userId, { $inc: solvedIncrement });
    }
    updateStreak(userId).catch((err) => console.error('Streak update failed:', err.message));
  }
  await User.findByIdAndUpdate(userId, { $inc: { 'stats.totalSubmissions': 1 } });

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

  return { submission, firstFailedIdx };
}

/** Shape + send the /submit response, enforcing hidden-test-content isolation:
 *  sample cases carry full detail, hidden cases carry counts only (input /
 *  expected / actual nulled), and a hidden first-failure is not leaked. */
async function sendSubmitResponse(res, { problem, verdict, results, passedTestCases, totalTestCases, submission, firstFailedIdx }) {
  const visibleCount = (problem.sampleTests || []).length;
  const firstFailedIsHidden = firstFailedIdx >= visibleCount && firstFailedIdx !== -1;
  const firstFailed = firstFailedIdx >= 0 ? results[firstFailedIdx] : null;
  const shapedResults = results.map((r, idx) => {
    const isSample = idx < visibleCount;
    if (isSample) {
      return {
        input: r.input,
        expectedOutput: r.expectedOutput,
        actualOutput: r.output,
        passed: r.passed,
        executionTime: r.executionTime,
        memoryUsed: r.memoryUsed,
        errorType: r.errorType,
        errorMessage: r.error || null,
        isSample: true,
      };
    }
    return {
      input: null,
      expectedOutput: null,
      actualOutput: null,
      passed: r.passed,
      executionTime: r.executionTime,
      memoryUsed: r.memoryUsed,
      errorType: r.errorType,
      errorMessage: null,
      isSample: false,
    };
  });

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
      firstFailedInput: firstFailedIsHidden ? null : (firstFailed ? firstFailed.input : null),
      firstFailedExpected: firstFailedIsHidden ? null : (firstFailed ? firstFailed.expectedOutput : null),
      firstFailedActual: firstFailedIsHidden ? null : (firstFailed ? firstFailed.output : null),
      mode: 'submit',
      testCaseResults: shapedResults,
    },
  });
}

/** Phase 3.1: /submit-v2 — validates via the generic, metadata-driven engine. */
router.post('/submit-v2', protect, async (req, res) => {
  try {
    const { problemId, language, code } = req.body;
    if (!problemId) return res.status(400).json({ success: false, message: 'Missing problemId' });
    if (!language) return res.status(400).json({ success: false, message: 'Missing language' });
    if (!code) return res.status(400).json({ success: false, message: 'Missing user code' });

    const problem = await CodingProblem.findById(problemId);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    // Wire genericValidator.validateUserCode into the submission flow.
    const { verdict, results, passedTestCases, totalTestCases } =
      await validateViaGenericValidator(problem, code, language);

    const { submission, firstFailedIdx } = await persistSubmissionRecords(
      req, problem, code, language, verdict, results, passedTestCases, totalTestCases
    );
    await sendSubmitResponse(res, { problem, verdict, results, passedTestCases, totalTestCases, submission, firstFailedIdx });
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
