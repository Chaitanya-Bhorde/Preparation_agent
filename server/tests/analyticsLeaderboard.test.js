const mongoose = require('mongoose');
const User = require('../models/User');
const Submission = require('../models/Submission');

// Seeds 3 users with varied module activity, then exercises the new
// per-category analytics + aggregation-based leaderboard controllers.
async function seed(db) {
  const P1 = new mongoose.Types.ObjectId(); // dsa easy
  const P2 = new mongoose.Types.ObjectId(); // dsa medium
  const P3 = new mongoose.Types.ObjectId(); // dsa (wrong for alice)
  const P4 = new mongoose.Types.ObjectId(); // sql easy
  const P5 = new mongoose.Types.ObjectId(); // sql medium
  const P6 = new mongoose.Types.ObjectId(); // sql medium
  const P7 = new mongoose.Types.ObjectId(); // dsa hard (bob)
  const Q1 = new mongoose.Types.ObjectId(); // aptitude wrong (alice)
  const Q2 = new mongoose.Types.ObjectId(); // aptitude correct (bob)
  const Q3 = new mongoose.Types.ObjectId(); // aptitude correct (bob)

  db.alice = await User.create({
    name: 'Alice', email: 'alice-analytics@example.com', password: 'hashed', role: 'student',
    stats: { totalSolved: 3, easySolved: 2, mediumSolved: 1, hardSolved: 0, totalSubmissions: 5, streak: 0 },
    profile: { atsScore: 0 },
  });
  db.bob = await User.create({
    name: 'Bob', email: 'bob-analytics@example.com', password: 'hashed', role: 'student',
    stats: { totalSolved: 3, easySolved: 0, mediumSolved: 0, hardSolved: 1, totalSubmissions: 3, streak: 0 },
    profile: { atsScore: 0 },
  });
  db.carol = await User.create({
    name: 'Carol', email: 'carol-analytics@example.com', password: 'hashed', role: 'student',
    stats: { totalSolved: 2, easySolved: 0, mediumSolved: 2, hardSolved: 0, totalSubmissions: 2, streak: 0 },
    profile: { atsScore: 0 },
  });

  const mk = (user, problem, status, category, difficulty, tags, daysAgo) => Submission.create({
    user: user._id, problem, code: 'x', language: 'javascript', status, type: 'submit',
    passedTestCases: status === 'accepted' ? 4 : 2, totalTestCases: 4,
    problemDifficulty: difficulty, problemTags: tags, category,
    createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
  });

  await mk(db.alice, P1, 'accepted', 'dsa', 'easy', ['Array', 'Hash Table'], 5);
  await mk(db.alice, P2, 'accepted', 'dsa', 'medium', ['Dynamic Programming'], 5);
  await mk(db.alice, P3, 'wrong_answer', 'dsa', 'medium', ['Array'], 4);
  await mk(db.alice, P4, 'accepted', 'sql', 'easy', ['Select', 'Join'], 3);
  await mk(db.alice, Q1, 'wrong_answer', 'aptitude', 'easy', ['Quantitative'], 2);

  await mk(db.bob, P7, 'accepted', 'dsa', 'hard', ['Graph'], 6);
  await mk(db.bob, Q2, 'accepted', 'aptitude', 'medium', ['Logical'], 3);
  await mk(db.bob, Q3, 'accepted', 'aptitude', 'medium', ['Logical'], 2);

  await mk(db.carol, P5, 'accepted', 'sql', 'medium', ['Aggregation'], 4);
  await mk(db.carol, P6, 'accepted', 'sql', 'medium', ['Group By'], 2);
}

function capture() {
  const mock = {
    status(code) {
      return {
        json(body) {
          mock.code = code;
          mock.body = body;
        },
      };
    },
  };
  return mock;
}

