'use strict';
// Restore the 49-doc canonical SQL bank captured in _sql_canonical_readonly.json
// (taken BEFORE the accidental deleteMany+placeholder reseed). Dry-run first:
// node scripts/restoreCanonicalSQLBank.js            -> report only, no writes
// node scripts/restoreCanonicalSQLBank.js --apply   -> wipe sqlproblems and restore 49 docs
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function main() {
  const apply = process.argv.includes('--apply');
  const backupPath = path.join(__dirname, '..', '_sql_canonical_readonly.json');
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  console.log('backup docs=' + backup.length);
  const SQLProblem = require('../models/SQLProblem');
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI required');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  const before = await SQLProblem.countDocuments({});
  console.log('BEFORE sqlproblems total=' + before + ' active=' + await SQLProblem.countDocuments({ isActive: true }));
  if (!apply) {
    console.log('DRY RUN only. Pass --apply to wipe + restore.');
    // Show what restore would do, per title
    backup.slice(0, 5).forEach((p) => console.log('WOULD RESTORE | ' + p.title + ' | active=' + p.isActive));
    await mongoose.disconnect();
    return;
  }
  await SQLProblem.deleteMany({});
  // Strip _id/__v so Mongo reassigns; keep every content field incl. inactive flag
  const docs = backup.map((p) => {
    const d = Object.assign({}, p);
    delete d._id; delete d.__v;
    return d;
  });
  const created = await SQLProblem.insertMany(docs, { ordered: false });
  console.log('RESTORED ' + created.length);
  console.log('AFTER sqlproblems total=' + await SQLProblem.countDocuments({}) + ' active=' + await SQLProblem.countDocuments({ isActive: true }) + ' inactive=' + await SQLProblem.countDocuments({ isActive: false }));
  await mongoose.disconnect();
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
