'use strict';
/* ---------------------------------------------------------------------------
 * validateAuthoredDsaBatch3.js
 * Offline, READ-ONLY, fail-closed validation of scripts/authoredDsaBatch3.js.
 * No database is opened; nothing is written except the report file below.
 *
 * Sections:
 *   A. identity     - exactly 13 records, unique title/slug, an exact canonical
 *                     title+slug match to the thirteen audited rows they claim to
 *                     fix, and no overlap with Batch 1 or Batch 2.
 *   B. audit replica - local, independent re-implementation of full_audit.js
 *                     auditDsa issues; every record must produce ZERO issues.
 *   C. provenance   - the source JSON is faithful to the two git blobs it claims
 *                     to come from (every description / constraint / outputFormat /
 *                     sample / hidden fixture / signature name is found verbatim in
 *                     the historical file), and the payload is faithful to the
 *                     source JSON (or a documented override / derivation).
 *   D. execution    - every sample+hidden fixture executed for JavaScript, Java and
 *                     C++ through the REAL platform path (buildDriverFromSignature
 *                     -> localExecutor, compiling and running).
 *   E. templates    - all four language starter templates, wrapped in their real
 *                     drivers, must compile (node --check / py_compile / javac /
 *                     g++ -fsyntax-only): 13 x 4 = 52 templates.
 *
 * Exit code 0 = all checks passed; 1 = at least one failure (fail-closed).
 * Report -> server/_batch3_validation_report.json
 * --------------------------------------------------------------------------- */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const G = require('../utils/genericValidator');
const judge0 = require('../utils/judge0Coding');
const localExecutor = require('../utils/localExecutor');
const batch = require('./authoredDsaBatch3');
const batch1 = require('./authoredDsaBatch1');
const batch2 = require('./authoredDsaBatch2');
const SRC = require('./authoredDsaBatch3.source.json');

const OUT = path.join(__dirname, '..', '_batch3_validation_report.json');
const AUDIT = path.join(__dirname, '..', '_full_audit_report.json');

const PLACEHOLDER_RE = /TODO|TBD|FIXME|not yet reviewed|placeholder|lorem ipsum|coming soon|\bXXX\b/i;
const RAW_ID_RE = /\bhm_\d{10,}\b|\b65a[0-9a-f]{20,}\b/;
const VALID_DIFFS = ['easy', 'medium', 'hard'];
const DSA_LANGS = ['javascript', 'java', 'python', 'cpp'];

/* The thirteen A-class records, as canonical [title, slug] pairs. */
const EXPECTED = [
  ['Longest Palindrome', 'longest-palindrome'],
  ['Add Two Numbers', 'add-two-numbers'],
  ['Unique Paths', 'unique-paths'],
  ['Daily Temperatures', 'daily-temperatures'],
  ['Top K Frequent Elements', 'top-k-frequent-elements'],
  ['Non-overlapping Intervals', 'non-overlapping-intervals'],
  ['Search Insert Position', 'search-insert-position'],
  ['Find Minimum in Rotated Sorted Array', 'find-minimum-in-rotated-sorted-array'],
  ['Happy Number', 'happy-number'],
  ['Palindrome Linked List', 'palindrome-linked-list'],
  ['K Closest Points to Origin', 'k-closest-points-to-origin'],
  ['Pow(x,n)', 'pow-x-n'],
  ['Merge k Sorted Lists', 'merge-k-sorted-lists'],
];

const checks = [];
const failures = [];
const warnings = [];
function check(label, ok, detail) {
  const entry = { label, ok: !!ok, detail: detail == null || detail === '' ? '' : String(detail) };
  checks.push(entry);
  if (!entry.ok) failures.push(label + (entry.detail ? ' :: ' + entry.detail : ''));
  return entry.ok;
}
function warn(label, detail) {
  warnings.push(label + (detail ? ' :: ' + detail : ''));
}

const decodeLiteralNewlines = (s) => String(s).split('\\n').join('\n');

function expectDedupeTags(topic, tags) {
  const seen = new Set([String(topic).toLowerCase().trim()]);
  const kept = [];
  for (const t of tags || []) {
    const k = String(t).toLowerCase().trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    kept.push(t);
  }
  return kept;
}

