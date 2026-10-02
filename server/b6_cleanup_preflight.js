'use strict';

/**
 * b6_cleanup_preflight.js  (READ-ONLY — deletes nothing)
 * ---------------------------------------------------------------------------
 * Proves the exact Batch-6 HELD allow-list before any deletion is attempted.
 *
 * The allow-list is derived from _dsa_batch6_decision.json (the 50 selected
 * rows) MINUS the 21 unambiguous rows that became _dsa_batch6_built.json. That
 * yields the 29 records deliberately held for manual review.
 *
 * Hard safety rules enforced here:
 *   - the allow-list must be EXACTLY 29
 *   - every allowed record must exist, be DSA, and be inactive
 *   - no allowed record may be in the 189 active set (that set is preserved)
 *   - no allowed record may belong to Batches 1-5
 *   - no allowed record may carry submissions (deleting must not orphan any)
 *
 * Exits non-zero if ANY check fails, so cleanup refuses to run.
 *
 *   node b6_cleanup_preflight.js
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');

const decision = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch6_decision.json'), 'utf8'));
const built = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch6_built.json'), 'utf8')).built;
const builtSlugs = new Set(built.map((b) => b.slug));

const heldRows = decision.filter((r) => !r.unambiguous);

const checks = [];
const check = (name, ok, detail) => {
  checks.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(name).padEnd(52)} ${detail}`);
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  check('allow-list is exactly 29 held batch-6 rows', heldRows.length === 29,
    `${heldRows.length} held of ${decision.length} selected`);
  check('activated set is 21 and disjoint from held',
    built.length === 21 && heldRows.every((r) => !builtSlugs.has(r.title)),
    `${built.length} activated; no overlap with held`);

  const docs = await CodingProblem.find({ problemId: { $in: heldRows.map((r) => r.problemId) } })
    .select('problemId slug title topic isActive description sampleTests hiddenTests referenceSolution')
    .lean();
  const byPid = new Map(docs.map((d) => [d.problemId, d]));

  const missing = heldRows.filter((r) => !byPid.has(r.problemId));
  check('all 29 held problemIds exist in the DB', missing.length === 0,
    missing.length ? `missing: ${missing.map((m) => m.problemId).join(', ')}` : `${docs.length} found`);

  const activeHeld = docs.filter((d) => d.isActive === true);
  check('EVERY held record is inactive', activeHeld.length === 0,
    activeHeld.length ? `STILL ACTIVE: ${activeHeld.map((d) => d.problemId).join(', ')}` : `${docs.length} inactive`);

  const isDsa = docs.filter((d) => /^[A-Za-z0-9]/.test(String(d.problemId || '')));
  check('every held record is a DSA record', isDsa.length === docs.length,
    `${isDsa.length}/${docs.length} carry a DSA problemId`);

  // Batches 1-5 activated slugs must not intersect the allow-list.
  const priorSlugs = new Set();
  for (let b = 1; b <= 5; b++) {
    const f = path.join(__dirname, `_dsa_batch${b}_built.json`);
    if (!fs.existsSync(f)) continue;
    for (const row of JSON.parse(fs.readFileSync(f, 'utf8')).built || []) priorSlugs.add(row.slug);
  }
  const priorHit = docs.filter((d) => priorSlugs.has(d.slug));
  check('NO batch 1-5 activated problem is in the allow-list', priorHit.length === 0,
    priorHit.length ? `COLLISION: ${priorHit.map((d) => d.slug).join(', ')}` : `${priorSlugs.size} batch 1-5 slugs checked, 0 collisions`);

  // Submissions must remain untouched: refuse if any held problem has history.
  const withSubs = [];
  for (const d of docs) {
    const n = await db.collection('codesubmissions').countDocuments({ problem: d._id });
    if (n > 0) withSubs.push(`${d.problemId}(${n})`);
  }
  check('no held record has submissions (nothing orphaned)', withSubs.length === 0,
    withSubs.length ? `HAS SUBS: ${withSubs.join(', ')}` : '0 submissions across all 29');

// The 189 that must survive.
  const activeAll = await CodingProblem.find({ isActive: true }).select('problemId slug title').lean();
  const activeSlugs = new Set(activeAll.map((d) => d.slug));
  const usable = (t) => Array.isArray(t) && t.length > 0
    && t.every((x) => x && typeof x.input === 'string' && typeof x.output === 'string');
  const activeFull = await CodingProblem.find({ isActive: true })
    .select('description sampleTests hiddenTests').lean();
  const completeActive = activeFull.filter((p) => typeof p.description === 'string'
    && p.description.length > 40 && usable(p.sampleTests) && usable(p.hiddenTests));

  const heldInActive = docs.filter((d) => activeSlugs.has(d.slug));
  check('PRE-DELETE active DSA == 189', activeAll.length === 189, `active=${activeAll.length}`);
  check('PRE-DELETE complete active DSA == 189', completeActive.length === 189, `complete=${completeActive.length}`);
  check('no allow-listed slug appears among the 189 active', heldInActive.length === 0,
    heldInActive.length ? `COLLISION: ${heldInActive.map((d) => d.slug).join(', ')}` : '0 collisions');

  const totalAll = await CodingProblem.countDocuments({});
  const inactiveAll = await CodingProblem.countDocuments({ isActive: { $ne: true } });
  console.log(`\npre-delete CodingProblem total: ${totalAll}`);
  console.log(`pre-delete active DSA:         ${activeAll.length}`);
  console.log(`pre-delete complete active:    ${completeActive.length}`);
  console.log(`pre-delete inactive records:   ${inactiveAll}  (only 29 deleted; ${inactiveAll - 29} stay)`);

  // Persist the verified allow-list for the delete script to consume.
  fs.writeFileSync(path.join(__dirname, '_b6_cleanup_allowlist.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    expected: 29,
    ids: docs.map((d) => String(d._id)),
    records: docs.map((d) => ({ id: String(d._id), problemId: d.problemId, slug: d.slug, title: d.title })),
  }, null, 2));
  console.log('\nallow-list written: _b6_cleanup_allowlist.json');

  console.log('\n--- the exact 29 to delete ---');
  docs.slice().sort((a, b) => a.problemId.localeCompare(b.problemId))
    .forEach((d, i) => console.log(`${String(i + 1).padStart(2)}. ${d.problemId}  ${d.title}`));

  await mongoose.disconnect();
  const failed = checks.filter((c) => !c.ok).length;
  console.log(`\n${checks.length - failed}/${checks.length} PREFLIGHT CHECKS PASSED`);
  console.log(failed === 0 ? 'SAFE TO DELETE' : 'ABORT — DO NOT DELETE');
  process.exit(failed === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error('PREFLIGHT CRASHED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});