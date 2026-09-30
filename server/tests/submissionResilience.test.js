const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const CodeSubmission = require('../models/CodeSubmission');
const Submission = require('../models/Submission');
const SQLSubmission = require('../models/SQLSubmission');
const CodingProblem = require('../models/CodingProblem');
const User = require('../models/User');
const topicController = require('../controllers/topicController');
const codingProblemController = require('../controllers/codingProblemController');

function mockRes() {
  const res = { statusCode: 200, payload: null };
  res.status = (c) => {
    res.statusCode = c;
    return res;
  };
  res.json = (b) => {
    res.payload = b;
    return res;
  };
  return res;
}

describe('Submission indexes and dangling-reference resilience (P2)', () => {
  let mongoServer;
  let user;
  let liveProblemId;
  let danglingProblemId;

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
      SQLSubmission.deleteMany({}),
      CodingProblem.deleteMany({}),
      User.deleteMany({}),
    ]);
    user = await User.create({
      name: 'U',
      email: `u-${Date.now()}@example.com`,
      password: 'hashedpassword',
      role: 'student',
      stats: { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, totalSubmissions: 0, streak: 0 },
      profile: { atsScore: 0 },
    });
    const live = await CodingProblem.create({
      problemId: 'LIVE-1',
      title: 'Live Problem',
      slug: 'live-problem',
      topic: 'Arrays',
      description: 'A live problem used by the resilience suite.',
      difficulty: 'easy',
      tags: ['Array'],
      category: 'dsa',
      isActive: true,
    });
    liveProblemId = live._id;
    // An ObjectId that deliberately has no CodingProblem document, mirroring
    // the 23 live rows that reference 6 deleted problems.
    danglingProblemId = new mongoose.Types.ObjectId();
  });

  describe('declared indexes', () => {
    const specOf = (schema) => schema.indexes().map(([fields]) => JSON.stringify(fields));

    it('CodeSubmission declares the two query-backed compounds', () => {
      const specs = specOf(CodeSubmission.schema);
      expect(specs).toContain(JSON.stringify({ user: 1, createdAt: -1 }));
      expect(specs).toContain(JSON.stringify({ user: 1, problem: 1 }));
    });

    it('Submission declares the three query-backed indexes', () => {
      const specs = specOf(Submission.schema);
      expect(specs).toContain(JSON.stringify({ user: 1, type: 1 }));
      expect(specs).toContain(JSON.stringify({ user: 1, createdAt: -1 }));
      expect(specs).toContain(JSON.stringify({ type: 1, status: 1 }));
    });

    it('declares no duplicate index definitions', () => {
      // Compare the field specs themselves: schema.indexes() does not
      // necessarily populate options.name for implicitly-named indexes.
      for (const model of [CodeSubmission, Submission, SQLSubmission]) {
        const specs = model.schema.indexes().map(([fields]) => JSON.stringify(fields));
        expect(new Set(specs).size).toBe(specs.length);
      }
    });

    it('does not add a redundant standalone user/problem index', () => {
      expect(specOf(CodeSubmission.schema)).not.toContain(JSON.stringify({ user: 1 }));
      expect(specOf(CodeSubmission.schema)).not.toContain(JSON.stringify({ problem: 1 }));
    });

    it('leaves SQLSubmission indexes untouched', () => {
      const specs = specOf(SQLSubmission.schema);
      expect(specs).toContain(JSON.stringify({ user: 1 }));
      expect(specs).toContain(JSON.stringify({ problem: 1 }));
      expect(specs).toContain(JSON.stringify({ status: 1 }));
      expect(specs).toContain(JSON.stringify({ type: 1 }));
      expect(specs).toContain(JSON.stringify({ user: 1, problem: 1, type: 1, status: 1 }));
      expect(specs).toContain(JSON.stringify({ user: 1, createdAt: -1 }));
    });

    it('actually materialises the indexes on the server', async () => {
      await Promise.all([CodeSubmission.createIndexes(), Submission.createIndexes()]);
      const names = async (coll) =>
        (await mongoose.connection.db.collection(coll).indexes()).map((i) => i.name);
      const code = await names('codesubmissions');
      const sub = await names('submissions');
      expect(code).toEqual(expect.arrayContaining(['user_1_createdAt_-1', 'user_1_problem_1']));
      expect(sub).toEqual(
        expect.arrayContaining(['user_1_type_1', 'user_1_createdAt_-1', 'type_1_status_1'])
      );
      // The implicit PK index must always survive.
      expect(code).toContain('_id_');
      expect(sub).toContain('_id_');
    });
  });
