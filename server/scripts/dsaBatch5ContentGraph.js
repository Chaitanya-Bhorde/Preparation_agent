'use strict';

/**
 * dsaBatch5ContentGraph.js
 * ---------------------------------------------------------------------------
 * Authored content for the graph problems of batch 5 whose contract is fixed
 * by their title plus the tag evidence in scripts/seedCodingProblemsExpanded.js.
 *
 * `cases` are the single source of truth for expected output. They declare the
 * INPUTS; the expected values are derived by an INDEPENDENT oracle
 * (scripts/dsaBatch5Oracle.js) and then required to match the reference exactly
 * - see dsa_batch5_build.js. That is stronger than deriving them from the
 * reference, which would only prove the reference is self-consistent.
 *
 * GRAPH REPRESENTATION. The catalogue's established convention (batches 1-4:
 * "Graph Valid Tree", "Number of Connected Components", "Course Schedule") is
 * an EDGE LIST plus a node count, so every graph here is `n` plus an array of
 * [u, v] or [u, v, w] triples. Edges are DIRECTED unless the description says
 * undirected, and node identity is the integer label 0..n-1.
 *
 * Wording is original; nothing is copied from a third-party platform.
 * ---------------------------------------------------------------------------
 */

const lang = (name, params, returnType) => ({
  javascript: { name, params: params.map(([n, t]) => ({ name: n, type: t })), returnType },
  python: { name, params: params.map(([n, t]) => ({ name: n, type: t })), returnType },
  java: { name, params: params.map(([n, t]) => ({ name: n, type: t })), returnType },
  cpp: { name, params: params.map(([n, t]) => ({ name: n, type: t })), returnType },
});

const CONTENT = {};

