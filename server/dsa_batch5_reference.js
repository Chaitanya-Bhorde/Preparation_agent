'use strict';

/**
 * dsa_batch5_reference.js  (READ-ONLY)
 * ---------------------------------------------------------------------------
 * Proves the batch-5 reference solutions actually STORED in Mongo are the ones
 * that were proven correct, rather than trusting that dsa_batch5_build.js wrote
 * them and stopped there.
 *
 * For every one of the 24 activated problems it compares the persisted
 * CodingProblem.referenceSolution.code against referenceCode in
 * _dsa_batch5_built.json, and re-runs the reference code against the persisted
 * hiddenTests to confirm every hidden case is satisfied. A stored reference
 * that had drifted, or that failed a hidden case, would show up here.
 *
 * Writes nothing. Safe to run while a runtime slice is in flight.
 *
 *   node dsa_batch5_reference.js
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');
const G = require('./utils/genericValidator');
const { buildDriverFromSignature, executeSingleCase, executeTestCases } = require('./utils/judge0Coding');

// The REAL judging path, identical to routes/coding.js: the driver is built from
// the problem's own functionSignature and executed by the local sandbox, not by
// an ad-hoc in-process call. Using anything else here would test a different
// judge than the one users hit.
const sandbox = G.createSandboxExecutor({
  buildDriverFromSignature: (c, l, s) => buildDriverFromSignature(c, l, s),
  executeSingleCase: (fc, l, i, e, rt) => executeSingleCase(fc, l, i, e, rt),
  executeBatch: (fc, l, cases, rt) => executeTestCases(fc, l, cases, rt),
});

const built = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_dsa_batch5_built.json'), 'utf8')
).built;

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let storedOk = 0;
  let hiddenOk = 0;
  const problems = [];

  for (const b of built) {
    // Load the WHOLE document. The judge needs `functionSignature` (to build the
// driver), `sampleTests` and `outputFormat`; selecting a subset silently
// produces a problem that no real request would ever see.
const p = await CodingProblem.findOne({ slug: b.slug }).lean();
    if (!p) { problems.push(`${b.slug}: MISSING from catalogue`); continue; }

    const stored = (p.referenceSolution && p.referenceSolution.code) || '';
    const matches = stored.trim() === String(b.referenceCode).trim();
    if (matches) storedOk++; else problems.push(`${b.slug}: stored reference drifts from built`);

    // Reuse the production judging path verbatim: normalizeProblem adapts the
    // stored doc, and validateUserCode runs the STORED reference against
    // samples + hidden cases with the same comparator the API uses. This is the
    // same two-line shape as routes/coding.js validateViaGenericValidator, so
    // this check cannot disagree with what /api/coding/submit actually does.
    const norm = G.normalizeProblem(p);
    let res;
    try {
      res = await G.validateUserCode(norm, stored, 'javascript', {
        runTestCase: sandbox,
        onlySample: false,
      });
    } catch (e) {
      problems.push(`${b.slug}: judging threw ${e.message}`);
      continue;
    }

    // `results` holds every judged case; `sampleResults` only the visible ones.
    const results = (res && res.results) || [];
    const hiddenResults = results.filter((r) => r.isHidden);
    if (!hiddenResults.length) { problems.push(`${b.slug}: no hidden cases were judged`); continue; }
    const passedAll = results.every((r) => r.passed);
    if (passedAll) hiddenOk++;
    else {
      const bad = results.find((r) => !r.passed);
      problems.push(`${b.slug}: stored reference FAILS its own cases (${bad.verdict || 'failed'}`
        + ` on ${JSON.stringify(String(bad.input || '').slice(0, 60))})`);
    }
  }

  console.log(`stored reference matches built reference : ${storedOk}/${built.length}`);
  console.log(`stored reference passes ALL hiddenTests   : ${hiddenOk}/${built.length}`);
  if (problems.length) {
    console.log('\nproblems:');
    problems.forEach((x) => console.log('  ' + x));
  } else {
    console.log('\nno drift, no failing hidden case.');
  }

  await mongoose.disconnect();
  process.exit(problems.length === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error('CHECK FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});