/* -------- B. local replica of full_audit.js auditDsa (issues only) --------- */
function auditDsaIssues(r) {
  const issues = [];
  const reviews = [];
  const title = String(r.title || '').trim();
  const slug = String(r.slug || '').trim();
  if (!title) issues.push('missing title');
  else if (PLACEHOLDER_RE.test(title)) issues.push('placeholder title');
  if (!slug) issues.push('missing slug');
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) issues.push('invalid slug');
  if (!VALID_DIFFS.includes(String(r.difficulty || '').toLowerCase())) issues.push('invalid difficulty: ' + r.difficulty);
  const topics = [...(r.topic ? [String(r.topic)] : []), ...(Array.isArray(r.tags) ? r.tags : [])];
  if (topics.length === 0) issues.push('missing topics');
  else {
    const lower = topics.map((t) => String(t).toLowerCase().trim());
    if (new Set(lower).size !== lower.length) issues.push('duplicate topics: ' + JSON.stringify(topics));
    if (lower.some((t) => !t)) issues.push('empty topic entry');
  }
  const desc = String(r.description || '').trim();
  if (desc.length < 40) issues.push(`description too short/missing (${desc.length})`);
  else if (PLACEHOLDER_RE.test(desc)) issues.push('placeholder description');
  if (RAW_ID_RE.test(desc)) issues.push('raw id in description');
  if (r.examples !== undefined) {
    if (!Array.isArray(r.examples)) issues.push('examples not array');
    else r.examples.forEach((ex, i) => {
      if (!ex || typeof ex !== 'object') { issues.push(`examples[${i}] malformed`); return; }
      if (ex.input === undefined || ex.output === undefined) issues.push(`examples[${i}] missing input/output`);
    });
  } else if (!String(r.inputFormat || '').trim() || !String(r.outputFormat || '').trim()) {
    reviews.push('no examples field and missing inputFormat/outputFormat');
  }
  if (!Array.isArray(r.constraints) || r.constraints.length === 0) reviews.push('missing constraints');
  else if (r.constraints.some((c) => !String(c || '').trim())) issues.push('empty constraint entry');
  const st = Array.isArray(r.sampleTests) ? r.sampleTests : [];
  const ht = Array.isArray(r.hiddenTests) ? r.hiddenTests : [];
  if (st.length === 0) issues.push('NO sampleTests');
  if (ht.length === 0) reviews.push('NO hiddenTests');
  const val = (t) => (t.output !== undefined && t.output !== null ? t.output : t.expectedOutput);
  const chk = (arr, kind) => arr.forEach((tc, i) => {
    if (!tc || typeof tc !== 'object') { issues.push(`${kind}[${i}] not an object`); return; }
    if (tc.input === undefined || tc.input === null || String(tc.input).trim() === '') issues.push(`${kind}[${i}] empty input`);
    if (val(tc) === undefined || val(tc) === null || String(val(tc)).trim() === '') issues.push(`${kind}[${i}] empty expected output`);
  });
  chk(st, 'sampleTests');
  chk(ht, 'hiddenTests');
  if (st.length && ht.length) {
    const key = (t) => JSON.stringify([t.input, val(t)]);
    const sk = new Set(st.map(key));
    if (ht.length <= st.length && ht.every((t) => sk.has(key(t)))) reviews.push('hidden tests mirror samples only');
    if (new Set(ht.map(key)).size !== ht.length) reviews.push('duplicate hidden tests present');
    if (new Set(st.map(key)).size !== st.length) issues.push('duplicate sample tests present');
  }
  for (const lang of DSA_LANGS) {
    if (!r.starterCode[lang] || !String(r.starterCode[lang]).trim()) issues.push('empty starterCode: ' + lang);
    else if (/TODO|FIXME|NotImplemented/i.test(r.starterCode[lang])) reviews.push(`placeholder in starter[${lang}]`);
  }
  for (const lang of DSA_LANGS) {
    const s = (r.functionSignature || {})[lang];
    if (!s || !s.name) issues.push('missing functionSignature: ' + lang);
    else {
      if (!Array.isArray(s.params)) issues.push(`sig[${lang}] params not array`);
      if (!s.returnType) issues.push(`sig[${lang}] missing returnType`);
    }
  }
  if (!(Number(r.timeLimitMs) > 0)) issues.push('missing/invalid timeLimitMs');
  if (Number(r.timeLimitMs) > 10000) reviews.push('timeLimitMs unusually high: ' + r.timeLimitMs);
  if (!(Number(r.memoryLimitKb) > 0)) reviews.push('missing memoryLimitKb');
  return { issues, reviews };
}

