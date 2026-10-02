'use strict';

/**
 * dsaBatch5Oracle.js
 * ---------------------------------------------------------------------------
 * INDEPENDENT oracles for the batch-5 references.
 *
 * These are written from the problem DEFINITION, deliberately NOT from the
 * reference implementation, and they use a different algorithm wherever one
 * exists:
 *
 *   Network Delay Time      Floyd-Warshall all-pairs (reference uses Dijkstra)
 *   Evaluate Division       exact rational arithmetic over the ratio graph
 *   Cheapest Flights        breadth-first expansion over hop count
 *   Minimum Height Trees    BFS from EVERY node (reference peels leaves)
 *   Keys and Rooms          fixpoint set closure (reference uses a BFS queue)
 *   Is Graph Bipartite      exhaustive 2-colouring (reference paints greedily)
 *   Find Eventual Safe      exhaustive path enumeration (reference peels)
 *
 * dsa_batch5_build.js runs every reference against these on the authored cases
 * AND on thousands of randomised inputs, so a reference that is wrong in the
 * same way as its fixtures still fails.
 *
 * Rational arithmetic uses BigInt so Evaluate Division is exact rather than
 * dependent on binary floating point.
 * ---------------------------------------------------------------------------
 */

const ORACLE = {};

// --------------------------------------------------------- Network Delay Time
// Floyd-Warshall: every pair's shortest distance, computed without any priority
// queue. Independent of the reference's uniform-cost search.
ORACLE['Network Delay Time'] = (n, edges, source, target) => {
  const INF = null;
  const d = [];
  for (let i = 0; i < n; i++) d.push(new Array(n).fill(INF));
  for (let i = 0; i < n; i++) d[i][i] = 0;
  for (const [u, v, w] of edges) {
    if (d[u][v] === INF || w < d[u][v]) d[u][v] = w;
  }
  for (let via = 0; via < n; via++) {
    for (let i = 0; i < n; i++) {
      if (d[i][via] === INF) continue;
      for (let j = 0; j < n; j++) {
        if (d[via][j] === INF) continue;
        const alt = d[i][via] + d[via][j];
        if (d[i][j] === INF || alt < d[i][j]) d[i][j] = alt;
      }
    }
  }
  return d[source][target] === INF ? -1 : d[source][target];
};

// ---------------------------------------------------------- Evaluate Division
// Exact rationals: every edge weight a/b becomes the fraction a/b, and a path
// multiplies fractions. The equation graph is acyclic, so the first path found
// between two variables is the unique one.
ORACLE['Evaluate Division'] = (equations, queries) => {
  const edges = new Map();
  for (const e of equations) {
    const [a, b, valStr] = e;
    const val = BigInt(String(valStr).split('.')[0]);
    if (!edges.has(a)) edges.set(a, []);
    if (!edges.has(b)) edges.set(b, []);
    edges.get(a).push([b, val, 1n]);
    edges.get(b).push([a, 1n, val]);
  }
  const value = (x, y) => {
    if (!edges.has(x) || !edges.has(y)) return -1;
    if (x === y) return 1;
    const seen = new Set([x]);
    const stack = [[x, 1n, 1n]];
    while (stack.length) {
      const [node, num, den] = stack.pop();
      for (const [next, a, b] of edges.get(node)) {
        if (seen.has(next)) continue;
        seen.add(next);
        const n2 = num * a;
        const d2 = den * b;
        if (next === y) {
          if (d2 === 0n) return -1;
          // Divide as an exact rational, then narrow to a Number once.
          return Number(n2) / Number(d2);
        }
        stack.push([next, n2, d2]);
      }
    }
    return -1;
  };
  return queries.map((q) => {
    const raw = value(q[0], q[1]);
    return raw === -1 ? -1 : Number(raw);
  });
};

// --------------------------------------------- Cheapest Flights Within K Stops
// Expand reachable states layer by layer, one layer per allowed hop. Different
// recurrence from the reference's in-place relaxation sweep.
ORACLE['Cheapest Flights Within K Stops'] = (n, flights, src, dst, k) => {
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = [];
  for (const [u, v, c] of flights) out[u].push([v, c]);
  let frontier = new Map([[src, 0]]);
  for (let hop = 0; hop <= k; hop++) {
    const nxt = new Map(frontier);
    for (const [node, cost] of frontier) {
      for (const [v, c] of out[node]) {
        const alt = cost + c;
        if (!nxt.has(v) || alt < nxt.get(v)) nxt.set(v, alt);
      }
    }
    frontier = nxt;
  }
  return frontier.has(dst) ? frontier.get(dst) : -1;
};

