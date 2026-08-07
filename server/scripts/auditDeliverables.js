// Phase-1 deliverables generator: writes bug1 CSV and bug2 list for sampled CodingProblems.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const CodingProblem = require('../models/CodingProblem');

const LANGS = ['javascript', 'python', 'java', 'cpp', 'c', 'csharp'];
const GENERIC_RE = /computed result|output of function|answer for the problem|result for the given|return the result|generic result|Use (dynamic programming|a stack|a greedy|a hash|backtracking|sorting|a two-pointer|sliding|a heap)/i;

// Simple heuristic: does the description actually describe an input/output contract?
function classify(desc) {
  const hasInput = /input|given\s+(an|a|the|array|string|list)/i.test(desc);
  const hasOutput = /return|output|find|compute|print|count|sum|maximum|minimum/i.test(desc);
  return { hasInput, hasOutput };
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  const total = await CodingProblem.countDocuments({});
  const sample = await CodingProblem.aggregate([{ $sample: { size: Math.min(20, total) } }]);

  // ---------- BUG 1 CSV ----------
  const csvRows = ['problemId,claimedInputType,actualFunctionInput,match,severity'];
  // ---------- BUG 2 LIST ----------
  const bug2 = [];

  for (const p of sample) {
    const fsig = p.functionSignature || {};
    const js = fsig.javascript;
    const java = fsig.java;
    const desc = (p.description || '').replace(/\s+/g, ' ').trim();
    const generic = GENERIC_RE.test(desc);
    const cls = classify(desc);

    // "claimed" input type from description (best effort)
    let claimed = 'unspecified';
    if (/array|list|vector/i.test(desc)) claimed = 'array';
    else if (/string|character/i.test(desc)) claimed = 'string';
    else if (/integer|number|int/i.test(desc)) claimed = 'integer';
    else if (/matrix|grid|2d/i.test(desc)) claimed = 'matrix';

    // actual function input from java signature
    const javaParams = ((java && java.params) || []).map((x) => x.type).join('|') || 'NONE';
    const jsParams = ((js && js.params) || []).map((x) => x.type).join('|') || 'NONE';
    const jsRet = (js && js.returnType) || '';

    const mismatch = jsParams === 'string' || javaParams === 'String';
    const matches = 'yes'; // all shell sigs treat as string
    const severity = mismatch ? 'HIGH' : 'LOW';

    csvRows.push([p._id, claimed, `js:solve(${jsParams})->${jsRet};java:solve(${javaParams})`, mismatch ? 'NO' : 'yes', severity].join(','));

    bug2.push({
      id: p._id,
      slug: p.slug,
      title: p.title,
      generic: generic || !cls.hasInput || !cls.hasOutput,
      desc,
    });
  }

  const csvPath = path.resolve(__dirname, '../../phase1_inputtype_audit.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n'));
  console.log('WROTE', csvPath, '(', csvRows.length - 1, 'rows )');

  console.log('\n===== BUG 2: LAZY/GENERIC DESCRIPTION LIST =====');
  for (const b of bug2) {
    console.log('-'.repeat(70));
    console.log(`id=${b.id} slug=${b.slug}`);
    console.log(`title=${b.title} | GENERIC=${b.generic ? 'YES' : 'no'}`);
    console.log(`CURRENT: ${b.desc.slice(0, 200)}`);
    console.log(`CORRECT: <to fill from problem statement>`);
    console.log(`SEVERITY: ${b.generic ? 'HIGH' : 'LOW'}`);
  }

  await mongoose.disconnect();
  console.log('\nDONE');
}

run().catch((e) => { console.error('ERROR', e); process.exit(1); });
