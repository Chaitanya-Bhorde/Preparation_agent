/**
 * Regression tests for the SQL platform (visible Run vs hidden Submit, answer
 * key protection) and the performance-driven recommendation engine.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const SQLProblem = require('../models/SQLProblem');
const SQLSubmission = require('../models/SQLSubmission');
const User = require('../models/User');
const CodeSubmission = require('../models/CodeSubmission');
const CodingProblem = require('../models/CodingProblem');

const sqlRouter = require('../routes/sql');
const {
  evaluateSqlCase, summarizeSqlResults, shapeSqlResults, normalizeSqlRows,
} = require('../utils/sqlCaseRunner');
const {
  generateRecommendations, smoothedAccuracy, identifyWeakTopics, scoreCandidate,
  recommendedDifficulty, MIN_ATTEMPTS_PER_TOPIC, WEIGHTS,
} = require('../services/recommendationService');

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
    SQLProblem.deleteMany({}),
    SQLSubmission.deleteMany({}),
    User.deleteMany({}),
    CodeSubmission.deleteMany({}),
    CodingProblem.deleteMany({}),
  ]);
});

const mkUser = (name, email) => User.create({
  name, email, password: 'hashedpassword', role: 'student',
  stats: { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, totalSubmissions: 0, streak: 0 },
  profile: { atsScore: 0 },
});

const mkSqlProblem = (over = {}) => SQLProblem.create({
  problemNumber: Math.floor(Math.random() * 100000),
  title: `SQL ${Math.random().toString(36).slice(2, 8)}`,
  description: 'Find customers whose referee is not null.',
  difficulty: 'easy',
  topic: 'Subquery',
  schemaTables: [{ tableName: 'Customer', columns: [{ name: 'id', type: 'int' }, { name: 'name', type: 'varchar' }] }],
  schemaSetupSQL: 'CREATE TABLE Customer (id INT, name VARCHAR(50), referee_id INT);',
  sampleTestCases: [
    { inputStateSQL: "INSERT INTO Customer VALUES (1,'a',3),(2,'b',NULL),(3,'c',4);", expectedOutputRows: [{ name: 'a' }, { name: 'c' }] },
  ],
  hiddenTestCases: [
    { inputStateSQL: "INSERT INTO Customer VALUES (9,'z',1);", expectedOutputRows: [{ name: 'z' }] },
  ],
  referenceSolutionSQL: 'SELECT name FROM Customer WHERE referee_id IS NOT NULL;',
  ...over,
});

/** Find the route layer for a method+path inside an express Router. */
const handlerFor = (router, method, path) => {
  const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);

