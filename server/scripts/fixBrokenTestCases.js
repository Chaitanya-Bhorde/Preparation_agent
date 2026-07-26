const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');

const fixBrokenTestCases = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find any problem with hidden test cases containing "..."
    const problems = await CodingProblem.find({});
    let fixed = 0;

    for (const problem of problems) {
      const testCases = problem.hiddenTestCases;
      let problemModified = false;

      for (let i = 0; i < testCases.length; i++) {
        if (testCases[i].input && testCases[i].input.includes('...')) {
          console.log(`Found broken test case in problem ${problem._id} (${problem.title}) at index ${i}:`);
          console.log(`  Input preview: ${testCases[i].input.substring(0, 100)}...`);
          
          // Check if this is a shortest path problem with n=1000 pattern
          if (testCases[i].input.includes('n=1000') || testCases[i].input.includes('1000\n999')) {
            // Linear chain: 0-1-2-3-...-999
            const linearChainEdges = [];
            for (let j = 0; j < 999; j++) {
              linearChainEdges.push(`${j},${j+1}`);
            }
            testCases[i].input = `n=1000\nm=999\nedges=[${linearChainEdges.join(',')}]\nsource=0\ndestination=999`;
            testCases[i].expectedOutput = '999';
            testCases[i].category = 'stress-test-linear-chain';
            problemModified = true;
          } else if (testCases[i].input.includes('edges=[0,1,0,2') || testCases[i].input.includes('0,1,0,2')) {
            // Star graph: 0 connected to all others
            const starEdges = [];
            for (let j = 1; j < 1000; j++) {
              starEdges.push(`0,${j}`);
            }
            testCases[i].input = `n=1000\nm=999\nedges=[${starEdges.join(',')}]\nsource=1\ndestination=999`;
            testCases[i].expectedOutput = '2';
            testCases[i].category = 'stress-test-star-graph';
            problemModified = true;
          } else {
            // Generic fallback: replace ... with a valid simple pattern
            testCases[i].input = testCases[i].input.replace(/\.\.\./g, '0');
            testCases[i].category = testCases[i].category || 'general';
            problemModified = true;
          }
        }
      }

      if (problemModified) {
        await problem.save();
        fixed++;
        console.log(`Fixed problem: ${problem.title}`);
      }
    }

    // Verify no remaining broken test cases
    const remaining = await CodingProblem.find({});
    let remainingCount = 0;
    for (const problem of remaining) {
      for (const tc of problem.hiddenTestCases) {
        if (tc.input && tc.input.includes('...')) {
          remainingCount++;
        }
      }
    }
    console.log(`\nFixed ${fixed} problem(s) with broken test cases`);
    console.log(`Remaining problems with "..." in test cases: ${remainingCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing test cases:', error);
    process.exit(1);
  }
};

fixBrokenTestCases();