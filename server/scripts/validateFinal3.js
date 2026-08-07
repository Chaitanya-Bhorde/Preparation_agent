// Final end-to-end validation: 3 representative DSA problems.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  const titles = ['Two Sum', 'Median of Two Sorted Arrays', 'Edit Distance'];
  for (const t of titles) {
    const d = await CodingProblem.findOne({ title: t });
    const s = d.functionSignature;
    const show = (l) => (s[l] ? `${s[l].name}(${(s[l].params || []).map((p) => p.type).join(',')})->${s[l].returnType}` : '(none)');
    console.log(`\n==== ${t} ====`);
    console.log(`DESC : ${(d.description || '').slice(0, 150)}`);
    console.log(`JS   : ${show('javascript')}`);
    console.log(`JAVA : ${show('java')}`);
    console.log(`CPP  : ${show('cpp')}`);
    console.log(`PY   : ${show('python')}`);
    console.log(`starter.java present : ${!!d.starterCode.java}`);
    console.log(`sample test case     : ${JSON.stringify((d.visibleTestCases || [])[0])}`);
  }
  await mongoose.disconnect();
  console.log('\nDONE');
}
run().catch((e) => { console.error('ERR', e.message); process.exit(1); });
