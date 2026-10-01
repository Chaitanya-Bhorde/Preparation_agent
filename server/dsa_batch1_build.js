'use strict';

/**
 * dsa_batch1_build.js
 * ---------------------------------------------------------------------------
 * Builds the batch-1 documents: for each reconstructable problem it runs the
 * authored reference over every case to DERIVE the expected output, then emits
 * the exact record the platform stores (description, input/output format,
 * constraints, visible + hidden tests, typed signature, reference solution).
 *
 * Expected outputs are computed, never authored by hand, so the statement,
 * the fixtures and the judge cannot disagree.
 *
 * Dry-run by default. `--apply` performs targeted updates for the selected
 * slugs only. No deletes, no drops; submissions and user progress untouched.
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');
const G = require('./utils/genericValidator');
const { CONTENT } = require('./scripts/dsaBatch1Content');
const { generateStarterCode } = require('./utils/codeGenerator');

const APPLY = process.argv.includes('--apply');
const LANGS = ['javascript', 'python', 'java', 'cpp', 'c', 'csharp'];

/**
 * Render one case as the line-based stdin the judge parses: one parameter per
 * line, JSON-encoded for collections, literal for strings and scalars.
 *
 * Takes the same POSITIONAL argument list used to call the reference, so the
 * rendered stdin and the computed expectation can never disagree.
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
/** A deliberately wrong solution, used to prove Submit still rejects bad work. */
function wrongSolution(sig) {
  const p = sig.javascript.params.map((x) => x.name).join(', ');
  const rt = sig.javascript.returnType || '';
  if (/boolean|bool/i.test(rt)) return `function ${sig.javascript.name}(${p}) { return true; }`;
  if (/\[\]/.test(rt)) return `function ${sig.javascript.name}(${p}) { return ${JSON.stringify(rt.includes('[]') && rt.includes('[[') ? [[]] : [])}; }`;
  if (/string/i.test(rt)) return `function ${sig.javascript.name}(${p}) { return 'wrong'; }`;
  return `function ${sig.javascript.name}(${p}) { return 123456789; }`;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const decision = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch1_decision.json'), 'utf8'));
  const rows = decision.filter((r) => r.unambiguous);

  console.log(`mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`reconstructable: ${rows.length}\n`);

  const built = [];
  const failures = [];

  for (const row of rows) {
    const spec = CONTENT[row.title];
    if (!spec) { failures.push(`${row.title}: no authored content`); continue; }

    let fn;
    try { fn = G.createSolveFunction(spec.reference); }
    catch (e) { failures.push(`${row.title}: reference does not compile (${e.message})`); continue; }

    const samples = [];
    const hidden = [];
    let bad = null;

    for (const kase of spec.cases) {
      const args = argsFor(spec.signature, kase);
      let value;
      try { value = fn.apply(null, args); }
      catch (e) { bad = `${row.title}: reference threw -> ${e.message}`; break; }

      const entry = { input: renderInput(spec.signature, args), output: renderOutput(value) };
      if (kase.visible) samples.push(entry);
      else hidden.push(entry);
    }
    if (bad) { failures.push(bad); continue; }

    if (samples.length === 0 || hidden.length === 0) {
      failures.push(`${row.title}: needs at least one visible and one hidden case`);
      continue;
    }

    const probe = {
      inputFormat: { fields: spec.signature.javascript.params.map((p) => ({ name: p.name, type: p.type })) },
      outputFormat: { type: spec.signature.javascript.returnType },
    };
    for (const entry of samples.concat(hidden)) {
      let round;
      try { round = renderOutput(fn.apply(null, G.parseTestCaseInput(probe, entry.input).args)); }
      catch (e) { failures.push(`${row.title}: round-trip threw -> ${e.message}`); round = null; }
      if (round !== null && !G.compareOutputs(entry.output, round, probe.outputFormat)) {
        failures.push(`${row.title}: rendered input does not round-trip`);
      }
    }

    const starterCode = {};
    for (const lang of LANGS) starterCode[lang] = generateStarterCode(spec.signature[lang], lang);

    const live = await CodingProblem.findOne({ title: row.title }).lean();

    built.push({
      title: row.title,
      slug: live.slug,
      id: String(live._id),
      update: {
        description: spec.description,
        constraints: spec.constraints,
        inputFormat: spec.signature.javascript.params.map((p) => ({ paramName: p.name, type: p.type })),
        outputFormat: { type: spec.signature.javascript.returnType, description: spec.output },
        'functionSignature.javascript': spec.signature.javascript,
        'functionSignature.python': spec.signature.python,
        'functionSignature.java': spec.signature.java,
        'functionSignature.cpp': spec.signature.cpp,
        'starterCode.javascript': starterCode.javascript,
        'starterCode.python': starterCode.python,
        'starterCode.java': starterCode.java,
        'starterCode.cpp': starterCode.cpp,
        'starterCode.c': starterCode.c,
        'starterCode.csharp': starterCode.csharp,
        'referenceSolution.code': spec.reference,
        'referenceSolution.language': 'javascript',
        sampleTests: samples,
        hiddenTests: hidden,
        isActive: true,
      },
      samples: samples.length,
      hidden: hidden.length,
      referenceCode: spec.reference,
      wrongCode: wrongSolution(spec.signature),
      sigName: spec.signature.javascript.name,
      returnType: spec.signature.javascript.returnType,
    });
  }

  console.log(`built: ${built.length}/${rows.length}`);
  if (failures.length) {
    console.log(`\nFAILURES (${failures.length}):`);
    failures.forEach((f) => console.log('  ' + f));
  }

  fs.writeFileSync(path.join(__dirname, '_dsa_batch1_built.json'),
    JSON.stringify({ built, failures }, null, 2));

  if (!APPLY) {
    console.log('\nDRY RUN - nothing written.');
    await mongoose.disconnect();
    process.exit(failures.length ? 1 : 0);
  }

  for (const b of built) {
    await CodingProblem.updateOne({ _id: b.id }, { $set: b.update });
    console.log(`  APPLIED ${b.title} (${b.samples} visible, ${b.hidden} hidden)`);
  }
  console.log(`\n${built.length} problems activated.`);

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});