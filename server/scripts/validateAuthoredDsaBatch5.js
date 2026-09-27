'use strict';
/* validateAuthoredDsaBatch5.js
 * ---------------------------------------------------------------------------
 * Offline, READ-ONLY, fail-closed validation of scripts/authoredDsaBatch5.js.
 * No database is opened; nothing is written except the report file.
 *
 *   A. identity    - exactly 1 record, canonical slug, no overlap with batches
 *                    1-4, batches 1-4 totals unchanged (16/8/13/2), 40 distinct
 *                    authored titles overall.
 *   B. audit       - local replica of full_audit.js auditDsa issues; zero issues.
 *   C. provenance  - the source JSON is faithful to the git blob: the reviewed
 *                    historical seed is re-executed in a sandbox and the record
 *                    it registers is compared field by field. The corrupt tail is
 *                    never parsed.
 *   D. execution   - every admitted sample+hidden fixture executed for
 *                    JavaScript (platform sandbox), Java and C++ (real drivers:
 *                    buildDriverFromSignature -> localExecutor, compiled+run).
 *                    Python is compile-verified; its platform limitation is
 *                    probed and reported, never worked around.
 *   E. templates   - all four starter templates, wrapped in their real drivers,
 *                    must compile (node --check / py_compile / javac /
 *                    g++ -fsyntax-only).
 *   F. behaviour   - representative platform verdicts on the real driver:
 *                    Accepted, Wrong Answer, Compile Error, Runtime Error.
 *
 * Exit code 0 = all checks passed; 1 = at least one failure.
 * Report -> server/_batch5_validation_report.json
 * --------------------------------------------------------------------------- */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const G = require('../utils/genericValidator');
const judge0 = require('../utils/judge0Coding');
const localExecutor = require('../utils/localExecutor');
const batch = require('./authoredDsaBatch5');
const batch1 = require('./authoredDsaBatch1');
const batch2 = require('./authoredDsaBatch2');
const batch3 = require('./authoredDsaBatch3');
const batch4 = require('./authoredDsaBatch4');
const SRC = require('./authoredDsaBatch5.source.json');

const OUT = path.join(__dirname, '..', '_batch5_validation_report.json');
const AUDIT = path.join(__dirname, '..', '_full_audit_report.json');
const SOURCE_BLOB = 'edbc6db:server/scripts/seedDSA100.js.backup';
const CORRUPT_MARKER = '// ===== ADDITIONAL PROBLEMS =====';
const EXPECTED = { 'Min Stack': 'min-stack' };

const checks = [];
const failures = [];
const warnings = [];
function check(label, ok, detail) {
  const entry = { label, ok: !!ok, detail: detail == null || detail === '' ? '' : String(detail) };
  checks.push(entry);
  if (!entry.ok) { failures.push(label + (entry.detail ? ' :: ' + entry.detail : '')); console.log(`  FAIL  ${label}${entry.detail ? ' :: ' + entry.detail : ''}`); }
  return entry.ok;
}
function warn(label, detail) {
  warnings.push({ label, detail: detail || '' });
  console.log(`  WARN  ${label}${detail ? ' :: ' + detail : ''}`);
}
function runCmd(cmd, args, cwd) {
  try { execFileSync(cmd, args, { cwd, stdio: 'pipe', timeout: 120000, windowsHide: true }); return null; }
  catch (e) { return ((e.stderr && String(e.stderr)) || (e.stdout && String(e.stdout)) || e.message || '').slice(0, 600); }
}

/* The WindowsApps `python` alias is a Microsoft Store shim that is not a real
 * interpreter; the launcher `py -3` is. Try both and use whichever compiles. */
function pythonCompile(file, cwd) {
  const errs = [];
  for (const attempt of [['python', ['-m', 'py_compile', file]], ['py', ['-3', '-m', 'py_compile', file]]]) {
    const e = runCmd(attempt[0], attempt[1], cwd);
    if (e === null) return null;
    errs.push(attempt[0] + ': ' + e.slice(0, 200));
  }
  return errs.join(' | ');
}



