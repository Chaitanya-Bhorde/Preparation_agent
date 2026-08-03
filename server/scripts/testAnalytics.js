const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Submission = require('../models/Submission');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const userId = '6a68a499d9b5de34dd213cfb';
  const allSubmissions = await Submission.find({ user: userId, type: 'submit' });
  console.log('TOTAL SUBMISSIONS FOUND:', allSubmissions.length);
  console.log('CATEGORY BREAKDOWN:', allSubmissions.map(s => s.category));
  const sqlSubs = allSubmissions.filter(s => s.category === 'sql');
  console.log('SQL COUNT:', sqlSubs.length);
  process.exit(0);
}
run().catch(e => { console.error('ERROR:', e); process.exit(1); });
