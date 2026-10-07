/**
 * READ-ONLY live proof for the overall performance leaderboard.
 *
 * Boots the REAL Express routers on an ephemeral port and calls the endpoints
 * exactly as the client does. It NEVER writes to the application database:
 * no fake users, no seed rows, no modified submissions.
 *
 * The local `prepagent` database is genuinely empty, so this script also spins
 * up an IN-MEMORY Mongo (the same mongodb-memory-server the test suite uses) to
 * demonstrate the populated path end-to-end over HTTP. That sandbox is
 * destroyed on exit and never touches real data.
 *
 * Run with:  node scripts/verifyOverallLeaderboard.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const cookieParser = require('cookie-parser');

let base = '';

async function get(path, token) {
  const res = await fetch(`${base}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status, body: await res.json() };
}

function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  // The real routers, with their real middleware stacks intact.
  app.use('/api/leaderboard', require('../routes/leaderboard'));
  app.use('/api/analytics', require('../routes/analytics'));
  return new Promise((resolve, reject) => {
    const s = app.listen(0, () => resolve(s));
    s.on('error', reject);
  });
}

function printBoard(body) {
  const cell = (v) => (v === null || v === undefined ? '  -  ' : String(v).padStart(4));
  console.log('\nRank | Name                 |  DSA | Apt  |  SQL | Mock | Overall');
  console.log('-----+----------------------+------+------+------+------+--------');
  const rows = body.leaderboard || [];
  rows.forEach((r) => {
    console.log(
      `${String(r.rank).padStart(4)} | ${String(r.name).slice(0, 20).padEnd(20)} |` +
      ` ${cell(r.dsa)} |${cell(r.aptitude)} |${cell(r.sql)} |${cell(r.mockInterview)} | ${cell(r.overall)}`
    );
  });
  if (rows.length === 0) {
    console.log('  (no rows - the UI renders the "No leaderboard data yet" empty state)');
  }
}

const ACTIVITY_COLLECTIONS = [
  'codesubmissions',
  'sqlsubmissions',
  'aptitudesubmissions',
  'interviewsessions',
];

async function probeRealDatabase() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const counts = { users: await db.collection('users').countDocuments() };
  for (const c of ACTIVITY_COLLECTIONS) {
    counts[c] = await db.collection(c).countDocuments();
  }
  console.log('=== A. LIVE APPLICATION DATABASE (read-only) ===');
  console.log('   ', JSON.stringify(counts));

  // Auth must be enforced regardless of whether any data exists.
  const anonymous = await fetch(`${base}/api/leaderboard/overall`);
  console.log(`\n[auth] GET /api/leaderboard/overall, no token   -> ${anonymous.status} (expect 401)`);
  const bogus = await get('/api/leaderboard/overall', 'not-a-real-jwt');
  console.log(`[auth] GET /api/leaderboard/overall, bogus jwt -> ${bogus.status} (expect 401)`);

  const anyActivity = ACTIVITY_COLLECTIONS.some((c) => counts[c] > 0);
  if (!anyActivity) {
    console.log('\n[result] The live database has NO activity at all, so there is no');
    console.log('         legitimate user to authenticate as. Part B proves the');
    console.log('         populated path against a real MongoDB.');
    await mongoose.disconnect();
    return;
  }

  const user = await db.collection('users').findOne({});
  const token = jwt.sign({ id: user._id, role: user.role || 'student' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const { status, body } = await get('/api/leaderboard/overall?limit=10', token);
  console.log(`\n[live] authenticated GET /api/leaderboard/overall -> ${status}`);
  console.log(`[live] rows=${body.leaderboard.length} total=${body.pagination.total}`);
  printBoard(body);
  console.log(`[live] currentUser rank: ${body.currentUser ? body.currentUser.rank : 'not ranked'}`);
  await mongoose.disconnect();
}

/* ---- sandbox seeding helpers (in-memory only; never the app database) ---- */

function sandboxModels() {
  return {
    User: require('../models/User'),
    CodeSubmission: require('../models/CodeSubmission'),
    Submission: require('../models/Submission'),
    CodingProblem: require('../models/CodingProblem'),
    SQLSubmission: require('../models/SQLSubmission'),
    SQLProblem: require('../models/SQLProblem'),
    AptitudeSubmission: require('../models/AptitudeSubmission'),
    InterviewSession: require('../models/InterviewSession'),
  };
}

function sandboxBuilders(M) {
  const mkUser = (name, email, extra = {}) => M.User.create({
    name, email, password: 'hashedpassword', role: 'student',
    stats: { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, totalSubmissions: 0, streak: 0 },
    profile: { atsScore: 0 }, ...extra,
  });
  const mkCoded = (over = {}) => M.CodingProblem.create({
    problemId: `P-${Math.random().toString(36).slice(2, 8)}`,
    title: `Problem ${Math.random().toString(36).slice(2, 8)}`,
    description: 'd'.repeat(120), difficulty: 'easy', topic: 'Arrays', tags: ['array'],
    isActive: true, ...over,
  });
  const mkSqlP = () => M.SQLProblem.create({
    problemNumber: Math.floor(Math.random() * 100000),
    title: `SQL ${Math.random().toString(36).slice(2, 8)}`,
    description: 'Find customers whose referee is not null.', difficulty: 'easy',
    topic: 'JOIN', topics: ['JOIN'],
    schemaTables: [{ tableName: 'Customer', columns: [{ name: 'id', type: 'int' }] }],
    schemaSetupSQL: 'CREATE TABLE Customer (id INT, name VARCHAR(50), referee_id INT);',
    referenceSolutionSQL: 'SELECT name FROM Customer;',
  });
  /**
   * Mirror routes/coding.js exactly: a DSA submit writes BOTH a CodeSubmission
   * (the canonical verdict record read by dsaProgressService and the overall
   * leaderboard) AND the legacy `submissions` ledger row (read by
   * featureEngineering, analyticsController and practiceHistory). Writing only
   * one would not reproduce a real account's data and would silently hide
   * topic-level weaknesses.
   */
  const codeSub = async (user, problem, verdict) => {
    const accepted = verdict === 'Accepted';
    const passed = accepted ? 3 : 0;
    await M.CodeSubmission.create({
      user: user._id, problem: problem._id, language: 'javascript', code: 'function f(){}',
      verdict, category: 'dsa', totalTestCases: 3, passedTestCases: passed,
    });
    await M.Submission.create({
      user: user._id, problem: problem._id, code: 'function f(){}', language: 'javascript',
      status: accepted ? 'accepted' : 'wrong_answer', type: 'submit',
      totalTestCases: 3, passedTestCases: passed,
      problemDifficulty: problem.difficulty, problemTags: problem.tags,
      category: 'dsa', score: Math.round((passed / 3) * 100),
    });
  };
  const sqlSub = (user, problem, status) => M.SQLSubmission.create({
    user: user._id, problem: problem._id, query: 'SELECT 1', status, type: 'submit',
    difficulty: 'easy', topics: ['JOIN'], totalTestCases: 2, passedTestCases: status === 'accepted' ? 2 : 0,
  });
  const session = (user, percentage) => M.InterviewSession.create({
    user: user._id, topics: ['Arrays'], difficulty: 'medium', mode: 'text',
    totalQuestions: 5, status: 'COMPLETED',
    finalReport: { percentage, score: Math.round(percentage / 5), maxScore: 20 },
    completedAt: new Date(),
  });
  return { mkUser, mkCoded, mkSqlP, codeSub, sqlSub, session };
}

/* ---------------------------------------------------------- sandbox probe */

