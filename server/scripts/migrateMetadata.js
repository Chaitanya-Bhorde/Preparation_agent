/**
 * migrateMetadata.js (Phase 4.1.3)
 * Backfills inputFormat/outputFormat derived from functionSignature so the
 * metadata-driven validator (genericValidator.normalizeProblem) has explicit
 * metadata to consume. Idempotent; safe to re-run.
 *
 * NOTE: referenceSolution.code is authored per-problem (it cannot be derived
 * from testCaseGenerators.js, which generates *test cases*, not solvers), so
 * it is intentionally left untouched here.
 */
const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');

async function migrate() {
  const problems = await CodingProblem.find();
  let derivedInput = 0;
  let derivedOutput = 0;
  let populatedSolver = 0;

  for (const problem of problems) {
    let changed = false;
    const sig = (problem.functionSignature && problem.functionSignature.javascript) || problem.functionSignature;

    if ((!Array.isArray(problem.inputFormat) || problem.inputFormat.length === 0) && sig && Array.isArray(sig.params) && sig.params.length) {
      problem.inputFormat = sig.params.map((p) => ({ paramName: p.name, type: p.type, constraints: 'N/A' }));
      derivedInput++;
      changed = true;
    }

    if (!problem.outputFormat && sig && sig.returnType) {
      problem.outputFormat = { type: sig.returnType, description: 'Return value' };
      derivedOutput++;
      changed = true;
    }

    if (changed) await problem.save();
  }

  console.log('Migration complete:');
  console.log('  Total problems: ' + problems.length);
  console.log('  Derived inputFormat: ' + derivedInput);
  console.log('  Derived outputFormat: ' + derivedOutput);
  console.log('  Populated referenceSolution: ' + populatedSolver);
}

if (require.main === module) {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('MONGO_URI not set'); process.exit(1); }
  mongoose.connect(uri).then(migrate).then(() => process.exit(0)).catch((e) => { console.error('Migration failed:', e.message); process.exit(1); });
}

module.exports = { migrate };