const express = require('express');
const { runCode, buildDriverFromSignature, executeSingleCase, executeTestCases } = require('../utils/judge0Coding');
const genericValidator = require('../utils/genericValidator');
const CodeSubmission = require('../models/CodeSubmission');
const CodingProblem = require('../models/CodingProblem');
const { protect } = require('../middleware/auth');
const { updateStreak } = require('../utils/streak');
const { recomputeUserProgress } = require('../services/dsaProgressService');

const router = express.Router();

// ===========================================================================
// Phase 3.2 — Generic, metadata-driven submission validation (merged).
// POST /submit validates via genericValidator.validateUserCode (normalized from
// the live CodingProblem document) instead of the legacy judge0Coding.submitCode
// path; the former /submit-v2 route is deprecated/removed in favour of /submit.
// The execution sandbox is reused unchanged via createSandboxExecutor
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
      // Batches every test case of a submission into ONE engine call, so the
      // driver is built once and the program is compiled once (the previous
      // behaviour rebuilt and recompiled it for each of the 50+ hidden cases).
      executeBatch: (fullCode, language, cases, returnType) =>
        executeTestCases(fullCode, language, cases, returnType),
    });
  }
  return genericSandboxExecutor;
}

/** Map a generic-validator per-case result to the legacy judge0 result shape
 *  ({ input, output, expectedOutput, passed, executionTime, memoryUsed, error,
 *  errorType, status, status_id }) so persistence/response-shaping is unchanged.
 *  NOTE: NO LONGER USED — generic validator results are consumed directly. */
/* function toLegacyResult(r) {
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
} */

