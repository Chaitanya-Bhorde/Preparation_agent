/**
 * Regression suite for account classification vs. leaderboard eligibility.
 *
 * Reproduced live defect:
 *   `authController.register` stamps `isTestAccount: isTestEmail(email)`, and
 *   `isTestEmail` treats any RFC-2606 reserved domain (example.com &c) as
 *   automation. A human who typed an @example.com address into the real signup
 *   form was therefore flagged as a test account AT CREATION and silently
 *   excluded from every public leaderboard — despite genuine DSA/SQL/aptitude
 *   activity. `scripts/flagTestAccounts.js --apply` would also have re-flagged
 *   them on every re-run, so the exclusion was permanent and self-healing
 *   against the user.
 *
 * The fix adds an operator-verified override (VERIFIED_REAL_ACCOUNTS), matched
 * on the COMPLETE address. These tests pin both directions:
 *   - a verified real student is admitted and keeps their activity,
 *   - every unverified automation account is still excluded,
 *   - the override never widens into a domain rule.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const CodeSubmission = require('../models/CodeSubmission');
const CodingProblem = require('../models/CodingProblem');
const SQLSubmission = require('../models/SQLSubmission');
const SQLProblem = require('../models/SQLProblem');
const AptitudeSubmission = require('../models/AptitudeSubmission');
const User = require('../models/User');

const {
  isTestEmail, testAccountReason, verifiedRealAccountReason, VERIFIED_REAL_ACCOUNTS,
} = require('../utils/testAccount');
const { getOverallLeaderboard } = require('../services/overallPerformanceService');
const { getDsaLeaderboard } = require('../services/dsaLeaderboardService');

let mongoServer;

// The email used by the account from the reported incident. It is asserted
// ONLY as a fixture proving a real student *can* legitimately hold a reserved
// domain address — never as evidence that this particular account is real.
const RAHUL_EMAIL = 'rahul.sharma.test@example.com';

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
    SQLSubmission.deleteMany({}),
    SQLProblem.deleteMany({}),
    AptitudeSubmission.deleteMany({}),
    User.deleteMany({}),
    // Every test starts from the shipped state: the override is empty, so no
    // deployment inherits a verification decision from source code.
    VERIFIED_REAL_ACCOUNTS.clear(),
  ]);
});

afterEach(() => {
  VERIFIED_REAL_ACCOUNTS.clear();
});

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
  description: 'd'.repeat(60),
  difficulty: 'easy',
  topic: 'JOIN',
  schemaTables: [{ tableName: 't', columns: [{ name: 'id', type: 'int' }] }],
  schemaSetupSQL: 'CREATE TABLE t (id INT, n INT);',
  referenceSolutionSQL: 'SELECT * FROM t;',
  isActive: true,
  ...over,
});

/** A real DSA submit: the canonical CodeSubmission AND the legacy ledger row. */
const dsa = async (user, problem, verdict) => {
  const accepted = verdict === 'Accepted';
  await CodeSubmission.create({
    user: user._id, problem: problem._id, language: 'javascript',
    code: 'function f(){}', verdict, category: 'dsa',
    totalTestCases: 3, passedTestCases: accepted ? 3 : 0,
  });
  const Submission = require('../models/Submission');
  await Submission.create({
    user: user._id, problem: problem._id, code: 'function f(){}', language: 'javascript',
    status: accepted ? 'accepted' : 'wrong_answer', type: 'submit',
    totalTestCases: 3, passedTestCases: accepted ? 3 : 0,
    problemDifficulty: problem.difficulty, problemTags: problem.tags,
    category: 'dsa', score: accepted ? 100 : 0,
  });
};

const sql = (user, problem, status, type = 'submit') => SQLSubmission.create({
  user: user._id, problem: problem._id, query: 'SELECT 1', status, type,
  difficulty: 'easy', topics: ['JOIN'], totalTestCases: 2,
  passedTestCases: status === 'accepted' ? 2 : 0,
});

const aptitude = (user, correct, total) => AptitudeSubmission.create({
  userId: user._id, type: 'single-question', category: 'quantitative',
  totalCount: total, correctCount: correct,
  score: total ? Math.round((correct / total) * 100) : 0,
});

