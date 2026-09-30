/**
 * DSA execution latency benchmark (read-only against the DB).
 * Reproduces the production /api/coding/submit pipeline for a REAL problem and
 * measures where wall-clock time goes. Performs no writes.
 *
 *   node scripts/benchExecution.js            -> batch engine (current)
 *   node scripts/benchExecution.js --legacy   -> per-case engine (previous)
 *   node scripts/benchExecution.js --verify   -> print per-case verdicts so the
 *                                               two engines can be compared
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const genericValidator = require('../utils/genericValidator');
const judge0 = require('../utils/judge0Coding');

const LEGACY = process.argv.includes('--legacy');
const VERIFY = process.argv.includes('--verify');

function makeSandbox(withBatch) {
  return genericValidator.createSandboxExecutor({
    buildDriverFromSignature: (c, l, s) => judge0.buildDriverFromSignature(c, l, s),
    executeSingleCase: (f, l, i, e, r) => judge0.executeSingleCase(f, l, i, e, r),
    ...(withBatch ? { executeBatch: (f, l, cs, rt) => judge0.executeTestCases(f, l, cs, rt) } : {}),
  });
}

// Correct Two Sum implementations written against the platform's real generated
// Correct 3Sum implementations written against the platform's real generated
// drivers (judge0Coding.buildDriverFromSignature) for problem CP-0016-MEDIUM.
const SOLUTIONS = {
  javascript: `function threeSum(nums) {
  const n = nums.slice().sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < n.length - 2; i++) {
    if (i > 0 && n[i] === n[i - 1]) continue;
    let l = i + 1, r = n.length - 1;
    while (l < r) {
      const s = n[i] + n[l] + n[r];
      if (s === 0) { out.push([n[i], n[l], n[r]]); l++; r--; }
      else if (s < 0) l++; else r--;
    }
  }
  return out;
}`,
  java: `import java.util.*;
class Solution {
  public List<List<Integer>> threeSum(int[] nums) {
    int[] a = nums.clone();
    Arrays.sort(a);
    List<List<Integer>> out = new ArrayList<>();
    for (int i = 0; i < a.length - 2; i++) {
      if (i > 0 && a[i] == a[i - 1]) continue;
      int l = i + 1, r = a.length - 1;
      while (l < r) {
        int s = a[i] + a[l] + a[r];
        if (s == 0) {
          out.add(Arrays.asList(a[i], a[l], a[r]));
          l++; r--;
        } else if (s < 0) l++; else r--;
      }
    }
    return out;
  }
}`,
  cpp: `#include <vector>
#include <algorithm>
using namespace std;
vector<vector<int>> threeSum(vector<int> nums) {
  sort(nums.begin(), nums.end());
  vector<vector<int>> out;
  int n = (int)nums.size();
  for (int i = 0; i < n - 2; i++) {
    if (i > 0 && nums[i] == nums[i - 1]) continue;
    int l = i + 1, r = n - 1;
    while (l < r) {
      int s = nums[i] + nums[l] + nums[r];
      if (s == 0) {
        out.push_back(vector<int>{ nums[i], nums[l], nums[r] });
        l++; r--;
      } else if (s < 0) l++; else r--;
    }
  }
  return out;
}`,
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 12000 });
  const CodingProblem = require('../models/CodingProblem');

  const problem = await CodingProblem.findOne({
    'functionSignature.javascript': { $exists: true },
    'functionSignature.java': { $exists: true },
    'functionSignature.cpp': { $exists: true },
    'sampleTests.0': { $exists: true },
  }).lean();

  if (!problem) { console.log('no suitable problem found'); await mongoose.disconnect(); return; }
  console.log(`problem="${problem.title}" (${problem.problemId})`);

  const normalized = genericValidator.normalizeProblem(problem);
  const cases = normalized.testCases;
  console.log(`cases: total=${cases.length} visible=${cases.filter(t => !t.isHidden).length} hidden=${cases.filter(t => t.isHidden).length}`);
  console.log(`=== mode: ${LEGACY ? 'LEGACY (per-case)' : 'BATCH (compile once)'} ===`);

  for (const lang of ['javascript', 'java', 'cpp']) {
    if (!problem.functionSignature[lang]) { console.log(`[${lang}] no signature - skipped`); continue; }
    const sandbox = makeSandbox(!LEGACY);
    const t0 = Date.now();
    const run = await genericValidator.validateUserCode(normalized, SOLUTIONS[lang], lang, {
      runTestCase: sandbox,
      onlySample: false,
      testCases: cases,
    });
    const elapsed = Date.now() - t0;
    console.log(`[${lang}] passed=${run.passed}/${run.total} TOTAL=${elapsed}ms avg=${(elapsed / cases.length).toFixed(1)}ms/case`);
    if (VERIFY) {
      console.log(`   verdicts=${run.results.map(r => (r.passed ? 'P' : 'F')).join('')}`);
      console.log(`   first3=${JSON.stringify(run.results.slice(0, 3).map(r => ({ passed: r.passed, actual: r.actual, expected: r.expected, err: r.errorType })))}`);
    }
  }

  await mongoose.disconnect();
}
main().catch((e) => { console.error('BENCH ERROR:', e.stack); process.exit(1); });
