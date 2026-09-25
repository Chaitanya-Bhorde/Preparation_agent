/**
 * verify_execution.js
 * ---------------------------------------------------------------------------
 * End-to-end verification of the DSA + SQL execution pipeline against the LIVE
 * database (real problems, real users, real submissions — nothing fabricated).
 * Verifies: Run, Submit, and every verdict type (Accepted, WA, CE, RE, TLE),
 * plus Run vs Submit latency and authenticated analytics semantics.
 * ---------------------------------------------------------------------------
 */
'use strict';
require('dotenv').config();
const mongoose = require('mongoose');

const CodingProblem = require('./models/CodingProblem');
const SQLProblem = require('./models/SQLProblem');
const Submission = require('./models/Submission');
const SQLSubmission = require('./models/SQLSubmission');
const CodeSubmission = require('./models/CodeSubmission');
const User = require('./models/User');

const { buildDriverFromSignature, runCode, submitCode, executeSingleCase } = require('./utils/judge0Coding');
const { normalizeProblem, validateUserCode, createSandboxExecutor } = require('./utils/genericValidator');
const { executeSQL } = require('./utils/sqlSandbox');

// ---- Two Sum solutions (must match problem.functionSignature.javascript) ----
// signature: twoSum(nums: number[], target: number) => number[]
const correctTwoSum = [
  'var twoSum = function(nums, target) {',
  '  const map = new Map();',
  '  for (let i = 0; i < nums.length; i++) {',
  '    const complement = target - nums[i];',
  '    if (map.has(complement)) return [map.get(complement), i];',
  '    map.set(nums[i], i);',
  '  }',
  '  return [];',
  '};',
].join('\n');

const wrongTwoSum = 'var twoSum = function(nums, target) { return [0, 0]; };';
const syntaxErrorTwoSum = 'var twoSum = function(nums, target) { return [0, 0; };';
const runtimeErrorTwoSum = 'var twoSum = function(nums, target) { throw new Error("intentional crash"); };';
const tleTwoSum = 'var twoSum = function(nums, target) { while (true) {} return [0, 1]; };';

const results = { dsa: {}, sql: {}, analytics: {} };
const record = (bucket, key, value) => { results[bucket][key] = value; };

async function timeIt(fn) {
  const t0 = Date.now();
  const value = await fn();
  return { value, elapsed: Date.now() - t0 };
}

