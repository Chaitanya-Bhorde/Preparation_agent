const mongoose = require('mongoose');
const User = require('../models/User');
const Problem = require('../models/Problem');
const PracticeHistory = require('../models/PracticeHistory');

describe('Practice History Endpoints', () => {
  let testUser;
  let problems = [];

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent-test');
  });

  afterEach(async () => {
    await PracticeHistory.deleteMany({});
    await Problem.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    testUser = await User.create({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'hashedpassword',
      role: 'student',
      stats: { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, totalSubmissions: 0, streak: 0 },
      profile: { atsScore: 0 },
    });

    const easyProblem = await Problem.create({
      title: 'Two Sum',
      difficulty: 'easy',
      tags: ['Array', 'Hash Table'],
      description: 'Test',
      testCases: [],
      functionSignature: {},
    });

    const mediumProblem = await Problem.create({
      title: 'Add Two Numbers',
      difficulty: 'medium',
      tags: ['Linked List', 'Math'],
      description: 'Test',
      testCases: [],
      functionSignature: {},
    });

    const hardProblem = await Problem.create({
      title: 'Merge K Sorted Lists',
      difficulty: 'hard',
      tags: ['Segment Tree', 'Binary Indexed Tree'],
      description: 'Test',
      testCases: [],
      functionSignature: {},
    });

    problems = [easyProblem, mediumProblem, hardProblem];
  });

  async function seedSubmissions() {
    await PracticeHistory.create({
      userId: testUser._id,
      problemId: problems[0]._id,
      problemTitle: 'Two Sum',
      problemSlug: 'two-sum',
      problemUrl: '/coding-problems/two-sum',
      difficulty: 'Easy',
      verdict: 'Accepted',
      language: 'JavaScript',
      attemptCount: 1,
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      code: 'function twoSum() {}',
      tags: ['Array', 'Hash Table'],
    });

    await PracticeHistory.create({
      userId: testUser._id,
      problemId: problems[1]._id,
      problemTitle: 'Add Two Numbers',
      problemSlug: 'add-two-numbers',
      problemUrl: '/coding-problems/add-two-numbers',
      difficulty: 'Medium',
      verdict: 'Wrong Answer',
      language: 'Python',
      attemptCount: 1,
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      code: 'def addTwoNumbers(): pass',
      tags: ['Linked List', 'Math'],
    });

    await PracticeHistory.create({
      userId: testUser._id,
      problemId: problems[1]._id,
      problemTitle: 'Add Two Numbers',
      problemSlug: 'add-two-numbers',
      problemUrl: '/coding-problems/add-two-numbers',
      difficulty: 'Medium',
      verdict: 'Accepted',
      language: 'Python',
      attemptCount: 2,
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      code: 'def addTwoNumbers(): pass',
      tags: ['Dynamic Programming', 'Segment Tree'],
    });

    await PracticeHistory.create({
      userId: testUser._id,
      problemId: problems[2]._id,
      problemTitle: 'Merge K Sorted Lists',
      problemSlug: 'merge-k-sorted-lists',
      problemUrl: '/coding-problems/merge-k-sorted-lists',
      difficulty: 'Hard',
      verdict: 'Runtime Error',
      language: 'Java',
      attemptCount: 1,
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      code: 'class Solution {}',
      tags: ['Segment Tree', 'Binary Indexed Tree'],
    });

    await PracticeHistory.create({
      userId: testUser._id,
      problemId: problems[0]._id,
      problemTitle: 'Two Sum',
      problemSlug: 'two-sum',
      problemUrl: '/coding-problems/two-sum',
      difficulty: 'Easy',
      verdict: 'Compilation Error',
      language: 'C++',
      attemptCount: 2,
      submittedAt: new Date(),
      code: '#include <bits/stdc++.h>',
      tags: ['Array', 'Hash Table'],
    });
  }

  it('should create a practice history record', async () => {
    await seedSubmissions();
    const count = await PracticeHistory.countDocuments({ userId: testUser._id });
    expect(count).toBe(5);
  });

  it('should return paginated history', async () => {
    await seedSubmissions();
    const controller = require('../controllers/practiceHistoryController');
    const req = { query: { userId: testUser._id.toString(), page: '1', limit: '3' }, user: { id: testUser._id.toString() } };
    const res = {
      status: (code) => ({
        json: (body) => {
          expect(code).toBe(200);
          expect(body.success).toBe(true);
          expect(body.data.length).toBeLessThanOrEqual(3);
          expect(body.total).toBe(5);
        },
      }),
    };
    await controller.getHistory(req, res);
  });

  it('should filter history by difficulty', async () => {
    await seedSubmissions();
    const controller = require('../controllers/practiceHistoryController');
    const req = { query: { userId: testUser._id.toString(), difficulty: 'Easy' }, user: { id: testUser._id.toString() } };
    const res = {
      status: (code) => ({
        json: (body) => {
          expect(code).toBe(200);
          expect(body.data.every((s) => s.difficulty === 'Easy')).toBe(true);
        },
      }),
    };
    await controller.getHistory(req, res);
  });

  it('should return summary stats', async () => {
    await seedSubmissions();
    const controller = require('../controllers/practiceHistoryController');
    const req = { params: { userId: testUser._id.toString() } };
    const res = {
      status: (code) => ({
        json: (body) => {
          expect(code).toBe(200);
          expect(body.data.totalSolved).toBe(2);
          expect(body.data.easySolved).toBe(1);
          expect(body.data.mediumSolved).toBe(1);
          expect(body.data.hardSolved).toBe(0);
          expect(body.data.totalSubmissions).toBe(5);
          expect(body.data.acceptanceRate).toBe(40);
        },
      }),
    };
    await controller.getSummary(req, res);
  });

  it('should return language breakdown', async () => {
    await seedSubmissions();
    const controller = require('../controllers/practiceHistoryController');
    const req = { params: { userId: testUser._id.toString() } };
    const res = {
      status: (code) => ({
        json: (body) => {
          expect(code).toBe(200);
          expect(body.data.length).toBeGreaterThan(0);
          const python = body.data.find((l) => l.language === 'Python');
          expect(python).toBeDefined();
          expect(python.solvedCount).toBe(1);
        },
      }),
    };
    await controller.getLanguages(req, res);
  });

  it('should return skills grouped by tier', async () => {
    await seedSubmissions();
    const controller = require('../controllers/practiceHistoryController');
    const req = { params: { userId: testUser._id.toString() } };
    const res = {
      status: (code) => ({
        json: (body) => {
          if (code !== 200) console.log('getSkills error:', body.message || body);
          expect(code).toBe(200);
          expect(body.data.Fundamental.length).toBeGreaterThan(0);
          expect(body.data.Intermediate.length).toBeGreaterThan(0);
          expect(body.data.Advanced.length).toBeGreaterThan(0);
        },
      }),
    };
    await controller.getSkills(req, res);
  });

  it('should return streak and heatmap data', async () => {
    await seedSubmissions();
    const controller = require('../controllers/practiceHistoryController');
    const req = { params: { userId: testUser._id.toString() }, query: { limit: '5' } };
    const res = {
      status: (code) => ({
        json: (body) => {
          if (code !== 200) console.log('getStreak error:', body.message || body);
          expect(code).toBe(200);
          expect(body.data).toHaveProperty('currentStreak');
          expect(body.data).toHaveProperty('maxStreak');
          expect(body.data).toHaveProperty('heatmap');
          expect(body.data).toHaveProperty('recentAccepted');
        },
      }),
    };
    await controller.getStreak(req, res);
  });

  it('should return recent accepted submissions', async () => {
    await seedSubmissions();
    const controller = require('../controllers/practiceHistoryController');
    const req = { params: { userId: testUser._id.toString() }, query: { limit: '3' } };
    const res = {
      status: (code) => ({
        json: (body) => {
          if (code !== 200) console.log('getRecentAccepted error:', body.message || body);
          expect(code).toBe(200);
          expect(body.data.length).toBeLessThanOrEqual(3);
          expect(body.data.every((s) => s.verdict === 'Accepted')).toBe(true);
        },
      }),
    };
    await controller.getRecentAccepted(req, res);
  });

  it('should create practice record from submission', async () => {
    const controller = require('../controllers/practiceHistoryController');
    const mockSubmission = {
      user: testUser._id,
      problem: problems[0]._id,
      status: 'accepted',
      language: 'javascript',
      code: 'function twoSum() {}',
      createdAt: new Date(),
    };
    const record = await controller.createPracticeRecord(mockSubmission);
    expect(record).not.toBeNull();
    expect(record.problemTitle).toBe('Two Sum');
    expect(record.verdict).toBe('Accepted');
    expect(record.language).toBe('JavaScript');
    expect(record.attemptCount).toBe(1);
  });
});