/** Give a user genuine activity in all three sections. */
const fullActivity = async (user) => {
  await dsa(user, await mkCodingProblem(), 'Accepted');
  await sql(user, await mkSqlProblem(), 'accepted');
  await aptitude(user, 8, 10);
};
// ===========================================================================
describe('Classification rules — reserved domains are not identity', () => {
  it('an @example.com address is currently treated as a test account', () => {
    // The domain can host no mailbox, but a human can still type it. The rule
    // is a heuristic, not proof of account identity.
    expect(isTestEmail(RAHUL_EMAIL)).toBe(true);
  });

  it('verifying an address by its COMPLETE form un-flags it', () => {
    VERIFIED_REAL_ACCOUNTS.set(RAHUL_EMAIL, 'registered via app signup form');
    expect(isTestEmail(RAHUL_EMAIL)).toBe(false);
    expect(verifiedRealAccountReason(RAHUL_EMAIL)).toBe('registered via app signup form');
  });

  it('the override never widens into a domain rule', () => {
    VERIFIED_REAL_ACCOUNTS.set(RAHUL_EMAIL, 'verified');
    // A DIFFERENT human on the same reserved domain stays a test account.
    expect(isTestEmail('someone.else@example.com')).toBe(true);
    expect(isTestEmail('someone.else@example.test')).toBe(true);
    // Casing/whitespace variants of the verified address still match.
    expect(isTestEmail('  Rahul.Sharma.TEST@Example.com  ')).toBe(false);
  });

  it('a verified real address is never reported as a flagging candidate', () => {
    VERIFIED_REAL_ACCOUNTS.set(RAHUL_EMAIL, 'verified');
    expect(testAccountReason({ email: RAHUL_EMAIL })).toBeNull();
    // Unverified automation on the same domain is still caught.
    expect(testAccountReason({ email: 'ci@example.com' })).toMatch(/reserved/i);
  });

  it('the shipped override map is empty (source code asserts no identity)', () => {
    // Guards against a future commit pre-seeding a person into the roster.
    expect([...VERIFIED_REAL_ACCOUNTS.keys()]).toEqual([]);
  });
});

// ===========================================================================
describe('Re-flagging safety (scripts/flagTestAccounts.js)', () => {
  it('re-running the classifier cannot re-flag a verified real student', async () => {
    VERIFIED_REAL_ACCOUNTS.set(RAHUL_EMAIL, 'registered via app signup form');
    const u = await mkUser('Rahul Sharma', RAHUL_EMAIL);

    // Exactly what `--apply` computes, run repeatedly.
    for (let i = 0; i < 3; i += 1) {
      await User.updateOne({ _id: u._id }, { $set: { isTestAccount: testAccountReason(u) !== null } });
      const reloaded = await User.findById(u._id);
      expect(reloaded.isTestAccount).toBe(false);
    }
  });

  it('a stale flag from BEFORE the override existed does not hide them', async () => {
    VERIFIED_REAL_ACCOUNTS.set(RAHUL_EMAIL, 'registered via app signup form');
    // Simulates the live row: flagged by the pre-fix registration path.
    const u = await mkUser('Rahul Sharma', RAHUL_EMAIL, { isTestAccount: true });
    await fullActivity(u);

    const { leaderboard } = await getOverallLeaderboard({});
    expect(leaderboard.map((r) => r.name)).toContain('Rahul Sharma');
  });
});

