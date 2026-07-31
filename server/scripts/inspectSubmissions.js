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
  if (user && problem) {
    const docs = await Submission.find({ user: user._id, problem: problem._id, category: 'sql' }).sort({ createdAt: -1 }).limit(10);
    console.log('SQL CATEGORY SUBMISSIONS COUNT', docs.length);
    docs.forEach((d, i) => console.log('DOC', i, JSON.stringify({ _id: d._id, status: d.status, category: d.category, language: d.language, score: d.score })));
  }
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });