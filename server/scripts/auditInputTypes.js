// Phase-1 audit: input-type alignment + output description quality for CodingProblem
// Connects to live Atlas DB, samples problems, inspects functionSignature / starterCode / description.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');

const LANGS = ['javascript', 'python', 'java', 'cpp', 'c', 'csharp'];

const GENERIC_RE = /computed result|output of function|answer for the problem|result for the given|return the result|generic result/i;

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  console.log('CONNECTED:', mongoose.connection.name);

  const total = await CodingProblem.countDocuments({});
  console.log('TOTAL CodingProblem docs:', total);

  const sample = await CodingProblem.aggregate([{ $sample: { size: Math.min(20, total) } }]);
  console.log('SAMPLED:', sample.length, '\n');

  for (const p of sample) {
    const fs = p.functionSignature || {};
    const sc = p.starterCode || {};
    const desc = (p.description || '').replace(/\s+/g, ' ').trim().slice(0, 220);
    const sigSummary = LANGS.map((l) => {
      const s = fs[l];
      if (!s) return `${l}:NONE`;
      const params = (s.params || []).map((pa) => `${pa.name}=${pa.type}`).join(',');
      return `${l}:${s.name}(${params})->${s.returnType}`;
    }).join(' | ');
    const starterMissing = LANGS.filter((l) => !sc[l]);
    console.log('========================================');
    console.log(`id=${p._id} slug=${p.slug}`);
    console.log(`title=${p.title} topic=${p.topic} diff=${p.difficulty}`);
    console.log(`DESC: ${desc}`);
    console.log(`SIG : ${sigSummary}`);
    console.log(`starterMissing: ${starterMissing.length ? starterMissing.join(',') : 'none'}`);
    console.log(`genericDesc: ${GENERIC_RE.test(p.description || '') ? 'YES' : 'no'}`);
  }

  await mongoose.disconnect();
  console.log('\nDONE');
}

run().catch((e) => { console.error('ERROR', e); process.exit(1); });
