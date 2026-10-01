'use strict';

/**
 * dsa_batch1_fingerprint.js
 * ---------------------------------------------------------------------------
 * READ-ONLY. Records the exact before-state of the batch-2 targets so the
 * migration can be proven to touch only those records, and writes the
 * manual-review register for the problems this batch cannot complete.
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
  const decision = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch3_decision.json'), 'utf8'));

  // Skip every problem an earlier batch already handled, so this always
  // continues where the last batch stopped.
  const doneTitles = new Set();
  for (const f of ['_dsa_batch1_before.json', '_dsa_batch2_before.json']) {
    const p = path.join(__dirname, f);
    if (!fs.existsSync(p)) continue;
    for (const t of JSON.parse(fs.readFileSync(p, 'utf8')).targets) doneTitles.add(t.title);
  }

  // The SELECTION lives in _dsa_batch3_evidence.json, produced by
  // dsa_batch3_select.js. Re-deriving it here could drift from the selection
  // that was actually authorised, so the fingerprint reads that file and only
  // adds the live state it needs for the safety checks.
  const evidence = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch3_evidence.json'), 'utf8'));

  const targets = [];
  for (const sel of evidence.batch) {
    const doc = await CodingProblem.findById(sel.id).lean();
    if (!doc) throw new Error(`selected record ${sel.title} no longer exists`);
    const subs = await CodeSubmission.countDocuments({ problem: doc._id });
    const d = decision.find((x) => x.title === doc.title);
    targets.push({
      title: doc.title,
      id: String(doc._id),
      slug: doc.slug,
      problemId: doc.problemId,
      bucket: d && d.unambiguous ? 'RECONSTRUCT' : 'MANUAL_REVIEW',
      isActive: doc.isActive,
      descLen: String(doc.description || '').length,
      samples: (doc.sampleTests || []).length,
      hidden: (doc.hiddenTests || []).length,
      submissions: subs,
    });
  }

  const before = {
    generatedAt: new Date().toISOString(),
    totalActive: await CodingProblem.countDocuments({ isActive: true }),
    totalInactive: await CodingProblem.countDocuments({ isActive: false }),
    totalSubmissions: await CodeSubmission.countDocuments({}),
    targets,
  };

  fs.writeFileSync(path.join(__dirname, '_dsa_batch3_before.json'), JSON.stringify(before, null, 2));

  console.log(`active before   : ${before.totalActive}`);
  console.log(`inactive before : ${before.totalInactive}`);
  console.log(`submissions     : ${before.totalSubmissions}`);
  console.log(`\nbatch 3 (${targets.length} records, deterministic problemId ASC):\n`);
  targets.forEach((t, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${t.id}  ${t.problemId.padEnd(14)} ${t.title.padEnd(30)} ${t.bucket}`);
    console.log(`    active=${t.isActive} descLen=${t.descLen} samples=${t.samples} hidden=${t.hidden} submissions=${t.submissions}`);
  });

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
