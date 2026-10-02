'use strict';

/**
 * dsa_batch6_wrongproof.js
 * ---------------------------------------------------------------------------
 * Proves each batch-6 wrong solution is BOTH genuinely wrong AND caught by the
 * stored fixtures. Two separate claims, often confused:
 *
 *   genuinelyWrong   - on randomised inputs drawn from the problem's OWN
 *                      constraints, the wrong solution disagrees with the
 *                      reference often enough that it is not merely a
 *                      differently-written correct answer.
 *   caughtByFixtures - the authored cases reject it, and specifically so do the
 *                      HIDDEN ones. Identical output on some cases is fine as
 *                      long as enough separate them; a discriminator separated
 *                      only by one lucky input is not evidence. Every problem
 *                      must have at least one VISIBLE case and at least one
 *                      HIDDEN case that rejects it, or Run would not gate Submit.
 *
 *   node dsa_batch6_wrongproof.js [rounds]
 * ---------------------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');
const CONTENT_MODULES = require('./scripts/dsaBatch6Content');
const { WRONG } = require('./scripts/dsaBatch6Wrong');

const CONTENT = {};
for (const mod of Object.keys(CONTENT_MODULES)) {
  for (const [title, spec] of Object.entries(CONTENT_MODULES[mod])) CONTENT[title] = spec;
}

const ROUNDS = Number(process.argv[2] || 400);
const RI = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const WORDS = ['dog', 'cat', 'fish', 'bird', 'tree', 'blue', 'red', 'ox'];
const LETTERS = 'abcde'.split('');

/** Intervals deliberately biased so that many of them TOUCH (one's end equals
 *  the next one's start). Touching endpoints are the only situation a strict
 *  `<=` comparison can get wrong, so a uniform random generator almost never
 *  produces the bug and the wrong solution looks "never wrong". */
function genIntervals(count) {
  const out = [];
  let cursor = RI(0, 5);
  for (let i = 0; i < count; i++) {
    if (Math.random() < 0.5) {
      // Chain onto the previous end so the pair touches exactly.
      const s = out.length ? out[out.length - 1][1] : cursor;
      out.push([s, s + RI(1, 5)]);
    } else {
      const s = cursor + RI(1, 6);
      out.push([s, s + RI(1, 6)]);
      cursor = s;
    }
  }
  return { intervals: out };
}
function genOneInterval() { const s = RI(0, 20); return [s, s + RI(1, 8)]; }
function genSortedIntervals(count) {
  const out = [];
  let t = RI(0, 5);
  for (let i = 0; i < count; i++) {
    const s = t + RI(2, 5);
    const e = s + RI(1, 3);
    out.push([s, e]);
    t = e + 1;
  }
  return out;
}
/** A real Sudoku puzzle: a solved grid with a whole band and a whole stack
 *  punched out, so the puzzle needs real search rather than per-cell
 *  elimination. Cells are chosen randomly per call so the proof does not keep
 *  re-testing one fixed puzzle, which is what made the wrong solver look
 *  "never wrong" before. */
function genSudoku() {
  const board = [
    ['5', '3', '4', '6', '7', '8', '9', '1', '2'], ['6', '7', '2', '1', '9', '5', '3', '4', '8'],
    ['1', '9', '8', '3', '4', '2', '5', '6', '7'], ['8', '5', '9', '7', '6', '1', '4', '2', '3'],
    ['4', '2', '6', '8', '5', '3', '7', '9', '1'], ['7', '1', '3', '9', '2', '4', '8', '5', '6'],
    ['9', '6', '1', '5', '3', '7', '2', '8', '4'], ['2', '8', '7', '4', '1', '9', '6', '3', '5'],
    ['3', '4', '5', '2', '8', '6', '1', '7', '9'],
  ].map((row) => row.slice());
  // Punch out two cells from the SAME 3x3 box, chosen randomly, so the search
  // sometimes has to place a 9 (which a solver capped at 1..8 cannot do).
  const boxes = [[0, 0], [0, 3], [0, 6], [3, 0], [3, 3], [3, 6], [6, 0], [6, 3], [6, 6]];
  for (let k = 0; k < 3; k++) {
    const [br, bc] = pick(boxes);
    const offs = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]];
    const shuffled = offs.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < 2; i++) {
      const [dr, dc] = shuffled[i];
      board[br + dr][bc + dc] = '.';
    }
  }
  return board;
}

const numArr = (lo, hi, n) => Array.from({ length: n }, () => RI(lo, hi));

