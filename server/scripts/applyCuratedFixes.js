// Phase 2: apply curated specs (typed functionSignature + specific description +
// typed starter code + real sample/hidden test cases) to the priority problems in
// the live CodingProblem collection. Fixes Bugs 1 & 2 for the curated problem set.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');
const { CURATED } = require('./curatedProblems');

function buildTypedStarter(fs) {
  const js = fs.javascript, py = fs.python, java = fs.java, cpp = fs.cpp;
  const jsParams = (js.params || []).map((p) => p.name).join(', ');
  const pyParams = (py.params || []).map((p) => p.name).join(', ');
  const javaParams = (java.params || []).map((p) => `${p.type} ${p.name}`).join(', ');
  const cppParams = (cpp.params || []).map((p) => `${p.type} ${p.name}`).join(', ');
  return {
    javascript: `function ${js.name}(${jsParams}) {\n    \n}\n`,
    python: `def ${py.name}(${pyParams}):\n    pass\n`,
    java: `import java.util.*;

class Solution {
    public ${java.returnType} ${java.name}(${javaParams}) {
        
    }
}
`,
    cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

${cpp.returnType} ${cpp.name}(${cppParams}) {
    
}
`,
  };
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  console.log('CONNECTED:', mongoose.connection.name);

  const titles = Object.keys(CURATED);
  let updated = 0, missing = 0, mismatched = 0;
  const proof = [];

  for (const title of titles) {
    const c = CURATED[title];
    const doc = await CodingProblem.findOne({ title });
    if (!doc) { console.log(`MISSING in DB: ${title}`); missing++; continue; }

    const oldSig = doc.functionSignature && doc.functionSignature.javascript
      ? `${doc.functionSignature.javascript.name}(${(doc.functionSignature.javascript.params || []).map((p) => p.type).join(',')})->${doc.functionSignature.javascript.returnType}`
      : '(none)';
    const newSig = `${c.functionSignature.javascript.name}(${(c.functionSignature.javascript.params || []).map((p) => p.type).join(',')})->${c.functionSignature.javascript.returnType}`;

    doc.description = c.desc;
    doc.constraints = c.constraints;
    doc.examples = c.examples;
    doc.functionSignature = c.functionSignature;
    doc.starterCode = buildTypedStarter(c.functionSignature);
    doc.visibleTestCases = c.sample ? [{ input: c.sample.input, expectedOutput: c.sample.output, explanation: 'Sample' }] : [];
    doc.hiddenTestCases = c.hidden ? [{ input: c.hidden.input, expectedOutput: c.hidden.output }] : [];
    await doc.save();
    updated++;
    if (oldSig !== newSig) mismatched++;
    proof.push({ title, oldSig, newSig });
  }

  console.log(`\nUPDATED=${updated}  MISSING_IN_DB=${missing}  SIG_CHANGED=${mismatched}`);

  console.log('\n===== PROOF (10 samples, before -> after JS signature) =====');
  proof.slice(0, 10).forEach((p) => {
    console.log(`- ${p.title}\n    BEFORE: ${p.oldSig}\n    AFTER : ${p.newSig}`);
  });

  await mongoose.disconnect();
  console.log('\nDONE');
}

run().catch((e) => { console.error('ERROR', e); process.exit(1); });
