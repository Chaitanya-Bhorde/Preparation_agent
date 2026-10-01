'use strict';

/**
 * dsa_batch1_fingerprint.js
 * ---------------------------------------------------------------------------
 * READ-ONLY. Records the exact before-state of the batch-1 targets so the
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
  const decision = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch1_decision.json'), 'utf8'));

  const targets = [];
  for (const d of decision) {
    const doc = await CodingProblem.findById(
      await CodingProblem.findOne({ title: d.title }).lean().then((x) => x._id)
    ).lean();
    const subs = await CodeSubmission.countDocuments({ problem: doc._id });
    targets.push({
      title: d.title,
      id: String(doc._id),
      slug: doc.slug,
      problemId: doc.problemId,
      bucket: d.unambiguous ? 'RECONSTRUCT' : 'MANUAL_REVIEW',
      isActive: doc.isActive,
      descLen: String(doc.description || '').length,
      samples: (doc.sampleTests || []).length,
      hidden: (doc.hiddenTests || []).length,
      submissions: subs,
      titleHash: Buffer.from(doc.title).toString('base64').slice(0, 24),
    });
  }

  const before = {
    generatedAt: new Date().toISOString(),
    totalActive: await CodingProblem.countDocuments({ isActive: true }),
    totalInactive: await CodingProblem.countDocuments({ isActive: false }),
    totalSubmissions: await CodeSubmission.countDocuments({}),
    targets,
  };

  fs.writeFileSync(path.join(__dirname, '_dsa_batch1_before.json'), JSON.stringify(before, null, 2));

  console.log(`active before   : ${before.totalActive}`);
  console.log(`inactive before : ${before.totalInactive}`);
  console.log(`submissions     : ${before.totalSubmissions}`);
  console.log(`\nBATCH 1 (${targets.length} records, deterministic problemId ASC):\n`);
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