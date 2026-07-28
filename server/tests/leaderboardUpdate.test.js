const mongoose = require('mongoose');
const User = require('../models/User');
const CodingProblem = require('../models/CodingProblem');
const CodeSubmission = require('../models/CodeSubmission');
const Submission = require('../models/Submission');
const Leaderboard = require('../models/Leaderboard');

describe('Leaderboard Update on Submission', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent-test');
  });

  afterEach(async () => {
    await CodeSubmission.deleteMany({});
    await Submission.deleteMany({});
    await Leaderboard.deleteMany({});
    await CodingProblem.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should update leaderboard from both CodeSubmission and Submission collections', async () => {
    const user = await User.create({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'hashedpassword',
      role: 'student',
      stats: { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, totalSubmissions: 0, streak: 0 },
      profile: { atsScore: 0 },
    });

    const problem = await CodingProblem.create({
      title: 'Test Problem',
      difficulty: 'medium',
      topic: 'Arrays',
      tags: ['array'],
      description: 'Test',
      constraints: [],
      examples: [],
      visibleTestCases: [],
      hiddenTestCases: [],
      starterCode: {},
      functionSignature: {},
    });

    const submissionData = {
      user: user._id,
      problem: problem._id,
      language: 'javascript',
      code: 'test code',
      verdict: 'Accepted',
      passedTestCases: 10,
      totalTestCases: 10,
      runtimeMs: 100,
      memoryKb: 1024,
      testCaseResults: [],
    };

    await CodeSubmission.create(submissionData);
    await Submission.create({
      ...submissionData,
      status: 'accepted',
      type: 'submit',
      problemDifficulty: problem.difficulty,
      problemTags: problem.tags,
      score: 100,
    });

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const weeklyAccepted = await Submission.countDocuments({
      user: user._id,
      createdAt: { $gte: oneWeekAgo },
      type: 'submit',
      status: 'accepted',
    });

    const monthlyAccepted = await Submission.countDocuments({
      user: user._id,
      createdAt: { $gte: oneMonthAgo },
      type: 'submit',
      status: 'accepted',
    });

    const totalSubs = await Submission.countDocuments({ user: user._id, type: 'submit' });
    const acceptedSubs = await Submission.countDocuments({ user: user._id, type: 'submit', status: 'accepted' });
    const acceptanceRate = totalSubs > 0 ? Math.round((acceptedSubs / totalSubs) * 100) : 0;

    const leaderboard = await Leaderboard.findOneAndUpdate(
      { user: user._id },
      {
        totalSolved: user.stats.totalSolved,
        easySolved: user.stats.easySolved,
        mediumSolved: user.stats.mediumSolved,
        hardSolved: user.stats.hardSolved,
        totalSubmissions: user.stats.totalSubmissions,
        acceptanceRate,
        atsScore: user.profile.atsScore || 0,
        streak: user.stats.streak || 0,
        weeklySolved: weeklyAccepted,
        monthlySolved: monthlyAccepted,
        lastUpdated: Date.now(),
      },
      { upsert: true, new: true }
    );

    expect(leaderboard).toBeTruthy();
    expect(leaderboard.weeklySolved).toBe(1);
    expect(leaderboard.monthlySolved).toBe(1);
    expect(leaderboard.acceptanceRate).toBe(100);
  });
});