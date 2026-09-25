'use strict';
/* ---------------------------------------------------------------------------
 * validateAuthoredDsaBatch1.js
 * Offline, READ-ONLY, fail-closed validation of scripts/authoredDsaBatch1.js.
 * No database is opened; nothing is written except the report file below.
 *
 * Sections:
 *   A. identity     - 16 records, unique slugs/titles, exact match to the
 *                     _full_audit_report.json failure entries they claim to fix.
 *   B. audit replica - local re-implementation of full_audit.js auditDsa issues;
 *                     every record must produce ZERO issues.
 *   C. provenance   - (S) fixtures cross-checked against SOLVERS with INDEPENDENT
 *                     tree codecs; (L)/(C) content re-derived from the source
 *                     files; (M) difficulty/topic/tags re-derived with dedupe.
 *   D. execution    - every sample+hidden fixture run through the REAL sandbox
 *                     (normalizeProblem -> buildDriverFromSignature ->
 *                     localExecutor) using the record's referenceSolution;
 *                     passed MUST equal total for every record.
 *   E. templates    - all four language starter templates, wrapped in their real
 *                     drivers, must compile (node --check / py_compile / javac /
 *                     g++ -fsyntax-only).
 *
 * Exit code 0 = all checks passed; 1 = at least one failure (fail-closed).
 * Report -> server/_batch1_validation_report.json
 * --------------------------------------------------------------------------- */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const G = require('../utils/genericValidator');
const judge0 = require('../utils/judge0Coding');
const PLACEHOLDER = require('../utils/placeholderFixtures');
const { SOLVERS } = require('./testCaseGenerators');
const { CURATED } = require('./curatedProblems');
const batch = require('./authoredDsaBatch1');

const OUT = path.join(__dirname, '..', '_batch1_validation_report.json');
const AUDIT = path.join(__dirname, '..', '_full_audit_report.json');

const PLACEHOLDER_RE = /TODO|TBD|FIXME|not yet reviewed|placeholder|lorem ipsum|coming soon|\bXXX\b/i;
const RAW_ID_RE = /\bhm_\d{10,}\b|\b65a[0-9a-f]{20,}\b/;
const VALID_DIFFS = ['easy', 'medium', 'hard'];
const DSA_LANGS = ['javascript', 'java', 'python', 'cpp'];

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

/* -------- INDEPENDENT codecs (local copies; never import module internals) -- */
function levelToNested(arr) {
  if (!arr || arr.length === 0) return null;
  const nodes = arr.map((v) => (v === null || v === undefined ? null : { val: v, left: null, right: null }));
  let j = 1;
  for (let i = 0; i < nodes.length && j < nodes.length; i++) {
    if (!nodes[i]) continue;
    nodes[i].left = nodes[j++] || null;
    if (j < nodes.length) nodes[i].right = nodes[j++] || null;
  }
  return nodes[0];
}

