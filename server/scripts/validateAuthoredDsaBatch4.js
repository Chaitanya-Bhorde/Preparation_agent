'use strict';
/* ---------------------------------------------------------------------------
 * validateAuthoredDsaBatch4.js
 * Offline, READ-ONLY, fail-closed validation of scripts/authoredDsaBatch4.js.
 * No database is opened; nothing is written except the report file below.
 *
 * Sections:
 *   A. identity     - exactly 2 records, unique title/slug, an exact canonical
 *                     title+slug match to the two audited rows they claim to fix,
 *                     and no overlap with Batch 1, 2 or 3.
 *   B. audit replica - local, independent re-implementation of full_audit.js
 *                     auditDsa issues; every record must produce ZERO issues.
 *   C. provenance   - the source JSON is faithful to the git blob it claims to
 *                     come from: the historical seed is re-executed in a sandbox
 *                     and every description / constraint / format / signature /
 *                     starter / sample / hidden fixture must be found identical.
 *   D. execution    - every sample+hidden fixture executed for JavaScript, Java
 *                     and C++ through the REAL platform path
 *                     (buildDriverFromSignature -> localExecutor).
 *   E. templates    - all four language starter templates, wrapped in their real
 *                     drivers, must compile (node --check / py_compile / javac /
 *                     g++ -fsyntax-only): 2 x 4 = 8 templates.
 *
 * Exit code 0 = all checks passed; 1 = at least one failure (fail-closed).
 * Report -> server/_batch4_validation_report.json
 * --------------------------------------------------------------------------- */
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const G = require('../utils/genericValidator');
const judge0 = require('../utils/judge0Coding');
const localExecutor = require('../utils/localExecutor');
const batch = require('./authoredDsaBatch4');
const batch1 = require('./authoredDsaBatch1');
const batch2 = require('./authoredDsaBatch2');
const batch3 = require('./authoredDsaBatch3');
const SRC = require('./authoredDsaBatch4.source.json');

const OUT = path.join(__dirname, '..', '_batch4_validation_report.json');
const REPO = path.join(__dirname, '..', '..');
const SOURCE_BLOB = 'edbc6db:server/scripts/seedDSA100.js.backup';
const CORRUPT_MARKER = '// ===== ADDITIONAL PROBLEMS =====';

/* The two records this batch authors, as canonical [title, slug] pairs. */
const EXPECTED = [
  ['Binary Tree Preorder Traversal', 'binary-tree-preorder-traversal'],
  ['Minimum Depth of Binary Tree', 'minimum-depth-of-binary-tree'],
];

const checks = [];
const warnings = [];
const failures = [];
function check(name, ok, detail) {
  checks.push({ name, ok: !!ok, detail: detail || '' });
  if (!ok) {
    const line = `${name}${detail ? ' :: ' + detail : ''}`;
    failures.push(line);
    console.log(`  FAIL  ${line}`);
  }
  return !!ok;
}
function warn(name, detail) {
  warnings.push({ name, detail: detail || '' });
  console.log(`  WARN  ${name}${detail ? ' :: ' + detail : ''}`);
}
function runCmd(cmd, args, cwd) {
  try {
    execFileSync(cmd, args, { cwd, stdio: 'pipe', timeout: 90000, windowsHide: true });
    return null;
  } catch (e) {
    const err = (e.stderr && String(e.stderr)) || (e.stdout && String(e.stdout)) || e.message || '';
    return err.slice(0, 500);
  }
}

/* ================================ SECTION A ================================= */
function sectionA() {
  check('exactly 2 authored records', batch.BATCH_TITLES.length === 2, `got ${batch.BATCH_TITLES.length}`);
  check('records length matches titles', batch.records.length === batch.BATCH_TITLES.length);
  const titles = batch.records.map((r) => r.title);
  const slugs = batch.records.map((r) => r.slug);
  check('unique titles', new Set(titles).size === titles.length, titles.join(', '));
  check('unique slugs', new Set(slugs).size === slugs.length, slugs.join(', '));
  for (const [t, s] of EXPECTED) {
    const r = batch.records.find((x) => x.title === t);
    check(`canonical row present: ${t}`, !!r);
    if (r) check(`canonical slug matches docs: ${t}`, r.slug === s, `payload=${r.slug} expected=${s}`);
  }
  const others = [...batch1.BATCH_TITLES, ...batch2.BATCH_TITLES, ...batch3.BATCH_TITLES];
  for (const t of titles) check(`no overlap with batches 1-3: ${t}`, !others.includes(t));
  check('batches 1-3 totals unchanged (16/8/13)',
    batch1.BATCH_TITLES.length === 16 && batch2.BATCH_TITLES.length === 8 && batch3.BATCH_TITLES.length === 13);
}

/* ================================ SECTION B ================================= */
function sectionB() {
  for (const r of batch.records) {
    const issues = batch.auditReplica(r);
    check(`audit replica (zero issues): ${r.title}`, issues.length === 0, issues.join(' | '));
  }
}

