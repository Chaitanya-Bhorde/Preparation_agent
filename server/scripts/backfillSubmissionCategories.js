/**
 * One-time backfill script to set category on existing submissions.
 * Run: node server/scripts/backfillSubmissionCategories.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CodeSubmission = require('../models/CodeSubmission');
const SQLSubmission = require('../models/SQLSubmission');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent');
  const dsaRes = await CodeSubmission.updateMany({ category: { $exists: false } }, { $set: { category: 'dsa' } });
  const sqlRes = await SQLSubmission.updateMany({ category: { $exists: false } }, { $set: { category: 'sql' } });
  console.log('Backfill complete:', { dsa: dsaRes.modifiedCount, sql: sqlRes.modifiedCount });
  await mongoose.disconnect();
  process.exit(0);
};
run().catch((err) => {
  console.error(err);
  process.exit(1);
});