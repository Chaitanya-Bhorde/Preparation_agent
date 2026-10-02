'use strict';

/**
 * dsa_batch5_build.js
 * ---------------------------------------------------------------------------
 * DRY RUN BY DEFAULT. Builds the batch-5 documents and refuses to write unless
 * every gate below passes.
 *
 * Gates, in order:
 *   (a) AUTHORED ARGUMENTS == PARSED ARGUMENTS. The rendered stdin is fed back
 *       through the platform's own parser and each parsed argument must equal
 *       the authored one. A renderer and parser that are wrong in the SAME way
 *       would otherwise agree on the output while testing something else.
 *   (b) SEMANTIC REPRESENTATION CHECK. Deep equality is not enough for
 *       structured data, so each argument is also checked against a validator
 *       for its declared type (matrix raggedness, edge arity, node identity).
 *   (c) INDEPENDENT ORACLE. The stored expected output must equal what an
 *       independently written oracle produces, what the authored `expect` says,
 *       and what the reference produces - all three, or nothing ships.
 *   (d) DISCRIMINATOR. A wrong solution must be rejected by the visible cases
 *       AND the hidden cases. Its wrongness is proven independently in
 *       dsa_batch5_wrongproof.js.
 *
 *   node dsa_batch5_build.js            # dry run, writes nothing
 *   node dsa_batch5_build.js --apply    # targeted updates for selected ids only
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
const CONTENT_MODULES = require('./scripts/dsaBatch5Content');
const { ORACLE } = require('./scripts/dsaBatch5Oracle');
const { WRONG } = require('./scripts/dsaBatch5Wrong');
const { generateStarterCode } = require('./utils/codeGenerator');

const APPLY = process.argv.includes('--apply');
const LANGS = ['javascript', 'python', 'java', 'cpp', 'c', 'csharp'];

/** Flatten the three topic modules into one title -> spec map. */
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

// --------------------------------------------------------------------- (b)
// Semantic representation validators. These run on the PARSED arguments, not
// on the rendered text, and assert what the type name alone does not: that a
// matrix is rectangular, that integers really are integers, and that node
// labels sit inside the declared range.

const SEMANTIC = {
  'number[][]': (v, param, ragged) => {
    if (!Array.isArray(v)) return [`${param} is not an array`];
    const issues = [];
    const width = v.length ? (Array.isArray(v[0]) ? v[0].length : -1) : 0;
    v.forEach((row, i) => {
      if (!Array.isArray(row)) { issues.push(`${param}[${i}] is not an array`); return; }
      if (!ragged && row.length !== width) issues.push(`${param} is ragged: row ${i} has ${row.length}, expected ${width}`);
      row.forEach((cell, j) => {
        if (cell !== null && typeof cell !== 'number') issues.push(`${param}[${i}][${j}] is not a number`);
        if (typeof cell === 'number' && !Number.isInteger(cell)) issues.push(`${param}[${i}][${j}] is not an integer`);
      });
    });
    return issues;
  },
  'string[]': (v, param) => {
    if (!Array.isArray(v)) return [`${param} is not an array`];
    return v.filter((s) => typeof s !== 'string').map((_, i) => `${param}[${i}] is not a string`);
  },
  'number[]': (v, param) => {
    if (!Array.isArray(v)) return [`${param} is not an array`];
    return v.filter((n) => typeof n !== 'number' || !Number.isInteger(n))
      .map((_, i) => `${param}[${i}] is not an integer`);
  },
};

// Graph structure: node identity, edge arity, label range, and the directed vs
// undirected assumptions each statement makes.
// Keys and Rooms is a LIST OF KEY LISTS, so `rooms` is jagged by design: each
// room holds a different number of keys. The rectangularity rule below does not
// apply to it, and its own checker validates every key instead.
const NO_RECTANGULARITY = new Set(['Keys and Rooms']);

const STRUCTURE = {};

STRUCTURE['Network Delay Time'] = ([n, edges, source, target]) => {
  const issues = [];
  edges.forEach((e, i) => {
    if (e.length !== 3) { issues.push(`edges[${i}] has ${e.length} entries, expected 3`); return; }
    if (e[0] < 0 || e[0] >= n || e[1] < 0 || e[1] >= n) issues.push(`edges[${i}] labels outside 0..n-1`);
    if (e[2] < 0) issues.push(`edges[${i}] has a negative weight`);
  });
  if (source < 0 || source >= n) issues.push('source outside 0..n-1');
  if (target < 0 || target >= n) issues.push('target outside 0..n-1');
  return issues;
};