/* ================================ SECTION C ================================= */
/* Re-execute the historical reviewed seed in a sandbox (DB layer stubbed, no
 * network) and compare the source JSON against the records it registers. */
function historicalRecords() {
  const full = execFileSync('git', ['--no-pager', 'show', SOURCE_BLOB], {
    cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true,
  }).replace(/^\uFEFF/, '');
  const cutAt = full.indexOf(CORRUPT_MARKER);
  const text = cutAt < 0 ? full : full.slice(0, cutAt);
  if (cutAt >= 0) console.log(`  (cut ${full.length - cutAt} chars of known-corrupt tail from ${SOURCE_BLOB})`);

  const helpers = text.slice(0, text.indexOf('add({'))
    .replace(/^const (mongoose|dotenv|path|fs) = require\([^)]*\);?\r?$/gm, '')
    .replace(/^const (CodingProblem|connectDB|Problem) = require\([^)]*\);?\r?$/gm, '')
    .replace(/^dotenv\.config\(.*\);?\r?$/gm, '')
    .replace(/^const __dirname\s*=.*$/gm, '');

  const blocks = [];
  let start = -1, depth = 0, quote = null, esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"' || c === '`') { if (depth > 0) quote = c; continue; }
    if (depth === 0 && text.startsWith('add({', i)) { start = i; depth = 1; i += 3; continue; }
    if (start < 0) continue;
    if (c === '(' || c === '{' || c === '[') depth++;
    else if (c === ')' || c === '}' || c === ']') { depth--; if (depth === 0) { blocks.push(text.slice(start, i + 1)); start = -1; } }
  }

  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    Math, JSON, Array, Object, String, Number, parseInt, parseFloat,
    problems: [],
  };
  vm.createContext(sandbox);
  vm.runInContext(helpers, sandbox, { timeout: 15000 });

  const out = {};
  for (const b of blocks) {
    try { vm.runInContext('problems.length = 0;\n' + b + '\n;__r = problems[0];', sandbox, { timeout: 15000 }); } catch { continue; }
    const rec = sandbox.__r;
    if (!rec || !batch.BATCH_TITLES.includes(rec.title) || out[rec.title]) continue;
    out[rec.title] = rec;
  }
  return { out, blocks: blocks.length };
}

function sectionC() {
  let hist;
  try { hist = historicalRecords(); } catch (e) { check('historical seed re-executed', false, e.message); return; }
  console.log(`  [C] historical file: ${hist.blocks} add({...}) blocks in the reviewed section`);
  check('historical seed re-executed for both titles',
    Object.keys(hist.out).length === batch.BATCH_TITLES.length, Object.keys(hist.out).join(', '));

  for (const t of batch.BATCH_TITLES) {
    const h = hist.out[t];
    const s = SRC[t];
    check(`source record present in blob: ${t}`, !!h && !!s);
    if (!h || !s) continue;
    const cmp = (label, a, b) => check(
      `provenance ${label}: ${t}`,
      JSON.stringify(a) === JSON.stringify(b),
      `${JSON.stringify(a).slice(0, 110)} != ${JSON.stringify(b).slice(0, 110)}`,
    );
    cmp('description', s.description, h.description);
    cmp('difficulty', s.difficulty, h.difficulty);
    cmp('topic', s.topic, h.topic);
    cmp('tags', s.tags, h.tags);
    cmp('constraints', s.constraints, h.constraints);
    cmp('inputFormat', s.inputFormat, h.inputFormat);
    cmp('outputFormat', s.outputFormat, h.outputFormat);
    cmp('functionSignature', s.functionSignature, h.functionSignature);
    cmp('starterCode', s.starterCode, h.starterCode);
    cmp('sampleTests', s.sampleTests, h.sampleTests);
    cmp('hiddenTests', s.hiddenTests, h.hiddenTests);
  }

  const norm = (x) => batch._internals.decodeLiteralNewlines(String(x == null ? '' : x)).trim();
  for (const r of batch.records) {
    const s = SRC[r.title];
    check(`payload description == source: ${r.title}`, r.description === s.description);
    check(`payload constraints == source: ${r.title}`, JSON.stringify(r.constraints) === JSON.stringify(s.constraints));
    check(`payload outputFormat == source: ${r.title}`, JSON.stringify(r.outputFormat) === JSON.stringify(s.outputFormat));
    check(`payload signature name+param == source: ${r.title}`,
      r.functionSignature.javascript.name === s.functionSignature.javascript.name
      && r.functionSignature.javascript.params[0].name === s.functionSignature.javascript.params[0].name);
    check(`payload topic/tags de-duplicated: ${r.title}`,
      new Set([r.topic.toLowerCase(), ...r.tags.map((x) => x.toLowerCase())]).size === r.tags.length + 1);

    const srcTotal = (s.sampleTests || []).length + (s.hiddenTests || []).length;
    const accounted = r.sampleTests.length + r.hiddenTests.length + r.provenance.dropped.length;
    check(`fixture accounting admitted+dropped == source total: ${r.title}`, accounted === srcTotal, `${accounted} vs ${srcTotal}`);
    check(`at least one sample admitted: ${r.title}`, r.sampleTests.length >= 1);
    check(`at least one hidden admitted: ${r.title}`, r.hiddenTests.length >= 1);

    const srcKeys = new Set([...(s.sampleTests || []), ...(s.hiddenTests || [])].map((x) => `${norm(x.input)}|${String(x.output)}`));
    for (const x of [...r.sampleTests, ...r.hiddenTests]) {
      check(`admitted fixture traced to source: ${r.title} ${norm(x.input).slice(0, 40)}`,
        srcKeys.has(`${norm(x.input)}|${String(x.output)}`));
    }
    const droppedKeys = new Set(srcKeys);
    for (const x of r.provenance.dropped) {
      check(`dropped fixture traced to source: ${r.title} ${norm(x.input).slice(0, 40)}`,
        droppedKeys.has(`${norm(x.input)}|${String(x.output)}`));
    }
  }
}

