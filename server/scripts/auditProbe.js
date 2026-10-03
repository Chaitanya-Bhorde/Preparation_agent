/**
 * READ-ONLY audit probe. Connects to the configured MongoDB and prints
 * aggregate facts. Performs NO writes. Used to reproduce the reported issues
 * (unique solved count, leaderboard pollution, hidden-test exposure) against
 * real data before any fix is written.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function main() {
  if (!URI) { console.log('NO MONGO_URI'); return; }
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 12000 });
  const db = mongoose.connection.db;
  const colls = (await db.listCollections().toArray()).map(c => c.name).sort();
  console.log('COLLECTIONS:', colls.join(', '));

  const counts = {};
  for (const c of ['users', 'codingproblems', 'codesubmissions', 'submissions', 'sqlproblems', 'sqlsubmissions', 'userstats', 'leaderboards', 'aptitudesubmissions']) {
    counts[c] = await db.collection(c).countDocuments({});
  }
  console.log('COUNTS:', JSON.stringify(counts, null, 2));

  const users = await db.collection('users').find({}, { projection: { name: 1, email: 1, role: 1, 'stats.totalSolved': 1, 'stats.totalSubmissions': 1 } }).toArray();
  console.log('\n--- USERS (' + users.length + ') ---');
  users.forEach(u => console.log(
    `${u._id} | name="${u.name}" | email="${u.email}" | role=${u.role} | solved=${u.stats ? u.stats.totalSolved : '-'} | subs=${u.stats ? u.stats.totalSubmissions : '-'}`
  ));

  console.log('\n--- CODESUBMISSIONS accepted: raw count vs UNIQUE problem count per user ---');
  const agg = await db.collection('codesubmissions').aggregate([
    { $match: { verdict: 'Accepted' } },
    { $group: { _id: '$user', acceptedSubmissions: { $sum: 1 }, uniqueSolved: { $addToSet: '$problem' } } },
    { $project: { user: '$_id', acceptedSubmissions: 1, uniqueSolved: { $size: '$uniqueSolved' } } },
    { $sort: { acceptedSubmissions: -1 } },
  ]).toArray();
  agg.forEach(r => console.log(`user=${r.user} accepted=${r.acceptedSubmissions} UNIQUE_SOLVED=${r.uniqueSolved} overcount=${r.acceptedSubmissions - r.uniqueSolved}`));

  console.log('\n--- SUBMISSIONS (legacy) dsa accepted: raw vs unique ---');
  const agg2 = await db.collection('submissions').aggregate([
    { $match: { type: 'submit', status: 'accepted', category: 'dsa' } },
    { $group: { _id: '$user', acceptedSubmissions: { $sum: 1 }, uniqueSolved: { $addToSet: '$problem' } } },
    { $project: { user: '$_id', acceptedSubmissions: 1, uniqueSolved: { $size: '$uniqueSolved' } } },
    { $sort: { acceptedSubmissions: -1 } },
  ]).toArray();
  agg2.forEach(r => console.log(`user=${r.user} accepted=${r.acceptedSubmissions} UNIQUE_SOLVED=${r.uniqueSolved} overcount=${r.acceptedSubmissions - r.uniqueSolved}`));

  const realSolved = new Map();
  for (const r of agg) realSolved.set(String(r.user), r.uniqueSolved);

  console.log('\n--- USERSTATS (leaderboard source) vs REAL UNIQUE DSA SOLVED ---');
  const us = await db.collection('userstats').find({}).toArray();
  us.forEach(s => {
    const real = realSolved.get(String(s.userId));
    console.log(`userStats.userId=${s.userId} totalProblems=${s.totalProblems} acceptanceRate=${s.acceptanceRate} | REAL=${real === undefined ? 'NONE' : real}`);
  });

  console.log('\n--- USERS.stats MISMATCHES vs ground truth ---');
  let mismatches = 0;
  for (const u of users) {
    const real = realSolved.get(String(u._id)) || 0;
    const claimed = u.stats ? u.stats.totalSolved : 0;
    if (claimed !== real) { mismatches++; console.log(`user=${u._id} "${u.name}" stats.totalSolved=${claimed} realUniqueSolved=${real}`); }
  }
  console.log(`total mismatches: ${mismatches}`);

  const cpIds = new Set((await db.collection('codingproblems').find({}, { projection: { _id: 1 } }).toArray()).map(p => String(p._id)));
  const dangling = (await db.collection('codesubmissions').find({}).toArray()).filter(s => !cpIds.has(String(s.problem)));
  console.log(`\nDANGLING codesubmissions.problem refs: ${dangling.length}`);

  console.log('\n--- LEADERBOARDS collection (snapshot) ---');
  const lbs = await db.collection('leaderboards').find({}).toArray();
  lbs.forEach(l => console.log(JSON.stringify({ type: l.leaderboardType, rank: l.rank, userId: l.userId, username: l.username, totalProblems: l.totalProblems, weeklySolved: l.weeklySolved, totalSolved: l.totalSolved })));

  const problems = await db.collection('codingproblems').find({}).toArray();
  const sum = a => a.reduce((x, y) => x + y, 0);
  const hiddenCount = problems.map(p => (p.hiddenTests || []).length);
  const sampleCount = problems.map(p => (p.sampleTests || []).length);
  console.log('\n--- DSA PROBLEM QUALITY (266) ---');
  console.log(`noSamples=${problems.filter(p => !p.sampleTests || !p.sampleTests.length).length}`);
  console.log(`sampleMissingOutput=${problems.filter(p => (p.sampleTests || []).some(t => t.output === undefined || t.output === null || t.output === '')).length}`);
  console.log(`sampleMissingExplanation=${problems.filter(p => (p.sampleTests || []).some(t => !t.explanation)).length}`);
  console.log(`noHidden=${problems.filter(p => !p.hiddenTests || !p.hiddenTests.length).length}`);
  console.log(`noConstraints=${problems.filter(p => !p.constraints || !p.constraints.length).length}`);
  console.log(`noStarterAny=${problems.filter(p => !p.starterCode || !Object.values(p.starterCode).some(Boolean)).length}`);
  console.log(`noJsSignature=${problems.filter(p => !p.functionSignature || !p.functionSignature.javascript).length}`);
  console.log(`hidden total=${sum(hiddenCount)} avg=${(sum(hiddenCount) / problems.length).toFixed(1)} min=${Math.min(...hiddenCount)} max=${Math.max(...hiddenCount)}`);
  console.log(`sample total=${sum(sampleCount)} avg=${(sum(sampleCount) / problems.length).toFixed(1)} min=${Math.min(...sampleCount)} max=${Math.max(...sampleCount)}`);
  const noDesc = problems.filter(p => !p.description || p.description.length < 80);
  console.log(`weakDescription(<80 chars)=${noDesc.length}`);

  const sqlp = await db.collection('sqlproblems').find({}).toArray();
  console.log('fields:', JSON.stringify(Object.keys(sqlp[0] || {})));
  console.log(`noSchemaSetupSQL=${sqlp.filter(p => !p.schemaSetupSQL).length}`);
  console.log(`noSampleTestCases=${sqlp.filter(p => !p.sampleTestCases || !p.sampleTestCases.length).length}`);
  console.log(`noHiddenTestCases=${sqlp.filter(p => !p.hiddenTestCases || !p.hiddenTestCases.length).length}`);
  console.log(`noExpectedOutput=${sqlp.filter(p => !p.expectedOutput).length}`);
  console.log(`noReferenceSolutionSQL=${sqlp.filter(p => !p.referenceSolutionSQL).length}`);
  const s0 = sqlp[0] || {};
  console.log('EXAMPLE:', JSON.stringify({
    title: s0.title, difficulty: s0.difficulty, topic: s0.topic,
    sample: (s0.sampleTestCases || []).length, hidden: (s0.hiddenTestCases || []).length,
    hasExpected: !!s0.expectedOutput, schema: (s0.schemaSetupSQL || '').slice(0, 120),
  }, null, 2));

  await mongoose.disconnect();
}

main().catch(async (e) => { console.error('AUDIT ERROR:', e.message); process.exit(1); });
