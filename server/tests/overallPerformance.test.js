/**
 * Overall performance leaderboard + analytics regression suite.
 *
 * Covers the guarantees the feature has to hold:
 *   - section scores and Overall come from real persisted activity only
 *   - a section with NO activity is `null`, never 0
 *   - a user with no activity anywhere is not ranked at all
 *   - ranking is by Overall and recalculates when activity changes
 *   - test accounts never reach the board
 *   - the endpoint sits behind auth, and only publishes the caller's own row
 *   - strengths / weak areas / suggestions are derived from real topic data
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/User');
const CodeSubmission = require('../models/CodeSubmission');
const CodingProblem = require('../models/CodingProblem');
const SQLSubmission = require('../models/SQLSubmission');
const SQLProblem = require('../models/SQLProblem');
const AptitudeSubmission = require('../models/AptitudeSubmission');
const InterviewSession = require('../models/InterviewSession');

const leaderboardRouter = require('../routes/leaderboard');
const analyticsRouter = require('../routes/analytics');

const {
  smoothedScore,
  mean,
  buildRow,
  withRanks,
  compareRows,
  getOverallLeaderboard,
  getUserOverallPerformance,
} = require('../services/overallPerformanceService');
const { buildStrengths, buildWeakAreas } = require('../services/performanceAnalysisService');

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
    User.deleteMany({}),
    CodeSubmission.deleteMany({}),
    CodingProblem.deleteMany({}),
    Submission.deleteMany({}),
    SQLSubmission.deleteMany({}),
    SQLProblem.deleteMany({}),
    AptitudeSubmission.deleteMany({}),
    InterviewSession.deleteMany({}),
  ]);
});

/* --------------------------------------------------------------- fixtures */

const mkUser = (name, email, extra = {}) => User.create({
  name, email, password: 'hashedpassword', role: 'student',
  stats: { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, totalSubmissions: 0, streak: 0 },
  profile: { atsScore: 0 },
  ...extra,
});

const mkCodingProblem = (over = {}) => CodingProblem.create({
  problemId: `P-${Math.random().toString(36).slice(2, 8)}`,
  title: `Problem ${Math.random().toString(36).slice(2, 8)}`,
  description: 'd'.repeat(120),
  difficulty: 'easy',
  topic: 'Arrays',
  tags: ['array'],
  isActive: true,
  ...over,
});

const mkSqlProblem = (over = {}) => SQLProblem.create({
  problemNumber: Math.floor(Math.random() * 100000),
  title: `SQL ${Math.random().toString(36).slice(2, 8)}`,
  description: 'Find customers whose referee is not null.',
  difficulty: 'easy',
  topic: 'Subquery',
  schemaTables: [{ tableName: 'Customer', columns: [{ name: 'id', type: 'int' }] }],
  schemaSetupSQL: 'CREATE TABLE Customer (id INT, name VARCHAR(50), referee_id INT);',
  referenceSolutionSQL: 'SELECT name FROM Customer;',
  ...over,
});

const Submission = require('../models/Submission');

/**
 * Mirror what routes/coding.js really writes on a DSA submit: a CodeSubmission
 * (the canonical verdict record read by dsaProgressService / the DSA
 * leaderboard) AND the legacy `submissions` ledger row (read by
 * featureEngineering, analyticsController and practiceHistory). Writing only
 * one of the two would not reproduce a real account's data.
 */
const dsa = async (user, problem, verdict) => {
  const accepted = verdict === 'Accepted';
  const code = 'function f(){}';
  const passed = accepted ? 3 : 0;
  await CodeSubmission.create({
    user: user._id, problem: problem._id, language: 'javascript',
    code, verdict, category: 'dsa', totalTestCases: 3, passedTestCases: passed,
  });
  await Submission.create({
    user: user._id, problem: problem._id, code, language: 'javascript',
    status: accepted ? 'accepted' : 'wrong_answer', type: 'submit',
    totalTestCases: 3, passedTestCases: passed,
    problemDifficulty: problem.difficulty, problemTags: problem.tags,
    category: 'dsa', score: Math.round((passed / 3) * 100),
  });
};

const sql = (user, problem, status) => SQLSubmission.create({
  user: user._id, problem: problem._id, query: 'SELECT 1', status, type: 'submit',
  difficulty: 'easy', topics: ['JOIN'], totalTestCases: 2, passedTestCases: status === 'accepted' ? 2 : 0,
});

