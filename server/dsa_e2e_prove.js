/**
 * dsa_e2e_prove.js
 * ---------------------------------------------------------------------------
 * Proves the DSA catalogue is genuinely usable by driving the SAME code the
 * HTTP routes use: normalizeProblem -> validateUserCode -> localExecutor.
 *
 * For every active problem with a stored reference solution it runs
 *   - the reference (must be Accepted on every case: samples AND hidden)
 *   - a deliberately wrong solution (must be rejected -> WrongAnswer)
 * which together demonstrate Submit both accepts correct work and rejects
 * incorrect work. Read-only with respect to the database.
 * ---------------------------------------------------------------------------
 */
'use strict';
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');
const G = require('./utils/genericValidator');
const { buildDriverFromSignature, executeSingleCase, executeTestCases } = require('./utils/judge0Coding');

const CONCURRENCY = 4;

const sandbox = G.createSandboxExecutor({
  buildDriverFromSignature: (c, l, s) => buildDriverFromSignature(c, l, s),
  executeSingleCase: (fc, l, i, e, rt) => executeSingleCase(fc, l, i, e, rt),
  executeBatch: (fc, l, cases, rt) => executeTestCases(fc, l, cases, rt),
});

/** A solution that is syntactically valid and returns a deliberately wrong value. */
function wrongSolution(sig) {
  const p = (sig.params || []).map((x) => x.name).join(', ');
  const rt = sig.returnType || '';
  if (/boolean|bool/i.test(rt)) return `function ${sig.name}(${p}) { return !arguments.length; }`;
  if (/\[\]/.test(rt)) return `function ${sig.name}(${p}) { return ${JSON.stringify(rt.includes('[]') && rt.includes('[[') ? [[]] : [])}; }`;
  if (/string/i.test(rt)) return `function ${sig.name}(${p}) { return 'definitely-wrong-output'; }`;
  return `function ${sig.name}(${p}) { return -987654321; }`;
}

async function verify(doc) {
  const normalized = G.normalizeProblem(doc);
  const sig = (doc.functionSignature && doc.functionSignature.javascript) || null;
  const ref = doc.referenceSolution && doc.referenceSolution.code;
  const out = {
    slug: doc.slug, title: doc.title, topic: doc.topic,
    cases: normalized.testCases.length,
    refPassed: 0, refTotal: 0, refOk: false,
    wrongPassed: 0, wrongTotal: 0, wrongRejected: false,
    refError: null, wrongError: null,
  };
  if (!sig || !ref) return out;

  // `validateUserCode` runs the visible samples first and only runs the hidden
  // suite when they all pass, which is exactly the production Submit flow.
  const runAll = async (code) => {
    const samples = await G.validateUserCode(normalized, code, 'javascript', { runTestCase: sandbox });
    const sampleOk = samples.sampleResults.length > 0
      && samples.sampleResults.every((r) => r.passed);
    let hiddenResults = [];
    if (sampleOk) {
      const full = await G.validateUserCode(normalized, code, 'javascript', {
        runTestCase: sandbox,
        onlySample: false,
      });
      hiddenResults = full.sampleResults;
    }
    const all = samples.sampleResults.concat(hiddenResults);
    return {
      passed: all.filter((r) => r.passed).length,
      total: all.length,
      firstFailure: all.find((r) => !r.passed) || null,
    };
  };

  try {
    const r = await runAll(ref);
    out.refPassed = r.passed; out.refTotal = r.total;
    out.refOk = r.total > 0 && r.passed === r.total;
    if (!out.refOk && r.firstFailure) {
      out.refError = `failed: in=${String(r.firstFailure.input).slice(0, 60)} `
        + `exp=${String(r.firstFailure.actual != null ? r.firstFailure.expected : '').slice(0, 40)} `
        + `got=${String(r.firstFailure.actual).slice(0, 40)} `
        + `err=${r.firstFailure.error || r.firstFailure.errorType || ''}`;
    }
  } catch (e) {
    out.refError = 'threw: ' + e.message;
  }

  try {
    const w = await runAll(wrongSolution(sig));
    out.wrongPassed = w.passed; out.wrongTotal = w.total;
    out.wrongRejected = !(w.total > 0 && w.passed === w.total);
  } catch (_) {
    out.wrongRejected = true;
  }

  return out;
}
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const active = await CodingProblem.find({ isActive: true }).lean();
  const testable = active.filter((d) => d.referenceSolution && String(d.referenceSolution.code || '').trim());

  console.log(`active problems        : ${active.length}`);
  console.log(`with reference solution: ${testable.length}\n`);
  console.log('proving Run/Submit on every active problem with a reference...\n');

  const results = await pool(testable, verify, CONCURRENCY);

  const refFail = results.filter((r) => !r.refOk);
  const wrongFail = results.filter((r) => !r.wrongRejected);

  console.log('reference ACCEPTED on samples+hidden :', results.length - refFail.length, '/', results.length);
  console.log('wrong solution REJECTED (WA)         :', results.length - wrongFail.length, '/', results.length);

  if (refFail.length) {
    console.log('\n-- reference rejected --');
    refFail.forEach((r) => console.log(`  ${r.title} [${r.refPassed}/${r.refTotal}] :: ${r.refError || 'not all cases passed'}`));
  }
  if (wrongFail.length) {
    console.log('\n-- wrong solution wrongly accepted --');
    wrongFail.forEach((r) => console.log(`  ${r.title} [${r.wrongPassed}/${r.wrongTotal}]`));
  }

  fs.writeFileSync(path.join(__dirname, '_dsa_e2e_prove.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    activeCount: active.length,
    testable: testable.length,
    referenceAccepted: results.length - refFail.length,
    wrongRejected: results.length - wrongFail.length,
    results,
  }, null, 2));

  await mongoose.disconnect();
  console.log('\nwrote _dsa_e2e_prove.json');
})().catch(async (e) => {
  console.error('PROVE FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});

async function pool(items, worker, size) {
  const res = [];
  let i = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (i < items.length) { const k = i++; res[k] = await worker(items[k]); }
  }));
  return res;
}