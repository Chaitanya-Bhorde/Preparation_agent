'use strict';

/**
 * b6_cleanup_delete.js
 * ---------------------------------------------------------------------------
 * Controlled cleanup: delete EXACTLY the 29 held Batch-6 DSA records listed in
 * _b6_cleanup_allowlist.json, and nothing else.
 *
 * SAFETY MODEL
 *   - The allow-list file is the ONLY deletion source. It is never re-derived
 *     from a broad query at delete time.
 *   - Every one of 10 preconditions is re-validated immediately before the
 *     delete. ANY failure aborts with a non-zero exit and deletes nothing.
 *   - The delete is deleteMany({ _id: { $in: <29 literal ObjectIds> } }).
 *     There is no {isActive:false}, no title/difficulty/date pattern, no
 *     "everything below some id" rule.
 *   - The 189 active problems are fingerprinted BEFORE the delete and compared
 *     field-by-field AFTER it. Any drift is reported as a failure.
 *   - Submissions, users, progress, SQL, aptitude and interview collections are
 *     only ever COUNTED, never written.
 *
 * This script never requires a seeder module and never calls deleteMany({}).
 *
 *   node b6_cleanup_delete.js            # verify + delete + verify
 *   node b6_cleanup_delete.js --dry-run  # verify only, delete nothing
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');

const DRY = process.argv.includes('--dry-run');
const ALLOW_FILE = path.join(__dirname, '_b6_cleanup_allowlist.json');

const checks = [];
const check = (name, ok, detail) => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(name).padEnd(54)} ${detail}`);
};
const say = (s) => console.log(s);

// A stable fingerprint of the fields that must not change for the 189.
const fingerprint = (d) => crypto.createHash('sha256').update(JSON.stringify({
  slug: d.slug,
  problemId: d.problemId,
  title: d.title,
  topic: d.topic,
  difficulty: d.difficulty,
  isActive: d.isActive,
  descLen: String(d.description || '').length,
  descHash: crypto.createHash('sha256').update(String(d.description || '')).digest('hex').slice(0, 16),
  samples: Array.isArray(d.sampleTests) ? d.sampleTests.length : -1,
  hidden: Array.isArray(d.hiddenTests) ? d.hiddenTests.length : -1,
  refHash: crypto.createHash('sha256').update(String((d.referenceSolution && d.referenceSolution.code) || '')).digest('hex').slice(0, 16),
  starterHash: crypto.createHash('sha256').update(JSON.stringify(d.starterCode || null)).digest('hex').slice(0, 16),
})).digest('hex').slice(0, 24);
(async () => {
  // ---- load the approved allow-list (the ONLY deletion source) -------------
  if (!fs.existsSync(ALLOW_FILE)) {
    console.error('ABORT: allow-list file missing. Run b6_cleanup_preflight.js first.');
    process.exit(1);
  }
  const allow = JSON.parse(fs.readFileSync(ALLOW_FILE, 'utf8'));
  const ids = allow.ids;
  check('allow-list holds exactly 29 ids', Array.isArray(ids) && ids.length === 29, `${ids.length} ids`);
  check('allow-list ids are unique', new Set(ids).size === ids.length, `${new Set(ids).size} unique`);
  const idObjs = ids.map((s) => new mongoose.Types.ObjectId(String(s)));

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  // ---- re-validate every precondition immediately before deleting ---------
  const decision = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch6_decision.json'), 'utf8'));
  const built = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch6_built.json'), 'utf8')).built;
  const heldPids = new Set(decision.filter((r) => !r.unambiguous).map((r) => r.problemId));

  const targets = await CodingProblem.find({ _id: { $in: idObjs } })
    .select('problemId slug title isActive').lean();
  check('all 29 allow-listed records still exist', targets.length === 29, `${targets.length} found`);
  check('all 29 are DSA records', targets.every((t) => /^[A-Za-z0-9]/.test(String(t.problemId || ''))), 'all carry a DSA problemId');
  check('all 29 are inactive', targets.every((t) => t.isActive !== true), `${targets.filter((t) => t.isActive !== true).length} inactive`);
  check('all 29 are the batch-6 HELD records',
    targets.every((t) => heldPids.has(t.problemId)),
    `${targets.filter((t) => heldPids.has(t.problemId)).length}/29 match the held set`);

  // Batches 1-5 must not be touched.
  const priorSlugs = new Set();
  for (let b = 1; b <= 5; b++) {
    const f = path.join(__dirname, `_dsa_batch${b}_built.json`);
    if (!fs.existsSync(f)) continue;
    for (const row of JSON.parse(fs.readFileSync(f, 'utf8')).built || []) priorSlugs.add(row.slug);
  }
  const priorHit = targets.filter((t) => priorSlugs.has(t.slug));
  check('no batch 1-5 record is in the allow-list', priorHit.length === 0,
    priorHit.length ? `COLLISION: ${priorHit.map((t) => t.slug).join(', ')}` : `${priorSlugs.size} slugs checked, 0 collisions`);
  check('batch-6 activated 21 are all absent from the allow-list',
    targets.every((t) => !built.some((b) => b.slug === t.slug)), 'no activated problem targeted');

  // The 189 active set must not be touched.
  const activeBefore = await CodingProblem.find({ isActive: true })
    .select('problemId slug title topic difficulty description sampleTests hiddenTests referenceSolution starterCode').lean();
  const activeIdsBefore = activeBefore.map((d) => String(d._id)).sort();
  const activeFpBefore = new Map(activeBefore.map((d) => [String(d._id), fingerprint(d)]));
  const targetIdStrs = new Set(ids.map(String));
  const clash = activeIdsBefore.filter((id) => targetIdStrs.has(id));
  check('PRE-DELETE active DSA == 189', activeBefore.length === 189, `active=${activeBefore.length}`);
  check('no allow-listed id is among the 189 active', clash.length === 0,
    clash.length ? `COLLISION: ${clash.join(', ')}` : '0 collisions');

  const usable = (t) => Array.isArray(t) && t.length > 0
    && t.every((x) => x && typeof x.input === 'string' && typeof x.output === 'string');
  const completeBefore = activeBefore.filter((p) => typeof p.description === 'string'
    && p.description.length > 40 && usable(p.sampleTests) && usable(p.hiddenTests));
  check('PRE-DELETE complete active DSA == 189', completeBefore.length === 189, `complete=${completeBefore.length}`);

  // Nothing may have submission history (deleting must not orphan anything).
  let subTotal = 0;
  for (const t of targets) subTotal += await db.collection('codesubmissions').countDocuments({ problem: t._id });
  check('no allow-listed record has submissions', subTotal === 0, `${subTotal} submissions across the 29`);

  // Counts that must not move.
  const countsBefore = {
    codesubmissions: await db.collection('codesubmissions').countDocuments({}),
    submissions: await db.collection('submissions').countDocuments({}),
    users: await db.collection('users').countDocuments({}),
    total: await CodingProblem.countDocuments({}),
  };

// ---- ABORT GATE: nothing is deleted unless every check passed ------------
  const failed = checks.filter((c) => !c.ok);
  say('\n--- the exact 29 targets (id / problemId / title) ---');
  targets.slice().sort((a, b) => a.problemId.localeCompare(b.problemId))
    .forEach((t, i) => say(`${String(i + 1).padStart(2)}. ${t._id}  ${t.problemId}  ${t.title}`));
  say(`\nDB total CodingProblem before delete: ${countsBefore.total}`);
  say(`active DSA before: ${activeBefore.length}   complete active before: ${completeBefore.length}`);

  if (failed.length) {
    say(`\n${failed.length} PRECONDITION(S) FAILED -> ABORT, NOTHING DELETED`);
    failed.forEach((f) => say(`  FAILED: ${f.name} (${f.detail})`));
    await mongoose.disconnect();
    process.exit(1);
  }
  if (DRY) {
    say('\n--dry-run: all 10 preconditions passed. NOTHING DELETED.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // ---- THE DELETE: explicit 29-id allow-list, nothing else -----------------
  say('\nEXECUTING DELETE on the 29 explicit ids...');
  const res = await CodingProblem.deleteMany({ _id: { $in: idObjs } });
  const deleted = res.deletedCount || 0;
  check('exactly 29 records deleted', deleted === 29, `deletedCount=${deleted}`);

  // ---- post-delete verification -------------------------------------------
  const survivors = await CodingProblem.find({ _id: { $in: idObjs } }).select('problemId').lean();
  check('none of the 29 remain', survivors.length === 0, `${survivors.length} still present`);

  const activeAfter = await CodingProblem.find({ isActive: true })
    .select('problemId slug title topic difficulty description sampleTests hiddenTests referenceSolution starterCode').lean();
  const activeIdsAfter = activeAfter.map((d) => String(d._id)).sort();
  const completeAfter = activeAfter.filter((p) => typeof p.description === 'string'
    && p.description.length > 40 && usable(p.sampleTests) && usable(p.hiddenTests));

  check('POST-DELETE active DSA == 189', activeAfter.length === 189, `active=${activeAfter.length}`);
  check('POST-DELETE complete active DSA == 189', completeAfter.length === 189, `complete=${completeAfter.length}`);
  check('INVARIANT complete active == active', completeAfter.length === activeAfter.length,
    `complete=${completeAfter.length} active=${activeAfter.length}`);

  // THE 189 must be identical, not merely the same count.
  const sameIds = activeIdsBefore.length === activeIdsAfter.length
    && activeIdsBefore.every((id, i) => id === activeIdsAfter[i]);
  check('the EXACT same 189 active ids remain', sameIds,
    sameIds ? 'id set identical before/after' : 'ACTIVE ID SET CHANGED');

  const drifted = [];
  for (const d of activeAfter) {
    const before = activeFpBefore.get(String(d._id));
    if (before !== fingerprint(d)) drifted.push(`${d.slug}`);
  }
  check('all 189 active problems are byte-identical', drifted.length === 0,
    drifted.length ? `CHANGED: ${drifted.slice(0, 10).join(', ')}` : '0 content fingerprints changed');

  const totalAfter = await CodingProblem.countDocuments({});
  const inactiveAfter = await CodingProblem.countDocuments({ isActive: { $ne: true } });
  check('total DSA records 266 -> 237', countsBefore.total === 266 && totalAfter === 237,
    `${countsBefore.total} -> ${totalAfter}`);
  check('exactly 48 intentionally inactive records remain', inactiveAfter === 48, `inactive=${inactiveAfter}`);

  const countsAfter = {
    codesubmissions: await db.collection('codesubmissions').countDocuments({}),
    submissions: await db.collection('submissions').countDocuments({}),
    users: await db.collection('users').countDocuments({}),
  };
  check('no submission was deleted', countsAfter.codesubmissions === countsBefore.codesubmissions,
    `codesubmissions ${countsBefore.codesubmissions} -> ${countsAfter.codesubmissions}`);
  check('no legacy submission was deleted', countsAfter.submissions === countsBefore.submissions,
    `submissions ${countsBefore.submissions} -> ${countsAfter.submissions}`);
  check('no user was deleted', countsAfter.users === countsBefore.users,
    `users ${countsBefore.users} -> ${countsAfter.users}`);

  // Batches 1-5 still fully present and active.
  const priorDocs = await CodingProblem.find({ slug: { $in: [...priorSlugs] } }).select('slug isActive').lean();
  const priorMissing = [...priorSlugs].filter((s) => !priorDocs.some((d) => d.slug === s));
  const priorInactive = priorDocs.filter((d) => d.isActive !== true);
  check('batches 1-5 all still present', priorMissing.length === 0,
    priorMissing.length ? `MISSING: ${priorMissing.join(', ')}` : `${priorDocs.length} problems intact`);
  check('batches 1-5 all still active', priorInactive.length === 0,
    priorInactive.length ? `INACTIVE: ${priorInactive.map((d) => d.slug).join(', ')}` : '0 inactive');

  const b6Active = await CodingProblem.find({ slug: { $in: built.map((b) => b.slug) } })
    .select('slug isActive').lean();
  check('all 21 batch-6 activated problems still active',
    b6Active.length === 21 && b6Active.every((d) => d.isActive === true), `${b6Active.length} present`);

  await mongoose.disconnect();
  const bad = checks.filter((c) => !c.ok).length;
  say(`\n${checks.length - bad}/${checks.length} CLEANUP CHECKS PASSED`);
  say(bad === 0 ? 'CLEANUP COMPLETE AND VERIFIED' : 'CLEANUP HAD FAILURES - INVESTIGATE');
  process.exit(bad === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error('CLEANUP CRASHED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});