// ===========================================================================
describe('P8 — SQL hidden test cases and answer-key protection', () => {
  it('the problem list endpoint never returns hidden tests, schema DDL or the reference solution', async () => {
    const user = await mkUser('S', 'sql@example.com');
    await mkSqlProblem();
    const handler = handlerFor(sqlRouter, 'get', '/problems');
    const res = mockRes();
    await handler({ user: { id: user._id.toString() }, query: {} }, res);

    expect(res.statusCode).toBe(200);
    const body = JSON.stringify(res.payload);
    expect(body).not.toContain('INSERT INTO Customer VALUES (9');
    expect(body).not.toContain('SELECT name FROM Customer WHERE referee_id IS NOT NULL');
    expect(body).not.toContain('hiddenTestCases');
    expect(body).not.toContain('schemaSetupSQL');
    expect(body).not.toContain('referenceSolutionSQL');
    // The displayable parts must survive.
    expect(body).toContain('Customer');
  });

  it('the problem detail endpoint hides the reference solution until the user has solved it', async () => {
    const user = await mkUser('S2', 'sql2@example.com');
    const p = await mkSqlProblem();
    const handler = handlerFor(sqlRouter, 'get', '/problems/:slug');

    const unsolved = mockRes();
    await handler({ user: { id: user._id.toString() }, params: { slug: p.slug } }, unsolved);
    expect(JSON.stringify(unsolved.payload)).not.toContain('referenceSolutionSQL');
    expect('hiddenTestCases' in unsolved.payload.data).toBe(false);
    expect(unsolved.payload.data.userStatus).toBeNull();

    await SQLSubmission.create({
      user: user._id, problem: p._id, query: 'SELECT 1', status: 'accepted', type: 'submit',
      passedTestCases: 2, totalTestCases: 2, runtimeMs: 5,
    });
    const solved = mockRes();
    await handler({ user: { id: user._id.toString() }, params: { slug: p.slug } }, solved);
    expect(solved.payload.data.userStatus).toBe('solved');
  });

  it('the submission list endpoint is scoped to the requesting user', async () => {
    const a = await mkUser('A', 'a-sql@example.com');
    const b = await mkUser('B', 'b-sql@example.com');
    const p = await mkSqlProblem();
    await SQLSubmission.create({
      user: a._id, problem: p._id, query: 'A_SECRET_QUERY', status: 'accepted', type: 'submit',
      passedTestCases: 2, totalTestCases: 2, runtimeMs: 5,
    });

    const handler = handlerFor(sqlRouter, 'get', '/submissions');
    const res = mockRes();
    await handler({ user: { id: b._id.toString() }, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.payload.data).toHaveLength(0);
    expect(JSON.stringify(res.payload)).not.toContain('A_SECRET_QUERY');
  });

  it('shapeSqlResults redacts every case beyond the visible sample count', () => {
    const results = [
      { input: 'INS_PUBLIC', expectedOutput: '[a]', actualOutput: '[a]', errorType: null, isSample: true },
      { input: 'INS_HIDDEN', expectedOutput: '[z]', actualOutput: '[zz]', errorMessage: 'mismatch', isSample: false },
    ];
    const shaped = shapeSqlResults(results, 1);
    expect(shaped[0].input).toBe('INS_PUBLIC');
    expect(shaped[1].input).toBeNull();
    expect(shaped[1].expectedOutput).toBeNull();
    expect(shaped[1].actualOutput).toBeNull();
    expect(shaped[1].errorMessage).toBeNull();
    expect(shaped[1].isSample).toBe(false);
  });

  it('a run with zero executable cases can never be reported as accepted', () => {
    expect(summarizeSqlResults([]).status).toBe('runtime_error');
  });

  it('all cases passing yields accepted; a wrong answer yields wrong_answer', () => {
    expect(summarizeSqlResults([{ passed: true }, { passed: true }]).status).toBe('accepted');
    const wrong = summarizeSqlResults([{ passed: true }, { passed: false, errorType: 'wrong_answer' }]);
    expect(wrong.status).toBe('wrong_answer');
    expect(wrong.firstError).toBeNull();
  });

  it('a SQL error is reported as an error, never silently as a wrong answer', () => {
    const s = summarizeSqlResults([{ passed: false, errorType: 'syntax_error', errorMessage: 'near FRO' }]);
    expect(s.status).toBe('syntax_error');
    expect(s.firstError).toBe('near FRO');
  });

  it('row normalisation makes SQL column-name casing irrelevant to the comparison', () => {
    const a = normalizeSqlRows([{ NAME: 'x', Id: 1 }]);
    const b = normalizeSqlRows([{ name: 'x', id: 1 }]);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

  return layer ? layer.route.stack[layer.route.stack.length - 1].handle : null;
};

function mockRes() {
  const res = { statusCode: 200, payload: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.payload = b; return res; };
  return res;
}

// ===========================================================================
describe('P9 — recommendation engine (real data, explainable, honest empty state)', () => {
  it('the fallback is an explicit empty state, never a padded list', async () => {
    const u = await mkUser('New', 'new@example.com');
    const rec = await generateRecommendations(u._id);
    expect(rec.hasEnoughData).toBe(false);
    expect(rec.recommendations).toEqual([]);
    expect(rec.message).toBe('Not enough data yet. Solve more problems to generate personalized recommendations.');
  });

  it('weak topics come from real per-topic accuracy, not from a hard-coded list', async () => {
    const u = await mkUser('Learner', 'learner@example.com');
    const dp = await CodingProblem.create({
      problemId: 'DP-1', title: 'Coin Change', description: 'x'.repeat(120),
      difficulty: 'medium', topic: 'Dynamic Programming', tags: ['dynamic-programming'],
      isActive: true,
    });
    // Dynamic Programming: 5 attempts, 1 solved (weak).
    // Trees: 3 DISTINCT problems solved from 3 attempts (strong). Note this uses
    // three different problems on purpose: three Accepted submissions of ONE
    // problem is 1 solved problem, which is the same unique-solved rule the rest
    // of the platform uses.
    for (let i = 0; i < 4; i++) {
      await CodeSubmission.create({
        user: u._id, problem: dp._id, language: 'javascript', code: 'x',
        verdict: 'WrongAnswer', category: 'dsa', totalTestCases: 3, passedTestCases: 0,
      });
    }
    await CodeSubmission.create({
      user: u._id, problem: dp._id, language: 'javascript', code: 'x',
      verdict: 'Accepted', category: 'dsa', totalTestCases: 3, passedTestCases: 3,
    });
    for (let i = 0; i < 3; i++) {
      const t = await CodingProblem.create({
        problemId: `TR-${i + 1}`, title: `Tree Problem ${i + 1}`, description: 'x'.repeat(120),
        difficulty: 'easy', topic: 'Trees', tags: ['trees'],
        isActive: true,
      });
      await CodeSubmission.create({
        user: u._id, problem: t._id, language: 'javascript', code: 'x',
        verdict: 'Accepted', category: 'dsa', totalTestCases: 3, passedTestCases: 3,
      });
    }

    const rec = await generateRecommendations(u._id);
    expect(rec.hasEnoughData).toBe(true);
    const weak = rec.weakTopics.map((w) => w.key);
    expect(weak).toContain('dynamic programming');
    expect(weak).not.toContain('trees');

    const dpEntry = rec.weakTopics.find((w) => w.key === 'dynamic programming');
    expect(dpEntry.attempts).toBe(5);
    expect(dpEntry.solved).toBe(1);
    expect(dpEntry.accuracy).toBeLessThan(50);
  });

  it('every recommendation is explainable and carries its score breakdown', async () => {
    const u = await mkUser('Explainer', 'exp@example.com');
    const dp = await CodingProblem.create({
      problemId: 'DP-2', title: 'LIS', description: 'x'.repeat(120),
      difficulty: 'medium', topic: 'Dynamic Programming', tags: ['dynamic-programming'],
      isActive: true,
    });
    const cand = await CodingProblem.create({
      problemId: 'DP-3', title: 'LIS Again', description: 'x'.repeat(120),
      difficulty: 'medium', topic: 'Dynamic Programming', tags: ['dynamic-programming'],
      isActive: true,
    });
    for (let i = 0; i < 4; i++) {
      await CodeSubmission.create({
        user: u._id, problem: dp._id, language: 'javascript', code: 'x',
        verdict: 'WrongAnswer', category: 'dsa', totalTestCases: 3, passedTestCases: 0,
      });
    }

    const rec = await generateRecommendations(u._id);
    expect(rec.recommendations.length).toBeGreaterThan(0);
    rec.recommendations.forEach((r) => {
      expect(typeof r.reason).toBe('string');
      expect(r.reason.length).toBeGreaterThan(0);
      expect(r.scoreBreakdown).toBeDefined();
      ['weakness', 'novelty', 'difficultyFit', 'popularity']
        .forEach((k) => expect(r.scoreBreakdown).toHaveProperty(k));
    });
    expect(rec.recommendations.map((r) => String(r._id))).toContain(String(cand._id));
  });

  it('recommendations are ordered by descending score', async () => {
    const u = await mkUser('Ordered', 'ord@example.com');
    const p = await CodingProblem.create({
      problemId: 'T-1', title: 'Graph Traverse', description: 'x'.repeat(120),
      difficulty: 'medium', topic: 'Graphs', tags: ['graphs'], isActive: true,
    });
    for (let i = 0; i < 4; i++) {
      await CodeSubmission.create({
        user: u._id, problem: p._id, language: 'javascript', code: 'x',
        verdict: 'WrongAnswer', category: 'dsa', totalTestCases: 3, passedTestCases: 0,
      });
    }
    const rec = await generateRecommendations(u._id);
    const scores = rec.recommendations.map((r) => r.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('the model contract (weights and thresholds) is published in the response', async () => {
    const u = await mkUser('Contract', 'contract@example.com');
    const rec = await generateRecommendations(u._id);
    expect(rec.model.name).toBe('weighted-topic-weakness-ranker');
    expect(rec.model.weights).toEqual(WEIGHTS);
    expect(rec.model.thresholds.minAttemptsPerTopic).toBe(MIN_ATTEMPTS_PER_TOPIC);
    expect(rec.model.smoothing).toMatch(/Beta/);
  });

  it('feature reporting reflects only what the user actually did', async () => {
    const u = await mkUser('Feat', 'feat@example.com');
    const p = await CodingProblem.create({
      problemId: 'F-1', title: 'Stack Min', description: 'x'.repeat(120),
      difficulty: 'easy', topic: 'Stacks', tags: ['stack'], isActive: true,
    });
    await CodeSubmission.create({
      user: u._id, problem: p._id, language: 'javascript', code: 'x',
      verdict: 'Accepted', category: 'dsa', totalTestCases: 3, passedTestCases: 3,
    });
    const rec = await generateRecommendations(u._id);
    expect(rec.features.totalAttempts).toBe(1);
    expect(rec.features.uniqueSolved).toBe(1);
    expect(rec.weakTopics).toHaveLength(0);
    // Domains with no data are reported as null, not as a fabricated zero.
    expect(rec.crossDomain.sql).toBeNull();
    expect(rec.crossDomain.aptitude).toBeNull();
  });


  // ---- pure-function unit tests (no database needed) ---------------------
  it('Bayesian smoothing pulls small samples toward the prior', () => {
    // (0 + 0.5*4) / (1 + 4) = 0.4 — a single miss reads as "needs more data",
    // not as a 0% skill rating.
    expect(smoothedAccuracy(0, 1)).toBeCloseTo(0.4, 2);
    // A large sample is dominated by the observed data, not by the prior.
    expect(smoothedAccuracy(0, 100)).toBeLessThan(0.1);
    expect(smoothedAccuracy(90, 100)).toBeGreaterThan(0.8);
  });

  it('identifyWeakTopics ignores topics below the attempt threshold', () => {
    const stats = new Map([
      ['thin', { attempts: 1, solved: 0, lastAttempt: Date.now() }],
      ['real', { attempts: 10, solved: 2, lastAttempt: Date.now() }],
    ]);
    const { weak } = identifyWeakTopics(stats);
    expect(weak.map((w) => w.key)).toEqual(['real']);
  });

  it('a weak topic raises a candidate score above an unrelated one', () => {
    const topicStats = new Map([
      ['graphs', { attempts: 8, solved: 1, lastAttempt: Date.now(), label: 'graphs' }],
    ]);
    const ctx = { topicStats, recommendedDifficulty: 'medium', staleTopics: new Map() };
    const weakPick = scoreCandidate(
      { difficulty: 'medium', topic: 'Graphs', tags: ['graphs'], acceptanceRate: 40 }, ctx);
    const otherPick = scoreCandidate(
      { difficulty: 'medium', topic: 'Strings', tags: ['strings'], acceptanceRate: 40 }, ctx);
    expect(weakPick.breakdown.weakness).toBeGreaterThan(0);
    expect(otherPick.breakdown.weakness).toBe(0);
    expect(weakPick.score).toBeGreaterThan(otherPick.score);
    expect(weakPick.reason).toMatch(/graphs/);
  });

  it('the recommended difficulty follows demonstrated ability', () => {
    const clearingMedium = new Map([
      ['easy', { attempts: 10, solved: 9, lastAttempt: Date.now() }],
      ['medium', { attempts: 10, solved: 7, lastAttempt: Date.now() }],
    ]);
    expect(recommendedDifficulty(clearingMedium)).toBe('hard');
    expect(recommendedDifficulty(new Map())).toBeNull();
  });
});