/** Derive a fine-grained verdict mirroring computeVerdict() from the legacy path. */
function verdictFromResults(results, passed, total) {
  // A problem with no test cases cannot be verified at all. Reporting
  // "WrongAnswer" there is a lie: nothing was checked, and the bank's own
  // reference solution would fail too. `Untested` is the honest verdict — it is
  // NOT Accepted, so it correctly does not turn the card green.
  if (total === 0) return 'Untested';
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
  const sampleResults = sampleRun.results || [];

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
    const hiddenResults = hiddenRun.results || [];
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
    if (!problemId) return res.status(400).json({ success: false, message: 'Missing problemId' });
    if (!language) return res.status(400).json({ success: false, message: 'Missing language' });
    if (!code) return res.status(400).json({ success: false, message: 'Missing user code' });

    const problem = await CodingProblem.findById(problemId);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    // Phase 3.2: /submit now validates via the generic, metadata-driven engine
    // (formerly /submit-v2). Visible samples run first as a LeetCode-style gate;
    // hidden cases run only when every sample passes and are never returned.
    const { verdict, results, passedTestCases, totalTestCases } =
      await validateViaGenericValidator(problem, code, language);

    const { submission, firstFailedIdx } = await persistSubmissionRecords(
      req, problem, code, language, verdict, results, passedTestCases, totalTestCases
    );
    // Read the solved flag back from the DATABASE instead of deriving it from
    // this one submission's verdict. That makes the client render the exact
    // state the server holds, so "AC then WA" correctly reports solved=true and
    // a repeat AC does not create a second solved problem.
    const solved = !!(await CodeSubmission.exists({
      user: req.user.id,
      problem: problem._id,
      verdict: 'Accepted',
    }));
    await sendSubmitResponse(res, { problem, verdict, results, passedTestCases, totalTestCases, submission, firstFailedIdx, solved });
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
  // How many leading cases are user-visible samples. Everything after this
  // index is a hidden case whose content must never be persisted in a form the
  // client can read back.
  const visibleCount = (problem.sampleTests || []).length;

  /** Persist one case, blanking any hidden content. `idx` is its position. */
  const persistCase = (r, idx) => {
    const isSample = idx < visibleCount;
    if (isSample) {
      return {
        input: r.input,
        expected: r.expected,
        actualOutput: r.actual,
        passed: r.passed,
        executionTime: r.time || 0,
        memoryUsed: 0,
        errorType: r.errorType,
        errorMessage: r.error || null,
        isSample: true,
      };
    }
    return {
      input: '',
      expected: '',
      actualOutput: '',
      passed: r.passed,
      executionTime: r.time || 0,
      memoryUsed: 0,
      errorType: r.errorType,
      errorMessage: null,
      isSample: false,
    };
  };

  const firstFailedIsHidden = firstFailedIdx >= visibleCount && firstFailedIdx !== -1;

  const submission = await CodeSubmission.create({
    user: userId,
    problem: problem._id,
    language,
    code,
    verdict,
    passedTestCases,
    totalTestCases,
        runtimeMs: Math.max(...results.map((r) => r.time || 0), 0),
    memoryKb: Math.max(...results.map((r) => r.memoryUsed || 0), 0),
    testCaseResults: results.map(persistCase),
    firstFailedInput: firstFailedIsHidden ? null : (firstFailed ? firstFailed.input : null),
    firstFailedExpected: firstFailedIsHidden ? null : (firstFailed ? firstFailed.expected : null),
    firstFailedActual: firstFailedIsHidden ? null : (firstFailed ? firstFailed.actual : null),
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
        // The legacy `submissions` ledger is read back by
        // GET /api/submissions/:id, so it gets the SAME hidden-content
        // redaction as CodeSubmission — never store a hidden expected output.
        testCaseResults: results.map(persistCase),
        score: totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0,
  });

  if (status === 'accepted') {
    // Solved counts are RECOMPUTED from the user's real submission records
    // rather than incremented. That makes them idempotent (a second Accepted
    // on an already-solved problem cannot inflate the count) and repairs
    // counters that historical data left wrong. See services/dsaProgressService.
    const progress = await recomputeUserProgress(userId);
    const user = await User.findById(userId);
    await Leaderboard.findOneAndUpdate(
      { userId: userId },
      {
        totalSolved: progress.totalSolved,
        easySolved: progress.easySolved,
        mediumSolved: progress.mediumSolved,
        hardSolved: progress.hardSolved,
        totalSubmissions: user ? user.stats.totalSubmissions : progress.totalSubmissions,
        acceptanceRate: progress.acceptanceRate,
        atsScore: (user && user.profile && user.profile.atsScore) || 0,
        streak: (user && user.stats && user.stats.streak) || 0,
        // UNIQUE problems solved in the window, not the number of Accepted
        // submissions inside it.
        weeklySolved: progress.weeklySolved,
        monthlySolved: progress.monthlySolved,
        lastUpdated: Date.now(),
      },
      { upsert: true, new: true }
    );
    updateStreak(userId).catch((err) => console.error('Streak update failed:', err.message));
  }
  await User.findByIdAndUpdate(userId, { $inc: { 'stats.totalSubmissions': 1 } });

  return { submission, firstFailedIdx };
}

/** Shape + send the /submit response, enforcing hidden-test-content isolation:
 *  sample cases carry full detail, hidden cases carry counts only (input /
 *  expected / actual nulled), and a hidden first-failure is not leaked. */
