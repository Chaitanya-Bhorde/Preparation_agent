'use strict';

/**
 * dsaBatch4Wrong.js
 * ---------------------------------------------------------------------------
 * Deliberately wrong solutions, one per batch-4 problem, used to prove the judge
 * still rejects bad work.
 *
 * These are NOT junk programs. Each is a plausible near-miss for its own
 * problem - an off-by-one, a missing edge case, a wrong recurrence, a swapped
 * operand - so if one were ACCEPTED the judging contract would be too weak to
 * catch the mistakes a learner actually makes. Every one is additionally proven
 * NON-equivalent to its reference by the builder's discrimination gate.
 * ---------------------------------------------------------------------------
 */

const WRONG = {};

WRONG['Binary Tree Zigzag Level Order'] =
  // Plain breadth-first order: never alternates the direction.
  `function zigzagLevelOrder(root) {
  const nodes = root.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let next = 1;
  for (let i = 0; i < nodes.length && next < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    n.left = nodes[next++] || null;
    if (next < nodes.length) n.right = nodes[next++] || null;
  }
  const out = [];
  let level = nodes[0] ? [nodes[0]] : [];
  while (level.length) {
    for (const n of level) out.push(n.val);
    const nextLevel = [];
    for (const n of level) {
      if (n.left) nextLevel.push(n.left);
      if (n.right) nextLevel.push(n.right);
    }
    level = nextLevel;
  }
  return out;
}`;

WRONG['Path Sum II'] =
  // Counts paths that may START at any node, which is Path Sum III, not II.
  `function pathSum(root, targetSum) {
  const nodes = root.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let next = 1;
  for (let i = 0; i < nodes.length && next < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    n.left = nodes[next++] || null;
    if (next < nodes.length) n.right = nodes[next++] || null;
  }
  let count = 0;
  const walk = (n, sum) => {
    if (!n) return;
    const total = sum + n.val;
    if (!n.left && !n.right) { if (total === targetSum) count++; return; }
    walk(n.left, total);
    walk(n.right, total);
  };
  for (let i = 0; i < nodes.length; i++) walk(nodes[i], 0);
  return count;
}`;

WRONG['Path Sum III'] =
  // Prunes once the running sum exceeds the target, which is invalid because
  // node values may be negative.
  `function pathSum(root, targetSum) {
  const nodes = root.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let next = 1;
  for (let i = 0; i < nodes.length && next < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    n.left = nodes[next++] || null;
    if (next < nodes.length) n.right = nodes[next++] || null;
  }
  const all = [];
  const collect = (n) => {
    if (!n) return;
    all.push(n);
    collect(n.left);
    collect(n.right);
  };
  collect(nodes[0] || null);
  let count = 0;
  for (const start of all) {
    const stack = [[start, start.val]];
    while (stack.length) {
      const f = stack.pop();
      if (f[1] === targetSum) count++;
      if (f[1] > targetSum) continue;
      if (f[0].left) stack.push([f[0].left, f[1] + f[0].left.val]);
      if (f[0].right) stack.push([f[0].right, f[1] + f[0].right.val]);
    }
  }
  return count;
}`;

WRONG['Flatten Binary Tree to Linked List'] =
  // Inorder instead of preorder.
  `function flatten(root) {
  const nodes = root.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let next = 1;
  for (let i = 0; i < nodes.length && next < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    n.left = nodes[next++] || null;
    if (next < nodes.length) n.right = nodes[next++] || null;
  }
  const out = [];
  const walk = (n) => {
    if (!n) return;
    walk(n.left);
    out.push(n.val);
    walk(n.right);
  };
  walk(nodes[0] || null);
  return out;
}`;

