/**
 * learningDataReset.test.js
 * ---------------------------------------------------------------------------
 * Regression suite for DELETE /api/learning-data — the full learning-data
 * reset.
 *
 * Guarantees under test:
 *   1. The route is mounted behind protect() (anonymous DELETE => 401).
 *   2. An explicit { confirm: 'RESET' } is required (accidental DELETE => 400).
 *   3. A confirmed reset deletes ONLY the caller's rows across every learning
 *      collection — dual Submission/CodeSubmission architecture included, plus
 *      the interview cascade (questions/answers hang off sessions).
 *   4. Another user's rows survive untouched.
 *   5. Question banks / system data survive untouched.
 *   6. The User document survives with zeroed learning counters (goals and
 *      identity preserved).
 *
 * Runs entirely against MongoMemoryServer — the application database is never
 * touched. No LLM/ML service is involved: the endpoint is deterministic.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-jwt-secret';

const User = require('../models/User');
const Submission = require('../models/Submission');
const CodeSubmission = require('../models/CodeSubmission');
const SQLSubmission = require('../models/SQLSubmission');
const SQLProblem = require('../models/SQLProblem');
const AptitudeSubmission = require('../models/AptitudeSubmission');
const CoreSubjectSubmission = require('../models/CoreSubjectSubmission');
const InterviewSession = require('../models/InterviewSession');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewAnswer = require('../models/InterviewAnswer');
const PracticeHistory = require('../models/PracticeHistory');
const UserStats = require('../models/UserStats');
const UserAchievements = require('../models/UserAchievements');
const Mistake = require('../models/Mistake');
const Draft = require('../models/Draft');
const Leaderboard = require('../models/Leaderboard');
const Problem = require('../models/Problem');
const Subject = require('../models/Subject');

const learningDataRouter = require('../routes/learningData');

let mongoServer;
let server;
let baseUrl;

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(require('cookie-parser')());
  app.use('/api/learning-data', learningDataRouter);
  return app;
};

const req = async (p, opts = {}) => {
  const res = await fetch(baseUrl + p, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
};

const del = (token, payload) => req('/api/learning-data', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify(payload ?? {}),
});

const tokenFor = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  server = buildApp().listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((r) => server.close(r));
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}), Submission.deleteMany({}), CodeSubmission.deleteMany({}),
    SQLSubmission.deleteMany({}), SQLProblem.deleteMany({}), AptitudeSubmission.deleteMany({}),
    CoreSubjectSubmission.deleteMany({}), InterviewSession.deleteMany({}),
    InterviewQuestion.deleteMany({}), InterviewAnswer.deleteMany({}),
    PracticeHistory.deleteMany({}), UserStats.deleteMany({}), Mistake.deleteMany({}),
    UserAchievements.deleteMany({}),
    Draft.deleteMany({}), Leaderboard.deleteMany({}), Problem.deleteMany({}),
    Subject.deleteMany({}),
  ]);
});

/* --------------------------------------------------------------- fixtures */

const mkUser = (name, email, extra = {}) => User.create({
  name, email, password: 'hashedpassword', role: 'student',
  stats: {
    totalSolved: 4, easySolved: 2, mediumSolved: 1, hardSolved: 1,
    totalSubmissions: 9, streak: 3, dailyGoal: 7, weeklyGoal: 49,
  },
  profile: { atsScore: 81 },
  ...extra,
});

const mkProblem = () => Problem.create({
  title: `Two Sum ${Math.random().toString(36).slice(2, 8)}`,
  slug: `two-sum-${Math.random().toString(36).slice(2, 8)}`,
  description: 'Return indices of the two numbers.',
  difficulty: 'easy',
  tags: ['array'],
});

const mkSqlProblem = () => SQLProblem.create({
  problemNumber: Math.floor(Math.random() * 100000),
  title: `SQL ${Math.random().toString(36).slice(2, 8)}`,
  description: 'Simple select.',
  difficulty: 'easy',
  topic: 'Select',
  schemaTables: [{ tableName: 'T', columns: [{ name: 'id', type: 'int' }] }],
  schemaSetupSQL: 'CREATE TABLE T (id INT);',
  referenceSolutionSQL: 'SELECT id FROM T;',
});

const mkSubject = () => {
  const tag = Math.random().toString(36).slice(2, 8);
  return Subject.create({
    slug: `dbms-${tag}`,
    name: `DBMS ${tag}`,
    description: 'Database management systems.',
  });
};

