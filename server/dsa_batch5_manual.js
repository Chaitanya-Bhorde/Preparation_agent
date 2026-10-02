'use strict';

/**
 * dsa_batch5_manual.js
 * ---------------------------------------------------------------------------
 * READ-ONLY. Writes BATCH_REQUIRES_MANUAL_CONTENT.md from the batch-5 decision
 * record, so the manual-review list cannot drift from the reason each problem
 * was actually held back. Every entry states the sources that were checked, the
 * exact ambiguity, why activating it would be unsafe, and what is needed to
 * unblock it.
 * ---------------------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');

const decision = require('./_dsa_batch5_decision.json');
const held = decision.filter((r) => !r.unambiguous);

const WHY_UNSAFE = {
  'Friend Circles':
    '"Friend circles" names at least two standard contracts that return different values: '
    + 'the NUMBER of connected groups, or the SIZE of the largest group. The stored tags '
    + '(union-find, depth-first-search) fit the first, but the title alone does not decide '
    + 'it, and the catalogue already publishes the count-the-groups contract as the ACTIVE '
    + 'problem "Number of Connected Components", so activating this record on that reading '
    + 'would duplicate an existing problem under a second name.',
  'Possible Bipartition':
    'The two readings return different booleans on ordinary inputs, and the 2-colourable '
    + 'reading is already published in this same catalogue as "Is Graph Bipartite". Choosing '
    + 'silently would either duplicate an active problem under a second name or ship a '
    + 'record whose description does not match what the title leads a learner to expect.',
  'Search in Rotated Sorted Array II':
    'The problem is only distinguishable from its non-"II" sibling by allowing duplicates, '
    + 'and duplicates are exactly what makes the correct index non-unique. Exact-match '
    + 'judging would reject correct solutions; removing duplicates would make the record a '
    + 'duplicate of "Search in Rotated Sorted Array", which this batch already activated.',
  'Find K Pairs with Smallest Sums':
    'Several distinct pairs routinely share the same sum, so more than one pair list is '
    + 'correct. Storing a single expected output would reject correct answers. Any tie-break '
    + 'strong enough to make the answer unique would have to be invented, and nothing in the '
    + 'repository states one.',
  'Rearrange String k Distance Apart':
    'The canonical contract explicitly accepts any valid rearrangement. A single stored '
    + 'expected string would mark correct solutions wrong. Making the answer unique requires '
    + 'either inventing a canonical form or switching this problem to a validator-based '
    + 'comparison, which is a change to the judging contract rather than to the content.',
  'Smallest Range From Lists':
    'Several ranges can share the minimum width, and the canonical problem returns any of '
    + 'them. Without a stated tie-break the expected [start, end] pair is not determined by '
    + 'the input, so expected outputs could not be generated honestly.',
};

const NEEDED = {
  'Friend Circles':
    'A decision on which value the record must return: the number of connected groups, or '
    + 'the size of the largest group. If it is the count, this record should be retired or '
    + 'merged into the already-active "Number of Connected Components" instead of activated.',
  'Possible Bipartition':
    'A decision from the catalogue owner on which contract this record means: the plain '
    + '2-colourability check, or the equal-size two-group split. If the former, this record '
    + 'should probably be retired or merged into "Is Graph Bipartite" rather than activated.',
  'Search in Rotated Sorted Array II':
    'Either a stated tie-break for duplicate targets (for example "return the leftmost '
    + 'index"), or confirmation that duplicate-free inputs are acceptable, or agreement to '
    + 'retire this record in favour of the distinct-value version already activated.',
  'Find K Pairs with Smallest Sums':
    'A stated ordering rule for equal sums (for example "sort by sum, then by first element, '
    + 'then by second element"), or a decision to judge this problem with a validator that '
    + 'accepts any set of k pairs attaining the k smallest sums.',
  'Rearrange String k Distance Apart':
    'A canonical form (for example "the lexicographically smallest valid rearrangement"), or '
    + 'a decision to judge with a validator that accepts any arrangement satisfying the '
    + 'distance constraint.',
  'Smallest Range From Lists':
    'A tie-break for equal-width ranges (for example "among minimum-width ranges return the '
    + 'one with the smallest start"), or a validator-based judging decision.',
};

const SOURCES = 'Current CodingProblem record (title, topic, difficulty, tags, and the stock '
  + '"(Spec not yet reviewed)" description); the legacy Problem collection and the DSA seeders '
  + '(seedCodingProblemsExpanded and related) which record only title/topic/tags; '
  + 'scripts/curatedProblems; the SOLVERS table; authored batches 1-4; repository snapshots '
  + 'and state-probe exports; and the existing active catalogue, which was searched for an '
  + 'already-published contract covering the same task.';

const lines = [];
lines.push('# Batch 5 - Problems Requiring Manual Content');
lines.push('');
lines.push('These problems were selected for batch 5 and confirmed inactive, but were **not**');
lines.push('activated. Each one has at least one standard, defensible reading that cannot be');
lines.push('reconciled with the stored record, and activating it would have meant either');
lines.push('guessing the contract or shipping expected outputs that are not determined by the');
lines.push('input.');
lines.push('');
lines.push(`Selected for batch 5: ${decision.length}`);
lines.push(`Activated: ${decision.length - held.length}`);
lines.push(`Held for manual review: ${held.length}`);
lines.push('');
lines.push('| # | problemId | Title | Decision |');
lines.push('|---|---|---|---|');
decision.forEach((r, i) => {
  lines.push(`| ${i + 1} | ${r.problemId} | ${r.title} | ${r.unambiguous ? 'activated' : 'MANUAL REVIEW'} |`);
});
lines.push('');
lines.push('---');
lines.push('');

held.forEach((r, i) => {
  lines.push(`## ${i + 1}. ${r.title}`);
  lines.push('');
  lines.push(`- **problemId:** ${r.problemId}`);
  lines.push(`- **Topic / difficulty / tags:** ${r.topic} / ${r.difficulty} / ${(r.tags || []).join(', ')}`);
  lines.push(`- **Sources checked:** ${SOURCES}`);
  lines.push(`- **Exact ambiguity:** ${r.note}`);
  if (r.variants && r.variants.length) {
    lines.push(`- **Competing variants:** ${r.variants.map((v) => `\`${v}\``).join('  vs  ')}`);
  }
  lines.push(`- **Why activation is unsafe:** ${WHY_UNSAFE[r.title] || 'The contract is not determined by the stored record.'}`);
  lines.push(`- **What is needed:** ${NEEDED[r.title] || 'A single stated contract from the catalogue owner.'}`);
  lines.push('');
});

lines.push('---');
lines.push('');
lines.push('No other problem in the selected 30 was held back. The remaining');
lines.push(`${decision.length - held.length} were reconstructed from repository evidence, verified`);
lines.push('against independent oracles, and activated.');
lines.push('');

const out = path.join(__dirname, '..', 'BATCH_REQUIRES_MANUAL_CONTENT.md');
fs.writeFileSync(out, lines.join('\n'));
console.log(`wrote ${out}`);
console.log(`manual review: ${held.length} of ${decision.length}`);
held.forEach((r) => console.log(`  ${r.problemId}  ${r.title}`));