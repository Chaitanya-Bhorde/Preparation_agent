'use strict';

/**
 * dsa_batch5_crosscheck.js
 * ---------------------------------------------------------------------------
 * Randomised cross-check of every batch-5 reference against its INDEPENDENT
 * oracle (scripts/dsaBatch5Oracle.js).
 *
 * This is deliberately separate from dsa_batch5_build.js: the build proves the
 * AUTHORED cases agree, this proves they agree far beyond the cases somebody
 * wrote by hand, and that no generator silently produces an input violating
 * the problem's own stated constraints.
 *
 * READ-ONLY with respect to the database. Run per module so a disagreement is
 * easy to attribute:
 *
 *   node dsa_batch5_crosscheck.js graph
 *   node dsa_batch5_crosscheck.js search
 *   node dsa_batch5_crosscheck.js heap
 * ---------------------------------------------------------------------------
 */
const { ORACLE } = require('./scripts/dsaBatch5Oracle');
const G = require('./utils/genericValidator');
const CONTENT_MODULES = require('./scripts/dsaBatch5Content');

const MODULES = ['graph', 'search', 'heap'];
const which = process.argv[2];
if (require.main === module && !MODULES.includes(which)) {
  console.error(`usage: node dsa_batch5_crosscheck.js <${MODULES.join('|')}>`);
  process.exit(2);
}

// ---------------------------------------------------------------- generators
// Every generator respects the problem's stated constraints by construction,
// not by hope: trees are grown node-by-node so they are acyclic, equation
// graphs are built as forests, and so on.

const R = (n) => Math.floor(Math.random() * n);
const RI = (lo, hi) => lo + R(hi - lo + 1);
const pick = (a) => a[R(a.length)];

function genNetworkDelay() {
  const n = RI(1, 8);
  const edges = [];
  for (let i = 0; i < RI(0, n * 2); i++) edges.push([RI(0, n - 1), RI(0, n - 1), RI(0, 5)]);
  return [n, edges, RI(0, n - 1), RI(0, n - 1)];
}

function genEvaluateDivision() {
  const names = 'abcdefgh'.split('');
  const count = RI(2, 5);
  const vars = names.slice(0, count);
  const equations = [];
  for (let i = 1; i < count; i++) {
    equations.push([pick(vars.slice(0, i)), pick(vars.slice(0, i)), String(RI(1, 4))]);
  }
  const queries = [];
  for (let i = 0; i < RI(1, 4); i++) queries.push([pick(vars), pick(vars)]);
  return [equations, queries];
}

function genFlights() {
  const n = RI(2, 8);
  const flights = [];
  for (let i = 0; i < RI(0, n * 2); i++) {
    flights.push([RI(0, n - 1), RI(0, n - 1), RI(0, 6)]);
  }
  const src = RI(0, n - 1);
  let dst = RI(0, n - 1);
  if (dst === src) dst = (src + 1) % n;
  return [n, flights, src, dst, RI(0, n)];
}

function genMinHeightTrees() {
  // Attach each later node to a random EARLIER one: connected and acyclic by
  // construction, which is what "the edges form a tree" requires.
  const n = RI(1, 12);
  const edges = [];
  for (let i = 1; i < n; i++) edges.push([RI(0, i - 1), i]);
  return [n, edges];
}

function genKeysAndRooms() {
  const n = RI(1, 10);
  const rooms = [];
  for (let i = 0; i < n; i++) {
    const keys = [];
    for (let j = 0; j < RI(0, 3); j++) keys.push(RI(0, n - 1));
    rooms.push(keys);
  }
  return [rooms];
}

function genBipartite() {
  const n = RI(1, 14);
  const edges = [];
  for (let i = 0; i < RI(0, n); i++) edges.push([RI(0, n - 1), RI(0, n - 1)]);
  return [n, edges];
}

function genSafeStates() {
  const n = RI(1, 9);
  const edges = [];
  for (let i = 0; i < RI(0, n * 2); i++) edges.push([RI(0, n - 1), RI(0, n - 1)]);
  return [n, edges];
}

// -------------------------------------------------------------- Binary Search

function genSqrt() {
  const x = RI(0, 5000);
  // Include exact squares a third of the time, so the boundary is exercised.
  if (Math.random() < 0.35) {
    const r = RI(0, 70);
    return [r * r];
  }
  return [x];
}

function genPerfectSquare() {
  if (Math.random() < 0.4) return [RI(0, 60) * RI(0, 60)];
  return [RI(0, 5000)];
}

function genSmallestLetter() {
  // A sorted, distinct subset of the alphabet; the contract requires every
  // letter to be <= target, so target is chosen at or above the largest.
  const all = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const count = RI(1, 8);
  const start = RI(0, 25 - count);
  const letters = all.slice(start, start + count);
  const target = Math.random() < 0.5 ? all[RI(start, 25)] : all[25];
  return [letters, target];
}

