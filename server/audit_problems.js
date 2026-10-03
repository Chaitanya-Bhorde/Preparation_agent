const mongoose = require('mongoose');
const Problem = require('./models/Problem');
const SQLProblem = require('./models/SQLProblem');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prepagent';

async function auditProblems() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

  console.log('=== DSA PROBLEM AUDIT ===');
  const dsaProblems = await Problem.find({ category: 'DSA', isActive: true }).lean();
  console.log(`Total DSA problems: ${dsaProblems.length}\n`);

  let dsaPass = 0;
  let dsaFail = 0;

  for (let i = 0; i < dsaProblems.length; i++) {
    const p = dsaProblems[i];
    const issues = [];

    if (!p.title || p.title.trim() === '') issues.push('missing title');
    if (/^\w+-\d+/.test(p.title)) issues.push('raw ID as title');
    if (!['easy', 'medium', 'hard'].includes(p.difficulty)) issues.push('invalid difficulty');
    if (!p.tags || p.tags.length === 0) issues.push('no tags');
    if (!p.description || p.description.trim() === '') issues.push('missing description');
    if (p.description && p.description.includes('Spec not yet reviewed')) issues.push('contains placeholder text');
    if (!p.examples || p.examples.length === 0) issues.push('no examples');
    if (!p.constraints) issues.push('no constraints');
    if (!p.starterCode || !p.starterCode.javascript) issues.push('no starter code');
    if (!p.functionSignature || !p.functionSignature.javascript) issues.push('no function signature');
    if (!p.testCases || p.testCases.length === 0) issues.push('no test cases');

    if (issues.length > 0) {
      console.log(`DSA ${i + 1}/${dsaProblems.length} — ${p.title || 'NO TITLE'} — FAIL`);
      issues.forEach(issue => console.log(`  - ${issue}`));
      dsaFail++;
    } else {
      console.log(`DSA ${i + 1}/${dsaProblems.length} — ${p.title} — PASS`);
      dsaPass++;
    }
  }

  console.log(`\nDSA Summary: PASS=${dsaPass} FAIL=${dsaFail}\n`);

  console.log('\n=== SQL PROBLEM AUDIT ===');
  const sqlProblems = await SQLProblem.find({ isActive: true }).lean();
  console.log(`Total SQL problems: ${sqlProblems.length}\n`);

  let sqlPass = 0;
  let sqlFail = 0;

  for (let i = 0; i < sqlProblems.length; i++) {
    const p = sqlProblems[i];
    const issues = [];

    if (!p.title || p.title.trim() === '') issues.push('missing title');
    if (/^\w+-\d+/.test(p.title)) issues.push('raw ID as title');
    if (!['easy', 'medium', 'hard'].includes(p.difficulty)) issues.push('invalid difficulty');
    if (!p.topics || p.topics.length === 0) issues.push('no topics');
    if (!p.description || p.description.trim() === '') issues.push('missing description');
    if (!p.schemaTables || p.schemaTables.length === 0) issues.push('no schema tables');
    if (!p.schemaSetupSQL || p.schemaSetupSQL.trim() === '') issues.push('no schemaSetupSQL');
    if (!p.examples || p.examples.length === 0) issues.push('no examples');
    if (!p.sampleTestCases || p.sampleTestCases.length === 0) issues.push('no sample test cases');
    if (!p.hiddenTestCases || p.hiddenTestCases.length === 0) issues.push('no hidden test cases');

    if (issues.length > 0) {
      console.log(`SQL ${i + 1}/${sqlProblems.length} — ${p.title || 'NO TITLE'} — FAIL`);
      issues.forEach(issue => console.log(`  - ${issue}`));
      sqlFail++;
    } else {
      console.log(`SQL ${i + 1}/${sqlProblems.length} — ${p.title} — PASS`);
      sqlPass++;
    }
  }

  console.log(`\nSQL Summary: PASS=${sqlPass} FAIL=${sqlFail}\n`);
  await mongoose.connection.close();
}

auditProblems().catch(e => {
  console.error('Audit failed:', e.message);
  process.exit(1);
});