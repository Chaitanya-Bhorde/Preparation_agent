const express = require('express');
const http = require('http');

// Mock Judge0 execution utils so the route can be exercised with no live Judge0.
jest.mock('../utils/judge0Coding', () => {
  const sampleResults = [
    { passed: true, input: 'IN1', output: '1', expectedOutput: '1', executionTime: 10, memoryUsed: 100, errorType: null, errorMessage: null },
    { passed: true, input: 'IN2', output: '2', expectedOutput: '2', executionTime: 12, memoryUsed: 110, errorType: null, errorMessage: null },
  ];
  const hiddenResults = [
    { passed: false, input: 'HIDDEN_IN', output: 'WRONG', expectedOutput: 'HIDDEN_EXP', executionTime: 20, memoryUsed: 200, errorType: 'wrong', errorMessage: 'boom' },
  ];
  return {
    buildDriverFromSignature: jest.fn(() => '/*built*/'),
    runCode: jest.fn(),
    submitCode: jest.fn().mockResolvedValue([...sampleResults, ...hiddenResults]),
    computeVerdict: jest.fn(() => ({
      verdict: 'WrongAnswer',
      passedTestCases: 2,
      totalTestCases: 3,
      firstFailedInput: 'HIDDEN_IN',
      firstFailedExpected: 'HIDDEN_EXP',
      firstFailedActual: 'WRONG',
    })),
  };
});

// Mock streak util (no DB side effects).
jest.mock('../utils/streak', () => ({
  updateStreak: jest.fn().mockResolvedValue(),
}));

// Bypass auth; inject a fake logged-in user.
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => { req.user = { id: 'user-123', role: 'student' }; next(); },
  authorize: () => (req, res, next) => next(),
}));

// Mock models so no real DB calls happen.
function mockModel(overrides = {}) {
  return {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    findOneAndUpdate: jest.fn().mockResolvedValue({}),
    countDocuments: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
}

jest.mock('../models/CodingProblem', () => {
  const m = mockModel();
  m.findById = jest.fn().mockResolvedValue({
    _id: 'prob-1',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'easy',
    tags: ['Array', 'Hash Table'],
    visibleTestCases: [
      { input: 'IN1', expectedOutput: '1', isHidden: false },
      { input: 'IN2', expectedOutput: '2', isHidden: false },
    ],
    hiddenTestCases: [
      { input: 'HIDDEN_IN', expectedOutput: 'HIDDEN_EXP', isHidden: true },
    ],
    functionSignature: { javascript: { name: 'solve', params: [{ name: 'nums' }] } },
  });
  return m;
});
jest.mock('../models/CodeSubmission', () => ({
  create: jest.fn().mockResolvedValue({
    toObject: () => ({ runtimeMs: 50, memoryKb: 200 }),
    runtimeMs: 50,
    memoryKb: 200,
  }),
}));
jest.mock('../models/User', () => mockModel({ findById: jest.fn().mockResolvedValue({ stats: { totalSolved: 1 }, profile: { atsScore: 0 } }) }));
jest.mock('../models/Submission', () => mockModel({ findOne: jest.fn().mockResolvedValue(null) }));
jest.mock('../models/Leaderboard', () => mockModel());

const codingRouter = require('../routes/coding');

function startApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/coding', codingRouter);
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      const post = (path, body) => new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request({ port, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (res) => {
          let chunks = '';
          res.on('data', (c) => (chunks += c));
          res.on('end', () => {
            try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
            catch (e) { reject(e); }
          });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
      });
      resolve({ server, port, post });
    });
  });
}

describe('Submit endpoint: hidden test-case masking', () => {
  let ctx;
  beforeAll(async () => { ctx = await startApp(); });
  afterAll(() => ctx.server.close());

  it('runs sample cases but never leaks hidden case content over the network', async () => {
    const { status, body } = await ctx.post('/api/coding/submit', {
      problemId: 'prob-1',
      language: 'javascript',
      code: 'const solve = (nums) => 0;',
    });

    expect(status).toBe(201);
    expect(body.success).toBe(true);
    const tcs = body.data.testCaseResults;
    expect(tcs.length).toBe(3);

    // Sample cases keep their content.
    expect(tcs[0].isSample).toBe(true);
    expect(tcs[0].input).toBe('IN1');
    expect(tcs[0].expectedOutput).toBe('1');
    expect(tcs[0].actualOutput).toBe('1');

    // Hidden case: content fields MUST be null (never leaked).
    const hidden = tcs[2];
    expect(hidden.isSample).toBe(false);
    expect(hidden.input).toBeNull();
    expect(hidden.expectedOutput).toBeNull();
    expect(hidden.actualOutput).toBeNull();
    // Only pass/fail + timing survive for hidden cases.
    expect(hidden.passed).toBe(false);
    expect(hidden.executionTime).toBe(20);

    // firstFailed* must also be masked when the first failure is a hidden case.
    expect(body.data.firstFailedInput).toBeNull();
    expect(body.data.firstFailedExpected).toBeNull();
    expect(body.data.firstFailedActual).toBeNull();

    // Top-level aggregate verdict/totals are safe to expose.
    expect(body.data.verdict).toBe('WrongAnswer');
    expect(body.data.passedTestCases).toBe(2);
    expect(body.data.totalTestCases).toBe(3);
    expect(body.data.mode).toBe('submit');
  });
});