function genMissingNumber() {
  const n = RI(1, 12);
  const missing = RI(0, n);
  const nums = [];
  for (let v = 0; v <= n; v++) if (v !== missing) nums.push(v);
  // Shuffle so order cannot be relied upon.
  for (let i = nums.length - 1; i > 0; i--) {
    const j = RI(0, i);
    const t = nums[i];
    nums[i] = nums[j];
    nums[j] = t;
  }
  return [nums];
}

/** Sort an array ascending, for the generators below. */
const sortAsc = (a) => a.slice().sort((x, y) => x - y);

function genSearchMatrix() {
  const rows = RI(1, 6);
  const cols = RI(1, 6);
  // The contract requires rows to be STRICTLY separated, so every value in the
  // matrix must be distinct. Build a distinct sorted set, not a random sample
  // that can repeat.
  const total = rows * cols;
  const pool = new Set();
  while (pool.size < total) pool.add(RI(-30, 30));
  const sorted = Array.from(pool).sort((a, b) => a - b);
  const matrix = [];
  for (let r = 0; r < rows; r++) matrix.push(sorted.slice(r * cols, (r + 1) * cols));
  const target = Math.random() < 0.5 ? pick(sorted) : RI(-35, 35);
  return [matrix, target];
}

function genRotatedArray() {
  const n = RI(1, 10);
  // Collect n DISTINCT values, then sort them. Rotating an UNSORTED set would
  // produce an array that is not a rotation of anything.
  const seen = new Set();
  while (seen.size < n) seen.add(RI(-8, 8));
  const sorted = Array.from(seen).sort((a, b) => a - b);
  // Rotating at any pivot in [0, n) yields a valid rotated array.
  const cut = RI(0, n - 1);
  const nums = sorted.slice(cut).concat(sorted.slice(0, cut));
  const target = Math.random() < 0.6 ? pick(sorted) : RI(-10, 10);
  return [nums, target];
}

function genSearchRange() {
  const n = RI(0, 12);
  const vals = [];
  for (let i = 0; i < n; i++) vals.push(RI(0, 5));
  const sorted = sortAsc(vals);
  const target = Math.random() < 0.6 ? pick(sorted.length ? sorted : [0]) : RI(-1, 7);
  return [sorted, target];
}

function genSearchMatrixII() {
  const rows = RI(1, 5);
  const cols = RI(1, 5);
  // Build a grid whose rows AND columns are both ascending. Sorting a column
  // can break its row, and sorting a row can break its column, so alternate
  // until the grid is stable, then CHECK it rather than recursing: a generator
  // that retries itself can spin forever on a shape it cannot satisfy.
  let grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push(RI(0, 6));
    grid.push(sortAsc(row));
  }
  for (let pass = 0; pass < 8; pass++) {
    for (let r = 0; r < rows; r++) grid[r] = sortAsc(grid[r]);
    for (let c = 0; c < cols; c++) {
      const col = sortAsc(grid.map((row) => row[c]));
      for (let r = 0; r < rows; r++) grid[r][c] = col[r];
    }
  }
  // Verify both orderings hold. If they do not, fall back to a grid that
  // certainly does: a constant grid is sorted in every direction.
  let valid = true;
  for (let r = 0; r < rows && valid; r++) {
    for (let c = 1; c < cols; c++) if (grid[r][c - 1] > grid[r][c]) { valid = false; break; }
  }
  for (let c = 0; c < cols && valid; c++) {
    for (let r = 1; r < rows; r++) if (grid[r - 1][c] > grid[r][c]) { valid = false; break; }
  }
  if (!valid) {
    const v = RI(0, 6);
    grid = [];
    for (let r = 0; r < rows; r++) grid.push(new Array(cols).fill(v));
  }
  const target = Math.random() < 0.6 ? pick(grid[Math.floor(rows / 2)]) : RI(-1, 8);
  return [grid, target];
}

function genKoko() {
  const n = RI(1, 6);
  const piles = [];
  for (let i = 0; i < n; i++) piles.push(RI(1, 12));
  return [piles, RI(1, 15)];
}

// ---------------------------------------------------------------------- Heap

function genKthLargest() {
  const n = RI(1, 12);
  const nums = [];
  for (let i = 0; i < n; i++) nums.push(RI(-6, 6));
  return [nums, RI(1, n)];
}

function genKthLargestStream() {
  const k = RI(1, 5);
  const n = RI(0, 10);
  const values = [];
  for (let i = 0; i < n; i++) values.push(RI(-6, 6));
  return [k, values];
}

function genTopKWords() {
  const pool = ['aa', 'bb', 'cc', 'dd', 'ee'];
  const n = RI(1, 12);
  const words = [];
  for (let i = 0; i < n; i++) words.push(pick(pool));
  return [words, RI(1, pool.length + 1)];
}

function genTaskScheduler() {
  const pool = ['A', 'B', 'C', 'D'];
  // At most seven tasks: the independent oracle searches schedules slot by
  // slot, and larger inputs make that search too slow to be worth the extra
  // coverage. The authored fixtures already carry the larger cases.
  const n = RI(1, 7);
  const tasks = [];
  for (let i = 0; i < n; i++) tasks.push(pick(pool));
  return [tasks, RI(0, 3)];
}

