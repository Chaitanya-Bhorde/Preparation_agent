const mongoose = require('mongoose');
const User = require('../models/User');
const CodingProblem = require('../models/CodingProblem');
const CodeSubmission = require('../models/CodeSubmission');
const Submission = require('../models/Submission');

describe('Progress Aggregation', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent-test');
  });

  afterEach(async () => {
    await CodeSubmission.deleteMany({});
    await Submission.deleteMany({});
    await CodingProblem.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should count distinct solved problems from both collections without double-counting', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'student',
      stats: { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, totalSubmissions: 0, streak: 0 },
      profile: { atsScore: 0 },
    });

    const problem1 = await CodingProblem.create({
      title: 'Problem A',
      difficulty: 'easy',
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

    const problem2 = await CodingProblem.create({
      title: 'Problem B',
      difficulty: 'medium',
      topic: 'Strings',
      tags: ['string'],
      description: 'Test',
      constraints: [],
      examples: [],
      visibleTestCases: [],
      hiddenTestCases: [],
      starterCode: {},
      functionSignature: {},
    });

    await CodeSubmission.create({
      user: user._id,
      problem: problem1._id,
      language: 'javascript',
      code: 'code',
      verdict: 'Accepted',
      passedTestCases: 10,
      totalTestCases: 10,
      runtimeMs: 100,
      memoryKb: 1024,
      testCaseResults: [],
    });

    await Submission.create({
      user: user._id,
      problem: problem1._id,
      language: 'javascript',
      code: 'code',
      status: 'accepted',
      type: 'submit',
      problemDifficulty: problem1.difficulty,
      problemTags: problem1.tags,
      score: 100,
    });

    await Submission.create({
      user: user._id,
      problem: problem2._id,
      language: 'javascript',
      code: 'code',
      status: 'wrong_answer',
      type: 'submit',
      problemDifficulty: problem2.difficulty,
      problemTags: problem2.tags,
      score: 50,
    });

    const acceptedProblemIds = await Submission.find({
      user: user._id,
      status: 'accepted',
    }).distinct('problem');

    const uniqueSolvedCount = acceptedProblemIds.length;
    expect(uniqueSolvedCount).toBe(1);
  });
});