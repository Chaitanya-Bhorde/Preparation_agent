'use strict';

/**
 * dsaBatch6Oracle.js
 * ---------------------------------------------------------------------------
 * INDEPENDENT oracles for the batch-6 references.
 *
 * Written from the problem DEFINITION, deliberately NOT from the reference
 * implementation, and each uses a different algorithm wherever one exists:
 *
 *   K Items with Maximum Sum   sort descending and add the first k (no heap)
 *   Word Pattern               derive the mandated word list, then compare
 *   Isomorphic Strings         canonical relabelling to digits, compared whole
 *   Longest Consecutive        sort a copy, scan runs of +1
 *   All five sorts             compare against the platform's numeric sort
 *   Largest Number             selection sort over the ab-vs-ba comparator
 *   Relative Sort Array        explicit comparator on arr2 indices
 *   Meeting Rooms              compare every PAIR, with no sorting at all
 *   Meeting Rooms II           separate start/end lists merged by hand
 *   Insert Interval            repeatedly coalesce the sorted union
 *   Jump Game I/II             plain BFS over reachable positions
 *   Candy                      two max-scans combined elementwise
 *   Best Time II               (holding, not holding) day-by-day DP
 *   N-Queens II                bitmask search over columns
 *   Beautiful Arrangement      exhaustive permutation enumeration
 *   Sudoku Solver              backtracking that mutates a copy in place
 *
 * dsa_batch6_build.js runs every reference against these on the authored cases
 * AND on randomised inputs, so a reference wrong in the same way as its own
 * fixtures still fails.
 * ---------------------------------------------------------------------------
 */

const ORACLE = {};

ORACLE['K Items with Maximum Sum'] = (k, nums) => {
  const sorted = nums.slice().sort((a, b) => b - a);
  let total = 0;
  for (let i = 0; i < k; i++) total += sorted[i];
  return total;
};

ORACLE['Word Pattern'] = (pattern, str) => {
  const words = str.split(' ');
  if (words.length !== pattern.length) return false;
  const bound = {};
  const usedWords = new Set();
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (!(ch in bound)) {
      if (usedWords.has(words[i])) return false;
      bound[ch] = words[i];
      usedWords.add(words[i]);
    } else if (bound[ch] !== words[i]) {
      return false;
    }
  }
  return true;
};

ORACLE['Isomorphic Strings'] = (s, t) => {
  if (s.length !== t.length) return false;
  const canon = (str) => {
    const map = new Map();
    const out = [];
    for (const ch of str) {
      if (!map.has(ch)) map.set(ch, map.size);
      out.push(map.get(ch));
    }
    return out.join(',');
  };
  return canon(s) === canon(t);
};

ORACLE['Longest Consecutive Sequence'] = (nums) => {
  const sorted = nums.slice().sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] === sorted[i - 1]) continue;
    if (i > 0 && sorted[i] === sorted[i - 1] + 1) run++;
    else run = 1;
    if (run > best) best = run;
  }
  return best;
};

const numericSort = (nums) => nums.slice().sort((a, b) => a - b);
ORACLE['Bubble Sort'] = numericSort;
ORACLE['Insertion Sort'] = numericSort;
ORACLE['Selection Sort'] = numericSort;
ORACLE['Merge Sort'] = numericSort;
ORACLE['Quick Sort'] = numericSort;

ORACLE['Largest Number'] = (nums) => {
  const parts = nums.map((n) => String(n));
  for (let i = 0; i < parts.length; i++) {
    let best = i;
    for (let j = i + 1; j < parts.length; j++) {
      if (parts[j] + parts[best] > parts[best] + parts[j]) best = j;
    }
    if (best !== i) { const t = parts[i]; parts[i] = parts[best]; parts[best] = t; }
  }
  // When every part is "0" the concatenation would be "00", which is not the
  // canonical representation of the number; the contract is a single "0".
  if (parts.every((p) => p === '0')) return '0';
  return parts.join('');
};

ORACLE['Relative Sort Array'] = (arr1, arr2) => {
  const rank = new Map();
  arr2.forEach((v, i) => { if (!rank.has(v)) rank.set(v, i); });
  return arr1.slice().sort((a, b) => rank.get(a) - rank.get(b));
};