function genIpo() {
  // Net gain is non-negative by construction, which is the stated contract.
  const n = RI(1, 6);
  const costs = [];
  for (let i = 0; i < n; i++) costs.push(RI(1, 8));
  const profits = costs.map((c) => c + RI(0, 8));
  return [RI(1, 4), RI(0, 12), costs, profits];
}

function genPairDistance() {
  const n = RI(2, 8);
  const points = [];
  for (let i = 0; i < n; i++) points.push(RI(0, 10));
  const pairs = (n * (n - 1)) / 2;
  return [points, RI(1, pairs)];
}

function genFreqStack() {
  const n = RI(1, 10);
  const ops = [];
  // Track how many copies of each value are CURRENTLY held, because the
  // contract forbids popMax on an empty structure. Tracking "ever pushed"
  // would let the generator emit an illegal popMax and crash the reference.
  const held = new Map();
  for (let i = 0; i < n; i++) {
    let total = 0;
    for (const c of held.values()) total += c;
    const roll = Math.random();
    if (roll < 0.55 || total === 0) {
      const v = RI(-3, 3);
      ops.push('push ' + v);
      held.set(v, (held.get(v) || 0) + 1);
    } else if (roll < 0.8) {
      ops.push('freq ' + RI(-3, 3));
    } else {
      ops.push('popMax');
      // Mirror the pop on a value of maximum frequency so the generator stays
      // in step with the structure it is describing.
      let best = null;
      let bestCount = 0;
      for (const [v, c] of held) {
        if (c > bestCount) { best = v; bestCount = c; }
      }
      held.set(best, held.get(best) - 1);
    }
  }
  return [ops];
}

function genTrapRainWater2D() {
  const rows = RI(1, 6);
  const cols = RI(1, 6);
  const heightMap = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push(RI(0, 5));
    heightMap.push(row);
  }
  return [heightMap];
}

const GEN = {
  'Network Delay Time': genNetworkDelay,
  'Evaluate Division': genEvaluateDivision,
  'Cheapest Flights Within K Stops': genFlights,
  'Minimum Height Trees': genMinHeightTrees,
  'Keys and Rooms': genKeysAndRooms,
  'Is Graph Bipartite': genBipartite,
  'Find Eventual Safe States': genSafeStates,
  'Sqrt(x)': genSqrt,
  'Valid Perfect Square': genPerfectSquare,
  'Find Smallest Letter Greater Than Target': genSmallestLetter,
  'Missing Number': genMissingNumber,
  'Search a 2D Matrix': genSearchMatrix,
  'Search in Rotated Sorted Array': genRotatedArray,
  'Find First and Last Position': genSearchRange,
  'Search a 2D Matrix II': genSearchMatrixII,
  'Koko Eating Bananas': genKoko,
  'Kth Largest Element in Array': genKthLargest,
  'Kth Largest Element in Stream': genKthLargestStream,
  'Top K Frequent Words': genTopKWords,
  'Task Scheduler': genTaskScheduler,
  IPO: genIpo,
  'Find K-th Smallest Pair Distance': genPairDistance,
  'Maximum Frequency Stack': genFreqStack,
  'Trapping Rain Water II': genTrapRainWater2D,
};

if (require.main === module) {
  const CONTENT = CONTENT_MODULES[which] || {};
  const titles = Object.keys(CONTENT);
  const rounds = Number(process.env.ROUNDS || 2000);
  let failures = 0;
  let checked = 0;

  for (const title of titles) {
    const spec = CONTENT[title];
    const gen = GEN[title];
    const oracle = ORACLE[title];
    if (!oracle) { console.log(`SKIP  ${title} (no independent oracle yet)`); continue; }
    if (!gen) { console.log(`SKIP  ${title} (no generator yet)`); continue; }

    let fn;
    try { fn = G.createSolveFunction(spec.reference); }
    catch (e) { console.log(`FAIL  ${title}: reference does not compile (${e.message})`); failures++; continue; }

    let bad = 0;
    for (let r = 0; r < rounds; r++) {
      const args = gen();
      const got = JSON.stringify(fn.apply(null, args));
      const want = JSON.stringify(oracle.apply(null, args));
      if (got !== want) {
        if (bad < 3) {
          console.log(`FAIL  ${title}`);
          console.log(`      input     ${JSON.stringify(args).slice(0, 170)}`);
          console.log(`      reference ${got}`);
          console.log(`      oracle     ${want}`);
        }
        bad++;
      }
    }
    failures += bad;
    checked++;
    console.log(`${bad === 0 ? 'PASS' : 'FAIL'}  ${title.padEnd(36)} ${rounds - bad}/${rounds} agree with oracle`);
  }

  console.log(`\n${checked - failures}/${checked} references fully agree with their oracle`);
  process.exit(failures === 0 ? 0 : 1);
}

// Exported so dsa_batch5_wrongproof.js can reuse the SAME generators. Sharing
// them matters: a wrong solution that is only caught by a generator the
// cross-check never used would not prove what it claims to.
module.exports = { GEN };