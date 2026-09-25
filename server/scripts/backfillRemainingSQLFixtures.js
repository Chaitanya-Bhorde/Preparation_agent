'use strict';
/**
 * Backfill authored schema + derived fixtures for the REMAINING placeholder SQL
 * problems (the 32 active test_table docs + the inactive review sentinel's
 * description). Mirrors scripts/migrateAuthoredSQLFixtures.js safety rails:
 *   - dry run by default; --apply gated
 *   - exact title match + slug assertion; refuses ambiguity
 *   - refuses docs whose schema is no longer the placeholder (re-run guard)
 *   - derives sample/hidden expected rows by executing the reference in the
 *     sandbox TWICE (determinism gate) before any write
 *   - re-checks canonical placeholder predicates + audit description rules on
 *     the NEW content; a single failing entry aborts the whole run
 *   - writes _backfill_remaining_sql_report.json (validation evidence)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const SQLProblem = require('../models/SQLProblem');
const { executeSQL } = require('../utils/sqlSandbox');
const PH = require('../utils/placeholderFixtures');
const fixtures = require('./authoredSQLFixturesRemaining');

const APPLY = process.argv.includes('--apply');
const REPORT = path.join(__dirname, '..', '_backfill_remaining_sql_report.json');
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const PLACEHOLDER_DESC_RE = /TODO|TBD|FIXME|not yet reviewed|placeholder|lorem ipsum|coming soon|XXX/i;

/** Same composition sqlCaseRunner.schemaForCase uses: schema then mutation. */
const caseSchema = (schema, input) => [schema, input]
  .map((s) => String(s || '').trim())
  .filter(Boolean)
  .join('\n');

/** Execute reference twice; require success, identical JSON, non-empty object rows. */
async function deriveRows(query, schema) {
  const runs = [];
  for (let i = 0; i < 2; i += 1) {
    const r = await executeSQL({ query, schemaSetup: schema, timeoutMs: 5000 });
    if (!r.success || !r.data) return { ok: false, error: String(r.error || 'no data') };
    runs.push(JSON.stringify(r.data.rows));
  }
  if (runs[0] !== runs[1]) return { ok: false, error: 'non-deterministic across two runs' };
  const rows = JSON.parse(runs[0]);
  if (!Array.isArray(rows) || rows.length === 0) return { ok: false, error: 'empty result' };
  if (rows.some((r) => !r || typeof r !== 'object' || Array.isArray(r))) return { ok: false, error: 'non-object row' };
  if (rows.some((r) => Object.keys(r).length === 0)) return { ok: false, error: 'row with no columns' };
  if (rows.some((r) => Object.values(r).some((v) => v === undefined))) return { ok: false, error: 'row contains undefined' };
  return { ok: true, rows };
}

/** Mirrors full_audit.js auditSql description rules (issues only). */
function checkDescription(desc) {
  const issues = [];
  const d = String(desc || '');
  if (d.trim().length < 40) issues.push('description shorter than 40 chars');
  if (PLACEHOLDER_DESC_RE.test(d)) issues.push('placeholder word in description');
  if (PH.isPlaceholderDescription(d)) issues.push('description shaped like the seeder template');
  return issues;
}

