'use strict';

/**
 * dsaBatch3Wrong.js
 * ---------------------------------------------------------------------------
 * Deliberately wrong solutions, one per batch-3 problem, used to prove the
 * judge still rejects bad work.
 *
 * These are NOT junk programs. Each is a plausible near-miss for its own
 * problem - an off-by-one, a missing edge case, a wrong recurrence, a swapped
 * operand - so if one were ACCEPTED the judging contract would be too weak to
 * catch the mistakes a learner actually makes.
 * ---------------------------------------------------------------------------
 */

const WRONG = {};

WRONG['Remove Duplicates from Sorted List II'] =
  // Classic mistake: keep ONE copy of each run instead of removing them all.
  `function deleteDuplicates(head) {
  const out = [];
  let i = 0;
  while (i < head.length) {
    let j = i;
    while (j + 1 < head.length && head[j + 1] === head[i]) j++;
    out.push(head[i]);
    i = j + 1;
  }
  return out;
}`;

WRONG['Sort List'] =
  // Descending instead of ascending.
  `function sortList(head) {
  return head.slice().sort((a, b) => b - a);
}`;

WRONG['LRU Cache'] =
  // FIFO: evicts the oldest INSERT rather than the least recently USED, so a
  // get never protects an entry from eviction.
  `function lruCache(capacity, operations) {
  const cache = new Map();
  const results = [];
  for (const op of operations) {
    const parts = op.split(' ');
    if (parts[0] === 'get') {
      results.push(cache.has(Number(parts[1])) ? cache.get(Number(parts[1])) : -1);
    } else {
      const key = Number(parts[1]);
      cache.set(key, Number(parts[2]));
      if (cache.size > capacity) cache.delete(cache.keys().next().value);
    }
  }
  return results;
}`;

WRONG['LFU Cache'] =
  // get() does not count as a use, so the frequency ranking is wrong. This is
  // the classic LFU bug: eviction then depends on insertion order, not uses.
  `function lfuCache(capacity, operations) {
  const values = new Map();
  const uses = new Map();
  const results = [];
  for (const op of operations) {
    const parts = op.split(' ');
    const key = Number(parts[1]);
    if (parts[0] === 'get') {
      if (!values.has(key)) { results.push(-1); continue; }
      results.push(values.get(key));
    } else {
      if (values.has(key)) uses.set(key, uses.get(key) + 1);
      else { values.set(key, Number(parts[2])); uses.set(key, 1); }
      if (values.size > capacity) {
        let victim = null;
        for (const k of values.keys()) {
          if (victim === null || uses.get(k) < uses.get(victim)) victim = k;
        }
        values.delete(victim);
        uses.delete(victim);
      }
    }
  }
  return results;
}`;

WRONG['Valid Parenthesis String'] =
  // Requires fully balanced parentheses, which wrongly rejects "()()".
  `function isValidParenthesisString(s) {
  let open = 0;
  for (const ch of s) {
    if (ch === '(') open++;
    else open--;
    if (open < 0) return false;
  }
  return open === 0;
}`;

WRONG['Simplify Path'] =
  // Treats "." as a real directory name instead of the current-directory
  // marker, so paths like /a/./b come out wrong.
  `function simplifyPath(path) {
  const out = [];
  for (const part of path.split('/')) {
    if (part === '') continue;
    if (part === '..') { out.pop(); continue; }
    out.push(part);
  }
  return '/' + out.join('/');
}`;

WRONG['Evaluate Reverse Polish Notation'] =
  // Ignores postfix ordering entirely and applies operators strictly
  // left-to-right, which coincides with the answer only by luck.
  `function evalRPN(tokens) {
  let acc = Number(tokens[0]);
  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];
    const v = Number(t);
    if (t === '+') acc += v;
    else if (t === '-') acc -= v;
    else if (t === '*') acc *= v;
    else acc = Math.trunc(acc / v);
  }
  return acc;
}`;

WRONG['Next Greater Element I'] =
  // Uses the smallest value ANYWHERE greater, not the first one to the RIGHT.
  `function nextGreaterElement(nums1, nums2) {
  return nums1.map((target) => {
    let best = -1;
    for (const v of nums2) if (v > target && (best < 0 || v < best)) best = v;
    return best;
  });
}`;