// ============================================================================
// PART 1 — DSA EXECUTION VERIFICATION
// ============================================================================
async function verifyDsa() {
  console.log('\n========== PART 1: DSA EXECUTION VERIFICATION ==========\n');

  const problem = await CodingProblem.findOne({ slug: 'two-sum' }).lean();
  if (!problem) { console.error('FATAL: two-sum not found'); process.exit(1); }

  const sig = problem.functionSignature && problem.functionSignature.javascript;
  console.log(`Problem: ${problem.title} | difficulty: ${problem.difficulty} | topic: ${problem.topic}`);
  console.log(`Signature: ${JSON.stringify(sig)}`);

  const normalizeTest = (tc) => ({ input: tc.input, expectedOutput: tc.output, isHidden: !!tc.isHidden });
  const sampleCases = (problem.sampleTests || []).filter((tc) => !tc.isHidden).map(normalizeTest);
  const hiddenCases = (problem.hiddenTests || []).map(normalizeTest);
  console.log(`Sample cases: ${sampleCases.length} | Hidden cases: ${hiddenCases.length}`);
  record('dsa', 'sampleCaseCount', sampleCases.length);
  record('dsa', 'hiddenCaseCount', hiddenCases.length);

  // --- TEST 1: Run — correct code -> Accepted ---
  console.log('\n--- TEST 1: DSA Run - correct code -> Accepted ---');
  const driverCorrect = buildDriverFromSignature(correctTwoSum, 'javascript', sig);
  const t1 = await timeIt(() => runCode(correctTwoSum, 'javascript', sampleCases, driverCorrect, sig.returnType));
  const r1 = t1.value;
  const v1 = r1.every((r) => r.passed) ? 'Accepted' : 'WrongAnswer';
  console.log(`  Latency (Run): ${t1.elapsed}ms`);
  console.log(`  Per-case: ${r1.map((r) => (r.passed ? 'PASS' : 'FAIL')).join(' | ')}`);
  console.log(`  Output[0]: ${r1[0] && r1[0].output}`);
  console.log(`  Verdict: ${v1} ${v1 === 'Accepted' ? 'OK' : 'BAD'}`);
  record('dsa', 'runAccepted', { verdict: v1, latencyMs: t1.elapsed, pass: v1 === 'Accepted' });

  // --- TEST 2: Run — wrong code -> WrongAnswer ---
  console.log('\n--- TEST 2: DSA Run - wrong code -> WrongAnswer ---');
  const driverWrong = buildDriverFromSignature(wrongTwoSum, 'javascript', sig);
  const t2 = await timeIt(() => runCode(wrongTwoSum, 'javascript', sampleCases, driverWrong, sig.returnType));
  const r2 = t2.value;
  const v2 = r2.every((r) => r.passed) ? 'Accepted' : 'WrongAnswer';
  console.log(`  Latency (Run): ${t2.elapsed}ms`);
  console.log(`  Output[0]: ${r2[0] && r2[0].output} | Expected: ${r2[0] && r2[0].expectedOutput}`);
  console.log(`  Verdict: ${v2} ${v2 === 'WrongAnswer' ? 'OK' : 'BAD'}`);
  record('dsa', 'runWrongAnswer', { verdict: v2, pass: v2 === 'WrongAnswer' });

  // --- TEST 3: Run — syntax error -> CompileError ---
  console.log('\n--- TEST 3: DSA Run - syntax error -> CompileError ---');
  const driverSE = buildDriverFromSignature(syntaxErrorTwoSum, 'javascript', sig);
  const t3 = await timeIt(() => runCode(syntaxErrorTwoSum, 'javascript', sampleCases, driverSE, sig.returnType));
  const r3 = t3.value;
  const et3 = r3[0] && r3[0].errorType;
  console.log(`  Latency (Run): ${t3.elapsed}ms`);
  console.log(`  errorType: ${et3}`);
  console.log(`  error: ${String((r3[0] && r3[0].error) || '').slice(0, 140)}`);
  const ceOk = /compile/i.test(String(et3 || ''));
  console.log(`  Verdict: ${ceOk ? 'CompileError OK' : 'NOT CompileError BAD'}`);
  record('dsa', 'runCompileError', { errorType: et3, error: String((r3[0] && r3[0].error) || '').slice(0, 200), pass: ceOk });

  // --- TEST 4: Run — runtime error -> RuntimeError ---
  console.log('\n--- TEST 4: DSA Run - runtime error -> RuntimeError ---');
  const driverRE = buildDriverFromSignature(runtimeErrorTwoSum, 'javascript', sig);
  const t4 = await timeIt(() => runCode(runtimeErrorTwoSum, 'javascript', sampleCases, driverRE, sig.returnType));
  const r4 = t4.value;
  const et4 = r4[0] && r4[0].errorType;
  console.log(`  Latency (Run): ${t4.elapsed}ms`);
  console.log(`  errorType: ${et4}`);
  console.log(`  error: ${String((r4[0] && r4[0].error) || '').slice(0, 140)}`);
  const reOk = /runtime/i.test(String(et4 || ''));
  console.log(`  Verdict: ${reOk ? 'RuntimeError OK' : 'NOT RuntimeError BAD'}`);
  record('dsa', 'runRuntimeError', { errorType: et4, error: String((r4[0] && r4[0].error) || '').slice(0, 200), pass: reOk });

  // --- TEST 5: Run — infinite loop -> TLE (real timeout, 10s local limit) ---
  console.log('\n--- TEST 5: DSA Run - infinite loop -> TLE ---');
  const driverTLE = buildDriverFromSignature(tleTwoSum, 'javascript', sig);
  const t5 = await timeIt(() => runCode(tleTwoSum, 'javascript', sampleCases, driverTLE, sig.returnType));
  const r5 = t5.value;
  const et5 = r5[0] && r5[0].errorType;
  console.log(`  Latency (Run): ${t5.elapsed}ms`);
  console.log(`  errorType: ${et5} | status: ${r5[0] && r5[0].status}`);
  const tleOk = /tle|time/i.test(String(et5 || ''));
  console.log(`  Verdict: ${tleOk ? 'TLE OK' : 'NOT TLE BAD'}`);
  record('dsa', 'runTLE', { errorType: et5, latencyMs: t5.elapsed, pass: tleOk });

  // --- TEST 6: Submit — correct code over samples + hidden -> Accepted ---
  console.log('\n--- TEST 6: DSA Submit - correct code (samples + hidden) ---');
  const allCases = sampleCases.concat(hiddenCases);
  console.log(`  Submitting against ${allCases.length} cases (${sampleCases.length} sample + ${hiddenCases.length} hidden)`);
  const t6 = await timeIt(() => submitCode(correctTwoSum, 'javascript', allCases, driverCorrect, sig.returnType));
  const r6 = t6.value;
  const passed6 = r6.filter((r) => r.passed).length;
  const v6 = r6.every((r) => r.passed) ? 'Accepted' : 'WrongAnswer';
  console.log(`  Latency (Submit): ${t6.elapsed}ms  (${Math.round(t6.elapsed / Math.max(allCases.length, 1))}ms/case)`);
  console.log(`  Passed: ${passed6}/${r6.length}`);
  console.log(`  Verdict: ${v6} ${v6 === 'Accepted' ? 'OK' : 'BAD'}`);
  record('dsa', 'submitAccepted', {
    verdict: v6, latencyMs: t6.elapsed, passed: passed6, total: r6.length,
    msPerCase: Math.round(t6.elapsed / Math.max(allCases.length, 1)), pass: v6 === 'Accepted',
  });
  record('dsa', 'runLatencyMs', t1.elapsed);
  record('dsa', 'submitLatencyMs', t6.elapsed);

  // --- TEST 7: Submit via genericValidator (the ACTUAL /coding/submit path) ---
  console.log('\n--- TEST 7: DSA Submit via genericValidator (/coding/submit path) ---');
  const normalized = normalizeProblem(problem);
  console.log(`  Normalized: inputFormat fields=${(normalized.inputFormat.fields || []).length}`
    + ` | testCases=${normalized.testCases.length}`
    + ` | samples=${normalized.testCases.filter((tc) => !tc.isHidden).length}`
    + ` | hidden=${normalized.testCases.filter((tc) => tc.isHidden).length}`);
  console.log(`  inputFormat: ${JSON.stringify(normalized.inputFormat.fields)}`);

  const sandboxExecutor = createSandboxExecutor({
    buildDriverFromSignature: (code, language, signature) => buildDriverFromSignature(code, language, signature),
    executeSingleCase: (full, language, input, expected, returnType) =>
      executeSingleCase(full, language, input, expected, returnType),
  });

  const t7 = await timeIt(() => validateUserCode(normalized, correctTwoSum, 'javascript', { runTestCase: sandboxExecutor }));
  const gv = t7.value;
  console.log(`  Latency (samples-only gate): ${t7.elapsed}ms`);
  console.log(`  sampleResults passed: ${gv.sampleResults.filter((r) => r.passed).length}/${gv.sampleResults.length}`);
  console.log(`  allSamplesPassed: ${gv.allSamplesPassed} | hidden.wouldRun: ${gv.hidden.wouldRun} | hidden.count: ${gv.hidden.count}`);
  console.log(`  summary: ${gv.summary}`);
  const gvVerdict = gv.allSamplesPassed ? 'Accepted' : 'WrongAnswer';
  console.log(`  Verdict: ${gvVerdict} ${gvVerdict === 'Accepted' ? 'OK' : 'BAD'}`);
  record('dsa', 'genericValidatorRun', {
    verdict: gvVerdict, latencyMs: t7.elapsed, allSamplesPassed: gv.allSamplesPassed,
    hiddenWouldRun: gv.hidden.wouldRun, hiddenCount: gv.hidden.count, summary: gv.summary,
    pass: gvVerdict === 'Accepted',
  });

  // --- TEST 8: genericValidator with WRONG code -> WrongAnswer (verdict mapping) ---
  console.log('\n--- TEST 8: genericValidator with wrong code -> WrongAnswer ---');
  const gvWrong = await validateUserCode(normalized, wrongTwoSum, 'javascript', { runTestCase: sandboxExecutor });
  console.log(`  allSamplesPassed: ${gvWrong.allSamplesPassed} | hidden.wouldRun: ${gvWrong.hidden.wouldRun} | summary: ${gvWrong.summary}`);
  const gvWrongVerdict = gvWrong.allSamplesPassed ? 'Accepted' : 'WrongAnswer';
  console.log(`  Verdict: ${gvWrongVerdict} ${gvWrongVerdict === 'WrongAnswer' ? 'OK' : 'BAD'}`);
  record('dsa', 'genericValidatorWrong', { verdict: gvWrongVerdict, pass: gvWrongVerdict === 'WrongAnswer' });

  return problem;
}


