'use strict';
/* Complete audit of the canonical DSA (codingproblems) + SQL (sqlproblems)
 * banks — every document, no sampling. Writes _full_audit_report.json. */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const CodingProblem = require('./models/CodingProblem');
const SQLProblem = require('./models/SQLProblem');
const Problem = require('./models/Problem');
const PLACEHOLDER = require('./utils/placeholderFixtures');

const OUT = path.join(__dirname, '_full_audit_report.json');
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const VALID_DIFFS = ['easy', 'medium', 'hard'];
const PLACEHOLDER_RE = /TODO|TBD|FIXME|not yet reviewed|placeholder|lorem ipsum|coming soon|\bXXX\b/i;
const RAW_ID_RE = /\bhm_\d{10,}\b|\b65a[0-9a-f]{20,}\b/;
const DSA_STARTER_LANGS = ['javascript', 'java', 'python', 'cpp'];
const DSA_SIG_LANGS = ['javascript', 'java', 'python', 'cpp'];
const SQL_STARTER_LANGS = ['mysql', 'postgresql', 'sqlite', 'sqlserver'];

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fenceCount = (s) => (String(s).match(/```/g) || []).length;
// A reference solution is the problem's ground truth: it must never mutate the
// fixture data destructively, or the stored expected rows cannot be reproduced.
const destructiveReference = (sql) =>
  /\b(?:DROP|TRUNCATE|ALTER)\s+(?:TABLE|DATABASE|INDEX)\b/i.test(String(sql || ''))
  || /\bDELETE\s+FROM\b/i.test(String(sql || ''))
  || /\bUPDATE\s+\w+\s+SET\b/i.test(String(sql || ''));

/* Generic runner: audits every doc, prints failures, returns tallies. */
function auditSet(label, docs, fn, keyFn) {
  const failures = [];
  const reviews = [];
  const seen = new Map();
  for (const p of docs) {
    const key = keyFn(p);
    if (seen.has(key)) failures.push({ title: p.title, issues: ['DUPLICATE ' + keyFn.name + ': ' + key] });
    else seen.set(key, String(p._id));
    let r;
    try { r = fn(p); } catch (e) { r = { issues: ['AUDIT CRASH: ' + e.message], review: [] }; }
    if (r.issues.length) failures.push({ id: String(p._id), title: p.title, slug: p.slug, active: p.isActive, issues: r.issues });
    else if (r.review.length) reviews.push({ title: p.title, slug: p.slug, active: p.isActive, review: r.review });
  }
  const passed = docs.length - failures.length;
  console.log(label + ': audited=' + docs.length + ' passed=' + passed + ' failed=' + failures.length + ' needsReview=' + reviews.length);
  failures.forEach((f) => console.log('  FAIL ' + (f.title || f.slug) + ' :: ' + f.issues.join(' | ')));
  return { passed, failed: failures.length, reviewed: reviews.length, failures, reviews };
}

function report(label, kind, total, extra) {
  console.log(label + ' ' + kind + ': total=' + total + (extra ? ' ' + JSON.stringify(extra) : ''));
}

/* Repo-wide corruption grep (code/data files only). */
function grepRepo(root, includeRe) {
  const hits = [];
  const skipDirs = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.vscode', '__pycache__']);
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (!skipDirs.has(e.name)) walk(full); continue; }
      if (!includeRe.test(e.name)) continue;
      // Never grep this script's own outputs / generated reports: they contain
      // the very patterns being searched for and create self-referential noise.
      if (/^_?.*report\.json$/i.test(e.name) || /^_verify_out\.txt$/i.test(e.name)) continue;
      // Audit/verification tooling necessarily contains these literals (they ARE
      // the patterns being searched for). Excluding them keeps the signal about
      // product code and seed data, which is what actually matters.
      if (/^(full_audit|audit|audit_problems|inspect_failures|inspect_schema|profile_dsa|discovery|dump_\w+|_inspect_\w+|_diag_\w+|verify_\w+|__tests__)$/i.test(e.name.replace(/\.(js|jsx|ts|tsx)$/i, ''))) continue;
      if (fs.statSync(full).size > 2 * 1024 * 1024) continue;
      let txt;
      try { txt = fs.readFileSync(full, 'utf8'); } catch (_) { continue; }
      const lines = txt.split(/\r?\n/);
      lines.forEach((ln, i) => {
        if (/TODO(?!.*require)|not yet reviewed|2\/266|hardcoded (analytics|heatmap)|fake (activity|heatmap|solved)/i.test(ln)) {
          hits.push(path.relative(root, full) + ':' + (i + 1) + ' :: ' + ln.trim().slice(0, 160));
        }
      });
    }
  };
  walk(root);
  return hits;
}

/* ================================================ DSA audit (every row) */
function auditDsa(p) {
  const issues = [];
  const review = [];
  const id = String(p._id);
  const title = String(p.title || '').trim();
  const slug = String(p.slug || '').trim();

  if (!title) issues.push('missing title');
  else if (title === id || /^hm_\d+/.test(title) || /^(Problem|Coding)\s*\d*$/i.test(title)) issues.push('raw/malformed title: ' + title);
  else if (PLACEHOLDER_RE.test(title)) issues.push('placeholder title: ' + title);

  if (!slug) issues.push('missing slug');
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) issues.push('invalid slug: ' + slug);
  else if (slug === id) issues.push('slug is raw id');

  if (!VALID_DIFFS.includes(String(p.difficulty || '').toLowerCase())) issues.push('invalid difficulty: ' + JSON.stringify(p.difficulty));

  const topics = [...(p.topic ? [String(p.topic)] : []), ...(Array.isArray(p.tags) ? p.tags : [])];
  if (topics.length === 0) issues.push('missing topics');
  else {
    const lower = topics.map((t) => String(t).toLowerCase().trim());
    if (new Set(lower).size !== lower.length) issues.push('duplicate topics: ' + JSON.stringify(topics));
    if (lower.some((t) => !t)) issues.push('empty topic entry');
  }

  const desc = String(p.description || '').trim();
  if (desc.length < 40) issues.push('description too short/missing (' + desc.length + ')');
  else if (PLACEHOLDER_RE.test(desc)) issues.push('placeholder description');
  if (RAW_ID_RE.test(desc)) issues.push('raw id in description');
  if (fenceCount(p.description || '') % 2 !== 0) review.push('unbalanced markdown fences');

  if (p.examples !== undefined) {
    if (!Array.isArray(p.examples)) issues.push('examples not array');
    else p.examples.forEach((ex, i) => {
      if (!ex || typeof ex !== 'object') { issues.push('examples[' + i + '] malformed'); return; }
      if (ex.input === undefined || ex.output === undefined) issues.push('examples[' + i + '] missing input/output');
    });
  } else if (!String(p.inputFormat || '').trim() || !String(p.outputFormat || '').trim()) {
    review.push('no examples field and missing inputFormat/outputFormat');
  }

  if (!Array.isArray(p.constraints) || p.constraints.length === 0) review.push('missing constraints');
  else if (p.constraints.some((c) => !String(c || '').trim())) issues.push('empty constraint entry');

  const st = Array.isArray(p.sampleTests) ? p.sampleTests : [];
  const ht = Array.isArray(p.hiddenTests) ? p.hiddenTests : [];
  if (st.length === 0) issues.push('NO sampleTests');
  if (ht.length === 0) review.push('NO hiddenTests');
  const chk = (arr, kind) => arr.forEach((tc, i) => {
    if (!tc || typeof tc !== 'object') { issues.push(kind + '[' + i + '] not an object'); return; }
    if (tc.input === undefined || tc.input === null || String(tc.input).trim() === '') issues.push(kind + '[' + i + '] empty input');
    const exp = (tc) => (tc.output !== undefined && tc.output !== null ? tc.output : tc.expectedOutput);
    if (exp(tc) === undefined || exp(tc) === null || String(exp(tc)).trim() === '') issues.push(kind + '[' + i + '] empty expected output');
  });
  chk(st, 'sampleTests');
  chk(ht, 'hiddenTests');
  if (st.length && ht.length) {
    const val = (tc) => (tc.output !== undefined && tc.output !== null ? tc.output : tc.expectedOutput);
    const key = (tc) => JSON.stringify([tc.input, val(tc)]);
    const sk = new Set(st.map(key));
    if (ht.length <= st.length && ht.every((t) => sk.has(key(t)))) review.push('hidden tests mirror samples only');
    if (new Set(ht.map(key)).size !== ht.length) review.push('duplicate hidden tests present');
    if (new Set(st.map(key)).size !== st.length) issues.push('duplicate sample tests present');
  }

  const sig = p.functionSignature || {};
  const sc = p.starterCode || {};
  for (const lang of DSA_STARTER_LANGS) {
    if (!sc[lang] || !String(sc[lang]).trim()) issues.push('empty starterCode: ' + lang);
    else if (/TODO|FIXME|NotImplemented/i.test(sc[lang])) review.push('placeholder in starter[' + lang + ']');
  }
  for (const lang of ['c', 'csharp']) {
    if (sc[lang] !== undefined && sc[lang] !== null && String(sc[lang]).trim() !== '' && (!sig[lang] || !sig[lang].name)) {
      review.push('starter[' + lang + '] provided but no functionSignature[' + lang + ']');
    }
  }
  for (const lang of DSA_SIG_LANGS) {
    const s = sig[lang];
    if (!s || !s.name) issues.push('missing functionSignature: ' + lang);
    else {
      if (!Array.isArray(s.params)) issues.push('sig[' + lang + '] params not array');
      if (!s.returnType) issues.push('sig[' + lang + '] missing returnType');
    }
  }
  if (!(Number(p.timeLimitMs) > 0)) issues.push('missing/invalid timeLimitMs');
  else if (Number(p.timeLimitMs) > 10000) review.push('timeLimitMs unusually high: ' + p.timeLimitMs);
  if (!(Number(p.memoryLimitKb) > 0)) review.push('missing memoryLimitKb');
  return { issues, review };
}

/* ================================================ SQL audit (every row) */
function auditSql(p) {
  const issues = [];
  const review = [];
  const id = String(p._id);
  const title = String(p.title || '').trim();
  const slug = String(p.slug || '').trim();

  if (!title) issues.push('missing title');
  else if (title === id || /^hm_\d+/.test(title) || /^(Problem|SQL)\s*\d*$/i.test(title)) issues.push('raw/malformed title: ' + title);
  else if (PLACEHOLDER_RE.test(title)) issues.push('placeholder title: ' + title);

  if (!slug) issues.push('missing slug');
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) issues.push('invalid slug: ' + slug);
  else if (slug === id) issues.push('slug is raw id');

  if (!VALID_DIFFS.includes(String(p.difficulty || '').toLowerCase())) issues.push('invalid difficulty: ' + JSON.stringify(p.difficulty));

  const topics = p.topics || [];
  if (!Array.isArray(topics) || topics.length === 0) issues.push('missing topics');

  const desc = String(p.description || '');
  if (desc.trim().length < 40) issues.push('description too short/missing (' + desc.length + ')');
  else if (PLACEHOLDER_RE.test(desc)) issues.push('placeholder in description');
  else if (PLACEHOLDER.isPlaceholderDescription(desc)) issues.push('description was generated by a seeder, not authored');
  if (RAW_ID_RE.test(desc)) issues.push('raw id in description');
  if (fenceCount(desc) % 2 !== 0) review.push('unbalanced markdown fences in description');

  const ss = String(p.schemaSetupSQL || '');
  if (!ss.trim()) issues.push('missing schemaSetupSQL');
  else if (!/CREATE\s+TABLE/i.test(ss)) issues.push('schemaSetupSQL has no CREATE TABLE');
  else {
    if (/TODO|FIXME|placeholder/i.test(ss)) issues.push('placeholder in schemaSetupSQL');
    // ---- CONTENT CONSISTENCY: the reference solution must be runnable against
    // the schema it ships with. Structural presence alone proves nothing.
    const schemaTables = new Set();
    for (const m of ss.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([A-Za-z_][A-Za-z0-9_]*)`?/gi)) {
      schemaTables.add(m[1].toLowerCase());
    }
    const refTables = new Set();
    {
      // CTE / derived aliases declared as `name AS (` are not base tables.
      const refAliases = new Set();
      for (const m of String(p.referenceSolutionSQL || '').matchAll(/\b([A-Za-z_][\w]*)\s+AS\s*\(/gi)) {
        refAliases.add(m[1].toLowerCase());
      }
      for (const m of String(p.referenceSolutionSQL || '').matchAll(/(?:FROM|JOIN)\s+`?([A-Za-z_][A-Za-z0-9_]*)`?/gi)) {
        const name = m[1].toLowerCase();
        if (!refAliases.has(name)) refTables.add(name);
      }
    }
    if (refTables.size === 0 && String(p.referenceSolutionSQL || '').trim()) {
      review.push('referenceSolutionSQL references no table');
    }
    for (const t of refTables) {
      if (!schemaTables.has(t)) {
        issues.push('referenceSolutionSQL references table "' + t + '" which schemaSetupSQL never creates (submission would fail with "no such table")');
      }
    }
    // ---- SEEDED-PLACEHOLDER detection (shared definition) ------------------
    // These predicates live in utils/placeholderFixtures.js so the seeders and
    // this audit can never disagree about what counts as placeholder content.
    const stubSchema = PLACEHOLDER.isPlaceholderSchemaSetup(ss);
    if (stubSchema && !refTables.has('test_table')) {
      issues.push('schemaSetupSQL is the generic placeholder (test_table) and does not match referenceSolutionSQL');
    }
    if (PLACEHOLDER.isPlaceholderReferenceSQL(p.referenceSolutionSQL)) {
      issues.push('referenceSolutionSQL is the placeholder stub ("SELECT * FROM test_table") - no real solution was authored');
    }
    if (PLACEHOLDER.isPlaceholderSampleRows((p.sampleTestCases || [])[0] && (p.sampleTestCases || [])[0].expectedOutputRows)) {
      issues.push('sampleTestCases expected rows are the seeded placeholder (Sample/100) - no real dataset was authored');
    }
    if (PLACEHOLDER.isPlaceholderHiddenTestCases(p.hiddenTestCases)) {
      issues.push('hiddenTestCases are the seeded placeholder (test_table insert) - no real dataset was authored');
    }
    if (PLACEHOLDER.isGenericEmployeesSchema(p.schemaTables)) {
      review.push('schemaTables is the generic employees(id,name,department,salary) fixture injected by backfillSQLProblemStructure.js');
    }
    if (PLACEHOLDER.isGenericEmployeesExample(p.examples)) {
      review.push('examples carry the generic Alice/Bob/Charlie employees fixture injected by backfillSQLProblemStructure.js');
    }
    if (destructiveReference(p.referenceSolutionSQL)) {
      // Not an error: e.g. "delete duplicate rows" legitimately answers with DELETE.
      // But a mutating statement returns no rows, so expectedOutputRows can never
      // be reproduced -> the verification contract needs reviewing.
      review.push('referenceSolutionSQL is a mutating statement (returns no rows); expectedOutputRows cannot be reproduced from it');
    }
    const descTables = new Set();
    // Only trust (a) backticked identifiers and (b) un-backticked identifiers
    // that look like real table names (contain an underscore). Plain prose after
    // FROM/JOIN ("FROM the ...", "JOIN with ...") must never be treated as a table.
    for (const m of desc.matchAll(/(?:FROM|JOIN)\s+`([A-Za-z_][A-Za-z0-9_]*)`/gi)) descTables.add(m[1].toLowerCase());
    for (const m of desc.matchAll(/(?:FROM|JOIN)\s+([A-Za-z_][A-Za-z0-9_]*_[A-Za-z0-9_]+)\b/g)) descTables.add(m[1].toLowerCase());
    for (const t of descTables) {
      if (['dual', 't1', 't2', 'cte'].includes(t)) continue;
      if (!schemaTables.has(t)) issues.push('description references table "' + t + '" missing from schemaSetupSQL');
    }
  }

  // ---- Canonical SQLProblem test-case validation -------------------------
  // The schema stores expected rows per test case (sampleTestCases[] /
  // hiddenTestCases[] with `expectedOutputRows`), NOT as a single top-level
  // `expectedOutputRows` array. Validate the real shape.
  const SQL_TEST_KINDS = [
    ['sampleTestCases', p.sampleTestCases],
    ['hiddenTestCases', p.hiddenTestCases],
  ];
  let totalExpectedRows = 0;
  let hasUsableCase = false;

  const chkSqlCases = (kind, arr) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      if (kind === 'sampleTestCases') review.push('no ' + kind);
      return;
    }
    arr.forEach((tc, i) => {
      if (!tc || typeof tc !== 'object') { issues.push(kind + '[' + i + '] not an object'); return; }
      const rows = tc.expectedOutputRows;
      if (rows === undefined || rows === null) { issues.push(kind + '[' + i + '] missing expectedOutputRows'); return; }
      if (!Array.isArray(rows)) { issues.push(kind + '[' + i + '] expectedOutputRows not array'); return; }
      if (rows.length > 0) hasUsableCase = true;
      else review.push(kind + '[' + i + '] expectedOutputRows empty (empty-result problem?)');
      const cols0 = rows[0] && typeof rows[0] === 'object' && !Array.isArray(rows[0]) ? Object.keys(rows[0]).length : -1;
      rows.forEach((r, ri) => {
        totalExpectedRows += 1;
        if (r !== null && (typeof r !== 'object' || Array.isArray(r))) {
          issues.push(kind + '[' + i + '].rows[' + ri + '] not row object');
        } else if (r) {
          if (Object.keys(r).length === 0) issues.push(kind + '[' + i + '].rows[' + ri + '] has no columns');
          else if (cols0 >= 0 && Object.keys(r).length !== cols0) {
            issues.push(kind + '[' + i + '].rows[' + ri + '] column count differs from row 0');
          }
          for (const v of Object.values(r)) if (v === undefined) issues.push(kind + '[' + i + '].rows[' + ri + '] contains undefined');
        }
      });
    });
  };

  SQL_TEST_KINDS.forEach(([kind, arr]) => chkSqlCases(kind, arr));
  if (!hasUsableCase && !issues.some((i) => /expectedOutputRows/.test(i))) {
    review.push('no test case with non-empty expectedOutputRows');
  }

  if (!String(p.referenceSolutionSQL || '').trim()) review.push('missing referenceSolutionSQL');
  if (!String(p.topic || '').trim()) review.push('missing topic');

  return { issues, review, totalExpectedRows };
}

