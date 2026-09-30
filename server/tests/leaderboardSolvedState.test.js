/**
 * Regression suite for the DSA leaderboard, solved-state, test-account
 * isolation and hidden-test-protection fixes.
 *
 * Reproduced live defects:
 *   - `userstats` had 0 documents, so /api/leaderboard/dsa fell back to a stale
 *     snapshot and real users (e.g. "manan") never appeared.
 *   - `$unwind` does not promote a looked-up document's fields, so
 *     `{ $match: { isTestAccount: { $ne: true } } }` matched the MISSING
 *     top-level field and let every flagged test account back onto the board.
 *   - `mapProblemForResponse` re-published `hiddenTests` as `hiddenTestCases`.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const CodeSubmission = require('../models/CodeSubmission');
const CodingProblem = require('../models/CodingProblem');
const User = require('../models/User');

const { getDsaLeaderboard, dsaRankingPipeline } = require('../services/dsaLeaderboardService');
const codingProblemController = require('../controllers/codingProblemController');
const { isTestEmail, testAccountReason } = require('../utils/testAccount');

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
    CodingProblem.deleteMany({}),
    User.deleteMany({}),
  ]);
});

const mkUser = (name, email, extra = {}) => User.create({
  name, email, password: 'hashedpassword', role: 'student',
  stats: { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, totalSubmissions: 0, streak: 0 },
  profile: { atsScore: 0 },
  ...extra,
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

const ac = (user, problem) => CodeSubmission.create({
  user: user._id, problem: problem._id, language: 'javascript',
  code: 'function f(){return 1;}', verdict: 'Accepted', category: 'dsa',
  passedTestCases: 3, totalTestCases: 3,
});

// ===========================================================================
describe('P5 — DSA leaderboard correctness', () => {
  it('User A: Two Sum accepted 3x appears ONCE with solved=1', async () => {
    const a = await mkUser('A', 'a@example.com');
    const two = await mkProblem({ title: 'Two Sum' });
    await ac(a, two); await ac(a, two); await ac(a, two);

    const { leaderboard, pagination } = await getDsaLeaderboard({});
    const row = leaderboard.find((r) => String(r.userId) === String(a._id));
    expect(leaderboard.filter((r) => String(r.userId) === String(a._id))).toHaveLength(1);
    expect(row.solvedCount).toBe(1);
    expect(row.acceptedOnSolved).toBe(3); // submission count is reported separately
    expect(pagination.total).toBe(1);
  });

  it('User B: two different problems accepted => solved=2', async () => {
    const b = await mkUser('B', 'b@example.com');
    await ac(b, await mkProblem({ title: 'Two Sum' }));
    await ac(b, await mkProblem({ title: 'Three Sum' }));

    const { leaderboard } = await getDsaLeaderboard({});
    const row = leaderboard.find((r) => String(r.userId) === String(b._id));
    expect(row.solvedCount).toBe(2);
  });

  it('ranks by UNIQUE solved problems, not by raw accepted submissions', async () => {
    const spammer = await mkUser('Spammer', 'spam@example.com');
    const p = await mkProblem({ title: 'One' });
    for (let i = 0; i < 5; i++) await ac(spammer, p);

    const grinder = await mkUser('Grinder', 'grind@example.com');
    await ac(grinder, await mkProblem({ title: 'A' }));
    await ac(grinder, await mkProblem({ title: 'B' }));

    const { leaderboard } = await getDsaLeaderboard({});
    expect(leaderboard[0].username).toBe('Grinder');
    expect(leaderboard[0].solvedCount).toBe(2);
    expect(leaderboard[1].username).toBe('Spammer');
    expect(leaderboard[1].solvedCount).toBe(1);
    expect(leaderboard[1].acceptedOnSolved).toBe(5);
  });

  it('a user with no Accepted submission does not appear at all', async () => {
    const u = await mkUser('Never', 'never@example.com');
    await CodeSubmission.create({
      user: u._id, problem: (await mkProblem())._id, language: 'javascript',
      code: 'x', verdict: 'WrongAnswer', category: 'dsa', totalTestCases: 3, passedTestCases: 0,
    });
    const { leaderboard, pagination } = await getDsaLeaderboard({});
    expect(leaderboard.find((r) => String(r.userId) === String(u._id))).toBeUndefined();
    expect(pagination.total).toBe(0);
  });

  it('pagination splits the ranking without dropping or duplicating rows', async () => {
    for (let i = 0; i < 3; i++) {
      const u = await mkUser(`U${i}`, `u${i}@example.com`);
      for (let j = 0; j <= i; j++) await ac(u, await mkProblem({ title: `U${i}-${j}` }));
    }
    const p1 = await getDsaLeaderboard({ page: 1, limit: 2 });
    const p2 = await getDsaLeaderboard({ page: 2, limit: 2 });
    expect(p1.leaderboard.map((r) => r.username)).toEqual(['U2', 'U1']);
    expect(p2.leaderboard.map((r) => r.username)).toEqual(['U0']);
    expect(p1.pagination.total).toBe(3);
    expect(p1.pagination.pages).toBe(2);
  });
});

// ===========================================================================
describe('P6 — test-account isolation', () => {
  it('a flagged test account never reaches the leaderboard', async () => {
    const bot = await mkUser('E2E', 'e2e@example.com', { isTestAccount: true });
    const human = await mkUser('Real', 'real@prepagent.com');
    await ac(bot, await mkProblem({ title: 'Bot1' }));
    await ac(human, await mkProblem({ title: 'Real1' }));

    const rows = await CodeSubmission.aggregate(dsaRankingPipeline());
    expect(rows.find((r) => String(r.userId) === String(bot._id))).toBeUndefined();
    expect(rows.find((r) => String(r.userId) === String(human._id))).toBeDefined();
  });

  it('the filter uses the qualified path, so a MISSING flag does not match $ne:true', async () => {
    // This is the exact bug: `$unwind` keeps the looked-up document under its
    // own field, so an unqualified `isTestAccount` match evaluates against a
    // missing field and `$ne: true` would let the account through.
    const bot = await mkUser('Bot2', 'bot2@example.com', { isTestAccount: true });
    await ac(bot, await mkProblem());
    const rows = await CodeSubmission.aggregate(dsaRankingPipeline());
    expect(rows).toHaveLength(0);
  });

  it('an account with NO flag (field absent) is treated as a real user', async () => {
    const u = await mkUser('Unflagged', 'unflagged@prepagent.io');
    await User.updateOne({ _id: u._id }, { $unset: { isTestAccount: '' } });
    await ac(u, await mkProblem());
    const { leaderboard } = await getDsaLeaderboard({});
    expect(leaderboard.map((r) => r.username)).toContain('Unflagged');
  });
});

// ===========================================================================
describe('P6 — test-account classifier', () => {
  it('flags RFC-reserved example domains and their subdomains', () => {
    expect(isTestEmail('runner@example.com')).toBe(true);
    expect(isTestEmail('x@example.org')).toBe(true);
    expect(isTestEmail('x@sub.example.net')).toBe(true);
    expect(isTestEmail('ci@build.example.com')).toBe(true);
  });

  it('flags the .test TLD reserved by RFC 6761', () => {
    expect(isTestEmail('ci@prepagent.test')).toBe(true);
  });

  it('never flags a real mailbox domain', () => {
    ['aman@gmail.com', 'manan@gmail.com', 'x@outlook.com', 'x@yahoo.com', 'x@prepagent.com']
      .forEach((email) => expect(isTestEmail(email)).toBe(false));
  });

  it('does not flag a real user whose display name looks like a test', () => {
    expect(testAccountReason({ name: 'Test User', email: 'student@gmail.com' })).toBeNull();
  });

  it('reports a human-readable reason for every match', () => {
    expect(testAccountReason({ email: 'a@example.com' })).toMatch(/RFC 2606/);
    expect(testAccountReason({ email: 'a@prepagent.test' })).toMatch(/RFC 6761/);
    expect(testAccountReason({ email: 'a@gmail.com' })).toBeNull();
  });
});

// ===========================================================================
describe('P4/Security — solved state and hidden tests', () => {
  it('mapProblemForResponse never exposes hidden tests or the reference solution', async () => {
    await mkProblem();
    const p = await CodingProblem.findOneAndUpdate({}, {
      $set: {
        sampleTests: [{ input: 'in', output: 'out', explanation: 'why' }],
        hiddenTests: [
          { input: 'SECRET_INPUT_1', output: 'SECRET_EXPECTED_1' },
          { input: 'SECRET_INPUT_2', output: 'SECRET_EXPECTED_2' },
        ],
        referenceSolution: { code: 'function solve(){return "ANSWER_KEY"}', language: 'javascript' },
        likedBy: [new mongoose.Types.ObjectId()],
      },
    }, { new: true }).lean();

    const mapped = codingProblemController.mapProblemForResponse(p);
    expect('hiddenTests' in mapped).toBe(false);
    expect('hiddenTestCases' in mapped).toBe(false);
    expect('referenceSolution' in mapped).toBe(false);
    expect('likedBy' in mapped).toBe(false);
    const serialised = JSON.stringify(mapped);
    expect(serialised).not.toContain('SECRET_INPUT');
    expect(serialised).not.toContain('SECRET_EXPECTED');
    expect(serialised).not.toContain('ANSWER_KEY');
    // Visible samples must survive — this is a redaction, not a wipe.
    expect(mapped.visibleTestCases).toHaveLength(1);
    expect(mapped.examples[0].output).toBe('out');
  });

  it('only an Accepted submission makes a problem solved', async () => {
    const u = await mkUser('S', 's@example.com');
    const p = await mkProblem();
    for (const verdict of ['WrongAnswer', 'CompileError', 'RuntimeError', 'TLE']) {
      await CodeSubmission.create({
        user: u._id, problem: p._id, language: 'javascript', code: 'x',
        verdict, category: 'dsa', totalTestCases: 3, passedTestCases: 0,
      });
    }
    expect(await CodeSubmission.findOne({ user: u._id, problem: p._id, verdict: 'Accepted' })).toBeNull();

    await ac(u, p);
    expect(await CodeSubmission.findOne({ user: u._id, problem: p._id, verdict: 'Accepted' })).not.toBeNull();
  });

  it('WA after a previous AC still reports the problem as solved', async () => {
    const u = await mkUser('S3', 's3@example.com');
    const p = await mkProblem();
    await ac(u, p);
    await CodeSubmission.create({
      user: u._id, problem: p._id, language: 'javascript', code: 'x',
      verdict: 'WrongAnswer', category: 'dsa', totalTestCases: 3, passedTestCases: 0,
    });
    const solved = await CodeSubmission.findOne({ user: u._id, problem: p._id, verdict: 'Accepted' });
    expect(solved).not.toBeNull();
  });

  it('stats never report a negative attempted or unsolved count', async () => {
    const u = await mkUser('S2', 's2@example.com');
    const p = await mkProblem();
    await ac(u, p);
    await CodeSubmission.create({
      user: u._id, problem: p._id, language: 'javascript', code: 'x',
      verdict: 'WrongAnswer', category: 'dsa', totalTestCases: 3, passedTestCases: 0,
    });

    const res = { statusCode: 200, payload: null };
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (b) => { res.payload = b; return res; };
    await codingProblemController.getCodingProblemStats({ user: { id: u._id.toString() } }, res);

    expect(res.statusCode).toBe(200);
    const d = res.payload.data;
    expect(d.solved).toBe(1);
    expect(d.attempted).toBe(0);
    expect(d.unsolved).toBe(d.total - 1);
  });

  it('a submission pointing at a deleted problem never inflates attempted', async () => {
    const u = await mkUser('S4', 's4@example.com');
    await CodeSubmission.create({
      user: u._id, problem: new mongoose.Types.ObjectId(), language: 'javascript',
      code: 'x', verdict: 'WrongAnswer', category: 'dsa', totalTestCases: 3, passedTestCases: 0,
    });
    const res = { statusCode: 200, payload: null };
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (b) => { res.payload = b; return res; };
    await codingProblemController.getCodingProblemStats({ user: { id: u._id.toString() } }, res);
    expect(res.payload.data.attempted).toBe(0);
    expect(res.payload.data.unsolved).toBe(res.payload.data.total);
  });
});

// ===========================================================================
// REGRESSION: an Accepted submission must actually PERSIST.
//
// The hidden-case redaction stores `input: ''` / `expected: ''` for hidden
// cases. Those paths were declared `required: true`, so every submission
// containing a hidden test case failed Mongoose validation and the route
// returned HTTP 500. No Accepted verdict was ever saved, so the problem card
// could never turn green — while every service-level unit test still passed,
// because none of them persisted a real submission.
describe('P4 — an Accepted submission persists and turns the card green', () => {
  it('stores a submission whose hidden cases are redacted to empty strings', async () => {
    const u = await mkUser('Green', 'green@example.com');
    const p = await mkProblem();

    // Exactly the shape persistSubmissionRecords builds: visible cases carry
    // content, hidden cases are blanked.
    const saved = await CodeSubmission.create({
      user: u._id,
      problem: p._id,
      language: 'javascript',
      code: 'function f(){return 1;}',
      verdict: 'Accepted',
      category: 'dsa',
      passedTestCases: 5,
      totalTestCases: 5,
      testCaseResults: [
        { input: 'VISIBLE_IN', expected: 'VISIBLE_OUT', actualOutput: 'VISIBLE_OUT', passed: true, isSample: true },
        { input: '', expected: '', actualOutput: '', passed: true, isSample: false },
        { input: '', expected: '', actualOutput: '', passed: true, isSample: false },
      ],
    });

    const found = await CodeSubmission.findById(saved._id).lean();
    expect(found).not.toBeNull();
    expect(found.verdict).toBe('Accepted');
    expect(found.testCaseResults).toHaveLength(3);
    expect(found.testCaseResults[0].input).toBe('VISIBLE_IN');
    expect(found.testCaseResults[1].input).toBe('');
    expect(found.testCaseResults[1].expected).toBe('');
  });

  it('the schema does not require input/expected on a stored case', () => {
    const caseSchema = CodeSubmission.schema.path('testCaseResults').schema;
    // Mongoose reports isRequired as undefined when no validator is attached,
    // so assert "not required" rather than a strict false.
    expect(caseSchema.path('input').isRequired).toBeFalsy();
    expect(caseSchema.path('expected').isRequired).toBeFalsy();
  });

  it('a full submit cycle leaves the problem solvable: card green, count 1', async () => {
    const u = await mkUser('Cycle', 'cycle@example.com');
    const p = await mkProblem();

    // A wrong attempt first, then two accepted ones.
    for (const verdict of ['WrongAnswer', 'Accepted', 'Accepted']) {
      await CodeSubmission.create({
        user: u._id, problem: p._id, language: 'javascript', code: 'function f(){}',
        verdict, category: 'dsa', passedTestCases: verdict === 'Accepted' ? 5 : 0, totalTestCases: 5,
        testCaseResults: [
          { input: 'in', expected: 'out', actualOutput: 'out', passed: true, isSample: true },
          { input: '', expected: '', actualOutput: '', passed: true, isSample: false },
        ],
      });
    }

    const res = { statusCode: 200, payload: null };
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (b) => { res.payload = b; return res; };
    await codingProblemController.getCodingProblemStats({ user: { id: u._id.toString() } }, res);
    expect(res.payload.data.solved).toBe(1);
    expect(res.payload.data.attempted).toBe(0);
    expect(res.payload.data.unsolved).toBe(res.payload.data.total - 1);

    const { computeDsaProgress } = require('../services/dsaProgressService');
    const progress = await computeDsaProgress(u._id);
    expect(progress.totalSubmissions).toBe(3);
    expect(progress.totalSolved).toBe(1);
  });

  it('a WRONG answer leaves the card unsolved even with redacted hidden cases', async () => {
    const u = await mkUser('NotGreen', 'notgreen@example.com');
    const p = await mkProblem();
    await CodeSubmission.create({
      user: u._id, problem: p._id, language: 'javascript', code: 'function f(){}',
      verdict: 'WrongAnswer', category: 'dsa', passedTestCases: 0, totalTestCases: 5,
      testCaseResults: [
        { input: 'in', expected: 'out', actualOutput: 'wrong', passed: false, isSample: true },
        { input: '', expected: '', actualOutput: '', passed: false, isSample: false },
      ],
    });
    const { computeDsaProgress } = require('../services/dsaProgressService');
    const progress = await computeDsaProgress(u._id);
    expect(progress.totalSolved).toBe(0);
    expect(progress.totalSubmissions).toBe(1);
  });
});

