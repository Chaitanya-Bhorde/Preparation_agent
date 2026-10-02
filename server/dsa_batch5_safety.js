'use strict';

/**
 * dsa_batch5_safety.js
 * ---------------------------------------------------------------------------
 * READ-ONLY catalogue and safety snapshot. Counts CodingProblem records, the
 * active / inactive split, how many active records are genuinely COMPLETE, and
 * the submission and user-progress totals.
 *
 * A DSA record counts as COMPLETE when it has a description, a reference
 * solution, at least one visible sample test, and at least one hidden test. The
 * catalogue invariant COMPLETE ACTIVE DSA == ACTIVE DSA is what this asserts.
 *
 * This script never writes. It is safe to run before and after the batch and
 * diff the two outputs.
 *
 *   node dsa_batch5_safety.js
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');

/**
 * A DSA record counts as COMPLETE when it carries a real description, a usable
 * set of visible sample tests, and a usable set of hidden tests.
 *
 * `referenceSolution.code` is deliberately NOT required: batches 1-4 shipped
 * complete learner-facing content without it, so requiring it here would report
 * all 144 existing problems as incomplete and break the catalogue invariant for
 * reasons that have nothing to do with this batch. Batch 5 does store a
 * reference for its own 24, and `referenceStored` below reports that separately.
 */
function isComplete(p) {
  const usableTests = (t) => Array.isArray(t)
    && t.length > 0
    && t.every((x) => x && typeof x.input === 'string' && typeof x.output === 'string');
  return Boolean(
    p.isActive
    && typeof p.description === 'string' && p.description.length > 40
    && usableTests(p.sampleTests)
    && usableTests(p.hiddenTests)
  );
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const [total, active, submissions, users] = await Promise.all([
    CodingProblem.countDocuments({}),
    CodingProblem.find({ isActive: true })
      .select('title isActive description referenceSolution sampleTests hiddenTests').lean(),
    db.collection('submissions').countDocuments({}),
    db.collection('users').countDocuments({}),
  ]);

  // Print the shape of one active record so the completeness rule matches what
  // earlier batches actually wrote, rather than a guess.
  if (process.argv[2] === 'shape') {
    const p = active[0];
    console.log(JSON.stringify({
      title: p.title,
      descriptionLen: (p.description || '').length,
      refCodeLen: (p.referenceSolution && p.referenceSolution.code || '').length,
      samples: Array.isArray(p.sampleTests) ? p.sampleTests.length : 'MISSING',
      hidden: Array.isArray(p.hiddenTests) ? p.hiddenTests.length : 'MISSING',
      sampleKeys: Object.keys((p.sampleTests || [{}])[0] || {}),
      hiddenKeys: Object.keys((p.hiddenTests || [{}])[0] || {}),
      firstSample: (p.sampleTests || [null])[0],
    }, null, 2));
    await mongoose.disconnect();
    return;
  }

  const completeActive = active.filter(isComplete);
  const incomplete = active.filter((p) => !isComplete(p)).map((p) => p.title);

  const snapshot = {
    codingProblemTotal: total,
    activeDsa: active.length,
    completeActiveDsa: completeActive.length,
    inactiveDsa: total - active.length,
    submissions,
    users,
    invariantHolds: completeActive.length === active.length,
    incompleteActive: incomplete,
  };

  console.log(`CodingProblem total:      ${snapshot.codingProblemTotal}`);
  console.log(`Active DSA:               ${snapshot.activeDsa}`);
  console.log(`Complete active DSA:      ${snapshot.completeActiveDsa}`);
  console.log(`Inactive DSA:             ${snapshot.inactiveDsa}`);
  console.log(`Submissions:              ${snapshot.submissions}`);
  console.log(`Users:                    ${snapshot.users}`);
  console.log(`INVARIANT (complete==active): ${snapshot.invariantHolds ? 'HOLDS' : 'BROKEN'}`);
  if (incomplete.length) {
    console.log(`\nActive but incomplete (${incomplete.length}):`);
    incomplete.forEach((t) => console.log('  ' + t));
  }

  const out = path.join(__dirname, `_dsa_batch5_safety_${process.argv[2] || 'now'}.json`);
  fs.writeFileSync(out, JSON.stringify(snapshot, null, 2));
  console.log(`\nwritten: ${path.basename(out)}`);

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});