STRUCTURE['Cheapest Flights Within K Stops'] = ([n, flights, src, dst]) => {
  const issues = [];
  flights.forEach((f, i) => {
    if (f.length !== 3) { issues.push(`flights[${i}] has ${f.length} entries, expected 3`); return; }
    if (f[0] < 0 || f[0] >= n || f[1] < 0 || f[1] >= n) issues.push(`flights[${i}] labels outside 0..n-1`);
    if (f[2] < 0) issues.push(`flights[${i}] has a negative cost`);
  });
  if (src < 0 || src >= n) issues.push('src outside 0..n-1');
  if (dst < 0 || dst >= n) issues.push('dst outside 0..n-1');
  return issues;
};

STRUCTURE['Minimum Height Trees'] = ([n, edges]) => {
  const issues = [];
  if (edges.length !== n - 1) issues.push(`a tree needs n-1 edges, got ${edges.length} for n=${n}`);
  const seen = new Set();
  edges.forEach((e, i) => {
    if (e.length !== 2) { issues.push(`edges[${i}] has ${e.length} entries, expected 2`); return; }
    if (e[0] < 0 || e[0] >= n || e[1] < 0 || e[1] >= n) issues.push(`edges[${i}] labels outside 0..n-1`);
    if (e[0] === e[1]) issues.push(`edges[${i}] is a self-loop`);
    const key = `${e[0]}-${e[1]}`;
    if (seen.has(key)) issues.push(`edges[${i}] repeats an edge`);
    seen.add(key);
  });
  return issues;
};

STRUCTURE['Is Graph Bipartite'] = ([n, edges]) => {
  const issues = [];
  edges.forEach((e, i) => {
    if (e.length !== 2) { issues.push(`edges[${i}] has ${e.length} entries, expected 2`); return; }
    if (e[0] < 0 || e[0] >= n || e[1] < 0 || e[1] >= n) issues.push(`edges[${i}] labels outside 0..n-1`);
  });
  return issues;
};

STRUCTURE['Find Eventual Safe States'] = ([n, edges]) => {
  const issues = [];
  edges.forEach((e, i) => {
    if (e.length !== 2) { issues.push(`edges[${i}] has ${e.length} entries, expected 2`); return; }
    if (e[0] < 0 || e[0] >= n || e[1] < 0 || e[1] >= n) issues.push(`edges[${i}] labels outside 0..n-1`);
  });
  return issues;
};

STRUCTURE['Keys and Rooms'] = ([rooms]) => {
  const issues = [];
  const n = rooms.length;
  rooms.forEach((keys, i) => {
    if (!Array.isArray(keys)) { issues.push(`rooms[${i}] is not an array`); return; }
    keys.forEach((k) => {
      if (!Number.isInteger(k)) issues.push(`rooms[${i}] holds a non-integer key`);
      else if (k < 0 || k >= n) issues.push(`rooms[${i}] holds key ${k} outside 0..n-1`);
    });
  });
  return issues;
};

// Matrix structure: the two 2D matrix problems sort DIFFERENTLY, so each gets
// its own checker rather than a shared "is it sorted" test.
STRUCTURE['Search a 2D Matrix'] = ([matrix]) => {
  const issues = [];
  if (!matrix.length) return ['matrix is empty'];
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 1; c < matrix[r].length; c++) {
      if (matrix[r][c - 1] >= matrix[r][c]) issues.push(`row ${r} is not strictly ascending at column ${c}`);
    }
    if (r > 0 && matrix[r][0] <= matrix[r - 1][matrix[r - 1].length - 1]) {
      issues.push(`row ${r} does not start above the end of row ${r - 1}`);
    }
  }
  return issues;
};

STRUCTURE['Search a 2D Matrix II'] = ([matrix]) => {
  const issues = [];
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 1; c < matrix[r].length; c++) {
      if (matrix[r][c - 1] > matrix[r][c]) issues.push(`row ${r} is not ascending at column ${c}`);
    }
  }
  for (let c = 0; c < (matrix[0] || []).length; c++) {
    for (let r = 1; r < matrix.length; r++) {
      if (matrix[r - 1][c] > matrix[r][c]) issues.push(`column ${c} is not ascending at row ${r}`);
    }
  }
  return issues;
};

