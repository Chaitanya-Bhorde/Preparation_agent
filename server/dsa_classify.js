/**
 * dsa_classify.js
 * ---------------------------------------------------------------------------
 * READ-ONLY three-way classification of every CodingProblem.
 *
 *   COMPLETE   - fully usable and interview-demo ready.
 *   REPAIRABLE - the repository already holds reliable information (real stored
 *                sample/hidden fixtures with expected outputs, a real typed
 *                signature) and only the surrounding presentation metadata is
 *                thin. Safe to finish without inventing behaviour.
 *   INCOMPLETE - nothing reliable exists: the seeder template description, no
 *                stored fixtures at all, and the generic solve(input:string)
 *                shell. Finishing these would mean inventing problem semantics,
 *                which this project refuses to do.
 *
 * The discriminator that matters is whether real EXECUTABLE FIXTURES exist.
 * Fixtures pin the exact semantics (they carry stored expected outputs), so a
 * problem with them can be finished honestly. Without them a title alone does
 * not define an unambiguous contract.
 *
 * Writes _dsa_classify.json. No database writes.
 * ---------------------------------------------------------------------------
 */
'use strict';
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');

const TEMPLATE_DESC = /^solve the .+ problem\.\s*\(spec not yet reviewed\)\.?$/i;
const BANNED_TEXT = /spec not yet reviewed|coming soon|\bTODO\b|\bTBD\b|lorem ipsum|needs review/i;

/** The seeder's catch-all shell: one opaque string in, one string out. */
function usableCase(tc) {
  if (!tc) return false;
  const i = String(tc.input == null ? '' : tc.input).trim();
  const o = String(tc.output == null ? '' : tc.output).trim();
  return i.length > 0 && o.length > 0;
}

/** True when the signature declares real, named, typed parameters. */
function realSignature(sig) {
  if (!sig || !sig.name || !Array.isArray(sig.params) || sig.params.length === 0) return false;
  const isShell = sig.params.length === 1 && sig.params[0].name === 'input' && sig.params[0].type === 'string';
  return !isShell && sig.params.every((p) => p && p.name && p.type);
}

function classify(p) {
  const samples = (p.sampleTests || []).filter(usableCase);
  const hidden = (p.hiddenTests || []).filter(usableCase);
  const sig = p.functionSignature && p.functionSignature.javascript;
  const desc = String(p.description || '');
  const isTemplate = TEMPLATE_DESC.test(desc.trim());
  const hasBanned = BANNED_TEXT.test(desc);
  const hasFixtures = samples.length > 0 && hidden.length > 0;

  const presentation = [];
  if (desc.trim().length < 80) presentation.push('description too short');
  if (!Array.isArray(p.constraints) || p.constraints.length === 0) presentation.push('missing constraints');
  const inFmt = p.inputFormat || [];
  if (inFmt.length === 0 || inFmt.every((f) => !f || !f.paramName || (f.type === 'string' && f.paramName === 'input'))) {
    presentation.push('generic input format');
  }
  if (!p.outputFormat || !p.outputFormat.type) presentation.push('missing output format');
  if (sig && sig.name === 'solve' && realSignature(sig)) presentation.push('generic function name');

  const missing = [];
  if (isTemplate || hasBanned) missing.push('placeholder description');
  else if (desc.trim().length < 80) missing.push('description too short');
  if (!hasFixtures) missing.push('no executable fixtures');
  if (!realSignature(sig)) missing.push('generic solve(input) shell');

  let bucket;
  if (missing.length === 0 && presentation.length === 0) bucket = 'COMPLETE';
  else if (hasFixtures && realSignature(sig) && !isTemplate && !hasBanned) bucket = 'REPAIRABLE';
  else bucket = 'INCOMPLETE';

  return {
    slug: p.slug, title: p.title, topic: p.topic, difficulty: p.difficulty,
    isActive: p.isActive !== false,
    bucket,
    samples: samples.length, hidden: hidden.length,
    descLen: desc.trim().length,
    constraints: (p.constraints || []).length,
    sigName: sig && sig.name,
    missing, presentation,
  };
}
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const all = await CodingProblem.find({}).lean();
  const rows = all.map(classify);

  const groups = { COMPLETE: [], REPAIRABLE: [], INCOMPLETE: [] };
  rows.forEach((r) => groups[r.bucket].push(r));

  const reasonCounts = {};
  for (const r of rows) {
    for (const reason of r.missing.concat(r.presentation)) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    total: all.length,
    active: rows.filter((r) => r.isActive).length,
    COMPLETE: groups.COMPLETE.length,
    REPAIRABLE: groups.REPAIRABLE.length,
    INCOMPLETE: groups.INCOMPLETE.length,
    reasonCounts,
    repairable: groups.REPAIRABLE.map((r) => ({ slug: r.slug, title: r.title, topic: r.topic, difficulty: r.difficulty, presentation: r.presentation, samples: r.samples, hidden: r.hidden })),
    incomplete: groups.INCOMPLETE.map((r) => ({ slug: r.slug, title: r.title, topic: r.topic, missing: r.missing })),
    complete: groups.COMPLETE.map((r) => ({ slug: r.slug, title: r.title, topic: r.topic, difficulty: r.difficulty })),
  };

  fs.writeFileSync(path.join(__dirname, '_dsa_classify.json'), JSON.stringify(report, null, 2));

  console.log('TOTAL       :', report.total);
  console.log('COMPLETE    :', report.COMPLETE);
  console.log('REPAIRABLE  :', report.REPAIRABLE);
  console.log('INCOMPLETE  :', report.INCOMPLETE);
  console.log('\nREASONS:');
  for (const [k, v] of Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])) console.log('  ' + String(v).padStart(4) + '  ' + k);
  console.log('\nREPAIRABLE LIST:');
  groups.REPAIRABLE.forEach((r) => console.log(`  ${r.title} :: ${r.presentation.join(', ')}`));

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('CLASSIFY FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});