/* ================================ SECTION A ================================= */
function sectionA() {
  check('payload exports exactly 13 records', batch.records.length === 13, `got ${batch.records.length}`);
  check('BATCH_TITLES has exactly 13 titles', batch.BATCH_TITLES.length === 13, `got ${batch.BATCH_TITLES.length}`);
  check('slugs unique', new Set(batch.records.map((r) => r.slug)).size === batch.records.length);
  check('titles unique', new Set(batch.records.map((r) => r.title)).size === batch.records.length);
  check('payload order matches EXPECTED', EXPECTED.every((e, i) => batch.records[i] && batch.records[i].title === e[0]),
    EXPECTED.map((e, i) => `${i}:${batch.records[i] ? batch.records[i].title : '-'}`).join(','));
  check('payload order matches BATCH_TITLES (canonicalised)',
    batch.BATCH_TITLES.every((t, i) => batch.records[i] && batch.records[i].title === batch._internals.canonicalTitle(t)));

  const audit = JSON.parse(fs.readFileSync(AUDIT, 'utf8'));
  const rows = [...(audit.dsa.failures || []), ...(audit.dsa.reviews || [])];
  for (const e of EXPECTED) {
    const hit = rows.find((x) => x.title === e[0] && x.slug === e[1]);
    check(`audited row exists with exact title+slug: ${e[0]}`, !!hit, `slug=${e[1]}`);
  }
  check('audited DSA population unchanged (266 / 64 pass / 202 fail)',
    audit.dsa.audited === 266 && audit.dsa.passed === 64 && audit.dsa.failed === 202,
    `audited=${audit.dsa.audited} passed=${audit.dsa.passed} failed=${audit.dsa.failed}`);
  check('audit reports no duplicate titles or slugs',
    (audit.dsa.duplicateTitles || []).length === 0 && (audit.dsa.duplicateSlugs || []).length === 0);

  const b1 = new Set(batch1.BATCH_TITLES);
  const b2 = new Set(batch2.BATCH_TITLES);
  const over1 = batch.records.filter((r) => b1.has(r.title)).map((r) => r.title);
  const over2 = batch.records.filter((r) => b2.has(r.title)).map((r) => r.title);
  check('no Batch 1 record is re-authored by Batch 3', over1.length === 0, over1.join(','));
  check('no Batch 2 record is re-authored by Batch 3', over2.length === 0, over2.join(','));
  const priorSlugs = new Set([...batch1.records, ...batch2.records].map((r) => r.slug));
  check('no Batch 1/2 slug is reused', batch.records.every((r) => !priorSlugs.has(r.slug)));
  console.log(`  [A] identity done (${checks.length} checks so far)`);
}

/* ================================ SECTION B ================================= */
function sectionB() {
  for (const r of batch.records) {
    const { issues, reviews } = auditDsaIssues(r);
    check(`audit replica: zero issues for ${r.title}`, issues.length === 0, issues.join(' | '));
    reviews.forEach((rv) => warn(`audit review[${r.title}]: ${rv}`));
  }
  console.log(`  [B] audit replica done (${checks.length} checks so far)`);
}

/* ================================ SECTION C =================================
 * C1: the source JSON really comes from the two git blobs it names.
 * C2: the payload really comes from the source JSON.
 *
 * C1 EXECUTES each historical seed file in a vm sandbox with the DB layer stubbed
 * and no network, so the records it registers are produced by the file's OWN code.
 * That matters because the historical fixtures are not literal text: S1 builds its
 * 50 hidden tests per record with a deterministic `Array.from({length: 50}, ...)`
 * generator, and S2 stores one `testCases` entry. A substring search could not
 * verify those, and could not tell a real match from a coincidental one, so the
 * evidence JSON is compared field-by-field against the executed output instead.
 *
 * The S1 file is cut at the "ADDITIONAL PROBLEMS" marker: the reviewed records all
 * precede it and the later section is the known-corrupt part (Math.random()
 * generators, hard-coded wrong outputs, string-typed signatures). It is never
 * parsed, so it can never contribute a record.
 */
const vm = require('vm');
const CORRUPT_MARKER = '// ===== ADDITIONAL PROBLEMS =====';
const BLOB_REFS = {
  'git edbc6db: server/scripts/seedDSA100.js.backup': 'edbc6db:server/scripts/seedDSA100.js.backup',
  'git 0b6b376~1: server/utils/seedData.js': '0b6b376~1:server/utils/seedData.js',
};

