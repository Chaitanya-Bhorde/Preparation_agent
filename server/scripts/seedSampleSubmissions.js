const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const User = require('../models/User');
const CodingProblem = require('../models/CodingProblem');
const SQLProblem = require('../models/SQLProblem');
const CodeSubmission = require('../models/CodeSubmission');
const SQLSubmission = require('../models/SQLSubmission');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent');

  let user = await User.findOne({ email: 'test@example.com' });
  if (!user) {
    user = await User.create({ name: 'Test User', email: 'test@example.com', password: 'test1234' });
    console.log('Created test user:', user._id);
  } else {
    console.log('Using test user:', user._id);
  }

  let dsaProblem = await CodingProblem.findOne({ slug: 'two-sum' });
  if (!dsaProblem) {
    try {
      dsaProblem = await CodingProblem.create({
        title: 'Two Sum',
        slug: 'two-sum',
        description: 'Given an array...',
        difficulty: 'easy',
        topic: 'Arrays',
        tags: ['arrays', 'hashing'],
        visibleTestCases: [{ input: '[2,7,11,15]', expectedOutput: '9' }],
        hiddenTestCases: [{ input: '[3,2,4]', expectedOutput: '6' }],
        starterCode: { javascript: 'function solve() {}' },
        functionSignature: { javascript: { name: 'solve', params: [], returnType: 'number' } },
      });
      console.log('Created DSA problem:', dsaProblem._id);
    } catch (e) {
      console.log('Two Sum creation skipped, fetching existing by title');
      dsaProblem = await CodingProblem.findOne({ title: 'Two Sum' });
      console.log('Using existing DSA problem:', dsaProblem._id);
    }
  } else {
    console.log('Using DSA problem:', dsaProblem._id);
  }

  let sqlProblem = await SQLProblem.findOne({ slug: 'basic-select' });
  if (!sqlProblem) {
    try {
      sqlProblem = await SQLProblem.create({
        title: 'Basic SELECT',
        slug: 'basic-select',
        description: 'Select all from users',
        difficulty: 'easy',
        topic: 'SQL Basics',
        tags: ['select'],
        sampleTestCases: [{ inputStateSQL: null, expectedOutputRows: [{id:1,name:'A'}] }],
        hiddenTestCases: [],
        schemaSetupSQL: 'CREATE TABLE users (id INT, name TEXT); INSERT INTO users VALUES (1,\'A\');',
        referenceSolutionSQL: 'SELECT * FROM users;',
      });
      console.log('Created SQL problem:', sqlProblem._id);
    } catch (e) {
      console.log('Basic SELECT creation skipped, fetching existing by title');
      sqlProblem = await SQLProblem.findOne({ title: 'Basic SELECT' });
      console.log('Using existing SQL problem:', sqlProblem._id);
    }
  } else {
    console.log('Using SQL problem:', sqlProblem._id);
  }

  const codeExists = await CodeSubmission.findOne({ user: user._id, problem: dsaProblem._id });
  if (!codeExists) {
    try {
      await CodeSubmission.create({ user: user._id, problem: dsaProblem._id, language: 'javascript', code: 'function solve() {}', verdict: 'Accepted', category: 'dsa' });
      console.log('Created CodeSubmission');
    } catch (e) {
      console.error('CodeSubmission create failed:', e.message);
    }
  } else {
    console.log('CodeSubmission already exists');
  }

  const sqlExists = await SQLSubmission.findOne({ user: user._id, problem: sqlProblem._id });
  if (!sqlExists) {
    try {
      await SQLSubmission.create({ user: user._id, problem: sqlProblem._id, submittedQuery: 'SELECT 1', status: 'passed', category: 'sql' });
      console.log('Created SQLSubmission');
    } catch (e) {
      console.error('SQLSubmission create failed:', e.message);
    }
  } else {
    console.log('SQLSubmission already exists');
  }

  await mongoose.disconnect();
  process.exit(0);
};
run().catch((err) => { console.error(err); process.exit(1); });