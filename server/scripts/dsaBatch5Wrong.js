'use strict';

/**
 * dsaBatch5Wrong.js
 * ---------------------------------------------------------------------------
 * Genuinely WRONG solutions for the batch-5 discriminator gate.
 *
 * Each entry is a realistic near-miss rather than a stub: an off-by-one, a
 * wrong predicate, a missed tie-break, or an early exit. None of them fails to
 * compile, and none of them is merely "returns a constant" - every one is
 * plausible code that a learner could actually write.
 *
 * dsa_batch5_build.js does NOT take these on trust. For each one it proves the
 * wrongness twice: (1) the authored fixture set must REJECT it on both the
 * visible and the hidden cases, and (2) dsa_batch5_wrongproof.js measures, over
 * randomised inputs, the fraction on which it disagrees with the verified
 * reference. A wrong solution that happens to pass every fixture is reported as
 * a failure of the fixtures, not waved through.
 *
 * Wording and structure are original.
 * ---------------------------------------------------------------------------
 */

const WRONG = {};

WRONG['Network Delay Time'] = `function networkDelayTime(n, edges, source, target) {
  // WRONG: relaxes every edge once, in list order, so it finds the true shortest
  // path only when the route happens to appear in a favourable edge order.
  const dist = new Array(n).fill(Infinity);
  dist[source] = 0;
  for (const [u, v, w] of edges) {
    if (dist[u] === Infinity) continue;
    if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
  }
  return dist[target] === Infinity ? -1 : dist[target];
}`;

WRONG['Evaluate Division'] = `function evaluateDivision(equations, queries) {
  // WRONG: looks only ONE equation deep, so any chain of two or more comes back
  // undeterminable.
  const known = new Map();
  for (const [a, b, v] of equations) {
    known.set(a + '/' + b, Number(v));
    known.set(b + '/' + a, 1 / Number(v));
  }
  return queries.map(([x, y]) => (known.has(x + '/' + y) ? known.get(x + '/' + y) : -1));
}`;

WRONG['Cheapest Flights Within K Stops'] = `function cheapestFlightsWithinKStops(n, flights, src, dst, k) {
  // WRONG: treats k as the number of FLIGHTS rather than the number of stops,
  // so every permitted route is one hop shorter than allowed.
  const INF = Infinity;
  let best = new Array(n).fill(INF);
  best[src] = 0;
  for (let hop = 0; hop < k; hop++) {
    const next = best.slice();
    for (const [u, v, cost] of flights) {
      if (best[u] === INF) continue;
      if (best[u] + cost < next[v]) next[v] = best[u] + cost;
    }
    best = next;
  }
  return best[dst] === INF ? -1 : best[dst];
}`;

WRONG['Minimum Height Trees'] = `function minimumHeightTrees(n, edges) {
  // WRONG: returns the middle index range instead of the tree's centre, which
  // coincides with the answer only when the labels happen to be laid out in
  // tree order.
  return [Math.floor((n - 1) / 2), Math.floor(n / 2)];
}`;

WRONG['Keys and Rooms'] = `function canReachAllRooms(rooms) {
  // WRONG: follows only the FIRST key in each room, so a dead-end first key
  // hides every later one.
  const n = rooms.length;
  const seen = new Array(n).fill(false);
  seen[0] = true;
  const queue = [0];
  while (queue.length) {
    const room = queue.shift();
    const key = rooms[room][0];
    if (key === undefined) continue;
    if (seen[key]) continue;
    seen[key] = true;
    queue.push(key);
  }
  return seen[n - 1];
}`;

WRONG['Is Graph Bipartite'] = `function isBipartite(n, edges) {
  // WRONG: colours greedily from node 0 only, so an odd cycle living in another
  // component is never detected.
  const adj = new Array(n);
  for (let i = 0; i < n; i++) adj[i] = [];
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  const colour = new Array(n).fill(-1);
  colour[0] = 0;
  const queue = [0];
  while (queue.length) {
    const u = queue.shift();
    for (const v of adj[u]) {
      if (colour[v] === -1) { colour[v] = 1 - colour[u]; queue.push(v); }
      else if (colour[v] === colour[u]) return false;
    }
  }
  return true;
}`;