CONTENT['Network Delay Time'] = {
  signature: lang('networkDelayTime',
    [['n', 'number'], ['edges', 'number[][]'], ['source', 'number'], ['target', 'number']],
    'number'),
  description:
    'A directed communication network has `n` nodes numbered 0 to n-1. Each entry of `edges` is a '
    + 'triple [u, v, w] meaning a signal sent from u to v takes w units of time, where w is '
    + 'non-negative. Starting at `source`, return the shortest time in which a signal can reach '
    + '`target`. Return -1 when target cannot be reached from source at all. When source equals '
    + 'target the answer is 0, because a signal that has already arrived needs no further time.',
  input:
    'The parameters are `n` on the first line, `edges` on the second line as an array of '
    + '[u, v, w] triples, then `source` and `target` on the third and fourth lines.',
  output:
    'Return the shortest travel time from source to target, or -1 if target is unreachable.',
  constraints: [
    '1 <= n <= 100',
    '0 <= edges.length <= 10000',
    'Each edge is [u, v, w] with 0 <= u, v < n and 0 <= w <= 1000',
    '0 <= source, target < n',
    'Parallel edges and self-loops may appear',
  ],
  cases: [
    { visible: true, n: 2, edges: [[0, 1, 1]], source: 0, target: 1, expect: 1 },
    { visible: true, n: 2, edges: [], source: 0, target: 1, expect: -1 },
    { visible: true, n: 3, edges: [[0, 1, 1], [1, 2, 1]], source: 0, target: 2, expect: 2 },
    // The edge list lists 1->2 BEFORE 0->1, so relaxing each edge only once in
    // list order settles on the direct 0->2 hop of 10 and misses the cheaper
    // 0->1->2 route of 6.
    { visible: true, n: 3, edges: [[1, 2, 1], [0, 1, 5], [0, 2, 10]], source: 0, target: 2, expect: 6 },
    { visible: false, n: 1, edges: [], source: 0, target: 0, expect: 0 },
    { visible: false, n: 4, edges: [[0, 1, 1], [0, 2, 4], [1, 2, 2], [2, 3, 1]], source: 0, target: 3, expect: 4 },
    { visible: false, n: 3, edges: [[1, 0, 1], [2, 1, 1]], source: 0, target: 2, expect: -1 },
    // Parallel edges: the cheaper direct route must win over the costlier one.
    { visible: false, n: 2, edges: [[0, 1, 5], [0, 1, 2], [0, 1, 9]], source: 0, target: 1, expect: 2 },
    // A zero-weight edge must not be mistaken for "no edge".
    { visible: false, n: 3, edges: [[0, 1, 0], [1, 2, 0]], source: 0, target: 2, expect: 0 },
    // Self-loop: it never shortens a path.
    { visible: false, n: 2, edges: [[0, 0, 1], [0, 1, 3]], source: 0, target: 1, expect: 3 },
    // Longer detour that is cheaper must beat the direct expensive edge.
    { visible: false, n: 4, edges: [[0, 1, 10], [1, 2, 1], [2, 3, 1], [0, 3, 100]], source: 0, target: 3, expect: 12 },
    // Disconnected component: the target sits behind an unreachable node.
    { visible: false, n: 4, edges: [[0, 1, 1], [2, 3, 1]], source: 0, target: 3, expect: -1 },
    // A four-hop chain: the weights must accumulate along the whole path.
    // The cheap route is listed AFTER the expensive direct edge, so a solution that
// relaxes edges once in list order and never revisits them picks the wrong one.
    { visible: false, n: 3, edges: [[0, 2, 10], [0, 1, 1], [1, 2, 1]], source: 0, target: 2, expect: 2 },
    // A three-hop chain listed in reverse order: only a solver that revisits
    // nodes can assemble it.
    { visible: false, n: 4, edges: [[2, 3, 1], [1, 2, 1], [0, 1, 1]], source: 0, target: 3, expect: 3 },
    { visible: false, n: 5, edges: [[3, 4, 1], [0, 3, 1], [0, 1, 1], [1, 2, 1]], source: 0, target: 4, expect: 2 },
    { visible: false, n: 6, edges: [[0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5], [4, 5, 6]], source: 0, target: 5, expect: 20 },
    { visible: false, n: 3, edges: [[0, 1, 2], [1, 0, 2], [0, 2, 7]], source: 2, target: 0, expect: -1 },
  ],
  reference: `function networkDelayTime(n, edges, source, target) {
  const INF = Infinity;
  const dist = new Array(n).fill(INF);
  dist[source] = 0;
  const adj = new Array(n);
  for (let i = 0; i < n; i++) adj[i] = [];
  for (const e of edges) adj[e[0]].push([e[1], e[2]]);
  // Uniform-cost search: repeatedly settle the cheapest unsettled node. Every
  // edge weight is non-negative, so nothing can improve a settled distance.
  const settled = new Array(n).fill(false);
  for (let step = 0; step < n; step++) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!settled[i] && dist[i] < INF && (u === -1 || dist[i] < dist[u])) u = i;
    }
    if (u === -1) break;
    if (u === target) return dist[u];
    settled[u] = true;
    for (const [v, w] of adj[u]) {
      if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
    }
  }
  return dist[target] === INF ? -1 : dist[target];
}`,
};

CONTENT['Evaluate Division'] = {
  signature: lang('evaluateDivision',
    [['equations', 'string[][]'], ['queries', 'string[][]']],
    'number[]'),
  description:
    'Some pairs of variables are related by a division. Each entry of `equations` is '
    + '[a, b, value] meaning a / b = value, and each entry of `queries` is [x, y] asking for '
    + 'x raised to the power y. Return one answer per query, in the same order. If no chain of '
    + 'equations relates x and y, the answer is -1. Values are real, so an answer may be a '
    + 'fraction such as 0.5; report it as the exact value the equations imply.',
  input:
    'The parameters are `equations` on the first line and `queries` on the second line, each an '
    + 'array of string arrays.',
  output:
    'Return a flat array with one value per query, in query order, using -1 when undeterminable.',
  constraints: [
    '1 <= equations.length <= 10',
    'equations[i] = [a, b, value] where a and b are variable names and 1 <= value <= 1000',
    '1 <= queries.length <= 10',
    'queries[i] = [x, y] naming variables that appear in equations',
    'Every variable name is 1 to 5 lowercase letters',
    'The graph formed by the equations has no cycles, so every query is determined or -1',
  ],
  cases: [
    { visible: true, equations: [['a', 'b', '2'], ['b', 'c', '3']], queries: [['a', 'c'], ['b', 'a'], ['x', 'y']], expect: [6, 0.5, -1] },
    { visible: true, equations: [['a', 'b', '2']], queries: [['a', 'b']], expect: [2] },
    { visible: true, equations: [['a', 'b', '1'], ['b', 'c', '1']], queries: [['a', 'c']], expect: [1] },
    // A query between a variable and itself is always 1, even with no equation.
    { visible: false, equations: [['a', 'b', '4']], queries: [['a', 'a'], ['b', 'b']], expect: [1, 1] },
    // Two variables in different components are undeterminable.
    { visible: false, equations: [['a', 'b', '2'], ['c', 'd', '3']], queries: [['a', 'd']], expect: [-1] },
    // Inverting the division: a/b = 4 also means b/a = 0.25.
    { visible: false, equations: [['a', 'b', '4']], queries: [['b', 'a']], expect: [0.25] },
    // A long chain must compose, not just look one step ahead. Every value here
    // is a power of two, so the answers (64 and 1/64) are exact in binary
    // floating point and exact-match judging stays reliable.
    { visible: false, equations: [['a', 'b', '2'], ['b', 'c', '4'], ['c', 'd', '8']], queries: [['a', 'd'], ['d', 'a']], expect: [64, 0.015625] },
    // Reciprocal composition: z/x = 1/32, again exactly representable.
    { visible: false, equations: [['x', 'y', '8'], ['y', 'z', '4']], queries: [['z', 'x']], expect: [0.03125] },
    // A value of 1 must not stop the walk early: x reaches z even though the
    // middle equation is neutral.
    { visible: false, equations: [['p', 'q', '7'], ['q', 'r', '1']], queries: [['p', 'r'], ['r', 'q']], expect: [7, 1] },
  ],
  reference: `function evaluateDivision(equations, queries) {
  const adj = new Map();
  const link = (a, b, w) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push([b, w]);
    adj.get(b).push([a, 1 / w]);
  };
  for (const e of equations) link(e[0], e[1], Number(e[2]));
  const answer = (x, y) => {
    if (!adj.has(x) || !adj.has(y)) return -1;
    if (x === y) return 1;
    // The equation graph is acyclic, so a single settled-path search suffices.
    const seen = new Set([x]);
    const stack = [[x, 1]];
    while (stack.length) {
      const [node, acc] = stack.pop();
      for (const [next, w] of adj.get(node) || []) {
        if (seen.has(next)) continue;
        seen.add(next);
        const val = acc * w;
        if (next === y) return val;
        stack.push([next, val]);
      }
    }
    return -1;
  };
  return queries.map((q) => answer(q[0], q[1]));
}`,
};

