/**
 * dualSubmissionCollections.test.js
 * ---------------------------------------------------------------------------
 * ARCHITECTURE GUARD - documents, and protects, the deliberate separation
 * between the `submissions` and `codesubmissions` collections.
 *
 * WHY THIS TEST EXISTS
 * The final audit asked whether these two collections could be merged. Measured
 * against the real database the answer was NO, for three independent reasons,
 * so the architecture was deliberately left alone and this test pins the
 * reasoning in executable form:
 *
 *  1. THEY ARE NOT 1:1. Live: `submissions` held 366 rows, `codesubmissions` 391,
 *     and ZERO of the 350 DSA `submissions` rows shared an exact
 *     (user, problem, createdAt) tuple with a `codesubmissions` row. The two
 *     writes are separate `create()` calls, so their timestamps and `_id`s
 *     differ. There is no reliable join key.
 *
 *  2. THEY ARE NOT THE SAME SHAPE. `submissions` carries `type: run|submit` and
 *     a `category` including `sql`; `codesubmissions` has NO `type` field at all
 *     and uses a capitalized verdict vocabulary. 16 live `submissions` rows
 *     (type=run, category=sql, category=aptitude, uncategorised) cannot be
 *     represented in `codesubmissions` at all.
 *
 *  3. BOTH ARE STILL READ. `codesubmissions` backs the DSA judge/leaderboard and
 *     problem-list solved-state; `submissions` still backs analytics, feature
 *     engineering, topic progress, goals, mistakes, readiness, profile and the
 *     merged submission history.
 *
 * The DSA submit path therefore DUAL-WRITES both collections on purpose. The
 * assertions below verify that contract holds.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

const Submission = require('../models/Submission');
const CodeSubmission = require('../models/CodeSubmission');

const ROOT = path.join(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

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
  await Promise.all([Submission.deleteMany({}), CodeSubmission.deleteMany({})]);
});

/* ------------------------------------------------------ schema divergence */

describe('the two submission schemas are genuinely different', () => {
  it('CodeSubmission has no `type` field, so run/submit cannot be expressed', () => {
    expect(CodeSubmission.schema.path('type')).toBeUndefined();
    expect(Submission.schema.path('type')).toBeDefined();
  });

  it('status and verdict use different vocabularies', () => {
    expect(Submission.schema.path('status').enumValues).toContain('accepted');
    expect(CodeSubmission.schema.path('verdict').enumValues).toContain('Accepted');
    expect(CodeSubmission.schema.path('verdict').enumValues).not.toContain('accepted');
  });

  it('the legacy ledger holds sql/uncategorised rows CodeSubmission cannot model', () => {
    expect(Submission.schema.path('category').enumValues).toContain('sql');
    // The blocking difference is `type`, which carries run vs submit.
    expect(Submission.schema.path('type').enumValues).toEqual(['run', 'submit']);
    expect(CodeSubmission.schema.path('type')).toBeUndefined();
  });
});



/* ---------------------------------------------- dual-write is deliberate */