// Array contract assumptions. Each of these encodes a promise the statement
// makes and a learner could otherwise silently violate.
STRUCTURE['Find Smallest Letter Greater Than Target'] = ([letters, target]) => {
  const issues = [];
  for (let i = 1; i < letters.length; i++) {
    if (letters[i - 1] >= letters[i]) issues.push(`letters is not strictly ascending at index ${i}`);
  }
  letters.forEach((ch) => {
    if (!/^[a-z]$/.test(ch)) issues.push(`letters holds a non-lowercase entry: ${ch}`);
  });
  if (!/^[a-z]$/.test(target)) issues.push(`target is not a single lowercase letter: ${target}`);
  return issues;
};

STRUCTURE['Search in Rotated Sorted Array'] = ([nums]) => {
  const issues = [];
  const sorted = nums.slice().sort((a, b) => a - b);
  if (sorted.some((v, i) => i > 0 && sorted[i] === sorted[i - 1])) {
    issues.push('nums has duplicate values, but this contract requires distinct ones');
  }
  let descents = 0;
  for (let i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) descents++;
  if (descents > 1) issues.push(`nums has ${descents} descents, so it is not a rotation of an ascending array`);
  return issues;
};

STRUCTURE['Find First and Last Position'] = ([nums]) => {
  const issues = [];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i - 1] > nums[i]) issues.push(`nums is not sorted at index ${i}`);
  }
  return issues;
};

STRUCTURE['Missing Number'] = ([nums]) => {
  const issues = [];
  const seen = new Set();
  for (const v of nums) {
    if (seen.has(v)) issues.push(`nums repeats ${v}`);
    seen.add(v);
    if (v < 0 || v > nums.length) issues.push(`value ${v} lies outside 0..${nums.length}`);
  }
  if (seen.size !== nums.length) issues.push('nums length does not match its number of distinct values');
  return issues;
};

// Operation sequences: the design problems encode their inputs as flat string
// arrays, so the checker validates the GRAMMAR, not just the shape.
STRUCTURE['Maximum Frequency Stack'] = ([operations]) => {
  const issues = [];
  let held = 0;
  operations.forEach((op, i) => {
    const parts = op.split(' ');
    if (parts[0] === 'push') {
      held++;
      if (!Number.isInteger(Number(parts[1]))) issues.push(`operations[${i}] pushes a non-integer`);
    } else if (parts[0] === 'freq') {
      if (!Number.isInteger(Number(parts[1]))) issues.push(`operations[${i}] asks freq of a non-integer`);
    } else if (parts[0] === 'popMax') {
      if (held === 0) issues.push(`operations[${i}] calls popMax on an empty structure`);
      else held--;
    } else {
      issues.push(`operations[${i}] is not a known operation: ${op}`);
    }
  });
  return issues;
};

STRUCTURE['Task Scheduler'] = ([tasks, n]) => {
  const issues = [];
  tasks.forEach((t) => {
    if (!/^[A-Z]$/.test(t)) issues.push(`task "${t}" is not a single uppercase letter`);
  });
  if (n < 0) issues.push(`n=${n} must not be negative`);
  return issues;
};

STRUCTURE['Top K Frequent Words'] = ([words, k]) => {
  const issues = [];
  words.forEach((w) => {
    if (!/^[a-z]{2,20}$/.test(w)) issues.push(`word "${w}" is not 2 to 20 lowercase letters`);
  });
  if (k < 1) issues.push(`k=${k} must be at least 1`);
  return issues;
};

STRUCTURE['IPO'] = ([, , costs, profits]) => {
  if (costs.length !== profits.length) {
    return [`costs has ${costs.length} entries but profits has ${profits.length}`];
  }
  return costs
    .map((c, i) => (c <= profits[i] ? null : `project ${i} costs ${c} but profits only ${profits[i]}`))
    .filter(Boolean);
};

STRUCTURE['Find K-th Smallest Pair Distance'] = ([points, k]) => {
  const pairs = (points.length * (points.length - 1)) / 2;
  if (k < 1 || k > pairs) return [`k=${k} lies outside 1..${pairs} for ${points.length} points`];
  return [];
};

STRUCTURE['Kth Largest Element in Array'] = ([nums, k]) => {
  if (k < 1 || k > nums.length) return [`k=${k} lies outside 1..${nums.length}`];
  return [];
};

STRUCTURE['Kth Largest Element in Stream'] = ([k]) => {
  if (k < 1) return [`k=${k} must be at least 1`];
  return [];
};

/**
 * Run every gate for one problem. Returns { doc, failures } so a single bad
 * problem is reported without hiding the results of the others.
 */
