/**
 * backfillHiddenTests.js
 * --------------------------------------------------------------------------
 * Brings every coding problem to LeetCode-style coverage:
 *   - 3 visible (sample) test cases
 *   - 50 hidden test cases
 * with CORRECT expected outputs, computed from the deterministic reference
 * SOLVERS (gen + solve) in scripts/testCaseGenerators.js.
 *
 * Safety:
 *   - Only problems that have an entry in SOLVERS are regenerated. Others keep
 *     their existing tests.
 *   - Expected outputs are canonicalized to match the actual driver stdout
 *     (the driver prints strings WITHOUT quotes; solve() returns JSON.stringify
 *     which ADDS quotes -> unwrap quoted-string-literal outputs).
 *   - starterCode / functionSignature / _id / problemId are preserved; only
 *     the test-case fields are overwritten.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');
const { SOLVERS } = require('./testCaseGenerators');

// Title aliases: DB title -> SOLVERS key when they differ by punctuation/case.
const ALIASES = {
  "Pascals Triangle": "Pascal's Triangle",
};

/** Canonicalize an expected output string so it matches the driver's stdout. */
function canonicalize(raw) {
  const s = String(raw == null ? '' : raw).trim();
  // If the reference solver returned a JSON-quoted string literal (e.g. "\"LVIII\""),
  // the language driver actually prints the bare string ("LVIII"). Unwrap it.
  try {
    const parsed = JSON.parse(s);
    if (typeof parsed === 'string') return parsed;
  } catch (_) { /* not a JSON string literal -> use as-is */ }
  return s;
}

function titleToSolverKey(title) {
  if (SOLVERS[title]) return title;
  if (ALIASES[title] && SOLVERS[ALIASES[title]]) return ALIASES[title];
  return null;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const problems = await CodingProblem.find({ isActive: true }).select('title sampleTests hiddenTests functionSignature').lean();
  let regenerated = 0;
  let kept = 0;
  let failed = 0;

  for (const prob of problems) {
    const solverKey = titleToSolverKey(prob.title);
    try {
      if (solverKey) {
        const solver = SOLVERS[solverKey];
        const sample = [], hidden = [];
        for (let i = 0; i < 53; i++) {
          const input = String(solver.gen(i));
          const output = canonicalize(solver.solve(input));
          if (i < 3) sample.push({ input, output, explanation: 'Sample test case ' + (i + 1), isHidden: false });
          else hidden.push({ input, output, category: ['edge', 'stress', 'random'][i % 3], isHidden: true });
        }
        await CodingProblem.updateOne(
          { _id: prob._id },
          { $set: { sampleTests: sample, hiddenTests: hidden, visibleTestCases: sample, hiddenTestCases: hidden } }
        );
        regenerated++;
        console.log(`REGEN  ${prob.title}: sample=${sample.length} hidden=${hidden.length}`);
      } else {
        // No reference solver available -> keep existing tests but canonicalize
        // their expected outputs (fixes the quoted-string format bug if present).
        const norm = (arr) => (arr || []).map((tc) => ({
          input: tc.input, output: canonicalize(tc.output),
          explanation: tc.explanation, isHidden: !!tc.isHidden, category: tc.category,
        }));
        const sample = norm(prob.sampleTests || []);
        const hidden = norm(prob.hiddenTests || []);
        await CodingProblem.updateOne(
          { _id: prob._id },
          { $set: { sampleTests: sample, hiddenTests: hidden, visibleTestCases: sample, hiddenTestCases: hidden } }
        );
        kept++;
        console.log(`KEEP   ${prob.title}: (no solver) sample=${sample.length} hidden=${hidden.length}`);
      }
    } catch (e) {
      failed++;
      console.log(`ERROR  ${prob.title}: ${e.message}`);
    }
  }

  console.log('\n=== BACKFILL SUMMARY ===');
  console.log('regenerated (sample=3, hidden=50):', regenerated);
  console.log('kept (canonicalized only):', kept);
  console.log('failed:', failed);
  const after = await CodingProblem.aggregate([
    { $match: { isActive: true } },
    { $project: { title: 1, s: { $size: { $ifNull: ['$sampleTests', []] } }, h: { $size: { $ifNull: ['$hiddenTests', []] } } } },
  ]);
  const dist = {};
  for (const p of after) dist[p.h] = (dist[p.h] || 0) + 1;
  console.log('hidden-test count distribution after backfill:', JSON.stringify(dist));
  await mongoose.disconnect();
})();