const aptitude = (user, correct, total, extra = {}) => AptitudeSubmission.create({
  userId: user._id, type: 'single-question', category: 'quantitative',
  totalCount: total, correctCount: correct, score: total ? Math.round((correct / total) * 100) : 0,
  ...extra,
});

const interview = (user, percentage, extra = {}) => InterviewSession.create({
  user: user._id, topics: ['Arrays'], difficulty: 'medium', mode: 'text',
  totalQuestions: 5, status: 'COMPLETED',
  finalReport: { percentage, score: Math.round((percentage / 100) * 10), maxScore: 10 },
  completedAt: new Date(),
  ...extra,
});

const mockRes = () => {
  const res = { statusCode: 200, payload: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (p) => { res.payload = p; return res; };
  return res;
};

/** The route runs protect() then the handler, so the handler is last. */
const handlerFor = (router, path) => {
  const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods.get);
  if (!layer) throw new Error(`route ${path} not registered`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
};

const asUser = (user) => ({ user: { id: user._id.toString() }, params: {}, query: {} });
// ===========================================================================
describe('Pure scoring maths (no database)', () => {
  it('a section with zero attempts is null, never 0', () => {
    expect(smoothedScore(0, 0)).toBeNull();
    expect(smoothedScore(5, 0)).toBeNull();
  });

  it('an attempted-and-all-wrong section IS a real low score, distinct from null', () => {
    // Beta(0.5, 4): (0 + 2) / (4 + 4) = 25% — real data, a low score.
    const score = smoothedScore(0, 4);
    expect(score).not.toBeNull();
    expect(score).toBe(25);
  });

  it('smoothing stops a single lucky solve from reading as 100%', () => {
    // (1 + 2) / (1 + 4) = 60%, not 100%.
    expect(smoothedScore(1, 1)).toBe(60);
    expect(smoothedScore(90, 100)).toBeGreaterThan(85);
  });

  it('mean ignores nulls and returns null when there is nothing to average', () => {
    expect(mean([])).toBeNull();
    expect(mean([null, null])).toBeNull();
    expect(mean([80, null, 60])).toBe(70);
  });

  it('buildRow normalises Overall over the AVAILABLE sections only', () => {
    const row = buildRow({
      userId: 'u1',
      name: 'Solo DSA',
      counts: {
        dsa: { problemsSolved: 8, problemsAttempted: 10, totalSubmissions: 12 },
        sql: null, aptitude: null, mockInterview: null,
      },
    });
    expect(row.dsa).not.toBeNull();
    // The three unattempted sections are null, not 0.
    expect(row.aptitude).toBeNull();
    expect(row.sql).toBeNull();
    expect(row.mockInterview).toBeNull();
    expect(row.overall).toBe(row.dsa);
    expect(row.sectionsCompleted).toBe(1);
  });

  it('buildRow reports overall === null for a user with no activity anywhere', () => {
    const row = buildRow({
      userId: 'u2', name: 'Ghost',
      counts: { dsa: null, sql: null, aptitude: null, mockInterview: null },
    });
    expect(row.overall).toBeNull();
    expect(row.sectionsCompleted).toBe(0);
  });

  it('ranking is by Overall, with deterministic tie-breakers', () => {
    const rows = [
      { userId: 'a', name: 'A', overall: 50, sectionsCompleted: 1, totalActivity: 10 },
      { userId: 'b', name: 'B', overall: 80, sectionsCompleted: 2, totalActivity: 10 },
      { userId: 'c', name: 'C', overall: 50, sectionsCompleted: 2, totalActivity: 5 },
      { userId: 'd', name: 'D', overall: 80, sectionsCompleted: 1, totalActivity: 10 },
    ];
    const ranked = withRanks(rows);
    // B (80, 2 sections) outranks D (80, 1 section); C (50, 2) outranks A (50, 1).
    expect(ranked.map((r) => r.userId)).toEqual(['b', 'd', 'c', 'a']);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });

  it('compareRows is stable for identical rows (no reliance on input order)', () => {
    const a = { userId: 'a', name: 'Same', overall: 70, sectionsCompleted: 2, totalActivity: 5 };
    const b = { userId: 'b', name: 'Same', overall: 70, sectionsCompleted: 2, totalActivity: 5 };
    expect(compareRows(a, b)).toBeLessThan(0);
    expect(compareRows(b, a)).toBeGreaterThan(0);
  });
});

// ===========================================================================
describe('GET /api/leaderboard/overall', () => {
  it('is mounted behind the authentication middleware', () => {
    const layer = leaderboardRouter.stack.find(
      (l) => l.route && l.route.path === '/overall' && l.route.methods.get
    );
    expect(layer).toBeDefined();
    // protect() must run before the handler.
    expect(layer.route.stack.length).toBeGreaterThanOrEqual(2);
    const { protect } = require('../middleware/auth');
    expect(layer.route.stack[0].handle).toBe(protect);
  });

  it('returns an honest empty state when nobody has any activity', async () => {
    const user = await mkUser('Nobody', 'nobody@example.com');
    const res = mockRes();
    await handlerFor(leaderboardRouter, '/overall')(asUser(user), res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.success).toBe(true);
    expect(res.payload.leaderboard).toEqual([]);
    expect(res.payload.pagination.total).toBe(0);
    expect(res.payload.currentUser).toBeNull();
  });

  it('ranks real users by Overall and reports un-attempted sections as null', async () => {
    const strong = await mkUser('Strong', 'strong@example.com');
    const weak = await mkUser('Weak', 'weak@example.com');

    for (let i = 0; i < 4; i++) await dsa(strong, await mkCodingProblem(), 'Accepted');
    for (let i = 0; i < 4; i++) await dsa(weak, await mkCodingProblem(), 'WrongAnswer');

    const { leaderboard, pagination, currentUser } = await getOverallLeaderboard({
      currentUserId: strong._id.toString(),
    });

    expect(pagination.total).toBe(2);
    expect(leaderboard[0].name).toBe('Strong');
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[1].name).toBe('Weak');
    expect(leaderboard[1].rank).toBe(2);
    expect(leaderboard[0].overall).toBeGreaterThan(leaderboard[1].overall);

    // Neither user touched SQL / Aptitude / Interviews.
    leaderboard.forEach((r) => {
      expect(r.sql).toBeNull();
      expect(r.aptitude).toBeNull();
      expect(r.mockInterview).toBeNull();
    });

    expect(currentUser.rank).toBe(1);
    expect(currentUser.name).toBe('Strong');
  });

  it('never publishes an email address or any other private field', async () => {
    const u = await mkUser('Private Person', 'private@example.com');
    await dsa(u, await mkCodingProblem(), 'Accepted');

    const res = mockRes();
    await handlerFor(leaderboardRouter, '/overall')(asUser(u), res);
    const body = JSON.stringify(res.payload);
    expect(body).not.toContain('private@example.com');
    expect(res.payload.leaderboard[0].email).toBeUndefined();
    expect(res.payload.leaderboard[0]).toEqual(
      expect.objectContaining({ userId: expect.any(String), name: 'Private Person' })
    );
  });

  it('excludes flagged test accounts from the public board', async () => {
    const real = await mkUser('Real', 'real@example.com');
    const bot = await mkUser('Bot', 'bot@example.com', { isTestAccount: true });
    await dsa(real, await mkCodingProblem(), 'Accepted');
    await dsa(bot, await mkCodingProblem(), 'Accepted');

    const { leaderboard } = await getOverallLeaderboard({});
    expect(leaderboard.map((r) => r.name)).toEqual(['Real']);
  });

  it('excludes a registered user who has no activity at all', async () => {
    const active = await mkUser('Active', 'active@example.com');
    const idle = await mkUser('Idle', 'idle@example.com');
    await dsa(active, await mkCodingProblem(), 'Accepted');

    const { leaderboard, currentUser } = await getOverallLeaderboard({
      currentUserId: idle._id.toString(),
    });
    expect(leaderboard.map((r) => r.name)).toEqual(['Active']);
    // The idle caller is reported honestly: no row, no invented score.
    expect(currentUser).toBeNull();
  });

  it('counts repeated Accepted runs of ONE problem as a single solved problem', async () => {
    const u = await mkUser('Repeater', 'repeat@example.com');
    const p = await mkCodingProblem();
    await dsa(u, p, 'Accepted');
    await dsa(u, p, 'Accepted');
    await dsa(u, p, 'Accepted');

    const { leaderboard } = await getOverallLeaderboard({});
    expect(leaderboard).toHaveLength(1);
    expect(leaderboard[0].activity.dsaSolved).toBe(1);
    expect(leaderboard[0].activity.dsaAttempted).toBe(1);
    expect(leaderboard[0].activity.dsaSubmissions).toBe(3);
  });

  it('only counts a completed mock interview, using its real percentage', async () => {
    const done = await mkUser('Done', 'done@example.com');
    const abandoned = await mkUser('Abandoned', 'abandoned@example.com');
    await interview(done, 80);
    await InterviewSession.create({
      user: abandoned._id, topics: ['Arrays'], difficulty: 'medium', mode: 'text',
      totalQuestions: 5, status: 'ABANDONED',
      finalReport: { percentage: 100, score: 10, maxScore: 10 },
    });

    const { leaderboard } = await getOverallLeaderboard({});
    const doneRow = leaderboard.find((r) => r.name === 'Done');
    const abandonedRow = leaderboard.find((r) => r.name === 'Abandoned');
    expect(doneRow.mockInterview).toBe(80);
    expect(doneRow.overall).toBe(80);
    // An unfinished session is NOT performance data.
    expect(abandonedRow).toBeUndefined();
  });

  it('averages several completed interviews rather than taking the best', async () => {
    const u = await mkUser('Multi', 'multi@example.com');
    await interview(u, 90);
    await interview(u, 50);
    const { leaderboard } = await getOverallLeaderboard({});
    expect(leaderboard[0].mockInterview).toBe(70);
  });

  it('reads real aptitude accuracy per QUESTION, not per paper', async () => {
    const u = await mkUser('Quant', 'quant@example.com');
    await aptitude(u, 3, 10); // 3/10 correct
    const { leaderboard } = await getOverallLeaderboard({});
    // Beta(0.5,4): (3 + 2) / (10 + 4) = 36%
    expect(leaderboard[0].activity.aptitudeQuestions).toBe(10);
    expect(leaderboard[0].activity.aptitudeCorrect).toBe(3);
    expect(leaderboard[0].aptitude).toBe(36);
  });

  it('reads real SQL solve rate from sqlsubmissions', async () => {
    const u = await mkUser('Query', 'query@example.com');
    await sql(u, await mkSqlProblem(), 'accepted');
    await sql(u, await mkSqlProblem(), 'wrong_answer');
    const { leaderboard } = await getOverallLeaderboard({});
    expect(leaderboard[0].activity.sqlSolved).toBe(1);
    expect(leaderboard[0].activity.sqlAttempted).toBe(2);
    expect(leaderboard[0].sql).toBe(smoothedScore(1, 2));
  });

  it('ignores SQL "run" rows — only a real Submit counts', async () => {
    const u = await mkUser('Runner', 'runner@example.com');
    const p = await mkSqlProblem();
    await SQLSubmission.create({
      user: u._id, problem: p._id, query: 'SELECT 1', status: 'accepted', type: 'run',
    });
    const { leaderboard, pagination } = await getOverallLeaderboard({});
    expect(pagination.total).toBe(0);
    expect(leaderboard).toEqual([]);
  });

  it('recalculates rank the moment real activity changes', async () => {
    const first = await mkUser('First', 'first@example.com');
    const second = await mkUser('Second', 'second@example.com');
    await dsa(first, await mkCodingProblem(), 'Accepted');
    await dsa(first, await mkCodingProblem(), 'Accepted');

    const before = await getOverallLeaderboard({});
    expect(before.leaderboard[0].name).toBe('First');

    // Real activity: Second solves three more problems.
    for (let i = 0; i < 3; i++) await dsa(second, await mkCodingProblem(), 'Accepted');

    const after = await getOverallLeaderboard({});
    expect(after.leaderboard[0].name).toBe('Second');
    expect(after.leaderboard[0].rank).toBe(1);
    expect(after.leaderboard[1].name).toBe('First');
    expect(after.leaderboard[1].rank).toBe(2);
  });

  it('applies the same rule to every user — no special-casing', async () => {
    const a = await mkUser('AAA', 'aaa@example.com');
    const b = await mkUser('BBB', 'bbb@example.com');
    // Identical activity, different names.
    for (const u of [a, b]) {
      for (let i = 0; i < 3; i++) await dsa(u, await mkCodingProblem(), 'Accepted');
    }
    const { leaderboard } = await getOverallLeaderboard({});
    expect(leaderboard[0].overall).toBe(leaderboard[1].overall);
    expect(leaderboard[0].dsa).toBe(leaderboard[1].dsa);
    expect(leaderboard[0].sectionsCompleted).toBe(leaderboard[1].sectionsCompleted);
  });

  it('paginates without changing the ranking', async () => {
    for (let i = 0; i < 5; i++) {
      const u = await mkUser(`P${i}`, `p${i}@example.com`);
      for (let k = 0; k <= i; k++) await dsa(u, await mkCodingProblem(), 'Accepted');
    }
    const all = await getOverallLeaderboard({ limit: 50 });
    expect(all.leaderboard.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5]);

    const paged = await getOverallLeaderboard({ limit: 2, page: 2 });
    expect(paged.leaderboard.map((r) => r.rank)).toEqual([3, 4]);
    expect(paged.pagination.total).toBe(5);
    expect(paged.pagination.pages).toBe(3);
  });

  it('publishes the scoring contract so a client can explain any row', async () => {
    const u = await mkUser('Doc', 'doc@example.com');
    const { scoring } = await getOverallLeaderboard({});
    expect(scoring.sections.map((s) => s.key)).toEqual(['dsa', 'aptitude', 'sql', 'mockInterview']);
    expect(scoring.smoothing).toMatch(/Beta/);
    expect(scoring.overall).toEqual(expect.any(String));
    expect(scoring.rules.mockInterview).toEqual(expect.any(String));
  });
});

