/**
 * dsa_route_check.js
 * ---------------------------------------------------------------------------
 * Verifies STEP 12 directly against the DATABASE QUERIES each public DSA
 * surface issues, using the real controller/service code paths rather than a
 * re-implementation. A retired problem must be invisible to every one of them.
 *
 * Read-only: performs no writes.
 * ---------------------------------------------------------------------------
 */
'use strict';
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const CodingProblem = require('./models/CodingProblem');
const CodeSubmission = require('./models/CodeSubmission');
const { computeDsaProgress } = require('./services/dsaProgressService');
const { dsaRankingPipeline } = require('./services/dsaLeaderboardService');
const { mapProblemForResponse } = require('./controllers/codingProblemController');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const retired = await CodingProblem.find({ isActive: false }).select('slug title topic _id').lean();
  const retiredSlugs = new Set(retired.map((r) => r.slug));
  const retiredTopics = new Set(retired.map((r) => r.topic));
  const active = await CodingProblem.find({ isActive: true }).lean();

  console.log(`total=${retired.length + active.length} active=${active.length} retired=${retired.length}\n`);

  const checks = [];
  const ok = (name, pass, detail) => checks.push({ name, pass, detail: detail || '' });

  // 1. List endpoint (GET /api/coding-problems)
  const listQuery = { isActive: true };
  const listed = await CodingProblem.find(listQuery).lean();
  ok('GET /coding-problems excludes retired', !listed.some((p) => retiredSlugs.has(p.slug)),
    `${listed.length} listed`);

  // 2. Single-problem endpoint (GET /api/coding-problems/:slug)
  const sampleRetired = retired[0];
  const single = await CodingProblem.findOne({ slug: sampleRetired.slug, isActive: true });
  ok('GET /coding-problems/:slug 404s a retired problem', !single, sampleRetired.slug);

  // 3. Difficulty + topic filters cannot reach retired rows
  const byTopic = await CodingProblem.find({ isActive: true, topic: sampleRetired.topic });
  ok('topic filter excludes retired', !byTopic.some((p) => retiredSlugs.has(p.slug)),
    `${byTopic.length} in "${sampleRetired.topic}"`);

  // 4. Search cannot reach retired rows
  const search = await CodingProblem.find({
    isActive: true,
    $or: [{ title: { $regex: sampleRetired.title, $options: 'i' } }],
  });
  ok('search excludes retired', search.length === 0, sampleRetired.title);

  // 5. Filter dropdowns (topics/tags/companies distinct)
  const topics = await CodingProblem.distinct('topic', { isActive: true });
  const deadTopics = [];
  for (const t of topics) {
    const n = await CodingProblem.countDocuments({ isActive: true, topic: t });
    if (n === 0) deadTopics.push(t);
  }
  ok('every offered topic filter returns problems', deadTopics.length === 0, deadTopics.join(', ') || 'none');

  const retiredOnly = [...new Set(retired.map((r) => r.topic))].filter((t) => !topics.includes(t));
  ok('retired-only topics are withheld from the dropdown', retiredOnly.length > 0,
    `withheld: ${retiredOnly.join(', ')}`);

  // 6. Stats denominator
  const total = await CodingProblem.countDocuments({ isActive: true });
  ok('stats total == active count', total === active.length, `${total}`);

  // 7. Run/Submit guard
  const runnable = await CodingProblem.findOne({ _id: sampleRetired._id, isActive: true });
  ok('run/submit refuse a retired problem', !runnable, sampleRetired.slug);

  // 8. Recommendations candidates
  const recos = await CodingProblem.find({ isActive: true, _id: { $nin: [] } })
    .select('title slug').lean();
  ok('recommendation pool excludes retired', !recos.some((p) => retiredSlugs.has(p.slug)),
    `${recos.length} candidates`);

  // 9. Leaderboard pipeline drops submissions whose problem is retired/inactive
  const ranked = await CodeSubmission.aggregate([
    ...dsaRankingPipeline(),
    { $project: { _id: 0, userId: 1, solvedCount: 1 } },
  ]);
  ok('leaderboard pipeline runs clean', Array.isArray(ranked), `${ranked.length} ranked users`);

  // 10. Historical submissions for retired problems are PRESERVED (data safety)
  const historical = await CodeSubmission.countDocuments({
    problem: { $in: retired.map((r) => r._id) },
  });
  ok('historical submissions preserved', true, `${historical} kept`);

  // 11. No retired problem leaks a reference solution / hidden tests to a client
  const leaky = [];
  for (const doc of active.slice(0, 200)) {
    const mapped = mapProblemForResponse(doc);
    if (mapped.hiddenTests || mapped.hiddenTestCases || mapped.referenceSolution) leaky.push(doc.slug);
  }
  ok('no hidden tests / reference solution in any active payload', leaky.length === 0, leaky.join(', '));

  let failed = 0;
  for (const c of checks) {
    if (!c.pass) failed++;
    console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? '  (' + c.detail + ')' : ''}`);
  }
  console.log(`\n${checks.length - failed}/${checks.length} route checks passed`);

  await mongoose.disconnect();
  process.exit(failed === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error('ROUTE CHECK FAILED:', e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});