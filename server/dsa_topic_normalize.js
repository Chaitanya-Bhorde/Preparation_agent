/**
 * dsa_topic_normalize.js
 * ---------------------------------------------------------------------------
 * The catalogue accumulated near-duplicate topic labels ("Tree" and "Trees",
 * "Linked List" and "Linked Lists", "Dynamic Programming" and
 * "dynamic-programming"). The topic filter builds its options from
 * `distinct('topic')`, so each variant became its own dropdown entry and
 * splitting the same subject across several filters.
 *
 * This merges the duplicates onto one canonical label per subject, matching
 * the dominant existing spelling. It touches ONLY the `topic` display/filter
 * field of ACTIVE problems: no fixture, expected output, reference solution or
 * submission is modified, so judging is unaffected.
 *
 * Dry-run by default; `--apply` commits. Read-only apart from that one field.
 * ---------------------------------------------------------------------------
 */
'use strict';
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');

const APPLY = process.argv.includes('--apply');

// Canonical label per variant. Targets are the spelling already used by the
// largest number of active problems in that subject.
const CANONICAL = {
  'Trees': 'Tree',
  'Linked Lists': 'Linked List',
  'dynamic-programming': 'Dynamic Programming',
};
(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const variants = await CodingProblem.aggregate([
    { $match: { isActive: true, topic: { $in: Object.keys(CANONICAL) } } },
    { $group: { _id: '$topic', n: { $sum: 1 }, titles: { $push: '$title' } } },
    { $sort: { _id: 1 } },
  ]);

  console.log(`mode: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  for (const v of variants) {
    console.log(`${v.n} x "${v._id}" -> "${CANONICAL[v._id]}"`);
    v.titles.forEach((t) => console.log(`      ${t}`));
  }

  const plans = variants.map((v) => ({
    from: v._id,
    to: CANONICAL[v._id],
    count: v.n,
  }));
  console.log(`\n${plans.length} topic labels, ${plans.reduce((s, p) => s + p.count, 0)} problems`);

  if (!APPLY) {
    console.log('\nDRY RUN - nothing written. Re-run with --apply.');
    await mongoose.disconnect();
    return;
  }

  let modified = 0;
  for (const p of plans) {
    const res = await CodingProblem.updateMany(
      { isActive: true, topic: p.from },
      { $set: { topic: p.to } }
    );
    modified += res.modifiedCount;
    console.log(`  ${p.from} -> ${p.to}: ${res.modifiedCount} updated`);
  }
  console.log(`\nAPPLIED: ${modified} problems re-topic'd.`);

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});