WRONG['Find Eventual Safe States'] = `function eventualSafeStates(n, edges) {
  // WRONG: declares a node safe as soon as ONE of its successors is safe. A node
  // is safe only when EVERY successor is.
  const reverse = new Array(n);
  for (let i = 0; i < n; i++) reverse[i] = [];
  for (const [from, to] of edges) reverse[to].push(from);
  const safe = new Array(n).fill(false);
  const queue = [];
  for (let i = 0; i < n; i++) if (reverse[i].length === 0) { safe[i] = true; queue.push(i); }
  while (queue.length) {
    const node = queue.shift();
    for (const prev of reverse[node]) {
      if (safe[prev]) continue;
      safe[prev] = true;
      queue.push(prev);
    }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (safe[i]) out.push(i);
  return out;
}`;

WRONG['Sqrt(x)'] = `function integerSqrt(x) {
  // WRONG: returns the smallest integer r with r * r >= x, i.e. rounds to NEAREST
  // instead of down, so every perfect square comes out one too high.
  if (x < 2) return x;
  let lo = 1;
  let hi = x;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (mid * mid < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}`;

WRONG['Valid Perfect Square'] = `function isPerfectSquare(x) {
  // WRONG: accepts any value within 1 of a square, so a near miss counts.
  const r = Math.round(Math.sqrt(x));
  return Math.abs(r * r - x) <= 1;
}`;

WRONG['Find Smallest Letter Greater Than Target'] = `function findSmallestLetter(letters, target) {
  // WRONG: no wrap-around, so it returns undefined when nothing is greater than
  // target, and it does not guarantee the smallest greater letter.
  let lo = 0;
  let hi = letters.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (letters[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return letters[lo];
}`;

WRONG['Missing Number'] = `function missingNumber(nums) {
  // WRONG: XORs the values together but forgets the indices, so it cancels to a
  // value that depends on the arrangement rather than on what is absent.
  let acc = nums.length;
  for (const v of nums) acc ^= v;
  return acc;
}`;

WRONG['Search a 2D Matrix'] = `function searchMatrix(matrix, target) {
  // WRONG: flattens the matrix but assumes a square, so it reads past the end of
  // a rectangular grid and reports the wrong column.
  const rows = matrix.length;
  const size = Math.round(Math.sqrt(rows * matrix[0].length));
  let lo = 0;
  let hi = rows * matrix[0].length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const val = matrix[Math.floor(mid / size)][mid % size];
    if (val === target) return [Math.floor(mid / size), mid % size];
    if (val < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return [-1, -1];
}`;

WRONG['Search in Rotated Sorted Array'] = `function searchRotated(nums, target) {
  // WRONG: runs an ordinary binary search, which loses track of the pivot and so
  // discards the half that still contains the target.
  let lo = 0;
  let hi = nums.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`;

WRONG['Find First and Last Position'] = `function searchRange(nums, target) {
  // WRONG: returns the first occurrence twice, so the LAST index is wrong
  // whenever the target repeats.
  const lower = (v) => {
    let lo = 0;
    let hi = nums.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (nums[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const first = lower(target);
  if (first === nums.length || nums[first] !== target) return [-1, -1];
  return [first, first];
}`;

WRONG['Search a 2D Matrix II'] = `function searchMatrixII(matrix, target) {
  // WRONG: binary searches each row for an EQUALITY hit, so with repeated values
  // it returns whichever midpoint it landed on instead of the leftmost copy.
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    let lo = 0;
    let hi = row.length - 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (row[mid] === target) return [r, mid];
      if (row[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return [-1, -1];
}`;

WRONG['Koko Eating Bananas'] = `function eatBananas(piles, h) {
  // WRONG: rounds the hours per pile DOWN, so a partial final hour is treated as
  // finished and the speed comes out too low.
  const canFinish = (v) => {
    let hours = 0;
    for (const p of piles) hours += Math.floor(p / v);
    return hours <= h;
  };
  let lo = 1;
  let hi = Math.max(...piles);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (canFinish(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}`;

WRONG['Kth Largest Element in Array'] = `function findKthLargest(nums, k) {
  // WRONG: treats k as a 0-BASED index into the descending order, so every
  // answer is shifted one place.
  const desc = nums.slice().sort((a, b) => b - a);
  return desc[k];
}`;

