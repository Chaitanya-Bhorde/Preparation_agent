'use strict';

/**
 * dsa_batch5_wrongproof.js
 * ---------------------------------------------------------------------------
 * Independently PROVES each authored wrong solution really is wrong, rather than
 * trusting the word "WRONG" in a comment.
 *
 * For every batch-5 problem it runs the reference and the wrong solution over
 * randomised inputs from the same generators dsa_batch5_crosscheck.js uses, and
 * reports the fraction on which they disagree. A wrong solution that agreed
 * everywhere would be indistinguishable from the reference, so the discriminator
 * gate would be theatre; this is the evidence that it is not.
 *
 * READ-ONLY. Requires dsa_batch5_crosscheck.js to expose its generators, which
 * it does via module.exports when required rather than run.
 *
 *   node dsa_batch5_wrongproof.js
 * ---------------------------------------------------------------------------
 */
const path = require('path');
const fs = require('fs');
const { ORACLE } = require('./scripts/dsaBatch5Oracle');
const { WRONG } = require('./scripts/dsaBatch5Wrong');
const G = require('./utils/genericValidator');
const CONTENT_MODULES = require('./scripts/dsaBatch5Content');
const CROSSCHECK = require('./dsa_batch5_crosscheck');

const ROUNDS = Number(process.env.ROUNDS || 500);

function main() {
  const problems = {};
  for (const mod of Object.keys(CONTENT_MODULES)) {
    for (const [title, spec] of Object.entries(CONTENT_MODULES[mod])) problems[title] = spec;
  }

  const rows = [];
  let failures = 0;

  for (const title of Object.keys(problems).sort()) {
    const spec = problems[title];
    const gen = CROSSCHECK.GEN[title];
    const code = WRONG[title];
    if (!gen) { console.log(`SKIP  ${title} (no generator)`); failures++; continue; }
    if (!code) { console.log(`FAIL  ${title} (no authored wrong solution)`); failures++; continue; }

    let ref;
    let wrong;
    try { ref = G.createSolveFunction(spec.reference); }
    catch (e) { console.log(`FAIL  ${title}: reference does not compile (${e.message})`); failures++; continue; }
    try { wrong = G.createSolveFunction(code); }
    catch (e) { console.log(`FAIL  ${title}: wrong solution does not compile (${e.message})`); failures++; continue; }

    const params = spec.signature.javascript.params;
    let disagree = 0;
    let counted = 0;
    let firstCounterexample = null;

    for (let r = 0; r < ROUNDS; r++) {
      const args = gen();
      let a;
      let b;
      try { a = JSON.stringify(ref.apply(null, args)); } catch (_) { continue; }
      try { b = JSON.stringify(wrong.apply(null, args)); } catch (_) { b = '<threw>'; }
      counted++;
      if (a !== b) {
        disagree++;
        if (!firstCounterexample) firstCounterexample = JSON.stringify(args).slice(0, 120);
      }
    }

    // Also confirm the wrong solution is not accidentally CORRECT on the
    // authored fixtures, which would mean the fixtures are too weak.
    let fixtureRejects = 0;
    let fixtureTotal = 0;
    for (const kase of spec.cases) {
      const args = params.map((p) => kase[p.name]);
      let a;
      let b;
      try { a = JSON.stringify(ref.apply(null, args)); } catch (_) { continue; }
      try { b = JSON.stringify(wrong.apply(null, args)); } catch (_) { b = '<threw>'; }
      fixtureTotal++;
      if (a !== b) fixtureRejects++;
    }

    // The wrong solution must be genuinely different AND actually caught.
    const genuinelyWrong = disagree > 0;
    const caughtByFixtures = fixtureRejects > 0;
    const ok = genuinelyWrong && caughtByFixtures;
    if (!ok) failures++;

    rows.push({
      title,
      rounds: counted,
      disagree,
      disagreePct: counted ? Math.round((disagree / counted) * 1000) / 10 : 0,
      fixtureTotal,
      fixtureRejects,
      genuinelyWrong,
      caughtByFixtures,
      firstCounterexample,
    });

    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${title.padEnd(36)} `
      + `wrong on ${disagree}/${counted} random inputs (${rows[rows.length - 1].disagreePct}%), `
      + `rejects ${fixtureRejects}/${fixtureTotal} fixtures`
    );
  }

  // Written to disk as well as stdout: this run prints one line per problem and
  // the terminal buffer can truncate that, which would hide failures.
  fs.writeFileSync(path.join(__dirname, '_dsa_batch5_wrongproof.json'),
    JSON.stringify({ rounds: ROUNDS, failures, rows }, null, 2));

  console.log(`\n${rows.length - failures}/${rows.length} wrong solutions proven wrong and caught by fixtures`);
  process.exit(failures === 0 ? 0 : 1);
}

main();