/* ================================ SECTION A ================================= */
function sectionA() {
  check('exactly 1 authored record', batch.BATCH_TITLES.length === 1, `got ${batch.BATCH_TITLES.length}`);
  check('records length matches titles', batch.records.length === batch.BATCH_TITLES.length);
  const titles = batch.records.map((r) => r.title);
  check('unique titles', new Set(titles).size === titles.length, titles.join(', '));
  check('unique slugs', new Set(batch.records.map((r) => r.slug)).size === batch.records.length);
  for (const [t, s] of Object.entries(EXPECTED)) {
    const r = batch.records.find((x) => x.title === t);
    check(`canonical row present: ${t}`, !!r);
    if (r) check(`canonical slug matches the live bank: ${t}`, r.slug === s, `payload=${r.slug} expected=${s}`);
  }
  const earlier = [...batch1.BATCH_TITLES, ...batch2.BATCH_TITLES, ...batch3.BATCH_TITLES, ...batch4.BATCH_TITLES];
  for (const t of titles) check(`no overlap with batches 1-4: ${t}`, !earlier.includes(t));
  check('batches 1-4 totals unchanged (16/8/13/2)',
    batch1.BATCH_TITLES.length === 16 && batch2.BATCH_TITLES.length === 8
    && batch3.BATCH_TITLES.length === 13 && batch4.BATCH_TITLES.length === 2);
  check('40 distinct authored titles across batches 1-5',
    new Set([...earlier, ...batch.BATCH_TITLES]).size === 40);

  /* The record must correspond to one of the audited failures, and to nothing else. */
  if (fs.existsSync(AUDIT)) {
    const audit = JSON.parse(fs.readFileSync(AUDIT, 'utf8'));
    const failing = new Set(((audit.dsa || {}).failures || []).map((f) => f.title));
    for (const t of titles) check(`claimed audited failure: ${t}`, failing.has(t));
  } else {
    warn('audit report not found; skipped the failure-claim check', AUDIT);
  }
}

/* ================================ SECTION B ================================= */
function sectionB() {
  for (const r of batch.records) {
    const issues = batch.auditReplica(r);
    check(`audit replica (zero issues): ${r.title}`, issues.length === 0, issues.join(' | '));
  }
}


/* ================================ SECTION C ================================= */
/* Re-execute the reviewed historical seed in a sandbox and prove the source
 * JSON is a faithful copy of the record that seed actually registers. */
