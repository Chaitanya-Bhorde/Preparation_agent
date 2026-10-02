'use strict';

/**
 * dsa_batch6_postcheck.js  (READ-ONLY)
 * ---------------------------------------------------------------------------
 * Single consolidated Batch 6 verdict. Re-reads the evidence that was actually
 * produced rather than restating it from memory:
 *
 *   - _rt_b6_chain.txt            : live-HTTP slice results (authoritative log)
 *   - _dsa_batch6_wrongproof.json : wrong-solution discriminator
 *   - Mongo                       : per-problem Accepted submits, plus the
 *                                   catalogue invariant COMPLETE == ACTIVE
 *
 * DSA submissions are CodeSubmission records in `codesubmissions`, keyed by
 * `problem` and carrying `verdict`; the legacy `submissions` collection uses
 * `status` and must NOT be mixed in here.
 *
 * Exits non-zero if any gate is unmet, so it can be used as a completion check.
 *
 *   node dsa_batch6_postcheck.js
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');

const pad = (s, n) => String(s).padEnd(n);
const built = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_dsa_batch6_built.json'), 'utf8')
).built;

const gates = [];
const gate = (name, ok, detail) => {
  gates.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${pad(name, 48)} ${detail}`);
};

(async () => {
  // ---- 1. live-HTTP runtime log -------------------------------------------
  const log = fs.readFileSync(path.join(__dirname, '_rt_b6_chain.txt'), 'utf8');
  const sliceLines = [...log.matchAll(/^(\d+)\/(\d+) runtime checks passed$/gm)];
  const sliceFails = (log.match(/^FAIL /gm) || []).length;
  const fatals = (log.match(/^FATAL/gm) || []).length;
  const nonZero = (log.match(/EXITED NON-ZERO/g) || []).length;
  const complete = /chain complete at /.test(log);
  const sliceOk = sliceLines.length > 0 && sliceLines.every((m) => m[1] === m[2]);
  gate('live HTTP runtime slices all green',
    sliceOk && sliceFails === 0 && fatals === 0 && nonZero === 0 && complete,
    `${sliceLines.length} slices, ${sliceLines.map((m) => `${m[1]}/${m[2]}`).join(' + ')}, `
    + `FAIL=${sliceFails}, FATAL=${fatals}, EXITED_NON_ZERO=${nonZero}, complete=${complete}`);

// ---- 2. every batch-6 problem solved via live Submit, wrong code rejected -
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const docs = await CodingProblem.find({ slug: { $in: built.map((b) => b.slug) } })
    .select('slug title isActive description sampleTests hiddenTests referenceSolution')
    .lean();
  const idToSlug = new Map(docs.map((d) => [String(d._id), d.slug]));

  const users = await db.collection('users').find({ email: /^dsa_b6_/ }).project({ _id: 1 }).toArray();
  const accepted = new Set();
  const rejected = new Set();
  for (const u of users) {
    const subs = await db.collection('codesubmissions')
      .find({ user: u._id }).project({ problem: 1, verdict: 1 }).toArray();
    for (const s of subs) {
      const slug = idToSlug.get(String(s.problem));
      if (!slug) continue;
      if (s.verdict === 'Accepted') accepted.add(slug);
      else if (s.verdict) rejected.add(slug);
    }
  }
  const notSolved = built.filter((b) => !accepted.has(b.slug)).map((b) => b.title);
  const notRejected = built.filter((b) => !rejected.has(b.slug)).map((b) => b.title);
  gate(`all ${built.length} solved via live Submit (Accepted)`, notSolved.length === 0,
    notSolved.length ? `missing: ${notSolved.join(', ')}` : `${accepted.size}/${built.length} accepted`);
  gate('wrong Submit rejected on every problem', notRejected.length === 0,
    notRejected.length ? `no rejection for: ${notRejected.join(', ')}` : `${rejected.size}/${built.length} rejected wrong code`);

  // ---- 3. hidden + sample tests stored --------------------------------------
  const noHidden = docs.filter((d) => !Array.isArray(d.hiddenTests) || d.hiddenTests.length === 0);
  const noSamples = docs.filter((d) => !Array.isArray(d.sampleTests) || d.sampleTests.length === 0);
  gate('every problem stores hidden + sample tests',
    noHidden.length === 0 && noSamples.length === 0,
    `${docs.length - noHidden.length}/${docs.length} with hidden tests, `
    + `${docs.length - noSamples.length}/${docs.length} with sample tests`);

  // ---- 4. stored reference present ------------------------------------------
  const noRef = docs.filter((d) => !(d.referenceSolution && String(d.referenceSolution.code || '').trim()));
  gate('every batch-6 problem stores a reference', noRef.length === 0,
    noRef.length ? `${noRef.length} missing` : `${docs.length} references stored`);

  // ---- 5. wrong-solution discriminator --------------------------------------
  const wp = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch6_wrongproof.json'), 'utf8'));
  gate('wrong-solution discriminator', wp.failures === 0 && wp.rows.length === built.length,
    `${wp.rows.length - wp.failures}/${wp.rows.length} proven wrong over ${wp.rounds} rounds`);

  // ---- 6. all activated ------------------------------------------------------
  const inactive = docs.filter((d) => d.isActive !== true);
  gate('every batch-6 problem is active', inactive.length === 0,
    inactive.length ? `${inactive.length} inactive` : `${docs.length}/${built.length} active`);

// ---- 7. catalogue invariant ------------------------------------------------
  const usable = (t) => Array.isArray(t) && t.length > 0
    && t.every((x) => x && typeof x.input === 'string' && typeof x.output === 'string');
  const all = await CodingProblem.find({ isActive: true })
    .select('description sampleTests hiddenTests').lean();
  const completeActive = all.filter((p) => typeof p.description === 'string'
    && p.description.length > 40 && usable(p.sampleTests) && usable(p.hiddenTests));
  gate('INVARIANT complete active DSA == active DSA',
    completeActive.length === all.length,
    `complete=${completeActive.length} active=${all.length}`);

  // ---- 8. selection accounted for -------------------------------------------
  const decision = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch6_decision.json'), 'utf8'));
  const unambiguous = decision.filter((r) => r.unambiguous).length;
  gate('selection accounted for (50 = activated + held)',
    decision.length === 50 && unambiguous === built.length,
    `${decision.length} selected; ${built.length} activated+verified; `
    + `${decision.length - unambiguous} held for manual review`);

  await mongoose.disconnect();

  const failed = gates.filter((g) => !g.ok).length;
  console.log(`\n${gates.length - failed}/${gates.length} BATCH 6 GATES PASSED`);
  console.log(failed === 0 ? 'BATCH 6 VERIFICATION COMPLETE' : 'BATCH 6 NOT COMPLETE');
  process.exit(failed === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error('REPORT CRASHED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});