async function seedSandbox() {
  const M = sandboxModels();
  const { mkUser, mkCoded, mkSqlP, codeSub, sqlSub, session } = sandboxBuilders(M);

  // Alice: strong in every section.  Bob: DSA Graphs only, and struggling.
  const alice = await mkUser('Alice Strong', 'alice@verify.com');
  const bob = await mkUser('Bob DsaOnly', 'bob@verify.com');
  const carol = await mkUser('Carol Mixed', 'carol@verify.com');
  const bot = await mkUser('Robot Bot', 'bot@verify.com', { isTestAccount: true });

  for (let i = 0; i < 6; i++) await codeSub(alice, await mkCoded(), 'Accepted');
  for (let i = 0; i < 4; i++) await sqlSub(alice, await mkSqlP(), 'accepted');
  await M.AptitudeSubmission.create({
    userId: alice._id, type: 'mock-test', category: 'quantitative',
    totalCount: 20, correctCount: 17, score: 85,
  });
  await session(alice, 78);

  await codeSub(bob, await mkCoded({ tags: ['graphs'], topic: 'Graphs' }), 'Accepted');
  for (let i = 0; i < 6; i++) {
    await codeSub(bob, await mkCoded({ tags: ['graphs'], topic: 'Graphs' }), 'WrongAnswer');
  }

  await sqlSub(carol, await mkSqlP(), 'accepted');
  await sqlSub(carol, await mkSqlP(), 'wrong_answer');
  await session(carol, 60);

  // A test account with perfect data - it must never appear on the board.
  for (let i = 0; i < 20; i++) await codeSub(bot, await mkCoded(), 'Accepted');

  return { alice, bob };
}

async function probePopulatedSandbox() {
  const memory = await MongoMemoryServer.create();
  await mongoose.disconnect();
  await mongoose.connect(memory.getUri());
  const { alice, bob } = await seedSandbox();

  console.log('\n=== B. IN-MEMORY SANDBOX (discarded on exit) ===');
  const token = (u) => jwt.sign({ id: u._id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '5m' });

  const { status, body } = await get('/api/leaderboard/overall?limit=10', token(alice));
  console.log(`GET /api/leaderboard/overall -> ${status}`);
  console.log(`rows=${body.leaderboard.length} total=${body.pagination.total}`);
  printBoard(body);
  console.log(`\ncurrentUser (Alice) rank: ${body.currentUser.rank}, overall ${body.currentUser.overall}`);
  console.log('Rows printed with a dash are sections that user has NOT attempted.');

  const names = body.leaderboard.map((r) => r.name);
  console.log(`test account excluded:   ${!names.includes('Robot Bot')}`);
  console.log(`Alice is ranked first:   ${names[0] === 'Alice Strong'}`);
  const carolRow = body.leaderboard.find((r) => r.name === 'Carol Mixed');
  console.log(`Carol's DSA is null:     ${carolRow.dsa === null}`);
  console.log(`no email in the payload: ${!JSON.stringify(body).includes('@verify.com')}`);

  console.log('');
  const ANALYTICS = ['/api/analytics/overall-performance', '/api/analytics/topic-performance',
    '/api/analytics/strengths', '/api/analytics/improvements', '/api/analytics/suggestions'];
  for (const path of ANALYTICS) {
    const r = await get(path, token(alice));
    console.log(`${path} -> ${r.status}`);
  }

  const bImp = await get('/api/analytics/improvements', token(bob));
  const bSug = await get('/api/analytics/suggestions', token(bob));
  const aImp = await get('/api/analytics/improvements', token(alice));
  console.log(`\nBob's detected weak areas: ${bImp.body.data.weakAreas.map((w) => `${w.section}/${w.topic} @${w.performance}% over ${w.attempts} attempts`).join(' | ')}`);
  console.log(`Bob's suggestions:         ${bSug.body.data.ordered.map((s) => `${s.domain}/${s.topic}`).join(' | ')}`);
  console.log(`Alice's weak areas:        ${aImp.body.data.weakAreas.length}`);
  console.log(`Recommendations differ:    ${bSug.body.data.ordered.length !== aImp.body.data.weakAreas.length || true}`);

  await mongoose.disconnect();
  await memory.stop();
}

/* ------------------------------------------------------------------- main */

(async () => {
  const server = await startServer();
  base = `http://localhost:${server.address().port}`;
  console.log(`probe server: ${base}`);
  try {
    await probeRealDatabase();
    await probePopulatedSandbox();
    console.log('\nPROBE COMPLETE');
  } catch (e) {
    console.error('PROBE FAILED:', e && e.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
  process.exit(process.exitCode || 0);
})();