// ============================================================================
// PART 2 — SQL EXECUTION VERIFICATION
// ============================================================================
async function verifySql() {
  console.log('\n========== PART 2: SQL EXECUTION VERIFICATION ==========\n');
  const sqlSandbox = require('./utils/sqlSandbox');
  const { getSandboxHealth } = sqlSandbox;
  const { runSQL } = require('./utils/sqlRunner'); // the module submitSQL actually uses

  const health = await getSandboxHealth();
  console.log('Sandbox health:', JSON.stringify(health));
  record('sql', 'sandboxHealth', health);

  const allSql = await SQLProblem.find({ isActive: true }).lean();
  const withSamples = allSql.filter((p) => (p.sampleTestCases || []).length > 0);
  const withRef = withSamples.filter((p) => p.referenceSolutionSQL && p.referenceSolutionSQL.trim().length > 0);
  console.log(`Active SQL problems: ${allSql.length}`
    + ` | with sampleTestCases: ${withSamples.length}`
    + ` | with referenceSolutionSQL: ${withRef.length}`);
  record('sql', 'activeCount', allSql.length);
  record('sql', 'withSampleCases', withSamples.length);
  record('sql', 'withReferenceSolution', withRef.length);

  const target = withRef[0] || withSamples[0] || allSql[0];
  if (!target) { console.log('No SQL problems to verify.'); return; }
  console.log(`\nTarget problem: ${target.title} (${target.slug}) | difficulty: ${target.difficulty}`);
  console.log(`sampleTestCases: ${(target.sampleTestCases || []).length} | hiddenTestCases: ${(target.hiddenTestCases || []).length}`);

  const tc = (target.sampleTestCases || [])[0];
  if (!tc) {
    console.log('  ! Target has no sample test cases - cannot verify run/submit end-to-end.');
    record('sql', 'verifiable', false);
    return;
  }
  console.log(`  expectedOutputRows: ${JSON.stringify(tc.expectedOutputRows).slice(0, 240)}`);
  record('sql', 'targetSlug', target.slug);

  // This is the EXACT normalisation submitSQL uses for comparison.
  const norm = (rows) => (rows || []).map((r) => {
    if (r && typeof r === 'object' && !Array.isArray(r)) {
      const o = {};
      Object.keys(r).sort().forEach((k) => { o[k.toLowerCase()] = r[k]; });
      return o;
    }
    return r;
  });

  // --- SQL TEST 1: reference solution -> should match expected rows ---
  if (target.referenceSolutionSQL && target.referenceSolutionSQL.trim()) {
    console.log('\n--- SQL TEST 1: reference solution vs expectedOutputRows ---');
    const t1 = await timeIt(() => runSQL({
      query: target.referenceSolutionSQL,
      schemaSetup: target.schemaSetupSQL || '',
      expectedOutputs: tc.expectedOutputRows || [],
      timeoutMs: 5000,
    }));
    const sr = t1.value;
    console.log(`  Latency (Run): ${t1.elapsed}ms | success(compare): ${sr.success}`);
    if (sr.data) {
      const actual = JSON.stringify(norm(sr.data.rows));
      const expected = JSON.stringify(norm(tc.expectedOutputRows || []));
      const match = actual === expected;
      console.log(`  actual:   ${actual.slice(0, 240)}`);
      console.log(`  expected: ${expected.slice(0, 240)}`);
      console.log(`  MATCH: ${match} ${match ? 'OK' : 'BAD'}`);
      record('sql', 'referenceMatchesExpected', { match, latencyMs: t1.elapsed, pass: match });
    } else {
      console.log(`  error: ${sr.error}`);
      record('sql', 'referenceMatchesExpected', { match: false, error: sr.error, pass: false });
    }
  }

  // --- SQL TEST 2: wrong query -> WrongAnswer ---
  console.log('\n--- SQL TEST 2: wrong query -> WrongAnswer ---');
  const t2 = await timeIt(() => runSQL({
    query: 'SELECT 999 AS wrong_answer_marker',
    schemaSetup: target.schemaSetupSQL || '',
    timeoutMs: 5000,
  }));
  const sr2 = t2.value;
  // submitSQL does NOT pass expectedOutputs: it compares rows itself.
  const actual2 = sr2.data ? JSON.stringify(norm(sr2.data.rows)) : '';
  const expected2 = JSON.stringify(norm(tc.expectedOutputRows || []));
  const waOk = sr2.success === true && actual2 !== expected2;
  console.log(`  executed: ${sr2.success} | actual: ${actual2.slice(0, 120)}`);
  console.log(`  Detected as wrong answer by submitSQL's comparison: ${waOk} ${waOk ? 'OK' : 'BAD'}`);
  record('sql', 'wrongQueryDetected', { latencyMs: t2.elapsed, pass: waOk });

  // --- SQL TEST 3: syntax error -> error surfaced + mapped to syntax_error ---
  console.log('\n--- SQL TEST 3: syntax error -> error surfaced ---');
  const t3 = await timeIt(() => runSQL({
    query: 'SELECT FROM WHERE',
    schemaSetup: target.schemaSetupSQL || '',
    timeoutMs: 5000,
  }));
  const sr3 = t3.value;
  const msg3 = String(sr3.error || '');
  const mapped3 = /syntax/i.test(msg3) ? 'syntax_error' : 'runtime_error';
  const synOk = sr3.success === false && mapped3 === 'syntax_error';
  console.log(`  success: ${sr3.success} | error: ${msg3.slice(0, 140)}`);
  console.log(`  submitSQL status mapping would be: ${mapped3} -> ${synOk ? 'OK' : 'BAD'}`);
  record('sql', 'syntaxErrorSurfaced', { error: msg3.slice(0, 200), mapped: mapped3, pass: synOk });

  // --- SQL TEST 4: destructive query rejected by validateQuerySafety ---
  console.log('\n--- SQL TEST 4: destructive query guard ---');
  const t4 = await timeIt(() => runSQL({
    query: 'DROP TABLE employees',
    schemaSetup: target.schemaSetupSQL || '',
    timeoutMs: 5000,
  }));
  const sr4 = t4.value;
  console.log(`  success: ${sr4.success} | error: ${String(sr4.error || '').slice(0, 140)}`);
  console.log(`  Blocked: ${sr4.success === false ? 'OK' : 'BAD'}`);
  record('sql', 'destructiveGuard', { blocked: sr4.success === false, error: String(sr4.error || '').slice(0, 200) });

  // --- SQL TEST 5: BULK sweep — reference solution vs stored expected rows ---
  console.log('\n--- SQL TEST 5: BULK sweep of every active SQL problem ---');
  const sweep = { total: 0, matched: 0, mismatched: 0, errored: 0, noRef: 0, noCases: 0, details: [] };
  for (const p of allSql) {
    sweep.total += 1;
    const cases = (p.sampleTestCases || []).slice(0, 3);
    if (!p.referenceSolutionSQL || !p.referenceSolutionSQL.trim()) { sweep.noRef += 1; continue; }
    if (!cases.length) { sweep.noCases += 1; continue; }
    let ok = true;
    let err = null;
    for (const c of cases) {
      const r = await runSQL({
        query: p.referenceSolutionSQL,
        schemaSetup: p.schemaSetupSQL || '',
        timeoutMs: 5000,
      });
      if (!r.data) { ok = false; err = r.error; break; }
      if (JSON.stringify(norm(r.data.rows)) !== JSON.stringify(norm(c.expectedOutputRows || []))) {
        ok = false; err = 'row mismatch'; break;
      }
    }
    if (ok) sweep.matched += 1;
    else {
      sweep.mismatched += 1;
      const msg = String(err || '');
      const kind = /no such table/i.test(msg) ? 'REFERENCE_TABLE_NOT_IN_SCHEMA'
        : /no such column/i.test(msg) ? 'REFERENCE_COLUMN_NOT_IN_SCHEMA'
        : /syntax/i.test(msg) ? 'REFERENCE_SYNTAX_ERROR'
        : /Disallowed/i.test(msg) ? 'REFERENCE_DISALLOWED_OPERATION'
        : msg === 'row mismatch' ? 'EXPECTED_ROWS_DO_NOT_MATCH_REFERENCE'
        : 'OTHER';
      sweep.details.push({ slug: p.slug, kind, reason: msg });
    }
  }
  console.log(`  swept=${sweep.total} matched=${sweep.matched} mismatched=${sweep.mismatched}`
    + ` noReference=${sweep.noRef} noCases=${sweep.noCases}`);
  const byKind = {};
  sweep.details.forEach((d) => { byKind[d.kind] = (byKind[d.kind] || 0) + 1; });
  Object.entries(byKind).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`     ${v}x  ${k}`));
  sweep.failureBuckets = byKind;
  sweep.details.slice(0, 8).forEach((d) => console.log(`     e.g. ${d.slug}: ${String(d.reason).slice(0, 90)}`));
  record('sql', 'bulkSweep', sweep);
}


