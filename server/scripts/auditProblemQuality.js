/**
 * auditProblemQuality.js — READ-ONLY content audit of the DSA and SQL banks.
 *
 * Reports which entries do NOT yet meet the LeetCode-style structure and prints
 * an actionable list. It NEVER invents constraints, examples or expected
 * outputs: fabricated test data is worse than an honest "missing" marker,
 * because it would silently make a wrong solution look Accepted.
 *
 *   node scripts/auditProblemQuality.js            # summary + counts
 *   node scripts/auditProblemQuality.js --list     # one line per problem
 *   node scripts/auditProblemQuality.js --json out.json
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const mongoose = require('mongoose');

const argv = process.argv.slice(2);
const LIST = argv.includes('--list');
const JSON_OUT = argv.includes('--json') ? argv[argv.indexOf('--json') + 1] : null;

const { projectSqlProblem } = require('../utils/sqlSchemaProjection');
const { mapProblemForResponse } = require('../controllers/codingProblemController');

/** Structural contract every DSA problem is expected to satisfy. */
const DSA_CHECKS = [
  { key: 'description', label: 'problem statement', ok: (p) => typeof p.description === 'string' && p.description.trim().length >= 80 },
  { key: 'difficulty', label: 'difficulty', ok: (p) => ['easy', 'medium', 'hard'].includes(p.difficulty) },
  { key: 'topic', label: 'topic/tags', ok: (p) => !!p.topic || (Array.isArray(p.tags) && p.tags.length > 0) },
  { key: 'samples', label: 'sample test cases', ok: (p) => Array.isArray(p.sampleTests) && p.sampleTests.length > 0 },
  {
    key: 'sampleOutputs',
    label: 'sample expected outputs',
    ok: (p) => (p.sampleTests || []).every((t) => t && t.output != null && String(t.output).length > 0),
  },
  {
    key: 'sampleExplanations',
    label: 'sample explanations',
    ok: (p) => (p.sampleTests || []).every((t) => t && !!t.explanation),
  },
  { key: 'constraints', label: 'constraints', ok: (p) => Array.isArray(p.constraints) && p.constraints.length > 0 },
  { key: 'hidden', label: 'hidden test cases', ok: (p) => Array.isArray(p.hiddenTests) && p.hiddenTests.length > 0 },
  {
    key: 'starterCode',
    label: 'starter code',
    ok: (p) => !!p.starterCode && Object.values(p.starterCode).some(Boolean),
  },
  {
    key: 'signature',
    label: 'function signature',
    ok: (p) => !!p.functionSignature && !!p.functionSignature.javascript,
  },
];

/** Structural contract every SQL problem is expected to satisfy. */
const SQL_CHECKS = [
  { key: 'description', label: 'requirements', ok: (p) => typeof p.description === 'string' && p.description.trim().length >= 40 },
  { key: 'difficulty', label: 'difficulty', ok: (p) => ['easy', 'medium', 'hard'].includes(p.difficulty) },
  { key: 'schemaTables', label: 'schema tables', ok: (p) => Array.isArray(p.schemaTables) && p.schemaTables.length > 0 },
  { key: 'schemaSetupSQL', label: 'schema DDL', ok: (p) => typeof p.schemaSetupSQL === 'string' && p.schemaSetupSQL.trim().length > 0 },
  { key: 'samples', label: 'visible sample cases', ok: (p) => Array.isArray(p.sampleTestCases) && p.sampleTestCases.length > 0 },
  { key: 'hidden', label: 'hidden test cases', ok: (p) => Array.isArray(p.hiddenTestCases) && p.hiddenTestCases.length > 0 },
  {
    key: 'examples',
    label: 'worked example (sample data + expected output)',
    ok: (p) => Array.isArray(p.examples) && p.examples.length > 0
      && p.examples.every((e) => Array.isArray(e.inputTables) && e.inputTables.length > 0 && !!e.outputTable),
  },
  { key: 'reference', label: 'reference solution', ok: (p) => typeof p.referenceSolutionSQL === 'string' && p.referenceSolutionSQL.trim().length > 0 },
];

const evaluate = (docs, checks) => docs.map((doc) => {
  const missing = checks.filter((c) => !c.ok(doc)).map((c) => c.label);
  return { id: doc.problemId || doc._id, title: doc.title, missing };
});

function report(name, checks, docs, getter) {
  const evaluated = evaluate(getter(docs), checks);
  const complete = evaluated.filter((r) => r.missing.length === 0);
  const gaps = evaluated.filter((r) => r.missing.length > 0);

  console.log(`\n=== ${name} (${docs.length} entries) ===`);
  console.log(`  complete: ${complete.length}   incomplete: ${gaps.length}`);
  for (const check of checks) {
    const failing = evaluated.filter((r) => r.missing.includes(check.label)).length;
    const bar = failing === 0 ? 'OK  ' : 'GAP ';
    console.log(`  ${bar} ${check.label.padEnd(42)} missing on ${failing}`);
  }

  if (LIST) {
    console.log(`  --- incomplete entries ---`);
    gaps.forEach((g) => console.log(`    ${String(g.id).padEnd(18)} ${String(g.title).slice(0, 40).padEnd(42)} missing: ${g.missing.join(', ')}`));
  }
  return { total: docs.length, complete: complete.length, gaps: gaps.length, detail: gaps };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 12000 });
  const db = mongoose.connection.db;

  const dsaDocs = await db.collection('codingproblems').find({}).toArray();
  const sqlDocs = await db.collection('sqlproblems').find({}).toArray();

  const dsa = report('DSA PROBLEM BANK (stored)', DSA_CHECKS, dsaDocs, (d) => d);

  // What the API actually SERVES, after the display projection. For SQL this is
  // different from what is stored: the schema and the worked example are derived
  // from schemaSetupSQL + the visible sample case, so the stored-vs-served gap
  // is expected and must be shown explicitly rather than reported as a bug.
  const servedSql = sqlDocs.map((d) => projectSqlProblem(d));
  const sql = report('SQL PROBLEM BANK (stored)', SQL_CHECKS, sqlDocs, (d) => d);
  const sqlServed = report('SQL PROBLEM BANK (as served by the API)', SQL_CHECKS, servedSql, (d) => d);

  const servedDsa = dsaDocs.map((d) => mapProblemForResponse(d));
  const dsaLeak = servedDsa.filter((p) => 'hiddenTestCases' in p || 'hiddenTests' in p);
  console.log(`\n=== DSA API LEAK CHECK ===`);
  console.log(`  problems whose response still carries hidden tests: ${dsaLeak.length} (must be 0)`);

  const out = {
    generatedAt: new Date().toISOString(),
    note: 'Read-only audit. No content was created, guessed or modified.',
    dsaStored: { total: dsa.total, complete: dsa.complete, gaps: dsa.gaps },
    sqlStored: { total: sql.total, complete: sql.complete, gaps: sql.gaps },
    sqlServed: { total: sqlServed.total, complete: sqlServed.complete, gaps: sqlServed.gaps },
    dsaLeakingHiddenTests: dsaLeak.length,
  };
  if (JSON_OUT) {
    fs.writeFileSync(JSON_OUT, JSON.stringify({ ...out, dsaDetail: dsa.detail, sqlDetail: sql.detail }, null, 2));
    console.log(`\nWrote ${JSON_OUT}`);
  }

  await mongoose.disconnect();
}

main().catch((e) => { console.error('auditProblemQuality failed:', e.message); process.exit(1); });