describe('dangling CodeSubmission.problem references', () => {
    beforeEach(async () => {
      await CodeSubmission.create([
        {
          user: user._id,
          problem: liveProblemId,
          language: 'javascript',
          code: 'a',
          verdict: 'Accepted',
          category: 'dsa',
        },
        {
          user: user._id,
          problem: danglingProblemId, // references a deleted problem
          language: 'python',
          code: 'b',
          verdict: 'WrongAnswer',
          category: 'dsa',
        },
      ]);
    });

    it('history query still returns BOTH rows and does not crash', async () => {
      const query = { user: user._id };
      const rows = await CodeSubmission.find(query)
        .populate('problem', 'title slug difficulty tags')
        .sort({ createdAt: -1 })
        .lean();
      expect(rows).toHaveLength(2);
      // The dangling row survives with a null populated problem rather than
      // vanishing (identify it by its code, since problem is null).
      const dangling = rows.find((r) => r.code === 'b');
      expect(dangling).toBeDefined();
      expect(dangling.problem).toBeNull();
      const live = rows.find((r) => r.code === 'a');
      expect(live.problem.title).toBe('Live Problem');
    });

    it('countDocuments is unaffected by the dangling reference', async () => {
      await expect(CodeSubmission.countDocuments({ user: user._id })).resolves.toBe(2);
    });

    it('coding stats endpoint does not crash and ignores the orphan', async () => {
      const req = { user: { id: user._id.toString() } };
      const res = mockRes();
      await codingProblemController.getCodingProblemStats(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.payload.success).toBe(true);
      // Only the live problem is still solvable, so it is the single solved
      // entry. The orphan is a WrongAnswer row whose problem no longer exists,
      // so it must not be counted as a solvable attempt.
      expect(res.payload.data.total).toBe(1);
      expect(res.payload.data.solved).toBe(1);
      expect(res.payload.data.unsolved).toBe(0);
    });

    it('topic progress / analytics endpoint does not crash', async () => {
      const req = { user: { id: user._id.toString() }, params: {}, query: {} };
      const res = mockRes();
      await topicController.getTopicProgress(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.payload.success).toBe(true);
      expect(Array.isArray(res.payload.data.topics)).toBe(true);
      expect(Array.isArray(res.payload.data.dsaTopics)).toBe(true);
    });

    it('topic progress reports the resolvable problem and skips the orphan', async () => {
      const req = { user: { id: user._id.toString() }, params: {}, query: {} };
      const res = mockRes();
      await topicController.getTopicProgress(req, res);
      const topics = res.payload.data.topics;
      const array = topics.find((t) => t.topic === 'Array');
      // The live submission is grouped under its populated tag...
      expect(array).toBeDefined();
      expect(array.total).toBe(1);
      // ...while the orphan, which has no populated tags at all, is skipped
      // rather than throwing a null dereference.
      expect(topics.every((t) => t.total >= 1)).toBe(true);
    });
  });

  describe('happy-path submissions still work', () => {
    it('creates a CodeSubmission and reads it back via the history query', async () => {
      const created = await CodeSubmission.create({
        user: user._id,
        problem: liveProblemId,
        language: 'javascript',
        code: 'function f(){}',
        verdict: 'Accepted',
        category: 'dsa',
      });
      expect(created._id).toBeDefined();
      const found = await CodeSubmission.findOne({ user: user._id, problem: liveProblemId })
        .populate('problem', 'title slug difficulty tags')
        .lean();
      expect(found.verdict).toBe('Accepted');
      expect(found.problem.title).toBe('Live Problem');
    });

    it('analytics-style { user, type } query returns the user submits', async () => {
      await Submission.create({
        user: user._id,
        problem: liveProblemId,
        code: 'x',
        language: 'javascript',
        type: 'submit',
        status: 'accepted',
      });
      await Submission.create({
        user: user._id,
        problem: liveProblemId,
        code: 'x',
        language: 'javascript',
        type: 'run',
        status: 'pending',
      });
      const subs = await Submission.find({ user: user._id, type: 'submit' })
        .select('status problem category createdAt')
        .lean();
      expect(subs).toHaveLength(1);
      expect(subs[0].status).toBe('accepted');
    });
  });
});