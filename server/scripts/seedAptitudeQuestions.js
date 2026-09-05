const mongoose = require('mongoose');
const path = require('path');
// Load server/.env (the URI the API server uses), fall back to root .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { validateQuestion, normalizeText } = require('./_questionValidator');
const AptitudeTopic = require('../models/AptitudeTopic');
const AptitudeQuestion = require('../models/AptitudeQuestion');
const AptitudeMockTest = require('../models/AptitudeMockTest');
const q1 = require('./_aptGen_quant');
const q2 = require('./_aptGen_quant2');
const l1 = require('./_aptGen_logical');
const l2 = require('./_aptGen_logical2');
const v1 = require('./_aptGen_verbal');
const v2 = require('./_aptGen_verbal2');
const qv2 = require('./_aptGen2_quant');
const lv2 = require('./_aptGen2_logical');
const vv2 = require('./_aptGen2_verbal');
const vv3 = require('./_aptGen3_verbal');
const lv3 = require('./_aptGen3_logical');
const vv4 = require('./_aptGen4_verbal');
const l5 = require('./_aptGen5_logical');
const v5 = require('./_aptGen5_verbal');
const meta = require('./_aptSub');
const CAT = meta.CATEGORIES;
const SUBTOPICS = meta.SUBTOPICS;
const ALL = [].concat(CAT.quantitative, CAT.logical, CAT.verbal);
// v5 generators take top priority; then v4, then v3, then v2, then v1 fallback.
const GENS = Object.assign({}, q1.G, q2.G, l1.G, l2.G, v1.G, v2.G, qv2.G, lv2.G, vv2.G, vv3.G, lv3.G, vv4.G, l5.G, v5.G);
const srand = s => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };
// Stateful seeded RNG (mulberry32) — each r() call advances state so
// ri()/pk() inside a template get DIFFERENT random values (variety fix).
const rngFor = (n, i) => {
  let a = (n.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) * 1000 + i * 7919) >>> 0;
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
};
const ri = (r, a, b) => Math.floor(r() * (b - a + 1)) + a;
const pk = (r, arr) => arr[Math.floor(r() * arr.length)];
const DIFF = ['easy', 'medium', 'hard'];
// Notebook-style solution: only the actual worked steps (no generic theory).
function expandSteps(steps, explanation, answer) {
  const base = (Array.isArray(steps) ? steps : []).map(s => String(s)).filter(s => s && s.trim());
  const out = [...base];
  if (answer) out.push('∴ Answer: ' + answer);
  return out;
}
function buildMCQ(o) {
  const rng = typeof o.r === 'function' ? o.r : () => 0;
  // Fix (DUP_OPT): keep only UNIQUE options — drop wrong answers that repeat the
  // right answer or each other (same case/spacing-insensitive rule the validator uses).
  const seen = new Set([normalizeText(o.right)]);
  const it = [{ l: '', t: String(o.right), c: true }];
  (o.wrong || []).forEach(t => {
    const key = normalizeText(t);
    if (!key || seen.has(key)) return; // empty or duplicate option -> skip
    seen.add(key);
    it.push({ l: '', t: String(t), c: false });
  });
  for (let i = it.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [it[i], it[j]] = [it[j], it[i]]; }
  it.forEach((x, idx) => { x.l = 'ABCD'[idx]; });
  // Fix (NO_EXPL): guarantee a real explanation — when a template only supplies the
  // bare answer (e.g. "75%."), build one from the worked steps instead.
  let explanation = String(o.explanation || '').trim();
  if (explanation.length < 10) {
    const stepText = (Array.isArray(o.steps) ? o.steps : []).map(s => String(s).trim()).filter(Boolean).join(' ');
    explanation = ('Correct answer: ' + o.right + '. ' + stepText).trim();
  }
  return { topicId: o.topicId, category: o.category, topic: o.topic, questionText: o.stem, options: it.map(x => ({ label: x.l, text: x.t, isCorrect: x.c })), correctAnswer: it.find(x => x.c).l, explanation, solutionSteps: expandSteps(o.steps, o.explanation, o.right), difficulty: o.difficulty || pk(rng, DIFF), timeLimit: o.timeLimit || 90, source: o.source || 'TCS NQT' };
}
async function seedAptitude() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent', { dbName: process.env.MONGO_DB || 'prepagent', serverSelectionTimeoutMS: 15000 });
    console.log('Connected to MongoDB: ' + conn.connection.name);
    await AptitudeTopic.deleteMany({ name: { $in: ALL } });
    await AptitudeQuestion.deleteMany({ topic: { $in: ALL } });
    // Purge orphan/broken questions (missing or garbage topic/text) from older seeds.
    await AptitudeQuestion.deleteMany({
      $or: [
        { topic: { $exists: false } },
        { topic: null },
        { topic: '' },
        { questionText: { $exists: false } },
        { questionText: null },
        { questionText: '' },
        { questionText: 'undefined' },
      ],
    });
    await AptitudeMockTest.deleteMany({ name: /Mock Test/i });
    console.log('[cleaned existing aptitude data]');
    let tc = 0, qc = 0;
    const shortTopics = [];
    for (const category of Object.keys(CAT)) {
      for (const name of CAT[category]) {
        const t = new AptitudeTopic({ name, category, description: 'Practice ' + name + ' questions.', priority: 'high', subtopics: SUBTOPICS[name] || ['General'], totalQuestions: 150, estimatedTime: 180 });
        const st = await t.save(); tc++;
        const gen = GENS[name];
        if (!gen) { console.log('NO GENERATOR: ' + name); continue; }
        const qs = [];
        const seenTexts = new Set(); // per topic+difficulty (same key _validateDatabase.js uses)
        const MAX_RETRIES = 60;
        let topicShort = 0;
        let qi = 0;
        // 50 easy + 50 medium + 50 hard per topic (the 50-50-50 requirement).
        // validateQuestion was already imported but NEVER used here — every first-shot
        // question went straight into the DB. Now every question is validated BEFORE
        // insertion and regenerated with a fresh seed (and rotated template index)
        // until it passes, so no invalid or duplicate question can reach the database.
        for (const difficulty of ['easy', 'medium', 'hard']) {
          seenTexts.clear(); // duplicate rule is per topic+difficulty
          for (let k = 0; k < 50; k++, qi++) {
            let accepted = false;
            for (let attempt = 0; attempt < MAX_RETRIES && !accepted; attempt++) {
              const rl = rngFor(name + '|' + difficulty + '|' + k + '|' + attempt, qi * 7 + attempt * 977);
              let q;
              try { q = gen(rl, qi + attempt, { ri, pk, buildMCQ }); } catch (e) { continue; }
              q.topicId = st._id; q.topic = name; q.category = category;
              q.difficulty = difficulty;
              q.timeLimit = difficulty === 'easy' ? 60 : difficulty === 'medium' ? 90 : 120;
              const v = validateQuestion(q);
              if (!v.valid) continue; // invalid -> regenerate
              const key = normalizeText(q.questionText);
              if (!key || seenTexts.has(key)) continue; // duplicate text -> regenerate
              seenTexts.add(key);
              qs.push(q);
              accepted = true;
            }
            if (!accepted) {
              topicShort++;
              console.log('    [gap] ' + category + '/' + name + ' / ' + difficulty + ' slot ' + k + ': no valid unique question in ' + MAX_RETRIES + ' attempts');
            }
          }
        }
        const ins = await AptitudeQuestion.insertMany(qs);
        qc += ins.length;
        if (topicShort > 0) shortTopics.push(category + '/' + name + ': ' + (150 - topicShort) + '/150');
        console.log('  ' + category + '/' + name + ': ' + ins.length + ' questions');
      }
    }
    if (shortTopics.length > 0) {
      console.log('\nTopics below 150 (generator bank exhausted after all retries):');
      shortTopics.forEach(s => console.log('  ' + s));
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