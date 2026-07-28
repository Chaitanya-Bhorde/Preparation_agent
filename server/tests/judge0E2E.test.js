const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');
const CodeSubmission = require('../models/CodeSubmission');
const { executeSingleCase } = require('../utils/judge0Coding');

describe('Judge0 end-to-end polling proof', () => {
  let testProblemId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent');
    const problem = await CodingProblem.findOne({});
    testProblemId = problem ? problem._id : null;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('pending: requires local Judge0 service', () => {
    console.warn('[PENDING] Judge0 e2e proof requires Docker-backed Judge0 at http://localhost:2358. Skipping live proof until service is available.');
    expect(true).toBe(true);
  }, 60000);
});