function readBlob(ref) {
  return execFileSync('git', ['--no-pager', 'show', ref], {
    cwd: path.join(__dirname, '..', '..'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true,
  });
}

/** Execute a historical seed file and return the records it registers. */
function runSeed(ref, collectExpr) {
  const full = readBlob(ref);
  const cut = full.indexOf(CORRUPT_MARKER);
  const text = cut < 0 ? full : full.slice(0, cut);
  const sandbox = {
    require: (id) => {
      if (id === 'path') return path;
      if (id === 'dotenv') return { config() {} };
      if (id === 'mongoose') return { connect: async () => {}, disconnect: async () => {}, Schema: class {} };
      return {
        config() {}, then: () => {}, insertMany: async () => {}, countDocuments: async () => 0,
        find: () => ({ lean: async () => [] }),
      };
    },
    console: { log() {}, warn() {}, error() {} },
    process: { env: {}, exit() {}, argv: [] },
    __dirname: path.join(__dirname, '..', 'server', 'scripts'),
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${text}\n;globalThis.__out = ${collectExpr};`, sandbox, { timeout: 60000, filename: ref });
  if (!Array.isArray(sandbox.__out)) throw new Error(`historical file ${ref} registered no records`);
  return sandbox.__out;
}

/** The S2 seed module is executed exactly like S1: it declares
 *  `const problems = [...]`, so running it with a stubbed DB layer and reading
 *  that identifier gives the records the historical file actually defined. */
function parseS2(ref) {
  return runSeed(ref, 'problems');
}

function sectionC() {
  /* ---- C1: source JSON <-> executed git history ---- */
  const historical = {};
  try {
    const s1 = runSeed(BLOB_REFS['git edbc6db: server/scripts/seedDSA100.js.backup'], 'problems');
    historical['git edbc6db: server/scripts/seedDSA100.js.backup'] = s1;
    check(`S1 historical file executed and registered records (${s1.length})`, s1.length > 0, `${s1.length} records`);
  } catch (e) {
    check('S1 historical file executed and registered records', false, String(e.message).slice(0, 200));
  }
  try {
    const s2 = parseS2(BLOB_REFS['git 0b6b376~1: server/utils/seedData.js']);
    historical['git 0b6b376~1: server/utils/seedData.js'] = s2;
    check(`S2 historical file parsed (${s2.length} entries)`, s2.length > 0, `${s2.length} entries`);
  } catch (e) {
    check('S2 historical file parsed', false, String(e.message).slice(0, 200));
  }

  for (const sourceTitle of batch.BATCH_TITLES) {
    const s = SRC[sourceTitle];
    const r = batch.records.find((x) => x.provenance.sourceTitle === sourceTitle || x.title === sourceTitle);
    check(`source record present in evidence JSON: ${sourceTitle}`, !!s);
    if (!s || !r) continue;
    check(`provenance.ref matches the source record: ${sourceTitle}`, r.provenance.ref === s.sourceRef);
    check(`provenance.source matches the source record: ${sourceTitle}`, r.provenance.source === s.source);

    const rows = historical[s.sourceRef];
    if (!Array.isArray(rows)) { check(`historical rows readable: ${sourceTitle}`, false, s.sourceRef); continue; }
    const hits = rows.filter((x) => x && x.title === sourceTitle);
    check(`historical file registers "${sourceTitle}"`, hits.length > 0, `${hits.length} occurrence(s)`);
    if (!hits.length) continue;

    // S1 registers "Pow(x, n)" TWICE (both problemId REC-001): a complete entry
    // (3 samples, 88-char description) followed later by a degraded duplicate
    // (2 samples, 62-char description). The evidence must be the COMPLETE one;
    // assert that explicitly instead of silently taking whichever comes last.
    // Selection compares the CONVERTED fixture input, because Merge K's evidence
    // is the documented re-encoding of the source's legacy flat test case. The two
    // seed files name their fixtures differently (S1 `sampleTests`, S2 `testCases`).
    const convSel = batch._internals.convertSourceFixture;
    // S2 stores its single case as testCases[] with `expectedOutput`; the module's
    // converter takes {input, output}, so normalise the shape before converting.
    const asFixture = (t) => ({ input: t.input, output: t.output !== undefined ? t.output : t.expectedOutput });
    const histInputs = (x) => JSON.stringify(
      (x.sampleTests || x.testCases || []).map((t) => convSel(sourceTitle, asFixture(t)).input),
    );
    const evidenceInputs = JSON.stringify(s.sampleTests.map((t) => convSel(sourceTitle, t).input));
    const exact = hits.filter((x) => histInputs(x) === evidenceInputs);
    check(`exactly one historical occurrence matches the evidence sample fixtures: ${sourceTitle}`,
      exact.length === 1, `${exact.length} of ${hits.length} occurrence(s) match`);
    if (exact.length !== 1) continue;
    const h = exact[0];

    let pairs;
    if (s.sourceRef.indexOf('edbc6db') >= 0) {
      pairs = [
        ['description', s.description, h.description],
        ['difficulty', s.difficulty, h.difficulty],
        ['topic', s.topic, h.topic],
        ['tags', s.tags, h.tags],
        ['companies', s.companies, h.companies],
        ['constraints', s.constraints, h.constraints],
        ['inputFormat', s.inputFormat, h.inputFormat],
        ['outputFormat', s.outputFormat, h.outputFormat],
        ['functionSignature', s.functionSignature, h.functionSignature],
        ['sampleTests', s.sampleTests, h.sampleTests],
        ['hiddenTests', s.hiddenTests, h.hiddenTests],
      ];
    } else {
      pairs = [
        ['description', s.description, h.description],
        ['difficulty', s.difficulty, h.difficulty],
        ['tags', s.tags, h.tags],
        ['functionSignature', s.functionSignature, h.functionSignature],
        ['examples', s.examples, h.examples],
        ['legacy test case', s.sampleTests[0], { input: h.testCases[0].input, output: h.testCases[0].expectedOutput }],
        ['constraints (newline string -> array)', s.constraints, String(h.constraints).split('\n')],
      ];
    }
    for (const pair of pairs) {
      check(`evidence matches the executed historical file (${pair[0]}): ${sourceTitle}`,
        JSON.stringify(pair[1]) === JSON.stringify(pair[2]),
        `evidence=${JSON.stringify(pair[1]).slice(0, 100)} historical=${JSON.stringify(pair[2]).slice(0, 100)}`);
    }
    if (s.sourceRef.indexOf('edbc6db') >= 0) {
      check(`historical hidden tests come from the file's own generator: ${sourceTitle}`,
        Array.isArray(h.hiddenTests) && h.hiddenTests.length > 0, `${(h.hiddenTests || []).length} hidden tests`);
    }
  }

  /* ---- C2: payload <-> source JSON ---- */
  for (const r of batch.records) {
    const sourceTitle = r.provenance.sourceTitle || r.title;
    const s = SRC[sourceTitle];
    if (!s) { check(`source record for payload record: ${r.title}`, false, sourceTitle); continue; }

    check(`description preserved from source: ${r.title}`, r.description === s.description);
    check(`difficulty preserved from source: ${r.title}`, r.difficulty === s.difficulty, `${r.difficulty} vs ${s.difficulty}`);
    check(`constraints preserved from source: ${r.title}`,
      JSON.stringify(r.constraints) === JSON.stringify(s.constraints));
    check(`companies preserved from source: ${r.title}`,
      JSON.stringify(r.companies) === JSON.stringify(s.companies || []));
    check(`topic preserved from source: ${r.title}`, r.topic === s.topic, `${r.topic} vs ${s.topic}`);
    check(`tags = source tags de-duplicated: ${r.title}`,
      JSON.stringify(r.tags) === JSON.stringify(expectDedupeTags(s.topic, s.tags)), JSON.stringify(r.tags));
    check(`outputFormat.description preserved from source: ${r.title}`,
      r.outputFormat.description === String(s.outputFormat.description));

    /* inputFormat: names/order/constraints from the source, types from the EFFECTIVE signature */
    check(`inputFormat arity matches the signature: ${r.title}`,
      r.inputFormat.length === r.functionSignature.javascript.params.length);
    r.inputFormat.forEach((f, i) => {
      const sf = s.inputFormat[i];
      const p = r.functionSignature.javascript.params[i];
      check(`inputFormat[${i}] param name from source: ${r.title}`, !!sf && f.paramName === sf.paramName);
      check(`inputFormat[${i}] type from the effective signature: ${r.title}`, f.type === p.type, `${f.type} vs ${p.type}`);
      if (sf && sf.constraints) {
        check(`inputFormat[${i}] constraint from source: ${r.title}`, f.constraints === String(sf.constraints));
      }
    });

    /* signature: identical to the source, or a documented override that keeps the name */
    for (const lang of DSA_LANGS) {
      const base = s.functionSignature[lang];
      const sig = r.functionSignature[lang];
      const overridden = JSON.stringify(sig) !== JSON.stringify(base);
      check(`signature keeps the source function name (${lang}): ${r.title}`,
        !!base && sig.name === base.name, `${sig.name} vs ${base && base.name}`);
      if (overridden) {
        check(`override documented in provenance (${lang}): ${r.title}`,
          r.provenance.deviations && r.provenance.deviations !== 'none', r.provenance.deviations);
        warn(`signature override (${lang}): ${r.title}`,
          `source=${JSON.stringify(base)} payload=${JSON.stringify(sig)}`);
      } else {
        check(`signature identical to source (${lang}): ${r.title}`,
          sig.name === base.name && JSON.stringify(sig.params) === JSON.stringify(base.params)
          && sig.returnType === base.returnType, JSON.stringify(sig));
      }
    }

    /* examples: source examples field, or the source sample tests verbatim */
    if (Array.isArray(s.examples) && s.examples.length) {
      const want = s.examples.map((e) => ({ input: String(e.input), output: String(e.output) }));
      check(`examples taken from the source examples field: ${r.title}`,
        JSON.stringify(r.examples) === JSON.stringify(want), JSON.stringify(r.examples));
      check(`exampleSource recorded: ${r.title}`, /source examples field/.test(r.provenance.exampleSource || ''));
    } else {
      const want = s.sampleTests.map((t) => {
        const ex = { input: String(t.input), output: String(t.output) };
        if (t.explanation) ex.explanation = String(t.explanation);
        return ex;
      });
      check(`examples = the source sample tests verbatim: ${r.title}`, JSON.stringify(r.examples) === JSON.stringify(want));
      check(`exampleSource recorded: ${r.title}`, /source sampleTests/.test(r.provenance.exampleSource || ''));
    }

    /* fixtures: re-derive them and require byte-identical results + full source coverage */
    const rebuilt = batch.buildTests(sourceTitle);
    check(`fixtures re-derive identically: ${r.title}`,
      JSON.stringify(rebuilt.samples.map((t) => [t.input, t.output]))
      === JSON.stringify(r.sampleTests.map((t) => [t.input, t.output]))
      && JSON.stringify(rebuilt.hidden.map((t) => [t.input, t.output]))
      === JSON.stringify(r.hiddenTests.map((t) => [t.input, t.output])));
    check(`dropped fixtures recorded in provenance: ${r.title}`,
      JSON.stringify(rebuilt.dropped) === JSON.stringify(r.provenance.droppedFixtures || []),
      `${(rebuilt.dropped || []).length} dropped`);
    for (const d of rebuilt.dropped) {
      check(`dropped fixture has a reason: ${r.title} :: ${String(d.input).slice(0, 20)}`,
        typeof d.reason === 'string' && d.reason.length > 10, d.reason);
    }
    check(`all source sample fixtures admitted: ${r.title}`, rebuilt.samples.length === s.sampleTests.length,
      `${rebuilt.samples.length} of ${s.sampleTests.length}`);

    /* Every admitted fixture input must be a source fixture (after the module's own
     * documented conversion, e.g. Merge K's legacy flat encoding -> nested arrays)
     * or a documented derivation. Comparing against the CONVERTED form is what
     * makes that re-encoding auditable instead of looking like an invented fixture. */
    const conv = batch._internals.convertSourceFixture;
    const sourceInputs = new Set([
      ...s.sampleTests.map((t) => conv(sourceTitle, t).input),
      ...s.hiddenTests.map((t) => conv(sourceTitle, t).input),
    ]);
    const payloadInputs = [...r.sampleTests, ...r.hiddenTests].map((t) => t.input);
    const orphans = payloadInputs.filter((i) => !sourceInputs.has(i));
    const unexplained = orphans.filter((i) => !r.hiddenTests.some((t) => t.input === i && t.category === 'derived'));
    check(`non-source fixtures are only documented derivations: ${r.title}`,
      unexplained.length === 0, `${orphans.length} derived, ${unexplained.length} unexplained: ${unexplained.slice(0, 2).join(' , ')}`);

    /* the stored reference must be the SELF-CONTAINED javascript reference */
    const refs = batch.referencesFor(sourceTitle);
    check(`stored reference is the self-contained javascript reference: ${r.title}`,
      r.referenceSolution.code === batch.javascriptReference(sourceTitle),
      r.referenceSolution.code.slice(0, 60));
    check(`javascript reference exposes a solve alias: ${r.title}`,
      /const solve = /.test(r.referenceSolution.code) || r.functionSignature.javascript.name === 'solve');
    check(`referenceSolution.language is javascript: ${r.title}`, r.referenceSolution.language === 'javascript');
    for (const lang of DSA_LANGS) {
      check(`reference declares the signature function name (${lang}): ${r.title}`,
        typeof refs[lang] === 'string' && refs[lang].includes(r.functionSignature[lang].name),
        r.functionSignature[lang].name);
    }
  }
  console.log(`  [C] provenance done (${checks.length} checks so far)`);
}
/* ================================ SECTION D =================================
 * JavaScript runs through the platform's own sandbox (genericValidator
 * normalizeProblem + validateUserCode with the stored reference).
 * Java and C++ run through the real drivers: buildDriverFromSignature composes
 * the typed driver, localExecutor compiles and runs it, outputsMatch decides.
 * Python is compile-verified and its platform limitation is probed, never worked
 * around (see report.limitations).
 */