/* -------- local replicas of documented transforms (source -> payload) ------ */
const decodeLiteralNewlines = (s) => String(s).split('\\n').join('\n');
const wordListEncode = (line) => JSON.stringify(String(line).split(','));
function gridToRowStrings(input) {
  const grid = JSON.parse(String(input));
  return JSON.stringify(grid.map((row) => row.map((v) => (v ? '1' : '0')).join('')));
}
function quotePartitionList(s) {
  return String(s).replace(/\[([^\[\]]+)\]/g, (_, inner) =>
    '[' + inner.split(',').map((t) => '"' + t.trim() + '"').join(',') + ']');
}
function sanitizePartitionOutput(jsonStr) {
  return JSON.stringify(JSON.parse(jsonStr)
    .filter((p) => Array.isArray(p) && p.every((t) => t === String(t).split('').reverse().join(''))));
}
function dedupeByInput(list) {
  const seen = new Set();
  return list.filter((t) => {
    const k = String(t.input);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
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
  if (!VALID_DIFFS.includes(String(r.difficulty || '').toLowerCase())) issues.push('invalid difficulty');

  const topics = [...(r.topic ? [String(r.topic)] : []), ...(Array.isArray(r.tags) ? r.tags : [])];
  if (topics.length === 0) issues.push('missing topics');
  else {
    const lower = topics.map((t) => String(t).toLowerCase().trim());
    if (new Set(lower).size !== lower.length) issues.push('duplicate topics: ' + JSON.stringify(topics));
    if (lower.some((t) => !t)) issues.push('empty topic entry');
  }

  const desc = String(r.description || '').trim();
  if (desc.length < 40) issues.push('description too short/missing (' + desc.length + ')');
  else if (PLACEHOLDER_RE.test(desc)) issues.push('placeholder description');
  else if (PLACEHOLDER.isPlaceholderDescription(desc)) issues.push('seeder-generated description');
  if (RAW_ID_RE.test(desc)) issues.push('raw id in description');
  if ((String(r.description || '').match(/```/g) || []).length % 2 !== 0) reviews.push('unbalanced markdown fences');

  if (!Array.isArray(r.examples) || r.examples.length === 0) reviews.push('missing examples');
  else r.examples.forEach((ex, i) => {
    if (!ex || typeof ex !== 'object' || ex.input === undefined || ex.output === undefined) {
      issues.push('examples[' + i + '] malformed');
    }
  });

  if (!Array.isArray(r.constraints) || r.constraints.length === 0) reviews.push('missing constraints');
  else if (r.constraints.some((c) => !String(c || '').trim())) issues.push('empty constraint entry');

  const st = Array.isArray(r.sampleTests) ? r.sampleTests : [];
  const ht = Array.isArray(r.hiddenTests) ? r.hiddenTests : [];
  if (st.length === 0) issues.push('NO sampleTests');
  if (ht.length === 0) reviews.push('NO hiddenTests');
  const val = (tc) => (tc && tc.output !== undefined && tc.output !== null ? tc.output : (tc || {}).expectedOutput);
  const chk = (arr, kind) => arr.forEach((tc, i) => {
    if (!tc || typeof tc !== 'object') { issues.push(kind + '[' + i + '] not an object'); return; }
    if (tc.input === undefined || tc.input === null || String(tc.input).trim() === '') issues.push(kind + '[' + i + '] empty input');
    if (val(tc) === undefined || val(tc) === null || String(val(tc)).trim() === '') issues.push(kind + '[' + i + '] empty expected output');
  });
  chk(st, 'sampleTests');
  chk(ht, 'hiddenTests');
  if (st.length && ht.length) {
    const key = (tc) => JSON.stringify([tc.input, val(tc)]);
    const sk = new Set(st.map(key));
    if (ht.length <= st.length && ht.every((t) => sk.has(key(t)))) reviews.push('hidden tests mirror samples only');
    if (new Set(ht.map(key)).size !== ht.length) reviews.push('duplicate hidden tests present');
    if (new Set(st.map(key)).size !== st.length) issues.push('duplicate sample tests present');
  }

  const sig = r.functionSignature || {};
  const sc = r.starterCode || {};
  for (const lang of ['javascript', 'java', 'python', 'cpp']) {
    if (!sc[lang] || !String(sc[lang]).trim()) issues.push('empty starterCode: ' + lang);
    else if (/TODO|FIXME|NotImplemented/i.test(sc[lang])) reviews.push('placeholder in starter[' + lang + ']');
    const s = sig[lang];
    if (!s || !s.name) issues.push('missing functionSignature: ' + lang);
    else {
      if (!Array.isArray(s.params)) issues.push('sig[' + lang + '] params not array');
      if (!s.returnType) issues.push('sig[' + lang + '] missing returnType');
    }
  }
  if (!(Number(r.timeLimitMs) > 0)) issues.push('missing/invalid timeLimitMs');
  if (!(Number(r.memoryLimitKb) > 0)) issues.push('missing memoryLimitKb');
  return { issues, reviews };
}

/* ================================ SECTION A =============================== */
function sectionA() {
  check('payload exports exactly 16 records', batch.records.length === 16, `got ${batch.records.length}`);
  check('BATCH_TITLES has exactly 16 titles', batch.BATCH_TITLES.length === 16, `got ${batch.BATCH_TITLES.length}`);
  check('BATCH_TITLES order matches records', batch.BATCH_TITLES.every((t, i) => batch.records[i] && batch.records[i].title === t));
  const slugs = new Set(batch.records.map((r) => r.slug));
  const titles = new Set(batch.records.map((r) => r.title));
  check('slugs unique', slugs.size === 16, `${slugs.size} unique`);
  check('titles unique', titles.size === 16, `${titles.size} unique`);

  if (!fs.existsSync(AUDIT)) { check('audit report present', false, AUDIT); return; }
  const audit = JSON.parse(fs.readFileSync(AUDIT, 'utf8'));
  const fails = (audit.dsa && audit.dsa.failures) || [];
  for (const r of batch.records) {
    const f = fails.find((x) => x.title === r.title);
    if (!f) check(`listed as a DSA audit failure: ${r.title}`, false, 'title absent from _full_audit_report.json failures');
    else check(`audit slug matches payload: ${r.title}`, f.slug === r.slug, `audit=${f.slug} payload=${r.slug}`);
  }
}

/* ================================ SECTION B =============================== */
function sectionB() {
  for (const r of batch.records) {
    const { issues, reviews } = auditDsaIssues(r);
    check(`audit replica clean: ${r.title}`, issues.length === 0, issues.join(' | '));
    for (const rv of reviews) warn(`audit review[${r.title}]: ${rv}`);
  }
}

/* ================================ SECTION C =============================== */
function sectionC() {
  const I = batch._internals;
  for (const r of batch.records) {
    /* --- (M) metadata row: difficulty / topic / deduplicated tags --- */
    let m = null;
    try { m = I.metaRow(r.title); } catch (e) { check(`(M) metadata row: ${r.title}`, false, e.message); continue; }
    check(`(M) difficulty: ${r.title}`, r.difficulty === m.difficulty, `payload=${r.difficulty} source=${m.difficulty}`);
    check(`(M) topic: ${r.title}`, r.topic === m.topic, `payload=${r.topic} source=${m.topic}`);
    const expTags = expectDedupeTags(m.topic, m.tags);
    check(`(M) tags de-duplicated: ${r.title}`, JSON.stringify(r.tags) === JSON.stringify(expTags),
      `payload=${JSON.stringify(r.tags)} expected=${JSON.stringify(expTags)}`);

    if (r.provenance.source === 'S') {
      /* --- (S) solver cross-check with INDEPENDENT codecs --- */
      const solver = SOLVERS[r.title];
      if (!check(`(S) solver exists: ${r.title}`, !!solver, 'SOLVERS entry missing')) continue;
      check(`(S) fixture counts 3/50: ${r.title}`,
        r.sampleTests.length === 3 && r.hiddenTests.length === 50,
        `samples=${r.sampleTests.length} hidden=${r.hiddenTests.length}`);
      let bad = 0; let first = '';
      for (const t of r.sampleTests.concat(r.hiddenTests)) {
        const rebuilt = String(t.input).split('\n').map((ln) => {
          const v = JSON.parse(ln);
          return Array.isArray(v) ? JSON.stringify(levelToNested(v)) : ln;
        }).join('\n');
        let got;
        try { got = String(solver.solve(rebuilt)); } catch (e) { got = 'SOLVER-THREW: ' + e.message; }
        if (got !== String(t.output)) {
          bad++;
          if (!first) first = `input=${JSON.stringify(t.input).slice(0, 90)} stored=${t.output} solver=${got}`;
        }
      }
      check(`(S) SOLVERS reproduces every stored expected output: ${r.title}`, bad === 0,
        bad ? `${bad} mismatch; first: ${first}` : '');
    } else if (r.provenance.source === 'L') {
      /* --- (L) content must equal the legacy source entry --- */
      let e = null;
      try { e = I.legacyEntry(r.title); } catch (ex) { check(`(L) legacy entry: ${r.title}`, false, ex.message); continue; }
      check(`(L) description verbatim: ${r.title}`, r.description === e.description);
      check(`(L) constraints verbatim: ${r.title}`, JSON.stringify(r.constraints) === JSON.stringify(e.constraints));
      check(`(L) examples verbatim: ${r.title}`, JSON.stringify(r.examples) === JSON.stringify(e.examples));
      checkLTests(r, e);
    } else if (r.provenance.source === 'C+L') {
      /* --- (C) content must equal the curated entry --- */
      const c = CURATED[r.title];
      const e = I.legacyEntry(r.title);
      if (!check(`(C) curated entry exists: ${r.title}`, !!c)) continue;
      check(`(C) description verbatim: ${r.title}`, r.description === c.desc);
      check(`(C) constraints verbatim: ${r.title}`, JSON.stringify(r.constraints) === JSON.stringify(c.constraints));
      check(`(C) examples verbatim: ${r.title}`, JSON.stringify(r.examples) === JSON.stringify(c.examples));
      const expSigs = Object.assign({}, c.functionSignature, r.title === 'Number of Islands'
        ? { cpp: { name: 'numIslands', params: [{ name: 'grid', type: 'vector<string>' }], returnType: 'int' } }
        : undefined);
      check(`(C) signature matches curated (+ documented cpp override): ${r.title}`,
        JSON.stringify(r.functionSignature) === JSON.stringify(expSigs));
      checkCTests(r, e, c);
    } else {
      check(`provenance source recognised: ${r.title}`, false, `source=${r.provenance.source}`);
    }
  }
}

/* --- (L) test rows: payload must equal the source modulo documented transforms */
const normTests = (arr) => JSON.stringify(arr.map((t) => ({ input: String(t.input), output: String(t.output) })));

function checkLTests(r, e) {
  let expS = [];
  let expH = [];
  if (r.title === 'Merge Two Sorted Lists') {
    expS = e.visibleTestCases.map((t) => ({ input: t.input, output: t.expectedOutput }));
    expH = e.hiddenTestCases.map((t) => ({
      input: t.input,
      output: String(t.input).startsWith('[-9,-7,-3]') ? '[-10,-9,-7,-7,-3,3]' : t.expectedOutput,
    }));
    check(`(L) documented output re-derivation present: ${r.title}`,
      r.hiddenTests.some((t) => String(t.input).startsWith('[-9,-7,-3]') && String(t.output) === '[-10,-9,-7,-7,-3,3]'));
  } else if (r.title === 'Word Ladder') {
    const enc = (t) => {
      const lines = String(t.input).split('\n');
      lines[2] = wordListEncode(lines[2]);
      return { input: lines.join('\n'), output: (lines[0] === 'a' && lines[1] === 'c') ? '0' : t.expectedOutput };
    };
    expS = e.visibleTestCases.map(enc);
    expH = e.hiddenTestCases.filter((t) => !String(t.input).includes('rc...')).map(enc);
    check(`(L) truncated source row excluded: ${r.title}`,
      !r.hiddenTests.some((t) => String(t.input).includes('rc...')));
    check(`(L) unreachable-endWord expectation re-derived as 0: ${r.title}`,
      r.hiddenTests.some((t) => String(t.input).startsWith('a\nc\n') && String(t.output) === '0'));
  } else if (r.title === 'Palindrome Partitioning') {
    const conv = (t) => ({ input: t.input, output: sanitizePartitionOutput(quotePartitionList(t.expectedOutput)) });
    expS = e.visibleTestCases.map(conv);
    expH = e.hiddenTestCases.map(conv);
    check(`(L) abab row sanitized to palindromic partitions only: ${r.title}`,
      r.hiddenTests.some((t) => t.input === 'abab' && String(t.output) === '[["a","b","a","b"],["a","bab"],["aba","b"]]'));
  } else {
    expS = e.visibleTestCases.map((t) => ({ input: t.input, output: t.expectedOutput }));
    expH = e.hiddenTestCases.map((t) => ({ input: t.input, output: t.expectedOutput }));
  }
  check(`(L) samples equal source (modulo documented transforms): ${r.title}`,
    normTests(r.sampleTests) === normTests(expS),
    normTests(r.sampleTests) === normTests(expS) ? '' : `payload=${normTests(r.sampleTests).slice(0, 300)} expected=${normTests(expS).slice(0, 300)}`);
  check(`(L) hidden equal source (modulo documented transforms): ${r.title}`,
    normTests(r.hiddenTests) === normTests(expH),
    normTests(r.hiddenTests) === normTests(expH) ? '' : `payload=${normTests(r.hiddenTests).slice(0, 300)} expected=${normTests(expH).slice(0, 300)}`);
}

/* --- (C+L) test rows: curated first, legacy appended, deduped, hidden minus samples */
function checkCTests(r, e, c) {
  let expS;
  let expH;
  if (r.title === 'Number of Islands') {
    expS = dedupeByInput([
      { input: decodeLiteralNewlines(c.sample.input), output: c.sample.output },
      ...e.visibleTestCases.map((t) => ({ input: gridToRowStrings(t.input), output: t.expectedOutput })),
    ]);
    expH = dedupeByInput([
      { input: decodeLiteralNewlines(c.hidden.input), output: c.hidden.output },
      ...e.hiddenTestCases.map((t) => ({ input: gridToRowStrings(t.input), output: t.expectedOutput })),
    ]).filter((t) => !expS.some((s) => s.input === t.input));
  } else {
    expS = dedupeByInput([
      { input: decodeLiteralNewlines(c.sample.input), output: c.sample.output },
      ...e.visibleTestCases.map((t) => ({ input: decodeLiteralNewlines(t.input), output: t.expectedOutput })),
    ]);
    expH = dedupeByInput([
      { input: decodeLiteralNewlines(c.hidden.input), output: c.hidden.output },
      ...e.hiddenTestCases.map((t) => ({ input: decodeLiteralNewlines(t.input), output: t.expectedOutput })),
    ]).filter((t) => !expS.some((s) => s.input === t.input));
  }
  check(`(C+L) samples equal curated+legacy merge: ${r.title}`,
    normTests(r.sampleTests) === normTests(expS),
    normTests(r.sampleTests) === normTests(expS) ? '' : `payload=${normTests(r.sampleTests).slice(0, 300)} expected=${normTests(expS).slice(0, 300)}`);
  check(`(C+L) hidden equal curated+legacy merge: ${r.title}`,
    normTests(r.hiddenTests) === normTests(expH),
    normTests(r.hiddenTests) === normTests(expH) ? '' : `payload=${normTests(r.hiddenTests).slice(0, 300)} expected=${normTests(expH).slice(0, 300)}`);
}

/* ================================ SECTION D =============================== */
const SANDBOX = G.createSandboxExecutor({
  buildDriverFromSignature: (c, l, s) => judge0.buildDriverFromSignature(c, l, s),
  executeSingleCase: (fc, l, i, e, rt) => judge0.executeSingleCase(fc, l, i, e, rt),
});

const recordSummaries = [];

async function sectionD() {
  for (const r of batch.records) {
    const doc = {
      title: r.title,
      slug: r.slug,
      functionSignature: r.functionSignature,
      sampleTests: r.sampleTests,
      hiddenTests: r.hiddenTests,
    };
    const total = r.sampleTests.length + r.hiddenTests.length;
    let res;
    try {
      const norm = G.normalizeProblem(doc);
      res = await G.validateUserCode(norm, r.referenceSolution.code, 'javascript', {
        runTestCase: SANDBOX,
        onlySample: false,
      });
    } catch (e) {
      check(`reference execution (all fixtures): ${r.title}`, false, 'validator threw: ' + e.message);
      recordSummaries.push({ title: r.title, slug: r.slug, source: r.provenance.source, reference: 'ERROR: ' + e.message });
      continue;
    }
    check(`reference execution (all fixtures): ${r.title}`,
      res.passed === res.total && res.total === total,
      `passed=${res.passed}/${res.total} expectedTotal=${total} ${res.summary || ''}`);
    if (res.passed !== res.total) {
      const bad = (res.results || []).filter((x) => !x.passed).slice(0, 3).map((x) =>
        `in=${JSON.stringify(String(x == null ? '' : x.input)).slice(0, 70)} exp=${x == null ? '' : x.expected} got=${x == null ? '' : x.actual}`
        + `${x && x.errorType ? ' err=' + x.errorType : ''}${x && x.error ? ' ' + String(x.error).slice(0, 140) : ''}`);
      check(`  first failures [${r.title}]`, false, bad.join(' || '));
    }
    recordSummaries.push({
      title: r.title,
      slug: r.slug,
      source: r.provenance.source,
      samples: r.sampleTests.length,
      hidden: r.hiddenTests.length,
      reference: `${res.passed}/${res.total}`,
    });
    console.log(`  [D] ${r.title}: reference ${res.passed}/${res.total}`);
  }
}

/* ================================ SECTION E =============================== */
function run(cmd, args, cwd) {
  try {
    execFileSync(cmd, args, { cwd, stdio: 'pipe', timeout: 90000, windowsHide: true });
    return null;
  } catch (e) {
    const err = (e.stderr && String(e.stderr)) || (e.stdout && String(e.stdout)) || e.message || '';
    return err.slice(0, 500);
  }
}

function sectionE() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b1tpl-'));
  const toolchain = {
    python: run('py', ['--version'], tmp) === null,
    java: run('javac', ['-version'], tmp) === null,
    cpp: run('g++', ['--version'], tmp) === null,
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
        check(`driver build: ${r.title} / ${lang}`, false, e.message);
        per[lang] = 'driver-error';
        continue;
      }
      let err = null;
      if (lang === 'javascript') {
        const f = path.join(tmp, 'main.js');
        fs.writeFileSync(f, full, 'utf8');
        err = run('node', ['--check', f], tmp);
      } else if (lang === 'python') {
        const f = path.join(tmp, 'main.py');
        fs.writeFileSync(f, full, 'utf8');
        err = toolchain.python ? run('py', ['-m', 'py_compile', f], tmp) : 'skipped: python toolchain unavailable';
      } else if (lang === 'java') {
        const f = path.join(tmp, 'Main.java');
        fs.writeFileSync(f, full, 'utf8');
        err = toolchain.java ? run('javac', ['-encoding', 'UTF-8', '-d', tmp, f], tmp) : 'skipped: javac unavailable';
      } else {
        const f = path.join(tmp, 'main.cpp');
        fs.writeFileSync(f, full, 'utf8');
        err = toolchain.cpp ? run('g++', ['-std=c++17', '-fsyntax-only', f], tmp) : 'skipped: g++ unavailable';
      }
      per[lang] = err ? 'FAIL' : 'ok';
      check(`template compiles (${lang}): ${r.title}`, !err, err || '');
    }
    tmpl.push(per);
    console.log(`  [E] ${r.title}: js=${per.javascript} java=${per.java} py=${per.python} cpp=${per.cpp}`);
  }
  return tmpl;
}

/* ================================== MAIN ================================== */
async function main() {
  const started = Date.now();
  console.log('== Batch 1 offline validation (read-only, fail-closed) ==');
  sectionA();
  console.log(`  [A] identity checks done (${checks.length} checks so far)`);
  sectionB();
  console.log(`  [B] audit replica done (${checks.length} checks so far)`);
  sectionC();
  console.log(`  [C] provenance checks done (${checks.length} checks so far)`);
  await sectionD();
  const templates = sectionE();

  const report = {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    verdict: failures.length === 0 ? 'PASS' : 'FAIL',
    checksRun: checks.length,
    failureCount: failures.length,
    warningCount: warnings.length,
    failures,
    warnings,
    records: recordSummaries,
    templates,
    checks,
    limitations: [
      'MongoDB was not contacted; this validator is offline by design (no DB read or write).',
      'Sections A-C + E cover all four language templates by compilation; cross-language RUNTIME execution of every fixture (python/java/c++) is performed after migration via full_audit.js + verify_execution, which require the live database.',
    ],
  };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nchecks=${checks.length} failures=${failures.length} warnings=${warnings.length} duration=${report.durationMs}ms`);
  for (const f of failures) console.log('FAIL ' + f);
  if (warnings.length) console.log(`warnings=${warnings.length} (see report)`);
  console.log('report -> ' + OUT);
  console.log('VERDICT: ' + report.verdict);
  process.exit(failures.length ? 1 : 0);
}

main().catch((e) => {
  console.error('VALIDATOR CRASH (fail-closed):', e);
  process.exit(1);
});