WRONG['Construct Binary Tree Preorder Inorder'] =
  // Splits on the PREORDER array instead of the inorder, which misattributes
  // the left and right subtrees.
  `function buildTree(preorder, inorder) {
  if (!preorder || preorder.length === 0) return [];
  const at = new Map();
  preorder.forEach((v, i) => at.set(v, i));
  let pi = 0;
  const build = (lo, hi) => {
    if (lo > hi) return null;
    const rootVal = inorder[lo];
    const mid = at.get(rootVal);
    return { val: rootVal, left: build(lo + 1, mid - 1), right: build(mid + 1, hi) };
  };
  const root = build(0, inorder.length - 1);
  const out = [];
  const q = [root];
  while (q.length) {
    const n = q.shift();
    if (!n) { out.push(null); continue; }
    out.push(n.val);
    q.push(n.left, n.right);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}`;

WRONG['Binary Tree Right Side View'] =
  // Takes the LEFTMOST node of each level, which is the left side view.
  `function rightSideView(root) {
  const nodes = root.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let next = 1;
  for (let i = 0; i < nodes.length && next < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    n.left = nodes[next++] || null;
    if (next < nodes.length) n.right = nodes[next++] || null;
  }
  const out = [];
  let level = nodes[0] ? [nodes[0]] : [];
  while (level.length) {
    out.push(level[0].val);
    const nextLevel = [];
    for (const n of level) {
      if (n.left) nextLevel.push(n.left);
      if (n.right) nextLevel.push(n.right);
    }
    level = nextLevel;
  }
  return out;
}`;

WRONG['Kth Smallest Element in BST'] =
  // Counts down from the LARGEST value, an off-by-one from the true answer.
  `function kthSmallest(root, k) {
  const nodes = root.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let next = 1;
  for (let i = 0; i < nodes.length && next < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    n.left = nodes[next++] || null;
    if (next < nodes.length) n.right = nodes[next++] || null;
  }
  const values = [];
  const collect = (n) => {
    if (!n) return;
    values.push(n.val);
    collect(n.left);
    collect(n.right);
  };
  collect(nodes[0] || null);
  values.sort((a, b) => b - a);
  return values[k - 1];
}`;

WRONG['Count Complete Tree Nodes'] =
  // Counts only the perfectly balanced prefix of the heap, which undercounts
  // whenever the last level is partially filled.
  `function countNodes(root) {
  if (root.length === 0) return 0;
  const depth = root.length;
  let full = 1;
  while (full * 2 <= depth) full *= 2;
  return full;
}`;

WRONG['Binary Tree Level Order II'] =
  // Top-down order, the sibling problem, rather than bottom-up.
  `function levelOrderBottomUp(root) {
  const nodes = root.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let next = 1;
  for (let i = 0; i < nodes.length && next < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    n.left = nodes[next++] || null;
    if (next < nodes.length) n.right = nodes[next++] || null;
  }
  const levels = [];
  let level = nodes[0] ? [nodes[0]] : [];
  while (level.length) {
    levels.push(level.map((n) => n.val));
    const nextLevel = [];
    for (const n of level) {
      if (n.left) nextLevel.push(n.left);
      if (n.right) nextLevel.push(n.right);
    }
    level = nextLevel;
  }
  return levels;
}`;

WRONG['Sum Root to Leaf Numbers'] =
  // Sums the DIGIT values rather than the numbers each path forms.
  `function sumRootToLeafNumbers(root) {
  const nodes = root.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let next = 1;
  for (let i = 0; i < nodes.length && next < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    n.left = nodes[next++] || null;
    if (next < nodes.length) n.right = nodes[next++] || null;
  }
  let total = 0;
  const walk = (n) => {
    if (!n) return;
    if (!n.left && !n.right) { total += n.val; return; }
    walk(n.left);
    walk(n.right);
  };
  walk(nodes[0] || null);
  return total;
}`;

WRONG['Max Area of Island'] =
  // Treats DIAGONAL contact as connected, which is the eight-neighbour variant.
  `function maxAreaOfIsland(grid) {
  if (!grid || grid.length === 0 || grid[0].length === 0) return 0;
  const rows = grid.length;
  const cols = grid[0].length;
  const g = grid.map((r) => r.slice());
  const D = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
  let best = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (g[r][c] !== 1) continue;
      let area = 0;
      const stack = [[r, c]];
      g[r][c] = 0;
      while (stack.length) {
        const cell = stack.pop();
        area++;
        for (const d of D) {
          const ny = cell[0] + d[0];
          const nx = cell[1] + d[1];
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && g[ny][nx] === 1) {
            g[ny][nx] = 0;
            stack.push([ny, nx]);
          }
        }
      }
      if (area > best) best = area;
    }
  }
  return best;
}`;

