// auditAptitudeVariety.js
// Measures REAL variety of the aptitude generators using the exact seeder harness
// (seeded rng per index, buildMCQ shuffling). Run: node auditAptitudeVariety.js
const q1 = require('./_aptGen_quant');
const q2 = require('./_aptGen_quant2');
const l1 = require('./_aptGen_logical');
const l2 = require('./_aptGen_logical2');
const v1 = require('./_aptGen_verbal');
const v2 = require('./_aptGen_verbal2');
const qv2 = require('./_aptGen2_quant');
const lv2 = require('./_aptGen2_logical');
const vv2 = require('./_aptGen2_verbal');
const qv3 = require('./_aptGen3_verbal');
const lv3 = require('./_aptGen3_logical');
const meta = require('./_aptSub');

const GENS = Object.assign({}, q1.G, q2.G, l1.G, l2.G, v1.G, v2.G, qv2.G, lv2.G, vv2.G, (qv3 && (qv3.G || qv3)), (lv3 && (lv3.G || lv3)));
const CAT = meta.CATEGORIES;
const ALL = [].concat(CAT.quantitative, CAT.logical, CAT.verbal);

function rngFor(n, i) {
  let a = (n.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) * 1000 + i * 7919) >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const ri = (r, a, b) => Math.floor(r() * (b - a + 1)) + a;
const pk = (r, arr) => arr[Math.floor(r() * arr.length)];
const DIFF = ['easy', 'medium', 'hard'];

function buildMCQ(o) {
  const rng = typeof o.r === 'function' ? o.r : () => 0;
  const it = [{ l: '', t: String(o.right), c: true }];
  o.wrong.forEach(t => it.push({ l: '', t: String(t), c: false }));
  for (let i = it.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [it[i], it[j]] = [it[j], it[i]]; }
  it.forEach((x, idx) => { x.l = 'ABCD'[idx]; });
  return {
    topic: o.topic, questionText: o.stem,
    options: it.map(x => ({ label: x.l, text: x.t, isCorrect: x.c })),
    correctAnswer: it.find(x => x.c).l,
    explanation: o.explanation, solutionSteps: o.steps,
    difficulty: o.difficulty || pk(rng, DIFF),
  };
}

function audit() {
  const rows = [];
  let allBad = 0, allUniq = 0, allCount = 0, allFp = 0;
  for (const name of ALL) {
    const gen = GENS[name];
    if (!gen) { rows.push({ name, err: 'NO GENERATOR' }); continue; }
    const all = [];
    let qi = 0;
    let topicErr = null;
    try {
      for (const difficulty of ['easy', 'medium', 'hard']) {
        for (let k = 0; k < 50; k++, qi++) {
          const rl = rngFor(name, qi);
          const qc = { ri, pk, buildMCQ, difficulty };
          let q;
          try {
            q = gen(rl, qi, qc);
          } catch (e) {
            q = { questionText: 'ERR:' + e.message, solutionSteps: [], explanation: '', options: [], correctAnswer: '' };
          }
          q.difficulty = difficulty;
          all.push(q);
        }
      }
    } catch (e) { topicErr = e.message; }
    if (topicErr) { rows.push({ name, err: topicErr }); continue; }
    const count = (diff) => all.filter(q => q.difficulty === diff).length;
    const uniq = (diff) => new Set(all.filter(q => q.difficulty === diff).map(q => String(q.questionText))).size;
    // fingerprint = question + option texts + answer label => genuine content identity
    const fp = (diff) => new Set(all.filter(q => q.difficulty === diff).map(q => String(q.questionText) + '|' + (Array.isArray(q.options) ? q.options.map(o => o.text).join('~') : '') + '|' + q.correctAnswer)).size;
    const bad = all.filter(q => !q.questionText || String(q.questionText).includes('undefined') || String(q.questionText).includes('NaN') || !Array.isArray(q.solutionSteps) || q.solutionSteps.length === 0).length;
    const optionsBad = all.filter(q => !Array.isArray(q.options) || q.options.length !== 4 || !q.correctAnswer).length;
    const noSoln = all.filter(q => !q.explanation || String(q.explanation).includes('undefined')).length;
    rows.push({
      name,
      e: count('easy'), m: count('medium'), h: count('hard'),
      eu: uniq('easy'), mu: uniq('medium'), hu: uniq('hard'),
      ef: fp('easy'), mf: fp('medium'), hf: fp('hard'),
      bad, noSoln, optionsBad,
    });
    allBad += bad; allUniq += uniq('easy') + uniq('medium') + uniq('hard'); allCount += 150;
    allFp += fp('easy') + fp('medium') + fp('hard');
  }
  return { rows, allBad, allUniq, allCount, allFp };
}

const { rows, allBad, allUniq, allCount, allFp } = audit();
let summary = 'Topic                          E     M     H   [unique stems/diff]   [unique fingerprints/diff]   bad  optBad  noSoln\n';
summary += '-----------------------------------------------------------------------------------------------\n';
for (const r of rows) {
  if (r.err) { summary += r.name.padEnd(28) + '  ERR: ' + r.err + '\n'; continue; }
  summary += r.name.padEnd(28) +
    ('E' + r.e + '(' + r.eu + ') ').padEnd(13) +
    ('M' + r.m + '(' + r.mu + ') ').padEnd(13) +
    ('H' + r.h + '(' + r.hu + ') ').padEnd(13) +
    ('F' + r.ef + '/' + r.mf + '/' + r.hf).padEnd(15) +
    ('bad=' + r.bad).padEnd(8) +
    ('optBad=' + r.optionsBad).padEnd(10) +
    'noSoln=' + r.noSoln + '\n';
}
console.log(summary);
console.log('TOTAL unique stems across all difficulties: ' + allUniq + ' / ' + allCount + ' (' + Math.round(allUniq * 100 / allCount) + '%)');
console.log('TOTAL unique fingerprints across all difficulties: ' + allFp + ' / ' + allCount + ' (' + Math.round(allFp * 100 / allCount) + '%)');
console.log('TOTAL bad questions: ' + allBad);
module.exports = { audit, GENS };