/* ================================ SECTION D =================================
 * JavaScript runs through the platform's own sandbox (genericValidator
 * normalizeProblem + validateUserCode with the stored reference). Java and C++
 * run through the real drivers: buildDriverFromSignature composes the typed
 * driver, localExecutor compiles and runs it. Python is compile-verified and its
 * platform limitation is probed, never worked around (see report.limitations). */
const DSA_LANGS = ['javascript', 'python', 'java', 'cpp'];
const recordSummaries = [];

/** Batch 4's referencesFor() already emits the tree preamble + `class Solution {
 *  ... }` (java) and preamble + body (cpp); the drivers add only the wrapper. */
function langSource(title, lang) {
  const refs = batch.referencesFor(title);
  if (lang === 'java' || lang === 'cpp') return refs[lang];
  throw new Error('langSource: unsupported language ' + lang);
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
    const summary = {
      title: r.title, slug: r.slug, source: r.provenance.source,
      samples: r.sampleTests.length, hidden: r.hiddenTests.length,
      dropped: (r.provenance.dropped || []).length,
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

    /* --- Java and C++: the same real drivers, the tree reference bodies --- */
    for (const lang of ['java', 'cpp']) {
      const out = await runFixturesIn(r, lang, langSource(r.title, lang));
      check(`reference execution (${lang}, all fixtures): ${r.title}`, out.passed === out.total,
        `${out.passed}/${out.total}${out.error ? ' ' + out.error : ''}${out.bad && out.bad.length ? ' :: ' + out.bad.slice(0, 2).join(' || ') : ''}`);
      summary[lang] = `${out.passed}/${out.total}`;
      if (out.bad && out.bad.length) out.bad.slice(0, 5).forEach((b, i) => check(`  ${lang} failure ${i + 1} [${r.title}]`, false, b));
    }

    /* --- Python: compile the reference, and probe the driver limitation once --- */
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b4py-'));
    const hasPy = runCmd('py', ['--version'], tmp) === null;
    if (hasPy) {
      const pyRef = batch.referencesFor(r.title).python;
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
function sectionE() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b4tpl-'));
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
const STRUCTURAL_ONLY = process.argv.includes('--structural');

async function main() {
  const started = Date.now();
  console.log('== Batch 4 offline validation (read-only, fail-closed)'
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
  const dropped = batch.records.reduce((n, r) => n + (r.provenance.dropped || []).length, 0);

  const report = {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    structuralOnly: STRUCTURAL_ONLY,
    verdict: failures.length === 0 ? (STRUCTURAL_ONLY ? 'PASS (structural only)' : 'PASS') : 'FAIL',
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
      dropped: r.provenance.dropped || [],
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
      'The TreeNode parameter is adapted to the level-order array form (the Batch 1 convention) because the '
        + 'line-based stdin driver cannot represent a nested node object; tree semantics are unchanged and the '
        + 'adaptation is limited to functionSignature/inputFormat, never to the tree itself.',
      'Batch 4 reuses Batch 3 auditReplica so records are checked by exactly the same structural contract.',
    ],
  };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nchecks=${checks.length} failures=${failures.length} warnings=${warnings.length} `
    + `records=${batch.records.length} fixtures=${admitted} dropped=${dropped} duration=${report.durationMs}ms`);
  for (const f of failures) console.log('FAIL ' + f);
  if (warnings.length) warnings.forEach((w) => console.log('WARN ' + w.name + (w.detail ? ' :: ' + w.detail : '')));
  console.log('report -> ' + OUT);
  console.log('VERDICT: ' + report.verdict);
  process.exit(failures.length ? 1 : 0);
}

main().catch((e) => {
  console.error('validator threw: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});