async function sendSubmitResponse(res, { problem, verdict, results, passedTestCases, totalTestCases, submission, firstFailedIdx, solved }) {
  const visibleCount = (problem.sampleTests || []).length;
  const firstFailedIsHidden = firstFailedIdx >= visibleCount && firstFailedIdx !== -1;
  const firstFailed = firstFailedIdx >= 0 ? results[firstFailedIdx] : null;
    const shapedResults = results.map((r, idx) => {
    const isSample = idx < visibleCount;
    if (isSample) {
      return {
        input: r.input,
        expectedOutput: r.expected,
        actualOutput: r.actual,
        passed: r.passed,
        executionTime: r.time || 0,
        memoryUsed: 0,
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
      executionTime: r.time || 0,
      memoryUsed: 0,
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
            firstFailedExpected: firstFailedIsHidden ? null : (firstFailed ? firstFailed.expected : null),
      firstFailedActual: firstFailedIsHidden ? null : (firstFailed ? firstFailed.actual : null),
      // Authoritative solved state for this (user, problem) pair, derived from
      // the database rather than guessed by the client, so the UI can turn the
      // card green and a refresh / re-login reproduces the exact same state.
      solved: Boolean(solved),
      // When the problem ships no test cases the submission could not be
      // verified. Say so plainly instead of leaving the user thinking their
      // code was wrong.
      verified: totalTestCases > 0,
      message: totalTestCases > 0
        ? null
        : 'This problem has no test cases configured yet, so your solution could not be checked. It is not counted as solved.',
      mode: 'submit',
      testCaseResults: shapedResults,
    },
  });
}

/**
 * Strip HIDDEN test-case content from a stored submission before it is sent to
 * the client.
 *
 * WHY: `persistSubmissionRecords` saves every case's expected output, including
 * the hidden ones, so a user could call GET /api/coding/submissions, read the
 * expected output of every hidden test for that problem and hard-code the
 * answers. The submit RESPONSE already nulled hidden content; the stored record
 * did not, and the history endpoints returned it verbatim. Both are now
 * sanitised at the edge. The owner still sees their own code, language, verdict
 * and timestamp — which is the whole point of the history view.
 */
function sanitizeSubmission(doc) {
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const visibleCount = plain.visibleTestCaseCount != null ? plain.visibleTestCaseCount : undefined;

  if (Array.isArray(plain.testCaseResults)) {
    plain.testCaseResults = plain.testCaseResults.map((r, idx) => {
      if (r && r.isSample) return r;
      // Any case not explicitly marked as a visible sample is treated as
      // hidden, so a missing flag can never leak content.
      const knownVisible = visibleCount != null && idx < visibleCount;
      if (knownVisible) return r;
      return {
        ...r,
        input: null,
        expected: r && r.expected !== undefined ? null : r.expected,
        expectedOutput: r && r.expectedOutput !== undefined ? null : r.expectedOutput,
        actualOutput: null,
        errorMessage: null,
        isSample: false,
      };
    });
  }

  if (plain.firstFailedInput) {
    const firstFailedHidden = plain.testCaseResults
      && plain.firstFailedInput !== null
      && Array.isArray(plain.testCaseResults)
      && plain.testCaseResults.findIndex((r) => r && r.input === plain.firstFailedInput) === -1;
    if (firstFailedHidden) {
      plain.firstFailedInput = null;
      plain.firstFailedExpected = null;
      plain.firstFailedActual = null;
    }
  }

  return plain;
}

router.get('/submissions', protect, async (req, res) => {
  try {
    const { problemId, page = 1, limit = 20, status, language } = req.query;
    const query = { user: req.user.id };
    if (problemId) query.problem = problemId;
    // Optional filters so the history view can narrow by verdict and language.
    if (status) query.verdict = status;
    if (language) query.language = language;

    const perPage = Math.min(parseInt(limit) || 20, 100);
    const total = await CodeSubmission.countDocuments(query);
    const submissions = await CodeSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    res.status(200).json({
      success: true,
      count: submissions.length,
      total,
      totalPages: Math.ceil(total / perPage),
      currentPage: parseInt(page),
      // `data` is kept for the existing client; `submissions` is an alias so
      // both response shapes in use across the app keep working.
      data: submissions.map(sanitizeSubmission),
      submissions: submissions.map(sanitizeSubmission),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/submissions/:id', protect, async (req, res) => {
  try {
  const found = await CodeSubmission.findOne({ _id: req.params.id, user: req.user.id }).lean();
    if (!found) return res.status(404).json({ success: false, message: 'Submission not found' });
    res.status(200).json({ success: true, data: sanitizeSubmission(found) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
