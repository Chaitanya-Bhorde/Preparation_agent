/**
 * Verify database state for Phase 2 review:
 * - Count CodeSubmission documents total / with category / without category
 * - Count SQLSubmission documents total / with category / without category
 * - Show a sample CodeSubmission if present
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CodeSubmission = require('../models/CodeSubmission');
const SQLSubmission = require('../models/SQLSubmission');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent');
  const codeTotal = await CodeSubmission.countDocuments({});
  const codeWithCat = await CodeSubmission.countDocuments({ category: { $exists: true } });
  const codeWithoutCat = await CodeSubmission.countDocuments({ category: { $exists: false } });
  const sqlTotal = await SQLSubmission.countDocuments({});
  const sqlWithCat = await SQLSubmission.countDocuments({ category: { $exists: true } });
  const sqlWithoutCat = await SQLSubmission.countDocuments({ category: { $exists: false } });
  const sampleCode = await CodeSubmission.findOne().sort({ createdAt: -1 }).lean();
  console.log('CodeSubmission:', { total: codeTotal, withCategory: codeWithCat, withoutCategory: codeWithoutCat });
  console.log('SQLSubmission:', { total: sqlTotal, withCategory: sqlWithCat, withoutCategory: sqlWithoutCat });
  if (sampleCode) {
    console.log('Sample CodeSubmission:', {
      _id: sampleCode._id,
      user: sampleCode.user,
      problem: sampleCode.problem,
      verdict: sampleCode.verdict,
      category: sampleCode.category,
      createdAt: sampleCode.createdAt,
    });
  } else {
    console.log('Sample CodeSubmission: none found');
  }
  await mongoose.disconnect();
  process.exit(0);
};
run().catch((err) => {
  console.error(err);
  process.exit(1);
});