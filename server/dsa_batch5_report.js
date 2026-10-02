'use strict';

/**
 * dsa_batch5_report.js
 * ---------------------------------------------------------------------------
 * Prints the batch-5 discriminator evidence straight out of
 * _dsa_batch5_wrongproof.json. Kept separate from the runner because the
 * terminal buffer truncates long one-line-per-problem output, which would
 * silently hide a failure.
 * ---------------------------------------------------------------------------
 */
const report = require('./_dsa_batch5_wrongproof.json');

console.log(`rounds: ${report.rounds}   problems: ${report.rows.length}   failures: ${report.failures}\n`);
for (const r of report.rows) {
  const ok = r.genuinelyWrong && r.caughtByFixtures;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.title.padEnd(36)} `
    + `wrong on ${r.disagree}/${report.rounds} (${r.disagreePct}%)  `
    + `fixtures reject ${r.fixtureRejects}/${r.fixtureTotal}`);
}
console.log(`\n${report.rows.length - report.failures}/${report.rows.length} wrong solutions proven wrong and caught by fixtures`);
process.exit(report.failures === 0 ? 0 : 1);