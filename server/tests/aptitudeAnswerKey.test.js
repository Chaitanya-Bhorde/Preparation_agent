const http = require('http');
const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const AptitudeQuestion = require('../models/AptitudeQuestion');
const AptitudeMockTest = require('../models/AptitudeMockTest');
const User = require('../models/User');

// Fields that constitute the answer key. None may appear in a public payload.
const ANSWER_KEY_FIELDS = ['correctAnswer', 'explanation', 'solutionSteps'];

describe('Aptitude answer-key disclosure (P1 regression)', () => {
  let mongoServer;
  let server;
  let baseUrl;
  let topicId;
  let mockTestId;
  let user;
  let token;

  // Hermetic in-memory MongoDB, same pattern as tests/practiceHistory.test.js.
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // A real express app mounting the real router, so the route is exercised
    // exactly as deployed (projection included) over real HTTP.
    // middleware/auth.js reads `req.cookies.token`, so cookieParser() must be
    // mounted here exactly as server.js does at L58/L60 - otherwise `protect`
    // throws inside an async middleware (which Express 4 cannot catch) and the
    // request is never answered.
    const app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use(cookieParser());
    app.use('/api/aptitude', require('../routes/aptitude'));
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    topicId = new mongoose.Types.ObjectId();
    const mkOptions = (correctLabel, wrong) =>
      ['A', 'B', 'C', 'D'].map((label, i) => ({
        label,
        text: wrong[i],
        isCorrect: label === correctLabel,
      }));
    await AptitudeQuestion.create([
      {
        topicId,
        category: 'quantitative',
        topic: 'Percentages',
        questionText: 'What is 10% of 250?',
        options: mkOptions('B', ['15', '25', '30', '50']),
        correctAnswer: 'B',
        explanation: 'SECRET_EXPLANATION_MARKER',
        solutionSteps: ['SECRET_STEP_MARKER_1', 'SECRET_STEP_MARKER_2'],
        difficulty: 'easy',
        timeLimit: 60,
      },
      {
        topicId,
        category: 'quantitative',
        topic: 'Percentages',
        questionText: 'What is 20% of 500?',
        options: mkOptions('A', ['50', '100', '120', '250']),
        correctAnswer: 'A',
        explanation: 'SECRET_EXPLANATION_MARKER',
        solutionSteps: ['SECRET_STEP_MARKER_1'],
        difficulty: 'easy',
        timeLimit: 60,
      },
    ]);

    const q = await AptitudeQuestion.find({ topicId }).lean();
    mockTestId = (
      await AptitudeMockTest.create({
        name: 'Mock Paper 1',
        description: 'desc',
        duration: 30,
        totalQuestions: 2,
        passingScore: 50,
        category: 'quantitative',
        questionIds: q.map((x) => x._id),
      })
    )._id;

    user = await User.create({
      name: 'Admin User',
      email: `admin-${Date.now()}@example.com`,
      password: 'hashedpassword',
      role: 'admin',
      stats: { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, totalSubmissions: 0, streak: 0 },
      profile: { atsScore: 0 },
    });
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    // Node >=19 enables keep-alive on the global agent, so a lingering socket
    // would make server.close() hang and the Jest worker never exit.
    if (server) {
      if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  function request(path, { auth = false, method = 'GET', body } = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(baseUrl + path);
      const headers = {};
      if (auth) headers.authorization = `Bearer ${token}`;
      if (body) headers['content-type'] = 'application/json';
      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          method,
          headers,
          agent: false, // no keep-alive: lets the server close cleanly
        },
        (res) => {
          let raw = '';
          res.on('data', (c) => (raw += c));
          res.on('end', () => {
            let parsed;
            try {
              parsed = JSON.parse(raw);
            } catch {
              parsed = raw;
            }
            resolve({ status: res.statusCode, body: parsed });
          });
        }
      );
      req.on('error', reject);
      // Fail fast instead of burning the whole Jest timeout if a handler
      // never answers (Express 4 cannot catch async-middleware throws).
      req.setTimeout(10000, () => {
        req.destroy(new Error(`request timed out: ${method} ${path}`));
      });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  describe('GET /api/aptitude/questions/:topicId (public, unauthenticated)', () => {
    it('returns questions with HTTP 200', async () => {
      const res = await request(`/api/aptitude/questions/${topicId}`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.questions).toHaveLength(2);
    });

    it('does NOT return correctAnswer on any question', async () => {
      const res = await request(`/api/aptitude/questions/${topicId}`);
      for (const q of res.body.questions) {
        expect(q).not.toHaveProperty('correctAnswer');
        expect(JSON.stringify(q)).not.toContain('correctAnswer');
      }
    });

    it('does NOT return explanation', async () => {
      const res = await request(`/api/aptitude/questions/${topicId}`);
      for (const q of res.body.questions) {
        expect(q).not.toHaveProperty('explanation');
      }
      expect(JSON.stringify(res.body)).not.toContain('SECRET_EXPLANATION_MARKER');
    });

    it('does NOT return solutionSteps', async () => {
      const res = await request(`/api/aptitude/questions/${topicId}`);
      for (const q of res.body.questions) {
        expect(q).not.toHaveProperty('solutionSteps');
      }
      expect(JSON.stringify(res.body)).not.toContain('SECRET_STEP_MARKER');
    });

    it('leaks no answer key through the isCorrect option flag either', async () => {
      const res = await request(`/api/aptitude/questions/${topicId}`);
      for (const q of res.body.questions) {
        for (const opt of q.options || []) {
          expect(opt).not.toHaveProperty('isCorrect');
        }
      }
    });

    it('still returns the normal question fields', async () => {
      const res = await request(`/api/aptitude/questions/${topicId}`);
      const q = res.body.questions[0];
      expect(q).toHaveProperty('_id');
      expect(q).toHaveProperty('topicId');
      expect(q).toHaveProperty('category');
      expect(q).toHaveProperty('topic');
      expect(q).toHaveProperty('questionText');
      expect(q).toHaveProperty('difficulty');
      expect(q).toHaveProperty('timeLimit');
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options).toHaveLength(4);
      expect(q.options[0]).toHaveProperty('label');
      expect(q.options[0]).toHaveProperty('text');
      expect(res.body.counts).toHaveProperty('easy', 2);
    });
  });

  describe('authenticated access to the same public endpoint', () => {
    it('does NOT expose the answer key even when authenticated', async () => {
      const res = await request(`/api/aptitude/questions/${topicId}`, { auth: true });
      expect(res.status).toBe(200);
      for (const q of res.body.questions) {
        for (const f of ANSWER_KEY_FIELDS) expect(q).not.toHaveProperty(f);
      }
    });


  describe('scoring path still works', () => {
    it('grades answers and returns feedback via the protected endpoint', async () => {
      // GET /questions/:topicId applies no sort, so locate the intended
      // question by its text rather than relying on array order.
      const list = await request(`/api/aptitude/questions/${topicId}`);
      const target = list.body.questions.find((q) => q.questionText === 'What is 10% of 250?');
      expect(target).toBeDefined();
      const questionId = target._id;

      const correct = await request('/api/aptitude/submit-answer', {
        auth: true,
        method: 'POST',
        body: { questionId, selectedAnswer: 'B', timeTaken: 5 },
      });
      expect(correct.status).toBe(200);
      expect(correct.body.isCorrect).toBe(true);
      // The answer key is still available server-side on the scoring path.
      expect(correct.body.correctAnswer).toBe('B');
      expect(correct.body.explanation).toBe('SECRET_EXPLANATION_MARKER');
      expect(correct.body.solutionSteps).toEqual(['SECRET_STEP_MARKER_1', 'SECRET_STEP_MARKER_2']);

      const wrong = await request('/api/aptitude/submit-answer', {
        auth: true,
        method: 'POST',
        body: { questionId, selectedAnswer: 'C', timeTaken: 5 },
      });
      expect(wrong.status).toBe(200);
      expect(wrong.body.isCorrect).toBe(false);
    });

    it('still requires auth for the scoring endpoint', async () => {
      const list = await request(`/api/aptitude/questions/${topicId}`);
      const res = await request('/api/aptitude/submit-answer', {
        method: 'POST',
        body: { questionId: list.body.questions[0]._id, selectedAnswer: 'B' },
      });
      expect(res.status).toBe(401);
    });
  });

  describe('sibling endpoint GET /api/aptitude/mock/:mockTestId/questions', () => {
    it('remains correct - no answer key fields', async () => {
      const res = await request(`/api/aptitude/mock/${mockTestId}/questions`);
      expect(res.status).toBe(200);
      expect(res.body.questions).toHaveLength(2);
      for (const q of res.body.questions) {
        for (const f of ANSWER_KEY_FIELDS) expect(q).not.toHaveProperty(f);
      }
      expect(JSON.stringify(res.body)).not.toContain('SECRET_EXPLANATION_MARKER');
    });

    it('keeps the same projection as the public topic endpoint', async () => {
      const topic = await request(`/api/aptitude/questions/${topicId}`);
      const mock = await request(`/api/aptitude/mock/${mockTestId}/questions`);
      const keyOf = (o) => Object.keys(o).sort();
      expect(keyOf(mock.body.questions[0])).toEqual(keyOf(topic.body.questions[0]));
    });
  });
});

    it('does NOT expose the answer key for an admin-role token', async () => {
      expect(user.role).toBe('admin');
      const res = await request(`/api/aptitude/questions/${topicId}`, { auth: true });
      for (const q of res.body.questions) {
        for (const f of ANSWER_KEY_FIELDS) expect(q).not.toHaveProperty(f);
      }
    });
  });

