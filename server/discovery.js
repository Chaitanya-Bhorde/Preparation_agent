require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

async function discover() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const Problem = require('./models/Problem');
  const SQLProblem = require('./models/SQLProblem');
  const CodingProblem = require('./models/CodingProblem');
  const Submission = require('./models/Submission');
  const SQLSubmission = require('./models/SQLSubmission');
  const PracticeHistory = require('./models/PracticeHistory');

  const out = {};

  // Raw counts per collection
  const cols = await db.listCollections().toArray();
  out.collections = {};
  for (const c of cols) {
    out.collections[c.name] = await db.collection(c.name).countDocuments();
  }

  // Problem model breakdown
  out.problemByCategory = await Problem.aggregate([{ $group: { _id: '$category', n: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } }]);
  out.problemInactive = await Problem.countDocuments({ isActive: false });

  // CodingProblem
  out.codingProblemTotal = await CodingProblem.countDocuments({});
  out.codingProblemActive = await CodingProblem.countDocuments({ isActive: true });

  // SQLProblem
  out.sqlProblemTotal = await SQLProblem.countDocuments({});
  out.sqlProblemActive = await SQLProblem.countDocuments({ isActive: true });
  out.sqlProblemInactive = await SQLProblem.countDocuments({ isActive: false });

  // DSA titles (category DSA in Problem)
  out.dsaTitles = (await Problem.find({ category: 'DSA' }).select('title slug difficulty isActive').lean())
    .map(p => ({ t: p.title, s: p.slug, d: p.difficulty, a: p.isActive }));

  // SQL-category problems inside Problem collection (potential duplicates of SQLProblem)
  out.sqlInProblem = (await Problem.find({ category: 'SQL' }).select('title slug difficulty isActive').lean())
    .map(p => ({ t: p.title, s: p.slug, d: p.difficulty, a: p.isActive }));

  // SQLProblem titles
  out.sqlTitles = (await SQLProblem.find({}).select('title slug difficulty isActive problemNumber').sort({ problemNumber: 1 }).lean())
    .map(p => ({ n: p.problemNumber, t: p.title, s: p.slug, d: p.difficulty, a: p.isActive }));

  // CodingProblem titles (first 60)
  out.codingTitles = (await CodingProblem.find({}).select('title slug difficulty isActive').limit(300).lean())
    .map(p => ({ t: p.title, s: p.slug, d: p.difficulty, a: p.isActive }));

  // Duplicate slug/title detection across Problem
  out.dupProblemTitles = await Problem.aggregate([{ $group: { _id: '$title', n: { $sum: 1 }, ids: { $push: '$_id' } } }, { $match: { n: { $gt: 1 } } }]);
  out.dupProblemSlugs = await Problem.aggregate([{ $group: { _id: '$slug', n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]);
  out.dupSqlTitles = await SQLProblem.aggregate([{ $group: { _id: '$title', n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]);
  out.dupSqlSlugs = await SQLProblem.aggregate([{ $group: { _id: '$slug', n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]);
  out.dupCodingTitles = await CodingProblem.aggregate([{ $group: { _id: '$title', n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]);

  // Submission stats
  out.submissionTotal = await Submission.countDocuments({});
  out.submissionByStatus = await Submission.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
  out.submissionByType = await Submission.aggregate([{ $group: { _id: '$type', n: { $sum: 1 } } }]);
  out.submissionByCategory = await Submission.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]);
  out.sqlSubmissionTotal = await SQLSubmission.countDocuments({});
  out.sqlSubmissionByStatus = await SQLSubmission.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
  out.sqlSubmissionByType = await SQLSubmission.aggregate([{ $group: { _id: '$type', n: { $sum: 1 } } }]);
  out.practiceHistoryTotal = await PracticeHistory.countDocuments({});

  console.log(JSON.stringify(out, null, 2));
  await mongoose.connection.close();
}

discover().catch(e => { console.error('DISCOVER FAILED:', e); process.exit(1); });