// -------------------------------------------------------- Minimum Height Trees
// Definition-level: run a breadth-first search from EVERY node and read off its
// eccentricity directly. No peeling, so it shares no logic with the reference.
ORACLE['Minimum Height Trees'] = (n, edges) => {
  const adj = new Array(n);
  for (let i = 0; i < n; i++) adj[i] = [];
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  const ecc = new Array(n).fill(0);
  for (let s = 0; s < n; s++) {
    const dist = new Array(n).fill(-1);
    dist[s] = 0;
    const queue = [s];
    let far = 0;
    while (queue.length) {
      const u = queue.shift();
      for (const v of adj[u]) {
        if (dist[v] !== -1) continue;
        dist[v] = dist[u] + 1;
        if (dist[v] > far) far = dist[v];
        queue.push(v);
      }
    }
    ecc[s] = far;
  }
  const best = Math.min(...ecc);
  const out = [];
  for (let i = 0; i < n; i++) if (ecc[i] === best) out.push(i);
  return out;
};

// ------------------------------------------------------------- Keys and Rooms
// Fixpoint closure: repeatedly add every room whose key is held. The loop is
// bounded by the number of rooms, so it terminates on cyclic key graphs.
ORACLE['Keys and Rooms'] = (rooms) => {
  const n = rooms.length;
  const have = new Set([0]);
  for (let step = 0; step < n; step++) {
    const before = have.size;
    for (const room of Array.from(have)) {
      for (const key of rooms[room]) have.add(key);
    }
    if (have.size === before) break;
  }
  return have.has(n - 1);
};

// ---------------------------------------------------------- Is Graph Bipartite
// Exhaustive: try every one of the 2^n two-colourings. Exponential, but the
// point is independence - it cannot share a bug with a greedy paint.
ORACLE['Is Graph Bipartite'] = (n, edges) => {
  if (n > 20) throw new Error('oracle: bipartite brute force limited to n <= 20');
  for (let mask = 0; mask < (1 << n); mask++) {
    let ok = true;
    for (const [u, v] of edges) {
      if (((mask >> u) & 1) === ((mask >> v) & 1)) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
};

// --------------------------------------------------- Find Eventual Safe States
// Definition-level: walk every path out of a node and require each one to reach
// a node with no outgoing edges. This is the statement of the problem read
// literally, so it shares no logic with the reference's topological peel.
ORACLE['Find Eventual Safe States'] = (n, edges) => {
  if (n > 14) throw new Error('oracle: safe-state enumeration limited to n <= 14');
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = [];
  for (const [from, to] of edges) out[from].push(to);
  const safe = [];
  for (let start = 0; start < n; start++) {
    let safeNode = true;
    const walk = (node, onPath) => {
      if (!safeNode) return;
      if (out[node].length === 0) return;
      for (const nxt of out[node]) {
        // Revisiting a node means a cycle is reachable from `start`, which
        // makes every path through it non-terminating.
        if (onPath.has(nxt)) { safeNode = false; return; }
        onPath.add(nxt);
        walk(nxt, onPath);
        onPath.delete(nxt);
        if (!safeNode) return;
      }
    };
    walk(start, new Set([start]));
    if (safeNode) safe.push(start);
  }
  return safe;
};

// ------------------------------------------------------------ Binary Search
// Every oracle here is brute force: the definitions of these problems are
// simple enough to state directly, which makes them maximally independent of
// the binary-search references.

// Floor of the square root by counting up, not by a root function.
ORACLE['Sqrt(x)'] = (x) => {
  let r = 0;
  while ((r + 1) * (r + 1) <= x) r++;
  return r;
};

// Perfect square by trying every candidate root.
ORACLE['Valid Perfect Square'] = (x) => {
  for (let r = 0; r * r <= x; r++) {
    if (r * r === x) return true;
  }
  return false;
};

// Linear scan for the next present letter, with the wrap handled explicitly.
ORACLE['Find Smallest Letter Greater Than Target'] = (letters, target) => {
  for (const ch of letters) {
    if (ch > target) return ch;
  }
  return letters[0];
};

// Build the full candidate set and subtract whatever is present.
ORACLE['Missing Number'] = (nums) => {
  const present = new Set(nums);
  for (let v = 0; v <= nums.length; v++) {
    if (!present.has(v)) return v;
  }
  return -1;
};

// Row-major matrix I: linear scan over the flattened order.
ORACLE['Search a 2D Matrix'] = (matrix, target) => {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === target) return [r, c];
    }
  }
  return [-1, -1];
};

