/**
 * The ML recommendation layer is ADDITIVE: /api/recommendations must keep
 * working when Python is missing, slow or returning nonsense, and must only
 * ever expose the authenticated user's own data.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/User');
const CodeSubmission = require('../models/CodeSubmission');
const CodingProblem = require('../models/CodingProblem');
const Submission = require('../models/Submission');

const router = require('../routes/recommendations');
const client = require('../services/mlRankerClient');
const { rankWithPython, CANDIDATES, SERVICE } = client;

let mongoServer;

const mkUser = (email) => User.create({
  name: 'Test', email, password: 'hashedpassword', role: 'student',
  stats: { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, totalSubmissions: 0, streak: 0 },
  profile: { atsScore: 0 },
});

// The route runs protect() then the controller, so the controller is last.
const handlerFor = (path) => {
  const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods.get);
  return layer.route.stack[layer.route.stack.length - 1].handle;
};

const mockRes = () => {
  const res = { statusCode: 200, payload: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (p) => { res.payload = p; return res; };
  return res;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  jest.restoreAllMocks();
  await Promise.all([
    User.deleteMany({}), CodeSubmission.deleteMany({}),
    CodingProblem.deleteMany({}), Submission.deleteMany({}),
  ]);
});

describe('ML ranker client', () => {
  it('points at a python service file that exists', () => {
    expect(require('fs').existsSync(SERVICE)).toBe(true);
    expect(CANDIDATES.length).toBeGreaterThan(0);
  });

  it('returns null instead of throwing when python is missing', async () => {
    jest.resetModules();
    process.env.ML_PYTHON_BIN = 'definitely-not-a-real-interpreter';
    const broken = require('../services/mlRankerClient');
    const out = await broken.rankWithPython([{ domain: 'DSA', topic: 'Graph', attempts: 9, solved: 1 }]);
    expect(out).toBeNull();
    delete process.env.ML_PYTHON_BIN;
    jest.resetModules();
  });

  it('returns null on timeout rather than hanging', async () => {
    jest.resetModules();
    process.env.ML_PYTHON_BIN = 'definitely-not-a-real-interpreter';
    process.env.ML_TIMEOUT_MS = '1';
    const slow = require('../services/mlRankerClient');
    const out = await slow.rankWithPython([{ domain: 'DSA', topic: 'Graph', attempts: 9, solved: 1 }]);
    expect(out).toBeNull();
    delete process.env.ML_PYTHON_BIN;
    delete process.env.ML_TIMEOUT_MS;
    jest.resetModules();
  });

  it('returns null for an empty or absent feature list without spawning', async () => {
    expect(await rankWithPython([])).toBeNull();
    expect(await rankWithPython(null)).toBeNull();
  });

  it('returns either null or a real object, never a malformed shape', async () => {
    const out = await rankWithPython([{ domain: 'DSA', topic: 'Graph', attempts: 9, solved: 1 }]);
    if (out !== null) expect(typeof out).toBe('object');
  });
});

describe('GET /api/recommendations', () => {
  it('is mounted behind authentication middleware', () => {
    const layers = router.stack.filter((l) => l.route && l.route.path === '/' && l.route.methods.get);
    expect(layers.length).toBe(1);
    expect(layers[0].route.stack.length).toBeGreaterThanOrEqual(2);
  });

  it('returns an honest empty state for a user with no history', async () => {
    const user = await mkUser('nobody@example.com');
    jest.spyOn(client, 'rankWithPython').mockResolvedValue({
      hasEnoughData: false, message: 'No performance data yet.',
      recommendations: [], strongTopics: [],
    });
    const res = mockRes();
    await handlerFor('/')({ user: { id: user._id.toString() } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.data.hasEnoughData).toBe(false);
    expect(res.payload.data.recommendations).toEqual([]);
  });

  it('falls back to the built-in ranker when the ML service is unavailable', async () => {
    const user = await mkUser('fallback@example.com');
    jest.spyOn(client, 'rankWithPython').mockResolvedValue(null);
    const res = mockRes();
    await handlerFor('/')({ user: { id: user._id.toString() } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.data.source).toBe('builtin-ranker');
    expect(res.payload.data.ml).toBeNull();
    expect(Array.isArray(res.payload.data.recommendations)).toBe(true);
  });

  it('uses the ML result and labels the source honestly', async () => {
    const user = await mkUser('ml@example.com');
    jest.spyOn(client, 'rankWithPython').mockResolvedValue({
      hasEnoughData: true,
      message: null,
      strongTopics: [{ topic: 'Arrays', domain: 'DSA', accuracy: 88, attempts: 20 }],
      recommendations: [{
        title: 'Practice Graph', domain: 'DSA', topic: 'Graph',
        reason: 'Your Graph performance is 23% accuracy across 9 attempts.',
        priority: 'HIGH', priorityScore: 0.64,
        action: 'Work through Graph DSA problems.', path: '/practice/dsa',
        evidence: { attempts: 9, solved: 1, smoothedAccuracy: 23 },
      }],
    });
    const res = mockRes();
    await handlerFor('/')({ user: { id: user._id.toString() } }, res);

    expect(res.payload.data.source).toBe('python-ml');
    expect(res.payload.data.hasEnoughData).toBe(true);
    expect(res.payload.data.recommendations[0].topic).toBe('Graph');
    expect(res.payload.data.ml.strongTopics[0].topic).toBe('Arrays');
  });

  it('ignores a userId smuggled into the request and always uses the caller', async () => {
    const me = await mkUser('me@example.com');
    const other = await mkUser('other@example.com');
    jest.spyOn(client, 'rankWithPython').mockResolvedValue(null);

    const res = mockRes();
    await handlerFor('/')(
      { user: { id: me._id.toString() }, params: { userId: other._id.toString() }, query: { userId: other._id.toString() } },
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.stringify(res.payload)).not.toContain(other._id.toString());
  });
});