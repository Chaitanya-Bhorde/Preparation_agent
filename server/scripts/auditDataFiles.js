// Audit the coverage of every data bank file used by seedInterviewPrep.js.
// Usage: node scripts/auditDataFiles.js
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'data');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();

const summary = {};
for (const file of files) {
  let mod;
  try {
    mod = require(path.join(dir, file));
  } catch (error) {
    console.log(`${file.padEnd(26)} LOAD ERROR: ${error.message}`);
    continue;
  }
  if (!Array.isArray(mod)) {
    console.log(`${file.padEnd(26)} NOT AN ARRAY`);
    continue;
  }
  const topics = [...new Set(mod.map(r => r.topic))];
  const bad = mod.filter(r => !r.topic || (r.question && r.correctAnswer === undefined && !r.answer));
  console.log(`${file.padEnd(26)} ${String(mod.length).padStart(4)} records | ${String(topics.length).padStart(2)} topics | ${topics.join(' ~ ')}`);
  if (bad.length) console.log(`   ! ${bad.length} records with missing topic/answer fields`);
  for (const t of topics) {
    summary[t] = (summary[t] || 0) + 1;
  }
}
console.log(`\nDistinct topics across all files: ${Object.keys(summary).length}`);
console.log(JSON.stringify(summary, null, 0));