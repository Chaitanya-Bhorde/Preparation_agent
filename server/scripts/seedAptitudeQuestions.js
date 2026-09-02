const mongoose = require('mongoose');
const path = require('path');
// Load server/.env (the URI the API server uses), fall back to root .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const AptitudeTopic = require('../models/AptitudeTopic');
const AptitudeQuestion = require('../models/AptitudeQuestion');
const AptitudeMockTest = require('../models/AptitudeMockTest');
const q1 = require('./_aptGen_quant');
const q2 = require('./_aptGen_quant2');
const l1 = require('./_aptGen_logical');
const l2 = require('./_aptGen_logical2');
const v1 = require('./_aptGen_verbal');
const v2 = require('./_aptGen_verbal2');
const meta = require('./_aptSub');
const CAT = meta.CATEGORIES;
const SUBTOPICS = meta.SUBTOPICS;
const ALL = [].concat(CAT.quantitative, CAT.logical, CAT.verbal);
const GENS = Object.assign({}, q1.G, q2.G, l1.G, l2.G, v1.G, v2.G);
const srand = s => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };
const rngFor = (n, i) => function () { return srand(n.charCodeAt(0) * 1000 + i * 97 + srand(i + 1) * 1000); };
const ri = (r, a, b) => Math.floor(r() * (b - a + 1)) + a;
const pk = (r, arr) => arr[Math.floor(r() * arr.length)];
const DIFF = ['easy', 'medium', 'hard'];
function buildMCQ(o) {
  const rng = typeof o.r === 'function' ? o.r : () => 0;
  const it = [{ l: '', t: String(o.right), c: true }];
  o.wrong.forEach(t => it.push({ l: '', t: String(t), c: false }));
  for (let i = it.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [it[i], it[j]] = [it[j], it[i]]; }
  it.forEach((x, idx) => { x.l = 'ABCD'[idx]; });
  return { topicId: o.topicId, category: o.category, topic: o.topic, questionText: o.stem, options: it.map(x => ({ label: x.l, text: x.t, isCorrect: x.c })), correctAnswer: it.find(x => x.c).l, explanation: o.explanation, solutionSteps: o.steps || [o.explanation], difficulty: o.difficulty || pk(rng, DIFF), timeLimit: o.timeLimit || 90, source: o.source || 'TCS NQT' };
}
async function seedAptitude() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent', { dbName: process.env.MONGO_DB || 'prepagent', serverSelectionTimeoutMS: 15000 });
    console.log('Connected to MongoDB: ' + conn.connection.name);
    await AptitudeTopic.deleteMany({ name: { $in: ALL } });
    await AptitudeQuestion.deleteMany({ topic: { $in: ALL } });
    await AptitudeMockTest.deleteMany({ name: /Mock Test/i });
    console.log('[cleaned existing aptitude data]');
    let tc = 0, qc = 0;
    for (const category of Object.keys(CAT)) {
      for (const name of CAT[category]) {
        const t = new AptitudeTopic({ name, category, description: 'Practice ' + name + ' questions.', priority: 'high', subtopics: SUBTOPICS[name] || ['General'], totalQuestions: 150, estimatedTime: 180 });
        const st = await t.save(); tc++;
        const gen = GENS[name];
        if (!gen) { console.log('NO GENERATOR: ' + name); continue; }
        const qs = [];
        let qi = 0;
        // 50 easy + 50 medium + 50 hard per topic (the 50-50-50 requirement)
        for (const difficulty of ['easy', 'medium', 'hard']) {
          for (let k = 0; k < 50; k++, qi++) {
            const rl = rngFor(name, qi);
            const q = gen(rl, qi, { ri, pk, buildMCQ });
            q.topicId = st._id; q.topic = name; q.category = category;
            q.difficulty = difficulty;
            q.timeLimit = difficulty === 'easy' ? 60 : difficulty === 'medium' ? 90 : 120;
            qs.push(q);
          }
        }
        const ins = await AptitudeQuestion.insertMany(qs);
        qc += ins.length;
        console.log('  ' + category + '/' + name + ': ' + ins.length + ' questions');
      }
    }
    const mocks = [];
    for (const c of ['quantitative', 'logical', 'verbal']) {
      const ids = await AptitudeQuestion.find({ category: c }).limit(30).select('_id');
      mocks.push({ name: c.charAt(0).toUpperCase() + c.slice(1) + ' Mock Test', description: '30-question mixed ' + c + ' test', category: c + '-only', questionIds: ids.map(q => q._id), totalQuestions: Math.min(30, ids.length), duration: 60, passingScore: 60, difficultyMix: { easy: 10, medium: 12, hard: 8 } });
    }
    const idA = await AptitudeQuestion.find({}).limit(30).select('_id');
    const idB = await AptitudeQuestion.find({}).skip(30).limit(30).select('_id');
    mocks.push({ name: 'Full Aptitude Test 1', description: '30-question mixed aptitude test', category: 'full', questionIds: idA.map(q => q._id), totalQuestions: 30, duration: 60, passingScore: 60, difficultyMix: { easy: 10, medium: 12, hard: 8 } });
    mocks.push({ name: 'Full Aptitude Test 2', description: '30-question mixed aptitude test', category: 'full', questionIds: idB.map(q => q._id), totalQuestions: 30, duration: 60, passingScore: 60, difficultyMix: { easy: 8, medium: 12, hard: 10 } });
    await AptitudeMockTest.insertMany(mocks);
    console.log('\nSeeding complete:');
    console.log('  Topics:     ' + tc);
    console.log('  Questions:  ' + qc);
    console.log('  Mock tests: ' + mocks.length);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) { console.error('Seeding error:', err.message); process.exit(1); }
}
seedAptitude();