WRONG['Next Greater Element II'] =
  // Forgets the wrap-around, so it only searches to the end of the array.
  `function nextGreaterCircular(nums) {
  const n = nums.length;
  const out = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (nums[j] > nums[i]) { out[i] = nums[j]; break; }
    }
  }
  return out;
}`;

WRONG['Basic Calculator'] =
  // Ignores parentheses entirely and treats the expression as flat.
  `function calculate(s) {
  let result = 0;
  let sign = 1;
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === ' ') { i++; continue; }
    if (ch === '+') { sign = 1; i++; continue; }
    if (ch === '-') { sign = -1; i++; continue; }
    if (ch === '(' || ch === ')') { i++; continue; }
    let num = 0;
    while (i < s.length && s[i] >= '0' && s[i] <= '9') num = num * 10 + (s.charCodeAt(i++) - 48);
    result += sign * num;
  }
  return result;
}`;

WRONG['Basic Calculator II'] =
  // Evaluates strictly left to right, ignoring operator precedence.
  `function calculateII(s) {
  let cur = '';
  let sign = '+';
  let acc = null;
  const flush = () => {
    const v = Number(cur);
    cur = '';
    if (acc === null) acc = v;
    else if (sign === '+') acc += v;
    else acc -= v;
  };
  for (const ch of s) {
    if (ch === ' ') continue;
    if (ch >= '0' && ch <= '9') { cur += ch; continue; }
    if (cur !== '') flush();
    sign = ch;
  }
  if (cur !== '') flush();
  return acc;
}`;

WRONG['Largest Rectangle in Histogram'] =
  // Reports the best HEIGHT rather than the best AREA, ignoring width.
  `function largestRectangleArea(heights) {
  let best = 0;
  for (let i = 0; i < heights.length; i++) {
    let low = Infinity;
    for (let j = i; j < heights.length; j++) {
      if (heights[j] < low) low = heights[j];
      if (low > best) best = low;
    }
  }
  return best;
}`;

WRONG['Maximal Rectangle'] =
  // Finds the widest run of 1s per row but never stacks rows vertically.
  `function maximalRectangle(matrix) {
  if (!matrix || matrix.length === 0 || matrix[0].length === 0) return 0;
  let best = 0;
  for (const row of matrix) {
    let run = 0;
    for (const cell of row) {
      if (cell === 1) { run++; if (run > best) best = run; }
      else run = 0;
    }
  }
  return best;
}`;

WRONG['Online Stock Span'] =
  // Counts strictly lower prices, so an equal price breaks the span early.
  `function stockSpans(prices) {
  const spans = [];
  for (let i = 0; i < prices.length; i++) {
    let span = 1;
    let j = i - 1;
    while (j >= 0 && prices[j] < prices[i]) { span++; j--; }
    spans.push(span);
  }
  return spans;
}`;

WRONG['Binary Tree Postorder Traversal'] =
  // Visits the root before the subtrees, which is preorder.
  `function postorderTraversal(root) {
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
}`;

WRONG['Balanced Binary Tree'] =
  // Only inspects the ROOT's two subtrees, so a violation deeper down is missed.
  `function isBalanced(root) {
  const nodes = root.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let next = 1;
  for (let i = 0; i < nodes.length && next < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    n.left = nodes[next++] || null;
    if (next < nodes.length) n.right = nodes[next++] || null;
  }
  const height = (n) => {
    if (!n) return 0;
    return 1 + Math.max(height(n.left), height(n.right));
  };
  const r = nodes[0] || null;
  if (!r) return true;
  return Math.abs(height(r.left) - height(r.right)) <= 1;
}`;

WRONG['Diameter of Binary Tree'] =
  // Counts NODES on the longest path instead of edges, an off-by-one.
  `function diameterOfBinaryTree(root) {
  const nodes = root.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let next = 1;
  for (let i = 0; i < nodes.length && next < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    n.left = nodes[next++] || null;
    if (next < nodes.length) n.right = nodes[next++] || null;
  }
  let best = 0;
  const depth = (n) => {
    if (!n) return 0;
    const l = depth(n.left);
    const r = depth(n.right);
    if (l + r > best) best = l + r;
    return 1 + Math.max(l, r);
  };
  depth(nodes[0] || null);
  return nodes.length === 0 ? 0 : best + 1;
}`;

module.exports = { WRONG };