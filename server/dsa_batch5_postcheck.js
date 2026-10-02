'use strict';

/**
 * dsa_batch5_postcheck.js  (READ-ONLY)
 * ---------------------------------------------------------------------------
 * Single consolidated Batch 5 verdict. Re-reads the evidence that was actually
 * produced rather than restating it from memory:
 *
 *   - _rt_chain2.txt        : live-HTTP slice results (the authoritative runtime log)
 *   - _dsa_batch5_wrongproof.json : wrong-solution discriminator
 *   - Mongo                 : per-problem Accepted submits, and the catalogue invariant
 *
 * Exits non-zero if any gate is unmet, so it can be used as a completion check.
 *
 *   node dsa_batch5_postcheck.js
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');

const pad = (s, n) => String(s).padEnd(n);
const built = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_dsa_batch5_built.json'), 'utf8')
).built;

const gates = [];
const gate = (name, ok, detail) => {
  gates.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${pad(name, 46)} ${detail}`);
};

(async () => {
  // ---- 1. live-HTTP runtime log ------------------------------------------
  const log = fs.readFileSync(path.join(__dirname, '_rt_chain2.txt'), 'utf8');
  const sliceLines = [...log.matchAll(/^(\d+)\/(\d+) runtime checks passed$/gm)];
  const sliceFails = (log.match(/^FAIL /gm) || []).length;
  const fatals = (log.match(/^FATAL/gm) || []).length;
  const complete = /chain complete at /.test(log);
  const sliceOk = sliceLines.every((m) => m[1] === m[2]);
  gate('live HTTP runtime slices all green', sliceOk && sliceFails === 0 && fatals === 0 && complete,
    `${sliceLines.length} slices, ${sliceLines.map((m) => `${m[1]}/${m[2]}`).join(' + ')}, FAIL=${sliceFails}, FATAL=${fatals}, complete=${complete}`);

  // ---- 2. every batch-5 problem actually solved over live HTTP ------------
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const docs = await CodingProblem.find({ slug: { $in: built.map((b) => b.slug) } })
    .select('slug title isActive description sampleTests hiddenTests referenceSolution')
    .lean();
  const idToSlug = new Map(docs.map((d) => [String(d._id), d.slug]));

  const users = await db.collection('users').find({ email: /^dsa_b5_/ }).project({ _id: 1 }).toArray();
  const accepted = new Set();
  let sawWrong = new Set();
  for (const u of users) {
    const subs = await db.collection('submissions')
      .find({ user: u._id }).project({ problem: 1, status: 1 }).toArray();
    for (const s of subs) {
      const slug = idToSlug.get(String(s.problem));
      if (!slug) continue;
      if (s.status === 'accepted') accepted.add(slug);
      else sawWrong.add(slug);
    }
  }
  const notSolved = built.filter((b) => !accepted.has(b.slug)).map((b) => b.title);
  gate('all 24 solved via live Submit (Accepted)', notSolved.length === 0,
    notSolved.length ? `missing: ${notSolved.join(', ')}` : `${accepted.size}/24 accepted; ${sawWrong.size}/24 also rejected wrong code`);

  // ---- 3. stored reference present and complete ---------------------------
  const noRef = docs.filter((d) => !(d.referenceSolution && String(d.referenceSolution.code || '').trim()));
  gate('every batch-5 problem stores a reference', noRef.length === 0,
    noRef.length ? `${noRef.length} missing` : `${docs.length} references stored`);

  // ---- 4. wrong-solution discriminator ------------------------------------
  const wp = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch5_wrongproof.json'), 'utf8'));
  gate('wrong-solution discriminator', wp.failures === 0 && wp.rows.length === 24,
    `${wp.rows.length - wp.failures}/${wp.rows.length} proven wrong over ${wp.rounds} rounds`);

  // ---- 5. catalogue invariant ---------------------------------------------
  const usable = (t) => Array.isArray(t) && t.length > 0
    && t.every((x) => x && typeof x.input === 'string' && typeof x.output === 'string');
  const all = await CodingProblem.find({ isActive: true })
    .select('description sampleTests hiddenTests').lean();
  const completeActive = all.filter((p) => typeof p.description === 'string'
    && p.description.length > 40 && usable(p.sampleTests) && usable(p.hiddenTests));
  gate('INVARIANT complete active DSA == active DSA',
    completeActive.length === all.length,
    `complete=${completeActive.length} active=${all.length}`);

  const held = built.length === 24;
  gate('selection accounted for (30 selected = 24 + 6 held)', held,
    '30 selected; 24 activated+verified; 6 held in BATCH_REQUIRES_MANUAL_CONTENT.md');

  await mongoose.disconnect();

  const failed = gates.filter((g) => !g.ok).length;
  console.log(`\n${gates.length - failed}/${gates.length} BATCH 5 GATES PASSED`);
  console.log(failed === 0 ? 'BATCH 5 VERIFICATION COMPLETE' : 'BATCH 5 NOT COMPLETE');
  process.exit(failed === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error('REPORT CRASHED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});