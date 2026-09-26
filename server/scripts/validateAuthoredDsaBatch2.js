'use strict';
/* ---------------------------------------------------------------------------
 * validateAuthoredDsaBatch2.js
 * Offline, READ-ONLY, fail-closed validation of scripts/authoredDsaBatch2.js.
 * No database is opened; nothing is written except the report file below.
 *
 * Sections:
 *   A. identity     - exactly 8 records, unique title/slug, an exact match to the
 *                     eight audited failures they claim to fix, no overlap with
 *                     Batch 1, and no overlap with the 202 CONTENT SOURCE
 *                     REQUIRED rows (which must remain untouched).
 *   B. audit replica - local re-implementation of full_audit.js auditDsa issues;
 *                     every record must produce ZERO issues.
 *   C. provenance   - (C) description/constraints/examples/signatures re-read from
 *                     curatedProblems.js; (M) difficulty/topic/tags re-derived
 *                     from the canonical seeder with de-duplication; the two
 *                     curated fixtures per record must reproduce the curated
 *                     expected output; input encoding and parameter count checked.
 *   D. execution    - every sample+hidden fixture executed for JavaScript, Java and
 *                     C++ through the REAL platform path (buildDriverFromSignature
 *                     -> localExecutor, compiling and running).
 *   E. templates    - all four language starter templates, wrapped in their real
 *                     drivers, must compile (node --check / py_compile / javac /
 *                     g++ -fsyntax-only).
 *
 * Exit code 0 = all checks passed; 1 = at least one failure (fail-closed).
 * Report -> server/_batch2_validation_report.json
 * --------------------------------------------------------------------------- */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const G = require('../utils/genericValidator');
const judge0 = require('../utils/judge0Coding');
const localExecutor = require('../utils/localExecutor');
const { CURATED } = require('./curatedProblems');
const batch = require('./authoredDsaBatch2');
const batch1 = require('./authoredDsaBatch1');

const OUT = path.join(__dirname, '..', '_batch2_validation_report.json');
const AUDIT = path.join(__dirname, '..', '_full_audit_report.json');

const PLACEHOLDER_RE = /TODO|TBD|FIXME|not yet reviewed|placeholder|lorem ipsum|coming soon|\bXXX\b/i;
const RAW_ID_RE = /\bhm_\d{10,}\b|\b65a[0-9a-f]{20,}\b/;
const VALID_DIFFS = ['easy', 'medium', 'hard'];
const DSA_LANGS = ['javascript', 'java', 'python', 'cpp'];
const CONTENT_SOURCE_REQUIRED = 202;

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

/* -------- local replica of the seeder's metadata (no module internals) ------- */
function loadLiteralArray(file, declMarker) {
  const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const at = src.indexOf(declMarker);
  if (at < 0) throw new Error(`validator: declaration missing in ${file}`);
  const arrStart = src.indexOf('[', at);
  const arrEnd = src.indexOf('\n];', arrStart);
  if (arrEnd < 0) throw new Error(`validator: literal array not closed in ${file}`);
  const arr = new Function(`return (${src.slice(arrStart, arrEnd + 2)});`)();
  if (!Array.isArray(arr) || arr.length === 0) throw new Error(`validator: empty array from ${file}`);
  return arr;
}
const META_ROWS = loadLiteralArray('seedCodingProblemsExpanded.js', 'const codingProblems = [');
function metaRow(title) {
  const r = META_ROWS.find((x) => x && x.title === title);
  if (!r) throw new Error(`validator: no seeder metadata row for "${title}"`);
  return r;
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
  if (!(Number(r.memoryLimitKb) > 0)) reviews.push('missing memoryLimitKb');
  return { issues, reviews };
}


/* ================================ SECTION A ================================= */
const EXPECTED = [
  ['Pascals Triangle', 'pascals-triangle'],
  ['Minimum Size Subarray Sum', 'minimum-size-subarray-sum'],
  ['Increasing Triplet Subsequence', 'increasing-triplet-subsequence'],
  ['Valid Parentheses String', 'valid-parentheses-string'],
  ['Letter Combinations', 'letter-combinations'],
  ['Valid Palindrome II', 'valid-palindrome-ii'],
  ['Basic Calculator III', 'basic-calculator-iii'],
  ['Word Search', 'word-search'],
];