// ===========================================================================
describe('Analytics endpoints (user isolation + empty states)', () => {
  const ANALYTICS_ROUTES = [
    '/overall-performance',
    '/topic-performance',
    '/strengths',
    '/improvements',
    '/suggestions',
  ];

  it('every new analytics route is mounted behind protect()', () => {
    const { protect } = require('../middleware/auth');
    ANALYTICS_ROUTES.forEach((path) => {
      const layer = analyticsRouter.stack.find(
        (l) => l.route && l.route.path === path && l.route.methods.get
      );
      expect(layer).toBeDefined();
      expect(layer.route.stack[0].handle).toBe(protect);
    });
  });

  it('the static routes are declared BEFORE the /:category/... wildcard', () => {
    const paths = analyticsRouter.stack.filter((l) => l.route).map((l) => l.route.path);
    ANALYTICS_ROUTES.forEach((path) => {
      const staticIdx = paths.indexOf(path);
      const wildcardIdx = paths.indexOf('/:category/summary/:userId');
      expect(staticIdx).toBeGreaterThanOrEqual(0);
      expect(staticIdx).toBeLessThan(wildcardIdx);
    });
  });

  it('overall-performance reports a null-filled, not-attempted profile for a new user', async () => {
    const user = await mkUser('Newcomer', 'newcomer@example.com');
    const res = mockRes();
    await handlerFor(analyticsRouter, '/overall-performance')(asUser(user), res);

    expect(res.statusCode).toBe(200);
    const d = res.payload.data;
    expect(d.hasAnyActivity).toBe(false);
    expect(d.overall).toBeNull();
    expect(d.dsa).toBeNull();
    expect(d.aptitude).toBeNull();
    expect(d.sql).toBeNull();
    expect(d.mockInterview).toBeNull();
    expect(d.emptyState).toEqual(expect.any(String));
  });

  it('overall-performance returns real scores and a live rank once activity exists', async () => {
    const me = await mkUser('Me', 'me@example.com');
    const rival = await mkUser('Rival', 'rival@example.com');
    for (let i = 0; i < 3; i++) await dsa(me, await mkCodingProblem(), 'Accepted');
    for (let i = 0; i < 5; i++) await dsa(rival, await mkCodingProblem(), 'Accepted');

    const res = mockRes();
    await handlerFor(analyticsRouter, '/overall-performance')(asUser(me), res);
    const d = res.payload.data;
    expect(d.hasAnyActivity).toBe(true);
    expect(d.rank).toBe(2);
    expect(d.totalRankedUsers).toBe(2);
    expect(d.dsa).not.toBeNull();
    expect(d.overall).not.toBeNull();
    expect(d.emptyState).toBeNull();
  });

  it('topic-performance reports a section with no records as null, not 0%', async () => {
    const u = await mkUser('TopicUser', 'topicuser@example.com');
    await dsa(u, await mkCodingProblem({ tags: ['array'], topic: 'Arrays' }), 'Accepted');

    const res = mockRes();
    await handlerFor(analyticsRouter, '/topic-performance')(asUser(u), res);
    const s = res.payload.data.sections;
    expect(s.dsa).toEqual(expect.arrayContaining([expect.objectContaining({ topic: 'array' })]));
    expect(s.sql).toBeNull();
    expect(s.aptitude).toBeNull();
    expect(s.mockInterview).toBeNull();
    expect(res.payload.data.hasAnyActivity).toBe(true);
  });

  it('ignores a userId smuggled into the QUERY string and always uses the caller', async () => {
    const me = await mkUser('Mine', 'mine@example.com');
    const other = await mkUser('Theirs', 'theirs@example.com');
    await dsa(other, await mkCodingProblem(), 'Accepted');

    for (const path of ANALYTICS_ROUTES) {
      const res = mockRes();
      await handlerFor(analyticsRouter, path)(
        { user: { id: me._id.toString() }, params: {}, query: { userId: other._id.toString() } },
        res
      );
      expect(res.statusCode).toBe(200);
      expect(JSON.stringify(res.payload)).not.toContain(other._id.toString());
    }
  });

  it('fails closed (403) if a userId is forced into the path', async () => {
    const me = await mkUser('Mine2', 'mine2@example.com');
    const other = await mkUser('Theirs2', 'theirs2@example.com');
    await dsa(other, await mkCodingProblem(), 'Accepted');

    for (const path of ANALYTICS_ROUTES) {
      const res = mockRes();
      await handlerFor(analyticsRouter, path)(
        { user: { id: me._id.toString() }, params: { userId: other._id.toString() }, query: {} },
        res
      );
      // ownScope() rejects rather than silently serving the caller's data.
      expect(res.statusCode).toBe(403);
      expect(JSON.stringify(res.payload)).not.toContain(other._id.toString());
    }
  });

  it('strengths/improvements/suggestions return honest empties for a new user', async () => {
    const u = await mkUser('Empty', 'empty@example.com');

    const strengthsRes = mockRes();
    await handlerFor(analyticsRouter, '/strengths')(asUser(u), strengthsRes);
    expect(strengthsRes.payload.data.strengths).toEqual([]);
    expect(strengthsRes.payload.data.emptyState).toEqual(expect.any(String));

    const improvementsRes = mockRes();
    await handlerFor(analyticsRouter, '/improvements')(asUser(u), improvementsRes);
    expect(improvementsRes.payload.data.weakAreas).toEqual([]);
    expect(improvementsRes.payload.data.emptyState).toEqual(expect.any(String));

    const suggestionsRes = mockRes();
    await handlerFor(analyticsRouter, '/suggestions')(asUser(u), suggestionsRes);
    expect(suggestionsRes.payload.data.hasAny).toBe(false);
    expect(suggestionsRes.payload.data.emptyState).toEqual(expect.any(String));
  });
});

