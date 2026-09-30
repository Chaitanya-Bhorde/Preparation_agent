/**
 * Regression suite for the unique-solved-count fix.
 *
 * Reproduced live defect: user "manan" had 13 Accepted submissions covering
 * only 3 distinct problems (an overcount of 10), while his stored
 * `stats.totalSolved` was 0 because the counter was a guarded `$inc` that
 * historical writes had bypassed.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const CodeSubmission = require('../models/CodeSubmission');
const Submission = require('../models/Submission');
const CodingProblem = require('../models/CodingProblem');
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const Leaderboard = require('../models/Leaderboard');

const { computeDsaProgress, recomputeUserProgress, mergeRollups } = require('../services/dsaProgressService');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    CodeSubmission.deleteMany({}),
    Submission.deleteMany({}),
    CodingProblem.deleteMany({}),
    User.deleteMany({}),
    UserStats.deleteMany({}),
    Leaderboard.deleteMany({}),
  ]);
});

const mkUser = (name, email) => User.create({
  name, email, password: 'hashedpassword', role: 'student',
  stats: { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, totalSubmissions: 0, streak: 0 },
  profile: { atsScore: 0 },
});

const mkProblem = (over = {}) => CodingProblem.create({
  problemId: `P-${Math.random().toString(36).slice(2, 8)}`,
  title: `Problem ${Math.random().toString(36).slice(2, 8)}`,
  description: 'd'.repeat(120),
  difficulty: 'easy',
  topic: 'Arrays',
  tags: ['array'],
  isActive: true,
  ...over,
});

const sub = (user, problem, verdict) => CodeSubmission.create({
  user: user._id,
  problem: problem ? problem._id : new mongoose.Types.ObjectId(),
  language: 'javascript',
  code: 'function f(){return 1;}',
  verdict,
  category: 'dsa',
  passedTestCases: verdict === 'Accepted' ? 3 : 0,
  totalTestCases: 3,
});

// ===========================================================================
describe('P3 — unique solved count', () => {
  it('three Accepted submissions of the SAME problem count as ONE solved problem', async () => {
    const u = await mkUser('A', 'a@example.com');
    const p = await mkProblem();
    await sub(u, p, 'Accepted');
    await sub(u, p, 'Accepted');
    await sub(u, p, 'Accepted');

    const progress = await computeDsaProgress(u._id);
    expect(progress.acceptedSubmissions).toBe(3);
    expect(progress.totalSolved).toBe(1);
    expect(progress.solvedProblemIds).toHaveLength(1);
  });

  it('Two Sum x3 AC + Three Sum x1 AC => submissions 4, solved 2', async () => {
    const u = await mkUser('A', 'a2@example.com');
    const two = await mkProblem({ title: 'Two Sum' });
    const three = await mkProblem({ title: 'Three Sum' });
    await sub(u, two, 'Accepted');
    await sub(u, two, 'Accepted');
    await sub(u, two, 'Accepted');
    await sub(u, three, 'Accepted');

    const progress = await computeDsaProgress(u._id);
    expect(progress.totalSolved).toBe(2);
    expect(progress.totalSubmissions).toBe(4);
    expect(progress.acceptedSubmissions).toBe(4);
  });

  it('non-Accepted verdicts never count as solved', async () => {
    const u = await mkUser('A', 'a3@example.com');
    const p = await mkProblem();
    await sub(u, p, 'WrongAnswer');
    await sub(u, p, 'CompileError');
    await sub(u, p, 'RuntimeError');
    await sub(u, p, 'TLE');

    const progress = await computeDsaProgress(u._id);
    expect(progress.totalSubmissions).toBe(4);
    expect(progress.totalSolved).toBe(0);
  });

  it('AC after previous WA counts the problem exactly once', async () => {
    const u = await mkUser('A', 'a4@example.com');
    const p = await mkProblem();
    await sub(u, p, 'WrongAnswer');
    await sub(u, p, 'WrongAnswer');
    await sub(u, p, 'Accepted');
    await sub(u, p, 'WrongAnswer');

    const progress = await computeDsaProgress(u._id);
    expect(progress.totalSolved).toBe(1);
    expect(progress.totalSubmissions).toBe(4);
  });

  it('difficulty buckets sum to the unique solved count', async () => {
    const u = await mkUser('A', 'a5@example.com');
    const easy = await mkProblem({ difficulty: 'easy' });
    const med = await mkProblem({ difficulty: 'medium' });
    const hard = await mkProblem({ difficulty: 'hard' });
    await sub(u, easy, 'Accepted');
    await sub(u, easy, 'Accepted');
    await sub(u, med, 'Accepted');
    await sub(u, hard, 'Accepted');

    const progress = await computeDsaProgress(u._id);
    expect(progress.totalSolved).toBe(3);
    expect(progress.easySolved).toBe(1);
    expect(progress.mediumSolved).toBe(1);
    expect(progress.hardSolved).toBe(1);
  });

  it('a solve whose problem document is gone is still counted (dangling refs preserved)', async () => {
    const u = await mkUser('A', 'a6@example.com');
    const p = await mkProblem();
    await sub(u, p, 'Accepted');
    const row = await CodeSubmission.findOne({ user: u._id });
    await CodingProblem.deleteMany({});

    const progress = await computeDsaProgress(u._id);
    expect(progress.totalSolved).toBe(1);
    expect(String(progress.solvedProblemIds[0])).toBe(String(row.problem));
  });

  it('mergeRollups deduplicates a problem seen in both submission collections', () => {
    const merged = mergeRollups(
      [{ _id: 'p1', attempts: 3, accepted: 3, firstAcceptedAt: new Date('2026-01-02'), difficulty: 'easy' }],
      [{ _id: 'p1', attempts: 2, accepted: 1, firstAcceptedAt: new Date('2026-01-01'), difficulty: null }],
    );
    expect(merged.size).toBe(1);
    const row = merged.get('p1');
    expect(row.attempts).toBe(5);
    expect(row.accepted).toBe(4);
    expect(row.difficulty).toBe('easy');
    expect(row.firstAcceptedAt.toISOString().slice(0, 10)).toBe('2026-01-01');
  });

  it('recomputeUserProgress is idempotent: running it twice does not double count', async () => {
    const u = await mkUser('A', 'a7@example.com');
    const p = await mkProblem();
    await sub(u, p, 'Accepted');
    await sub(u, p, 'Accepted');
    await sub(u, p, 'Accepted');

    const first = await recomputeUserProgress(u._id);
    const second = await recomputeUserProgress(u._id);
    expect(first.totalSolved).toBe(1);
    expect(second.totalSolved).toBe(1);

    const user = await User.findById(u._id);
    expect(user.stats.totalSolved).toBe(1);
  });

  it('recomputeUserProgress repairs a drifted counter instead of incrementing it', async () => {
    const u = await mkUser('A', 'a8@example.com');
    await User.updateOne({ _id: u._id }, { $set: { 'stats.totalSolved': 99 } });
    const p = await mkProblem();
    await sub(u, p, 'Accepted');

    const progress = await recomputeUserProgress(u._id);
    expect(progress.totalSolved).toBe(1);
    const user = await User.findById(u._id);
    expect(user.stats.totalSolved).toBe(1);
  });

  it('recomputeUserProgress also populates UserStats, which the leaderboard reads', async () => {
    const u = await mkUser('A', 'a9@example.com');
    const p = await mkProblem();
    await sub(u, p, 'Accepted');
    await recomputeUserProgress(u._id);

    const stats = await UserStats.findOne({ userId: u._id });
    expect(stats).not.toBeNull();
    expect(stats.totalProblems).toBe(1);
  });
});

