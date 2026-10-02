'use strict';

/**
 * dsa_batch6_select.js
 * ---------------------------------------------------------------------------
 * READ-ONLY. Selects the next 50 inactive DSA problems after the ones batches
 * 1-5 already handled, in the same deterministic order (problemId ASC, _id ASC
 * as tie-breaker), and dumps the evidence the repository holds for each.
 *
 * Ordering is stable and resumable: earlier batches' targets are read back from
 * their snapshots so this run always continues where batch 5 stopped rather
 * than re-examining work that is already done. Batch 5 is read from its
 * `_dsa_batch5_before.json` snapshot for the same reason.
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');
const Problem = require('./models/Problem');

const BATCH_SIZE = 50;

function loadRepoSources() {
  const out = { curated: new Set(), solvers: new Set(), batches: new Map() };
  try {
    const { CURATED } = require('./scripts/curatedProblems');
    Object.keys(CURATED).forEach((t) => out.curated.add(t));
  } catch (_) { /* optional */ }
  try {
    const src = fs.readFileSync(path.join(__dirname, 'scripts/testCaseGenerators.js'), 'utf8');
    for (const m of src.matchAll(/^SOLVERS\['(.+?)'\]/gm)) out.solvers.add(m[1]);
  } catch (_) { /* optional */ }
  for (const b of ['authoredDsaBatch1', 'authoredDsaBatch2', 'authoredDsaBatch3',
    'authoredDsaBatch4', 'authoredDsaBatch5']) {
    try {
      const mod = require(path.join(__dirname, 'scripts', b));
      out.batches.set(b, new Set(Array.isArray(mod.BATCH_TITLES) ? mod.BATCH_TITLES : []));
    } catch (_) { /* optional */ }
  }
  return out;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const sources = loadRepoSources();

  const legacy = new Map();
  for (const r of await Problem.find({ category: 'DSA' }).lean()) legacy.set(r.title, r);

  // Batches 1-5 are done. Reading every snapshot keeps this selection
  // resumable and prevents re-examining work that is complete.
  const doneTitles = new Set();
  for (const f of ['_dsa_batch1_before.json', '_dsa_batch2_before.json', '_dsa_batch3_before.json',
    '_dsa_batch4_before.json', '_dsa_batch5_before.json']) {
    const p = path.join(__dirname, f);
    if (!fs.existsSync(p)) continue;
    for (const t of JSON.parse(fs.readFileSync(p, 'utf8')).targets) doneTitles.add(t.title);
  }

  const inactive = await CodingProblem.find({ isActive: false })
    .sort({ problemId: 1, _id: 1 })
    .lean();
  const remaining = inactive.filter((p) => !doneTitles.has(p.title));
  const batch = remaining.slice(0, BATCH_SIZE);

  // Titles already published as ACTIVE, so batch 6 can be checked for
  // duplicates before anything is authored.
  const activeTitles = new Set((await CodingProblem.find({ isActive: true })
    .select('title').lean()).map((p) => p.title));

  const evidence = batch.map((p) => {
    const leg = legacy.get(p.title) || null;
    return {
      id: String(p._id),
      problemId: p.problemId,
      title: p.title,
      topic: p.topic,
      difficulty: p.difficulty,
      tags: p.tags || [],
      descLen: String(p.description || '').length,
      samples: (p.sampleTests || []).length,
      hidden: (p.hiddenTests || []).length,
      inCurated: sources.curated.has(p.title),
      inSolvers: sources.solvers.has(p.title),
      inBatches: [...sources.batches.entries()].filter(([, s]) => s.has(p.title)).map(([b]) => b),
      legacyCases: leg ? (leg.examples || []).length + (leg.testCases || []).length : 0,
      legacyDescLen: leg ? String(leg.description || '').length : 0,
      alreadyActive: activeTitles.has(p.title),
    };
  });

  fs.writeFileSync(path.join(__dirname, '_dsa_batch6_evidence.json'),
    JSON.stringify({ inactiveTotal: inactive.length, skippedHandled: doneTitles.size, batch: evidence }, null, 2));

  console.log(`inactive total      : ${inactive.length}`);
  console.log(`already handled 1-5 : ${doneTitles.size}`);
  console.log(`eligible            : ${remaining.length}\n`);
  console.log('batch 6 (problemId ASC, _id ASC tie-break)\n');

  evidence.forEach((e, i) => {
    const src = [
      e.inCurated && 'curated', e.inSolvers && 'solvers',
      e.inBatches.length && e.inBatches.join('+'),
      e.legacyCases > 0 && 'legacy',
    ].filter(Boolean).join(',') || 'NONE';
    console.log(`${String(i + 1).padStart(2)}. [${e.problemId}] ${e.title}`);
    console.log(`    topic=${e.topic} diff=${e.difficulty} tags=${e.tags.join(',')}`);
    console.log(`    descLen=${e.descLen} samples=${e.samples} hidden=${e.hidden} sources=${src}`);
  });

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});