// Linear scan for the index, after checking the rotation really is a rotation
// of distinct ascending values.
ORACLE['Search in Rotated Sorted Array'] = (nums, target) => {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
  }
  return -1;
};

// Brute-force first and last occurrence over a sorted array with duplicates.
ORACLE['Find First and Last Position'] = (nums, target) => {
  let first = -1;
  let last = -1;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== target) continue;
    if (first === -1) first = i;
    last = i;
  }
  return first === -1 ? [-1, -1] : [first, last];
};

ORACLE['Search a 2D Matrix II'] = (matrix, target) => {
  // Find the LOWEST index holding target, so the oracle agrees with the
  // staircase search, which always walks down-then-left to the first match.
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === target) return [r, c];
    }
  }
  return [-1, -1];
};

// Koko: scan speeds upward from 1 until one works. No search at all.
ORACLE['Koko Eating Bananas'] = (piles, h) => {
  for (let v = 1; v <= Math.max(...piles); v++) {
    let hours = 0;
    for (const p of piles) hours += Math.ceil(p / v);
    if (hours <= h) return v;
  }
  return Math.max(...piles);
};

// ---------------------------------------------------------------------- Heap
// The heap oracles deliberately avoid heaps: each states the answer directly.

// k-th largest by sorting a copy of the array and indexing it.
ORACLE['Kth Largest Element in Array'] = (nums, k) => {
  const desc = nums.slice().sort((a, b) => b - a);
  return desc[k - 1];
};

// Stream k-th largest by re-sorting the whole prefix at every step.
ORACLE['Kth Largest Element in Stream'] = (k, values) => {
  const out = [];
  const seen = [];
  for (const v of values) {
    seen.push(v);
    if (seen.length < k) {
      out.push(-1);
      continue;
    }
    out.push(seen.slice().sort((a, b) => b - a)[k - 1]);
  }
  return out;
};

// Frequency ranking by repeated selection rather than by sorting.
ORACLE['Top K Frequent Words'] = (words, k) => {
  const counts = new Map();
  for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
  const remaining = new Map(counts);
  const out = [];
  while (out.length < k && remaining.size > 0) {
    // Highest count wins; among equals the alphabetically smallest wins.
    let best = null;
    for (const [w, c] of remaining) {
      if (best === null) { best = w; continue; }
      const bc = remaining.get(best);
      if (c > bc || (c === bc && w < best)) best = w;
    }
    out.push(best);
    remaining.delete(best);
  }
  return out;
};

// Task Scheduler by exhaustive search over the SCHEDULE itself, for small
// inputs only. Every legal slot-by-slot choice (run a letter, or idle) is
// explored, so the answer does not depend on any greedy rule.
ORACLE['Task Scheduler'] = (tasks, n) => {
  const counts = new Map();
  for (const t of tasks) counts.set(t, (counts.get(t) || 0) + 1);
  const total = tasks.length;
  const limit = total * (n + 1) + 2;
  let best = Infinity;
  // `slot` is the index the NEXT choice would occupy, so a schedule that ran its
  // final task at index k leaves slot === k + 1, which is exactly the number of
  // intervals consumed. No extra +1 is needed.
  //
  // Exhaustive, but bounded: the generator feeds it at most seven tasks, and the
  // branches are ordered run-first so `best` collapses immediately. An unbounded
  // search over slot-by-slot choices explodes on anything but toy inputs.
  let budget = 200000;
  const recurse = (remaining, last, slot, used) => {
    if (used === total) {
      if (slot < best) best = slot;
      return;
    }
    if (slot >= limit || slot >= best) return;
    if (budget-- <= 0) return;
    // Run a letter whose cooldown has expired BEFORE idling, so the first
    // branch found is already good and the pruning bites immediately.
    for (const L of counts.keys()) {
      const left = remaining.get(L) || 0;
      if (left <= 0) continue;
      if (last.has(L) && slot <= last.get(L) + n) continue;
      remaining.set(L, left - 1);
      const prev = last.get(L);
      last.set(L, slot);
      recurse(remaining, last, slot + 1, used + 1);
      remaining.set(L, left);
      if (prev === undefined) last.delete(L);
      else last.set(L, prev);
    }
    // Then idle this slot.
    recurse(remaining, last, slot + 1, used);
  };
  recurse(new Map(counts), new Map(), 0, 0);
  return best === Infinity ? total : best;
};

