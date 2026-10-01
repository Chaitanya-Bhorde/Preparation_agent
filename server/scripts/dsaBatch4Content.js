'use strict';

/**
 * dsaBatch4Content.js
 * ---------------------------------------------------------------------------
 * Authored content for the 16 batch-4 problems whose contract is fixed by
 * their title.
 *
 * `cases` are the single source of truth for expected output: every expected
 * value is COMPUTED by running `reference`, never typed by hand. Where an answer
 * is easy to get subtly wrong, the case also carries an `expect` value that is
 * asserted directly against the reference, so a reference that is wrong in the
 * same way the renderer is wrong still fails.
 *
 * Representations follow the conventions the active catalogue already uses:
 * trees are level-order arrays with null for a missing child, linked lists are
 * flat arrays of node values, and graphs are adjacency lists given as arrays of
 * arrays.
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

// --------------------------------------------------------------------- Trees
//
// Trees are supplied as a level-order array of node values in which null marks
// a missing child. This is the catalogue's own encoding and is decoded by
// filling children from a running pointer that skips nulls (NOT by heap
// index), which is what makes it a genuine encoding rather than a guess.
// An empty tree is [].

CONTENT['Binary Tree Zigzag Level Order'] = {
  signature: lang('zigzagLevelOrder', [['root', 'number[]']], 'number[]'),
  description:
    'Given the root of a binary tree, return its node values in breadth-first order but with the '
    + 'direction alternating by level: the first level reads left to right, the second right to '
    + 'left, the third left to right, and so on. The result is one flat array covering every node. '
    + 'The tree is supplied as a level-order array of node values, where null marks a missing child.',
  input: 'The single parameter `root` is the level-order array of node values; [] for an empty tree.',
  output: 'Return a flat array of all node values in zigzag breadth-first order.',
  constraints: [
    '0 <= root.length <= 2000',
    '-100 <= root[i] <= 100',
    'root is a well-formed level-order encoding of a binary tree',
  ],
  cases: [
    { visible: true, root: [3, 9, 20, null, null, 15, 7], expect: [3,20,9,15,7] },
    { visible: true, root: [1], expect: [1] },
    { visible: true, root: [1, 2, 3, 4, 5, 6, 7], expect: [1,3,2,4,5,6,7] },
    { visible: true, root: [], expect: [] },
    { visible: false, root: [1, 2], expect: [1,2] },
    { visible: false, root: [1, null, 2, 3], expect: [1,2,3] },
    { visible: false, root: [1, 2, 3, null, 5, null, 7], expect: [1,3,2,5,7] },
    { visible: false, root: [5, 3, 2, 1], expect: [5,2,3,1] },
    { visible: false, root: [1, 2, 3, 4, null, null, 5], expect: [1,3,2,4,5] },
    { visible: false, root: [-1, -2, -3, -4, -5, -6, -7], expect: [-1,-3,-2,-4,-5,-6,-7] },
    { visible: false, root: [1, 2, 3, 4, 5], expect: [1,3,2,4,5] },
  ],
  reference: `function zigzagLevelOrder(root) {
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
  let leftToRight = true;
  while (level.length) {
    const vals = level.map((n) => n.val);
    out.push(...(leftToRight ? vals : vals.reverse()));
    const nextLevel = [];
    for (const n of level) {
      if (n.left) nextLevel.push(n.left);
      if (n.right) nextLevel.push(n.right);
    }
    level = nextLevel;
    leftToRight = !leftToRight;
  }
  return out;
}`,
};

CONTENT['Path Sum II'] = {
  signature: lang('pathSum', [['root', 'number[]'], ['targetSum', 'number']], 'number'),
  description:
    'Given the root of a binary tree and a target, count how many downward paths run from the ROOT '
    + 'to a leaf whose node values add up to exactly the target. Only paths that start at the root '
    + 'and end at a leaf (a node with no children) are counted. Return 0 when there are none.',
  input: 'The parameters are `root` on the first line and `targetSum` on the second line.',
  output: 'Return the number of root-to-leaf paths whose values sum to targetSum.',
  constraints: [
    '0 <= root.length <= 1000',
    '-1000 <= root[i] <= 1000',
    '-2147483648 <= targetSum <= 2147483647',
    'root is a well-formed level-order encoding of a binary tree',
  ],
  cases: [
    { visible: true, root: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1], targetSum: 22, expect: 1 },
    { visible: true, root: [1, 2, 3], targetSum: 5, expect: 0 },
    { visible: true, root: [], targetSum: 0, expect: 0 },
    { visible: false, root: [1], targetSum: 0, expect: 0 },
    { visible: false, root: [1], targetSum: 1, expect: 1 },
    { visible: false, root: [1, 2, 3], targetSum: 3, expect: 1 },
    { visible: false, root: [1, 2, null, 3], targetSum: 3, expect: 0 },
    { visible: false, root: [0, 1, 1], targetSum: 1, expect: 2 },
    { visible: false, root: [1, -2, -3, 1, 3, -2, null, -1], targetSum: 3, expect: 0 },
    { visible: false, root: [1, 2, 3, 4, 5], targetSum: 10, expect: 0 },
    { visible: false, root: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, 5, 1], targetSum: 22, expect: 2 },
    { visible: false, root: [1], targetSum: 2, expect: 0 },
  ],
  reference: `function pathSum(root, targetSum) {
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
  walk(nodes[0] || null, 0);
  return count;
}`,
};

CONTENT['Path Sum III'] = {
  signature: lang('pathSum', [['root', 'number[]'], ['targetSum', 'number']], 'number'),
  description:
    'Given the root of a binary tree and a target, count the downward paths that sum to exactly the '
    + 'target, where a path may START at any node and END at any node below it, and must move '
    + 'downwards only (parent to child). Node values may be negative, so a path cannot be pruned '
    + 'on a running sum that already exceeds the target. Count every distinct sequence of nodes.',
  input: 'The parameters are `root` on the first line and `targetSum` on the second line.',
  output: 'Return the number of downward paths summing to targetSum.',
  constraints: [
    '0 <= root.length <= 1000',
    '-1000 <= root[i] <= 1000',
    'root is a well-formed level-order encoding of a binary tree',
  ],
  cases: [
    { visible: true, root: [10, 5, -3, 3, 2, null, 11, 3, -2, null, 1], targetSum: 8, expect: 3 },
    { visible: true, root: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, 5, 1], targetSum: 22, expect: 3 },
    { visible: true, root: [1], targetSum: 0, expect: 0 },
    { visible: false, root: [], targetSum: 0, expect: 0 },
    { visible: false, root: [1], targetSum: 1, expect: 1 },
    { visible: false, root: [0, 1, 1], targetSum: 1, expect: 4 },
    { visible: false, root: [1, -1], targetSum: 0, expect: 1 },
    { visible: false, root: [1, 2, 3], targetSum: 3, expect: 2 },
    { visible: false, root: [3, 0, 0], targetSum: 0, expect: 2 },
    { visible: false, root: [1, -2, -3, 1, 3, -2, null, -1], targetSum: 0, expect: 2 },
    { visible: false, root: [100, 1, 1], targetSum: 1, expect: 2 },
    // A running sum that EXCEEDS the target can still come back down, because
    // node values may be negative. A solution that prunes on sum > target is
    // wrong here.
    { visible: true, root: [1, 2, 3, -3, null, 2, -2], targetSum: 0, expect: 1 },
    { visible: true, root: [2, null, -2, 3, -1, -1, 2, -1, 3], targetSum: -3, expect: 1 },
  ],
  reference: `function pathSum(root, targetSum) {
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
      const frame = stack.pop();
      if (frame[1] === targetSum) count++;
      if (frame[0].left) stack.push([frame[0].left, frame[1] + frame[0].left.val]);
      if (frame[0].right) stack.push([frame[0].right, frame[1] + frame[0].right.val]);
    }
  }
  return count;
}`,
};

CONTENT['Flatten Binary Tree to Linked List'] = {
  signature: lang('flatten', [['root', 'number[]']], 'number[]'),
  description:
    'Flatten a binary tree into a single list following PREORDER: every node of the left subtree, '
    + 'then every node of the right subtree, then the node itself. Return the node values in that '
    + 'order. The tree is supplied as a level-order array of node values, where null marks a '
    + 'missing child.',
  input: 'The single parameter `root` is the level-order array of node values; [] for an empty tree.',
  output: 'Return a flat array of the node values in preorder.',
  constraints: [
    '0 <= root.length <= 2000',
    '-100 <= root[i] <= 100',
    'root is a well-formed level-order encoding of a binary tree',
  ],
  cases: [
    { visible: true, root: [1, 2, 5, 3, 4, null, 6], expect: [1,2,3,4,5,6] },
    { visible: true, root: [], expect: [] },
    { visible: true, root: [1], expect: [1] },
    { visible: false, root: [1, 2, 3], expect: [1,2,3] },
    { visible: false, root: [1, null, 2], expect: [1,2] },
    { visible: false, root: [1, 2, null, 3], expect: [1,2,3] },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7], expect: [1,2,4,5,3,6,7] },
    { visible: false, root: [1, 2, 3, null, null, 4, 5], expect: [1,2,3,4,5] },
    { visible: false, root: [-1, 2, -3, 4, 5], expect: [-1,2,4,5,-3] },
    { visible: false, root: [5, 4, 3, 2, 1], expect: [5,4,2,1,3] },
    { visible: false, root: [1, 2, 3, 4, 5], expect: [1,2,4,5,3] },
  ],
  reference: `function flatten(root) {
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
    out.push(n.val);
    walk(n.left);
    walk(n.right);
  };
  walk(nodes[0] || null);
  return out;
}`,
};

CONTENT['Construct Binary Tree Preorder Inorder'] = {
  signature: lang('buildTree', [['preorder', 'number[]'], ['inorder', 'number[]']], 'number[]'),
  description:
    'Given the preorder and inorder traversals of a binary tree whose node values are all distinct, '
    + 'rebuild the tree and return it in the same level-order encoding used for input: a flat array '
    + 'of node values in level order with null for each missing child, and no trailing nulls. An '
    + 'empty tree is returned as an empty array.',
  input:
    'The parameters are `preorder` on the first line and `inorder` on the second line, each a flat '
    + 'array of node values.',
  output: 'Return the rebuilt tree as a level-order array with null for missing children.',
  constraints: [
    '0 <= preorder.length <= 300',
    'preorder.length == inorder.length',
    'All values in both traversals are distinct',
    '-300 <= preorder[i] <= 300',
  ],
  cases: [
    { visible: true, preorder: [3, 9, 20, 15, 7], inorder: [9, 3, 15, 20, 7], expect: [3,9,20,null,null,15,7] },
    { visible: true, preorder: [-1], inorder: [-1], expect: [-1] },
    { visible: true, preorder: [], inorder: [], expect: [] },
    { visible: false, preorder: [1, 2, 3], inorder: [3, 2, 1], expect: [1,2,null,3] },
    { visible: false, preorder: [1, 2], inorder: [2, 1], expect: [1,2] },
    // preorder [3,1,4,2] with inorder [1,3,2,4]: root 3, left 1, right 4 (left 2).
    { visible: false, preorder: [3, 1, 4, 2], inorder: [1, 3, 2, 4], expect: [3,1,4,null,null,2] },
    // Skewed: preorder [1,2,3] with inorder [3,2,1] is a left spine.
    { visible: false, preorder: [1, 2, 3], inorder: [3, 2, 1], expect: [1,2,null,3] },
    { visible: false, preorder: [5, 3, 2, 1, 4], inorder: [1, 2, 3, 4, 5], expect: [5,3,null,2,4,1] },
    { visible: false, preorder: [2, 1, 3], inorder: [1, 2, 3], expect: [2,1,3] },
    { visible: false, preorder: [1, 2, 4, 5, 3, 6, 7], inorder: [5, 4, 2, 1, 3, 6, 7], expect: [1,2,3,4,null,null,6,5,null,null,7] },
    { visible: false, preorder: [-3, -1, -2], inorder: [-1, -3, -2], expect: [-3,-1,-2] },
  ],
  reference: `function buildTree(preorder, inorder) {
  if (!preorder || preorder.length === 0) return [];
  const at = new Map();
  inorder.forEach((v, i) => at.set(v, i));
  let pi = 0;
  const build = (lo, hi) => {
    if (lo > hi) return null;
    const rootVal = preorder[pi++];
    const mid = at.get(rootVal);
    return { val: rootVal, left: build(lo, mid - 1), right: build(mid + 1, hi) };
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
}`,
};

CONTENT['Binary Tree Right Side View'] = {
  signature: lang('rightSideView', [['root', 'number[]']], 'number[]'),
  description:
    'Given the root of a binary tree, return the values you would see looking at the tree from its '
    + 'right-hand side: for each level, from top to bottom, the rightmost node of that level. The '
    + 'tree is supplied as a level-order array of node values, where null marks a missing child.',
  input: 'The single parameter `root` is the level-order array of node values; [] for an empty tree.',
  output: 'Return a flat array holding one value per level, the rightmost node of that level.',
  constraints: [
    '0 <= root.length <= 1000',
    '-100 <= root[i] <= 100',
    'root is a well-formed level-order encoding of a binary tree',
  ],
  cases: [
    { visible: true, root: [1, 2, 3, null, 5, null, 4], expect: [1,3,4] },
    { visible: true, root: [1, null, 3], expect: [1,3] },
    { visible: true, root: [], expect: [] },
    { visible: false, root: [1], expect: [1] },
    { visible: false, root: [1, 2], expect: [1,2] },
    { visible: false, root: [1, 2, 3], expect: [1,3] },
    { visible: false, root: [1, 2, 3, 4], expect: [1,3,4] },
    { visible: false, root: [1, 2, 3, null, 5, 6], expect: [1,3,6] },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7], expect: [1,3,7] },
    { visible: false, root: [1, 2, 3, 4, null, null, 7, 8, 9], expect: [1,3,7,9] },
    { visible: false, root: [-1, -2, -3], expect: [-1,-3] },
  ],
  reference: `function rightSideView(root) {
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
    out.push(level[level.length - 1].val);
    const nextLevel = [];
    for (const n of level) {
      if (n.left) nextLevel.push(n.left);
      if (n.right) nextLevel.push(n.right);
    }
    level = nextLevel;
  }
  return out;
}`,
};

CONTENT['Kth Smallest Element in BST'] = {
  signature: lang('kthSmallest', [['root', 'number[]'], ['k', 'number']], 'number'),
  description:
    'Given the root of a binary SEARCH tree and an integer k, return the k-th smallest value in the '
    + 'tree, counting from 1. The tree satisfies the search-tree property: every value in a node '
    + 'left subtree is smaller and every value in its right subtree is larger. The tree is supplied '
    + 'as a level-order array of node values, where null marks a missing child.',
  input: 'The parameters are `root` on the first line and `k` on the second line.',
  output: 'Return the k-th smallest node value.',
  constraints: [
    '1 <= k <= root.length',
    '-10000 <= root[i] <= 10000',
    'root is a well-formed level-order encoding of a binary search tree',
  ],
  cases: [
    { visible: true, root: [3, 1, 4, null, 2], k: 1, expect: 1 },
    { visible: true, root: [5, 3, 6, 2, 4, null, null, 1], k: 3, expect: 3 },
    { visible: true, root: [1], k: 1, expect: 1 },
    { visible: false, root: [2, 1, 3], k: 2, expect: 2 },
    { visible: false, root: [2, 1, 3], k: 3, expect: 3 },
    { visible: false, root: [2, 1, 3], k: 1, expect: 1 },
    { visible: false, root: [3, 1, 4, null, 2], k: 2, expect: 2 },
    { visible: false, root: [3, 1, 4, null, 2], k: 3, expect: 3 },
    { visible: false, root: [5, 3, 6, 2, 4, null, null, 1], k: 1, expect: 1 },
    { visible: false, root: [5, 3, 6, 2, 4, null, null, 1], k: 4, expect: 4 },
    // Deep BST: root 10, left 5 (children 3 and 7, each with a child), right 15
    // (children 12 and 20, 20 having a left child 13).
    { visible: false, root: [10, 5, 15, 3, 7, 12, 20, null, null, null, null, null, null, 13], k: 3, expect: 7 },
    { visible: false, root: [-3, -5, -1], k: 2, expect: -3 },
    { visible: false, root: [-3, -5, -1], k: 1, expect: -5 },
    { visible: false, root: [-3, -5, -1], k: 3, expect: -1 },
  ],
  reference: `function kthSmallest(root, k) {
  const nodes = root.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let next = 1;
  for (let i = 0; i < nodes.length && next < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    n.left = nodes[next++] || null;
    if (next < nodes.length) n.right = nodes[next++] || null;
  }
  const head = nodes[0] || null;
  if (!head) return 0;
  // In-order walk of a BST yields the values in ascending order, so the k-th
  // smallest is the k-th node visited. Collect them explicitly rather than
  // juggling a cursor, which is easy to get subtly wrong.
  const values = [];
  const stack = [];
  let cur = head;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; }
    cur = stack.pop();
    values.push(cur.val);
    cur = cur.right;
  }
  return values.length >= k ? values[k - 1] : 0;
}`,
};

CONTENT['Count Complete Tree Nodes'] = {
  signature: lang('countNodes', [['root', 'number[]']], 'number'),
  description:
    'Given the root of a COMPLETE binary tree - every level except possibly the last is completely '
    + 'filled, and the last level is filled left to right - return its number of nodes. The tree is '
    + 'supplied as a level-order array of node values, where null marks a missing child.',
  input: 'The single parameter `root` is the level-order array of node values; [] for an empty tree.',
  output: 'Return the total number of nodes in the tree.',
  constraints: [
    '0 <= root.length <= 1000',
    '-100 <= root[i] <= 100',
    'root is a well-formed level-order encoding of a complete binary tree',
  ],
  cases: [
    { visible: true, root: [1, 2, 3, 4, 5, 6], expect: 6 },
    { visible: true, root: [], expect: 0 },
    { visible: true, root: [1], expect: 1 },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7], expect: 7 },
    { visible: false, root: [1, 2, 3, 4], expect: 4 },
    { visible: false, root: [1, 2], expect: 2 },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], expect: 11 },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], expect: 15 },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7, 8], expect: 8 },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], expect: 10 },
    { visible: false, root: [-1, -2, -3, -4, -5, -6, -7], expect: 7 },
  ],
  reference: `function countNodes(root) {
  const nodes = root.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let next = 1;
  for (let i = 0; i < nodes.length && next < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    n.left = nodes[next++] || null;
    if (next < nodes.length) n.right = nodes[next++] || null;
  }
  let count = 0;
  const stack = nodes[0] ? [nodes[0]] : [];
  while (stack.length) {
    const n = stack.pop();
    count++;
    if (n.left) stack.push(n.left);
    if (n.right) stack.push(n.right);
  }
  return count;
}`,
};

CONTENT['Binary Tree Level Order II'] = {
  signature: lang('levelOrderBottomUp', [['root', 'number[]']], 'number[][]'),
  description:
    'Given the root of a binary tree, return its node values grouped by level as a list of levels, '
    + 'but with the LOWEST level first and the root level last. Within each level the values run '
    + 'left to right. This is the bottom-up counterpart of the top-down level order problem. The '
    + 'tree is supplied as a level-order array of node values, where null marks a missing child.',
  input: 'The single parameter `root` is the level-order array of node values; [] for an empty tree.',
  output: 'Return a list of levels, bottom-up, each level a flat array of node values.',
  constraints: [
    '0 <= root.length <= 2000',
    '-200 <= root[i] <= 200',
    'root is a well-formed level-order encoding of a binary tree',
  ],
  cases: [
    { visible: true, root: [3, 9, 20, null, null, 15, 7], expect: [[15,7],[9,20],[3]] },
    { visible: true, root: [1], expect: [[1]] },
    { visible: true, root: [], expect: [] },
    { visible: false, root: [1, 2, 3], expect: [[2,3],[1]] },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7], expect: [[4,5,6,7],[2,3],[1]] },
    { visible: false, root: [1, 2, null, 3, 4], expect: [[3,4],[2],[1]] },
    { visible: false, root: [1, null, 2, 3], expect: [[3],[2],[1]] },
    { visible: false, root: [5, 3, 2, 1], expect: [[1],[3,2],[5]] },
    { visible: false, root: [1, 2, 3, 4, 5], expect: [[4,5],[2,3],[1]] },
    { visible: false, root: [-1, -2, -3, -4, -5, -6, -7], expect: [[-4,-5,-6,-7],[-2,-3],[-1]] },
    { visible: false, root: [1, 2, 3, 4, null, null, 7], expect: [[4,7],[2,3],[1]] },
  ],
  reference: `function levelOrderBottomUp(root) {
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
  return levels.reverse();
}`,
};

CONTENT['Sum Root to Leaf Numbers'] = {
  signature: lang('sumRootToLeafNumbers', [['root', 'number[]']], 'number'),
  description:
    'Given the root of a binary tree whose node values are single digits, every path from the ROOT '
    + 'down to a leaf forms a number: read the digits from the root down to the leaf and treat them '
    + 'as one decimal number. Return the sum of those numbers over all root-to-leaf paths. A leaf '
    + 'is a node with no children. The tree is supplied as a level-order array of node values, where '
    + 'null marks a missing child.',
  input: 'The single parameter `root` is the level-order array of node values; [] for an empty tree.',
  output: 'Return the sum of the numbers formed by every root-to-leaf path.',
  constraints: [
    '0 <= root.length <= 5000',
    'Every node value is a single digit, 0 <= root[i] <= 9',
    'root is a well-formed level-order encoding of a binary tree',
  ],
  cases: [
    { visible: true, root: [1, 2, 3], expect: 25 },
    { visible: true, root: [4, 9, 0, 5, 1], expect: 1026 },
    { visible: true, root: [], expect: 0 },
    { visible: false, root: [1], expect: 1 },
    { visible: false, root: [0], expect: 0 },
    { visible: false, root: [1, 0, 1], expect: 21 },
    { visible: false, root: [1, 2, 3, 4, 5], expect: 262 },
    { visible: false, root: [9, 9, 9, 9, 9], expect: 2097 },
    { visible: false, root: [1, 2, null, 3], expect: 123 },
    { visible: false, root: [2, 3, 4, 5, 6, 7, 8, 9], expect: 3090 },
    { visible: false, root: [1, null, 2, 3], expect: 123 },
  ],
  reference: `function sumRootToLeafNumbers(root) {
  const nodes = root.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let next = 1;
  for (let i = 0; i < nodes.length && next < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    n.left = nodes[next++] || null;
    if (next < nodes.length) n.right = nodes[next++] || null;
  }
  let total = 0;
  const walk = (n, acc) => {
    if (!n) return;
    const value = acc * 10 + n.val;
    if (!n.left && !n.right) { total += value; return; }
    walk(n.left, value);
    walk(n.right, value);
  };
  walk(nodes[0] || null, 0);
  return total;
}`,
};

// -------------------------------------------------------------------- Graphs
//
// Graphs are supplied as an ADJACENCY LIST: an array of arrays, where the node
// at index i is listed at index i and holds the indices of its neighbours.
// Self-loops and repeated edges are excluded by the constraints.

CONTENT['Max Area of Island'] = {
  signature: lang('maxAreaOfIsland', [['grid', 'number[][]']], 'number'),
  description:
    'Given a grid of 0s and 1s, return the area of the largest island. An island is a group of 1s '
    + 'connected horizontally or vertically (sharing an edge) - diagonal contact does NOT count. '
    + 'The area of an island is how many 1s it contains. Return 0 when the grid has no 1s.',
  input:
    'The single parameter `grid` is the grid as an array of rows, each row a flat array of 0s and '
    + '1s. All rows have the same length. An empty array is an empty grid.',
  output: 'Return the area of the largest island.',
  constraints: [
    '0 <= grid.length <= 300',
    '0 <= grid[i].length <= 300',
    'grid[i][j] is 0 or 1',
    'All rows have the same length',
  ],
  cases: [
    { visible: true, grid: [[0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0], [0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]], expect: 5 },
    { visible: true, grid: [[0, 0, 0, 0, 0, 0, 0, 0]], expect: 0 },
    { visible: true, grid: [[1]], expect: 1 },
    { visible: false, grid: [], expect: 0 },
    { visible: false, grid: [[1, 0]], expect: 1 },
    { visible: false, grid: [[1, 1, 1]], expect: 3 },
    { visible: false, grid: [[1], [0], [1]], expect: 1 },
    { visible: false, grid: [[1, 0, 1]], expect: 1 },
    { visible: false, grid: [[1, 1], [1, 1]], expect: 4 },
    { visible: false, grid: [[0, 1], [1, 0]], expect: 1 },
    { visible: false, grid: [[0, 0], [0, 0]], expect: 0 },
    { visible: false, grid: [[1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1]], expect: 3 },
    // Diagonal-only contact must NOT join two islands. Here the lower-left block
    // touches the upper strip only diagonally, so they stay separate.
    { visible: true, grid: [[0, 1, 0, 1], [1, 1, 1, 0], [1, 1, 1], [0, 0], [0, 1, 1, 1]], expect: 7 },
    { visible: true, grid: [[0, 0, 1, 1, 0], [0, 1, 0, 1]], expect: 3 },
  ],
  reference: `function maxAreaOfIsland(grid) {
  if (!grid || grid.length === 0 || grid[0].length === 0) return 0;
  const rows = grid.length;
  const cols = grid[0].length;
  const g = grid.map((r) => r.slice());
  const D = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let best = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (g[r][c] !== 1) continue;
      let area = 0;
      const stack = [[r, c]];
      g[r][c] = 0;
      while (stack.length) {
        const [y, x] = stack.pop();
        area++;
        for (const [dy, dx] of D) {
          const ny = y + dy;
          const nx = x + dx;
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
}`,
};

CONTENT['Pacific Atlantic Water Flow'] = {
  signature: lang('pacificAtlantic', [['heights', 'number[][]']], 'number[][]'),
  description:
    'Given a grid of heights, return the coordinates of every cell from which water can flow to '
    + 'BOTH the Pacific ocean and the Atlantic ocean. The Pacific is reached from any cell on the '
    + 'TOP row or the LEFT column; the Atlantic is reached from any cell on the BOTTOM row or the '
    + 'RIGHT column. Water flows from a cell to an orthogonally adjacent neighbour that is no lower '
    + 'than itself, and may continue outward from there. Return the qualifying cells as [row, col] '
    + 'pairs ordered by row and then column.',
  input:
    'The single parameter `heights` is the grid as an array of rows, each row a flat array of '
    + 'heights. All rows have the same length.',
  output: 'Return a list of [row, col] pairs, ordered by row then column.',
  constraints: [
    '1 <= heights.length <= 300',
    '1 <= heights[i].length <= 300',
    '0 <= heights[i][j] <= 1000',
    'All rows have the same length',
  ],
  cases: [
    { visible: true, heights: [[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 6, 1], [5, 1, 1, 2, 4]], expect: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[3,2],[4,0]] },
    { visible: true, heights: [[1]], expect: [[0,0]] },
    { visible: true, heights: [[1, 2, 3, 4], [5, 6, 7, 8]], expect: [[0,3],[1,0],[1,1],[1,2],[1,3]] },
    { visible: false, heights: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], expect: [[0,2],[1,2],[2,0],[2,1],[2,2]] },
    { visible: false, heights: [[3, 3, 3, 3], [3, 1, 2, 3], [3, 3, 3, 3]], expect: [[0,0],[0,1],[0,2],[0,3],[1,0],[1,3],[2,0],[2,1],[2,2],[2,3]] },
    { visible: false, heights: [[1, 1, 1], [1, 0, 1], [1, 1, 1]], expect: [[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2]] },
    { visible: false, heights: [[0, 0, 0, 0], [0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]], expect: [[0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3],[3,0],[3,1],[3,2],[3,3]] },
    { visible: false, heights: [[5, 5, 5, 5], [5, 1, 1, 1], [5, 1, 1, 5], [5, 1, 1, 5]], expect: [[0,0],[0,1],[0,2],[0,3],[1,0],[2,0],[3,0]] },
    { visible: false, heights: [[1, 2], [3, 4]], expect: [[0,1],[1,0],[1,1]] },
  ],
  reference: `function pacificAtlantic(heights) {
  if (!heights || heights.length === 0 || heights[0].length === 0) return [];
  const rows = heights.length;
  const cols = heights[0].length;
  const flow = (starts) => {
    const seen = new Set();
    const stack = [];
    const key = (r, c) => r * cols + c;
    for (const [r, c] of starts) {
      const k = key(r, c);
      if (!seen.has(k)) { seen.add(k); stack.push([r, c]); }
    }
    while (stack.length) {
      const [y, x] = stack.pop();
      const D = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dy, dx] of D) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny < 0 || ny >= rows || nx < 0 || nx >= cols) continue;
        const k = key(ny, nx);
        if (seen.has(k) || heights[ny][nx] < heights[y][x]) continue;
        seen.add(k);
        stack.push([ny, nx]);
      }
    }
    return seen;
  };
  const pacific = [];
  const atlantic = [];
  for (let c = 0; c < cols; c++) { pacific.push([0, c]); atlantic.push([rows - 1, c]); }
  for (let r = 0; r < rows; r++) { pacific.push([r, 0]); atlantic.push([r, cols - 1]); }
  const p = flow(pacific);
  const a = flow(atlantic);
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = r * cols + c;
      if (p.has(k) && a.has(k)) out.push([r, c]);
    }
  }
  return out;
}`,
};

CONTENT['Surrounded Regions'] = {
  signature: lang('captureRegions', [['board', 'string[][]']], 'string[][]'),
  description:
    'Given a grid of characters, capture every region made of X that is completely enclosed by O. A '
    + 'region is captured when it is connected to its neighbours horizontally or vertically and '
    + 'touches NO border of the grid; regions touching any border are safe and stay X. Captured X '
    + 'becomes O and every other cell is left exactly as it was.',
  input:
    'The single parameter `board` is the grid as an array of rows, each row a flat array of the '
    + 'characters "X" and "O".',
  output: 'Return the updated grid as an array of rows.',
  constraints: [
    '1 <= board.length <= 100',
    '1 <= board[i].length <= 100',
    'board[i][j] is "X" or "O"',
    'All rows have the same length',
  ],
  cases: [
    { visible: true, board: [['X', 'X', 'X', 'X'], ['X', 'O', 'O', 'X'], ['X', 'X', 'X', 'X']], expect: [["X","X","X","X"],["X","O","O","X"],["X","X","X","X"]] },
    { visible: true, board: [['X', 'X', 'X', 'X'], ['X', 'O', 'X', 'X'], ['X', 'X', 'X', 'X']], expect: [["X","X","X","X"],["X","O","X","X"],["X","X","X","X"]] },
    { visible: true, board: [['O', 'O', 'O', 'O'], ['O', 'O', 'O', 'O'], ['O', 'O', 'O', 'O']], expect: [["O","O","O","O"],["O","O","O","O"],["O","O","O","O"]] },
    { visible: false, board: [['X']], expect: [["X"]] },
    { visible: false, board: [['O']], expect: [["O"]] },
    { visible: false, board: [['X', 'X'], ['X', 'X']], expect: [["X","X"],["X","X"]] },
    { visible: false, board: [['X', 'O', 'X'], ['O', 'O', 'O'], ['X', 'O', 'X']], expect: [["X","O","X"],["O","O","O"],["X","O","X"]] },
    { visible: false, board: [['X', 'O', 'X', 'X'], ['O', 'O', 'X', 'X'], ['X', 'X', 'O', 'O'], ['X', 'X', 'O', 'X']], expect: [["X","O","X","X"],["O","O","X","X"],["X","X","O","O"],["X","X","O","X"]] },
    { visible: false, board: [['O', 'X', 'O'], ['X', 'O', 'X'], ['O', 'X', 'O']], expect: [["O","X","O"],["X","O","X"],["O","X","O"]] },
    // A region that touches ONLY the right or bottom border is SAFE, and must
    // survive. A solution that only protects the top and left borders captures
    // these and is wrong.
    { visible: true, board: [['O', 'X', 'O', 'O', 'O'], ['X'], ['X', 'X', 'O'], ['O', 'X', 'O', 'O'], ['X', 'O', 'X', 'O', 'X']], expect: [["O","X","O","O","O"],["X"],["X","X","O"],["O","X","O","O"],["X","O","X","O","X"]] },
    { visible: true, board: [['X', 'O', 'O', 'X', 'X'], ['O', 'O'], ['X'], ['O', 'X', 'O', 'O'], ['O', 'O', 'X', 'O']], expect: [["X","O","O","X","X"],["O","O"],["X"],["O","O","O","O"],["O","O","X","O"]] },
    { visible: false, board: [['X', 'O', 'O'], ['O', 'O', 'O'], ['O', 'O', 'X']], expect: [["X","O","O"],["O","O","O"],["O","O","X"]] },
  ],
  reference: `function captureRegions(board) {
  if (!board || board.length === 0 || board[0].length === 0) return board;
  const rows = board.length;
  const cols = board[0].length;
  const g = board.map((r) => r.slice());
  const D = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const safe = new Set();
  const stack = [];
  const push = (r, c) => {
    const k = r * cols + c;
    if (!safe.has(k) && g[r][c] === 'X') { safe.add(k); stack.push([r, c]); }
  };
  for (let c = 0; c < cols; c++) { push(0, c); push(rows - 1, c); }
  for (let r = 0; r < rows; r++) { push(r, 0); push(r, cols - 1); }
  while (stack.length) {
    const [y, x] = stack.pop();
    for (const [dy, dx] of D) {
      const ny = y + dy;
      const nx = x + dx;
      if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) push(ny, nx);
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (g[r][c] === 'X' && !safe.has(r * cols + c)) g[r][c] = 'O';
    }
  }
  return g;
}`,
};

CONTENT['Course Schedule II'] = {
  signature: lang('findOrder', [['numCourses', 'number'], ['prerequisites', 'number[][]']], 'number[]'),
  description:
    'There are numCourses numbered 0 to numCourses-1 that must be taken in order. Each entry '
    + '[a, b] in prerequisites means course a must be taken before course b. Return ONE ordering '
    + 'of all courses that respects every prerequisite, or an empty array when no such ordering '
    + 'exists (the dependencies contain a cycle). To make the answer unique, whenever several '
    + 'courses are available the smallest numbered one is always chosen next.',
  input:
    'The parameters are `numCourses` on the first line, then `prerequisites` on the second line as '
    + 'an array of [a, b] pairs.',
  output: 'Return a flat array of every course index in a valid order, or [] if none exists.',
  constraints: [
    '1 <= numCourses <= 1000',
    '0 <= prerequisites.length <= 10000',
    'Each prerequisite is [a, b] with 0 <= a, b < numCourses',
    'prerequisites[i] != prerequisites[j] for i != j',
  ],
  cases: [
    { visible: true, numCourses: 2, prerequisites: [[1, 0]], expect: [1,0] },
    { visible: true, numCourses: 4, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2]], expect: [3,1,2,0] },
    { visible: true, numCourses: 1, prerequisites: [], expect: [0] },
    { visible: false, numCourses: 2, prerequisites: [[0, 1], [1, 0]], expect: [] },
    { visible: false, numCourses: 5, prerequisites: [[1, 4], [2, 4], [3, 2], [3, 1]], expect: [0,3,1,2,4] },
    { visible: false, numCourses: 3, prerequisites: [[0, 1], [1, 2], [2, 0]], expect: [] },
    { visible: false, numCourses: 4, prerequisites: [[1, 0], [2, 1], [3, 2]], expect: [3,2,1,0] },
    { visible: false, numCourses: 3, prerequisites: [], expect: [0,1,2] },
    { visible: false, numCourses: 6, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2], [4, 3], [5, 4]], expect: [5,4,3,1,2,0] },
    // Two courses become available at once, so the SMALLEST must be taken
    // first. A solution that returns whatever the queue yields differs here.
    { visible: true, numCourses: 3, prerequisites: [[1, 0]], expect: [1,0,2] },
    { visible: true, numCourses: 4, prerequisites: [[1, 0], [1, 3]], expect: [1,0,2,3] },
    { visible: false, numCourses: 2, prerequisites: [[1, 0]], expect: [1,0] },
  ],
  reference: `function findOrder(numCourses, prerequisites) {
  const after = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) { after[a].push(b); indeg[b]++; }
  const ready = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) ready.push(i);
  ready.sort((x, y) => x - y);
  const out = [];
  while (ready.length) {
    ready.sort((x, y) => x - y);
    const course = ready.shift();
    out.push(course);
    for (const next of after[course]) {
      if (--indeg[next] === 0) ready.push(next);
    }
  }
  return out.length === numCourses ? out : [];
}`,
};

CONTENT['Number of Connected Components'] = {
  signature: lang('countComponents', [['n', 'number'], ['edges', 'number[][]']], 'number'),
  description:
    'Given an undirected graph with n nodes labelled 0 to n-1, return how many connected components '
    + 'it has. Two nodes are in the same component when a path of edges joins them, and a node with '
    + 'no edges is its own component. The graph is supplied as an edge list rather than an '
    + 'adjacency list: each entry is a pair [u, v] meaning u and v are adjacent.',
  input:
    'The parameters are `n` on the first line, then `edges` on the second line as an array of '
    + '[u, v] pairs.',
  output: 'Return the number of connected components.',
  constraints: [
    '1 <= n <= 2000',
    '0 <= edges.length <= n * (n - 1) / 2',
    'Each edge is [u, v] with 0 <= u, v < n',
    'No self-loops and no repeated edges',
  ],
  cases: [
    { visible: true, n: 5, edges: [[0, 1], [0, 2], [1, 3], [2, 3]], expect: 2 },
    { visible: true, n: 6, edges: [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5]], expect: 1 },
    { visible: true, n: 1, edges: [], expect: 1 },
    { visible: false, n: 3, edges: [], expect: 3 },
    { visible: false, n: 2, edges: [[0, 1]], expect: 1 },
    { visible: false, n: 4, edges: [[0, 1], [2, 3]], expect: 2 },
    { visible: false, n: 5, edges: [[0, 1], [1, 2], [2, 3], [3, 4]], expect: 1 },
    { visible: false, n: 4, edges: [[0, 1], [1, 2]], expect: 2 },
    { visible: false, n: 6, edges: [[0, 1], [1, 2], [3, 4]], expect: 3 },
    { visible: false, n: 4, edges: [[0, 1], [2, 3], [1, 2]], expect: 1 },
    { visible: false, n: 7, edges: [[0, 1], [2, 3], [4, 5]], expect: 4 },
  ],
  reference: `function countComponents(n, edges) {
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
  return roots.size;
}`,
};

CONTENT['Graph Valid Tree'] = {
  signature: lang('validTree', [['n', 'number'], ['edges', 'number[][]']], 'boolean'),
  description:
    'Decide whether an undirected graph with n nodes labelled 0 to n-1 is a valid tree. A graph is '
    + 'a valid tree exactly when it is CONNECTED - every node reachable from every other - and it '
    + 'has exactly n-1 edges. Neither condition alone is enough. The graph is supplied as an edge '
    + 'list: each entry is a pair [u, v] meaning u and v are adjacent.',
  input:
    'The parameters are `n` on the first line, then `edges` on the second line as an array of '
    + '[u, v] pairs.',
  output: 'Return true when the graph is a valid tree, otherwise false.',
  constraints: [
    '1 <= n <= 10',
    '0 <= edges.length <= 55',
    'Each edge is [u, v] with 0 <= u, v < n',
    'No self-loops and no repeated edges',
  ],
  cases: [
    { visible: true, n: 3, edges: [[0, 1], [1, 2]], expect: true },
    { visible: true, n: 3, edges: [[0, 1], [1, 2], [2, 0]], expect: false },
    { visible: true, n: 1, edges: [], expect: true },
    { visible: false, n: 3, edges: [[0, 1]], expect: false },
    { visible: false, n: 4, edges: [[0, 1], [1, 2], [0, 2]], expect: false },
    { visible: false, n: 4, edges: [[0, 1], [2, 3]], expect: false },
    { visible: false, n: 4, edges: [[0, 1], [1, 2], [2, 3]], expect: true },
    { visible: false, n: 2, edges: [], expect: false },
    { visible: false, n: 2, edges: [[0, 1]], expect: true },
    { visible: false, n: 5, edges: [[0, 1], [0, 2], [1, 2], [3, 4]], expect: false },
    { visible: false, n: 5, edges: [[0, 1], [1, 2], [2, 3], [3, 4]], expect: true },
    // Connected with exactly n-1 edges, so a valid tree even though the shape
    // is not a simple path. Edge count alone would also accept this, so the
    // contrasting cases below are what catch a connectivity check that is
    // missing or wrong.
    { visible: true, n: 4, edges: [[0, 1], [1, 3], [1, 2]], expect: true },
    { visible: true, n: 4, edges: [[0, 3], [0, 1], [1, 3]], expect: false },
    // A triangle plus an isolated node: n-1 edges but NOT connected.
    { visible: true, n: 4, edges: [[0, 1], [1, 2], [2, 0]], expect: false },
    { visible: true, n: 5, edges: [[0, 1], [0, 3], [1, 3]], expect: false },
  ],
  reference: `function validTree(n, edges) {
  if (edges.length !== n - 1) return false;
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const cur = stack.pop();
    for (const nb of adj[cur]) {
      if (!seen.has(nb)) { seen.add(nb); stack.push(nb); }
    }
  }
  return seen.size === n;
}`,
};

module.exports = { CONTENT };