CONTENT['Cheapest Flights Within K Stops'] = {
  signature: lang('cheapestFlightsWithinKStops',
    [['n', 'number'], ['flights', 'number[][]'], ['src', 'number'], ['dst', 'number'], ['k', 'number']],
    'number'),
  description:
    'There are `n` cities numbered 0 to n-1. Each entry of `flights` is a triple [from, to, cost] '
    + 'describing a one-way flight costing `cost`, where cost is non-negative. Return the cheapest '
    + 'total cost of travelling from `src` to `dst` using at most k intermediate stops, that is, '
    + 'at most k+1 flights in total. Return -1 when no such route exists.',
  input:
    'The parameters are `n` on the first line, `flights` on the second line as an array of '
    + '[from, to, cost] triples, then `src`, `dst` and `k` on the next three lines.',
  output:
    'Return the cheapest cost of a route with at most k stops, or -1 if there is none.',
  constraints: [
    '1 <= n <= 100',
    '0 <= flights.length <= 10000',
    'Each flight is [from, to, cost] with 0 <= from, to < n and 0 <= cost <= 1000',
    '0 <= src, dst < n and src != dst',
    '0 <= k <= n',
    'Parallel flights and self-loops may appear',
  ],
  cases: [
    { visible: true, n: 3, flights: [[0, 1, 100], [1, 2, 100], [0, 2, 300]], src: 0, dst: 2, k: 1, expect: 200 },
    { visible: true, n: 2, flights: [[0, 1, 100]], src: 0, dst: 1, k: 0, expect: 100 },
    { visible: true, n: 3, flights: [[0, 1, 100], [1, 2, 100], [0, 2, 300]], src: 0, dst: 2, k: 0, expect: 300 },
    // k = 1 permits a direct flight (zero stops) as well as one stop.
    { visible: false, n: 3, flights: [[0, 1, 5], [1, 2, 5]], src: 0, dst: 2, k: 1, expect: 10 },
    // The cheap route uses THREE flights, which needs k = 2 stops. With k = 1 the
    // direct flight is still allowed, so the expensive answer wins.
    { visible: false, n: 4, flights: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 100]], src: 0, dst: 3, k: 1, expect: 100 },
    { visible: false, n: 4, flights: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 100]], src: 0, dst: 3, k: 2, expect: 3 },
    // Unreachable destination.
    { visible: false, n: 3, flights: [[0, 1, 1]], src: 0, dst: 2, k: 5, expect: -1 },
    // Parallel flights: the cheaper one must be used.
    { visible: false, n: 2, flights: [[0, 1, 50], [0, 1, 10]], src: 0, dst: 1, k: 0, expect: 10 },
    // A zero-cost flight is still a real flight and consumes a hop.
    { visible: false, n: 3, flights: [[0, 1, 0], [1, 2, 5]], src: 0, dst: 2, k: 0, expect: -1 },
    { visible: false, n: 3, flights: [[0, 1, 0], [1, 2, 5]], src: 0, dst: 2, k: 1, expect: 5 },
    // A more expensive direct flight beats a cheaper route that is one hop too long.
    { visible: false, n: 3, flights: [[0, 1, 1], [1, 2, 1], [0, 2, 50]], src: 0, dst: 2, k: 0, expect: 50 },
    { visible: false, n: 5, flights: [[0, 1, 2], [1, 2, 2], [2, 3, 2], [3, 4, 2], [0, 4, 9]], src: 0, dst: 4, k: 3, expect: 8 },
  ],
  reference: `function cheapestFlightsWithinKStops(n, flights, src, dst, k) {
  const INF = Infinity;
  // best[i] is the cheapest way to reach city i using the hops allowed so far.
  let best = new Array(n).fill(INF);
  best[src] = 0;
  for (let hop = 0; hop <= k; hop++) {
    const next = best.slice();
    for (const [u, v, cost] of flights) {
      if (best[u] === INF) continue;
      if (best[u] + cost < next[v]) next[v] = best[u] + cost;
    }
    best = next;
  }
  return best[dst] === INF ? -1 : best[dst];
}`,
};

CONTENT['Minimum Height Trees'] = {
  signature: lang('minimumHeightTrees',
    [['n', 'number'], ['edges', 'number[][]']],
    'number[]'),
  description:
    'An undirected tree has `n` nodes numbered 0 to n-1; each entry of `edges` is a pair [u, v] '
    + 'joining u and v. For each node consider how far away the most distant node is, measured '
    + 'along the unique path between them. Return the node or nodes whose distance is smallest, '
    + 'as a sorted array of node numbers. The graph is always a tree, so it is connected and has '
    + 'no cycles.',
  input:
    'The parameters are `n` on the first line and `edges` on the second line as an array of '
    + '[u, v] pairs.',
  output: 'Return the sorted array of nodes that are closest to every other node.',
  constraints: [
    '1 <= n <= 10000',
    'The edges form a tree, so edges.length == n - 1',
    'Each edge is [u, v] with 0 <= u, v < n and u != v',
    'No repeated edges',
  ],
  cases: [
    { visible: true, n: 1, edges: [], expect: [0] },
    { visible: true, n: 2, edges: [[0, 1]], expect: [0, 1] },
    { visible: true, n: 6, edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]], expect: [0] },
    // A chain has two central nodes; a star has exactly one.
    { visible: false, n: 4, edges: [[0, 1], [1, 2], [2, 3]], expect: [1, 2] },
    { visible: false, n: 4, edges: [[0, 1], [0, 2], [0, 3]], expect: [0] },
    { visible: false, n: 3, edges: [[1, 2], [1, 0]], expect: [1] },
    { visible: false, n: 5, edges: [[0, 1], [1, 2], [2, 3], [3, 4]], expect: [2] },
    { visible: false, n: 6, edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], expect: [2, 3] },
    // Node labels need not follow tree order; the centre is found structurally.
    { visible: false, n: 7, edges: [[5, 6], [5, 4], [4, 0], [4, 1], [5, 2], [2, 3]], expect: [5] },
    // Deep asymmetric tree: the centre is found structurally, not by index.
    { visible: false, n: 8, edges: [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7]], expect: [0, 1] },
    { visible: false, n: 9, edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [0, 6], [6, 7], [7, 8]], expect: [1] },
  ],
  reference: `function minimumHeightTrees(n, edges) {
  const adj = new Array(n);
  const degree = new Array(n).fill(0);
  for (let i = 0; i < n; i++) adj[i] = [];
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); degree[u]++; degree[v]++; }
  // Repeatedly strip the current leaves. The last one or two nodes left standing
  // are exactly the nodes of minimum eccentricity.
  let layer = [];
  for (let i = 0; i < n; i++) if (degree[i] <= 1) layer.push(i);
  let remaining = n;
  while (remaining > 2 && layer.length) {
    remaining -= layer.length;
    const next = [];
    for (const leaf of layer) {
      for (const nb of adj[leaf]) {
        degree[nb]--;
        if (degree[nb] === 1) next.push(nb);
      }
    }
    layer = next;
  }
  return layer.sort((a, b) => a - b);
}`,
};

CONTENT['Keys and Rooms'] = {
  signature: lang('canReachAllRooms',
    [['rooms', 'number[][]']],
    'boolean'),
  description:
    'There are `rooms.length` rooms numbered 0 to rooms.length-1, and you start in room 0 with no '
    + 'keys. Each entry rooms[i] lists the numbers of the rooms whose keys are lying in room i. '
    + 'Picking up a key lets you enter that room, and from any room you can pick up every key in '
    + 'it. Return true when room rooms.length-1 can be reached this way, and false when it cannot.',
  input:
    'The single parameter `rooms` is an array of arrays, where rooms[i] lists the rooms whose '
    + 'keys are found in room i.',
  output: 'Return true when the last room is reachable from room 0, otherwise false.',
  constraints: [
    '1 <= rooms.length <= 1000',
    'Each inner array holds the room numbers whose keys are in that room',
    '0 <= rooms[i][j] < rooms.length',
    'A room may list its own key',
  ],
  cases: [
    { visible: true, rooms: [[1], [2], [3], []], expect: true },
    { visible: true, rooms: [[], [1], [2], []], expect: false },
    { visible: true, rooms: [[], [0], []], expect: false },
    // Room 0 holds TWO keys, [1, 3], and only the second one reaches the last
    // room. A traversal that follows just the first key per room reports false.
    { visible: true, rooms: [[1, 3], [], [], []], expect: true },
    // Single room: you are already there, so the answer is true.
    { visible: false, rooms: [[]], expect: true },
    // The last room needs a chain of three key pickups.
    { visible: false, rooms: [[1], [2], [3], []], expect: true },
    // Room 0 has no keys at all, so nothing is reachable.
    { visible: false, rooms: [[], [], [1], [2]], expect: false },
    // A self-referential key adds nothing.
    { visible: false, rooms: [[0, 1], [], []], expect: false },
    // Only room 0's own key is here, and room 2's key sits behind the locked
    // room 1, so the last room stays unreachable.
    { visible: false, rooms: [[0], [0, 2], []], expect: false },
    // The first key in each room is a dead end and the second is the way out, so
    // a solution that only ever follows keys[room][0] never arrives.
    { visible: false, rooms: [[0, 1], [0], []], expect: false },
    { visible: false, rooms: [[1, 2], [0], []], expect: true },
    // Two dead-end keys must both be stepped past.
    { visible: false, rooms: [[0, 1], [0, 2], [], []], expect: false },
    // Cycles that do not reach the last room.
    { visible: false, rooms: [[1], [0], [3], [], []], expect: false },
    { visible: false, rooms: [[1], [2], [0], []], expect: false },
    { visible: false, rooms: [[1, 2], [3], [3], []], expect: true },
    { visible: false, rooms: [[1], [2], [3], [4], []], expect: true },
    { visible: false, rooms: [[3], [0], [0], [1], []], expect: false },
  ],
  reference: `function canReachAllRooms(rooms) {
  const n = rooms.length;
  const seen = new Array(n).fill(false);
  seen[0] = true;
  const queue = [0];
  while (queue.length) {
    const room = queue.shift();
    for (const key of rooms[room]) {
      if (seen[key]) continue;
      seen[key] = true;
      queue.push(key);
    }
  }
  return seen[n - 1];
}`,
};

