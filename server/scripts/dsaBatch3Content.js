'use strict';

/**
 * dsaBatch3Content.js
 * ---------------------------------------------------------------------------
 * Authored content for the 17 batch-3 problems whose contract is fixed by
 * their title.
 *
 * `cases` are the single source of truth for expected output: every expected
 * value is COMPUTED by running `reference`, never typed by hand, so the
 * statement, the fixtures and the judge cannot disagree. Where an answer is
 * easy to get subtly wrong, the case also carries an `expect` value that is
 * asserted directly against the reference, so a reference that is wrong in the
 * same way the renderer is wrong still fails.
 *
 * Representations follow the conventions the active catalogue already uses:
 * linked lists are flat arrays of node values, binary trees are level-order
 * arrays with null for missing children.
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

// ------------------------------------------------------------- Linked list

CONTENT['Remove Duplicates from Sorted List II'] = {
  signature: lang('deleteDuplicates', [['head', 'number[]']], 'number[]'),
  description:
    'Given the values of a sorted linked list, return the values of the list with every node removed '
    + 'that had a duplicate anywhere in the list. Only values that occur exactly once survive, still '
    + 'in ascending order. A value appearing three times is removed entirely, not reduced to one copy.',
  input: 'The single parameter `head` is the list given as a flat array of node values in order.',
  output: 'Return a flat array of the surviving node values in order.',
  constraints: [
    'The list is sorted in ascending order',
    '0 <= head.length <= 300',
    '-100 <= head[i] <= 100',
  ],
  cases: [
    { visible: true, head: [1, 2, 3, 3, 4, 4, 5] },
    { visible: true, head: [1, 1, 1, 2, 3] },
    { visible: true, head: [1, 1] },
    { visible: true, head: [1, 2, 2] },
    { visible: false, head: [] },
    { visible: false, head: [0] },
    { visible: false, head: [1, 2, 3] },
    { visible: false, head: [1, 1, 2] },
    { visible: false, head: [2, 2, 2, 3, 3, 4] },
    { visible: false, head: [-5, -5, -4, -4, -4, 0, 7] },
    { visible: false, head: [1, 1, 1, 1] },
    { visible: false, head: [1, 2, 2, 3, 3, 3, 4, 4, 5] },
    { visible: false, head: [5, 5, 5, 5, 6] },
  ],
  reference: `function deleteDuplicates(head) {
  const counts = new Map();
  for (const v of head) counts.set(v, (counts.get(v) || 0) + 1);
  return head.filter((v) => counts.get(v) === 1);
}`,
};

CONTENT['Sort List'] = {
  signature: lang('sortList', [['head', 'number[]']], 'number[]'),
  description:
    'Given the values of a linked list, return the values in ascending order. The result is again a '
    + 'flat array of the same values, sorted. The array is already in list order.',
  input: 'The single parameter `head` is the list given as a flat array of node values in order.',
  output: 'Return a flat array of the same values sorted in ascending order.',
  constraints: [
    '0 <= head.length <= 5000',
    '-100000 <= head[i] <= 100000',
  ],
  cases: [
    { visible: true, head: [4, 2, 1, 3] },
    { visible: true, head: [-1, 5, 3, 4, 0] },
    { visible: true, head: [1] },
    { visible: true, head: [2, 1] },
    { visible: false, head: [] },
    { visible: false, head: [3, 3, 3] },
    { visible: false, head: [5, 4, 3, 2, 1] },
    { visible: false, head: [0, 0, 0, -1, -1, 7, -9, 9] },
    { visible: false, head: [-10, -1, 0, 1, 10] },
    { visible: false, head: [7, 7, 2, 2, 9] },
    { visible: false, head: [1, 2, 3, 4, 5] },
  ],
  reference: `function sortList(head) {
  return head.slice().sort((a, b) => a - b);
}`,
};

// ------------------------------------------------------------------ Design

CONTENT['LRU Cache'] = {
  signature: lang('lruCache', [['capacity', 'number'], ['operations', 'string[]']], 'number[]'),
  description:
    'Model a cache holding at most `capacity` entries. Apply the operations in order. "get K" returns '
    + 'the value stored under key K, or -1 when the key is absent, and marks that entry as the most '
    + 'recently used. "put K V" stores value V under key K, overwriting any previous value, and marks '
    + 'that entry as the most recently used. When a put would exceed the capacity, the least recently '
    + 'used entry is discarded first. Return the result of every get, in order; puts return nothing.',
  input:
    'The parameters are `capacity` on the first line, then `operations`, a flat array whose elements '
    + 'are either "get K" or "put K V" as single strings.',
  output: 'Return a flat array holding the result of each get operation, in order.',
  constraints: [
    '1 <= capacity <= 1000',
    '1 <= operations.length <= 1000',
    'Keys and values are non-negative integers below 10000',
  ],
  cases: [
    { visible: true, capacity: 2, operations: ['put 1 1', 'put 2 2', 'get 1', 'put 3 3', 'get 2'] },
    { visible: true, capacity: 1, operations: ['put 2 1', 'get 2', 'put 3 2', 'get 2', 'get 3'] },
    { visible: true, capacity: 2, operations: ['get 1', 'put 1 1', 'get 1'] },
    { visible: false, capacity: 3, operations: ['put 1 1', 'put 2 2', 'put 3 3', 'get 1', 'put 4 4', 'get 3'] },
    { visible: false, capacity: 1, operations: ['put 1 1', 'put 1 2', 'get 1'] },
    { visible: false, capacity: 2, operations: ['put 1 1', 'put 2 2', 'get 2', 'get 1'] },
    { visible: false, capacity: 2, operations: ['put 5 5', 'put 6 6', 'put 5 7', 'get 5'] },
    { visible: false, capacity: 4, operations: ['get 9', 'put 9 9', 'get 9', 'put 9 10', 'get 9'] },
    // A get must refresh recency: key 2 was inserted first but key 1 is the
    // more recently used entry, so key 2 is the one evicted.
    { visible: false, capacity: 2, operations: ['put 1 1', 'put 2 2', 'get 1', 'put 3 3', 'get 1', 'get 2'] },
    { visible: false, capacity: 2, operations: ['put 1 1', 'put 2 2', 'get 2', 'put 3 3', 'get 1', 'get 2'] },
    { visible: false, capacity: 3, operations: ['put 1 1', 'put 2 2', 'put 3 3', 'get 3', 'get 2', 'put 4 4', 'get 1', 'get 3'] },
  ],
  reference: `function lruCache(capacity, operations) {
  const cache = new Map();
  const results = [];
  for (const op of operations) {
    const parts = op.split(' ');
    if (parts[0] === 'get') {
      const key = Number(parts[1]);
      if (!cache.has(key)) { results.push(-1); continue; }
      const value = cache.get(key);
      cache.delete(key);
      cache.set(key, value);
      results.push(value);
    } else {
      const key = Number(parts[1]);
      cache.delete(key);
      cache.set(key, Number(parts[2]));
      if (cache.size > capacity) cache.delete(cache.keys().next().value);
    }
  }
  return results;
}`,
};

CONTENT['LFU Cache'] = {
  signature: lang('lfuCache', [['capacity', 'number'], ['operations', 'string[]']], 'number[]'),
  description:
    'Model a cache holding at most `capacity` entries, evicting the least frequently used one. Apply '
    + 'the operations in order. "get K" returns the value stored under key K, or -1 when the key is '
    + 'absent, and counts as one use of that entry. "put K V" stores value V under key K, overwriting '
    + 'any previous value, and counts as one use of that entry. Putting an existing key does not reset '
    + 'its use count. When a put would exceed the capacity, evict the entry with the fewest uses; if '
    + 'several tie, evict the least recently used of those. Return the result of every get, in order.',
  input:
    'The parameters are `capacity` on the first line, then `operations`, a flat array whose elements '
    + 'are either "get K" or "put K V" as single strings.',
  output: 'Return a flat array holding the result of each get operation, in order.',
  constraints: [
    '1 <= capacity <= 1000',
    '1 <= operations.length <= 1000',
    'Keys and values are non-negative integers below 10000',
  ],
  cases: [
    { visible: true, capacity: 2, operations: ['put 1 1', 'put 2 2', 'get 1', 'put 3 3', 'get 2'] },
    { visible: true, capacity: 2, operations: ['put 1 1', 'put 2 2', 'get 1', 'get 1', 'put 3 3', 'get 2'] },
    { visible: true, capacity: 1, operations: ['put 1 1', 'get 1', 'get 1', 'put 2 2', 'get 1'] },
    { visible: false, capacity: 3, operations: ['put 1 1', 'get 1', 'put 2 2', 'get 2', 'get 1', 'put 3 3', 'put 4 4', 'get 1'] },
    { visible: false, capacity: 2, operations: ['put 1 1', 'put 2 2', 'put 1 3', 'get 1', 'put 3 4', 'get 2'] },
    { visible: false, capacity: 1, operations: ['put 1 1', 'put 1 2', 'get 1', 'put 2 3', 'get 1'] },
    { visible: false, capacity: 5, operations: ['get 7'] },
    { visible: false, capacity: 2, operations: ['put 10 1', 'put 20 2', 'get 10', 'get 20', 'put 10 5', 'put 30 3', 'get 20', 'get 30'] },
    // Frequency tie: keys 1 and 2 both have one use, so the least RECENTLY used
    // one must be evicted. A tie-break-free LFU picks the wrong victim here.
    { visible: false, capacity: 2, operations: ['put 1 1', 'put 2 2', 'put 3 3', 'get 1', 'get 2'] },
    { visible: false, capacity: 3, operations: ['put 1 1', 'put 2 2', 'get 2', 'put 3 3', 'get 2', 'put 4 4', 'get 1'] },
    { visible: false, capacity: 2, operations: ['put 1 1', 'get 1', 'put 2 2', 'put 3 3', 'get 1'] },
    // "get" must count as a use: key 3 is used twice, so key 2 (used once) is
    // evicted instead. A cache that ignores gets on put evicts the wrong key.
    { visible: false, capacity: 2, operations: ['put 2 1', 'put 3 2', 'get 3', 'get 3', 'put 3 3', 'get 2'] },
    { visible: false, capacity: 3, operations: ['put 1 1', 'put 2 2', 'put 3 3', 'get 1', 'get 1', 'put 4 4', 'get 2'] },
  ],
  reference: `function lfuCache(capacity, operations) {
  const values = new Map();
  const uses = new Map();
  const clock = new Map();
  const results = [];
  let tick = 0;
  for (const op of operations) {
    const parts = op.split(' ');
    const key = Number(parts[1]);
    if (parts[0] === 'get') {
      if (!values.has(key)) { results.push(-1); continue; }
      uses.set(key, uses.get(key) + 1);
      clock.set(key, ++tick);
      results.push(values.get(key));
    } else {
      if (values.has(key)) uses.set(key, uses.get(key) + 1);
      else { values.set(key, Number(parts[2])); uses.set(key, 1); }
      clock.set(key, ++tick);
      if (values.size > capacity) {
        let victim = null;
        for (const k of values.keys()) {
          if (victim === null
            || uses.get(k) < uses.get(victim)
            || (uses.get(k) === uses.get(victim) && clock.get(k) < clock.get(victim))) {
            victim = k;
          }
        }
        values.delete(victim);
        uses.delete(victim);
        clock.delete(victim);
      }
    }
  }
  return results;
}`,
};

// ------------------------------------------------------------------- Stack

CONTENT['Valid Parenthesis String'] = {
  signature: lang('isValidParenthesisString', [['s', 'string']], 'boolean'),
  description:
    'Given a string made only of "(" and ")", decide whether it can be written as a concatenation of '
    + 'valid bracket groups, where a valid group is "(" followed by a balanced sequence and then ")". '
    + 'Under this rule the brackets never have to be balanced across groups, so "()()" is valid even '
    + 'though reading it as one balanced string it is not. Equivalently: the string is valid exactly '
    + 'when no ")" appears with no "(" still open before it.',
  input: 'The single parameter `s` is the string of brackets.',
  output: 'Return true when s can be split into valid bracket groups, otherwise false.',
  constraints: [
    '1 <= s.length <= 3000',
    's consists only of the characters ( and )',
  ],
  cases: [
    { visible: true, s: '()()', expect: true },
    { visible: true, s: '(())', expect: true },
    { visible: true, s: ')(', expect: false },
    { visible: true, s: '()(()', expect: true },
    // A stray ")" with no "(" open before it invalidates the whole string.
    { visible: true, s: '())(()', expect: false },
    { visible: false, s: ')', expect: false },
    { visible: false, s: '((((((()))))', expect: true },
    { visible: false, s: '()((()))((()))', expect: true },
    { visible: false, s: '(()()())(())(()(()))', expect: true },
    { visible: false, s: '(((())))(()', expect: true },
    { visible: false, s: '((((((((((()))))))))', expect: true },
  ],
  reference: `function isValidParenthesisString(s) {
  let open = 0;
  for (const ch of s) {
    if (ch === '(') open++;
    else if (open === 0) return false;
    else open--;
  }
  return true;
}`,
};

CONTENT['Simplify Path'] = {
  signature: lang('simplifyPath', [['path', 'string']], 'string'),
  description:
    'Given an absolute Unix-style path, return its canonical form. Repeated separators collapse to one. '
    + 'A "." component refers to the current directory and is dropped. A ".." component moves up one '
    + 'directory, and is dropped when there is no directory left to move up from. The result always '
    + 'starts with "/" and never ends with one unless it is exactly "/".',
  input: 'The single parameter `path` is the absolute path.',
  output: 'Return the canonical path as a string.',
  constraints: [
    '1 <= path.length <= 3000',
    'path is an absolute path beginning with /',
    'path contains only letters, digits, ".", "_" and the separator /',
  ],
  cases: [
    { visible: true, path: '/home/', expect: '/home' },
    { visible: true, path: '/../', expect: '/' },
    { visible: true, path: '/home//foo/', expect: '/home/foo' },
    { visible: true, path: '/a/./b/../../c/', expect: '/c' },
    { visible: false, path: '/', expect: '/' },
    { visible: false, path: '/...', expect: '/...' },
    { visible: false, path: '/a//b////c////d//////e', expect: '/a/b/c/d/e' },
    { visible: false, path: '/a/../../b/../c//.//', expect: '/c' },
    { visible: false, path: '/./././././', expect: '/' },
    { visible: false, path: '/a/b/c/../../../../d', expect: '/d' },
    { visible: false, path: '/foo/bar/./baz', expect: '/foo/bar/baz' },
    { visible: false, path: '/..././', expect: '/...' },
    { visible: false, path: '/a/b/../../..//c//', expect: '/c' },
    // ".." past the root must clamp rather than emit a literal ".." segment.
    { visible: false, path: '/../../a', expect: '/a' },
    { visible: false, path: '/a/../../..', expect: '/' },
    { visible: false, path: '/x/y/../../../z', expect: '/z' },
    // "." is the current directory and must be dropped, not kept as a name.
    { visible: false, path: '/./b/../b/', expect: '/b' },
    { visible: false, path: '/a/./b/./c', expect: '/a/b/c' },
  ],
  reference: `function simplifyPath(path) {
  const out = [];
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') { if (out.length) out.pop(); continue; }
    out.push(part);
  }
  return '/' + out.join('/');
}`,
};

CONTENT['Evaluate Reverse Polish Notation'] = {
  signature: lang('evalRPN', [['tokens', 'string[]']], 'number'),
  description:
    'Given an arithmetic expression in reverse Polish (postfix) notation, where each operator follows '
    + 'its two operands, evaluate it. The supported operators are +, -, * and /. Division truncates '
    + 'toward zero, so -7/2 is -3 and 7/-2 is -3. Operands are integers written as plain digits.',
  input: 'The single parameter `tokens` is the postfix expression as a flat array of string tokens.',
  output: 'Return the integer result of the expression.',
  constraints: [
    '1 <= tokens.length <= 150',
    'tokens are either an operator or an integer that fits in 32 bits',
    'The expression is valid: it is well-formed postfix and never divides by zero',
  ],
  cases: [
    { visible: true, tokens: ['2', '1', '+', '3', '*'], expect: 9 },
    { visible: true, tokens: ['4', '13', '5', '/', '+'], expect: 6 },
    { visible: true, tokens: ['10', '6', '9', '3', '+', '-11', '*', '/', '*', '17', '+', '5', '+'], expect: 22 },
    { visible: true, tokens: ['3', '-4', '/'], expect: 0 },
    { visible: false, tokens: ['7'], expect: 7 },
    { visible: false, tokens: ['-7'], expect: -7 },
    { visible: false, tokens: ['5', '2', '-'], expect: 3 },
    { visible: false, tokens: ['5', '2', '*'], expect: 10 },
    { visible: false, tokens: ['-7', '2', '/'], expect: -3 },
    { visible: false, tokens: ['7', '-2', '/'], expect: -3 },
    { visible: false, tokens: ['7', '2', '/'], expect: 3 },
    { visible: false, tokens: ['1', '2', '+', '3', '*'], expect: 9 },
    { visible: false, tokens: ['0', '0', '-'], expect: 0 },
    { visible: false, tokens: ['15', '3', '/'], expect: 5 },
    { visible: false, tokens: ['2', '1', '-', '2', '*'], expect: 2 },
    // Postfix ordering: operators bind to the two values immediately before them,
    // so this is NOT the same as evaluating left to right.
    { visible: false, tokens: ['5', '9', '-', '4', '*'], expect: -16 },
    { visible: false, tokens: ['-5', '-9', '-5', '+', '+'], expect: -19 },
    { visible: false, tokens: ['2', '9', '-'], expect: -7 },
  ],
  reference: `function evalRPN(tokens) {
  const stack = [];
  for (const t of tokens) {
    if (t === '+' || t === '-' || t === '*' || t === '/') {
      const b = stack.pop();
      const a = stack.pop();
      if (t === '+') stack.push(a + b);
      else if (t === '-') stack.push(a - b);
      else if (t === '*') stack.push(a * b);
      else stack.push(Math.trunc(a / b));
    } else {
      stack.push(Number(t));
    }
  }
  return stack[stack.length - 1];
}`,
};

CONTENT['Next Greater Element I'] = {
  signature: lang('nextGreaterElement', [['nums1', 'number[]'], ['nums2', 'number[]']], 'number[]'),
  description:
    'Given two arrays of distinct integers, for each value of the first array return the first value '
    + 'strictly greater than it that appears to its right in the second array, scanning the second '
    + 'array left to right. When no such value exists, return -1 for that position. The answer has one '
    + 'entry per element of the first array, in the same order.',
  input:
    'The parameters are `nums1` on the first line and `nums2` on the second line, each a flat array.',
  output: 'Return a flat array of the next greater values, in the order of nums1.',
  constraints: [
    '1 <= nums1.length <= 1000',
    '1 <= nums2.length <= 1000',
    'All values lie between -1000 and 1000',
    'Every value of nums1 also appears in nums2',
    'Both arrays contain no duplicates',
  ],
  cases: [
    { visible: true, nums1: [4, 1, 2], nums2: [1, 3, 4, 2] },
    { visible: true, nums1: [2, 4], nums2: [1, 2, 3, 4] },
    { visible: true, nums1: [3, 9, 8], nums2: [4, 5, 2, 3, 8, 4, 10] },
    { visible: false, nums1: [1], nums2: [1] },
    { visible: false, nums1: [1], nums2: [2] },
    { visible: false, nums1: [2], nums2: [1] },
    { visible: false, nums1: [5, 1, 2, 3, 4], nums2: [6, 5, 4, 3, 2, 1] },
    { visible: false, nums1: [1, 7, 5], nums2: [2, 6, 7] },
    { visible: false, nums1: [4, 5, 6], nums2: [9, 8, 4, 5, 6, 7] },
    { visible: false, nums1: [0, -1, -2], nums2: [-3, -2, -1, 0, 1] },
    { visible: false, nums1: [3, 1, 2], nums2: [1, 2, 3, 4] },
    { visible: false, nums1: [8, 5], nums2: [9, 8, 5, 4] },
    { visible: false, nums1: [2, 3, 1], nums2: [3, 1, 2] },
  ],
  reference: `function nextGreaterElement(nums1, nums2) {
  const out = [];
  for (const target of nums1) {
    let found = -1;
    for (const v of nums2) {
      if (v > target) { found = v; break; }
    }
    out.push(found);
  }
  return out;
}`,
};

CONTENT['Next Greater Element II'] = {
  signature: lang('nextGreaterCircular', [['nums', 'number[]']], 'number[]'),
  description:
    'Given an array of numbers treated as circular - the element after the last one wraps around to '
    + 'the first - return, for each position, the value of the first strictly greater number found as '
    + 'you move forward around the circle from that position. Return -1 for a position when no greater '
    + 'value exists anywhere on the circle.',
  input: 'The single parameter `nums` is the circular array as a flat array.',
  output: 'Return a flat array of the next greater values, one per position of nums.',
  constraints: [
    '1 <= nums.length <= 100',
    '0 <= nums[i] <= 100',
    'nums contains no duplicates',
  ],
  cases: [
    { visible: true, nums: [1, 2, 1], expect: [2, -1, 2] },
    { visible: true, nums: [1, 2, 3, 4, 3], expect: [2, 3, 4, -1, 4] },
    { visible: true, nums: [5, 4, 3, 2, 1], expect: [-1, 5, 5, 5, 5] },
    { visible: false, nums: [1], expect: [-1] },
    { visible: false, nums: [1, 3], expect: [3, -1] },
    { visible: false, nums: [2, 1], expect: [-1, 2] },
    { visible: false, nums: [1, 2, 3], expect: [2, 3, -1] },
    { visible: false, nums: [3, 2, 1], expect: [-1, 3, 3] },
    { visible: false, nums: [4, 5, 6, 7], expect: [5, 6, 7, -1] },
    { visible: false, nums: [7, 6, 5], expect: [-1, 7, 7] },
    { visible: false, nums: [1, 7, 5, 1], expect: [7, -1, 7, 7] },
    { visible: false, nums: [2, 3, 1, 2], expect: [3, -1, 2, 3] },
  ],
  reference: `function nextGreaterCircular(nums) {
  const n = nums.length;
  const out = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    for (let step = 1; step < n; step++) {
      const j = (i + step) % n;
      if (nums[j] > nums[i]) { out[i] = nums[j]; break; }
    }
  }
  return out;
}`,
};

CONTENT['Basic Calculator'] = {
  signature: lang('calculate', [['s', 'string']], 'number'),
  description:
    'Given an arithmetic expression containing only the operators + and -, parentheses, and spaces, '
    + 'evaluate it. Parentheses group sub-expressions. Addition and subtraction share one precedence '
    + 'level and are evaluated left to right, so "1-2+3" is 2. There is no multiplication or '
    + 'division. A minus sign is binary except when it is the very first non-space character of the '
    + 'whole expression, which makes the expression negative; it may not appear immediately after '
    + 'another operator or after "(". Spaces may appear anywhere and are ignored.',
  input: 'The single parameter `s` is the expression string.',
  output: 'Return the integer value of the expression.',
  constraints: [
    '1 <= s.length <= 5000',
    's contains only digits, +, -, (, ) and spaces',
    's is a well-formed expression with balanced parentheses',
  ],
  cases: [
    { visible: true, s: '1 + 1', expect: 2 },
    { visible: true, s: ' 2-1 + 2 ', expect: 3 },
    { visible: true, s: '(1+(4+5+2)-3)+(6+8)', expect: 23 },
    { visible: true, s: '-2+ 1', expect: -1 },
    { visible: true, s: '2-(5-6)', expect: 3 },
    { visible: false, s: '1', expect: 1 },
    { visible: false, s: '2147483647', expect: 2147483647 },
    { visible: false, s: '1-1', expect: 0 },
    { visible: false, s: '1-(2-3)', expect: 2 },
    { visible: false, s: '10-(3+7)', expect: 0 },
    { visible: false, s: '-(3+4)', expect: -7 },
    { visible: false, s: '((1))', expect: 1 },
    { visible: false, s: '3-(2-(1-(4-2)))', expect: 0 },
    { visible: false, s: '1+2+3+4+5-6-7', expect: 2 },
    { visible: false, s: '100-50+25-25', expect: 50 },
    { visible: false, s: '0-0', expect: 0 },
  ],
  reference: `function calculate(s) {
  const stack = [];
  let result = 0;
  let sign = 1;
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === ' ') { i++; continue; }
    if (ch === '+') { sign = 1; i++; continue; }
    if (ch === '-') { sign = -1; i++; continue; }
    if (ch === '(') { stack.push(result); stack.push(sign); result = 0; sign = 1; i++; continue; }
    if (ch === ')') { const outerSign = stack.pop(); const outer = stack.pop(); result = outer + outerSign * result; sign = 1; i++; continue; }
    let num = 0;
    while (i < s.length && s[i] >= '0' && s[i] <= '9') { num = num * 10 + (s.charCodeAt(i) - 48); i++; }
    result += sign * num;
  }
  return result;
}`,
};

CONTENT['Basic Calculator II'] = {
  signature: lang('calculateII', [['s', 'string']], 'number'),
  description:
    'Given an arithmetic expression containing +, -, * and / with the usual precedence - * and / bind '
    + 'tighter than + and - - but no parentheses, evaluate it. All arithmetic is integer arithmetic and '
    + 'division truncates toward zero, so 14/3 is 4 and 3/4 is 0. Spaces may appear anywhere and are '
    + 'ignored. There is no unary minus: a minus sign is always binary.',
  input: 'The single parameter `s` is the expression string.',
  output: 'Return the integer value of the expression.',
  constraints: [
    '1 <= s.length <= 5000',
    's contains only digits, +, -, *, / and spaces',
    's is a well-formed expression that never divides by zero',
  ],
  cases: [
    { visible: true, s: '3+2*2', expect: 7 },
    { visible: true, s: ' 3/2 ', expect: 1 },
    { visible: true, s: ' 3+5 / 2 ', expect: 5 },
    { visible: true, s: '14-3/2', expect: 13 },
    { visible: false, s: '0', expect: 0 },
    { visible: false, s: '1', expect: 1 },
    { visible: false, s: '2*3', expect: 6 },
    { visible: false, s: '2/3', expect: 0 },
    { visible: false, s: '3/4', expect: 0 },
    { visible: false, s: '5*2-3*2', expect: 4 },
    { visible: false, s: '1+2*3+4*5', expect: 27 },
    { visible: false, s: '7-3*2+8/2', expect: 5 },
    { visible: false, s: '100/5/5', expect: 4 },
    { visible: false, s: '2*3+4*5-6/2', expect: 23 },
    { visible: false, s: '42', expect: 42 },
    { visible: false, s: '1*2*3*4*5', expect: 120 },
  ],
  reference: `function calculateII(s) {
  const nums = [];
  const ops = [];
  let current = '';
  let sign = '+';
  const flush = () => {
    const v = Number(current);
    current = '';
    if (sign === '+') nums.push(v);
    else if (sign === '-') nums.push(-v);
    else if (sign === '*') nums[nums.length - 1] *= v;
    else nums[nums.length - 1] = Math.trunc(nums[nums.length - 1] / v);
  };
  for (const ch of s) {
    if (ch === ' ') continue;
    if (ch >= '0' && ch <= '9') { current += ch; continue; }
    flush();
    sign = ch;
  }
  if (current !== '') flush();
  let total = 0;
  for (const v of nums) total += v;
  return total;
}`,
};

CONTENT['Largest Rectangle in Histogram'] = {
  signature: lang('largestRectangleArea', [['heights', 'number[]']], 'number'),
  description:
    'Given the heights of a bar chart, return the area of the largest axis-aligned rectangle that fits '
    + 'under the bars and has sides parallel to the axes. The rectangle must span a contiguous run of '
    + 'bars and its height cannot exceed the shortest bar in that run.',
  input: 'The single parameter `heights` is the bar heights as a flat array.',
  output: 'Return the largest rectangle area.',
  constraints: [
    '0 <= heights.length <= 100000',
    '0 <= heights[i] <= 10000',
  ],
  cases: [
    { visible: true, heights: [2, 1, 5, 6, 2, 3], expect: 10 },
    { visible: true, heights: [2, 4], expect: 4 },
    { visible: true, heights: [1, 2, 3, 4, 5], expect: 9 },
    { visible: false, heights: [], expect: 0 },
    { visible: false, heights: [0], expect: 0 },
    { visible: false, heights: [5], expect: 5 },
    { visible: false, heights: [1, 1, 1, 1], expect: 4 },
    { visible: false, heights: [0, 0, 0], expect: 0 },
    { visible: false, heights: [3, 3, 3, 3, 3], expect: 15 },
    { visible: false, heights: [0, 2, 0, 2, 0], expect: 2 },
    { visible: false, heights: [1, 2, 3, 4, 5, 6, 7, 8], expect: 20 },
    { visible: false, heights: [8, 1, 8, 1, 8], expect: 8 },
    { visible: false, heights: [2, 1, 2, 3, 4, 1], expect: 6 },
    { visible: false, heights: [5, 4, 3, 2, 1], expect: 9 },
    { visible: false, heights: [1, 3, 2, 5, 6, 4], expect: 12 },
    { visible: false, heights: [7, 2, 5, 10, 1, 6], expect: 10 },
  ],
  reference: `function largestRectangleArea(heights) {
  const n = heights.length;
  let best = 0;
  for (let i = 0; i < n; i++) {
    let low = heights[i];
    for (let j = i; j < n; j++) {
      if (heights[j] < low) low = heights[j];
      const area = low * (j - i + 1);
      if (area > best) best = area;
    }
  }
  return best;
}`,
};

CONTENT['Maximal Rectangle'] = {
  signature: lang('maximalRectangle', [['matrix', 'number[][]']], 'number'),
  description:
    'Given a rectangular matrix filled with 0s and 1s, return the area of the largest rectangle that '
    + 'contains only 1s. The rectangle must consist of contiguous rows and contiguous columns.',
  input:
    'The single parameter `matrix` is the grid given as an array of rows, each row a flat array of 0s '
    + 'and 1s of equal length. An empty array is an empty grid.',
  output: 'Return the area of the largest all-1s rectangle.',
  constraints: [
    '0 <= matrix.length <= 200',
    '0 <= matrix[i].length <= 200',
    'matrix[i][j] is 0 or 1',
    'All rows have the same length',
  ],
  cases: [
    { visible: true, matrix: [[1, 0, 1, 0, 0], [1, 0, 1, 1, 1], [1, 1, 1, 1, 1], [1, 0, 0, 1, 0]], expect: 6 },
    { visible: true, matrix: [[0, 1, 1, 1, 0], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 0, 0, 1, 0]], expect: 15 },
    { visible: true, matrix: [[1]], expect: 1 },
    // Rows must STACK: the largest rectangle here is 2 wide by 3 tall, which a
    // solution that only looks for horizontal runs inside one row misses.
    { visible: true, matrix: [[1, 1], [1, 1]], expect: 4 },
    { visible: false, matrix: [], expect: 0 },
    { visible: false, matrix: [[0]], expect: 0 },
    { visible: false, matrix: [[0, 0], [0, 0]], expect: 0 },
    { visible: false, matrix: [[1, 1, 1]], expect: 3 },
    { visible: false, matrix: [[1], [1], [1]], expect: 3 },
    { visible: false, matrix: [[1, 0], [0, 1]], expect: 1 },
    { visible: false, matrix: [[1, 1], [1, 1], [1, 1]], expect: 6 },
    { visible: false, matrix: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], expect: 3 },
    { visible: false, matrix: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0]], expect: 1 },
    { visible: false, matrix: [[1, 1, 0, 1], [1, 1, 0, 1], [0, 0, 1, 1]], expect: 4 },
    { visible: false, matrix: [[1, 1, 1, 1]], expect: 4 },
    // A tall narrow block: area comes from height, not from any single row width.
    { visible: false, matrix: [[1], [1], [1], [1]], expect: 4 },
    { visible: false, matrix: [[1, 1, 1], [1, 1, 1]], expect: 6 },
  ],
  reference: `function maximalRectangle(matrix) {
  if (!matrix || matrix.length === 0 || matrix[0].length === 0) return 0;
  const cols = matrix[0].length;
  const heights = new Array(cols).fill(0);
  let best = 0;
  for (const row of matrix) {
    for (let c = 0; c < cols; c++) heights[c] = row[c] === 1 ? heights[c] + 1 : 0;
    for (let i = 0; i < cols; i++) {
      let low = heights[i];
      for (let j = i; j < cols; j++) {
        if (heights[j] < low) low = heights[j];
        const area = low * (j - i + 1);
        if (area > best) best = area;
      }
    }
  }
  return best;
}`,
};

CONTENT['Online Stock Span'] = {
  signature: lang('stockSpans', [['prices', 'number[]']], 'number[]'),
  description:
    'Given the price of a stock on each of several consecutive days, return the span for each day: the '
    + 'number of consecutive days ending on that day for which the price is less than or equal to the '
    + 'price on that day, counting the day itself. Equivalently, count back from each day while prices '
    + 'stay at or below it, stopping at the first day whose price was strictly higher.',
  input: 'The single parameter `prices` is the price on each day, oldest first.',
  output: 'Return a flat array of spans, one per day, in the order of prices.',
  constraints: [
    '0 <= prices.length <= 1000',
    '0 <= prices[i] <= 10000',
  ],
  cases: [
    { visible: true, prices: [100, 80, 60, 70, 60, 75, 85], expect: [1, 1, 1, 2, 1, 4, 6] },
    { visible: true, prices: [85], expect: [1] },
    { visible: true, prices: [88, 88], expect: [1, 2] },
    { visible: false, prices: [], expect: [] },
    { visible: false, prices: [1, 1, 1, 1], expect: [1, 2, 3, 4] },
    { visible: false, prices: [1, 2, 3, 4, 5], expect: [1, 2, 3, 4, 5] },
    { visible: false, prices: [5, 4, 3, 2, 1], expect: [1, 1, 1, 1, 1] },
    { visible: false, prices: [5, 1, 2, 3, 4], expect: [1, 1, 2, 3, 4] },
    { visible: false, prices: [10, 6, 6, 6, 6], expect: [1, 1, 2, 3, 4] },
    { visible: false, prices: [2, 3, 1], expect: [1, 2, 1] },
    { visible: false, prices: [1, 2, 3, 1, 1], expect: [1, 2, 3, 1, 2] },
    { visible: false, prices: [7, 7, 7, 8, 7], expect: [1, 2, 3, 4, 1] },
    { visible: false, prices: [0, 0], expect: [1, 2] },
  ],
  reference: `function stockSpans(prices) {
  const spans = [];
  for (let i = 0; i < prices.length; i++) {
    let span = 1;
    let j = i - 1;
    while (j >= 0 && prices[j] <= prices[i]) { span++; j--; }
    spans.push(span);
  }
  return spans;
}`,
};

// -------------------------------------------------------------------- Tree
//
// Trees arrive as a level-order array of node values in which null marks a
// missing child, the representation the active tree problems already use.
// A tree with no root is the empty array.

CONTENT['Binary Tree Postorder Traversal'] = {
  signature: lang('postorderTraversal', [['root', 'number[]']], 'number[]'),
  description:
    'Given the root of a binary tree, return the node values in postorder: every node of the left '
    + 'subtree first, then every node of the right subtree, then the node itself. The tree is supplied '
    + 'as a level-order array of node values, where null marks a missing child.',
  input: 'The single parameter `root` is the level-order array of node values; [] for an empty tree.',
  output: 'Return a flat array of the node values in postorder.',
  constraints: [
    '0 <= root.length <= 1000',
    '-100 <= root[i] <= 100',
    'root is a well-formed level-order encoding of a binary tree',
  ],
  cases: [
    { visible: true, root: [1, null, 2, 3], expect: [3, 2, 1] },
    { visible: true, root: [1, 2, 3, 4, 5], expect: [4, 5, 2, 3, 1] },
    { visible: true, root: [], expect: [] },
    { visible: false, root: [1], expect: [1] },
    { visible: false, root: [1, 2, 3], expect: [2, 3, 1] },
    { visible: false, root: [1, null, 2, 3], expect: [3, 2, 1] },
    { visible: false, root: [1, 2, null, 3, 4], expect: [3, 4, 2, 1] },
    { visible: false, root: [5, 3, 2, 1], expect: [1, 3, 2, 5] },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7], expect: [4, 5, 2, 6, 7, 3, 1] },
    { visible: false, root: [-1, null, -2, null, 3], expect: [3, -2, -1] },
    { visible: false, root: [1, null, 2], expect: [2, 1] },
    { visible: false, root: [1, 2, null, null, 3, 4], expect: [4, 3, 2, 1] },
  ],
  reference: `function postorderTraversal(root) {
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
    walk(n.right);
    out.push(n.val);
  };
  walk(nodes[0] || null);
  return out;
}`,
};

CONTENT['Balanced Binary Tree'] = {
  signature: lang('isBalanced', [['root', 'number[]']], 'boolean'),
  description:
    'Given the root of a binary tree, decide whether it is height-balanced: at every node, the heights '
    + 'of the left and right subtrees differ by at most one. A tree with no root is balanced. The tree '
    + 'is supplied as a level-order array of node values, where null marks a missing child.',
  input: 'The single parameter `root` is the level-order array of node values; [] for an empty tree.',
  output: 'Return true when the tree is height-balanced, otherwise false.',
  constraints: [
    '0 <= root.length <= 5000',
    '-1000 <= root[i] <= 1000',
    'root is a well-formed level-order encoding of a binary tree',
  ],
  cases: [
    { visible: true, root: [3, 9, 20, null, null, 15, 7], expect: true },
    { visible: true, root: [1, 2, 2, 3, 3, null, null, 4, 4], expect: false },
    { visible: true, root: [], expect: true },
    // The root's own two subtrees are balanced, but a node deeper down is not,
    // so a solution that checks only the root gets this wrong.
    { visible: true, root: [8, 7, 5, null, 7, 2, 6, 4, null, null, 6, null, 7], expect: false },
    { visible: false, root: [1], expect: true },
    { visible: false, root: [1, 2], expect: true },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7], expect: true },
    { visible: false, root: [1, 2, 3, 4, 5, null, null, 8, 9, 10, 11], expect: false },
    { visible: false, root: [1, null, 2, null, 3], expect: false },
    { visible: false, root: [1, 2, null, 3], expect: false },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], expect: true },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7, 8, null, null, null, null, null, null, 9], expect: true },
    { visible: false, root: [0, 1, 0], expect: true },
    // The root's own subtrees are balanced here, but node 8 is not: every node
    // must be checked, not just the root.
    { visible: false, root: [6, 1, 5, 8, null, 5, 2, 6, 6, 7, 3, 8, 4], expect: false },
  ],
  reference: `function isBalanced(root) {
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
    const l = height(n.left);
    if (l < 0) return -1;
    const r = height(n.right);
    if (r < 0) return -1;
    if (Math.abs(l - r) > 1) return -1;
    return 1 + Math.max(l, r);
  };
  return height(nodes[0] || null) !== -1;
}`,
};

CONTENT['Diameter of Binary Tree'] = {
  signature: lang('diameterOfBinaryTree', [['root', 'number[]']], 'number'),
  description:
    'Given the root of a binary tree, return the diameter: the length of the longest path between any '
    + 'two nodes, measured in edges. The path is not required to start or end at the root, and a path '
    + 'consisting of a single node has length 0. A tree with no root has diameter 0. The tree is '
    + 'supplied as a level-order array of node values, where null marks a missing child.',
  input: 'The single parameter `root` is the level-order array of node values; [] for an empty tree.',
  output: 'Return the diameter in edges.',
  constraints: [
    '0 <= root.length <= 4000',
    '-10000 <= root[i] <= 10000',
    'root is a well-formed level-order encoding of a binary tree',
  ],
  cases: [
    { visible: true, root: [1, 2, 3, 4, 5], expect: 3 },
    { visible: true, root: [1, 2], expect: 1 },
    { visible: true, root: [], expect: 0 },
    { visible: false, root: [1], expect: 0 },
    { visible: false, root: [1, null, 2], expect: 1 },
    { visible: false, root: [1, null, 2, null, 3, null, 4], expect: 3 },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7], expect: 4 },
    { visible: false, root: [1, 2, 3, null, null, 4, 5], expect: 3 },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], expect: 5 },
    { visible: false, root: [1, 2, 3, 4, null, null, 7, 8, 9, 10, 11], expect: 6 },
    { visible: false, root: [5, 4, 3, null, null, 2, null, null], expect: 3 },
    { visible: false, root: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], expect: 6 },
  ],
  reference: `function diameterOfBinaryTree(root) {
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
  return best;
}`,
};

module.exports = { CONTENT };