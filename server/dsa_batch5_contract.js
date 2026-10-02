'use strict';

/**
 * dsa_batch1_contract.js
 * ---------------------------------------------------------------------------
 * READ-ONLY. Decides, per batch problem, whether the intended contract can be
 * established from the repository.
 *
 * A title is enough ONLY when it names one universally defined algorithm, so
 * the task and the output shape both follow from convention. Where a title
 * admits several materially different contracts, the intended problem cannot be
 * derived from the record and the problem must go to manual review.
 *
 * Writes _dsa_batch5_decision.json. No database writes.
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');
const CONTRACT = require('./scripts/dsaBatch5Contracts');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const evidence = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch5_evidence.json'), 'utf8'));

  const rows = [];
  for (const b of evidence.batch) {
    const live = await CodingProblem.findById(b.id).lean();
    const c = CONTRACT[b.title] || { unambiguous: false, note: 'no contract analysis recorded' };
    const sig = live.functionSignature && live.functionSignature.javascript;
    rows.push({
      title: b.title,
      problemId: b.problemId,
      topic: b.topic,
      difficulty: b.difficulty,
      tags: live.tags || [],
      isGenericShell: !!(sig && sig.name === 'solve'
        && sig.params.length === 1 && sig.params[0].name === 'input'),
      unambiguous: !!c.unambiguous,
      note: c.note,
      variants: c.variants || null,
      hasFixtures: (live.sampleTests || []).length > 0 || (live.hiddenTests || []).length > 0,
      hasReference: !!(live.referenceSolution && String(live.referenceSolution.code || '').trim()),
    });
  }

  const safe = rows.filter((r) => r.unambiguous && !r.hasFixtures && !r.hasReference);
  const manual = rows.filter((r) => !r.unambiguous);

  fs.writeFileSync(path.join(__dirname, '_dsa_batch5_decision.json'), JSON.stringify(rows, null, 2));

  for (const r of rows) {
    console.log(
      r.title.padEnd(30)
      + (r.tags || []).join(',').padEnd(26)
      + r.difficulty.padEnd(8)
      + (r.unambiguous ? 'RECONSTRUCT' : 'MANUAL_REVIEW')
    );
  }

  console.log(`\nreconstructable : ${safe.length}`);
  console.log(`manual review   : ${manual.length}`);
  console.log(`titles          : ${safe.map((r) => r.title).join(', ')}`);

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
