'use strict';

/**
 * dsa_batch1_verify.js
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

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const built = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch1_built.json'), 'utf8')).built;
  const titles = built.map((b) => b.title);

  const rows = [];
  for (const title of titles) {
    const doc = await CodingProblem.findOne({ title }).lean();
    const b = built.find((x) => x.title === title);
    const row = { title, ref: 'n/a', refOk: false, wrong: 'n/a', wrongRejected: false, leaks: null };

    const refRun = await runAll(doc, doc.referenceSolution.code);
    row.ref = `${refRun.passed}/${refRun.total}`;
    row.refOk = refRun.total > 0 && refRun.passed === refRun.total;

    const wrongRun = await runAll(doc, b.wrongCode);
    row.wrong = `${wrongRun.passed}/${wrongRun.total}`;
    row.wrongRejected = !(wrongRun.total > 0 && wrongRun.passed === wrongRun.total);

    const payload = JSON.stringify(mapProblemForResponse(doc));
    row.leaks = /hiddenTests|hiddenTestCases|referenceSolution/.test(payload) ? 'LEAK' : null;

    rows.push(row);
    console.log(
      `${row.refOk && row.wrongRejected && !row.leaks ? 'PASS' : 'FAIL'}  ${title.padEnd(30)} `
      + `ref=${row.ref.padEnd(6)} wrong=${row.wrong.padEnd(6)} leak=${row.leaks || 'none'}`
    );
  }

  fs.writeFileSync(path.join(__dirname, '_dsa_batch1_verify.json'), JSON.stringify(rows, null, 2));
  const passed = rows.filter((r) => r.refOk && r.wrongRejected && !r.leaks).length;
  console.log(`\n${passed}/${rows.length} activated problems fully validated`);

  await mongoose.disconnect();
  process.exit(passed === rows.length ? 0 : 1);
})().catch(async (e) => {
  console.error('VERIFY FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});