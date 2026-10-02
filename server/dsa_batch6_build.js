'use strict';

/**
 * dsa_batch6_build.js
 * ---------------------------------------------------------------------------
 * DRY RUN BY DEFAULT. Builds the batch-6 documents and refuses to write unless
 * every gate below passes.
 *
 * Gates, in order:
 *   (a) AUTHORED ARGUMENTS == PARSED ARGUMENTS. The rendered stdin is fed back
 *       through the platform's own parser and each parsed argument must equal
 *       the authored one. A renderer and parser that are wrong in the SAME way
 *       would otherwise agree on the output while testing something else.
 *   (b) SEMANTIC REPRESENTATION CHECK. Deep equality is not enough for
 *       structured data, so each argument is also checked against a validator
 *       for its declared type, plus per-problem structural rules.
 *   (c) INDEPENDENT ORACLE. The stored expected output must equal what an
 *       independently written oracle produces, what the authored `expect` says,
 *       and what the reference produces - all three, or nothing ships.
 *   (d) DISCRIMINATOR. A wrong solution must be rejected by the visible cases
 *       AND by the hidden cases.
 *
 *   node dsa_batch6_build.js            # dry run, writes nothing
 *   node dsa_batch6_build.js --apply    # targeted updates for selected ids only
 *
 * No deletes, no drops, no bulk replacement. Submissions and user progress are
 * never touched.
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');
const G = require('./utils/genericValidator');
const CONTENT_MODULES = require('./scripts/dsaBatch6Content');
const { ORACLE } = require('./scripts/dsaBatch6Oracle');
const { WRONG, wrongSourceFor } = require('./scripts/dsaBatch6Wrong');
const { generateStarterCode } = require('./utils/codeGenerator');

const APPLY = process.argv.includes('--apply');
const LANGS = ['javascript', 'python', 'java', 'cpp', 'c', 'csharp'];

/** Flatten the topic modules into one title -> spec map. */
const CONTENT = {};
for (const mod of Object.keys(CONTENT_MODULES)) {
  for (const [title, spec] of Object.entries(CONTENT_MODULES[mod])) CONTENT[title] = spec;
}

/**
 * Render one case as the line-based stdin the judge parses: one parameter per
 * line, JSON for anything structured, literal for strings and scalars. Takes
 * the same POSITIONAL argument list used to call the reference, so the rendered
 * stdin and the computed expectation cannot disagree.
 */
function renderInput(sig, args) {
  return sig.javascript.params
    .map((p, i) => {
      const v = args[i];
      if (typeof v === 'string') return v;
      return JSON.stringify(v);
    })
    .join('\n');
}