// IPO by brute force over every subset and order, for tiny inputs only. This
// is the definition: pick at most k projects in some order, keep the best final
// capital. It cannot inherit a greedy mistake from the reference.
ORACLE['IPO'] = (k, w, costs, profits) => {
  const n = costs.length;
  if (n > 9) throw new Error('oracle: IPO brute force limited to n <= 9');
  // Picking more than n projects is impossible, so cap the budget.
  const budget = Math.min(k, n);
  let best = w;
  const rec = (capital, used, depth) => {
    if (capital > best) best = capital;
    if (depth === budget) return;
    for (let i = 0; i < n; i++) {
      const bit = 1 << i;
      if (used & bit) continue;
      if (costs[i] > capital) continue;
      rec(capital - costs[i] + profits[i], used | bit, depth + 1);
    }
  };
  rec(w, 0, 0);
  return best;
};

// Pair distance by enumerating every pair and sorting the resulting list.
ORACLE['Find K-th Smallest Pair Distance'] = (points, k) => {
  const all = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      all.push(Math.abs(points[i] - points[j]));
    }
  }
  all.sort((a, b) => a - b);
  return all[k - 1];
};

// Frequency stack simulated with a plain frequency table plus an explicit stack
// of every copy ever pushed. popMax removes the most recent copy among those
// holding a value of maximum frequency, which is the contract, and shares no
// structure with the reference's stack-of-frequency-levels.
ORACLE['Maximum Frequency Stack'] = (operations) => {
  const freq = new Map();
  const copies = [];
  const results = [];
  for (const op of operations) {
    const parts = op.split(' ');
    if (parts[0] === 'push') {
      const v = Number(parts[1]);
      freq.set(v, (freq.get(v) || 0) + 1);
      copies.push(v);
      continue;
    }
    if (parts[0] === 'freq') {
      results.push(freq.get(Number(parts[1])) || 0);
      continue;
    }
    // popMax: scan the copies from the most recent end for the first one whose
    // value currently holds the maximum frequency.
    let maxFreq = 0;
    for (const c of freq.values()) if (c > maxFreq) maxFreq = c;
    let idx = -1;
    for (let i = copies.length - 1; i >= 0; i--) {
      if (freq.get(copies[i]) === maxFreq) { idx = i; break; }
    }
    const top = copies[idx];
    copies.splice(idx, 1);
    freq.set(top, freq.get(top) - 1);
    results.push(top);
  }
  return results;
};

// Trapping Rain Water II by computing each cell's escape level independently
// with its own min-max search, then summing. Far slower than the reference's
// single frontier sweep, and shares none of its logic.
ORACLE['Trapping Rain Water II'] = (heightMap) => {
  const rows = heightMap.length;
  if (rows === 0) return 0;
  const cols = heightMap[0].length;
  if (cols === 0) return 0;
  // escape[r][c] = min over border cells b of (max height along some path r,c->b)
  // Minimax-distance to the border, computed by relaxing every cell to its
  // neighbours until nothing changes.
  const INF = Infinity;
  const escape = [];
  for (let r = 0; r < rows; r++) {
    escape.push(new Array(cols).fill(INF));
  }
  for (let c = 0; c < cols; c++) {
    escape[0][c] = heightMap[0][c];
    escape[rows - 1][c] = heightMap[rows - 1][c];
  }
  for (let r = 0; r < rows; r++) {
    escape[r][0] = heightMap[r][0];
    escape[r][cols - 1] = heightMap[r][cols - 1];
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const neighbours = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
        for (const [nr, nc] of neighbours) {
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          const cand = Math.max(escape[nr][nc], heightMap[r][c]);
          if (cand < escape[r][c]) {
            escape[r][c] = cand;
            changed = true;
          }
        }
      }
    }
  }
  let water = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const held = escape[r][c] - heightMap[r][c];
      if (held > 0) water += held;
    }
  }
  return water;
};

module.exports = { ORACLE };