describe('Per-category Analytics + Aggregation Leaderboard', () => {
  let db = {};

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent-test');
  });

  afterEach(async () => {
    await Submission.deleteMany({});
    await User.deleteMany({});
    db = {};
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('returns per-module summary scoped to the user', async () => {
    await seed(db);
    const analytics = require('../controllers/analyticsController');

    const res = capture();
    await analytics.getCategorySummary(
      { params: { category: 'dsa', userId: db.alice._id.toString() }, user: { id: db.alice._id.toString(), role: 'student' } },
      res
    );
    expect(res.code).toBe(200);
    expect(res.body.data.totalSolved).toBe(2);
    expect(res.body.data.difficulty.easy).toBe(1);
    expect(res.body.data.difficulty.medium).toBe(1);
    expect(res.body.data.difficulty.hard).toBe(0);

    const sqlRes = capture();
    await analytics.getCategorySummary(
      { params: { category: 'sql', userId: db.alice._id.toString() }, user: { id: db.alice._id.toString(), role: 'student' } },
      sqlRes
    );
    expect(sqlRes.body.data.totalSolved).toBe(1);

    const overallRes = capture();
    await analytics.getCategorySummary(
      { params: { category: 'overall', userId: db.alice._id.toString() }, user: { id: db.alice._id.toString(), role: 'student' } },
      overallRes
    );
    expect(overallRes.body.data.totalSolved).toBe(3);
    expect(overallRes.body.data.acceptanceRate).toBe(60);
  });

  it('returns heatmap and topic breakdown', async () => {
    await seed(db);
    const analytics = require('../controllers/analyticsController');

    const hRes = capture();
    await analytics.getCategoryHeatmap(
      { params: { category: 'dsa', userId: db.alice._id.toString() }, user: { id: db.alice._id.toString(), role: 'student' } },
      hRes
    );
    expect(hRes.code).toBe(200);
    expect(hRes.body.data).toHaveProperty('heatmap');
    expect(hRes.body.data).toHaveProperty('currentStreak');
    expect(hRes.body.data).toHaveProperty('maxStreak');

    const tRes = capture();
    await analytics.getCategoryTopics(
      { params: { category: 'dsa', userId: db.alice._id.toString() }, user: { id: db.alice._id.toString(), role: 'student' } },
      tRes
    );
    expect(tRes.code).toBe(200);
    const array = tRes.body.data.topics.find((t) => t.topic === 'Array');
    expect(array).toBeDefined();
    expect(array.solved).toBe(1);
  });

  it('rejects viewing another user (scoped to logged-in user)', async () => {
    await seed(db);
    const analytics = require('../controllers/analyticsController');
    const res = capture();
    // alice tries to view bob's summary
    await analytics.getCategorySummary(
      { params: { category: 'dsa', userId: db.bob._id.toString() }, user: { id: db.alice._id.toString(), role: 'student' } },
      res
    );
    expect(res.code).toBe(403);
  });

  it('returns leaderboard ranked per category via aggregation', async () => {
    await seed(db);
    const leaderboard = require('../controllers/leaderboardController');

    // DSA: alice(2) then bob(1)
    const dsaRes = capture();
    await leaderboard.getLeaderboard(
      { params: { category: 'dsa' }, query: { page: 1, limit: 50 }, user: { id: db.alice._id.toString() } },
      dsaRes
    );
    expect(dsaRes.code).toBe(200);
    expect(dsaRes.body.data[0].name).toBe('Alice');
    expect(dsaRes.body.data[0].solvedCount).toBe(2);
    expect(dsaRes.body.data[1].name).toBe('Bob');
    expect(dsaRes.body.data[1].solvedCount).toBe(1);
    expect(dsaRes.body.data.length).toBe(2);

    // SQL: carol(2) then alice(1)
    const sqlRes = capture();
    await leaderboard.getLeaderboard(
      { params: { category: 'sql' }, query: { page: 1, limit: 50 }, user: { id: db.alice._id.toString() } },
      sqlRes
    );
    expect(sqlRes.body.data[0].name).toBe('Carol');
    expect(sqlRes.body.data[0].solvedCount).toBe(2);

    // Overall: bob(3, 100%) then alice(3, 60%) then carol(2) — tie-broken by acceptance rate
    const overallRes = capture();
    await leaderboard.getLeaderboard(
      { params: { category: 'overall' }, query: { page: 1, limit: 50 }, user: { id: db.alice._id.toString() } },
      overallRes
    );
    expect(overallRes.body.data[0].name).toBe('Bob');
    expect(overallRes.body.data[0].solvedCount).toBe(3);
    expect(overallRes.body.data[1].name).toBe('Alice');
    expect(overallRes.body.data[1].solvedCount).toBe(3);
    expect(overallRes.body.data[1].acceptanceRate).toBe(60);
    expect(overallRes.body.data[2].name).toBe('Carol');

    // Pagination + totals
    expect(overallRes.body.total).toBe(3);
    expect(overallRes.body.totalPages).toBe(1);
    expect(overallRes.body.data[0].rank).toBe(1);
  });

  it('validates category names on leaderboard', async () => {
    await seed(db);
    const leaderboard = require('../controllers/leaderboardController');
    const res = capture();
    await leaderboard.getLeaderboard(
      { params: { category: 'bogus' }, query: {}, user: { id: db.alice._id.toString() } },
      res
    );
    expect(res.code).toBe(400);
  });
});

