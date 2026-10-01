'use strict';

/**
 * dsa_batch3_verify.js
 * ---------------------------------------------------------------------------
 * Validates the batch through the REAL judging path (normalizeProblem ->
 * genericValidator -> localExecutor), for every newly activated problem:
 *
 *   1. the stored reference must be Accepted on samples AND hidden cases
 *   2. a deliberately wrong solution must be rejected (WrongAnswer)
 *   3. hidden cases must never appear in the public problem payload
 *
 * Read-only with respect to the database.
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');
const G = require('./utils/genericValidator');
const { buildDriverFromSignature, executeSingleCase, executeTestCases } = require('./utils/judge0Coding');
const { mapProblemForResponse } = require('./controllers/codingProblemController');

const sandbox = G.createSandboxExecutor({
  buildDriverFromSignature: (c, l, s) => buildDriverFromSignature(c, l, s),
  executeSingleCase: (fc, l, i, e, rt) => executeSingleCase(fc, l, i, e, rt),
  executeBatch: (fc, l, cases, rt) => executeTestCases(fc, l, cases, rt),
});

async function runAll(problem, code) {
  const normalized = G.normalizeProblem(problem);
  const samples = await G.validateUserCode(normalized, code, 'javascript', { runTestCase: sandbox });
  const sampleResults = samples.sampleResults;
  const all = sampleResults.slice();
  if (sampleResults.length > 0 && sampleResults.every((r) => r.passed)) {
    const full = await G.validateUserCode(normalized, code, 'javascript', {
      runTestCase: sandbox, onlySample: false,
    });
    all.push(...full.sampleResults);
  }
  return { passed: all.filter((r) => r.passed).length, total: all.length, results: all };
}

/**
 * Run ONLY the hidden cases. Used to prove that a correct solution passes the
 * private suite and that the deliberately wrong one fails it, which is what
 * Submit does. Returns how many hidden cases passed.
 */
async function runHiddenOnly(problem, code) {
  const normalized = G.normalizeProblem(problem);
  const hiddenTC = normalized.testCases.filter((tc) => tc.isHidden);
  if (hiddenTC.length === 0) return { passed: 0, total: 0 };
  const res = await G.validateUserCode(normalized, code, 'javascript', {
    runTestCase: sandbox, onlySample: false, testCases: hiddenTC,
  });
  const results = res.results || [];
  return { passed: results.filter((r) => r.passed).length, total: results.length };
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const built = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch3_built.json'), 'utf8')).built;
  const titles = built.map((b) => b.title);

  const rows = [];
  for (const title of titles) {
    const doc = await CodingProblem.findOne({ title }).lean();
    const b = built.find((x) => x.title === title);
    const row = {
      title,
      runRef: 'n/a', runRefOk: false, runWrong: 'n/a', runWrongRejected: false,
      submitRef: 'n/a', submitRefOk: false, submitWrong: 'n/a', submitWrongRejected: false,
      leaks: null,
    };

    // RUN path: visible cases only, then the full suite once the visible pass.
    const refRun = await runAll(doc, doc.referenceSolution.code);
    row.runRef = `${refRun.passed}/${refRun.total}`;
    row.runRefOk = refRun.total > 0 && refRun.passed === refRun.total;

    const wrongRun = await runAll(doc, b.wrongCode);
    row.runWrong = `${wrongRun.passed}/${wrongRun.total}`;
    row.runWrongRejected = !(wrongRun.total > 0 && wrongRun.passed === wrongRun.total);

    // SUBMIT path: the private hidden suite. The reference must survive it and
    // the deliberately wrong solution must fail it.
    const refHidden = await runHiddenOnly(doc, doc.referenceSolution.code);
    row.submitRef = `${refHidden.passed}/${refHidden.total}`;
    row.submitRefOk = refHidden.total > 0 && refHidden.passed === refHidden.total;

    const wrongHidden = await runHiddenOnly(doc, b.wrongCode);
    row.submitWrong = `${wrongHidden.passed}/${wrongHidden.total}`;
    row.submitWrongRejected = !(wrongHidden.total > 0 && wrongHidden.passed === wrongHidden.total);

    const payload = JSON.stringify(mapProblemForResponse(doc));
    row.leaks = /hiddenTests|hiddenTestCases|referenceSolution/.test(payload) ? 'LEAK' : null;

    rows.push(row);
    const ok = row.runRefOk && row.runWrongRejected && row.submitRefOk
      && row.submitWrongRejected && !row.leaks;
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${title.padEnd(30)} `
      + `runRef=${row.runRef.padEnd(6)} runWrong=${row.runWrong.padEnd(6)} `
      + `subRef=${row.submitRef.padEnd(6)} subWrong=${row.submitWrong.padEnd(6)} `
      + `leak=${row.leaks || 'none'}`
    );
  }

  fs.writeFileSync(path.join(__dirname, '_dsa_batch3_verify.json'), JSON.stringify(rows, null, 2));
  const passed = rows.filter((r) => r.runRefOk && r.runWrongRejected && r.submitRefOk
    && r.submitWrongRejected && !r.leaks).length;
  console.log(`\n${passed}/${rows.length} activated problems fully validated`);

  await mongoose.disconnect();
  process.exit(passed === rows.length ? 0 : 1);
})().catch(async (e) => {
  console.error('VERIFY FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
