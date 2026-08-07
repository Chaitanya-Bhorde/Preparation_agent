// Post-fix verification for the curated problem set (Bugs 1 & 2).
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');
const { CURATED } = require('./curatedProblems');

const GENERIC_RE = /Use (dynamic programming|a stack|a greedy|a hash|backtracking|sorting|a two-pointer|sliding|a heap)|solve the problem described|perform the required operation|return the result described/i;

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  const titles = Object.keys(CURATED);
  const docs = await CodingProblem.find({ title: { $in: titles } });
  const byTitle = new Map(docs.map((d) => [d.title, d]));

  let typed = 0, specific = 0, generic = 0, missing = 0;
  console.log('=== BUG 1 (input type) + BUG 2 (description) verification ===\n');
  for (const t of titles) {
    const d = byTitle.get(t);
    if (!d) { console.log(`MISSING: ${t}`); missing++; continue; }
    const js = d.functionSignature && d.functionSignature.javascript;
    const jsSig = js ? `${js.name}(${(js.params || []).map((p) => p.type).join(',')})->${js.returnType}` : 'NONE';
    const isTyped = js && !(js.returnType === 'string' && (js.params || []).length === 1 && js.params[0].type === 'string');
    const desc = d.description || '';
    const isGeneric = GENERIC_RE.test(desc);
    if (isTyped) typed++; else console.log(`  UNTYPED JS sig: ${t} -> ${jsSig}`);
    if (!isGeneric) specific++; else { generic++; console.log(`  GENERIC desc: ${t}`); }
    if (t === 'Two Sum' || t === 'Median of Two Sorted Arrays' || t === 'Number of Islands' || t === 'Course Schedule') {
      console.log(`\n[${t}]`);
      console.log(`  JS sig : ${jsSig}`);
      console.log(`  Desc   : ${desc.slice(0, 140)}`);
    }
  }
  console.log(`\nSUMMARY: curated=${titles.length} found=${docs.length} missing=${missing}`);
  console.log(`  BUG1: typed JS signature = ${typed}/${titles.length}`);
  console.log(`  BUG2: specific description = ${specific}/${titles.length}, generic = ${generic}`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('ERROR', e); process.exit(1); });