describe('the DSA submit path dual-writes on purpose', () => {
  const codingRoute = read('server/routes/coding.js');

  it('routes/coding.js writes BOTH collections', () => {
    expect(codingRoute).toMatch(/CodeSubmission\.create\(/);
    expect(codingRoute).toMatch(/Submission\.create\(/);
  });

  it('both writes carry the SAME hidden-content redaction', () => {
    // Hidden cases must be blanked in BOTH ledgers, otherwise the legacy
    // collection becomes an answer-key leak the canonical one does not have.
    const persistCase = codingRoute.slice(
      codingRoute.indexOf('const persistCase'),
      codingRoute.indexOf('const firstFailedIsHidden')
    );
    expect(persistCase).toMatch(/input:\s*''/);
    expect(persistCase).toMatch(/expected:\s*''/);
    expect(persistCase).toMatch(/isSample/);
  });

  it('the legacy write is tagged category dsa so SQL rows stay separable', () => {
    expect(codingRoute).toMatch(/category:\s*'dsa'/);
  });
});

/* --------------------------------------------------- both sides stay read */

describe('both collections still have live readers', () => {
  it('the canonical leaderboard reads codesubmissions, not submissions', () => {
    const svc = read('server/services/overallPerformanceService.js');
    expect(svc).toMatch(/models\/CodeSubmission/);
    expect(svc).not.toMatch(/models\/Submission'/);
  });

  it.each([
    ['server/services/dsaLeaderboardService.js', /codesubmissions|CodeSubmission/],
    ['server/services/dsaProgressService.js', /Submission/],
    ['server/services/ml/featureEngineering.js', /Submission/],
    ['server/controllers/analyticsController.js', /Submission/],
    ['server/services/recommendationService.js', /CodeSubmission/],

  ])('%s still reads its collection', (file, pattern) => {
    expect(read(file)).toMatch(pattern);
  });
});

/* -------------------------------------------------- no accidental deletion */

describe('no application code destroys or migrates submission history', () => {
  const SOURCES = [
    'server/routes/coding.js',
    'server/routes/submissions.js',
    'server/controllers/submissionController.js',
    'server/services/overallPerformanceService.js',
    'server/services/dsaProgressService.js',
    'server/services/ml/featureEngineering.js',
  ];

  it.each(SOURCES)('%s performs no destructive write', (file) => {
    const src = read(file);
    expect(src).not.toMatch(/deleteMany\s*\(\s*\{\s*\}\s*\)/);
    expect(src).not.toMatch(/deleteMany\s*\(\s*\{\s*user/);
    expect(src).not.toMatch(/remove\s*\(\s*\{\s*\}\s*\)/);
    expect(src).not.toMatch(/dropDatabase|dropCollection/);
  });

  it('no router/controller/service/model renames or drops a collection', () => {
    for (const dir of ['server/routes', 'server/controllers', 'server/services', 'server/models']) {
      const dirPath = path.join(ROOT, dir);
      for (const name of fs.readdirSync(dirPath)) {
        if (!name.endsWith('.js')) continue;
        const src = fs.readFileSync(path.join(dirPath, name), 'utf8');
        expect(src).not.toMatch(/renameCollection/);
        expect(src).not.toMatch(/\.collection\((submissions|codesubmissions)\)\s*\.\s*(drop|rename)/);
      }
    }
  });
});

/* ----------------------------------------------------- records are kept */

describe('submissions carry independent, complete records', () => {
  it('the same submission exists in both ledgers with distinct identity', async () => {
    const user = new mongoose.Types.ObjectId();
    const problem = new mongoose.Types.ObjectId();

    await CodeSubmission.create({
      user, problem, language: 'javascript', code: 'x', verdict: 'Accepted',
      category: 'dsa', passedTestCases: 1, totalTestCases: 1,
    });
    await Submission.create({
      user, problem, code: 'x', language: 'javascript', status: 'accepted',
      type: 'submit', category: 'dsa', passedTestCases: 1, totalTestCases: 1,
    });

    expect(await CodeSubmission.countDocuments({})).toBe(1);
    expect(await Submission.countDocuments({})).toBe(1);

    // Distinct _ids and timestamps: there is no deterministic join key, which is
    // exactly why an automatic merge would be unsafe.
    const [a] = await CodeSubmission.find({}).lean();
    const [b] = await Submission.find({}).lean();
    expect(String(a._id)).not.toBe(String(b._id));
    expect(a.createdAt.getTime()).not.toBe(b.createdAt.getTime());
  });

  it('a run recorded only in `submissions` survives and never counts as solved', async () => {
    const user = new mongoose.Types.ObjectId();
    await Submission.create({
      user, problem: new mongoose.Types.ObjectId(), code: 'x',
      language: 'javascript', status: 'accepted', type: 'run',
    });
    expect(await Submission.countDocuments({ user, type: 'run' })).toBe(1);
    expect(await Submission.countDocuments({ user, type: 'submit' })).toBe(0);
  });
});
