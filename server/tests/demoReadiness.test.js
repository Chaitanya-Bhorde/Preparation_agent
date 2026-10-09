const http = require('http');
const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/User');
const CodeSubmission = require('../models/CodeSubmission');
const CodingProblem = require('../models/CodingProblem');
const AptitudeQuestion = require('../models/AptitudeQuestion');
const AptitudeTopic = require('../models/AptitudeTopic');
const AptitudeSubmission = require('../models/AptitudeSubmission');
const client = require('../services/mlRankerClient');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'demo-readiness-test-secret';

let mongoServer;
let server;
let baseUrl;

const mkUser = (email) => User.create({
  name: 'Demo', email, password: 'hashedpassword', role: 'student',
  stats: { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, totalSubmissions: 0, streak: 0 },
  profile: { atsScore: 0 },
});

const sign = (user) => jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET);

const request = async (path, { auth, method = 'GET', body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers.Cookie = `token=${sign(auth)}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let parsed = null;
  try { parsed = await res.json(); } catch { parsed = null; }
  return { status: res.status, body: parsed };
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use('/api/aptitude', require('../routes/aptitude'));
  app.use('/api/recommendations', require('../routes/recommendations'));
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  jest.restoreAllMocks();
  await Promise.all([
    User.deleteMany({}),
    CodeSubmission.deleteMany({}),
    CodingProblem.deleteMany({}),
    AptitudeQuestion.deleteMany({}),
    AptitudeTopic.deleteMany({}),
    AptitudeSubmission.deleteMany({}),
  ]);
});

describe('demo-readiness regression: stale weakTopics are never merged', () => {
  it('GET /api/recommendations ignores the legacy user.weakTopics field', async () => {
    const stale = await mkUser('stale@example.com');
    await User.findByIdAndUpdate(stale._id, { weakTopics: ['legacy-ghost-topic'] });
    jest.spyOn(client, 'rankWithPython').mockResolvedValue(null);

    const res = await request('/api/recommendations', { auth: stale });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.weakTopics).not.toContain('legacy-ghost-topic');
    expect(res.body.data.weakTopics).toEqual([]);
    expect(JSON.stringify(res.body.data)).not.toContain('legacy-ghost-topic');
  });
});

describe('demo-readiness regression: aptitude practice persists per answer', () => {
  it('POST /api/aptitude/submit-answer writes one user-scoped row per answer', async () => {
    const user = await mkUser('apt@example.com');
    const topic = await AptitudeTopic.create({ name: 'Percentages', category: 'quantitative' });
    const q = await AptitudeQuestion.create({
      topicId: topic._id,
      category: 'quantitative',
      topic: 'Percentages',
      questionText: 'What is 10% of 250?',
      options: [
        { label: 'A', text: '15', isCorrect: false },
        { label: 'B', text: '25', isCorrect: true },
        { label: 'C', text: '30', isCorrect: false },
        { label: 'D', text: '50', isCorrect: false },
      ],
      correctAnswer: 'B',
      explanation: 'Move the decimal point.',
      difficulty: 'easy',
      timeLimit: 60,
    });

    const ok = await request('/api/aptitude/submit-answer', {
      auth: user,
      method: 'POST',
      body: { questionId: q._id.toString(), selectedAnswer: 'B', timeTaken: 5 },
    });
    expect(ok.status).toBe(200);
    expect(ok.body.isCorrect).toBe(true);

    const bad = await request('/api/aptitude/submit-answer', {
      auth: user,
      method: 'POST',
      body: { questionId: q._id.toString(), selectedAnswer: 'C', timeTaken: 5 },
    });
    expect(bad.status).toBe(200);
    expect(bad.body.isCorrect).toBe(false);

    const rows = await AptitudeSubmission.find({ userId: user._id }).lean();
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.type === 'single-question')).toBe(true);
    expect(rows.every((r) => String(r.topicId) === String(topic._id))).toBe(true);
    expect(rows.filter((r) => r.correctCount === 1)).toHaveLength(1);
    expect(rows.filter((r) => r.correctCount === 0)).toHaveLength(1);

    const other = await mkUser('other@example.com');
    const otherRows = await AptitudeSubmission.find({ userId: other._id }).lean();
    expect(otherRows).toHaveLength(0);
  });
});
