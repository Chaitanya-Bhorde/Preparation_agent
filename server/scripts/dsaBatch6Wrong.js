'use strict';

/**
 * dsaBatch6Wrong.js
 * ---------------------------------------------------------------------------
 * A DELIBERATELY WRONG solution for each batch-6 problem.
 *
 * These exist so the build can prove the hidden suite actually discriminates:
 * a wrong solution must be rejected by the VISIBLE cases and by the HIDDEN ones,
 * otherwise a learner could pass by returning anything plausible.
 *
 * Each differs from the reference by exactly one specific, explainable mistake
 * (an off-by-one, a dropped constraint, a wrong tie-break), never by being
 * uniformly sloppy. dsa_batch6_wrongproof.js then proves, over many randomised
 * inputs, that each really is wrong and really is caught by the fixtures.
 * ---------------------------------------------------------------------------
 */

const WRONG = {};

WRONG['K Items with Maximum Sum'] = (k, nums) => {
  const sorted = nums.slice().sort((a, b) => b - a);
  let total = 0;
  for (let i = 0; i <= k && i < sorted.length; i++) total += sorted[i];
  return total;
};

WRONG['Word Pattern'] = (pattern, str) => {
  const words = str.split(' ');
  if (words.length !== pattern.length) return false;
  const map = new Map();
  for (let i = 0; i < words.length; i++) {
    const ch = pattern[i];
    if (map.has(ch) && map.get(ch) !== words[i]) return false;
    map.set(ch, words[i]);
  }
  return true;
};

WRONG['Isomorphic Strings'] = (s, t) => {
  if (s.length !== t.length) return false;
  const map = new Map();
  for (let i = 0; i < s.length; i++) {
    if (map.has(s[i]) && map.get(s[i]) !== t[i]) return false;
    map.set(s[i], t[i]);
  }
  return true;
};

WRONG['Longest Consecutive Sequence'] = (nums) => {
  const sorted = nums.slice().sort((a, b) => a - b);
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1]) run++;
    else if (sorted[i] === sorted[i - 1] + 1) run++;
    else run = 1;
    if (run > best) best = run;
  }
  return nums.length ? best : 0;
};

const descending = (nums) => nums.slice().sort((a, b) => b - a);
WRONG['Bubble Sort'] = descending;
WRONG['Insertion Sort'] = descending;
WRONG['Selection Sort'] = descending;
WRONG['Merge Sort'] = descending;
WRONG['Quick Sort'] = descending;

WRONG['Largest Number'] = (nums) => nums.slice().sort((a, b) => a - b).join('');

WRONG['Relative Sort Array'] = (arr1) => arr1.slice().sort((a, b) => a - b);

WRONG['Meeting Rooms'] = (intervals) => {
  const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i][0] <= sorted[i - 1][1]) return false;
  }
  return true;
};

WRONG['Meeting Rooms II'] = (intervals) => {
  const events = [];
  for (const iv of intervals) {
    events.push([iv[0], 0]);
    events.push([iv[1], 1]);
  }
  // Start (0) sorts BEFORE end (1) at equal coordinates - the classic bug.
  events.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
  let active = 0;
  let best = 0;
  for (let i = 0; i < events.length; i++) {
    active += events[i][1] === 0 ? 1 : -1;
    if (active > best) best = active;
  }
  return best;
};

WRONG['Insert Interval'] = (intervals, newInterval) => {
  const ns = newInterval[0];
  const ne = newInterval[1];
  const out = [];
  let i = 0;
  while (i < intervals.length && intervals[i][1] < ns) { out.push(intervals[i]); i++; }
  let s = ns;
  let e = ne;
  while (i < intervals.length && intervals[i][0] <= e) {
    if (intervals[i][0] < s) s = intervals[i][0];
    if (intervals[i][1] > e) e = intervals[i][1];
    i++;
  }
  out.push([s, e]);
  // BUG: the remaining intervals are dropped.
  return out;
};

// A very common misreading: it treats nums[i] as the ONLY legal jump length
// rather than the maximum, so it misses every shorter landing spot.
WRONG['Jump Game Greedy'] = (nums) => {
  let i = 0;
  let steps = 0;
  while (i < nums.length - 1 && steps <= nums.length) {
    if (nums[i] === 0) return false;
    i += nums[i];
    steps++;
  }
  return i >= nums.length - 1;
};

WRONG['Jump Game II Greedy'] = (nums) => {
  // BUG: counts how far past the start the furthest reach is, which is NOT the
  // number of jumps. Taking the biggest leap each time (2,3,1,1,4 -> one leap
  // to index 4 then one more) gives 1 here, while the minimum is 2.
  let reach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return -1;
    if (i + nums[i] > reach) reach = i + nums[i];
  }
  if (reach < nums.length - 1) return -1;
  return nums.length > 1 ? reach - nums.length + 1 : 0;
};

