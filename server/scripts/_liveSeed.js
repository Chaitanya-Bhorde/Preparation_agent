const mongoose = require('mongoose');
const Submission = require('../models/Submission');

const DB = 'mongodb://localhost:27017/prepagent-live';
const A = '6a6efed5246d36f9ecbaf5bb';
const B = '6a6efed5246d36f9ecbaf5bc';
const C = '6a6efed5246d36f9ecbaf5bd';

const newId = () => new mongoose.Types.ObjectId();

async function run() {
  await mongoose.connect(DB);
  const subs = [];
  const mk = (user, problem, status, category, difficulty, tags, daysAgo) => {
    subs.push({
      user: new mongoose.Types.ObjectId(user),
      problem,
      code: 'x',
      language: 'javascript',
      status,
      type: 'submit',
      passedTestCases: status === 'accepted' ? 4 : 2,
      totalTestCases: 4,
      problemDifficulty: difficulty,
      problemTags: tags,
      category,
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    });
  };

  mk(A, newId(), 'accepted', 'dsa', 'easy', ['Array', 'Hash Table'], 5);
  mk(A, newId(), 'accepted', 'dsa', 'medium', ['Dynamic Programming'], 5);
  mk(A, newId(), 'wrong_answer', 'dsa', 'medium', ['Array'], 4);
  mk(A, newId(), 'accepted', 'sql', 'easy', ['Select', 'Join'], 3);
  mk(A, newId(), 'wrong_answer', 'aptitude', 'easy', ['Quantitative'], 2);

  mk(B, newId(), 'accepted', 'dsa', 'hard', ['Graph'], 6);
  mk(B, newId(), 'accepted', 'aptitude', 'medium', ['Logical'], 3);
  mk(B, newId(), 'accepted', 'aptitude', 'medium', ['Logical'], 2);

  mk(C, newId(), 'accepted', 'sql', 'medium', ['Aggregation'], 4);
  mk(C, newId(), 'accepted', 'sql', 'medium', ['Group By'], 2);

  // idempotency: remove prior seeded subs for these users
  await Submission.deleteMany({ user: { $in: [new mongoose.Types.ObjectId(A), new mongoose.Types.ObjectId(B), new mongoose.Types.ObjectId(C)] } });
  await Submission.insertMany(subs);
  const count = await Submission.countDocuments({ user: { $in: [new mongoose.Types.ObjectId(A), new mongoose.Types.ObjectId(B), new mongoose.Types.ObjectId(C)] } });
  console.log('SEEDED_SUBMISSIONS=', count);
  await mongoose.disconnect();
}

run().catch((e) => { console.error('SEED_ERR', e); process.exit(1); });