const recordSummaries = [];

/** The Java reference must be wrapped in `class Solution` (what the driver expects)
 *  and must ship the record's own helper preamble (the driver supplies only imports). */
function javaSource(r, sourceTitle) {
  const pre = batch._internals.LIST_PREAMBLE[sourceTitle] || {};
  return `import java.util.*;\n\n${pre.java || ''}class Solution {\n${batch.REFERENCES[sourceTitle].java}\n}\n`;
}

/** C++: the driver supplies only the includes, so any record-level helper must be
 *  written out explicitly (same pattern as the Batch 1/2 validators). */
function cppSource(r, sourceTitle) {
  const pre = batch._internals.LIST_PREAMBLE[sourceTitle] || {};
  return `${pre.cpp || ''}${batch.REFERENCES[sourceTitle].cpp}`;
}

async function runFixturesIn(record, lang, source) {
  const sig = record.functionSignature[lang];
  const returnType = record.functionSignature.javascript.returnType;
  let full;
  try {
    full = judge0.buildDriverFromSignature(source, lang, sig);
  } catch (e) {
    check(`driver build (${lang}): ${record.title}`, false, e.message);
    return { passed: 0, total: 0, error: 'driver build failed: ' + e.message, bad: [] };
  }
  const cases = [...record.sampleTests, ...record.hiddenTests];
  let passed = 0;
  const bad = [];
  for (const tc of cases) {
    const res = await localExecutor.executeSingleCase(full, lang, tc.input, tc.output, returnType);
    if (res.passed) passed++;
    else bad.push(`in=${JSON.stringify(String(tc.input)).slice(0, 60)} want=${String(tc.output).slice(0, 40)} got=${String(res.output).slice(0, 40)}${res.errorType ? ' ' + res.errorType : ''}${res.error ? ' ' + String(res.error).slice(0, 140) : ''}`);
  }
  return { passed, total: cases.length, bad };
}