CONTENT['Is Graph Bipartite'] = {
  signature: lang('isBipartite',
    [['n', 'number'], ['edges', 'number[][]']],
    'boolean'),
  description:
    'An undirected graph has `n` nodes numbered 0 to n-1; each entry of `edges` is a pair [u, v] '
    + 'joining u and v. The graph is bipartite when its nodes can be split into two groups so that '
    + 'every edge joins nodes in different groups. Return true when such a split exists and false '
    + 'otherwise. A node joined to itself, or any odd-length cycle, makes the answer false. The '
    + 'graph need not be connected: every component must be bipartite on its own.',
  input:
    'The parameters are `n` on the first line and `edges` on the second line as an array of '
    + '[u, v] pairs.',
  output: 'Return true when the graph is bipartite, otherwise false.',
  constraints: [
    '1 <= n <= 100',
    '0 <= edges.length <= n * (n - 1) / 2',
    'Each edge is [u, v] with 0 <= u, v < n',
    'Self-loops and repeated edges may appear',
  ],
  cases: [
    { visible: true, n: 2, edges: [[0, 1]], expect: true },
    { visible: true, n: 3, edges: [[0, 1], [1, 2], [2, 0]], expect: false },
    { visible: true, n: 4, edges: [[0, 1], [0, 2], [1, 3]], expect: true },
    // The odd cycle 2-3-4-2 sits in a component that node 0 never reaches, so a
    // colouring pass that starts only at node 0 wrongly reports true.
    { visible: true, n: 6, edges: [[0, 1], [2, 3], [3, 4], [4, 2]], expect: false },
    // Disconnected components are checked independently.
    { visible: false, n: 5, edges: [[0, 1], [2, 3]], expect: true },
    { visible: false, n: 6, edges: [[0, 1], [2, 3], [3, 4], [4, 2]], expect: false },
    // A self-loop can never be split across two groups.
    { visible: false, n: 3, edges: [[0, 0]], expect: false },
    { visible: false, n: 4, edges: [[0, 1], [1, 2], [2, 3], [3, 1]], expect: false },
    // An odd cycle hidden inside an otherwise bipartite component.
    { visible: false, n: 6, edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 1]], expect: false },
    // A 5-cycle is an odd cycle, so it is NOT bipartite.
    { visible: false, n: 5, edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]], expect: false },
    // Isolated nodes are trivially fine.
    { visible: false, n: 4, edges: [], expect: true },
    { visible: false, n: 1, edges: [], expect: true },
    // Even cycle: bipartite.
    { visible: false, n: 4, edges: [[0, 1], [1, 2], [2, 3], [3, 0]], expect: true },
    // A repeated edge is one constraint, not a conflicting second one.
    { visible: false, n: 3, edges: [[0, 1], [0, 1], [1, 2]], expect: true },
  ],
  reference: `function isBipartite(n, edges) {
  const adj = new Array(n);
  for (let i = 0; i < n; i++) adj[i] = [];
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  const colour = new Array(n).fill(-1);
  for (let start = 0; start < n; start++) {
    if (colour[start] !== -1) continue;
    colour[start] = 0;
    const queue = [start];
    while (queue.length) {
      const u = queue.shift();
      for (const v of adj[u]) {
        if (colour[v] === -1) { colour[v] = 1 - colour[u]; queue.push(v); }
        else if (colour[v] === colour[u]) return false;
      }
    }
  }
  return true;
}`,
};

CONTENT['Find Eventual Safe States'] = {
  signature: lang('eventualSafeStates',
    [['n', 'number'], ['edges', 'number[][]']],
    'number[]'),
  description:
    'A directed graph has `n` nodes numbered 0 to n-1; each entry of `edges` is a pair [from, to] '
    + 'meaning an outgoing edge. A node is safe when EVERY path that leaves it eventually runs out '
    + 'of edges, i.e. arrives at a node with no outgoing edges at all. So a node that drains into '
    + 'such a terminal node is safe, and a node with no outgoing edges is safe immediately. A node '
    + 'that sits on a cycle, or that can reach one, is not safe, because you could walk around that '
    + 'cycle forever and never run out of edges. Return all safe nodes as a sorted array.',
  input:
    'The parameters are `n` on the first line and `edges` on the second line as an array of '
    + '[from, to] pairs.',
  output: 'Return the sorted array of node numbers that are eventually safe.',
  constraints: [
    '1 <= n <= 100',
    '0 <= edges.length <= 10000',
    'Each edge is [from, to] with 0 <= from, to < n',
    'Self-loops, parallel edges and disconnected graphs may all appear',
  ],
  cases: [
    // Every node here drains into the terminal node 4, so ALL of them are safe.
    { visible: true, n: 5, edges: [[0, 1], [0, 2], [1, 2], [2, 3], [3, 4]], expect: [0, 1, 2, 3, 4] },
    // Nodes 0,1,2 form a cycle; only the separate component 3 -> 4 is safe.
    { visible: true, n: 5, edges: [[0, 1], [1, 2], [2, 0], [3, 4]], expect: [3, 4] },
    { visible: true, n: 3, edges: [], expect: [0, 1, 2] },
    // Node 1 is caught by its self-loop, so node 0 is unsafe too; only node 2
    // has no outgoing edge at all.
    { visible: false, n: 3, edges: [[0, 1], [1, 1]], expect: [2] },
    // Nodes 2 and 3 form a cycle, so 0 and 1 are dragged down with them.
    { visible: false, n: 4, edges: [[0, 1], [1, 2], [2, 3], [3, 2]], expect: [] },
    // Everything leads into a cycle, so nothing is safe.
    { visible: false, n: 2, edges: [[0, 1], [1, 0]], expect: [] },
    // Disconnected components: 0<->1 is a cycle, while 2->3->4 drains safely.
    { visible: false, n: 5, edges: [[0, 1], [1, 0], [2, 3], [3, 4]], expect: [2, 3, 4] },
    // Only node 1 is trapped in a self-loop, so node 0 is still safe.
    { visible: false, n: 2, edges: [[1, 1]], expect: [0] },
    // A pure chain that ends in a terminal: every node on it is safe.
    { visible: false, n: 6, edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], expect: [0, 1, 2, 3, 4, 5] },
    // Node 3 can reach the 0-1-2-3 cycle through its edge to 0, so 3 and
    // everything upstream is unsafe; only the 4 -> 5 -> 6 chain is safe.
    { visible: false, n: 7, edges: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [5, 6], [4, 5]], expect: [4, 5, 6] },
    // Parallel edges do not change reachability.
    { visible: false, n: 3, edges: [[0, 1], [0, 1], [1, 2]], expect: [0, 1, 2] },
    // One extra safe terminal reached from a chain.
    { visible: false, n: 4, edges: [[0, 1], [1, 2], [1, 3]], expect: [0, 1, 2, 3] },
  ],
  reference: `function eventualSafeStates(n, edges) {
  const outDegree = new Array(n).fill(0);
  const reverse = new Array(n);
  for (let i = 0; i < n; i++) reverse[i] = [];
  for (const [from, to] of edges) { outDegree[from]++; reverse[to].push(from); }
  // Reverse topological peel. A node is safe only when EVERY outgoing edge
  // leads to a node already known safe, so remaining[p] counts the successors
  // of p that are still unresolved. Nodes with no outgoing edges are safe
  // immediately; whatever never resolves sits on, or can reach, a cycle.
  const remaining = outDegree.slice();
  const safe = new Array(n).fill(false);
  const queue = [];
  for (let i = 0; i < n; i++) {
    if (remaining[i] === 0) { safe[i] = true; queue.push(i); }
  }
  while (queue.length) {
    const node = queue.shift();
    for (const prev of reverse[node]) {
      remaining[prev]--;
      if (remaining[prev] === 0 && !safe[prev]) { safe[prev] = true; queue.push(prev); }
    }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (safe[i]) out.push(i);
  return out;
}`,
};

// CONTENT_APPEND_MARKER

module.exports = { CONTENT, lang };