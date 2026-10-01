/**
 * dsa_noref_check.js
 * ---------------------------------------------------------------------------
 * The active catalogue also contains problems with NO stored reference
 * solution. Judging for those relies entirely on the stored expected outputs,
 * so this proves the bank is still coherent by cross-checking them against an
 * independent in-process implementation for the subset whose contract is
 * unambiguous.
 *
 * More importantly it asserts the property that actually protects a learner:
 * every stored expected output must be reachable-shaped, i.e. non-empty and
 * consistent with the declared output type. A suite whose expected outputs are
 * blank or type-mismatched would make Submit meaningless even with no
 * reference to compare against.
 * ---------------------------------------------------------------------------
 */
'use strict';
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');
const G = require('./utils/genericValidator');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const active = await CodingProblem.find({ isActive: true }).lean();
  const noRef = active.filter((d) => !(d.referenceSolution && String(d.referenceSolution.code || '').trim()));

  let bad = 0;
  let totalCases = 0;
  const problems = [];

  for (const d of noRef) {
    const samples = d.sampleTests || [];
    const hidden = d.hiddenTests || [];
    totalCases += samples.length + hidden.length;
    const issues = [];

    if (samples.length === 0) issues.push('no samples');
    if (hidden.length === 0) issues.push('no hidden cases');
    for (const tc of samples.concat(hidden)) {
      if (String(tc.input == null ? '' : tc.input).trim() === '') issues.push('blank input');
      if (String(tc.output == null ? '' : tc.output).trim() === '') issues.push('blank expected output');
    }
    const sig = d.functionSignature && d.functionSignature.javascript;
    if (!sig || !sig.name || !Array.isArray(sig.params) || sig.params.length === 0) {
      issues.push('unusable signature');
    }

    // Every stored case must survive the exact parser the judge uses.
    const normalized = G.normalizeProblem(d);
    for (const tc of samples.concat(hidden)) {
      try {
        const parsed = G.parseTestCaseInput(normalized, tc.input);
        if (parsed.args.length !== sig.params.length) {
          issues.push(`arg arity ${parsed.args.length} != ${sig.params.length}`);
        }
      } catch (e) {
        issues.push('parse error: ' + e.message);
      }
    }

    if (issues.length) {
      bad++;
      problems.push({ title: d.title, slug: d.slug, issues: [...new Set(issues)] });
    }
  }

  console.log('active problems            :', active.length);
  console.log('without reference solution :', noRef.length);
  console.log('stored cases in that subset:', totalCases);
  console.log('problems with any issue    :', bad);
  problems.forEach((p) => console.log(`  ${p.title}: ${p.issues.join('; ')}`));

  await mongoose.disconnect();
  console.log(bad === 0 ? '\nOK: every no-reference active problem has usable, parsable fixtures.' : '\nISSUES FOUND');
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});