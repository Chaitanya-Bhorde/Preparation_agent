/**
 * solvabilityScan.js — READ-ONLY health check of the DSA bank.
 *
 * For every problem that ships a stored `referenceSolution`, run that solution
 * through the REAL submission engine and report how many of its own test cases
 * it passes. A problem whose reference solution cannot clear its own suite can
 * never be solved by anyone, so its card can never turn green.
 *
 * Writes nothing.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const genericValidator = require('../utils/genericValidator');
const judge0 = require('../utils/judge0Coding');

const SANDBOX = genericValidator.createSandboxExecutor({
  buildDriverFromSignature: (c, l, s) => judge0.buildDriverFromSignature(c, l, s),
  executeSingleCase: (f, l, i, e, r) => judge0.executeSingleCase(f, l, i, e, r),
  executeBatch: (f, l, cs, rt) => judge0.executeTestCases(f, l, cs, rt),
});

const LIMIT = parseInt(process.env.LIMIT || '40', 10);

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 12000 });
  const db = mongoose.connection.db;

  const docs = await db.collection('codingproblems')
    .find({ 'referenceSolution.code': { $exists: true, $ne: '' }, 'sampleTests.0': { $exists: true } })
    .limit(LIMIT)
    .toArray();

  console.log(`Scanning ${docs.length} problems that ship a reference solution and samples...\n`);

  let fullySolvable = 0;
  const broken = [];

  for (const doc of docs) {
    const normalized = genericValidator.normalizeProblem(doc);
    const t0 = Date.now();
    let run;
    try {
      run = await genericValidator.validateUserCode(normalized, doc.referenceSolution.code, 'javascript', {
        runTestCase: SANDBOX,
        onlySample: false,
        testCases: normalized.testCases,
      });
    } catch (e) {
      broken.push({ title: doc.title, problemId: doc.problemId, error: e.message.slice(0, 80) });
      console.log(`  ERROR  ${String(doc.problemId).padEnd(16)} ${String(doc.title).slice(0, 32).padEnd(34)} ${e.message.slice(0, 60)}`);
      continue;
    }
    const ok = run.passed === run.total;
    if (ok) fullySolvable++;
    else broken.push({ title: doc.title, problemId: doc.problemId, passed: run.passed, total: run.total });
    console.log(`  ${ok ? 'OK   ' : 'BROKEN'} ${String(doc.problemId).padEnd(16)} ${String(doc.title).slice(0, 32).padEnd(34)} ${run.passed}/${run.total}  (${Date.now() - t0}ms)`);
  }

  console.log(`\nSolvable by their own reference solution: ${fullySolvable}/${docs.length}`);
  if (broken.length) {
    console.log('\nProblems a user can NEVER solve (reference solution fails its own tests):');
    broken.forEach((b) => console.log(`  ${String(b.problemId).padEnd(16)} ${String(b.title).slice(0, 36).padEnd(38)} ${b.passed != null ? b.passed + '/' + b.total : b.error}`));
  }

  const doc = await db.collection('codingproblems').findOne({ slug: '3sum' });
  const normalized = genericValidator.normalizeProblem(doc);
  const run = await genericValidator.validateUserCode(
    normalized,
    `function threeSum(nums) {
  const n = nums.slice().sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < n.length - 2; i++) {
    if (i > 0 && n[i] === n[i - 1]) continue;
    let l = i + 1, r = n.length - 1;
    while (l < r) {
      const s = n[i] + n[l] + n[r];
      if (s === 0) {
        out.push([n[i], n[l], n[r]]);
        l++; r--;
        while (l < r && n[l] === n[l - 1]) l++;
        while (l < r && n[r] === n[r + 1]) r--;
      }
      else if (s < 0) l++; else r--;
    }
  }
  return out;
}`,
    'javascript',
    { runTestCase: SANDBOX, onlySample: false, testCases: normalized.testCases }
  );
  fs.writeFileSync('threesum.json', JSON.stringify(
    run.results.map((r, i) => ({ i, passed: r.passed, actual: r.actual, expected: r.expected, input: r.input }))
      .filter((r) => !r.passed), null, 1));
  console.log(`3Sum: ${run.passed}/${run.total}; failing cases written to threesum.json`);
  await mongoose.disconnect();
  process.exit(0);
}
main().catch((e) => { console.error('SCAN ERROR:', e.stack); process.exit(1); });