WRONG['Pacific Atlantic Water Flow'] =
  // Requires strictly DECREASING flow (heights[ny] < heights[y]) instead of
  // allowing level flow, which is the wrong direction of comparison.
  `function pacificAtlantic(heights) {
  if (!heights || heights.length === 0 || heights[0].length === 0) return [];
  const rows = heights.length;
  const cols = heights[0].length;
  const flow = (starts) => {
    const seen = new Set();
    const stack = [];
    for (const [r, c] of starts) { const k = r * cols + c; if (!seen.has(k)) { seen.add(k); stack.push([r, c]); } }
    while (stack.length) {
      const [y, x] = stack.pop();
      const D = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const d of D) {
        const ny = y + d[0];
        const nx = x + d[1];
        if (ny < 0 || ny >= rows || nx < 0 || nx >= cols) continue;
        const k = ny * cols + nx;
        if (seen.has(k) || heights[ny][nx] > heights[y][x]) continue;
        seen.add(k);
        stack.push([ny, nx]);
      }
    }
    return seen;
  };
  const p = [];
  const a = [];
  for (let c = 0; c < cols; c++) { p.push([0, c]); a.push([rows - 1, c]); }
  for (let r = 0; r < rows; r++) { p.push([r, 0]); a.push([r, cols - 1]); }
  const ps = flow(p);
  const as = flow(a);
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = r * cols + c;
      if (ps.has(k) && as.has(k)) out.push([r, c]);
    }
  }
  return out;
}`;

WRONG['Surrounded Regions'] =
  // Captures regions that merely do NOT touch the LEFT/TOP edges, forgetting
  // the right and bottom borders.
  `function captureRegions(board) {
  if (!board || board.length === 0 || board[0].length === 0) return board;
  const rows = board.length;
  const cols = board[0].length;
  const g = board.map((r) => r.slice());
  const safe = new Set();
  const stack = [];
  const push = (r, c) => {
    const k = r * cols + c;
    if (!safe.has(k) && g[r][c] === 'X') { safe.add(k); stack.push([r, c]); }
  };
  for (let c = 0; c < cols; c++) push(0, c);
  for (let r = 0; r < rows; r++) push(r, 0);
  const D = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  while (stack.length) {
    const cell = stack.pop();
    for (const d of D) {
      const ny = cell[0] + d[0];
      const nx = cell[1] + d[1];
      if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) push(ny, nx);
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (g[r][c] === 'X' && !safe.has(r * cols + c)) g[r][c] = 'O';
    }
  }
  return g;
}`;

WRONG['Course Schedule II'] =
  // Takes whatever the queue happens to yield without sorting, so the ordering
  // is not the documented smallest-first one.
  `function findOrder(numCourses, prerequisites) {
  const after = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) { after[a].push(b); indeg[b]++; }
  const ready = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) ready.push(i);
  const out = [];
  while (ready.length) {
    const course = ready.shift();
    out.push(course);
    for (const next of after[course]) {
      if (--indeg[next] === 0) ready.push(next);
    }
  }
  return out.length === numCourses ? out : [];
}`;

WRONG['Number of Connected Components'] =
  // Uses the largest index in each component instead of the number of
  // components.
  `function countComponents(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  for (const [u, v] of edges) {
    const ru = find(u);
    const rv = find(v);
    if (ru !== rv) parent[ru] = rv;
  }
  const roots = new Set();
  for (let i = 0; i < n; i++) roots.add(find(i));
  let best = 0;
  for (const r of roots) if (r > best) best = r;
  return best;
}`;

WRONG['Graph Valid Tree'] =
  // Checks only the edge count and skips connectivity, so a disconnected
  // forest with n-1 edges is wrongly accepted.
  `function validTree(n, edges) {
  return edges.length === n - 1;
}`;

module.exports = { WRONG };