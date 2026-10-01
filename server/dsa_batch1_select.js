/**
 * dsa_batch1_select.js
 * ---------------------------------------------------------------------------
 * READ-ONLY. Selects the next batch of inactive DSA problems in a stable,
 * deterministic order and dumps EVERY piece of evidence the repository holds
 * for each one, so the batch can be decided on facts rather than assumptions.
 *
 * Ordering: problemId ASC (the canonical stable key on this collection;
 * CodingProblem has no `problemNumber`).
 * ---------------------------------------------------------------------------
 */
'use strict';
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');
const Problem = require('./models/Problem');

const BATCH_SIZE = 20;

/** Reference implementations shipped by the repo, keyed by title. */
function loadRepoSources() {
  const out = { curated: new Set(), solvers: new Set(), batches: new Map(), legacy: null };

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
      const titles = Array.isArray(mod.BATCH_TITLES) ? mod.BATCH_TITLES : [];
      out.batches.set(b, new Set(titles));
    } catch (_) { /* optional */ }
  }

  return out;
}

/** Titles present in the legacy `problems` collection. */
async function loadLegacy() {
  const map = new Map();
  const rows = await Problem.find({ category: 'DSA' }).lean();
  for (const r of rows) map.set(r.title, r);
  return map;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const sources = loadRepoSources();
  const legacy = await loadLegacy();

  const inactive = await CodingProblem.find({ isActive: false })
    .sort({ problemId: 1 })
    .lean();

  const batch = inactive.slice(0, BATCH_SIZE);

  const evidence = batch.map((p) => {
    const leg = legacy.get(p.title) || null;
    const legacyCases = leg
      ? {
        descLen: String(leg.description || '').length,
        examples: (leg.examples || []).length,
        testCases: (leg.testCases || []).length,
        constraints: (leg.constraints || []).length,
        hasSignature: !!(leg.functionSignature && leg.functionSignature.javascript),
        hasSolution: !!(leg.solution || leg.referenceSolution),
      }
      : null;

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
      legacy: legacyCases,
    };
  });

  fs.writeFileSync(path.join(__dirname, '_dsa_batch1_evidence.json'),
    JSON.stringify({ totalInactive: inactive.length, batch: evidence }, null, 2));

  console.log(`inactive total: ${inactive.length}`);
  console.log(`\nBATCH 1 (problemId ASC)\n`);
  evidence.forEach((e, i) => {
    const src = [
      e.inCurated && 'curated',
      e.inSolvers && 'solvers',
      e.inBatches.length && e.inBatches.join('+'),
      e.legacy && 'legacy',
    ].filter(Boolean).join(',') || 'NONE';
    console.log(`${String(i + 1).padStart(2)}. [${e.problemId}] ${e.title}`);
    console.log(`    topic=${e.topic} diff=${e.difficulty} descLen=${e.descLen} `
      + `samples=${e.samples} hidden=${e.hidden} sources=${src}`);
    if (e.legacy) {
      console.log(`    legacy: descLen=${e.legacy.descLen} examples=${e.legacy.examples} `
        + `testCases=${e.legacy.testCases} constraints=${e.legacy.constraints} `
        + `sig=${e.legacy.hasSignature} sol=${e.legacy.hasSolution}`);
    }
  });

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});