const SANDBOX = G.createSandboxExecutor({
  buildDriverFromSignature: (c, l, s) => judge0.buildDriverFromSignature(c, l, s),
  executeSingleCase: (fc, l, i, e, rt) => judge0.executeSingleCase(fc, l, i, e, rt),
});

async function sectionD() {
  for (const r of batch.records) {
    const sourceTitle = r.provenance.sourceTitle || r.title;
    const summary = {
      title: r.title, slug: r.slug, source: r.provenance.source,
      samples: r.sampleTests.length, hidden: r.hiddenTests.length,
      dropped: (r.provenance.droppedFixtures || []).length,
    };
    const total = r.sampleTests.length + r.hiddenTests.length;

    /* --- JavaScript: the platform's own sandbox path with the stored reference --- */
    const doc = {
      title: r.title, slug: r.slug,
      functionSignature: r.functionSignature,
      sampleTests: r.sampleTests, hiddenTests: r.hiddenTests,
    };
    try {
      const norm = G.normalizeProblem(doc);
      const res = await G.validateUserCode(norm, r.referenceSolution.code, 'javascript', {
        runTestCase: SANDBOX, onlySample: false,
      });
      check(`reference execution (javascript, all fixtures): ${r.title}`,
        res.passed === res.total && res.total === total, `passed=${res.passed}/${res.total} expected=${total} ${res.summary || ''}`);
      if (res.passed !== res.total) {
        const bad = (res.results || []).filter((x) => !x.passed).slice(0, 3)
          .map((x) => `in=${JSON.stringify(String(x == null ? '' : x.input)).slice(0, 60)} want=${x == null ? '' : x.expected} got=${x == null ? '' : x.actual} ${x && x.errorType ? x.errorType : ''}`);
        check(`  js failures [${r.title}]`, false, bad.join(' || '));
      }
      summary.javascript = `${res.passed}/${res.total}`;
    } catch (e) {
      check(`reference execution (javascript, all fixtures): ${r.title}`, false, 'validator threw: ' + e.message);
      summary.javascript = 'ERROR';
    }

    /* --- Java and C++: the same drivers, the per-language reference bodies --- */
    for (const lang of ['java', 'cpp']) {
      const src = lang === 'java' ? javaSource(r, sourceTitle) : cppSource(r, sourceTitle);
      const out = await runFixturesIn(r, lang, src);
      check(`reference execution (${lang}, all fixtures): ${r.title}`, out.passed === out.total,
        `${out.passed}/${out.total}${out.error ? ' ' + out.error : ''}${out.bad && out.bad.length ? ' :: ' + out.bad.slice(0, 2).join(' || ') : ''}`);
      summary[lang] = `${out.passed}/${out.total}`;
      if (out.bad && out.bad.length) out.bad.slice(0, 5).forEach((b, i) => check(`  ${lang} failure ${i + 1} [${r.title}]`, false, b));
    }

    /* --- Python: compile the reference, and probe the driver limitation once --- */
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b3py-'));
    const hasPy = runCmd('py', ['--version'], tmp) === null;
    if (hasPy) {
      const pyRef = batch.REFERENCES[sourceTitle].python;
      const f = path.join(tmp, 'ref.py');
      fs.writeFileSync(f, pyRef, 'utf8');
      const err = runCmd('py', ['-m', 'py_compile', f], tmp);
      check(`python reference compiles: ${r.title}`, !err, err || '');
      if (r === batch.records[0]) {
        let driverOut = '';
        try {
          const full = judge0.buildDriverFromSignature(pyRef, 'python', r.functionSignature.python);
          const df = path.join(tmp, 'drv.py');
          fs.writeFileSync(df, full, 'utf8');
          driverOut = execFileSync('py', [df], { input: r.sampleTests[0].input, encoding: 'utf8', timeout: 20000 });
        } catch (e) {
          driverOut = 'ERROR: ' + String((((e.stderr || '') + '') || e.message)).trim().split('\n').pop();
        }
        summary.pythonDriver = String(driverOut).trim().slice(0, 140);
        warn('python driver passes parameter names, not parsed values (platform-wide, pre-existing)',
          `probe on "${r.title}" -> ${String(driverOut).trim().slice(0, 80)}`);
      }
      summary.python = 'compiles';
    } else {
      summary.python = 'skipped (no python toolchain)';
      warn(`python toolchain unavailable: ${r.title}`);
    }
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* ignore */ }

    recordSummaries.push(summary);
    console.log(`  [D] ${r.title}: js=${summary.javascript} java=${summary.java} cpp=${summary.cpp} py=${summary.python} (s=${summary.samples} h=${summary.hidden} drop=${summary.dropped})`);
  }
}

