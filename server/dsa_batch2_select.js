'use strict';

/**
 * dsa_batch2_select.js
 * ---------------------------------------------------------------------------
 * READ-ONLY. Selects the next 20 inactive DSA problems after the ones batch 1
 * already handled, in the same deterministic order (problemId ASC), and dumps
 * the evidence the repository holds for each.
 *
 * Ordering is stable and resumable: batch 1's targets are read back from its
 * fingerprint so this run always continues where the last one stopped rather
 * than re-examining work that is already done.
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');
const Problem = require('./models/Problem');

const BATCH_SIZE = 20;

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

  const doneTitles = new Set();
  const b1 = path.join(__dirname, '_dsa_batch1_before.json');
  if (fs.existsSync(b1)) {
    for (const t of JSON.parse(fs.readFileSync(b1, 'utf8')).targets) doneTitles.add(t.title);
  }

  const inactive = await CodingProblem.find({ isActive: false }).sort({ problemId: 1 }).lean();
  const remaining = inactive.filter((p) => !doneTitles.has(p.title));
  const batch = remaining.slice(0, BATCH_SIZE);

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
    };
  });

  fs.writeFileSync(path.join(__dirname, '_dsa_batch2_evidence.json'),
    JSON.stringify({ inactiveTotal: inactive.length, skippedHandled: doneTitles.size, batch: evidence }, null, 2));

  console.log(`inactive total      : ${inactive.length}`);
  console.log(`already handled (b1): ${doneTitles.size}`);
  console.log(`eligible            : ${remaining.length}\n`);
  console.log('BATCH 2 (problemId ASC)\n');

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