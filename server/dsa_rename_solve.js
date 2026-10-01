/**
 * dsa_rename_solve.js
 * ---------------------------------------------------------------------------
 * The last five active problems still declare their function as `solve` even
 * though each has a real typed signature, real fixtures and a working
 * reference. `solve` is the generic fallback name the seeder used for problems
 * with no authored signature, so leaving it on a fully-specified problem reads
 * as unfinished next to its neighbours (`maxDepth`, `isPalindrome`, ...).
 *
 * Renaming touches the judging contract: the driver calls the SIGNATURE name,
 * so the stored reference must expose the same one. Both are rewritten together
 * and only the declaration is renamed - recursive self-calls included, so the
 * body still works.
 *
 * Nothing else changes: fixtures, expected outputs, difficulty and topic are
 * untouched, and no submission is deleted (the only historical submissions on
 * these problems are stubs that return a constant).
 *
 * Dry-run by default; `--apply` commits.
 * ---------------------------------------------------------------------------
 */
'use strict';
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');
const G = require('./utils/genericValidator');

const APPLY = process.argv.includes('--apply');

const RENAMES = {
  'word-ladder': { js: 'ladderLength', py: 'ladder_length', java: 'ladderLength', cpp: 'ladderLength', c: 'ladderLength', csharp: 'ladderLength' },
  'merge-two-sorted-lists': { js: 'mergeTwoLists', py: 'merge_two_lists', java: 'mergeTwoLists', cpp: 'mergeTwoLists', c: 'mergeTwoLists', csharp: 'mergeTwoLists' },
  'reverse-linked-list': { js: 'reverseList', py: 'reverse_list', java: 'reverseList', cpp: 'reverseList', c: 'reverseList', csharp: 'reverseList' },
  'linked-list-cycle': { js: 'hasCycle', py: 'has_cycle', java: 'hasCycle', cpp: 'hasCycle', c: 'hasCycle', csharp: 'hasCycle' },
  'palindrome-partitioning': { js: 'partition', py: 'partition', java: 'partition', cpp: 'partition', c: 'partition', csharp: 'partition' },
};

/**
 * Produce the reference that declares `nextName`.
 *
 * Idempotent: a reference already renamed (by an earlier partial run) is
 * returned unchanged, so re-running repairs the signature side instead of
 * failing. Returns null when neither form applies or the result would not parse.
 */
function renameReference(code, nextName) {
  const src = String(code);
  if (new RegExp(`function\\s+solve\\s*\\(`).test(src)) {
    let out = src.replace(/\bsolve\b/g, nextName);
    out = out.replace(new RegExp(`const\\s+${nextName}\\s*=\\s*${nextName}\\s*;\\s*`, 'g'), '');
    try {
      // eslint-disable-next-line no-new-func
      new Function(out);
    } catch (_) {
      return null;
    }
    return out;
  }
  if (new RegExp(`function\\s+${nextName}\\s*\\(`).test(src)) {
    try {
      // eslint-disable-next-line no-new-func
      new Function(src);
    } catch (_) {
      return null;
    }
    return src;
  }
  return null;
}
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const docs = await CodingProblem.find({ slug: { $in: Object.keys(RENAMES) }, isActive: true });

  console.log(`mode: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);

  const plans = [];
  for (const doc of docs) {
    const map = RENAMES[doc.slug];
    const sig = doc.functionSignature && doc.functionSignature.javascript;
    const alreadyRenamed = sig && sig.name === map.js;
    if (!sig || (sig.name !== 'solve' && !alreadyRenamed)) {
      console.log(`  SKIP ${doc.slug}: signature is "${sig && sig.name}", expected solve or ${map.js}`);
      continue;
    }
    const ref = doc.referenceSolution && doc.referenceSolution.code;
    const rewritten = renameReference(ref, map.js);
    if (!rewritten) {
      console.log(`  SKIP ${doc.slug}: reference does not declare function solve(`);
      continue;
    }
    let exposes = false;
    try {
      const fn = G.createSolveFunction(rewritten);
      exposes = typeof fn === 'function' && fn.name === map.js;
    } catch (_) {
      exposes = false;
    }
    if (!exposes) {
      console.log(`  SKIP ${doc.slug}: rewritten reference does not expose ${map.js}`);
      continue;
    }

    plans.push({ doc, map, rewritten });
    console.log(`  PLAN ${doc.slug}: solve -> ${map.js} (reference rewrites cleanly)`);
  }

  if (!APPLY) {
    console.log(`\nDRY RUN - ${plans.length} renames prepared. Re-run with --apply.`);
    await mongoose.disconnect();
    return;
  }

  for (const { doc, map, rewritten } of plans) {
    await CodingProblem.updateOne(
      { _id: doc._id },
      {
        $set: {
          'referenceSolution.code': rewritten,
          'functionSignature.javascript.name': map.js,
          'functionSignature.python.name': map.py,
          'functionSignature.java.name': map.java,
          'functionSignature.cpp.name': map.cpp,
          'functionSignature.c.name': map.c,
          'functionSignature.csharp.name': map.csharp,
        },
      }
    );
    console.log(`  APPLIED ${doc.slug}: solve -> ${map.js}`);
  }
  console.log(`\n${plans.length} problems renamed.`);

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});