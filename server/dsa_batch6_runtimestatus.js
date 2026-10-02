'use strict';

/**
 * dsa_batch6_runtimestatus.js  (READ-ONLY, safe to run any number of times)
 * ---------------------------------------------------------------------------
 * Instant snapshot of batch-6 live-HTTP runtime progress, straight from Mongo.
 *
 * Why this exists: dsa_batch6_runtime_all.js captures each slice with
 * execFileSync, so a slice's stdout only lands in _rt_b6.txt when that
 * slice EXITS. While a slice is mid-flight the log looks frozen even though the
 * child process is working. Polling the log therefore answers the wrong
 * question. Every runtime call that matters is persisted (POST /api/coding/submit
 * writes a `submissions` row), so the database is the real progress signal:
 *
 *   - which dsa_b5_* test users exist and when each slice registered
 *   - which batch-6 problems each of them has already submitted against
 *   - the verdicts, i.e. Accepted for the reference solution and non-Accepted
 *     for the deliberately wrong one
 *   - the live apiRateLimiter budget implied by those timestamps
 *
 * It performs NO writes, NO deletes and NO HTTP calls, so it cannot disturb the
 * running slice or consume rate-limit budget.
 *
 *   node dsa_batch6_runtimestatus.js
 * ---------------------------------------------------------------------------
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');

// Production safeguard from server.js. Read-only here: reported, never changed.
const LIMIT_MAX = 20;
const WINDOW_MS = 15 * 60 * 1000;

const built = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_dsa_batch6_built.json'), 'utf8')
).built;

const pad = (s, n) => String(s).padEnd(n);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const slugs = new Set(built.map((b) => b.slug));
  const batchProblems = await CodingProblem.find({ slug: { $in: [...slugs] } })
    .select('slug title')
    .lean();
  const idToSlug = new Map(batchProblems.map((p) => [String(p._id), p.slug]));
  const slugToIndex = new Map(built.map((b, i) => [b.slug, i]));

  // Every throwaway account the runtime harness has created.
  const users = await db.collection('users')
    .find({ email: /^dsa_b6_/ })
    .project({ email: 1, createdAt: 1 })
    .sort({ createdAt: 1 })
    .toArray();

  console.log(`now: ${new Date().toISOString()}`);
  console.log(`batch-6 problems in catalogue: ${idToSlug.size}/${built.length}`);
  console.log(`runtime test users seen:       ${users.length}\n`);

  const doneIdx = new Set();
  let anyUser = false;

  for (const u of users) {
    // Field names come from models/Submission.js: the FK is `problem` and the
    // outcome is `status` with lowercase enum values ('accepted', ...).
    const subs = await db.collection('submissions')
      .find({ user: u._id })
      .project({ problem: 1, status: 1, passedTestCases: 1, totalTestCases: 1, createdAt: 1 })
      .sort({ createdAt: 1 })
      .toArray();

    const batchSubs = subs.filter((s) => idToSlug.has(String(s.problem)));
    if (!batchSubs.length) continue;
    anyUser = true;

    const bySlug = new Map();
    for (const s of batchSubs) {
      const slug = idToSlug.get(String(s.problem));
      if (!bySlug.has(slug)) bySlug.set(slug, []);
      bySlug.get(slug).push(s);
    }

    const solved = [...bySlug.entries()].filter(([, rows]) =>
      rows.some((r) => r.status === 'accepted'));
    solved.forEach(([slug]) => doneIdx.add(slugToIndex.get(slug)));

    console.log(`user ${pad(u.email, 34)} registered ${u.createdAt.toISOString()}`);
    console.log(`  batch-6 problems submitted: ${bySlug.size}, solved (Accepted): ${solved.length}`);
    for (const [slug, rows] of [...bySlug.entries()].sort()) {
      const idx = slugToIndex.get(slug);
      const v = rows.map((r) => `${r.status}(${r.passedTestCases}/${r.totalTestCases})`).join(' ');
      console.log(`    [${pad(idx, 3)}] ${pad(slug, 36)} ${v}`);
    }
    console.log();
  }

  if (!anyUser) console.log('(no batch-6 submissions persisted yet)\n');

  // Rate-limit budget implied by the persisted write timestamps.
  const since = new Date(Date.now() - WINDOW_MS);
  const recent = await db.collection('submissions')
    .countDocuments({ createdAt: { $gte: since } });
  console.log(`apiRateLimiter (production, unmodified): max ${LIMIT_MAX} per 15 min`);
  console.log(`  submissions persisted in the last 15 min: ${recent}`);
  console.log(`  each such submit consumed one of the ${LIMIT_MAX} run/submit slots`);

  console.log('\nVerified-by-live-HTTP batch-6 problems so far (has an Accepted submit):');
  const done = [...doneIdx].sort((a, b) => a - b);
  if (!done.length) console.log('  (none)');
  done.forEach((i) => {
    const iNext = i + 1 < built.length ? (i === done[done.length - 1] ? '  <-- last' : '') : '';
    console.log(`  ${pad(i, 3)} ${built[i].title}${iNext}`);
  });
  const firstUndone = built.findIndex((b, i) => !doneIdx.has(i));
  console.log(`\nfirst batch-6 index with NO Accepted submit yet: ${
    firstUndone === -1 ? 'none - all 24 verified' : firstUndone + '  (' + built[firstUndone].title + ')'}`);

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('PROBE FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
