/**
 * regressionTest.js (Phase 6.1)
 * Smoke test for POST /api/coding/submit against the first 50 DB problems.
 * REQUIRES: running server (localhost:5000) + MongoDB (set MONGO_URI).
 * Note: /submit returns 201 on a successful submission (sendSubmitResponse ->
 * res.status(201)), so any 2xx counts as a server-responsiveness pass.
 */
const mongoose = require('mongoose');
const axios = require('axios');
const CodingProblem = require('../models/CodingProblem');

async function regressionTest() {
  try {
    const problems = await CodingProblem.find().limit(50);
    let passed = 0;
    let failed = 0;
    let failures = [];

    for (const problem of problems) {
      try {
        const response = await axios.post('http://localhost:5000/api/coding/submit', {
          problemId: problem._id.toString(),
          userId: 'test-regression-user',
          language: 'javascript',
          code: 'function solve() { return 0; }',
        });
        if (response.status >= 200 && response.status < 300) { passed++; }
        else { failed++; failures.push({ problemId: problem._id, status: response.status }); }
      } catch (err) {
        failed++;
        failures.push({ problemId: problem._id, error: err.message });
      }
    }

    const total = problems.length;
    const passRate = total === 0 ? 0 : ((passed / total) * 100).toFixed(2);

    console.log('Regression Test Complete:');
    console.log('  Total problems tested: ' + total);
    console.log('  Passed: ' + passed);
    console.log('  Failed: ' + failed);
    console.log('  Pass rate: ' + passRate + '%');
    console.log('  Failures: ' + (failures.length > 0 ? JSON.stringify(failures, null, 2) : 'NONE'));
  } catch (err) {
    console.error('Regression test failed:', err.message);
  }
}

if (require.main === module) {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('MONGO_URI not set'); process.exit(1); }
  mongoose.connect(uri).then(regressionTest).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { regressionTest };