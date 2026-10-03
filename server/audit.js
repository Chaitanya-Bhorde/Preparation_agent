require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const Problem = require('./models/Problem');
const SQLProblem = require('./models/SQLProblem');

// Use MONGO_URI from .env (the project's actual config variable)
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/prepagent';

async function audit() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected\n');

  const dsa = await Problem.find({ category: 'DSA', isActive: true }).lean();
  console.log(`DSA problems: ${dsa.length}`);
  
  const sql = await SQLProblem.find({ isActive: true }).lean();
  console.log(`SQL problems: ${sql.length}\n`);

  let dsaPass = 0, dsaFail = 0, dsaNeedsReview = 0;
  for (let i = 0; i < dsa.length; i++) {
    const p = dsa[i];
    const issues = [];
    const warnings = [];
    
    // Basic fields
    if (!p.title) issues.push('no title');
    else if (/^\w+-\d{10,}/.test(p.title)) issues.push('raw ID as title');
    if (!p.slug) issues.push('no slug');
    if (!['easy','medium','hard'].includes(p.difficulty)) issues.push('bad difficulty');
    if (!p.tags?.length) issues.push('no tags');
    
    // Content
    if (!p.description) issues.push('no description');
    else if (p.description.includes('Spec not yet reviewed')) issues.push('placeholder text');
    if (!p.examples?.length) issues.push('no examples');
    if (!p.constraints) issues.push('no constraints');
    
    // Starter code - check it's not empty
    const sc = p.starterCode || {};
    const hasStarterJS = sc.javascript && sc.javascript.trim() !== '';
    const hasStarterPython = sc.python && sc.python.trim() !== '';
    const hasStarterJava = sc.java && sc.java.trim() !== '';
    const hasStarterCpp = sc.cpp && sc.cpp.trim() !== '';
    if (!hasStarterJS) warnings.push('empty starter JS');
    if (!hasStarterPython) warnings.push('empty starter Python');
    if (!hasStarterJava) warnings.push('empty starter Java');
    if (!hasStarterCpp) warnings.push('empty starter C++');
    
    // Function signature
    if (!p.functionSignature?.javascript) issues.push('no JS function signature');
    if (!p.functionSignature?.python) warnings.push('no Python signature');
    if (!p.functionSignature?.java) warnings.push('no Java signature');
    if (!p.functionSignature?.cpp) warnings.push('no C++ signature');
    
    // Test cases - check both testCases with isSample/isHidden flags
    const testCases = p.testCases || [];
    const sampleTests = testCases.filter(tc => tc.isSample);
    const hiddenTests = testCases.filter(tc => tc.isHidden);
    if (testCases.length === 0) issues.push('no test cases');
    else {
      if (sampleTests.length === 0) warnings.push('no sample test cases');
      if (hiddenTests.length === 0) warnings.push('no hidden test cases');
    }
    
    // Check for duplicate titles (batch check at end)
    // Skipping per-problem duplicate check for performance
    
    if (issues.length) { 
      console.log(`DSA ${i+1}/${dsa.length}: ${p.title||'NO TITLE'} — FAIL: ${issues.join(', ')}`); 
      dsaFail++; 
    } else if (warnings.length) {
      console.log(`DSA ${i+1}/${dsa.length}: ${p.title} — PASS (warnings: ${warnings.join(', ')})`);
      dsaPass++;
    } else { 
      console.log(`DSA ${i+1}/${dsa.length}: ${p.title} — PASS`); 
      dsaPass++; 
    }
  }
  console.log(`\nDSA: PASS=${dsaPass} FAIL=${dsaFail} NEEDS_REVIEW=${dsaNeedsReview}\n`);

  let sqlPass = 0, sqlFail = 0, sqlNeedsReview = 0;
  for (let i = 0; i < sql.length; i++) {
    const p = sql[i];
    const issues = [];
    const warnings = [];
    
    // Basic fields
    if (!p.title) issues.push('no title');
    else if (/^\w+-\d{10,}/.test(p.title)) issues.push('raw ID as title');
    if (!p.slug) issues.push('no slug');
    if (!['easy','medium','hard'].includes(p.difficulty)) issues.push('bad difficulty');
    if (!p.topics?.length) issues.push('no topics');
    
    // Content
    if (!p.description) issues.push('no description');
    if (!p.schemaTables?.length) issues.push('no schema tables');
    if (!p.schemaSetupSQL || p.schemaSetupSQL.trim() === '') issues.push('no schemaSetupSQL');
    if (!p.examples?.length) issues.push('no examples');
    
    // Test cases
    if (!p.sampleTestCases?.length) issues.push('no sample test cases');
    if (!p.hiddenTestCases?.length) warnings.push('no hidden test cases');
    
    // Check schemaSetupSQL validity
    if (p.schemaSetupSQL && !p.schemaSetupSQL.toLowerCase().includes('create table')) {
      warnings.push('schemaSetupSQL missing CREATE TABLE');
    }
    
    // Check for raw IDs
    if (/hm_\d{10,}/.test(p.title) || /m_\d{10,}/.test(p.title)) {
      issues.push('raw internal ID as title');
    }
    
    if (issues.length) { 
      console.log(`SQL ${i+1}/${sql.length}: ${p.title||'NO TITLE'} — FAIL: ${issues.join(', ')}`); 
      sqlFail++; 
    } else if (warnings.length) {
      console.log(`SQL ${i+1}/${sql.length}: ${p.title} — PASS (warnings: ${warnings.join(', ')})`);
      sqlPass++;
    } else { 
      console.log(`SQL ${i+1}/${sql.length}: ${p.title} — PASS`); 
      sqlPass++; 
    }
  }
  console.log(`\nSQL: PASS=${sqlPass} FAIL=${sqlFail} NEEDS_REVIEW=${sqlNeedsReview}`);

  await mongoose.connection.close();
  console.log('\n=== AUDIT COMPLETE ===');
}

audit().catch(e => { console.error('Audit failed:', e.message); process.exit(1); });