async function main() {
  if (!MONGO_URI) { console.error('No Mongo URI in env'); process.exit(1); }
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  console.log('Connected:', mongoose.connection.name);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'} | entries: ${fixtures.length}\n`);

  const results = [];
  for (const e of fixtures) {
    const res = { title: e.title, slug: e.slug, descriptionOnly: !!e.descriptionOnly, ok: false, issues: [] };
    try {
      const docs = await SQLProblem.find({ title: e.title });
      if (docs.length === 0) { res.issues.push('no doc with exact title'); results.push(res); continue; }
      if (docs.length > 1) { res.issues.push(`ambiguous title (${docs.length} docs)`); results.push(res); continue; }
      const doc = docs[0];
      if (String(doc.slug) !== e.slug) { res.issues.push(`slug mismatch (db=${doc.slug})`); results.push(res); continue; }
      res.id = String(doc._id);
      res.active = !!doc.isActive;

      res.issues.push(...checkDescription(e.description));

      if (e.descriptionOnly) {
        if (String(doc.description || '') !== 'd') res.issues.push('sentinel guard: current description is no longer the expected stub');
        res.ok = res.issues.length === 0;
        results.push(res);
        continue;
      }

      if (!PH.isPlaceholderSchemaSetup(doc.schemaSetupSQL)) {
        res.issues.push('current schemaSetupSQL is not the placeholder stub - refusing to overwrite');
        results.push(res);
        continue;
      }

      const ss = String(e.schemaSetupSQL || '');
      const ref = String(e.referenceSolutionSQL || '');
      if (!/CREATE\s+TABLE/i.test(ss)) res.issues.push('schema has no CREATE TABLE');
      if (/TODO|FIXME|placeholder/i.test(ss)) res.issues.push('placeholder word in schema');
      if (PH.isPlaceholderSchemaSetup(ss)) res.issues.push('new schema is still the placeholder');
      const missing = PH.referenceTablesMissingFromSchema(ss, ref);
      if (missing.length) res.issues.push(`reference tables missing from schema: ${missing.join(', ')}`);
      if (PH.isPlaceholderReferenceSQL(ref)) res.issues.push('reference is the stub');
      const hiddenInput = String(e.hiddenInputStateSQL || '');
      if (!hiddenInput.trim()) res.issues.push('hidden inputStateSQL missing');
      if (hiddenInput.includes(PH.PLACEHOLDER_HIDDEN_INPUT)) res.issues.push('hidden input is the placeholder stub');
      if (hiddenInput.trim() && !/INSERT\s+INTO/i.test(hiddenInput)) res.issues.push('hidden inputStateSQL must mutate with INSERT');

      const sample = await deriveRows(ref, caseSchema(ss, ''));
      if (!sample.ok) res.issues.push(`sample derive failed: ${sample.error}`);
      const hidden = await deriveRows(ref, caseSchema(ss, hiddenInput));
      if (!hidden.ok) res.issues.push(`hidden derive failed: ${hidden.error}`);

      if (sample.ok && hidden.ok) {
        if (PH.isPlaceholderSampleRows(sample.rows)) res.issues.push('derived sample rows equal the placeholder');
        res.derived = {
          sampleRows: sample.rows.length,
          hiddenRows: hidden.rows.length,
          samplePreview: sample.rows.slice(0, 3),
          hiddenPreview: hidden.rows.slice(0, 3),
        };
        res.set = {
          description: e.description,
          schemaSetupSQL: ss,
          referenceSolutionSQL: ref,
          sampleTestCases: [{ inputStateSQL: '', expectedOutputRows: sample.rows }],
          hiddenTestCases: [{ inputStateSQL: hiddenInput, expectedOutputRows: hidden.rows }],
          schemaTables: [],
          examples: [],
        };
      }
    } catch (err) {
      res.issues.push(`crash: ${err.message}`);
    }
    res.ok = res.issues.length === 0;
    results.push(res);
  }

  for (const r of results) {
    const mark = r.ok ? 'OK  ' : 'FAIL';
    const extra = r.derived ? ` sample=${r.derived.sampleRows} hidden=${r.derived.hiddenRows}` : '';
    console.log(`${mark} ${r.title}${extra}${r.issues.length ? ' :: ' + r.issues.join(' | ') : ''}`);
  }

  const failed = results.filter((r) => !r.ok);
  const report = {
    generatedAt: new Date().toISOString(),
    mode: APPLY ? 'apply' : 'dry-run',
    total: results.length,
    valid: results.length - failed.length,
    failed: failed.length,
    results: results.map(({ set, ...rest }) => rest),
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log(`\n=== backfill remaining SQL fixtures (${report.mode}) ===`);
  console.log(`entries           : ${report.total}`);
  console.log(`validated         : ${report.valid}`);
  console.log(`failed validation : ${report.failed}`);
  console.log(`report -> ${REPORT}`);

  if (failed.length) {
    console.log('ABORT: validation failures above; nothing written.');
    await mongoose.disconnect();
    process.exit(1);
  }

  if (!APPLY) {
    console.log('DRY RUN complete - re-run with --apply to write.');
    await mongoose.disconnect();
    process.exit(0);
  }

  let updated = 0;
  for (const r of results) {
    const doc = await SQLProblem.findById(r.id);
    if (!doc) { console.log(`SKIP (vanished): ${r.title}`); continue; }
    if (r.descriptionOnly) {
      const entry = fixtures.find((f) => f.title === r.title);
      doc.description = entry.description;
    } else {
      if (!PH.isPlaceholderSchemaSetup(doc.schemaSetupSQL)) { console.log(`SKIP (no longer placeholder): ${r.title}`); continue; }
      Object.assign(doc, r.set);
    }
    await doc.save();
    updated += 1;
    console.log(`UPDATED: ${r.title}`);
  }
  console.log(`\nupdated: ${updated} / ${results.length}`);
  await mongoose.disconnect();
  console.log('DONE.');
}

main().catch((err) => { console.error(err); process.exit(1); });