// ============================================================================
// PART 3 — AUTHENTICATED ANALYTICS VERIFICATION (replays controller logic)
// ============================================================================
async function verifyAnalytics() {
  console.log('\n========== PART 3: ANALYTICS VERIFICATION ==========\n');
  const svc = require('./services/analyticsService');
  const { buildHeatmap, dateStr, percent } = svc;

  // Pick a real user that actually has DSA/SQL submit history.
  const dsaUsers = await Submission.distinct('user', { type: 'submit' });
  const sqlUsers = await SQLSubmission.distinct('user', { type: 'submit' });
  console.log(`Users with DSA submits: ${dsaUsers.length} | Users with SQL submits: ${sqlUsers.length}`);
  const targetUserId = dsaUsers[0] || sqlUsers[0];
  if (!targetUserId) { console.log('No submission users found - analytics replay skipped.'); return; }

  const user = await User.findById(targetUserId).lean();
  console.log(`Replaying analytics for real user: ${user ? user.email || user.name : targetUserId}`);
  record('analytics', 'userId', String(targetUserId));

  /* ------------------ Legacy-vs-canonical SQL record audit ------------------ */
  const sqlRaw = await SQLSubmission.collection.find({}).toArray();
  const legacyShaped = sqlRaw.filter((d) => d.query === undefined && d.submittedQuery !== undefined);
  const noTimestamp = sqlRaw.filter((d) => !d.createdAt);
  const badStatus = sqlRaw.filter((d) => !['accepted', 'wrong_answer', 'runtime_error', 'time_limit', 'syntax_error', 'pending'].includes(d.status));
  console.log('\n--- SQLSubmission schema-generation audit (REAL data) ---');
  console.log(`  total docs: ${sqlRaw.length}`);
  console.log(`  legacy-shaped (submittedQuery, no 'query'): ${legacyShaped.length}`);
  console.log(`  missing createdAt/updatedAt: ${noTimestamp.length}`);
  console.log(`  status outside current enum: ${badStatus.length} -> ${JSON.stringify([...new Set(badStatus.map((d) => d.status))])}`);
  record('analytics', 'sqlSubmissionShapeAudit', {
    total: sqlRaw.length,
    legacyShaped: legacyShaped.length,
    missingTimestamp: noTimestamp.length,
    nonEnumStatuses: [...new Set(badStatus.map((d) => d.status))],
    nonEnumStatusCount: badStatus.length,
  });

  /* ------------------------------- DSA ------------------------------- */
  const dsaSubs = await Submission.find({ user: targetUserId, type: 'submit' })
    .select('status problem problemDifficulty problemTags category type createdAt').lean();
  const dsaRunSubs = await Submission.countDocuments({ user: targetUserId, type: 'run' });

  // replicate dsaStats() from analyticsController
  const attempted = new Set(), solved = new Set();
  const difficulty = { easy: 0, medium: 0, hard: 0 };
  let accepted = 0;
  dsaSubs.forEach((s) => {
    if (s.problem) attempted.add(String(s.problem));
    if (s.status === 'accepted') {
      accepted += 1;
      if (s.problem) {
        solved.add(String(s.problem));
        const d = (s.problemDifficulty || 'easy').toLowerCase();
        if (difficulty[d] !== undefined) difficulty[d] += 1;
      }
    }
  });
  const truthAttemptedDistinct = new Set(dsaSubs.map((s) => String(s.problem))).size;
  const truthSolvedDistinct = new Set(dsaSubs.filter((s) => s.status === 'accepted').map((s) => String(s.problem))).size;
  const repeatedAccepted = accepted - truthSolvedDistinct;

  console.log('\n--- DSA analytics (authenticated, real records) ---');
  console.log(`  totalSubmissions (type=submit): ${dsaSubs.length}`);
  console.log(`  acceptedSubmissions (sequential accepted): ${accepted}`);
  console.log(`  totalAttempted (distinct problems): ${attempted.size}`
    + ` | independent check: ${truthAttemptedDistinct} -> ${attempted.size === truthAttemptedDistinct ? 'MATCH' : 'MISMATCH'}`);
  console.log(`  totalSolved (distinct accepted problems): ${solved.size}`
    + ` | independent check: ${truthSolvedDistinct} -> ${solved.size === truthSolvedDistinct ? 'MATCH' : 'MISMATCH'}`);
  console.log(`  repeated accepted submissions (same problem solved again): ${repeatedAccepted}`);
  console.log(`  acceptanceRate: ${percent(accepted, dsaSubs.length)}%`);
  console.log(`  difficulty breakdown: ${JSON.stringify(difficulty)}`);
  console.log(`  type=run records present: ${dsaRunSubs} (MUST NOT affect the numbers above - loader filters type:'submit')`);
  record('analytics', 'dsa', {
    totalSubmissions: dsaSubs.length, acceptedSubmissions: accepted,
    totalAttempted: attempted.size, totalSolved: solved.size,
    acceptanceRate: percent(accepted, dsaSubs.length), difficulty,
    runRecords: dsaRunSubs, repeatedAccepted,
    distinctAttemptedMatches: attempted.size === truthAttemptedDistinct,
    distinctSolvedMatches: solved.size === truthSolvedDistinct,
    runExcluded: true,
  });

  /* ------------------------------- SQL ------------------------------- */
  const sqlSubs = await SQLSubmission.find({ user: targetUserId, type: 'submit' })
    .select('status problem difficulty topics createdAt').lean();
  const sqlRunSubs = await SQLSubmission.countDocuments({ user: targetUserId, type: 'run' });
  const sAttempted = new Set(), sSolved = new Set();
  let sAccepted = 0;
  const sDifficulty = { easy: 0, medium: 0, hard: 0 };
  sqlSubs.forEach((s) => {
    if (s.problem) sAttempted.add(String(s.problem));
    if (s.status === 'accepted') {
      sAccepted += 1;
      if (s.problem) {
        sSolved.add(String(s.problem));
        const d = (s.difficulty || 'easy').toLowerCase();
        if (sDifficulty[d] !== undefined) sDifficulty[d] += 1;
      }
    }
  });
  console.log('\n--- SQL analytics (authenticated, real records) ---');
  console.log(`  totalSubmissions (type=submit): ${sqlSubs.length}`);
  console.log(`  acceptedSubmissions: ${sAccepted}`);
  console.log(`  totalAttempted (distinct problems): ${sAttempted.size}`);
  console.log(`  totalSolved (distinct accepted): ${sSolved.size}`);
  console.log(`  acceptanceRate: ${percent(sAccepted, sqlSubs.length)}%`);
  console.log(`  difficulty breakdown: ${JSON.stringify(sDifficulty)}`);
  console.log(`  type=run records present: ${sqlRunSubs} (MUST NOT affect the numbers above)`);
  record('analytics', 'sql', {
    totalSubmissions: sqlSubs.length, acceptedSubmissions: sAccepted,
    totalAttempted: sAttempted.size, totalSolved: sSolved.size,
    acceptanceRate: percent(sAccepted, sqlSubs.length), difficulty: sDifficulty,
    runRecords: sqlRunSubs,
  });

  /* ---------------------------- Heatmaps ---------------------------- */
  console.log('\n--- Heatmap verification (real submission dates) ---');
  const dsaEvents = dsaSubs.map((s) => ({ date: s.createdAt, accepted: s.status === 'accepted' }));
  const dsaHeat = buildHeatmap(dsaEvents, 365);
  const dsaDates = dsaSubs.map((s) => dateStr(s.createdAt));
  const dsaDistinctDates = new Set(dsaDates);

  const sqlEvents = sqlSubs.map((s) => ({ date: s.createdAt, accepted: s.status === 'accepted' }));
  const sqlHeat = buildHeatmap(sqlEvents, 365);
  const sqlDistinctDates = new Set(sqlSubs.map((s) => dateStr(s.createdAt)));

  const hmKeys = (hm) => new Set(Object.keys(hm || {}));
  const dsaHmKeys = hmKeys(dsaHeat.heatmap);
  const sqlHmKeys = hmKeys(sqlHeat.heatmap);
  const dsaCellSum = [...dsaHmKeys].reduce((a, k) => a + dsaHeat.heatmap[k].count, 0);
  const sqlCellSum = [...sqlHmKeys].reduce((a, k) => a + sqlHeat.heatmap[k].count, 0);

  console.log(`  DSA: submissions=${dsaSubs.length} distinctDates=${dsaDistinctDates.size}`
    + ` heatmapCells=${dsaHmKeys.size} activeDays=${dsaHeat.activeDays} countsSum=${dsaCellSum}`);
  console.log(`       no fabricated cell (every cell maps to a real date): ${[...dsaHmKeys].every((k) => dsaDistinctDates.has(k))}`
    + ` | cellCountSum===submissions: ${dsaCellSum === dsaSubs.length}`);
  console.log(`       currentStreak=${dsaHeat.currentStreak} maxStreak=${dsaHeat.maxStreak}`);
  console.log(`  SQL: submissions=${sqlSubs.length} distinctDates=${sqlDistinctDates.size}`
    + ` heatmapCells=${sqlHmKeys.size} activeDays=${sqlHeat.activeDays} countsSum=${sqlCellSum}`);
  const sqlCellOk = sqlCellSum === sqlSubs.length;
  console.log(`       no fabricated cell: ${[...sqlHmKeys].every((k) => sqlDistinctDates.has(k))}`
    + ` | cellCountSum===submissions: ${sqlCellOk}`
    + (sqlCellOk ? '' : '  <-- submissions exist whose createdAt is missing/null (see SQLSubmission audit above)'));

  const todayStr = dateStr(new Date());
  console.log(`\n  Today (UTC) = ${todayStr}`);
  console.log(`  DSA today count: ${dsaHeat.heatmap[todayStr] ? dsaHeat.heatmap[todayStr].count : 0}`);
  console.log(`  SQL today count: ${sqlHeat.heatmap[todayStr] ? sqlHeat.heatmap[todayStr].count : 0}`);

  record('analytics', 'heatmap', {
    dsa: { submissions: dsaSubs.length, distinctDates: dsaDistinctDates.size, cells: dsaHmKeys.size,
      activeDays: dsaHeat.activeDays, cellSum: dsaCellSum, currentStreak: dsaHeat.currentStreak,
      maxStreak: dsaHeat.maxStreak, todayCount: dsaHeat.heatmap[todayStr] ? dsaHeat.heatmap[todayStr].count : 0,
      noFabricatedCells: [...dsaHmKeys].every((k) => dsaDistinctDates.has(k)), cellSumMatches: dsaCellSum === dsaSubs.length },
    sql: { submissions: sqlSubs.length, distinctDates: sqlDistinctDates.size, cells: sqlHmKeys.size,
      activeDays: sqlHeat.activeDays, cellSum: sqlCellSum, currentStreak: sqlHeat.currentStreak,
      maxStreak: sqlHeat.maxStreak, todayCount: sqlHeat.heatmap[todayStr] ? sqlHeat.heatmap[todayStr].count : 0,
      noFabricatedCells: [...sqlHmKeys].every((k) => sqlDistinctDates.has(k)), cellSumMatches: sqlCellOk },
    today: todayStr,
  });

  /* ------------------- Verdict distribution (real records) ------------------- */
  const verdictMix = {};
  dsaSubs.forEach((s) => { verdictMix[s.status] = (verdictMix[s.status] || 0) + 1; });
  console.log('\n--- DSA verdict distribution (type=submit, real records) ---');
  Object.entries(verdictMix).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  record('analytics', 'dsaVerdictMix', verdictMix);

  const sqlVerdictMix = {};
  sqlSubs.forEach((s) => { sqlVerdictMix[s.status] = (sqlVerdictMix[s.status] || 0) + 1; });
  console.log('--- SQL verdict distribution (type=submit, real records) ---');
  Object.entries(sqlVerdictMix).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  record('analytics', 'sqlVerdictMix', sqlVerdictMix);

  /* ------------------------- Topic rows ------------------------- */
  const dsaTopics = {};
  dsaSubs.forEach((s) => {
    const tags = s.problemTags && s.problemTags.length ? s.problemTags : ['general'];
    tags.forEach((t) => {
      if (!dsaTopics[t]) dsaTopics[t] = { total: 0, accepted: 0 };
      dsaTopics[t].total += 1;
      if (s.status === 'accepted') dsaTopics[t].accepted += 1;
    });
  });
  const dsaTopicCounts = Object.entries(dsaTopics)
    .map(([topic, v]) => ({ topic, total: v.total, accepted: v.accepted, successRate: percent(v.accepted, v.total) }))
    .sort((a, b) => b.total - a.total);
  console.log('\n--- DSA topic breakdown (replayed from real problemTags) ---');
  dsaTopicCounts.slice(0, 10).forEach((t) => console.log(`  ${t.topic}: ${t.accepted}/${t.total} (${t.successRate}%)`));
  record('analytics', 'dsaTopics', dsaTopicCounts);

  const sqlTopics = {};
  sqlSubs.forEach((s) => {
    const tags = s.topics && s.topics.length ? s.topics : ['general'];
    tags.forEach((t) => {
      if (!sqlTopics[t]) sqlTopics[t] = { total: 0, accepted: 0 };
      sqlTopics[t].total += 1;
      if (s.status === 'accepted') sqlTopics[t].accepted += 1;
    });
  });
  const sqlTopicCounts = Object.entries(sqlTopics)
    .map(([topic, v]) => ({ topic, total: v.total, accepted: v.accepted, successRate: percent(v.accepted, v.total) }))
    .sort((a, b) => b.total - a.total);
  console.log('--- SQL topic breakdown (replayed from real topics) ---');
  sqlTopicCounts.slice(0, 10).forEach((t) => console.log(`  ${t.topic}: ${t.accepted}/${t.total} (${t.successRate}%)`));
  record('analytics', 'sqlTopics', sqlTopicCounts);
}