/** Seed one full learning footprint for `user`. Returns the created docs. */
async function seedLearningData(user) {
  const problem = await mkProblem();
  const sqlProblem = await mkSqlProblem();
  const subject = await mkSubject();

  const submission = await Submission.create({
    user: user._id, problem: problem._id, code: 'console.log(1)',
    language: 'javascript', type: 'submit', status: 'accepted',
    totalTestCases: 3, passedTestCases: 3,
  });
  const codeSubmission = await CodeSubmission.create({
    user: user._id, problem: problem._id, language: 'javascript', code: 'f()',
    verdict: 'Accepted', category: 'dsa', totalTestCases: 3, passedTestCases: 3,
  });
  const sqlSubmission = await SQLSubmission.create({
    user: user._id, problem: sqlProblem._id, query: 'SELECT 1',
    status: 'accepted', type: 'submit',
  });
  const aptitudeSubmission = await AptitudeSubmission.create({
    userId: user._id, type: 'single-question', category: 'quantitative',
    totalCount: 5, correctCount: 4, score: 80,
  });
  const coreSubmission = await CoreSubjectSubmission.create({
    userId: user._id, subject: subject._id, questionId: new mongoose.Types.ObjectId(),
    questionType: 'mcq', selectedAnswer: 0, isCorrect: true, timeTaken: 20,
  });
  const session = await InterviewSession.create({
    user: user._id, topics: ['Arrays'], difficulty: 'medium', mode: 'text',
    totalQuestions: 5, status: 'COMPLETED',
    finalReport: { percentage: 80, score: 8, maxScore: 10 },
  });
  const question = await InterviewQuestion.create({
    session: session._id, order: 1, topic: 'Arrays', difficulty: 'medium',
    text: 'Explain time complexity of binary search.',
  });
  const answer = await InterviewAnswer.create({
    session: session._id, question: question._id, answerType: 'text',
    text: 'O(log n) because the search space halves each step.',
  });
  const practiceHistory = await PracticeHistory.create({
    userId: user._id, problemId: problem._id, problemTitle: 'Two Sum',
    problemSlug: 'two-sum', problemUrl: '/problems/two-sum',
    difficulty: 'Easy', verdict: 'Accepted', language: 'JavaScript',
  });
  const userStats = await UserStats.create({ userId: user._id, totalProblems: 4 });
  const achievements = await UserAchievements.create({
    userId: user._id,
    badges: [{ id: 'first-hundred-qa', name: 'Century', earnedAt: new Date(), category: 'aptitude' }],
    statistics: { totalQuestionsAttempted: 120, totalCorrect: 96, currentStreak: 4 },
  });
  const mistake = await Mistake.create({
    user: user._id, submission: submission._id, problem: problem._id,
    mistakeType: 'off-by-one', personalNote: 'check boundary',
  });
  const draft = await Draft.create({
    user: user._id, problem: problem._id, language: 'javascript', code: '// wip',
  });
  const leaderboardRow = await Leaderboard.create({
    userId: user._id, username: user.name, email: user.email, rank: 3,
    totalProblems: 4, acceptanceRate: 44, rankingTier: 'Bronze',
    easyCount: 2, mediumCount: 1, hardCount: 1, currentStreak: 3,
    leaderboardType: 'Global',
  });

  return {
    problem, sqlProblem, subject, submission, codeSubmission, sqlSubmission,
    aptitudeSubmission, coreSubmission, session, question, answer,
    practiceHistory, userStats, achievements, mistake, draft, leaderboardRow,
  };
}

/* ------------------------------------------------------------ structural */

describe('route wiring', () => {
  it('DELETE / is mounted behind protect()', () => {
    const { protect } = require('../middleware/auth');
    const layer = learningDataRouter.stack.find(
      (l) => l.route && l.route.path === '/' && l.route.methods.delete
    );
    expect(layer).toBeDefined();
    expect(layer.route.stack[0].handle).toBe(protect);
  });

  it('rejects an anonymous DELETE with 401', async () => {
    const { status, body } = await del(null, { confirm: 'RESET' });
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('requires the explicit confirmation payload', async () => {
    const user = await mkUser('A', 'a@example.com');
    const { status, body } = await del(tokenFor(user), {});
    expect(status).toBe(400);
    expect(body.message).toMatch(/confirm/i);
    // Nothing was wiped (the seeded stats on the User itself are untouched).
    const after = await User.findById(user._id);
    expect(after.stats.totalSolved).toBe(4);
  });
});

/* ------------------------------------------------------------ behaviour */

describe('confirmed reset', () => {
  it('wipes every learning collection for the caller only', async () => {
    const alice = await mkUser('Alice', 'alice@example.com');
    const bob = await mkUser('Bob', 'bob@example.com');
    const aliceData = await seedLearningData(alice);
    const bobData = await seedLearningData(bob);

    const { status, body } = await del(tokenFor(alice), { confirm: 'RESET' });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalDeleted).toBeGreaterThan(0);

    // Alice's rows are gone from every learning collection.
    expect(await Submission.countDocuments({ user: alice._id })).toBe(0);
    expect(await CodeSubmission.countDocuments({ user: alice._id })).toBe(0);
    expect(await SQLSubmission.countDocuments({ user: alice._id })).toBe(0);
    expect(await AptitudeSubmission.countDocuments({ userId: alice._id })).toBe(0);
    expect(await CoreSubjectSubmission.countDocuments({ userId: alice._id })).toBe(0);
    expect(await InterviewSession.countDocuments({ user: alice._id })).toBe(0);
    expect(await InterviewQuestion.countDocuments({ session: aliceData.session._id })).toBe(0);
    expect(await InterviewAnswer.countDocuments({ session: aliceData.session._id })).toBe(0);
    expect(await PracticeHistory.countDocuments({ userId: alice._id })).toBe(0);
    expect(await UserStats.countDocuments({ userId: alice._id })).toBe(0);
    expect(await UserAchievements.countDocuments({ userId: alice._id })).toBe(0);
    expect(await Mistake.countDocuments({ user: alice._id })).toBe(0);
    expect(await Draft.countDocuments({ user: alice._id })).toBe(0);
    expect(await Leaderboard.countDocuments({ userId: alice._id })).toBe(0);

    // Bob's footprint is completely untouched.
    expect(await Submission.countDocuments({ user: bob._id })).toBe(1);
    expect(await CodeSubmission.countDocuments({ user: bob._id })).toBe(1);
    expect(await SQLSubmission.countDocuments({ user: bob._id })).toBe(1);
    expect(await AptitudeSubmission.countDocuments({ userId: bob._id })).toBe(1);
    expect(await CoreSubjectSubmission.countDocuments({ userId: bob._id })).toBe(1);
    expect(await InterviewSession.countDocuments({ user: bob._id })).toBe(1);
    expect(await InterviewAnswer.countDocuments({ session: bobData.session._id })).toBe(1);
    expect(await PracticeHistory.countDocuments({ userId: bob._id })).toBe(1);
    expect(await UserStats.countDocuments({ userId: bob._id })).toBe(1);
    expect(await UserAchievements.countDocuments({ userId: bob._id })).toBe(1);
    expect(await Mistake.countDocuments({ user: bob._id })).toBe(1);
    expect(await Draft.countDocuments({ user: bob._id })).toBe(1);
    expect(await Leaderboard.countDocuments({ userId: bob._id })).toBe(1);

    // Question banks survive (both users' problem rows still exist).
    expect(await Problem.countDocuments({})).toBe(2);
    expect(await Problem.findById(aliceData.problem._id)).not.toBeNull();
    expect(await SQLProblem.countDocuments({})).toBe(2);
    expect(await Subject.countDocuments({})).toBe(2);
  });

  it('keeps the User document but zeroes learning counters (goals preserved)', async () => {
    const alice = await mkUser('Alice', 'alice@example.com');
    await seedLearningData(alice);

    const { status } = await del(tokenFor(alice), { confirm: 'RESET' });
    expect(status).toBe(200);

    const after = await User.findById(alice._id);
    expect(after).not.toBeNull(); // identity preserved
    expect(after.name).toBe('Alice');
    expect(after.email).toBe('alice@example.com');
    expect(after.profile.atsScore).toBe(81); // resume data untouched
    expect(after.stats.totalSolved).toBe(0);
    expect(after.stats.easySolved).toBe(0);
    expect(after.stats.mediumSolved).toBe(0);
    expect(after.stats.hardSolved).toBe(0);
    expect(after.stats.totalSubmissions).toBe(0);
    expect(after.stats.streak).toBe(0);
    // Goals are preferences, not learning output — they survive a reset.
    expect(after.stats.dailyGoal).toBe(7);
    expect(after.stats.weeklyGoal).toBe(49);
    expect(after.revisionQueue).toEqual([]);
    expect(after.weakTopics).toEqual([]);
  });

  it('reports a per-collection breakdown so the UI can show what was wiped', async () => {
    const alice = await mkUser('Alice', 'alice@example.com');
    await seedLearningData(alice);

    const { status, body } = await del(tokenFor(alice), { confirm: 'RESET' });
    expect(status).toBe(200);
    const { deleted } = body.data;
    for (const key of [
      'submissions', 'codeSubmissions', 'sqlSubmissions', 'aptitudeSubmissions',
      'coreSubjectSubmissions', 'interviewSessions', 'interviewQuestions',
      'interviewAnswers', 'practiceHistory', 'userStats', 'userAchievements',
      'mistakes', 'drafts', 'leaderboardRows',
    ]) {
      expect(typeof deleted[key]).toBe('number');
      expect(deleted[key]).toBeGreaterThanOrEqual(1);
    }
  });

  it('is a safe no-op for a user with no learning data (empty-state reset)', async () => {
    const fresh = await mkUser('Fresh', 'fresh@example.com');
    const { status, body } = await del(tokenFor(fresh), { confirm: 'RESET' });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalDeleted).toBe(0);
    expect(await User.findById(fresh._id)).not.toBeNull();
  });

  it('is deterministic: the reset controller never touches an LLM/ML client', async () => {
    // The endpoint only requires mongoose models — no aiClient, mlRankerClient
    // or recommendation service — so a provider outage (429/404) can never
    // block or fail a reset. Prove it from the module graph.
    const src = fs.readFileSync(
      path.join(__dirname, '../controllers/learningDataController.js'),
      'utf8'
    );
    expect(src).not.toMatch(/aiClient|mlRankerClient|recommendationService|openai|groq/i);
    // Every write is a scoped deleteMany/update — all keyed to the caller.
    expect(src).not.toMatch(/deleteMany\(\s*\{\s*\}\s*\)/);
    expect(src).not.toMatch(/drop\(|deleteMany\(\s*\)/);
  });
});