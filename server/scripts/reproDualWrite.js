const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Submission = require('../models/Submission');
const User = require('../models/User');
const SQLProblem = require('../models/SQLProblem');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: 'test@example.com' });
  const problem = await SQLProblem.findOne({ slug: 'basic-select' });
  console.log('USER', user ? user._id : null);
  console.log('PROBLEM', problem ? problem._id : null);
  if (!user || !problem) {
    console.log('Missing user or problem');
    process.exit(1);
  }
  const before = await Submission.countDocuments({ user: user._id, problem: problem._id, category: 'sql' });
  console.log('BEFORE COUNT', before);
  const created = await Submission.create({
    user: user._id,
    problem: problem._id,
    code: 'SELECT * FROM users;',
    language: 'sql',
    status: 'accepted',
    type: 'submit',
    passedTestCases: 1,
    totalTestCases: 1,
    problemDifficulty: problem.difficulty,
    problemTags: problem.tags,
    category: 'sql',
    score: 100,
  });
  const after = await Submission.countDocuments({ user: user._id, problem: problem._id, category: 'sql' });
  console.log('AFTER COUNT', after);
  console.log('CREATED', JSON.stringify({ _id: created._id, status: created.status, category: created.category, language: created.language, score: created.score }));
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });