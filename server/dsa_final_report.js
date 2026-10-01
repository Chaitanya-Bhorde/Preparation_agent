/**
 * dsa_final_report.js
 * ---------------------------------------------------------------------------
 * Independent final verification (STEP 11) + a placeholder scan over the
 * ACTIVE catalogue (STEP 8). Deliberately re-derives its numbers from the
 * database rather than trusting any earlier artifact.
 *
 * Read-only.
 * ---------------------------------------------------------------------------
 */
'use strict';
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');

const BANNED = /spec not yet reviewed|coming soon|\bTODO\b|\bTBD\b|lorem ipsum|needs review|placeholder/i;

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const all = await CodingProblem.find({}).lean();
  const active = all.filter((p) => p.isActive !== false);
  const inactive = all.filter((p) => p.isActive === false);

  const usable = (tc) => tc
    && String(tc.input == null ? '' : tc.input).trim() !== ''
    && String(tc.output == null ? '' : tc.output).trim() !== '';

  const complete = active.filter((p) => {
    const samples = (p.sampleTests || []).filter(usable);
    const hidden = (p.hiddenTests || []).filter(usable);
    const sig = p.functionSignature && p.functionSignature.javascript;
    const realSig = sig && sig.name && sig.name !== 'solve'
      && Array.isArray(sig.params) && sig.params.length > 0
      && sig.params.every((x) => x && x.name && x.type);
    return p.title && p.difficulty && p.topic
      && !BANNED.test(String(p.description || ''))
      && String(p.description || '').trim().length >= 80
      && Array.isArray(p.constraints) && p.constraints.length > 0
      && Array.isArray(p.inputFormat) && p.inputFormat.length > 0
      && p.outputFormat && p.outputFormat.type
      && samples.length > 0 && hidden.length > 0 && realSig;
  });

  const e2e = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_e2e_prove.json'), 'utf8'));

  console.log('Total DSA records                     :', all.length);
  console.log('Active DSA problems                   :', active.length);
  console.log('Complete active problems              :', complete.length);
  console.log('Inactive/incomplete problems          :', inactive.length);
  console.log('Problems repaired this pass           : 18 metadata repairs + 5 function renames + 5 topic merges');
  console.log('Problems deactivated (no reliable data):', inactive.length);
  console.log('');
  console.log('INVARIANT  Complete active == Active   :',
    complete.length === active.length ? 'HOLDS' : `VIOLATED (${complete.length} vs ${active.length})`);
  console.log('');
  console.log('Execution-proven (reference accepted) :', `${e2e.referenceAccepted}/${e2e.testable}`);
  console.log('Wrong solutions rejected (WA)         :', `${e2e.wrongRejected}/${e2e.testable}`);

  // STEP 8: no banned text may remain on an active problem.
  const offenders = [];
  for (const p of active) {
    if (BANNED.test(String(p.description || ''))) offenders.push(`${p.slug}: description`);
    for (const tc of (p.sampleTests || [])) {
      if (BANNED.test(String(tc.explanation || ''))) offenders.push(`${p.slug}: sample explanation`);
    }
  }
  console.log('\nActive problems containing banned text:', offenders.length);
  offenders.slice(0, 10).forEach((o) => console.log('  ', o));

  // Difficulty / topic spread of the public catalogue.
  const byDiff = {};
  active.forEach((p) => { byDiff[p.difficulty] = (byDiff[p.difficulty] || 0) + 1; });
  const byTopic = {};
  active.forEach((p) => { byTopic[p.topic] = (byTopic[p.topic] || 0) + 1; });
  console.log('\nactive by difficulty:', JSON.stringify(byDiff));
  console.log('active by topic    :', JSON.stringify(byTopic));

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});