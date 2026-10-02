'use strict';

/**
 * dsa_batch5_progress.js
 * ---------------------------------------------------------------------------
 * READ-ONLY progress probe: how many batch-5 problems have received a real
 * runtime submission from the harness, and with what verdict.
 *
 * The runtime chain buffers its own stdout, so this reads the evidence straight
 * out of Mongo instead of waiting on the log.
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const built = require('./_dsa_batch5_built.json').built;
  const titles = built.map((b) => b.title);

  const docs = await CodingProblem.find({ title: { $in: titles } }).select('title').lean();
  const ids = new Map(docs.map((d) => [d.title, String(d._id)]));

  // DSA submissions are CodeSubmission records: collection `codesubmissions`,
  // keyed by `problem` (an ObjectId ref). The legacy `submissions` collection is
  // a different model and must not be mixed in. The $in list must hold real
  // ObjectIds, not their string forms, or nothing matches.
  const all = await db.collection('codesubmissions')
    .find({ problem: { $in: docs.map((d) => d._id) } })
    .project({ problem: 1, verdict: 1, passedTestCases: 1, totalTestCases: 1 })
    .toArray();

  const byProblem = new Map();
  for (const s of all) {
    const key = String(s.problem);
    if (!byProblem.has(key)) byProblem.set(key, []);
    byProblem.get(key).push(s);
  }

  const rows = titles.map((t) => {
    const id = ids.get(t);
    const subs = (id && byProblem.get(id)) || [];
    return {
      title: t,
      subs: subs.length,
      accepted: subs.filter((s) => s.verdict === 'Accepted').length,
      rejected: subs.filter((s) => s.verdict && s.verdict !== 'Accepted').length,
      hiddenRan: subs.some((s) => (s.totalTestCases || 0) > 3),
    };
  });

  for (const r of rows) {
    const done = r.subs >= 2 && r.accepted >= 1 && r.rejected >= 1;
    console.log(`${done ? 'DONE ' : '---- '} ${String(r.title).padEnd(38)} `
      + `subs=${r.subs} accepted=${r.accepted} rejected=${r.rejected}`);
  }
  const complete = rows.filter((r) => r.subs >= 2 && r.accepted >= 1 && r.rejected >= 1).length;
  console.log(`\n${complete}/${rows.length} problems have runtime proof (accepted + rejected)`);
  console.log(`codesubmissions total: ${await db.collection('codesubmissions').countDocuments({})}`);
  console.log(`legacy submissions total: ${await db.collection('submissions').countDocuments({})}`);

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});