function buildOne(row) {
  const spec = CONTENT[row.title];
  const failures = [];
  if (!spec) return { failures: [`${row.title}: no authored content`] };

  let fn;
  try { fn = G.createSolveFunction(spec.reference); }
  catch (e) { return { failures: [`${row.title}: reference does not compile (${e.message})`] }; }

  const params = spec.signature.javascript.params;
  const samples = [];
  const hidden = [];

  for (const kase of spec.cases) {
    const args = argsFor(spec.signature, kase);
    let value;
    try { value = fn.apply(null, args); }
    catch (e) { failures.push(`${row.title}: reference threw on ${JSON.stringify(args).slice(0, 80)} -> ${e.message}`); break; }

    const entry = { input: renderInput(spec.signature, args), output: renderOutput(value), values: args };
    if (kase.visible) samples.push(entry);
    else hidden.push(entry);
  }
  if (failures.length) return { failures };

  if (!samples.length || !hidden.length) {
    return { failures: [`${row.title}: needs at least one visible and one hidden case`] };
  }

  const probe = {
    inputFormat: { fields: params.map((p) => ({ name: p.name, type: p.type })) },
    outputFormat: { type: spec.signature.javascript.returnType },
  };

  for (const entry of samples.concat(hidden)) {
    // (a) Authored arguments must equal parsed arguments. Without this, a
    // renderer and parser that are wrong in the SAME way would agree on the
    // output while quietly testing something else entirely.
    let reparsed;
    try { reparsed = G.parseTestCaseInput(probe, entry.input).args; }
    catch (e) { failures.push(`${row.title}: reparse threw -> ${e.message}`); continue; }

    reparsed.forEach((v, i) => {
      if (!G.compareOutputs(renderOutput(v), renderOutput(entry.values[i]), { type: 'auto' })) {
        failures.push(`${row.title}: parsed argument ${i} (${params[i].name}) differs from the authored one`);
      }
    });

    // (b) Semantic representation checks, on the PARSED values.
    reparsed.forEach((v, i) => {
      const typeFn = SEMANTIC[params[i].type];
      if (typeFn) for (const issue of typeFn(v, params[i].name, NO_RECTANGULARITY.has(row.title))) {
        failures.push(`${row.title}: ${issue}`);
      }
    });
    const structFn = STRUCTURE[row.title];
    if (structFn) for (const issue of structFn(reparsed)) failures.push(`${row.title}: ${issue}`);

    // Round-trip: re-running the reference on the PARSED input must reproduce
    // the stored output, proving the fixture means what it says.
    try {
      const round = renderOutput(fn.apply(null, reparsed));
      if (!G.compareOutputs(entry.output, round, probe.outputFormat)) {
        failures.push(`${row.title}: the rendered input does not round-trip`);
      }
    } catch (e) {
      failures.push(`${row.title}: round-trip threw -> ${e.message}`);
    }
  }

  // (c) Three-way agreement: reference, independent oracle, and the authored
  // assertion must all agree. Expected output is never taken on trust.
  const oracle = ORACLE[row.title];
  if (!oracle) failures.push(`${row.title}: no independent oracle, so the reference is unverified`);
  for (const kase of spec.cases) {
    const args = argsFor(spec.signature, kase);
    let refValue, oracleValue;
    try { refValue = fn.apply(null, args); } catch (e) { failures.push(`${row.title}: reference threw -> ${e.message}`); continue; }
    try { oracleValue = oracle.apply(null, args); } catch (e) { failures.push(`${row.title}: oracle threw -> ${e.message}`); continue; }
    if (JSON.stringify(refValue) !== JSON.stringify(oracleValue)) {
      failures.push(`${row.title}: reference and oracle disagree on ${JSON.stringify(args).slice(0, 80)}`);
    }
    if (kase.expect !== undefined && String(refValue) !== String(kase.expect)) {
      failures.push(`${row.title}: authored expectation mismatch, expected ${kase.expect} but got ${refValue}`);
    }
  }

  // (d) Discriminator gate. A wrong solution that agrees with the reference on
  // every stored case is not testing the judging contract at all, so the
  // fixtures must reject it on the visible set (Run) AND the hidden set
  // (Submit). Its wrongness is proven independently in dsa_batch5_wrongproof.js.
  const wrongCode = WRONG[row.title];
  if (!wrongCode) {
    failures.push(`${row.title}: no authored wrong solution, so the discriminator gate cannot run`);
  } else {
    const wrongFn = G.createSolveFunction(wrongCode);
    const agreesOn = (entry) => {
      try {
        return JSON.stringify(fn.apply(null, entry.values)) === JSON.stringify(wrongFn.apply(null, entry.values));
      } catch (e) { return false; }
    };
    for (const [label, set] of [['visible', samples], ['hidden', hidden]]) {
      if (set.length > 0 && set.every(agreesOn)) {
        failures.push(`${row.title}: the wrong solution is not rejected by the ${label} cases`);
      }
    }
  }

  const starterCode = {};
  for (const lang of LANGS) starterCode[lang] = generateStarterCode(spec.signature[lang], lang);

  const doc = {
    title: row.title,
    description: spec.description,
    constraints: spec.constraints,
    inputFormat: params.map((p) => ({ paramName: p.name, type: p.type })),
    outputFormat: { type: spec.signature.javascript.returnType, description: spec.output },
    functionSignature: {},
    starterCode: {},
    sampleTests: samples.map(({ input, output }) => ({ input, output })),
    hiddenTests: hidden.map(({ input, output }) => ({ input, output })),
    referenceSolution: { code: spec.reference, language: 'javascript' },
    isActive: true,
  };
  for (const lang of LANGS) {
    doc.functionSignature[lang] = spec.signature[lang];
    doc.starterCode[lang] = starterCode[lang];
  }

  return { doc, failures, referenceCode: spec.reference, wrongCode, fn, samples, hidden, params };
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const decision = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch5_decision.json'), 'utf8'));
  const rows = decision.filter((r) => r.unambiguous);

  console.log(`mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`selected: ${decision.length}, reconstructable: ${rows.length}\n`);

  const built = [];
  const allFailures = [];

  for (const row of rows) {
    const result = buildOne(row);
    if (result.failures.length) { allFailures.push(...result.failures); continue; }
    built.push({ row, ...result });
  }

  console.log(`gate-passing: ${built.length}/${rows.length}`);
  if (allFailures.length) {
    console.log(`\nGATE FAILURES (${allFailures.length}):`);
    allFailures.forEach((f) => console.log('  ' + f));
  }

  // The runtime harness reads this file: title, slug, visible count, the
  // reference solution and the wrong solution it must be rejected by.
  fs.writeFileSync(
    path.join(__dirname, '_dsa_batch5_built.json'),
    JSON.stringify({
      built: built.map((b) => ({
        title: b.doc.title,
        slug: b.doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        problemId: b.row.problemId,
        samples: b.samples.map(({ input, output }) => ({ input, output })),
        hidden: b.hidden.map(({ input, output }) => ({ input, output })),
        referenceCode: b.referenceCode,
        wrongCode: b.wrongCode,
      })),
      failures: allFailures,
    }, null, 2),
  );

  if (!APPLY) {
    console.log('\nDRY RUN - nothing written to the database.');
    await mongoose.disconnect();
    process.exit(allFailures.length ? 1 : 0);
  }

  if (allFailures.length) {
    console.log('\nREFUSING TO APPLY while gates are failing. No records were modified.');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Confirm every target is still inactive immediately before writing, so a
  // record activated by another process in the meantime is never clobbered.
  // problemId is unique in the schema, so it is a safe lookup key here.
  const keys = built.map((b) => b.row.problemId).filter(Boolean);
  const targets = await CodingProblem.find({ problemId: { $in: keys } }).lean();
  const byKey = new Map(targets.map((t) => [t.problemId, t]));
  let skipped = 0;
  for (const b of built) {
    const key = b.row.problemId;
    const live = key ? byKey.get(key) : null;
    if (!live) { console.log(`  SKIP ${b.row.title}: no record with problemId ${key}`); skipped++; continue; }
    if (live.isActive) { console.log(`  SKIP ${b.row.title}: already active`); skipped++; continue; }
    if (live.title !== b.row.title) {
      console.log(`  SKIP ${b.row.title}: problemId ${key} now holds "${live.title}"`);
      skipped++;
      continue;
    }
    const res = await CodingProblem.updateOne({ _id: live._id, isActive: false }, { $set: b.doc });
    if (res.modifiedCount !== 1) { console.log(`  SKIP ${b.row.title}: update matched ${res.matchedCount}`); skipped++; continue; }
    console.log(`  APPLIED ${b.row.title} (${b.samples.length} visible, ${b.hidden.length} hidden)`);
  }
  console.log(`\n${built.length - skipped} problems activated, ${skipped} skipped.`);

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});