WRONG['Candy Greedy'] = (ratings) => {
  const n = ratings.length;
  const out = new Array(n).fill(1);
  for (let i = 1; i < n; i++) {
    if (ratings[i] > ratings[i - 1]) out[i] = out[i - 1] + 1;
  }
  let total = 0;
  for (const c of out) total += c;
  return total;
};

WRONG['Best Time to Buy Sell Stock II'] = (prices) => {
  let best = 0;
  for (let i = 0; i < prices.length; i++) {
    for (let j = i + 1; j < prices.length; j++) {
      const gain = prices[j] - prices[i];
      if (gain > best) best = gain;
    }
  }
  return best;
};

const WRONG2 = {};

WRONG2['N-Queens II'] = (n) => {
  const cols = [];
  const main = new Set();
  let count = 0;
  const place = (row) => {
    if (row === n) { count++; return; }
    for (let col = 0; col < n; col++) {
      if (cols.includes(col) || main.has(row + col)) continue;
      cols.push(col);
      main.add(row + col);
      place(row + 1);
      cols.pop();
      main.delete(row + col);
    }
  };
  place(0);
  return count;
};

WRONG2['Beautiful Arrangement'] = (n) => {
  const used = new Array(n + 1).fill(false);
  let count = 0;
  const rec = (pos) => {
    if (pos > n) { count++; return; }
    for (let v = 1; v <= n; v++) {
      if (used[v]) continue;
      // BUG: only one direction of the divisibility rule is honoured.
      if (pos % v === 0) { used[v] = true; rec(pos + 1); used[v] = false; }
    }
  };
  rec(1);
  return count;
};

// Off-by-one in the candidate digit range: it only ever tries 1..8, so a cell
// that needs a 9 is left empty and the returned grid is incomplete.
//
// An earlier version of this wrong solution dropped the 3x3 box check, and then
// a variant dropped the row check. Both proved nothing: on a puzzle with a
// UNIQUE solution, backtracking still walks to the same completed grid even
// with a weaker constraint, so the wrong solver agreed on every input. A bug
// that changes the search SPACE is only detectable when it can also change the
// RESULT, which a narrowed digit range does.
WRONG2['Sudoku Solver'] = (board) => {
  const g = board.map((r) => r.slice());
  const fits = (r, c, v) => {
    for (let i = 0; i < 9; i++) {
      if (g[r][i] === v) return false;
      if (g[i][c] === v) return false;
    }
    const br = 3 * Math.floor(r / 3);
    const bc = 3 * Math.floor(c / 3);
    for (let i = br; i < br + 3; i++) {
      for (let j = bc; j < bc + 3; j++) if (g[i][j] === v) return false;
    }
    return true;
  };
  const rec = () => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (g[r][c] !== '.') continue;
        for (let d = 1; d <= 8; d++) {          // BUG: should be d <= 9
          const v = String(d);
          if (!fits(r, c, v)) continue;
          g[r][c] = v;
          if (rec()) return true;
          g[r][c] = '.';
        }
        return false;
      }
    }
    return true;
  };
  rec();
  return g;
};

Object.assign(WRONG, WRONG2);
/**
 * Turn a wrong solution into SUBMITTABLE SOURCE TEXT.
 *
 * `fn.toString()` yields a bare arrow function such as `(k, nums) => { ... }`,
 * which the driver cannot call: the platform concatenates the user code with a
 * driver that invokes a NAMED function, so a bare arrow produces a RuntimeError
 * instead of a WrongAnswer. That failure looks like a pass ("not Accepted") but
 * proves nothing, because the code never ran.
 *
 * So each wrong solution is wrapped in a real `function <name>(...)` declaration
 * whose name matches the problem's stored functionSignature.
 *
 * The body is copied verbatim rather than re-derived, which keeps the shipped
 * text identical to what dsa_batch6_wrongproof.js already proved. The two
 * remaining cases are the shared `descending` helper and the other arrow
 * functions, and both are handled by the brace scan below.
 */
function wrongSourceFor(fn, name, paramNames) {
  const src = fn.toString();
  // Everything up to the top-level `=>` belongs to the arrow header.
  const arrow = src.indexOf('=>');
  if (arrow === -1) throw new Error(`wrongSourceFor: not an arrow function: ${name}`);
  const rest = src.slice(arrow + 2).trim();
  // Two body forms exist: a braced block (`=> { ... }`) and a bare expression
  // (`=> expr`). An expression body has to be wrapped in braces, otherwise the
  // emitted declaration would be truncated at the first `)` inside the
  // expression and would not parse at all.
  const body = rest.startsWith('{') ? rest : `{ return ${rest}; }`;
  return `function ${name}(${paramNames.join(', ')}) ${body}`;
}

module.exports = { WRONG, wrongSourceFor };