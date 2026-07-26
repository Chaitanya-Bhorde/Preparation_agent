const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');

const fixFormat = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // These are the two specific hidden test case _ids that were fixed with wrong format
    const badFormatIds = [
      '6a64bf55d9aab097d1a16d8d',
      '6a64bf55d9aab097d1a16d97',
    ];

    for (const tcId of badFormatIds) {
      // Find the problem containing this test case
      const problem = await CodingProblem.findOne({ 'hiddenTestCases._id': tcId });
      if (!problem) {
        console.log(`Test case ${tcId} not found`);
        continue;
      }

      const tc = problem.hiddenTestCases.id(tcId);
      if (!tc) {
        console.log(`Test case ${tcId} not found in problem ${problem._id}`);
        continue;
      }

      // Only fix if it has the wrong format (doesn't include 'n=1000')
      if (!tc.input.includes('n=1000')) {
        console.log(`Fixing format for test case ${tcId} in problem ${problem.title}`);
        
        // Generate correct format: linear chain
        const linearChainEdges = [];
        for (let j = 0; j < 999; j++) {
          linearChainEdges.push(`${j},${j+1}`);
        }
        tc.input = `n=1000\nm=999\nedges=[${linearChainEdges.join(',')}]\nsource=0\ndestination=999`;
        tc.expectedOutput = '999';
        tc.category = 'stress-test-linear-chain';
        
        await problem.save();
        console.log(`  Updated test case ${tcId}`);
      } else {
        console.log(`Test case ${tcId} already in correct format`);
      }
    }

    console.log('\nDone fixing format');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing format:', error);
    process.exit(1);
  }
};

fixFormat();