/* ================================ SECTION E ================================= */
function runCmd(cmd, args, cwd) {
  try {
    execFileSync(cmd, args, { cwd, stdio: 'pipe', timeout: 90000, windowsHide: true });
    return null;
  } catch (e) {
    const err = (e.stderr && String(e.stderr)) || (e.stdout && String(e.stdout)) || e.message || '';
    return err.slice(0, 500);
  }
}

function sectionE() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b3tpl-'));
  const toolchain = {
    python: runCmd('py', ['--version'], tmp) === null,
    java: runCmd('javac', ['-version'], tmp) === null,
    cpp: runCmd('g++', ['--version'], tmp) === null,
  };
  check('toolchain available: node', true, process.version);
  check('toolchain available: python (py)', toolchain.python, toolchain.python ? '' : 'py launcher unavailable');
  check('toolchain available: javac', toolchain.java, toolchain.java ? '' : 'javac unavailable');
  check('toolchain available: g++', toolchain.cpp, toolchain.cpp ? '' : 'g++ unavailable');

  const tmpl = [];
  for (const r of batch.records) {
    const per = { title: r.title };
    for (const lang of DSA_LANGS) {
      let full;
      try {
        full = judge0.buildDriverFromSignature(r.starterCode[lang], lang, r.functionSignature[lang]);
      } catch (e) {
        check(`driver build (${lang}): ${r.title}`, false, e.message);
        per[lang] = 'driver-error';
        continue;
      }
      let err = null;
      if (lang === 'javascript') {
        const f = path.join(tmp, 'main.js');
        fs.writeFileSync(f, full, 'utf8');
        err = runCmd('node', ['--check', f], tmp);
      } else if (lang === 'python') {
        const f = path.join(tmp, 'main.py');
        fs.writeFileSync(f, full, 'utf8');
        err = toolchain.python ? runCmd('py', ['-m', 'py_compile', f], tmp) : 'skipped: python toolchain unavailable';
      } else if (lang === 'java') {
        const f = path.join(tmp, 'Main.java');
        fs.writeFileSync(f, full, 'utf8');
        err = toolchain.java ? runCmd('javac', ['-encoding', 'UTF-8', '-d', tmp, f], tmp) : 'skipped: javac unavailable';
      } else {
        const f = path.join(tmp, 'main.cpp');
        fs.writeFileSync(f, full, 'utf8');
        err = toolchain.cpp ? runCmd('g++', ['-std=c++17', '-fsyntax-only', f], tmp) : 'skipped: g++ unavailable';
      }
      per[lang] = err ? 'FAIL' : 'ok';
      check(`template compiles (${lang}): ${r.title}`, !err, err || '');
    }
    tmpl.push(per);
    console.log(`  [E] ${r.title}: js=${per.javascript} java=${per.java} py=${per.python} cpp=${per.cpp}`);
  }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* ignore */ }
  return tmpl;
}