function sectionC() {
  let full;
  try {
    full = execFileSync('git', ['--no-pager', 'show', SOURCE_BLOB], {
      cwd: path.join(__dirname, '..', '..'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true,
    }).replace(/^\uFEFF/, '');
  } catch (e) {
    check('git blob readable: ' + SOURCE_BLOB, false, e.message);
    return;
  }
  const cutAt = full.indexOf(CORRUPT_MARKER);
  check('corrupt-tail marker present in the seed', cutAt >= 0, `cutAt=${cutAt}`);
  const text = cutAt < 0 ? full : full.slice(0, cutAt);
  console.log(`  (cut ${full.length - cutAt} chars of known-corrupt tail)`);

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
  const vm = require('vm');
  const sandbox = { console, Math, JSON, Array, Object, String, Number, parseInt, parseFloat, problems: [] };
  vm.createContext(sandbox);
  try { vm.runInContext(helpers, sandbox, { timeout: 20000 }); }
  catch (e) { check('seed helper preamble evaluates', false, e.message); return; }
  let rec = null;
  for (const b of blocks) {
    let r = null;
    try { vm.runInContext('problems.length = 0;\n' + b + '\n;__r = problems[0];', sandbox, { timeout: 20000 }); r = sandbox.__r; } catch { continue; }
    if (r && r.title === SRC.title) { rec = r; break; }
  }
  check('source record found in the reviewed seed', !!rec, SRC.title);
  if (!rec) return;

  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  check('description verbatim', rec.description === SRC.description, `${String(rec.description).slice(0, 60)} vs ${String(SRC.description).slice(0, 60)}`);
  check('difficulty verbatim', rec.difficulty === SRC.difficulty);
  check('topic verbatim', rec.topic === SRC.topic);
  check('tags verbatim', same(rec.tags, SRC.tags));
  check('companies verbatim', same(rec.companies, SRC.companies));
  check('constraints verbatim', same(rec.constraints, SRC.constraints));
  check('inputFormat verbatim', same(rec.inputFormat, SRC.inputFormat));
  check('outputFormat verbatim', same(rec.outputFormat, SRC.outputFormat));
  check('functionSignature verbatim', same(rec.functionSignature, SRC.functionSignature));
  check('starterCode verbatim', same(rec.starterCode, SRC.starterCode));
  check('sampleTests verbatim', same(rec.sampleTests, SRC.sampleTests), `${rec.sampleTests.length} vs ${SRC.sampleTests.length}`);
  check('hiddenTests verbatim', same(rec.hiddenTests, SRC.hiddenTests), `${rec.hiddenTests.length} vs ${SRC.hiddenTests.length}`);

  /* the source's own signature must be the one the batch widened, and only it */
  const r = batch.records[0];
  check('shipped signature differs from the source only by the documented widening',
    r.functionSignature.javascript.name === rec.functionSignature.javascript.name
    && r.functionSignature.javascript.returnType !== rec.functionSignature.javascript.returnType,
    `source returnType=${rec.functionSignature.javascript.returnType}`);

  /* admitted + dropped must account for every source fixture exactly once */
  const built = batch.buildTests(r.title);
  const total = SRC.sampleTests.length + SRC.hiddenTests.length;
  check('admitted + dropped == every source fixture',
    built.samples.length + built.hidden.length + built.dropped.length === total,
    `${built.samples.length}+${built.hidden.length}+${built.dropped.length} vs ${total}`);
  check('at least one fixture was dropped with a recorded reason', built.dropped.length > 0);
  for (const d of built.dropped) check('dropped fixture has a reason', !!d.reason);
}


/* ================================ SECTION D =================================
 * JavaScript, Java and C++ all run through the REAL platform path:
 * buildDriverFromSignature composes the typed driver, then the case is
 * executed. Python is compile-verified only (see report.limitations). */
const DSA_LANGS = ['javascript', 'python', 'java', 'cpp'];
const RUNNABLE = ['javascript', 'java', 'cpp'];
const recordSummaries = [];

function driverFor(record, lang, source) {
  return judge0.buildDriverFromSignature(source, lang, record.functionSignature[lang]);
}

async function runFixturesIn(record, lang, source) {
  const returnType = record.functionSignature[lang].returnType;
  let full;
  try { full = driverFor(record, lang, source); }
  catch (e) { check(`driver build (${lang}): ${record.title}`, false, e.message); return { passed: 0, total: 0, bad: ['driver build failed: ' + e.message] }; }
  const cases = [...record.sampleTests, ...record.hiddenTests];
  let passed = 0;
  const bad = [];
  for (const tc of cases) {
    const res = await localExecutor.executeSingleCase(full, lang, tc.input, tc.output, returnType);
    if (res.passed) passed++;
    else bad.push(`in=${JSON.stringify(String(tc.input)).slice(0, 70)} want=${String(tc.output).slice(0, 40)} got=${String(res.output).slice(0, 40)}${res.errorType ? ' ' + res.errorType : ''}${res.error ? ' ' + String(res.error).slice(0, 160) : ''}`);
  }
  return { passed, total: cases.length, bad };
}

async function sectionD() {
  for (const r of batch.records) {
    const refs = batch.referencesFor(r.title);
    const summary = {
      title: r.title, slug: r.slug, source: r.provenance.source,
      fixtures: r.sampleTests.length + r.hiddenTests.length,
      samples: r.sampleTests.length, hidden: r.hiddenTests.length, langs: {},
    };
    for (const lang of RUNNABLE) {
      const out = await runFixturesIn(r, lang, refs[lang]);
      summary.langs[lang] = { passed: out.passed, total: out.total, bad: out.bad.slice(0, 5) };
      check(`${lang}: all ${out.total} admitted fixtures pass through the real driver: ${r.title}`, out.passed === out.total,
        `${out.passed}/${out.total} :: ` + out.bad.slice(0, 3).join(' || '));
    }
    /* Python: driver builds and compiles; execution is a known platform gap. */
    {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b5py-'));
      let built = null;
      try { built = driverFor(r, 'python', refs.python); } catch (e) { check('python driver builds: ' + r.title, false, e.message); }
      check('python driver builds: ' + r.title, !!built);
      if (built) {
        const f = path.join(tmp, 'drv.py');
        fs.writeFileSync(f, built, 'utf8');
        const pyErr = pythonCompile(f, tmp);
        check('python compiles (py_compile): ' + r.title, pyErr === null, pyErr);
        const res = await localExecutor.executeSingleCase(built, 'python', r.sampleTests[0].input, r.sampleTests[0].output, r.functionSignature.python.returnType);
        summary.langs.python = { compileVerified: true, executed: !!(res && res.passed), errorType: res && res.errorType };
        check('python platform limitation unchanged (system_error, not worked around): ' + r.title,
          !!res && !res.passed && res.errorType === 'system_error', `errorType=${res && res.errorType}`);
      }
      fs.rmSync(tmp, { recursive: true, force: true });
    }
    recordSummaries.push(summary);
  }
}


/* ================================ SECTION E =================================
 * Every starter template, wrapped in its real driver, must compile. */
async function sectionE() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b5tpl-'));
  for (const r of batch.records) {
    for (const lang of DSA_LANGS) {
      const src = r.starterCode[lang];
      check(`starter present: ${r.title} [${lang}]`, !!src && String(src).trim().length > 0);
      if (!src) continue;
      let full;
      try { full = judge0.buildDriverFromSignature(src, lang, r.functionSignature[lang]); }
      catch (e) { check(`starter driver builds: ${r.title} [${lang}]`, false, e.message); continue; }
      check(`starter driver builds: ${r.title} [${lang}]`, true);
      if (lang === 'javascript') {
        const f = path.join(tmp, 't.js');
        fs.writeFileSync(f, full, 'utf8');
        check(`starter compiles (node --check): ${r.title} [js]`, runCmd('node', ['--check', f], tmp) === null);
      } else if (lang === 'python') {
        const f = path.join(tmp, 't.py');
        fs.writeFileSync(f, full, 'utf8');
        const pyErr = pythonCompile(f, tmp);
        check(`starter compiles (py_compile): ${r.title} [py]`, pyErr === null, pyErr);
      } else if (lang === 'java') {
        fs.writeFileSync(path.join(tmp, 'Main.java'), full, 'utf8');
        const c = runCmd('javac', ['Main.java'], tmp);
        check(`starter compiles (javac): ${r.title} [java]`, c === null, c);
      } else if (lang === 'cpp') {
        const f = path.join(tmp, 't.cpp');
        fs.writeFileSync(f, full, 'utf8');
        const c = runCmd('g++', ['-std=c++17', '-fsyntax-only', f], tmp);
        check(`starter compiles (g++ -fsyntax-only): ${r.title} [cpp]`, c === null, c);
      }
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

/* ================================ SECTION F =================================
 * Representative platform behaviour on the REAL driver: the verdict classes a
 * submission can actually get must all be distinguishable. */
async function sectionF() {
  const r = batch.records[0];
  const tc = r.sampleTests[0];
  const lang = 'javascript';
  const mk = (body) => {
    const sig = r.functionSignature[lang];
    return judge0.buildDriverFromSignature(body, lang, sig);
  };
  const good = batch.referencesFor(r.title)[lang];
  const verdicts = {};

  const accept = await localExecutor.executeSingleCase(mk(good), lang, tc.input, tc.output, r.functionSignature[lang].returnType);
  verdicts.accepted = { passed: !!accept.passed, errorType: accept.errorType };
  check('platform verdict ACCEPTED reproduced', !!accept.passed, `got=${accept.output} err=${accept.error}`);

  const wrongBody = `function ${r.functionSignature[lang].name}(ops, args) {\n  return '[999]';\n}\n`;
  const wrong = await localExecutor.executeSingleCase(mk(wrongBody), lang, tc.input, tc.output, r.functionSignature[lang].returnType);
  verdicts.wrongAnswer = { passed: !!wrong.passed, errorType: wrong.errorType };
  check('platform verdict WRONG ANSWER reproduced', !wrong.passed && wrong.output.trim() === '[999]', `passed=${wrong.passed} out=${wrong.output}`);

  const badSyntax = `function ${r.functionSignature[lang].name}(ops, opArgs) { this is not valid javascript ((( }\n`;
  const ce = await localExecutor.executeSingleCase(mk(badSyntax), lang, tc.input, tc.output, r.functionSignature[lang].returnType);
  verdicts.compileError = { passed: !!ce.passed, errorType: ce.errorType, status: ce.status_id };
  check('platform verdict COMPILE ERROR reproduced', !ce.passed && /compile|syntax/i.test(String(ce.error || '') + String(ce.errorType || '')),
    `errorType=${ce.errorType} status=${ce.status_id} err=${String(ce.error).slice(0, 120)}`);

  const throwBody = `function ${r.functionSignature[lang].name}(ops, args) {\n  throw new Error('boom');\n}\n`;
  const re = await localExecutor.executeSingleCase(mk(throwBody), lang, tc.input, tc.output, r.functionSignature[lang].returnType);
  verdicts.runtimeError = { passed: !!re.passed, errorType: re.errorType, status: re.status_id };
  check('platform verdict RUNTIME ERROR reproduced', !re.passed && !!re.errorType && re.errorType !== 'WrongAnswer',
    `errorType=${re.errorType} status=${re.status_id}`);

  return verdicts;
}


/* ==================================================================== RUN === */
(async () => {
  console.log('=== A. identity ===');
  sectionA();
  console.log('=== B. audit replica ===');
  sectionB();
  console.log('=== C. provenance against the git blob ===');
  sectionC();
  console.log('=== D. real runtime execution (js/java/cpp) + python compile ===');
  await sectionD();
  console.log('=== E. starter templates compile in all four languages ===');
  await sectionE();
  console.log('=== F. representative platform verdicts ===');
  const verdicts = await sectionF();

  const report = {
    generatedAt: new Date().toISOString(),
    batch: 5,
    title: 'Min Stack',
    source: SRC.provenance,
    totals: {
      records: batch.records.length,
      checks: checks.length,
      passed: checks.filter((c) => c.ok).length,
      failed: failures.length,
      warnings: warnings.length,
    },
    fixtures: recordSummaries,
    verdicts,
    limitations: [
      'Python is compile-verified only. localExecutor.executeSingleCase returns system_error for python and the python '
      + 'driver in judge0Coding.buildDriverFromSignature passes the parameter NAMES to the function instead of driver-parsed '
      + 'values, so no solution body can be executed through it. This is a pre-existing, platform-wide driver limitation '
      + '(identical for all 266 DSA records) and is deliberately NOT worked around.',
    ],
    checks,
    warnings,
    failures,
  };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 1), 'utf8');
  console.log('');
  console.log(`checks=${report.totals.checks} passed=${report.totals.passed} failed=${report.totals.failed} warnings=${report.totals.warnings}`);
  console.log('report -> ' + OUT);
  if (failures.length) { failures.forEach((f) => console.log('  FAIL ' + f)); process.exit(1); }
  console.log('BATCH 5 VALIDATION PASSED');
})().catch((e) => { console.error('VALIDATOR CRASH: ' + e.stack); process.exit(1); });
