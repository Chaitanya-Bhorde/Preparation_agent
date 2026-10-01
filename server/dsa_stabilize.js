/**
 * dsa_stabilize.js
 * ---------------------------------------------------------------------------
 * Brings the DSA catalogue in line with the "COMPLETE = user-visible and
 * genuinely executable" rule.
 *
 *   REPAIRABLE -> presentation metadata is rebuilt from the problem's OWN typed
 *                 signature (the validator's source of truth) and from facts
 *                 verified against its stored reference solution. No behaviour,
 *                 fixture or expected output is invented or changed.
 *   INCOMPLETE -> isActive:false. The record and its submissions are kept; the
 *                 problem simply stops being offered to users.
 *
 * Safety: dry-run by default. `--apply` performs TARGETED updates by slug only.
 * No deletes, no drops, no deleteMany; submissions and user progress untouched.
 * ---------------------------------------------------------------------------
 */
'use strict';
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');

const APPLY = process.argv.includes('--apply');

/**
 * Descriptions that were too thin to read as a problem statement. Each is
 * original wording stating exactly what the stored signature + fixtures already
 * implement. The tie-break and empty-tree claims were verified by running the
 * problem's own reference solution.
 */
const DESCRIPTIONS = {
  'roman-to-integer':
    'Convert the roman numeral `s` to its integer value. Roman digits are written from largest to '
    + 'smallest and added together, except that a digit smaller than the digit following it is '
    + 'subtracted instead. Return the integer that `s` represents.',
  'k-closest-points-to-origin':
    'Given an array of integer points `points` and an integer `k`, return the `k` points closest to '
    + 'the origin (0, 0), ordered by increasing squared distance from it. When two points are '
    + 'equally distant from the origin, return them in the order they appear in `points`. Return '
    + 'the answer as an array of points.',
  'palindrome-linked-list':
    'Given a singly linked list supplied as an array of its node values in order, return `true` if '
    + 'those values read the same forwards and backwards, and `false` otherwise. The list is given '
    + 'as a flat array of values rather than as node objects.',
  'minimum-depth-of-binary-tree':
    'Given the root of a binary tree supplied as a level-order array where `null` marks a missing '
    + 'child, return the number of nodes on the shortest path from the root down to any leaf. '
    + 'Return 0 for an empty tree.',
  'maximum-subarray-sum':
    'Given an integer array `nums`, return the largest sum obtainable from any contiguous, '
    + 'non-empty subarray of `nums`. The subarray must contain at least one element.',
};

/**
 * Constraint lists that held a complexity hint or an empty array rather than
 * actual input bounds. Replaced with the bounds the problem's own input
 * contract and stored fixtures imply.
 */
const CONSTRAINTS = {
  'k-closest-points-to-origin': [
    '1 <= points.length',
    '1 <= k <= points.length',
    'Each point is an array [x, y] of two integers',
  ],
  'minimum-depth-of-binary-tree': [
    'The tree is given as a level-order array where null marks a missing child',
    '0 <= number of nodes <= 10^4',
    'An empty tree is represented by an empty array and has depth 0',
  ],
  'palindrome-linked-list': [
    '1 <= number of nodes <= 10^5',
    'Each node value is an integer',
  ],
  'maximum-subarray-sum': [
    '1 <= nums.length',
    '-1000 <= nums[i] <= 1000',
    'The chosen subarray must contain at least one element',
  ],
};

/**
 * Rebuild the display `inputFormat` array from the problem's real signature.
 *
 * The stored array is DISPLAY metadata: `normalizeProblem` treats only
 * `inputFormat.fields` as authoritative, and no document has that shape, so
 * parsing and judging are driven entirely by `functionSignature`. Rebuilding it
 * aligns what the API advertises with what the judge actually runs, and cannot
 * change a verdict.
 */
function deriveInputFormat(sig) {
  return sig.params.map((p) => ({ paramName: p.name, type: p.type }));
}

(async () => {
  const classify = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_classify.json'), 'utf8'));
  const repairSlugs = classify.repairable.map((r) => r.slug);
  const inactiveSlugs = classify.incomplete.map((r) => r.slug);

  await mongoose.connect(process.env.MONGO_URI);

  const repairable = await CodingProblem.find({ slug: { $in: repairSlugs } });
  const incomplete = await CodingProblem.find({ slug: { $in: inactiveSlugs } });

  console.log(`mode                  : ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`repairable candidates : ${repairable.length}`);
  console.log(`deactivate candidates : ${incomplete.length}\n`);

  const updates = [];
  for (const doc of repairable) {
    const sig = (doc.functionSignature && doc.functionSignature.javascript) || null;
    if (!sig || !Array.isArray(sig.params) || sig.params.length === 0) {
      console.log(`  SKIP  ${doc.slug}: no usable javascript signature`);
      continue;
    }

    const set = {};

    if (DESCRIPTIONS[doc.slug]) set.description = DESCRIPTIONS[doc.slug];
    if (CONSTRAINTS[doc.slug]) set.constraints = CONSTRAINTS[doc.slug];

    const current = (doc.inputFormat || []).map((f) => f && f.paramName).join(',');
    const derived = deriveInputFormat(sig).map((f) => f.paramName).join(',');
    if (current !== derived) set.inputFormat = deriveInputFormat(sig);

    if (set.description || set.constraints || set.inputFormat) {
      updates.push({ doc, set });
      const notes = [];
      if (set.description) notes.push(`description(${set.description.length})`);
      if (set.constraints) notes.push('constraints');
      if (set.inputFormat) notes.push(`inputFormat->${derived}`);
      console.log(`  REPAIR ${doc.slug}  [${notes.join(', ')}]`);
    } else {
      console.log(`  OK     ${doc.slug}  (already consistent)`);
    }
  }

  const toDeactivate = incomplete.filter((d) => d.isActive !== false);
  console.log(`\n  DEACTIVATE ${toDeactivate.length}: ${toDeactivate.slice(0, 5).map((d) => d.slug).join(', ')}${toDeactivate.length > 5 ? ', ...' : ''}`);

  if (!APPLY) {
    console.log('\nDRY RUN - nothing written. Re-run with --apply to commit.');
    await mongoose.disconnect();
    return;
  }

  let repaired = 0;
  for (const { doc, set } of updates) {
    await CodingProblem.updateOne({ _id: doc._id }, { $set: set });
    repaired++;
  }
  const res = await CodingProblem.updateMany(
    { _id: { $in: toDeactivate.map((d) => d._id) } },
    { $set: { isActive: false } }
  );

  console.log(`\nAPPLIED: ${repaired} problems repaired, ${res.modifiedCount} deactivated.`);
  console.log('Submissions, users and progress were not touched.');

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});