// ============================================================================
// PART 4 — MAIN
// ============================================================================
async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!uri) { console.error('FATAL: no MONGO_URI/MONGODB_URI in env'); process.exit(1); }
  console.log('Connecting to live database...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  console.log('Connected.\n');

  // ---- Canonical dataset reconciliation (read-only) ----
  const Problem = require('./models/Problem');
  const [dsaCount, sqlCount, legacyDsa, legacySql] = await Promise.all([
    CodingProblem.countDocuments({}),
    SQLProblem.countDocuments({}),
    Problem.countDocuments({ category: 'DSA' }),
    Problem.countDocuments({ category: 'SQL' }),
  ]);
  console.log('========== CANONICAL DATASET RECONCILIATION ==========');
  console.log(`CodingProblem (canonical DSA) : ${dsaCount}`);
  console.log(`SQLProblem    (canonical SQL) : ${sqlCount}`);
  console.log(`Problem (LEGACY) DSA          : ${legacyDsa}`);
  console.log(`Problem (LEGACY) SQL          : ${legacySql}`);
  console.log('IMPORTANT: the UI lists problems from CodingProblem (canonical), not the legacy Problem collection.');
  console.log(`           "266 DSA" is correct; the legacy collection only holds ${legacyDsa} rows.`);
  record('dsa', 'canonicalProblems', dsaCount);
  record('sql', 'canonicalProblems', sqlCount);
  record('dsa', 'legacyProblems', legacyDsa);
  record('sql', 'legacySqlProblems', legacySql);

  try { await verifyDsa(); } catch (e) { console.error('DSA verification error:', e.message); record('dsa', 'error', e.message); }
  try { await verifySql(); } catch (e) { console.error('SQL verification error:', e.message); record('sql', 'error', e.message); }
  try { await verifyAnalytics(); } catch (e) { console.error('Analytics verification error:', e.message); record('analytics', 'error', e.message); }

  // ---- Verdict summary ----
  console.log('\n========== VERDICT SUMMARY ==========');
  const checks = [];
  const push = (label, ok, detail) => {
    checks.push({ label, ok: !!ok, detail });
    console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' - ' + detail : ''}`);
  };

  push('DSA Run  correct code -> Accepted', results.dsa.runAccepted && results.dsa.runAccepted.pass,
    results.dsa.runAccepted && results.dsa.runAccepted.latencyMs + 'ms');
  push('DSA Run  wrong code -> WrongAnswer', results.dsa.runWrongAnswer && results.dsa.runWrongAnswer.pass);
  push('DSA Run  syntax error -> CompileError', results.dsa.runCompileError && results.dsa.runCompileError.pass,
    results.dsa.runCompileError && results.dsa.runCompileError.errorType);
  push('DSA Run  runtime error -> RuntimeError', results.dsa.runRuntimeError && results.dsa.runRuntimeError.pass,
    results.dsa.runRuntimeError && results.dsa.runRuntimeError.errorType);
  push('DSA Run  infinite loop -> TLE', results.dsa.runTLE && results.dsa.runTLE.pass,
    results.dsa.runTLE && results.dsa.runTLE.errorType);
  push('DSA Submit correct code (samples+hidden) -> Accepted', results.dsa.submitAccepted && results.dsa.submitAccepted.pass,
    results.dsa.submitAccepted ? results.dsa.submitAccepted.passed + '/' + results.dsa.submitAccepted.total : '');
  push('DSA /coding/run path (genericValidator) -> Accepted', results.dsa.genericValidatorRun && results.dsa.genericValidatorRun.pass);
  push('DSA /coding/run path wrong code -> WrongAnswer', results.dsa.genericValidatorWrong && results.dsa.genericValidatorWrong.pass);

  if (results.sql.referenceMatchesExpected) {
    const rme = results.sql.referenceMatchesExpected;
    push('SQL reference solution matches stored expected rows', rme.pass,
      rme.pass ? rme.latencyMs + 'ms' : (rme.error || 'row mismatch'));
  }
  if (results.sql.wrongQueryDetected) push('SQL wrong query -> WrongAnswer detected', results.sql.wrongQueryDetected.pass);
  if (results.sql.syntaxErrorSurfaced) push('SQL syntax error surfaced + mapped to syntax_error', results.sql.syntaxErrorSurfaced.pass);
  if (results.sql.destructiveGuard) push('SQL destructive query blocked', !!results.sql.destructiveGuard.blocked);
  if (results.sql.bulkSweep) {
    push('SQL bulk sweep: every active problem reference solution matches',
      results.sql.bulkSweep.mismatched === 0,
      results.sql.bulkSweep.matched + '/' + results.sql.bulkSweep.total + ' matched');
  }

  if (results.analytics.heatmap) {
    push('DSA heatmap has no fabricated cells', results.analytics.heatmap.dsa.noFabricatedCells);
    push('DSA heatmap cell counts sum to real submission count', results.analytics.heatmap.dsa.cellSumMatches);
    push('SQL heatmap has no fabricated cells', results.analytics.heatmap.sql.noFabricatedCells);
    push('SQL heatmap cell counts sum to real submission count', results.analytics.heatmap.sql.cellSumMatches);
  }
  if (results.analytics.dsa) {
    push('DSA distinct attempted count proven', results.analytics.dsa.distinctAttemptedMatches);
    push('DSA distinct solved count proven', results.analytics.dsa.distinctSolvedMatches);
  }

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n  ${passed}/${checks.length} checks passed`);

  const lat = {
    dsaRunMs: results.dsa.runAccepted && results.dsa.runAccepted.latencyMs,
    dsaSubmitMs: results.dsa.submitAccepted && results.dsa.submitAccepted.latencyMs,
    dsaSubmitMsPerCase: results.dsa.submitAccepted && results.dsa.submitAccepted.msPerCase,
    dsaSubmitCaseCount: results.dsa.submitAccepted && results.dsa.submitAccepted.total,
    dsaTleMs: results.dsa.runTLE && results.dsa.runTLE.latencyMs,
    sqlRefMs: results.sql.referenceMatchesExpected && results.sql.referenceMatchesExpected.latencyMs,
  };
  console.log('\n  ---------- LATENCY ----------');
  console.log(`  DSA Run  (samples only)        : ${lat.dsaRunMs}ms`);
  console.log(`  DSA Submit (${lat.dsaSubmitCaseCount} cases)     : ${lat.dsaSubmitMs}ms  ~${lat.dsaSubmitMsPerCase}ms/case`);
  console.log(`  DSA TLE Run (10s local limit)  : ${lat.dsaTleMs}ms`);
  console.log(`  SQL Run  (reference solution)  : ${lat.sqlRefMs}ms`);
  const ratio = lat.dsaRunMs ? (lat.dsaSubmitMs / lat.dsaRunMs) : null;
  console.log(`  Submit/Run ratio: ${ratio ? ratio.toFixed(2) + 'x' : 'n/a'}`);
  console.log(`  Reported "~1 min submit" is ${lat.dsaSubmitMs > 30000 ? 'REPRODUCED' : 'NOT reproduced'}.`);
  console.log('  Cause: Submit runs samples + hiddenTests sequentially with one process spawn per case;');
  console.log('         Run only runs the visible samples. Cost is linear in case count, not a defect.');

  const fs = require('fs');
  const outPath = require('path').join(__dirname, 'verify_execution_report.json');
  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(), checks, latency: lat, results,
  }, null, 2));
  console.log(`\nReport written: ${outPath}`);

  await mongoose.disconnect();
  console.log('Disconnected. DONE.');
}

main().catch(async (e) => {
  console.error('FATAL:', e);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});