/* ================================================ main */
async function main() {
  if (!MONGO_URI) { console.error('No Mongo URI in env'); process.exit(1); }
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  console.log('Connected:', mongoose.connection.name);

  const coding = await CodingProblem.find({}).lean();
  const legacy = await Problem.find({ category: 'DSA' }).lean();
  const sqlBank = await SQLProblem.find({}).lean();
  const sqlLegacy = await Problem.find({ category: 'SQL' }).lean();

  const dupCheck = (arr) => {
    const t = {}; const s = {};
    arr.forEach((p) => { (t[p.title] = t[p.title] || []).push(String(p._id)); (s[p.slug] = s[p.slug] || []).push(String(p._id)); });
    return {
      titles: Object.entries(t).filter(([, v]) => v.length > 1),
      slugs: Object.entries(s).filter(([, v]) => v.length > 1),
    };
  };

  const dsaR = auditSet('DSA', coding, auditDsa, (p) => String(p.slug));
  const sqlR = auditSet('SQL', sqlBank, auditSql, (p) => String(p.slug));

  // ---- Cross-problem placeholder detection -------------------------------
  // If many problems share byte-identical schemaSetupSQL and/or identical
  // expected rows, those fields were never authored per problem.
  const fingerprint = (sqlBank, field) => {
    const groups = new Map();
    sqlBank.forEach((p) => {
      const v = field(p);
      if (v === undefined || v === null || String(v).trim() === '') return;
      const key = JSON.stringify(v);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p.slug);
    });
    return [...groups.entries()]
      .filter(([, slugs]) => slugs.length > 1)
      .map(([key, slugs]) => ({ count: slugs.length, sample: slugs.slice(0, 4), key: String(key).replace(/\s+/g, ' ').slice(0, 160) }))
      .sort((a, b) => b.count - a.count);
  };

  const sqlShared = {
    schemaSetupSQL: fingerprint(sqlBank, (p) => p.schemaSetupSQL),
    sampleExpectedRows: fingerprint(sqlBank, (p) => (p.sampleTestCases || []).map((tc) => tc.expectedOutputRows)),
    hiddenExpectedRows: fingerprint(sqlBank, (p) => (p.hiddenTestCases || []).map((tc) => tc.expectedOutputRows)),
    hiddenInputStateSQL: fingerprint(sqlBank, (p) => (p.hiddenTestCases || []).map((tc) => tc.inputStateSQL)),
    schemaTables: fingerprint(sqlBank, (p) => p.schemaTables),
    examples: fingerprint(sqlBank, (p) => p.examples),
    referenceSolutionSQL: fingerprint(sqlBank, (p) => p.referenceSolutionSQL),
    description: fingerprint(sqlBank, (p) => String(p.description || '').trim()),
  };
  console.log('\n=== SQL cross-problem placeholder fingerprints ===');
  Object.entries(sqlShared).forEach(([k, groups]) => {
    const shared = groups.reduce((a, g) => a + g.count, 0);
    console.log(`  ${k}: ${groups.length} distinct value(s) shared by ${shared} problem(s)`
      + (groups.length ? ' -> ' + groups.map((g) => `${g.count}x`).join(', ') : ''));
  });
  const dsaShared = {
    description: fingerprint(coding, (p) => String(p.description || '').trim()),
    schemaSampleTests: fingerprint(coding, (p) => (p.sampleTests || []).map((tc) => [tc.input, tc.output])),
    schemaHiddenTests: fingerprint(coding, (p) => (p.hiddenTests || []).map((tc) => [tc.input, tc.output])),
  };
  console.log('=== DSA cross-problem placeholder fingerprints ===');
  Object.entries(dsaShared).forEach(([k, groups]) => {
    const shared = groups.reduce((a, g) => a + g.count, 0);
    console.log(`  ${k}: ${groups.length} distinct value(s) shared by ${shared} problem(s)`
      + (groups.length ? ' -> ' + groups.map((g) => `${g.count}x`).join(', ') : ''));
  });

  const dsaNoSamples = coding.filter((p) => !(p.sampleTests || []).length).length;
  const dsaPlaceholderDesc = coding.filter((p) => PLACEHOLDER.isPlaceholderDescription(p.description)).length;
  const dsaGenericShell = coding.filter((p) => p.functionSignature && p.functionSignature.javascript && p.functionSignature.javascript.name === 'solve').length;
  const sqlRefTableMismatch = sqlR.failures.filter((f) => (f.issues || []).some((i) => /never creates|generic placeholder/.test(i))).length;
  const sqlStubSchema = sqlBank.filter((p) => PLACEHOLDER.isPlaceholderSchemaSetup(p.schemaSetupSQL)).length;
  const sqlStubHidden = sqlBank.filter((p) => PLACEHOLDER.isPlaceholderHiddenTestCases(p.hiddenTestCases)).length;
  const sqlStubRef = sqlBank.filter((p) => PLACEHOLDER.isPlaceholderReferenceSQL(p.referenceSolutionSQL)).length;

  const sqlStubDesc = sqlBank.filter((p) => PLACEHOLDER.isPlaceholderDescription(p.description)).length;
  const sqlStubRows = sqlBank.filter((p) => PLACEHOLDER.isPlaceholderSampleRows((p.sampleTestCases || [])[0] && (p.sampleTestCases || [])[0].expectedOutputRows)).length;
  const sqlFakeSchemaTables = sqlBank.filter((p) => PLACEHOLDER.isGenericEmployeesSchema(p.schemaTables)).length;
  const sqlFakeExamples = sqlBank.filter((p) => PLACEHOLDER.isGenericEmployeesExample(p.examples)).length;
  const sqlActive = sqlBank.filter((p) => p.isActive !== false);
  const sqlActiveUnrunnable = sqlActive.filter((p) => {
    const missing = PLACEHOLDER.referenceTablesMissingFromSchema(p.schemaSetupSQL, p.referenceSolutionSQL);
    return String(p.referenceSolutionSQL || '').trim() && missing.length > 0;
  }).length;
  console.log('\n=== CONTENT-GAP SUMMARY ===');
  console.log(`  DSA problems with NO sampleTests        : ${dsaNoSamples} / ${coding.length}`);
  console.log(`  DSA problems with placeholder description: ${dsaPlaceholderDesc} / ${coding.length}`);
  console.log(`  DSA problems using the generic 'solve(input)' shell signature: ${dsaGenericShell} / ${coding.length}`);
  console.log(`  SQL problems whose reference solution cannot run on its own schema: ${sqlRefTableMismatch} / ${sqlBank.length}`);
  console.log(`  SQL problems with the stub reference solution: ${sqlStubRef} / ${sqlBank.length}`);
  console.log(`  SQL problems with placeholder expected rows : ${sqlStubRows} / ${sqlBank.length}`);
  console.log(`  SQL problems with the generic employees schemaTables: ${sqlFakeSchemaTables} / ${sqlBank.length}`);
  console.log(`  SQL problems with the generic employees examples    : ${sqlFakeExamples} / ${sqlBank.length}`);
  console.log(`  ACTIVE SQL problems that cannot execute right now   : ${sqlActiveUnrunnable} / ${sqlActive.length}`);

  const dsaDup = dupCheck(coding);
  const sqlDup = dupCheck(sqlBank);

  console.log('\n=== LEGACY problems collection ===');
  console.log('DSA=' + legacy.length + ' SQL=' + sqlLegacy.length);

  const codeHits = grepRepo(path.resolve(__dirname, '..'), /\.(js|jsx|ts|tsx|json|md)$/);
  console.log('\n=== CORRUPTION GREP: ' + codeHits.length + ' hits ===');
  codeHits.forEach((h) => console.log('  ' + h));

  const report = {
    generatedAt: new Date().toISOString(),
    counts: {
      dsaCanonical: coding.length,
      dsaCanonicalActive: coding.filter((p) => p.isActive !== false).length,
      dsaCanonicalInactive: coding.filter((p) => p.isActive === false).length,
      dsaLegacyProblemCollection: legacy.length,
      sqlCanonical: sqlBank.length,
      sqlCanonicalActive: sqlBank.filter((p) => p.isActive !== false).length,
      sqlCanonicalInactive: sqlBank.filter((p) => p.isActive === false).length,
      sqlLegacyProblemCollection: sqlLegacy.length,
    },
    dsa: { audited: coding.length, passed: dsaR.passed, failed: dsaR.failed, needsReview: dsaR.reviewed, failures: dsaR.failures, reviews: dsaR.reviews, duplicateTitles: dsaDup.titles, duplicateSlugs: dsaDup.slugs },
    sql: { audited: sqlBank.length, passed: sqlR.passed, failed: sqlR.failed, needsReview: sqlR.reviewed, failures: sqlR.failures, reviews: sqlR.reviews, duplicateTitles: sqlDup.titles, duplicateSlugs: sqlDup.slugs },
    contentGaps: {
      dsaNoSampleTests: dsaNoSamples,
      dsaPlaceholderDescription: dsaPlaceholderDesc,
      dsaGenericShellSignature: dsaGenericShell,
      sqlReferenceTableMismatch: sqlRefTableMismatch,
      sqlStubReferenceSolution: sqlStubRef,
      sqlPlaceholderExpectedRows: sqlStubRows,
      sqlPlaceholderSchemaSetup: sqlStubSchema,
      sqlPlaceholderHiddenTestCases: sqlStubHidden,
      sqlPlaceholderDescription: sqlStubDesc,
      sqlGenericEmployeesSchemaTables: sqlFakeSchemaTables,
      sqlGenericEmployeesExamples: sqlFakeExamples,
      sqlActiveUnrunnable: sqlActiveUnrunnable,
      sqlActiveTotal: sqlActive.length,
      semantics: {
        sqlProblem:
          'SQLProblem fixtures (schemaSetupSQL / expectedOutputRows / schemaTables / examples) '
          + 'were never authored. scripts/seedSQLProblemsExpanded.js seeded metadata only and '
          + 'scripts/backfillSQLProblemStructure.js injected one generic employees schema+example '
          + 'into every problem. referenceSolutionSQL IS authored per problem and is the ground '
          + 'truth to author from. This is a CONTENT gap, not a code/pipeline defect: the SQL '
          + 'executor, comparison and verdict mapping all work (proved by _selftest_placeholders.js '
          + 'and verify_execution.js).',
        dsaProblem:
          'CodingProblem carries CATALOG metadata for all problems, but only the curated subset '
          + 'has authored sampleTests/hiddenTests + description + typed function signature. The '
          + 'rest use the generic solve(input: string) shell with empty fixtures.',
      },
      sqlSharedFingerprints: sqlShared,
      dsaSharedFingerprints: dsaShared,
    },
    legacyDsa: legacy.map((p) => ({ title: p.title, slug: p.slug, active: p.isActive })),
    legacySql: sqlLegacy.map((p) => ({ title: p.title, slug: p.slug, active: p.isActive })),
    codeHits,
  };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log('\nFull report ->', OUT);
  await mongoose.disconnect();
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });



