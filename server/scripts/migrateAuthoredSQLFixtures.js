'use strict';
// Exact-title content migration: authored fixtures from scripts/seedSQLProblems.js
// -> canonical sqlproblems docs. DRY-RUN by default; pass --apply to write.
//
// Safety rails:
//  1. Only docs whose title EXACTLY matches an authored source entry are considered.
//  2. A matched doc is only overwritten while it still carries seeded-placeholder
//     fingerprints (utils/placeholderFixtures); authored content is never touched.
//  3. --apply first re-validates every source entry against the real sandbox
//     (reference solution vs stored expected rows, sample + hidden) and aborts
//     the whole migration if any entry fails.
//  4. Stale generic fixture metadata (schemaTables/examples injected by
//     backfillSQLProblemStructure.js) is cleared, not carried forward.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const SQLProblem = require('../models/SQLProblem');
const PLACEHOLDER = require('../utils/placeholderFixtures');
const { runSQL } = require('../utils/sqlRunner');
const { normalizeSqlRows, schemaForCase } = require('../utils/sqlCaseRunner');
const SOURCED = require('./seedSQLProblems.js');

const APPLY = process.argv.includes('--apply');
const OUT = path.join(__dirname, '..', '_migration_authored_sql_report.json');

function isPlaceholderDoc(doc) {
  return PLACEHOLDER.isPlaceholderSchemaSetup(doc.schemaSetupSQL)
    || PLACEHOLDER.isPlaceholderReferenceSQL(doc.referenceSolutionSQL)
    || PLACEHOLDER.isPlaceholderSampleRows((doc.sampleTestCases || [])[0] && doc.sampleTestCases[0].expectedOutputRows)
    || PLACEHOLDER.isPlaceholderHiddenTestCases(doc.hiddenTestCases)
    || PLACEHOLDER.isPlaceholderDescription(doc.description)
    || PLACEHOLDER.isGenericEmployeesSchema(doc.schemaTables)
    || PLACEHOLDER.isGenericEmployeesExample(doc.examples);
}

async function validateSource(src) {
  const groups = [
    ['sample', src.sampleTestCases || []],
    ['hidden', src.hiddenTestCases || []],
  ];
  for (const [kind, cases] of groups) {
    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      const r = await runSQL({
        query: src.referenceSolutionSQL,
        schemaSetup: schemaForCase(src.schemaSetupSQL, tc.inputStateSQL),
        timeoutMs: 5000,
      });
      if (!r.success) return { ok: false, detail: `${kind}[${i}] exec: ${r.error}` };
      const actual = JSON.stringify(normalizeSqlRows(r.data.rows));
      const expected = JSON.stringify(normalizeSqlRows(tc.expectedOutputRows || []));
      if (actual !== expected) {
        return { ok: false, detail: `${kind}[${i}] mismatch actual=${actual.slice(0, 120)} expected=${expected.slice(0, 120)}` };
      }
    }
  }
  return { ok: true };
}

function contentFields(src) {
  return {
    description: src.description,
    difficulty: src.difficulty,
    topic: src.topic,
    tags: src.tags || [],
    schemaSetupSQL: src.schemaSetupSQL,
    sampleTestCases: src.sampleTestCases || [],
    hiddenTestCases: src.hiddenTestCases || [],
    referenceSolutionSQL: src.referenceSolutionSQL,
  };
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI required');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  const report = {
    generatedAt: new Date().toISOString(),
    mode: APPLY ? 'apply' : 'dry-run',
    sourceCount: SOURCED.length,
    matched: [],
    unmatched: [],
    refused: [],
    updated: [],
    validationFailures: [],
  };

  // --apply: validate every source entry BEFORE any write.
  if (APPLY) {
    for (const src of SOURCED) {
      const v = await validateSource(src);
      if (!v.ok) report.validationFailures.push({ title: src.title, detail: v.detail });
    }
    if (report.validationFailures.length) {
      console.error('ABORT: source fixture validation failed; nothing written.');
      report.validationFailures.forEach((f) => console.error('  INVALID ' + f.title + ' :: ' + f.detail));
      fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
      await mongoose.disconnect();
      process.exit(1);
    }
    console.log(`Source validation: ${SOURCED.length}/${SOURCED.length} authored entries reproduce their expected rows.`);
  }

  for (const src of SOURCED) {
    const docs = await SQLProblem.find({ title: src.title }).lean(); // exact-title
    if (docs.length === 0) {
      report.unmatched.push(src.title);
      console.log('SKIP (no exact-title match): ' + src.title);
      continue;
    }
    if (docs.length > 1) {
      report.refused.push({ title: src.title, reason: `ambiguous: ${docs.length} title matches` });
      console.log('REFUSE (ambiguous): ' + src.title);
      continue;
    }
    const doc = docs[0];
    if (!isPlaceholderDoc(doc)) {
      report.refused.push({ title: src.title, reason: 'not a placeholder doc — refusing to overwrite authored content' });
      console.log('REFUSE (non-placeholder): ' + src.title);
      continue;
    }
    report.matched.push({ title: src.title, id: String(doc._id), active: doc.isActive });
    if (!APPLY) {
      console.log('MATCH (placeholder, would update): ' + src.title);
      continue;
    }

    const $set = contentFields(src);
    const cleared = [];
    if (PLACEHOLDER.isGenericEmployeesSchema(doc.schemaTables)) { $set.schemaTables = []; cleared.push('schemaTables'); }
    if (PLACEHOLDER.isGenericEmployeesExample(doc.examples)) { $set.examples = []; cleared.push('examples'); }
    const currentTopics = Array.isArray(doc.topics) ? doc.topics : [];
    if (currentTopics.length === 0) {
      $set.topics = [...new Set([src.topic, ...(src.tags || [])])].filter(Boolean);
      cleared.push('topics(backfilled)');
    }
    await SQLProblem.updateOne({ _id: doc._id }, { $set });
    report.updated.push({ title: src.title, id: String(doc._id), cleared });
    console.log('UPDATED: ' + src.title + (cleared.length ? '  [cleared: ' + cleared.join(', ') + ']' : ''));
  }

  console.log('\n=== migration ' + report.mode + ' summary ===');
  console.log('source entries        : ' + SOURCED.length);
  console.log('exact-title matches   : ' + report.matched.length);
  console.log('unmatched (skipped)   : ' + report.unmatched.length
    + (report.unmatched.length ? ' -> ' + JSON.stringify(report.unmatched) : ''));
  console.log('refused (guards)      : ' + report.refused.length);
  console.log('updated               : ' + report.updated.length);
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log('report -> ' + OUT);
  await mongoose.disconnect();
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