function sectionA() {
  check('payload exports exactly 8 records', batch.records.length === 8, `got ${batch.records.length}`);
  check('BATCH_TITLES has exactly 8 titles', batch.BATCH_TITLES.length === 8, `got ${batch.BATCH_TITLES.length}`);
  check('BATCH_TITLES order matches records', batch.BATCH_TITLES.every((t, i) => batch.records[i] && batch.records[i].title === t));
  check('slugs unique', new Set(batch.records.map((r) => r.slug)).size === batch.records.length);
  check('titles unique', new Set(batch.records.map((r) => r.title)).size === batch.records.length);

  const audit = JSON.parse(fs.readFileSync(AUDIT, 'utf8'));
  const byTitle = new Map((audit.dsa.failures || []).map((f) => [f.title, f]));
  for (const [title, slug] of EXPECTED) {
    const f = byTitle.get(title);
    check(`audited failure exists: ${title}`, !!f);
    if (f) check(`audited slug matches: ${title}`, f.slug === slug, `audit=${f.slug} payload=${slug}`);
  }
  check('remaining failures after Batch 2 are CONTENT SOURCE REQUIRED',
    (audit.dsa.failures || []).length - 8 === CONTENT_SOURCE_REQUIRED,
    `failures=${(audit.dsa.failures || []).length}`);

  const b1 = new Set(batch1.BATCH_TITLES);
  const overlap = batch.records.filter((r) => b1.has(r.title)).map((r) => r.title);
  check('no Batch 1 record is re-authored by Batch 2', overlap.length === 0, overlap.join(','));
  const b1slugs = new Set(batch1.records.map((r) => r.slug));
  check('no Batch 1 slug is reused', batch.records.every((r) => !b1slugs.has(r.slug)));
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

/* Two documented driver-compatibility signature overrides (see module header).
 * Each entry states exactly WHICH part of the signature it replaces. */
const SIG_OVERRIDES = {
  'Word Search': {
    javascript: { param0: 'string[]' },
    python: { param0: 'List[str]' },
    java: { param0: 'String[]' },
    cpp: { param0: 'string' },
  },
  'Pascals Triangle': { java: { returnType: 'int[][]' } },
};


/* ================================ SECTION C ================================= */
function sectionC() {
  for (const r of batch.records) {
    const c = CURATED[r.title];
    const m = metaRow(r.title);
    check(`(C) curated entry exists: ${r.title}`, !!c);
    if (!c) continue;
    check(`(C) description preserved: ${r.title}`, r.description === c.desc);
    check(`(C) constraints preserved: ${r.title}`, JSON.stringify(r.constraints) === JSON.stringify(c.constraints));
    check(`(C) examples preserved: ${r.title}`, JSON.stringify(r.examples) === JSON.stringify(c.examples));
    check(`(M) difficulty preserved: ${r.title}`, r.difficulty === m.difficulty, `${r.difficulty} vs ${m.difficulty}`);
    check(`(M) topic preserved: ${r.title}`, r.topic === m.topic, `${r.topic} vs ${m.topic}`);
    check(`(M) tags = seeder tags de-duplicated: ${r.title}`,
      JSON.stringify(r.tags) === JSON.stringify(expectDedupeTags(m.topic, m.tags)), JSON.stringify(r.tags));

    for (const lang of DSA_LANGS) {
      const base = c.functionSignature[lang];
      const sig = r.functionSignature[lang];
      const ov = (SIG_OVERRIDES[r.title] || {})[lang];
      if (ov) {
        // The override must match the declared value, the function name must be
        // preserved, and every OTHER part must still equal the curated signature.
        check(`override value applied: ${r.title} / ${lang}`,
          ov.param0 ? sig.params[0].type === ov.param0 : sig.returnType === ov.returnType,
          `param0=${sig.params[0].type} returnType=${sig.returnType} expected=${JSON.stringify(ov)}`);
        check(`override keeps the curated function name: ${r.title} / ${lang}`, sig.name === base.name,
          `${sig.name} vs ${base.name}`);
        const untouchedParams = sig.params[0].type === (ov.param0 || base.params[0].type)
          && sig.params.length === base.params.length
          && sig.params.slice(1).every((p, i) => JSON.stringify(p) === JSON.stringify(base.params[i + 1]));
        check(`override leaves the other parameters curated: ${r.title} / ${lang}`, untouchedParams);
        if (!ov.param0) {
          check(`override changes only the return type: ${r.title} / ${lang}`,
            JSON.stringify(sig.params) === JSON.stringify(base.params), JSON.stringify(sig.params));
        }
        check(`override documented in provenance: ${r.title} / ${lang}`,
          r.provenance.deviations && r.provenance.deviations !== 'none', r.provenance.deviations);
      } else {
        check(`signature identical to curated: ${r.title} / ${lang}`,
          sig.name === base.name
          && JSON.stringify(sig.params) === JSON.stringify(base.params)
          && sig.returnType === base.returnType,
          `${JSON.stringify(sig)} vs ${JSON.stringify(base)}`);
      }
    }

    const allTests = [...r.sampleTests, ...r.hiddenTests];
    for (const kind of ['sample', 'hidden']) {
      const src = c[kind];
      const input = decodeLiteralNewlines(src.input);
      const hit = allTests.find((t) => t.input === input);
      check(`(C) curated ${kind} fixture present verbatim: ${r.title}`, !!hit, input.slice(0, 40));
      if (hit) {
        check(`(C) curated ${kind} expected output reproduced: ${r.title}`, hit.output === String(src.output),
          `payload=${String(hit.output).slice(0, 40)} curated=${String(src.output).slice(0, 40)}`);
      }
    }
    check(`curated sample is sampleTests[0]: ${r.title}`,
      r.sampleTests[0].input === decodeLiteralNewlines(c.sample.input));
    check(`curated hidden is present in hiddenTests: ${r.title}`,
      r.hiddenTests.some((t) => t.input === decodeLiteralNewlines(c.hidden.input)));

    const paramCount = r.functionSignature.javascript.params.length;
    for (const t of allTests) {
      const tag = `${r.title} [${String(t.input).replace(/\n/g, '\\n').slice(0, 24)}]`;
      check(`no literal backslash-n in fixture input: ${tag}`, !String(t.input).includes('\\n'));
      const lines = String(t.input).split('\n');
      check(`one input line per parameter: ${tag}`, lines.length === paramCount, `lines=${lines.length} params=${paramCount}`);
      check(`no blank input line: ${tag}`, lines.every((l) => l.trim() !== ''));
    }

    const keys = allTests.map((t) => JSON.stringify([t.input, t.output]));
    check(`fixtures are unique: ${r.title}`, new Set(keys).size === keys.length, `${keys.length} fixtures`);
    check(`at least 3 samples and 5 hidden: ${r.title}`,
      r.sampleTests.length >= 3 && r.hiddenTests.length >= 5, `s=${r.sampleTests.length} h=${r.hiddenTests.length}`);
    const curatedKeys = new Set([c.sample.input, c.hidden.input].map((i) => decodeLiteralNewlines(i)));
    const added = allTests.filter((t) => !curatedKeys.has(t.input)).length;
    check(`fixtures added beyond the curated pair: ${r.title}`, added >= 5, `added=${added}`);

    for (const lang of DSA_LANGS) {
      check(`starter non-empty: ${r.title} / ${lang}`, !!String(r.starterCode[lang]).trim());
      // A starter is a stub: it must NOT contain the reference's algorithm body
      // (everything after the reference's first, signature-only line).
      const refBody = batch.REFERENCES[r.title][lang].split('\n').slice(1).join('\n').trim();
      check(`starter is a stub, not the reference: ${r.title} / ${lang}`,
        refBody.length > 0 && !String(r.starterCode[lang]).includes(refBody),
        'starter contains the reference body');
    }
    check(`inputFormat derived from the signature: ${r.title}`,
      r.inputFormat.length === r.functionSignature.javascript.params.length
      && r.inputFormat.every((f, i) => f.paramName === r.functionSignature.javascript.params[i].name));
    check(`outputFormat present: ${r.title}`, !!r.outputFormat && !!r.outputFormat.type && !!r.outputFormat.description);
    check(`referenceSolution present: ${r.title}`, !!r.referenceSolution.code);
  }
  console.log(`  [C] provenance done (${checks.length} checks so far)`);
}


/* ================================ SECTION D =================================
 * Every fixture is executed through the REAL platform path: the record's stored
 * reference is wrapped by judge0Coding.buildDriverFromSignature (the same driver
 * the /run and /submit routes build) and run by localExecutor, which compiles and
 * executes locally. JavaScript uses the stored referenceSolution; Java and C++
 * use the per-language reference bodies; Python is compiled and its driver
 * behaviour is probed and reported (see report.limitations).
 */
const recordSummaries = [];

function javaSource(title) {
  const body = batch.REFERENCES[title].java;
  return `import java.util.*;\n\nclass Solution {\n${body}\n}\n`;
}

/** C++ reference source: the same helper preamble the starter ships with (the
 *  driver only supplies the includes, so any record-level helper must be explicit). */
function cppSource(title) {
  const pre = title === 'Word Search' ? batch._internals.GRID_PREAMBLE.cpp : '';
  return `${pre}${batch.REFERENCES[title].cpp}`;
}

async function runFixturesIn(record, lang, source) {
  const sig = record.functionSignature[lang];
  const returnType = record.functionSignature.javascript.returnType;
  let full;
  try {
    full = judge0.buildDriverFromSignature(source, lang, sig);
  } catch (e) {
    check(`driver build (${lang}): ${record.title}`, false, e.message);
    return { passed: 0, total: 0, error: 'driver build failed: ' + e.message };
  }
  const cases = [...record.sampleTests, ...record.hiddenTests];
  let passed = 0;
  const bad = [];
  for (const tc of cases) {
    const res = await localExecutor.executeSingleCase(full, lang, tc.input, tc.output, returnType);
    if (res.passed) passed++;
    else bad.push(`in=${JSON.stringify(String(tc.input)).slice(0, 60)} want=${String(tc.output).slice(0, 40)} got=${String(res.output).slice(0, 40)}${res.errorType ? ' ' + res.errorType : ''}${res.error ? ' ' + String(res.error).slice(0, 120) : ''}`);
  }
  return { passed, total: cases.length, bad };
}

async function sectionD() {
  for (const r of batch.records) {
    const summary = {
      title: r.title, slug: r.slug, source: r.provenance.source,
      samples: r.sampleTests.length, hidden: r.hiddenTests.length,
    };

    // --- JavaScript: the platform's own sandbox path with the stored reference ---
    const doc = {
      title: r.title, slug: r.slug,
      functionSignature: r.functionSignature,
      sampleTests: r.sampleTests, hiddenTests: r.hiddenTests,
    };
    const total = r.sampleTests.length + r.hiddenTests.length;
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

    // --- Java and C++: the same drivers, the per-language reference bodies ---
    for (const lang of ['java', 'cpp']) {
      const src = lang === 'java' ? javaSource(r.title) : cppSource(r.title);
      const out = await runFixturesIn(r, lang, src);
      check(`reference execution (${lang}, all fixtures): ${r.title}`, out.passed === out.total,
        `${out.passed}/${out.total}${out.error ? ' ' + out.error : ''}${out.bad && out.bad.length ? ' :: ' + out.bad.slice(0, 2).join(' || ') : ''}`);
      summary[lang] = `${out.passed}/${out.total}`;
    }

    // --- Python: compile the starter and the reference, and probe the driver ---
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b2py-'));
    const toolchain = fs.existsSync(path.join(tmp, 'x')) || runCmd('py', ['--version'], tmp) === null;
    if (toolchain) {
      const pyRef = batch.REFERENCES[r.title].python;
      const f = path.join(tmp, 'ref.py');
      fs.writeFileSync(f, pyRef, 'utf8');
      const err = runCmd('py', ['-m', 'py_compile', f], tmp);
      check(`python reference compiles: ${r.title}`, !err, err || '');
      // The platform python driver passes parameter NAMES (not parsed values) to the
      // function, so the executed result cannot be produced by any solution body.
      // Probe it once to record the platform behaviour instead of asserting on it.
      if (r.title === batch.BATCH_TITLES[0]) {
        let driverOut = '';
        try {
          const full = judge0.buildDriverFromSignature(pyRef, 'python', r.functionSignature.python);
          const df = path.join(tmp, 'drv.py');
          fs.writeFileSync(df, full, 'utf8');
          driverOut = execFileSync('py', [df], { input: r.sampleTests[0].input, encoding: 'utf8', timeout: 20000 });
        } catch (e) {
          driverOut = 'ERROR: ' + String(((e.stderr || '') + '') || e.message).trim().split('\n').pop();
        }
        summary.pythonDriver = String(driverOut).trim().slice(0, 120);
        warn('python driver passes parameter names, not parsed values (platform-wide, pre-existing)',
          `probe on "${r.title}" -> ${String(driverOut).trim().slice(0, 80)}`);
      }
      summary.python = 'compiles';
    } else {
      summary.python = 'skipped (no python toolchain)';
      warn(`python toolchain unavailable: ${r.title}`);
    }

    recordSummaries.push(summary);
    console.log(`  [D] ${r.title}: js=${summary.javascript} java=${summary.java} cpp=${summary.cpp} py=${summary.python} (s=${summary.samples} h=${summary.hidden})`);
  }
  fs.rmSync(path.join(os.tmpdir(), 'b2py-'), { recursive: true, force: true });
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

/** The platform sandbox executor: builds the typed driver from the signature and
 *  runs it through judge0.executeSingleCase (Judge0 when reachable, localExecutor
 *  otherwise). This is the same wiring the /run and /submit routes use, and the
 *  same wiring the Batch 1 validator uses. */
const SANDBOX = G.createSandboxExecutor({
  buildDriverFromSignature: (c, l, s) => judge0.buildDriverFromSignature(c, l, s),
  executeSingleCase: (fc, l, i, e, rt) => judge0.executeSingleCase(fc, l, i, e, rt),
});

function sectionE() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b2tpl-'));
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
async function main() {
  const started = Date.now();
  console.log('== Batch 2 offline validation (read-only, fail-closed) ==');
  sectionA();
  sectionB();
  sectionC();
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
    contentSourceRequired: CONTENT_SOURCE_REQUIRED,
    limitations: [
      'MongoDB was not contacted; this validator is offline by design (no DB read or write).',
      'Every fixture is executed for JavaScript (platform sandbox), Java and C++ (real drivers, compiled and run). '
      + 'Python cannot be executed by the platform: localExecutor.executeSingleCase returns system_error for python, '
      + 'and the python driver in judge0Coding.buildDriverFromSignature passes the parameter NAMES to the function '
      + 'instead of driver-parsed values, so no solution body can be executed through it. This is a pre-existing, '
      + 'platform-wide driver limitation (identical for all 266 DSA records) and is deliberately NOT worked around '
      + 'here, because the execution implementation must not change. Python templates/references are compile-verified.',
    ],
  };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nchecks=${checks.length} failures=${failures.length} warnings=${warnings.length} duration=${report.durationMs}ms`);
  for (const f of failures) console.log('FAIL ' + f);
  if (warnings.length) warnings.forEach((w) => console.log('WARN ' + w));
  console.log('report -> ' + OUT);
  console.log('VERDICT: ' + report.verdict);
  process.exit(failures.length ? 1 : 0);
}

main().catch((e) => {
  console.error('VALIDATOR CRASH (fail-closed):', e);
  process.exit(1);
});