/** Canonical stdout form, matching how the driver prints a returned value. */
function renderOutput(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

/** Bind each case's named fields to the reference's positional parameters. */
function argsFor(sig, kase) {
  return sig.javascript.params.map((p) => kase[p.name]);
}

/** Per-type validators for gate (b). */
const VALIDATORS = {
  string: (v, param) => (typeof v === 'string' ? [] : [`${param} is not a string`]),
  number: (v, param) => (typeof v === 'number' && Number.isInteger(v)
    ? [] : [`${param} is not an integer`]),
  'number[]': (v, param) => {
    if (!Array.isArray(v)) return [`${param} is not an array`];
    return v.filter((n) => typeof n !== 'number' || !Number.isInteger(n))
      .map((_, i) => `${param}[${i}] is not an integer`);
  },
  'string[]': (v, param) => (Array.isArray(v) && v.every((s) => typeof s === 'string')
    ? [] : [`${param} is not an array of strings`]),
  'number[][]': (v, param) => {
    if (!Array.isArray(v)) return [`${param} is not an array`];
    return v.filter((row) => !Array.isArray(row) || row.some((n) => typeof n !== 'number'))
      .map((_, i) => `${param}[${i}] is not an array of numbers`);
  },
  'string[][]': (v, param) => {
    if (!Array.isArray(v)) return [`${param} is not an array`];
    return v.filter((row) => !Array.isArray(row) || row.some((s) => typeof s !== 'string'))
      .map((_, i) => `${param}[${i}] is not an array of strings`);
  },
};
/**
 * Extra structural rules the deep-equality check cannot see. Batch 6 contains
 * interval lists whose rows must be non-degenerate, Sudoku grids that must be
 * 9x9, and relative-sort inputs where every value of arr1 has to appear in
 * arr2 (the contract guarantees it, so a fixture that broke it would make the
 * stored expected output meaningless).
 */
function structureIssues(title, args) {
  const issues = [];
  const checkIntervals = (list, param, allowDegenerate) => {
    if (!Array.isArray(list)) return;
    list.forEach((iv, i) => {
      if (!Array.isArray(iv) || iv.length !== 2) {
        issues.push(`${param}[${i}] is not a [start, end] pair`);
        return;
      }
      // The interval being INSERTED may legitimately be a single point
      // (start === end); the ones already in the list may not.
      if (iv[0] > iv[1] || (!allowDegenerate && iv[0] === iv[1])) {
        issues.push(`${param}[${i}] must have start < end`);
      }
    });
  };
  if (title === 'Relative Sort Array') {
    const [, arr2] = args;
    if (Array.isArray(arr2) && Array.isArray(args[0])) {
      const present = new Set(arr2);
      args[0].forEach((v, i) => {
        if (!present.has(v)) issues.push(`arr1[${i}] = ${v} does not occur in arr2`);
      });
    }
  } else if (title === 'Meeting Rooms' || title === 'Meeting Rooms II') {
    checkIntervals(args[0], 'intervals', false);
  } else if (title === 'Insert Interval') {
    checkIntervals(args[0], 'intervals', false);
    checkIntervals([args[1]], 'newInterval', true);
  } else if (title === 'Sudoku Solver') {
    const b = args[0];
    if (!Array.isArray(b) || b.length !== 9) issues.push('board must have 9 rows');
    else if (b.some((row) => !Array.isArray(row) || row.length !== 9)) {
      issues.push('every board row must have 9 cells');
    }
  }
  return issues;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const targets = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch6_decision.json'), 'utf8'))
    .filter((r) => r.unambiguous);

  const rows = [];
  const failures = [];

  for (const target of targets) {
    const spec = CONTENT[target.title];
    if (!spec) { failures.push(`${target.title}: no authored content`); continue; }

    const live = await CodingProblem.findOne({ title: target.title }).lean();
    if (!live) { failures.push(`${target.title}: not found in the catalogue`); continue; }

    // An already-active record is expected on a RE-RUN: the first --apply
    // activated these, and re-running must still regenerate the artefacts
    // (notably _dsa_batch6_built.json, which the live runtime reads) without
    // being blocked by its own prior success.
    //
    // What must never happen is silently overwriting an active record that this
    // batch did NOT author. That is checked by content, not by the flag: if the
    // stored samples/hiddenTests/reference are not what this batch would write,
    // the record belongs to someone else and the run stops.
    const wouldWriteRef = spec.reference;
    const matchesOurs = String((live.referenceSolution && live.referenceSolution.code) || '').trim() === wouldWriteRef.trim()
      && (live.sampleTests || []).length === spec.cases.filter((c) => c.visible).length
      && (live.hiddenTests || []).length === spec.cases.filter((c) => !c.visible).length;
    if (live.isActive && !matchesOurs) {
      failures.push(`${target.title}: already active with DIFFERENT content, refusing to overwrite`);
      continue;
    }

    const fn = eval(`(${spec.reference})`);
    const wrong = WRONG[target.title];
    const oracle = ORACLE[target.title];
    if (!wrong) { failures.push(`${target.title}: no wrong solution`); continue; }
    if (!oracle) { failures.push(`${target.title}: no oracle`); continue; }

    const samples = [];
    const hidden = [];
    let visibleReject = 0;
    let hiddenReject = 0;

    for (const kase of spec.cases) {
      const args = argsFor(spec.signature, kase);

      // (b) semantic representation check
      let typeIssue = null;
      for (const p of spec.signature.javascript.params) {
        const check = VALIDATORS[p.type];
        if (check) {
          const issues = check(kase[p.name], p.name);
          if (issues.length) { typeIssue = issues.join('; '); break; }
        }
      }
      if (!typeIssue) {
        const s = structureIssues(target.title, args);
        if (s.length) typeIssue = s.join('; ');
      }
      if (typeIssue) { failures.push(`${target.title}: ${typeIssue}`); break; }

      // (c) oracle agreement
      let value;
      try { value = fn.apply(null, args); }
      catch (e) { failures.push(`${target.title}: reference threw -> ${e.message}`); break; }
      let oracleValue;
      try { oracleValue = oracle.apply(null, args); }
      catch (e) { failures.push(`${target.title}: oracle threw -> ${e.message}`); break; }

      const rendered = renderOutput(value);
      if (rendered !== renderOutput(oracleValue)) {
        failures.push(`${target.title}: oracle ${renderOutput(oracleValue)} != reference ${rendered}`);
        break;
      }
      if (rendered !== renderOutput(kase.expect)) {
        failures.push(`${target.title}: authored expect ${renderOutput(kase.expect)} != reference ${rendered}`);
        break;
      }

      // (a) round-trip the rendered stdin through the platform's own parser
      const input = renderInput(spec.signature, args);
      const probe = {
        inputFormat: { fields: spec.signature.javascript.params.map((p) => ({ name: p.name, type: p.type })) },
        outputFormat: { type: spec.signature.javascript.returnType },
      };
      let parsed;
      try { parsed = G.parseTestCaseInput(probe, input); }
      catch (e) { failures.push(`${target.title}: parser threw on rendered stdin -> ${e.message}`); break; }
      if (JSON.stringify(parsed.args) !== JSON.stringify(args)) {
        failures.push(`${target.title}: rendered stdin does not parse back to the authored args`);
        break;
      }

      let wrongOut;
      try { wrongOut = renderOutput(wrong.apply(null, args)); }
      catch (e) { failures.push(`${target.title}: wrong solution threw -> ${e.message}`); break; }

      const entry = { input, output: rendered };
      if (kase.visible) {
        samples.push(entry);
        if (wrongOut !== rendered) visibleReject++;
      } else {
        hidden.push(entry);
        if (wrongOut !== rendered) hiddenReject++;
      }
    }
// (d) discriminator: Run gates Submit, so BOTH suites must reject it.
    if (visibleReject === 0) failures.push(`${target.title}: wrong solution passes every visible case`);
    if (hiddenReject === 0) failures.push(`${target.title}: wrong solution passes every hidden case`);
    if (samples.length < 2) failures.push(`${target.title}: needs at least 2 visible cases`);
    if (hidden.length < 3) failures.push(`${target.title}: needs at least 3 hidden cases`);

    rows.push({
      title: target.title,
      id: String(live._id),
      problemId: live.problemId,
      slug: live.slug,
      samples,
      hidden,
      description: spec.description,
      input: spec.input,
      output: spec.output,
      constraints: spec.constraints,
      signature: spec.signature,
      referenceCode: spec.reference,
      wrongCode: wrongSourceFor(WRONG[target.title], spec.signature.javascript.name, spec.signature.javascript.params.map((p) => p.name)),
      visibleReject,
      hiddenReject,
    });
  }

  fs.writeFileSync(path.join(__dirname, '_dsa_batch6_built.json'), JSON.stringify({
    built: rows.map((r) => ({
      title: r.title,
      slug: r.slug,
      referenceCode: r.referenceCode,
      wrongCode: r.wrongCode,
      samples: r.samples,
      hidden: r.hidden,
      visibleReject: r.visibleReject,
      hiddenReject: r.hiddenReject,
    })),
  }, null, 2));

  console.log(`targets:  ${targets.length}`);
  console.log(`built:    ${rows.length}`);
  console.log(`failures: ${failures.length}`);
  if (failures.length) failures.forEach((f) => console.log('  FAIL ' + f));
  console.log('\nwritten: _dsa_batch6_built.json');

  if (failures.length) {
    console.log('\nDRY RUN: nothing was written.');
    await mongoose.disconnect();
    process.exit(1);
  }

  if (!APPLY) {
    console.log('\nDRY RUN: all gates passed, nothing was written. Re-run with --apply to activate.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // Targeted updates only. No deletes, no drops, no bulk replacement.
  let written = 0;
  for (const r of rows) {
    const starterCode = {};
    for (const lang of LANGS) {
      starterCode[lang] = generateStarterCode(r.signature[lang] || r.signature.javascript, lang);
    }
    const res = await CodingProblem.updateOne({ _id: r.id }, {
      $set: {
        description: r.description,
        constraints: r.constraints,
        inputFormat: r.signature.javascript.params.map((p) => ({ paramName: p.name, type: p.type })),
        outputFormat: { type: r.signature.javascript.returnType, description: r.output },
        'functionSignature.javascript': r.signature.javascript,
        'functionSignature.python': r.signature.python,
        'functionSignature.java': r.signature.java,
        'functionSignature.cpp': r.signature.cpp,
        referenceSolution: { code: r.referenceCode, language: 'javascript' },
        sampleTests: r.samples,
        hiddenTests: r.hidden,
        starterCode,
        isActive: true,
      },
    });
    if (res.modifiedCount === 1) written++;
    else console.log(`  WARN ${r.title}: matched ${res.matchedCount} docs`);
  }
  console.log(`\nAPPLIED: ${written}/${rows.length} problems activated.`);

  await mongoose.disconnect();
  process.exit(written === rows.length ? 0 : 1);
})().catch(async (e) => {
  console.error('BUILD FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
