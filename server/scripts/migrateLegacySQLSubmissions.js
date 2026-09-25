'use strict';
/**
 * migrateLegacySQLSubmissions.js
 * ---------------------------------------------------------------------------
 * Repairs SQLSubmission documents written by an OLDER schema generation so the
 * current SQL analytics / heatmap / streak aggregations can see them.
 *
 * WHY: analyticsController.loadSqlSubmissions() selects
 *   `status problem difficulty topics createdAt`
 * and counts `status === 'accepted'`. Legacy rows instead carry
 *   `submittedQuery`, `testCasesPassed`, `problemDifficulty`, `problemTags`,
 * status `'passed' | 'failed'`, and NO createdAt/updatedAt.
 * Result: those rows are invisible to the SQL heatmap/streak and are never
 * counted as solved (real submissions silently missing from analytics).
 *
 * SAFETY:
 *  - DRY RUN by default. Nothing is written unless you pass --apply.
 *  - Non-destructive: original fields are left in place; canonical fields are
 *    added alongside them, and `migratedFrom` records the provenance.
 *  - createdAt is taken from the ObjectId's own embedded timestamp. That is the
 *    document's TRUE creation time — it is never invented.
 *  - Existing canonical values always win; only missing fields are filled.
 *
 * USAGE:
 *   node scripts/migrateLegacySQLSubmissions.js           # dry run (report only)
 *   node scripts/migrateLegacySQLSubmissions.js --apply   # write changes
 */
require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const SQLSubmission = require(path.join(__dirname, '..', 'models', 'SQLSubmission'));

const APPLY = process.argv.includes('--apply');

const STATUS_MAP = {
  passed: 'accepted',
  failed: 'wrong_answer',
  error: 'runtime_error',
  timeout: 'time_limit',
  'time limit': 'time_limit',
};
const VALID_STATUS = ['accepted', 'wrong_answer', 'runtime_error', 'time_limit', 'syntax_error', 'pending'];

function canonicalStatus(raw) {
  const s = String(raw || '').toLowerCase().trim();
  if (VALID_STATUS.includes(s)) return s;
  return STATUS_MAP[s] || 'wrong_answer';
}

(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) { console.error('No MONGO_URI/MONGODB_URI in env'); process.exit(1); }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  console.log(`Connected: ${mongoose.connection.name}  |  MODE: ${APPLY ? 'APPLY (writes)' : 'DRY RUN (no writes)'}`);

  const docs = await SQLSubmission.collection.find({}).toArray();
  console.log(`Scanning ${docs.length} SQLSubmission documents...\n`);

  const plan = [];
  for (const d of docs) {
    const set = {};
    const notes = [];
    if (d.query === undefined && d.submittedQuery !== undefined) { set.query = d.submittedQuery; notes.push('query<-submittedQuery'); }
    if (d.passedTestCases === undefined && d.testCasesPassed !== undefined) { set.passedTestCases = d.testCasesPassed; notes.push('passedTestCases<-testCasesPassed'); }
    if (d.difficulty === undefined && d.problemDifficulty !== undefined) { set.difficulty = d.problemDifficulty; notes.push('difficulty<-problemDifficulty'); }
    if ((!d.topics || !d.topics.length) && Array.isArray(d.problemTags) && d.problemTags.length) { set.topics = d.problemTags; notes.push('topics<-problemTags'); }
    const cs = canonicalStatus(d.status);
    if (cs !== d.status) { set.status = cs; notes.push(`status ${d.status}->${cs}`); }
    if (!d.createdAt) {
      const ts = d._id && typeof d._id.getTimestamp === 'function' ? d._id.getTimestamp() : null;
      if (ts) { set.createdAt = ts; set.updatedAt = ts; notes.push(`createdAt<-#_id (${ts.toISOString()})`); }
      else notes.push('NO createdAt source (unsafe, skipped)');
    }
    if (!d.type) { set.type = 'submit'; notes.push('type<-submit'); }
    if (Object.keys(set).length) { set.migratedFrom = 'legacy-schema-v1'; plan.push({ id: d._id, set, notes }); }
  }

  console.log(`Documents needing migration: ${plan.length} / ${docs.length}\n`);
  plan.forEach((p, i) => {
    console.log(`  ${i + 1}. ${String(p.id)}`);
    p.notes.forEach((n) => console.log(`       - ${n}`));
  });

  if (!APPLY) {
    console.log('\nDRY RUN complete. Re-run with --apply to write these changes.');
    await mongoose.disconnect();
    return;
  }

  let written = 0;
  for (const p of plan) {
    await SQLSubmission.collection.updateOne({ _id: p.id }, { $set: p.set });
    written += 1;
  }
  console.log(`\nApplied: ${written} document(s) updated.`);
  await mongoose.disconnect();
  console.log('Done.');
})().catch(async (e) => {
  console.error('FATAL:', e);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