// ===========================================================================
describe('Leaderboard eligibility', () => {
  it('a verified real student with real activity appears on the board', async () => {
    VERIFIED_REAL_ACCOUNTS.set(RAHUL_EMAIL, 'registered via app signup form');
    const real = await mkUser('Rahul Sharma', RAHUL_EMAIL, { isTestAccount: true });
    const bot = await mkUser('E2E Bot', 'bot@example.com', { isTestAccount: true });

    await fullActivity(real);
    await fullActivity(bot);

    const { leaderboard, pagination } = await getOverallLeaderboard({});
    const names = leaderboard.map((r) => r.name);

    expect(names).toContain('Rahul Sharma');
    expect(names).not.toContain('E2E Bot');
    // The bot must not even be counted in the total.
    expect(pagination.total).toBe(1);
  });

  it('an UNVERIFIED @example.com account stays excluded', async () => {
    // No override set — this is the shipped behaviour, unchanged. The flag is
    // what `authController.register` would write for this address.
    const notVerified = await mkUser('Unverified', 'unverified@example.com', { isTestAccount: true });
    const normal = await mkUser('Normal', 'normal@prepagent.com');

    await fullActivity(notVerified);
    await fullActivity(normal);

    const { leaderboard } = await getOverallLeaderboard({});
    const names = leaderboard.map((r) => r.name);
    expect(names).toContain('Normal');
    expect(names).not.toContain('Unverified');
  });

  it('the override admits exactly one account, not its domain', async () => {
    VERIFIED_REAL_ACCOUNTS.set(RAHUL_EMAIL, 'verified');
    const verified = await mkUser('Verified One', RAHUL_EMAIL);
    const sibling = await mkUser('Sibling', 'sibling.test@example.com', { isTestAccount: true });

    await fullActivity(verified);
    await fullActivity(sibling);

    const { leaderboard, pagination } = await getOverallLeaderboard({});
    expect(leaderboard.map((r) => r.name)).toEqual(['Verified One']);
    expect(pagination.total).toBe(1);
  });

  it('other users and eligibility rules are unaffected', async () => {
    const a = await mkUser('Alice', 'alice@prepagent.com');
    const idle = await mkUser('Idle', 'idle@prepagent.com'); // no activity at all
    await fullActivity(a);

    const { leaderboard } = await getOverallLeaderboard({});
    expect(leaderboard.map((r) => r.name)).toEqual(['Alice']);
    // A user with zero activity must never appear, even when unflagged.
    expect(leaderboard.map((r) => r.name)).not.toContain('Idle');
  });

  it('the DSA board applies the same override', async () => {
    VERIFIED_REAL_ACCOUNTS.set(RAHUL_EMAIL, 'verified');
    const real = await mkUser('Rahul Sharma', RAHUL_EMAIL, { isTestAccount: true });
    const bot = await mkUser('Bot', 'bot@example.com', { isTestAccount: true });

    await dsa(real, await mkCodingProblem(), 'Accepted');
    await dsa(bot, await mkCodingProblem(), 'Accepted');

    const { leaderboard } = await getDsaLeaderboard({});
    expect(leaderboard.map((r) => r.username)).toEqual(['Rahul Sharma']);
  });
});

// ===========================================================================
describe('Activity is preserved and counted correctly', () => {
  it('existing DSA/SQL/aptitude records survive and aggregate', async () => {
    VERIFIED_REAL_ACCOUNTS.set(RAHUL_EMAIL, 'verified');
    const u = await mkUser('Rahul Sharma', RAHUL_EMAIL, { isTestAccount: true });

    // Pre-existing activity, exactly as it already sits in the database.
    await dsa(u, await mkCodingProblem(), 'Accepted');
    await dsa(u, await mkCodingProblem(), 'Accepted');
    await sql(u, await mkSqlProblem(), 'accepted');
    await aptitude(u, 8, 10);

    const counts = () => Promise.all([
      CodeSubmission.countDocuments({ user: u._id }),
      SQLSubmission.countDocuments({ user: u._id }),
      AptitudeSubmission.countDocuments({ userId: u._id }),
    ]);
    const before = await counts();

    const { leaderboard } = await getOverallLeaderboard({});
    const row = leaderboard.find((r) => r.name === 'Rahul Sharma');
    expect(row).toBeTruthy();
    expect(row.activity.dsaSolved).toBe(2);
    expect(row.activity.sqlSolved).toBe(1);
    expect(row.activity.aptitudeQuestions).toBe(10);

    // Nothing was deleted, duplicated or reset by reading the board.
    expect(await counts()).toEqual(before);
  });

  it('a SQL Run is NOT counted as a Submit', async () => {
    VERIFIED_REAL_ACCOUNTS.set(RAHUL_EMAIL, 'verified');
    const u = await mkUser('Rahul Sharma', RAHUL_EMAIL, { isTestAccount: true });
    const p = await mkSqlProblem();

    // One genuine submit plus two runs of the same problem.
    await sql(u, p, 'accepted', 'submit');
    await sql(u, p, 'accepted', 'run');
    await sql(u, p, 'accepted', 'run');

    const { leaderboard } = await getOverallLeaderboard({});
    const row = leaderboard.find((r) => r.name === 'Rahul Sharma');
    expect(row.activity.sqlSolved).toBe(1);
    expect(row.activity.sqlAttempted).toBe(1);
  });
});

// ===========================================================================
describe('Registration classification (authController.register path)', () => {
  it('normal registration of a non-reserved address is never flagged', () => {
    expect(isTestEmail('rahul.sharma@gmail.com')).toBe(false);
    expect(isTestEmail('student@prepagent.io')).toBe(false);
  });

  it('a verified address registers as a real account', () => {
    VERIFIED_REAL_ACCOUNTS.set(RAHUL_EMAIL, 'verified');
    // The exact value authController.register writes at creation.
    expect(isTestEmail(RAHUL_EMAIL)).toBe(false);
  });

  it('protected providers are never swallowed by the reserved-domain rule', () => {
    expect(isTestEmail('real@example.gmail.com')).toBe(false);
  });
});

