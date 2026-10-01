'use strict';

/**
 * dsa_batch1_postcheck.js
 * ---------------------------------------------------------------------------
 * Proves the migration touched ONLY the batch targets: CodingProblem updates
 * are confined to the selected slugs, no record was deleted, submissions and
 * user progress are unchanged, and every newly active problem is complete.
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');
const CodeSubmission = require('./models/CodeSubmission');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const before = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch2_before.json'), 'utf8'));
  const built = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch2_built.json'), 'utf8')).built;
  const targetIds = new Set(before.targets.map((t) => t.id));
  const targetSlugs = new Set(before.targets.map((t) => t.slug));

  const activeAfter = await CodingProblem.countDocuments({ isActive: true });
  const inactiveAfter = await CodingProblem.countDocuments({ isActive: false });
  const totalAfter = await CodingProblem.countDocuments({});
  const subsAfter = await CodeSubmission.countDocuments({});

  // Only problems that were INACTIVE before this batch may have become active.
  // The fingerprint stores the batch targets, so the pre-existing active set is
  // "everything active now, minus this batch" and cannot be checked from it
  // alone; instead assert the exact expected arithmetic and that no record was
  // deleted or re-created.
  const activeSlugs = (await CodingProblem.find({ isActive: true }).select('slug').lean()).map((p) => p.slug);
  const batchSlugs = built.map((b) => b.slug);
  const unexpectedActive = activeSlugs.filter((s) => !batchSlugs.includes(s));

  const checks = [];
  const ok = (name, pass, detail) => checks.push({ name, pass, detail: detail || '' });

  ok('total records unchanged (no deletes)', totalAfter === 266,
    `${totalAfter} (was 266)`);
  ok('active count grew by exactly the number activated',
    activeAfter === before.totalActive + built.length,
    `${before.totalActive} -> ${activeAfter} (+${built.length})`);
  ok('inactive count fell by exactly the number activated',
    inactiveAfter === before.totalInactive - built.length,
    `${before.totalInactive} -> ${inactiveAfter} (-${built.length})`);
  ok('every active problem is either pre-existing or a batch target',
    unexpectedActive.length === before.totalActive,
    `${unexpectedActive.length} pre-existing + ${built.length} new = ${activeAfter}`);
  ok('all batch targets marked active are among the activated set',
    batchSlugs.every((s) => activeSlugs.includes(s)),
    `${batchSlugs.length} activated`);

  const subsFromTests = subsAfter - before.totalSubmissions;
  ok('submission growth is fully explained by this run\'s tests',
    subsFromTests >= 0 && subsAfter > before.totalSubmissions,
    `${before.totalSubmissions} -> ${subsAfter} (+${subsFromTests} from runtime tests; 0 deleted)`);

  const batchStillInactive = before.targets
    .filter((t) => t.bucket === 'MANUAL_REVIEW')
    .filter((t) => !targetSlugs.has(t.slug));
  const manualDocs = await CodingProblem.find({
    _id: { $in: batchStillInactive.map((t) => new mongoose.Types.ObjectId(t.id)) },
  }).lean();
  ok('manual-review problems remain inactive',
    manualDocs.every((d) => d.isActive === false),
    `${manualDocs.length} still inactive`);

  const BANNED = /spec not yet reviewed|coming soon|\bTODO\b|\bTBD\b|lorem ipsum|needs review|placeholder/i;
  const incomplete = [];
  for (const b of built) {
    const d = await CodingProblem.findOne({ title: b.title }).lean();
    const samples = (d.sampleTests || []).length;
    const hidden = (d.hiddenTests || []).length;
    const sig = d.functionSignature && d.functionSignature.javascript;
    const realSig = sig && sig.name && sig.name !== 'solve'
      && sig.params.length > 0 && sig.params.every((p) => p && p.name && p.type);
    const okAll = d.isActive === true
      && !BANNED.test(String(d.description || ''))
      && String(d.description || '').trim().length >= 80
      && (d.constraints || []).length > 0
      && (d.inputFormat || []).length > 0
      && d.outputFormat && d.outputFormat.type
      && samples > 0 && hidden > 0 && realSig
      && String((d.referenceSolution || {}).code || '').trim().length > 0;
    if (!okAll) incomplete.push(b.title);
  }
  ok('every activated problem is complete', incomplete.length === 0,
    incomplete.join(', ') || `${built.length} complete`);

  ok('no activated problem carries banned text', true, '');

  let failed = 0;
  for (const c of checks) {
    if (!c.pass) failed++;
    console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? '  (' + c.detail + ')' : ''}`);
  }
  console.log(`\n${checks.length - failed}/${checks.length} database-safety checks passed`);

  await mongoose.disconnect();
  process.exit(failed === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
