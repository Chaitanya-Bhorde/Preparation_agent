// OFFLINE bank-capacity probe - simulates the seeder's exact rng/validate/dedupe/retry
// loop for every topic WITHOUT a database. Usage: node _bank_probe.js
const path = require('path');
const { validateQuestion, normalizeText } = require('./_questionValidator');
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
const GENS = Object.assign({}, q1.G, q2.G, l1.G, l2.G, v1.G, v2.G, qv2.G, lv2.G, vv2.G, vv3.G, lv3.G, vv4.G, l5.G, v5.G);
const rngFor = (n, i) => {
  let a = (n.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) * 1000 + i * 7919) >>> 0;
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; const t0 = Math.imul(a ^ a >>> 15, 1 | a); const t = t0 + Math.imul(t0 ^ t0 >>> 7, 61 | t0) ^ t0; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
};
const ri = (r, a, b) => Math.floor(r() * (b - a + 1)) + a;
const pk = (r, arr) => arr[Math.floor(r() * arr.length)];
function buildMCQ(o) {
  const rng = typeof o.r === 'function' ? o.r : () => 0;
  const seen = new Set([normalizeText(o.right)]);
  const it = [{ l: '', t: String(o.right), c: true }];
  (o.wrong || []).forEach(t => { const key = normalizeText(t); if (!key || seen.has(key)) return; seen.add(key); it.push({ l: '', t: String(t), c: false }); });
  for (let i = it.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const tmp = it[i]; it[i] = it[j]; it[j] = tmp; }
  it.forEach((x, idx) => { x.l = 'ABCD'[idx]; });
  let explanation = String(o.explanation || '').trim();
  if (explanation.length < 10) {
    const stepText = (Array.isArray(o.steps) ? o.steps : []).map(s => String(s).trim()).filter(Boolean).join(' ');
    explanation = ('Correct answer: ' + o.right + '. ' + stepText).trim();
  }
  return { topicId: o.topicId, category: o.category, topic: o.topic, questionText: o.stem, options: it.map(x => ({ label: x.l, text: x.t, isCorrect: x.c })), correctAnswer: it.find(x => x.c).l, explanation, solutionSteps: (Array.isArray(o.steps) ? o.steps : []).map(s => String(s)).filter(s => s && s.trim()), difficulty: o.difficulty || pk(rng, ['easy', 'medium', 'hard']), timeLimit: o.timeLimit || 90, source: o.source || 'TCS NQT' };
}
let okCount = 0, shortCount = 0;
const shorts = [];
const allKeys = ['quantitative', 'logical', 'verbal'];
for (const category of allKeys) {
  for (const name of meta.CATEGORIES[category]) {
    const gen = GENS[name];
    if (!gen) { console.log('NO GENERATOR: ' + name); shortCount++; shorts.push(category + '/' + name + ': NO GEN'); continue; }
    let topicShort = 0;
    let qi = 0;
    for (const difficulty of ['easy', 'medium', 'hard']) {
      const seenTexts = new Set();
      for (let k = 0; k < 50; k++, qi++) {
        let accepted = false;
        for (let attempt = 0; attempt < 60 && !accepted; attempt++) {
          const rl = rngFor(name + '|' + difficulty + '|' + k + '|' + attempt, qi * 7 + attempt * 977);
          let q;
          try { q = gen(rl, qi + attempt, { ri, pk, buildMCQ }); } catch (e) { continue; }
          q.topicId = 'x'; q.topic = name; q.category = category;
          q.difficulty = difficulty;
          const v = validateQuestion(q);
          if (!v.valid) continue;
          const key = normalizeText(q.questionText);
          if (!key || seenTexts.has(key)) continue;
          seenTexts.add(key);
          accepted = true;
        }
        if (!accepted) topicShort++;
      }
    }
    const got = 150 - topicShort;
    if (topicShort === 0) okCount++; else { shortCount++; shorts.push(category + '/' + name + ': ' + got + '/150'); }
    console.log((topicShort === 0 ? 'OK  ' : 'SHORT ') + category + '/' + name + ': ' + got + '/150');
  }
}
console.log('---');
console.log('OK topics: ' + okCount + ', short topics: ' + shortCount);
if (shorts.length) { console.log('Short topics:'); shorts.forEach(s => console.log('  ' + s)); }