const GEN = {
  'K Items with Maximum Sum': () => { const n = RI(1, 9); return { k: RI(1, n), nums: numArr(0, 20, n) }; },
  'Word Pattern': () => { const n = RI(1, 5); return { pattern: Array.from({ length: n }, () => pick(LETTERS)).join(''), str: Array.from({ length: n }, () => pick(WORDS)).join(' ') }; },
  'Isomorphic Strings': () => {
    const n = RI(1, 8);
    const s = Array.from({ length: n }, () => pick(LETTERS));
    const map = {};
    const t = s.map((c) => { if (map[c]) return map[c]; map[c] = pick(LETTERS); return map[c]; });
    return { s: s.join(''), t: t.join('') };
  },
  'Longest Consecutive Sequence': () => ({ nums: numArr(0, 12, RI(0, 10)) }),
  'Bubble Sort': () => ({ nums: numArr(-5, 5, RI(0, 8)) }),
  'Insertion Sort': () => ({ nums: numArr(-5, 5, RI(0, 8)) }),
  'Selection Sort': () => ({ nums: numArr(-5, 5, RI(0, 8)) }),
  'Merge Sort': () => ({ nums: numArr(-5, 5, RI(0, 8)) }),
  'Quick Sort': () => ({ nums: numArr(-5, 5, RI(0, 8)) }),
  'Largest Number': () => ({ nums: numArr(0, 99, RI(1, 5)) }),
  'Relative Sort Array': () => { const pool = [1, 2, 3, 4]; const arr2 = pool.slice().sort(() => Math.random() - 0.5); return { arr1: Array.from({ length: RI(1, 6) }, () => pick(arr2)), arr2 }; },
  'Meeting Rooms': () => genIntervals(RI(0, 6)),
  'Meeting Rooms II': () => genIntervals(RI(1, 6)),
  'Insert Interval': () => ({ intervals: genSortedIntervals(RI(0, 4)), newInterval: genOneInterval() }),
  'Jump Game Greedy': () => ({ nums: numArr(0, 4, RI(1, 9)) }),
  'Jump Game II Greedy': () => ({ nums: numArr(0, 4, RI(1, 9)) }),
  'Candy Greedy': () => ({ ratings: numArr(0, 4, RI(1, 8)) }),
  'Best Time to Buy Sell Stock II': () => ({ prices: numArr(0, 12, RI(1, 9)) }),
  'N-Queens II': () => ({ n: RI(1, 8) }),
  'Beautiful Arrangement': () => ({ n: RI(1, 8) }),
  'Sudoku Solver': () => ({ board: genSudoku() }),
};
const rows = [];
let failures = 0;

for (const title of Object.keys(CONTENT)) {
  const spec = CONTENT[title];
  const ref = eval(`(${spec.reference})`);
  const wrong = WRONG[title];
  const gen = GEN[title];
  const params = spec.signature.javascript.params.map((p) => p.name);

  if (!wrong || !gen) {
    failures++;
    rows.push({ title, genuinelyWrong: false, caughtByFixtures: false, note: wrong ? 'no generator' : 'no wrong solution' });
    continue;
  }

  // (a) Genuinely wrong: disagree on a meaningful share of randomised inputs.
  let disagree = 0;
  for (let r = 0; r < ROUNDS; r++) {
    const sample = gen();
    const args = params.map((p) => sample[p]);
    let a;
    let b;
    try { a = JSON.stringify(ref.apply(null, args)); b = JSON.stringify(wrong.apply(null, args)); }
    catch (_) { disagree++; continue; }
    if (a !== b) disagree++;
  }
  const genuinelyWrong = disagree >= Math.max(3, ROUNDS * 0.05);

  // (b) Caught by fixtures, with hidden cases doing the work too.
  let visibleReject = 0;
  let hiddenReject = 0;
  for (const c of spec.cases) {
    const args = params.map((p) => c[p]);
    const same = JSON.stringify(ref.apply(null, args)) === JSON.stringify(wrong.apply(null, args));
    if (c.visible) { if (!same) visibleReject++; }
    else if (!same) { hiddenReject++; }
  }
  const caughtByFixtures = visibleReject > 0 && hiddenReject > 0;

  if (!(genuinelyWrong && caughtByFixtures)) failures++;
  rows.push({
    title,
    genuinelyWrong,
    caughtByFixtures,
    disagree,
    disagreePct: ((disagree / ROUNDS) * 100).toFixed(1),
    fixtureRejects: `${visibleReject + hiddenReject}/${spec.cases.length}`,
    visibleReject,
    hiddenReject,
  });
}

const out = path.join(__dirname, '_dsa_batch6_wrongproof.json');
fs.writeFileSync(out, JSON.stringify({ rounds: ROUNDS, rows, failures }, null, 2));
console.log(`rounds=${ROUNDS}  problems=${rows.length}  failures=${failures}`);
console.log(`written: ${path.basename(out)}\n`);
for (const r of rows) {
  const ok = r.genuinelyWrong && r.caughtByFixtures;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.title.padEnd(34)} wrong on ${r.disagree}/${ROUNDS} (${r.disagreePct}%)  fixtures ${r.fixtureRejects} (vis ${r.visibleReject} / hid ${r.hiddenReject})`);
}
console.log(`\n${rows.length - failures}/${rows.length} wrong solutions proven wrong AND caught by fixtures`);
process.exit(failures === 0 ? 0 : 1);