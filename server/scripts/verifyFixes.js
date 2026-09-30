/**
 * verifyFixes.js — READ-ONLY end-to-end verification of every fix against the
 * live database. Performs no writes.
 *
 *   node scripts/verifyFixes.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { computeDsaProgress } = require('../services/dsaProgressService');
const { getDsaLeaderboard, dsaRankingPipeline } = require('../services/dsaLeaderboardService');
const { generateRecommendations } = require('../services/recommendationService');
const codingProblemController = require('../controllers/codingProblemController');

const pad = (v, n) => String(v == null ? '' : v).padEnd(n);

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 12000 });
  const db = mongoose.connection.db;

  // ---- 1. UNIQUE SOLVED COUNT -------------------------------------------
  console.log('=== 1. UNIQUE SOLVED COUNT (unique problems, not submissions) ===');
  const users = await db.collection('users').find({ 'stats.totalSubmissions': { $gt: 0 } })
    .project({ name: 1, email: 1, 'stats.totalSolved': 1 }).limit(10).toArray();
  for (const u of users) {
    const p = await computeDsaProgress(u._id);
    const claimed = (u.stats && u.stats.totalSolved) || 0;
    console.log(`  ${pad(u.name, 13)} acceptedSubmissions=${pad(p.acceptedSubmissions, 4)} UNIQUE_SOLVED=${pad(p.totalSolved, 3)} (E/M/H ${p.easySolved}/${p.mediumSolved}/${p.hardSolved})  storedCounterWas=${claimed}${claimed === p.totalSolved ? ' OK' : ' <- would be repaired'}`);
  }

  // ---- 2. LEADERBOARD ---------------------------------------------------
  console.log('\n=== 2. DSA LEADERBOARD (real accepted submissions, real users) ===');
  const { leaderboard, pagination } = await getDsaLeaderboard({ limit: 10, page: 1 });
  console.log(`  total ranked users = ${pagination.total}`);
  leaderboard.forEach((r, i) => {
    console.log(`  #${i + 1} ${pad(r.username, 13)} solved=${pad(r.solvedCount, 3)} acceptedSubmissions=${pad(r.acceptedOnSolved, 4)} E/M/H=${r.easyCount}/${r.mediumCount}/${r.hardCount}`);
  });

  // ---- 3. STATS ENDPOINT ------------------------------------------------
  console.log('\n=== 3. /api/coding-problems/stats (solved / attempted / unsolved) ===');
  for (const u of users.slice(0, 5)) {
    const res = { statusCode: 200, payload: null };
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (p) => { res.payload = p; return res; };
    await codingProblemController.getCodingProblemStats({ user: { id: u._id.toString() } }, res);
    const d = res.payload.data;
    const bad = d.attempted < 0 || d.unsolved < 0;
    console.log(`  ${pad(u.name, 13)} total=${d.total} solved=${d.solved} attempted=${d.attempted} unsolved=${d.unsolved} ${bad ? 'NEGATIVE!' : 'OK'}`);
  }

  // ---- 4. TEST-ACCOUNT ISOLATION ---------------------------------------
  console.log('\n=== 4. TEST-ACCOUNT ISOLATION ON THE LEADERBOARD ===');
  const accepted = await db.collection('codesubmissions').aggregate([
    { $match: { verdict: 'Accepted' } },
    { $group: { _id: '$user', accepted: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
    { $unwind: '$u' },
    { $project: { name: '$u.name', email: '$u.email', flagged: { $ifNull: ['$u.isTestAccount', false] }, accepted: 1, id: '$_id' } },
    { $sort: { accepted: -1 } },
  ]).toArray();
  accepted.forEach((r) => console.log(
    `  ${r.flagged ? 'FLAGGED (hidden) ' : 'VISIBLE on board  '}${pad(r.name, 13)}${pad(r.email, 46)}accepted=${r.accepted}`
  ));
  const board = await db.collection('codesubmissions').aggregate(dsaRankingPipeline()).toArray();
  const boardIds = board.map((r) => String(r.userId));
  const leaked = accepted.filter((r) => r.flagged && boardIds.includes(String(r.id)));
  console.log(`  flagged users still on the board: ${leaked.length} (must be 0)`);
  const gmailFlagged = await db.collection('users').countDocuments({
    isTestAccount: true, email: { $in: ['aman@gmail.com', 'manan@gmail.com'] },
  });
  console.log(`  real gmail users wrongly flagged: ${gmailFlagged} (must be 0)`);


  // ---- 5. RECOMMENDATION ENGINE -----------------------------------------
  console.log('\n=== 5. RECOMMENDATION ENGINE (real performance data) ===');
  const busiest = accepted.slice().sort((a, b) => b.accepted - a.accepted)[0];
  const activeUser = await db.collection('users').findOne({ _id: busiest.id });
  const t0 = Date.now();
  const rec = await generateRecommendations(activeUser._id);
  console.log(`  user "${activeUser.name}" (${activeUser.email}) in ${Date.now() - t0}ms`);
  console.log(`  hasEnoughData=${rec.hasEnoughData} message=${JSON.stringify(rec.message)}`);
  console.log(`  features: ${JSON.stringify(rec.features)}`);
  console.log(`  model: ${rec.model.name} v${rec.model.version}`);
  console.log(`  weights: ${JSON.stringify(rec.model.weights)}`);
  console.log(`  weakTopics (${rec.weakTopics.length}):`);
  rec.weakTopics.slice(0, 6).forEach((w) => console.log(
    `    ${pad(w.topic, 24)} acc=${w.accuracy}% attempts=${w.attempts} solved=${w.solved} lastAttempt=${w.daysSinceLastAttempt}d ago`
  ));
  console.log(`  recommendations (${rec.recommendations.length}):`);
  rec.recommendations.slice(0, 5).forEach((r) => console.log(`    ${pad(r.title.slice(0, 30), 32)} score=${r.score} ${r.reason}`));
  console.log(`  every recommendation carries a reason:   ${rec.recommendations.every((r) => typeof r.reason === 'string' && r.reason.length > 0)}`);
  console.log(`  every recommendation carries a breakdown: ${rec.recommendations.every((r) => r.scoreBreakdown && typeof r.scoreBreakdown === 'object')}`);

  const emptyUser = await db.collection('users').findOne({ _id: { $nin: accepted.map((r) => r.id) } });
  if (emptyUser) {
    const emptyRec = await generateRecommendations(emptyUser._id);
    console.log(`  empty user "${emptyUser.name}": hasEnoughData=${emptyRec.hasEnoughData} recommendations=${emptyRec.recommendations.length} message=${JSON.stringify(emptyRec.message)}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => { console.error('VERIFY ERROR:', e.stack); process.exit(1); });