WRONG['Kth Largest Element in Stream'] = `function kthLargestInStream(k, values) {
  // WRONG: re-sorts the whole prefix every time and indexes with 0-based k, so
  // the answer is wrong as soon as k > 1 and O(n^2 log n) instead of O(n log k).
  const out = [];
  const seen = [];
  for (const v of values) {
    seen.push(v);
    const desc = seen.slice().sort((a, b) => b - a);
    out.push(desc.length < k ? -1 : desc[k]);
  }
  return out;
}`;

WRONG['Top K Frequent Words'] = `function topKFrequentWords(words, k) {
  // WRONG: leaves ties in insertion order instead of breaking them
  // alphabetically, so the answer depends on the order words happened to arrive.
  const counts = new Map();
  for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
  const ranked = Array.from(counts.keys()).sort((a, b) => counts.get(b) - counts.get(a));
  return ranked.slice(0, k);
}`;

WRONG['Task Scheduler'] = `function leastInterval(tasks, n) {
  // WRONG: ignores how many tasks tie for the highest frequency, so a tie needs
  // one more slot than the single-task frame allows.
  const counts = new Map();
  for (const t of tasks) counts.set(t, (counts.get(t) || 0) + 1);
  let maxFreq = 0;
  for (const c of counts.values()) if (c > maxFreq) maxFreq = c;
  const frame = (maxFreq - 1) * (n + 1) + 1;
  return Math.max(tasks.length, frame);
}`;

WRONG['IPO'] = `function maxIpoCapital(k, w, costs, profits) {
  // WRONG: greedies on raw PROFIT rather than net gain, so it happily takes a
  // project that pays well but costs even more, leaving less capital behind.
  const n = costs.length;
  const done = new Array(n).fill(false);
  let capital = w;
  for (let picked = 0; picked < k; picked++) {
    let best = -1;
    for (let i = 0; i < n; i++) {
      if (done[i] || costs[i] > capital) continue;
      if (best === -1 || profits[i] > profits[best]) best = i;
    }
    if (best === -1) break;
    done[best] = true;
    capital = capital - costs[best] + profits[best];
  }
  return capital;
}`;

WRONG['Find K-th Smallest Pair Distance'] = `function kthSmallestPairDistance(points, k) {
  // WRONG: reports the smallest distance that reaches a count of k, which is
  // the k-th DISTINCT distance rather than the k-th pair distance.
  const sorted = points.slice().sort((a, b) => a - b);
  const distinct = new Set();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) distinct.add(sorted[j] - sorted[i]);
  }
  const values = Array.from(distinct).sort((a, b) => a - b);
  return values[Math.min(k, values.length) - 1];
}`;

WRONG['Maximum Frequency Stack'] = `function maxFrequencyStack(operations) {
  // WRONG: breaks a frequency tie by the SMALLEST value instead of the most
  // recently pushed one.
  const freq = new Map();
  const results = [];
  for (const op of operations) {
    const parts = op.split(' ');
    if (parts[0] === 'push') {
      const v = Number(parts[1]);
      freq.set(v, (freq.get(v) || 0) + 1);
      continue;
    }
    if (parts[0] === 'freq') {
      results.push(freq.get(Number(parts[1])) || 0);
      continue;
    }
    let best = null;
    let bestCount = 0;
    for (const [v, c] of freq) {
      if (c <= 0) continue;
      if (best === null || c > bestCount || (c === bestCount && v < best)) {
        best = v;
        bestCount = c;
      }
    }
    results.push(best);
    freq.set(best, freq.get(best) - 1);
  }
  return results;
}`;

WRONG['Trapping Rain Water II'] = `function trapRainWater2D(heightMap) {
  // WRONG: applies the 1D rule per row, taking min(leftMax, rightMax) with no
  // regard for the vertical escape route.
  const rows = heightMap.length;
  if (rows === 0) return 0;
  const cols = heightMap[0].length;
  let water = 0;
  for (const row of heightMap) {
    let left = 0;
    let right = 0;
    for (let c = 0; c < cols; c++) left = Math.max(left, row[c]);
    for (let c = cols - 1; c >= 0; c--) {
      right = Math.max(right, row[c]);
      const held = Math.min(left, right) - row[c];
      if (held > 0) water += held;
    }
  }
  return water;
}`;

module.exports = { WRONG };