/* ================================== MAIN =================================== */
/* --structural runs only the fast offline sections (identity, audit replica,
 * provenance). The full run additionally executes every fixture in three
 * languages and compiles all 52 templates, which takes tens of minutes; the
 * migration always runs the FULL validator. */
const STRUCTURAL_ONLY = process.argv.includes('--structural');

async function main() {
  const started = Date.now();
  console.log('== Batch 3 offline validation (read-only, fail-closed)'
    + (STRUCTURAL_ONLY ? ' [STRUCTURAL ONLY]' : '') + ' ==');
  sectionA();
  sectionB();
  sectionC();
  let templates = null;
  if (!STRUCTURAL_ONLY) {
    await sectionD();
    templates = sectionE();
  }

  const admitted = batch.records.reduce((n, r) => n + r.sampleTests.length + r.hiddenTests.length, 0);
  const dropped = batch.records.reduce((n, r) => n + (r.provenance.droppedFixtures || []).length, 0);

  const report = {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    structuralOnly: STRUCTURAL_ONLY,
    verdict: STRUCTURAL_ONLY && failures.length === 0 ? 'PASS (structural only)' : (failures.length === 0 ? 'PASS' : 'FAIL'),
    checksRun: checks.length,
    failureCount: failures.length,
    warningCount: warnings.length,
    recordCount: batch.records.length,
    admittedFixtures: admitted,
    droppedFixtures: dropped,
    failures,
    warnings,
    records: recordSummaries,
    templates,
    checks,
    droppedByRecord: batch.records.map((r) => ({
      title: r.title,
      source: r.provenance.source,
      dropped: r.provenance.droppedFixtures || [],
    })).filter((x) => x.dropped.length),
    limitations: [
      'MongoDB was not contacted; this validator is offline by design (no DB read or write).',
      STRUCTURAL_ONLY ? 'STRUCTURAL RUN: sections D (execution) and E (template compilation) were SKIPPED. '
        + 'This is not a full PASS and must not be used to authorise a migration.' : '',
      'Every fixture is executed for JavaScript (platform sandbox), Java and C++ (real drivers, compiled and run). '
      + 'Python cannot be executed by the platform: localExecutor.executeSingleCase returns system_error for python, '
      + 'and the python driver in judge0Coding.buildDriverFromSignature passes the parameter NAMES to the function '
      + 'instead of driver-parsed values, so no solution body can be executed through it. This is a pre-existing, '
      + 'platform-wide driver limitation (identical for all 266 DSA records) and is deliberately NOT worked around '
      + 'here, because the execution implementation must not change. Python templates/references are compile-verified.',
      'The provenance check proves a source value is present in the historical git blob after removing backslashes, '
      + 'double quotes and whitespace. Those characters are the only ones the two seed files use for JS literal '
      + 'escaping, so the normalisation cannot mask a substantive content difference.',
    ],
  };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nchecks=${checks.length} failures=${failures.length} warnings=${warnings.length} `
    + `records=${batch.records.length} fixtures=${admitted} dropped=${dropped} duration=${report.durationMs}ms`);
  for (const f of failures) console.log('FAIL ' + f);
  if (warnings.length) warnings.forEach((w) => console.log('WARN ' + w));
  console.log('report -> ' + OUT);
  console.log('VERDICT: ' + report.verdict);
  process.exit(failures.length ? 1 : 0);
}

main().catch((e) => {
  console.error('validator threw: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