// ===========================================================================
describe('Strengths and weak areas are data-driven', () => {
  const feature = (over = {}) => ({
    topic: 'Arrays', domain: 'DSA', attempts: 5, solved: 4,
    accuracy: 80, recentAccuracy: 80, avgDifficulty: 1, trend: 0,
    status: 'STRONG', confidence: 70, evidence: {}, ...over,
  });

  it('a strong topic with enough attempts becomes a strength', () => {
    const [row] = buildStrengths([feature()]);
    expect(row.topic).toBe('Arrays');
    expect(row.section).toBe('dsa');
    expect(row.accuracy).toBe(80);
  });

  it('a high-accuracy topic with too few attempts is NOT a strength', () => {
    expect(buildStrengths([feature({ attempts: 1 })])).toEqual([]);
  });

  it('sorts strengths best-first', () => {
    const rows = buildStrengths([
      feature({ topic: 'Decent', accuracy: 71 }),
      feature({ topic: 'Best', accuracy: 95 }),
    ]);
    expect(rows.map((r) => r.topic)).toEqual(['Best', 'Decent']);
  });

  it('declares a weak topic only with enough attempts to justify it', () => {
    const weak = buildWeakAreas([feature({ status: 'WEAK', accuracy: 20, attempts: 6 })]);
    expect(weak).toHaveLength(1);
    expect(weak[0].confirmed).toBe(true);
    expect(weak[0].performance).toBe(20);
    expect(weak[0].action).toEqual(expect.any(String));

    // One isolated miss must not be reported as a hard weakness.
    const thin = buildWeakAreas([feature({ status: 'WEAK_UNDERPRACTICED', accuracy: 10, attempts: 1 })]);
    expect(thin).toHaveLength(1);
    expect(thin[0].confirmed).toBe(false);
  });

  it('orders confirmed weaknesses ahead of unconfirmed ones', () => {
    const rows = buildWeakAreas([
      feature({ topic: 'Unconfirmed', status: 'WEAK_UNDERPRACTICED', accuracy: 5, attempts: 1 }),
      feature({ topic: 'Confirmed', status: 'WEAK', accuracy: 15, attempts: 8 }),
    ]);
    expect(rows.map((r) => r.topic)).toEqual(['Confirmed', 'Unconfirmed']);
  });

  it('maps each domain to its leaderboard section', () => {
    const rows = buildWeakAreas([
      feature({ topic: 'A', domain: 'SQL', status: 'WEAK', accuracy: 10, attempts: 5 }),
      feature({ topic: 'B', domain: 'Aptitude', status: 'WEAK', accuracy: 10, attempts: 5 }),
      feature({ topic: 'C', domain: 'Interview', status: 'WEAK', accuracy: 10, attempts: 5 }),
    ]);
    expect(rows.map((r) => r.section).sort()).toEqual(['aptitude', 'mockInterview', 'sql']);
    expect(rows.find((r) => r.section === 'mockInterview').metric).toBe('Score');
  });

  it('detects a weak topic from REAL submissions end to end', async () => {
    const u = await mkUser('Stuck', 'stuck@example.com');
    // Six attempts on a Graphs-tagged problem, only one ever accepted.
    for (let i = 0; i < 5; i++) {
      const p = await mkCodingProblem({ tags: ['graphs'], topic: 'Graphs' });
      await dsa(u, p, 'WrongAnswer');
    }
    await dsa(u, await mkCodingProblem({ tags: ['graphs'], topic: 'Graphs' }), 'Accepted');

    const res = mockRes();
    await handlerFor(analyticsRouter, '/improvements')(asUser(u), res);
    const graphs = res.payload.data.weakAreas.find((r) => r.topic === 'graphs');
    expect(graphs).toBeDefined();
    expect(graphs.section).toBe('dsa');
    expect(graphs.performance).toBeLessThan(40);
    expect(graphs.attempts).toBeGreaterThanOrEqual(6);
  });

  it('produces topic-specific suggestions that differ between two users', async () => {
    const graphsUser = await mkUser('G', 'g@example.com');
    const sqlUser = await mkUser('S', 's@example.com');

    const g = await mkCodingProblem({ tags: ['graphs'], topic: 'Graphs' });
    for (let i = 0; i < 5; i++) await dsa(graphsUser, g, 'WrongAnswer');
    await dsa(graphsUser, await mkCodingProblem({ tags: ['graphs'], topic: 'Graphs' }), 'Accepted');

    const s = await mkSqlProblem({ topics: ['JOIN'], topic: 'JOIN' });
    for (let i = 0; i < 5; i++) await sql(sqlUser, s, 'wrong_answer');
    await sql(sqlUser, await mkSqlProblem({ topics: ['JOIN'], topic: 'JOIN' }), 'accepted');

    const gRes = mockRes();
    await handlerFor(analyticsRouter, '/suggestions')(asUser(graphsUser), gRes);
    const sRes = mockRes();
    await handlerFor(analyticsRouter, '/suggestions')(asUser(sqlUser), sRes);

    expect(gRes.payload.data.bySection.dsa.length).toBeGreaterThan(0);
    expect(sRes.payload.data.bySection.sql.length).toBeGreaterThan(0);

    // Recommendations track the ACTUAL weakness, not a generic list.
    expect(gRes.payload.data.bySection.dsa[0].topic).toBe('graphs');
    expect(sRes.payload.data.bySection.sql[0].topic).toBe('JOIN');
    expect(gRes.payload.data.bySection.dsa[0].suggestion).toEqual(expect.any(String));
  });
});