ORACLE['Meeting Rooms'] = (intervals) => {
  for (let i = 0; i < intervals.length; i++) {
    for (let j = i + 1; j < intervals.length; j++) {
      const a = intervals[i];
      const b = intervals[j];
      if (a[0] < b[1] && b[0] < a[1]) return false;
    }
  }
  return true;
};

ORACLE['Meeting Rooms II'] = (intervals) => {
  const starts = intervals.map((iv) => iv[0]).sort((a, b) => a - b);
  const ends = intervals.map((iv) => iv[1]).sort((a, b) => a - b);
  let si = 0;
  let ei = 0;
  let active = 0;
  let best = 0;
  while (si < starts.length) {
    if (starts[si] < ends[ei]) { active++; si++; }
    else { active--; ei++; }
    if (active > best) best = active;
  }
  return best;
};

ORACLE['Insert Interval'] = (intervals, newInterval) => {
  const all = intervals.map((iv) => [iv[0], iv[1]]);
  all.push([newInterval[0], newInterval[1]]);
  all.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < all.length - 1; i++) {
      if (all[i][1] >= all[i + 1][0]) {
        all[i] = [Math.min(all[i][0], all[i + 1][0]), Math.max(all[i][1], all[i + 1][1])];
        all.splice(i + 1, 1);
        changed = true;
        break;
      }
    }
  }
  return all;
};

const ORACLE2 = {};

ORACLE2['Jump Game Greedy'] = (nums) => {
  const reachable = new Set([0]);
  for (let i = 0; i < nums.length; i++) {
    if (!reachable.has(i)) continue;
    for (let j = i + 1; j <= i + nums[i] && j < nums.length; j++) reachable.add(j);
  }
  return reachable.has(nums.length - 1);
};

ORACLE2['Jump Game II Greedy'] = (nums) => {
  const dist = new Array(nums.length).fill(Infinity);
  dist[0] = 0;
  for (let i = 0; i < nums.length; i++) {
    if (dist[i] === Infinity) continue;
    for (let j = i + 1; j <= i + nums[i] && j < nums.length; j++) {
      if (dist[i] + 1 < dist[j]) dist[j] = dist[i] + 1;
    }
  }
  return dist[nums.length - 1] === Infinity ? -1 : dist[nums.length - 1];
};

ORACLE2['Candy Greedy'] = (ratings) => {
  const n = ratings.length;
  const need = new Array(n).fill(1);
  for (let i = 1; i < n; i++) {
    if (ratings[i] > ratings[i - 1]) need[i] = Math.max(need[i], need[i - 1] + 1);
  }
  for (let i = n - 2; i >= 0; i--) {
    if (ratings[i] > ratings[i + 1]) need[i] = Math.max(need[i], need[i + 1] + 1);
  }
  let total = 0;
  for (const c of need) total += c;
  return total;
};

ORACLE2['Best Time to Buy Sell Stock II'] = (prices) => {
  if (!prices.length) return 0;
  let hold = -prices[0];
  let free = 0;
  for (let i = 1; i < prices.length; i++) {
    const nextHold = Math.max(hold, free - prices[i]);
    const nextFree = Math.max(free, hold + prices[i]);
    hold = nextHold;
    free = nextFree;
  }
  return free;
};

ORACLE2['N-Queens II'] = (n) => {
  const all = (1 << n) - 1;
  let count = 0;
  const rec = (cols, d1, d2) => {
    if (cols === all) { count++; return; }
    let free = all & ~(cols | d1 | d2);
    while (free) {
      const bit = free & -free;
      free -= bit;
      rec(cols | bit, ((d1 | bit) << 1) & all, (d2 | bit) >> 1);
    }
  };
  rec(0, 0, 0);
  return count;
};

ORACLE2['Beautiful Arrangement'] = (n) => {
  const used = new Array(n + 1).fill(false);
  let count = 0;
  const rec = (pos) => {
    if (pos > n) { count++; return; }
    for (let v = 1; v <= n; v++) {
      if (used[v]) continue;
      if (v % pos === 0 || pos % v === 0) {
        used[v] = true;
        rec(pos + 1);
        used[v] = false;
      }
    }
  };
  rec(1);
  return count;
};

ORACLE2['Sudoku Solver'] = (board) => {
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
        for (let d = 1; d <= 9; d++) {
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

Object.assign(ORACLE, ORACLE2);
module.exports = { ORACLE };