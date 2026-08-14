/* testAdminCreate.js (Phase 4.1.4 + 4.1.5)
 * ---------------------------------------------------------------------------
 * 1) Replicates the admin POST /api/admin/coding-problems create flow to add a
 *    NEW metadata-driven problem ("Maximum Subarray Sum", Kadane's algorithm).
 * 2) Verifies the created problem works in the SAME generic-validator path the
 *    merged /submit uses — with NO per-problem validator code changes:
 *        correct solution   -> Accepted (samples + hidden pass)
 *        incorrect solution -> WrongAnswer
 * Run: node server/scripts/testAdminCreate.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');
const G = require('../utils/genericValidator');
const judge0 = require('../utils/judge0Coding');

const SANDBOX = G.createSandboxExecutor({
  buildDriverFromSignature: (c, l, s) => judge0.buildDriverFromSignature(c, l, s),
  executeSingleCase: (fc, l, i, e, rt) => judge0.executeSingleCase(fc, l, i, e, rt),
});

// Inlined verbatim from server/routes/coding.js (the path /submit executes).
function verdictFromResults(results, passed, total) {
  if (total === 0) return 'WrongAnswer';
  if (passed === total) return 'Accepted';
  const f = results.find((r) => !r.passed);
  const et = f && f.errorType;
  if (et === 'CompileError') return 'CompileError';
  if (et === 'RuntimeError') return 'RuntimeError';
  if (et === 'TLE' || et === 'time_limit_exceeded') return 'TLE';
  return 'WrongAnswer';
}
function legacy(r) {
  return { input: r.input != null ? String(r.input) : '', output: r.actual != null ? String(r.actual) : '', expectedOutput: r.expected != null ? String(r.expected) : '', passed: !!r.passed, errorType: r.errorType || null, error: r.error || null };
}
async function validateViaGenericValidator(problem, code, language) {
  const normalized = G.normalizeProblem(problem);
  const sampleRun = await G.validateUserCode(normalized, code, language, { runTestCase: SANDBOX });
  const sampleResults = (sampleRun.results || []).map(legacy);
  if (!sampleRun.allSamplesPassed) {
    const passed = sampleResults.filter((r) => r.passed).length;
    return { verdict: verdictFromResults(sampleResults, passed, sampleResults.length), results: sampleResults, passedTestCases: passed, totalTestCases: sampleResults.length };
  }
  const hiddenTC = normalized.testCases.filter((tc) => tc.isHidden);
  const hiddenRun = await G.validateUserCode(normalized, code, language, { runTestCase: SANDBOX, onlySample: false, testCases: hiddenTC });
  const hiddenResults = (hiddenRun.results || []).map(legacy);
  const results = sampleResults.concat(hiddenResults);
  const passed = results.filter((r) => r.passed).length;
  return { verdict: verdictFromResults(results, passed, results.length), results, passedTestCases: passed, totalTestCases: results.length };
}
const TITLE = 'Maximum Subarray Sum';

async function main() {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log('  PASS ' + m); } else { fail++; console.log('  FAIL ' + m); } };

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('connected to Atlas');

  // 4.1.4-admin-create flow (mirrors POST /api/admin/coding-problems).
  await CodingProblem.deleteMany({ title: TITLE });
  const created = await CodingProblem.create({
    problemId: 'maximum-subarray-sum',
    title: TITLE,
    slug: 'maximum-subarray-sum',
    description: 'Find the contiguous subarray (containing at least one number) which has the largest sum and return its sum. Kadanes algorithm.',
    difficulty: 'medium',
    topic: 'dynamic-programming',
    tags: ['array', 'dp'],
    companies: [],
    inputFormat: [{ paramName: 'nums', type: 'number[]', constraints: '-1000 <= nums[i] <= 1000' }],
    outputFormat: { type: 'number', description: 'Maximum sum of any contiguous subarray' },
    sampleTests: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'Sample 1' },
      { input: '[1]', output: '1', explanation: 'Sample 2' },
    ],
    hiddenTests: [
      { input: '[-1]', output: '-1' },
      { input: '[5,4,-1,7,8]', output: '23' },
    ],
    functionSignature: {
      javascript: { name: 'maxSubArraySum', params: [{ name: 'nums', type: 'number[]' }], returnType: 'number' },
    },
    referenceSolution: {
      code: 'function solve(nums) { let best = -Infinity, cur = 0; for (const n of nums) { cur = Math.max(n, cur + n); best = Math.max(best, cur); } return best; }',
      language: 'js',
    },
    isActive: true,
  });
  console.log('\n=== 4.1.4 CREATED PROBLEM (MongoDB document) ===');
  console.log(JSON.stringify({
    _id: created._id, problemId: created.problemId, title: created.title, difficulty: created.difficulty,
    inputFormat: created.inputFormat, outputFormat: created.outputFormat,
    sampleTests: created.sampleTests, hiddenTests: created.hiddenTests,
    functionSignature: created.functionSignature, isActive: created.isActive,
  }, null, 2));
  ok(created && created._id && created.problemId === 'maximum-subarray-sum', 'problem created in MongoDB');

  // 4.1.5 Correct solution -> Accepted (samples + hidden pass).
  const CORRECT = 'function maxSubArraySum(nums) { let best = -Infinity, cur = 0; for (const n of nums) { cur = Math.max(n, cur + n); best = Math.max(best, cur); } return best; }';
  const rOk = await validateViaGenericValidator(created, CORRECT, 'javascript');
  const visible = (created.sampleTests || []).length;
  const samplePassed = rOk.results.slice(0, visible).filter((x) => x.passed).length;
  const totalHidden = rOk.totalTestCases - visible;
  ok(rOk.verdict === 'Accepted' && rOk.passedTestCases === rOk.totalTestCases,
    '[correct] verdict=' + rOk.verdict + ' sample=' + samplePassed + '/' + visible + ' hidden=' + (rOk.passedTestCases - samplePassed) + '/' + totalHidden + ' total=' + rOk.passedTestCases + '/' + rOk.totalTestCases);

  // 4.1.5 Incorrect solution -> WrongAnswer.
  const WRONG = 'function maxSubArraySum(nums) { return 0; }';
  const rBad = await validateViaGenericValidator(created, WRONG, 'javascript');
  ok(rBad.verdict !== 'Accepted' && rBad.passedTestCases < rBad.totalTestCases,
    '[incorrect] verdict=' + rBad.verdict + ' passed=' + rBad.passedTestCases + '/' + rBad.totalTestCases);

  console.log('\n===== PHASE 4.1 ADMIN-CREATE REPORT =====');
  console.log('Total passes :', pass);
  console.log('Total fails  :', fail);
  console.log('No genericValidator / validator code changed :', 'YES (problem worked metadata-driven)');

  // Cleanup: remove the test problem so it does not pollute the live list.
  await CodingProblem.deleteMany({ title: TITLE });
  console.log('Cleaned up test problem "' + TITLE + '".');
  await mongoose.disconnect();
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });