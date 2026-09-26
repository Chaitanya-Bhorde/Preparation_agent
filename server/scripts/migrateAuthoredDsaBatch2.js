'use strict';
/* ---------------------------------------------------------------------------
 * migrateAuthoredDsaBatch2.js
 * Guarded content migration: scripts/authoredDsaBatch2.js -> canonical
 * codingproblems docs. DRY-RUN by default; pass --apply to write.
 *
 * Safety rails (same contract as migrateAuthoredDsaBatch1.js):
 *  1. --apply first re-runs scripts/validateAuthoredDsaBatch2.js (offline,
 *     fail-closed: identity, audit replica, provenance, execution of every
 *     fixture in JavaScript/Java/C++, 4-language template compilation) and
 *     aborts if it does not PASS.
 *  2. Every payload record must match EXACTLY ONE doc by title, and that doc's
 *     slug must equal the payload slug; anything else is refused.
 *  3. $set is limited to the content-field whitelist below; _id, problemId,
 *     slug, isActive, createdBy, likes and all user/submission state are never
 *     written. Protected collections are only COUNTED (read-only), before and
 *     after, and the counts must match.
 *  4. Scope guard: the canonical DSA total must not change.
 *
 * MongoDB unreachable => connection fails => exit 1 (fail-closed; no writes).
 * Report -> server/_migration_authored_dsa_batch2_report.json
 * --------------------------------------------------------------------------- */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const CodingProblem = require('../models/CodingProblem');
const batch = require('./authoredDsaBatch2');

const APPLY = process.argv.includes('--apply');
const OUT = path.join(__dirname, '..', '_migration_authored_dsa_batch2_report.json');
const VALIDATOR = path.join(__dirname, 'validateAuthoredDsaBatch2.js');

/* Content fields this migration is allowed to write (schema-backed only). */
const FIELD_WHITELIST = [
  'description', 'difficulty', 'topic', 'tags', 'constraints', 'examples',
  'sampleTests', 'hiddenTests', 'starterCode', 'functionSignature',
  'referenceSolution', 'inputFormat', 'outputFormat', 'timeLimitMs', 'memoryLimitKb',
];

/* Collections whose document counts are recorded (read-only) and must not move. */
const PROTECTED_COLLECTIONS = [
  'users', 'submissions', 'codesubmissions', 'sqlsubmissions', 'drafts', 'problems', 'sqlproblems',
];

function pickFields(record) {
  const $set = {};
  for (const f of FIELD_WHITELIST) {
    if (record[f] !== undefined) $set[f] = record[f];
  }
  const extra = Object.keys(record).filter((k) => k !== 'provenance' && !(k in $set) && ![
    'slug', 'title', '_id',
  ].includes(k));
  if (extra.length) throw new Error(`migrateAuthoredDsaBatch2: unexpected record fields for "${record.title}": ${extra.join(', ')}`);
  return $set;
}

function runOfflineValidator() {
  console.log('Pre-apply validation: running scripts/validateAuthoredDsaBatch2.js ...');
  try {
    execFileSync(process.execPath, [VALIDATOR], { stdio: 'inherit', timeout: 20 * 60 * 1000 });
    return true;
  } catch (e) {
    console.error('ABORT: offline validator did not PASS; nothing written. code=' + (e.status != null ? e.status : e.message));
    return false;
  }
}

async function protectedCounts() {
  const counts = {};
  for (const name of PROTECTED_COLLECTIONS) {
    try {
      counts[name] = await mongoose.connection.db.collection(name).countDocuments();
    } catch (e) {
      counts[name] = 'unavailable: ' + e.message;
    }
  }
  return counts;
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set; refusing to run.');
  if (APPLY && !runOfflineValidator()) throw new Error('offline validator failed; nothing written.');

  const records = batch.records;
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 25000 });
  console.log('CONNECTED: ' + mongoose.connection.name);

  const canonicalBefore = await CodingProblem.countDocuments({});
  console.log('canonical DSA documents before: ' + canonicalBefore);
  const report = {
    generatedAt: new Date().toISOString(),
    mode: APPLY ? 'apply' : 'dry-run',
    sourceCount: records.length,
    canonicalBefore,
    canonicalAfter: null,
    matched: [],
    unmatched: [],
    refused: [],
    updated: [],
    protectedBefore: await protectedCounts(),
    protectedAfter: null,
    protectedCountsChanged: null,
  };

  for (const r of records) {
    const docs = await CodingProblem.find({ title: r.title }).lean();
    if (docs.length === 0) {
      report.unmatched.push(r.title);
      console.log('SKIP (no exact-title match): ' + r.title);
      continue;
    }
    if (docs.length > 1) {
      report.refused.push({ title: r.title, reason: `ambiguous: ${docs.length} title matches` });
      console.log('REFUSE (ambiguous): ' + r.title);
      continue;
    }
    const doc = docs[0];
    if (doc.slug !== r.slug) {
      report.refused.push({ title: r.title, reason: `slug mismatch: db=${doc.slug} payload=${r.slug}` });
      console.log('REFUSE (slug mismatch): ' + r.title);
      continue;
    }
    const before = {
      id: String(doc._id),
      active: doc.isActive,
      descriptionLength: String(doc.description || '').length,
      sampleTests: (doc.sampleTests || []).length,
      hiddenTests: (doc.hiddenTests || []).length,
      timeLimitMs: doc.timeLimitMs,
    };
    report.matched.push({ title: r.title, id: before.id, active: before.active, before });
    if (!APPLY) {
      console.log('MATCH (would update): ' + r.title
        + `  desc ${before.descriptionLength}->${String(r.description).length}`
        + `  samples ${before.sampleTests}->${r.sampleTests.length}`
        + `  hidden ${before.hiddenTests}->${r.hiddenTests.length}`);
      continue;
    }
    const $set = pickFields(r);
    await CodingProblem.updateOne({ _id: doc._id, title: r.title, slug: r.slug }, { $set });
    report.updated.push({ title: r.title, id: before.id, fields: Object.keys($set) });
    console.log('UPDATED: ' + r.title + '  [' + Object.keys($set).join(', ') + ']');
  }

  if (APPLY) {
    report.canonicalAfter = await CodingProblem.countDocuments({});
    console.log('canonical DSA documents after: ' + report.canonicalAfter);
    if (report.canonicalAfter !== report.canonicalBefore) {
      console.error('CRITICAL: canonical DSA document count changed — investigate immediately.');
    }
    report.protectedAfter = await protectedCounts();
    report.protectedCountsChanged = JSON.stringify(report.protectedBefore) !== JSON.stringify(report.protectedAfter);
    if (report.protectedCountsChanged) {
      console.error('CRITICAL: protected collection counts changed during apply — investigate immediately.');
      console.error('  before=' + JSON.stringify(report.protectedBefore));
      console.error('  after =' + JSON.stringify(report.protectedAfter));
    }
  }

  console.log('\n=== migration ' + report.mode + ' summary ===');
  console.log('payload records        : ' + records.length);
  console.log('exact title+slug match : ' + report.matched.length);
  console.log('unmatched (skipped)    : ' + report.unmatched.length + (report.unmatched.length ? ' -> ' + JSON.stringify(report.unmatched) : ''));
  console.log('refused (guards)       : ' + report.refused.length + (report.refused.length ? ' -> ' + JSON.stringify(report.refused) : ''));
  console.log('updated                : ' + report.updated.length);
  if (APPLY) {
    console.log('canonical total        : ' + report.canonicalBefore + ' -> ' + report.canonicalAfter);
    console.log('protected changed      : ' + report.protectedCountsChanged);
  } else {
    console.log('next step (when DB is reachable): re-run with --apply, then `node full_audit.js` and `node verify_execution.js`.');
  }
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8');
  console.log('report -> ' + OUT);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('FATAL (fail-closed, nothing written): ' + (e && e.message ? e.message : e));
  process.exit(1);
});

