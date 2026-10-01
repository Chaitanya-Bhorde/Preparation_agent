'use strict';

/**
 * dsaBatch1Content.js
 * ---------------------------------------------------------------------------
 * Authored content for the 13 batch-1 problems whose contract is fixed by
 * their title.
 *
 * For each: an original problem statement, input/output contract, constraints,
 * a JavaScript reference implementation, and the exact visible/hidden cases.
 * `cases` are the single source of truth for expected output: every expected
 * value stored in samples/hidden is COMPUTED by running `reference`, never
 * typed by hand, so statement, fixtures and judge cannot drift apart.
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

// ---------------------------------------------------------------- Arrays
CONTENT['Spiral Matrix'] = {
  signature: lang('spiralOrder', [['matrix', 'number[][]']], 'number[]'),
  description:
    'Given an m x n matrix of integers, return all of its elements in clockwise spiral order, '
    + 'starting from the top-left corner and moving right. When the outer ring is exhausted, '
    + 'continue with the next inner ring. Return the values as a single flat array.',
  input: 'The first parameter `matrix` is the grid, given as an array of rows.',
  output: 'Return one flat array holding every element in clockwise spiral order.',
  constraints: [
    'matrix is non-empty',
    'matrix has at most 100 rows and at most 100 columns',
    'Every value is between -100 and 100',
  ],
  cases: [
    { visible: true, matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
    { visible: true, matrix: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]] },
    { visible: true, matrix: [[1], [2], [3]] },
    { visible: true, matrix: [[1, 2]] },
    { visible: false, matrix: [[7]] },
    { visible: false, matrix: [[1, 2], [3, 4]] },
    { visible: false, matrix: [[1, 2, 3], [4, 5, 6]] },
    { visible: false, matrix: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15]] },
    { visible: false, matrix: [[-1, -2], [-3, -4]] },
    { visible: false, matrix: [[1, 2, 3, 4], [8, 7, 6, 5], [9, 10, 11, 12], [16, 15, 14, 13]] },
  ],
  reference: `function spiralOrder(matrix) {
  const out = [];
  if (!matrix || matrix.length === 0) return out;
  let top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(matrix[top][c]);
    top++;
    for (let r = top; r <= bottom; r++) out.push(matrix[r][right]);
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) out.push(matrix[bottom][c]);
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) out.push(matrix[r][left]);
      left++;
    }
  }
  return out;
}`,
};

CONTENT['Subarray Sum Equals K'] = {
  signature: lang('subarraySum', [['nums', 'number[]'], ['k', 'number']], 'number'),
  description:
    'Given an array of integers `nums` and an integer `k`, return the total number of contiguous '
    + 'non-empty subarrays whose elements sum to exactly `k`. Subarrays at different positions '
    + 'are counted separately even when they contain the same values.',
  input: 'The first parameter `nums` is the array. The second parameter `k` is the target sum.',
  output: 'Return the count of contiguous subarrays summing to `k` as a number.',
  constraints: [
    '1 <= nums.length <= 2 * 10^4',
    '-1000 <= nums[i] <= 1000',
    '-10^7 <= k <= 10^7',
  ],
  cases: [
    { visible: true, nums: [1, 1, 1], k: 2 },
    { visible: true, nums: [1, 2, 3], k: 3 },
    { visible: true, nums: [3, 4, 7, 2, -3, 1, 4, 2], k: 5 },
    { visible: true, nums: [1], k: 1 },
    { visible: false, nums: [1], k: 2 },
    { visible: false, nums: [0, 0, 0], k: 0 },
    { visible: false, nums: [1, -1, 0], k: 0 },
    { visible: false, nums: [-1, -1, 1], k: 0 },
    { visible: false, nums: [3], k: 3 },
    { visible: false, nums: [1, 2, 1, 2], k: 3 },
    { visible: false, nums: Array.from({ length: 200 }, (_, i) => (i % 5) - 2), k: 0 },
    { visible: false, nums: Array.from({ length: 500 }, (_, i) => i % 7), k: 6 },
  ],
  reference: `function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]);
  let total = 0, prefix = 0;
  for (const n of nums) {
    prefix += n;
    total += seen.get(prefix - k) || 0;
    seen.set(prefix, (seen.get(prefix) || 0) + 1);
  }
  return total;
}`,
};

CONTENT['3Sum Closest'] = {
  signature: lang('threeSumClosest', [['nums', 'number[]'], ['target', 'number']], 'number'),
  description:
    'Given an array of integers `nums` and an integer `target`, return the sum of the three '
    + 'integers whose total is closest to `target`. Each input element may be used at most once, '
    + 'so the three chosen elements must come from three distinct indices. Return the sum '
    + 'itself, not the chosen triple.',
  input: 'The first parameter `nums` is the array. The second parameter `target` is the value to approach.',
  output: 'Return the sum of the three chosen integers, which minimises the distance to `target`.',
  constraints: [
    '3 <= nums.length <= 1000',
    '-1000 <= nums[i] <= 1000',
    '-10^4 <= target <= 10^4',
  ],
  cases: [
    { visible: true, nums: [-1, 2, 1, -4], target: 1 },
    { visible: true, nums: [0, 0, 0], target: 1 },
    { visible: true, nums: [1, 1, 1, 0], target: -100 },
    { visible: true, nums: [4, 0, 5, -5, 3, 3, 0, -4, -5], target: -2 },
    { visible: false, nums: [0, 2, 1, -3], target: 1 },
    { visible: false, nums: [1, 2, 4, 8], target: 10 },
    { visible: false, nums: [-5, -4, -3, -2, -1], target: -10 },
    { visible: false, nums: [1, 1, 1], target: 100 },
    { visible: false, nums: [0, 0, 0, 0], target: 0 },
    { visible: false, nums: [10, 20, 30, 40, 50], target: 25 },
    { visible: false, nums: [-1000, 1000, 0, 999], target: 0 },
  ],
  reference: `function threeSumClosest(nums, target) {
  const a = nums.slice().sort((x, y) => x - y);
  let best = a[0] + a[1] + a[2];
  for (let i = 0; i < a.length - 2; i++) {
    let l = i + 1, r = a.length - 1;
    while (l < r) {
      const sum = a[i] + a[l] + a[r];
      if (Math.abs(sum - target) < Math.abs(best - target)) best = sum;
      if (sum === target) return sum;
      if (sum < target) l++; else r--;
    }
  }
  return best;
}`,
};

CONTENT['Sliding Window Maximum'] = {
  signature: lang('maxSlidingWindow', [['nums', 'number[]'], ['k', 'number']], 'number[]'),
  description:
    'Given an array of integers `nums` and a window size `k`, return an array holding the maximum '
    + 'value of every contiguous window of length `k`, in left-to-right order. A window may only '
    + 'contain elements lying within `k` positions of each other.',
  input: 'The first parameter `nums` is the array. The second parameter `k` is the window length.',
  output: 'Return an array with one maximum per window, of length nums.length - k + 1.',
  constraints: [
    '1 <= k <= nums.length',
    '1 <= nums.length <= 10^5',
    '-10^4 <= nums[i] <= 10^4',
  ],
  cases: [
    { visible: true, nums: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 },
    { visible: true, nums: [1], k: 1 },
    { visible: true, nums: [9, 11], k: 2 },
    { visible: true, nums: [4, -2], k: 2 },
    { visible: false, nums: [7, 2, 4], k: 2 },
    { visible: false, nums: [1, -1], k: 1 },
    { visible: false, nums: [5, 5, 5, 5], k: 3 },
    { visible: false, nums: [1, 2, 3, 4, 5, 6, 7, 8], k: 4 },
    { visible: false, nums: [0, -1, -2, -3, -4], k: 3 },
    { visible: false, nums: [3, 3, 3, 3], k: 1 },
    { visible: false, nums: [2, 1, 4, 3], k: 4 },
  ],
  reference: `function maxSlidingWindow(nums, k) {
  const out = [];
  const deque = [];
  for (let i = 0; i < nums.length; i++) {
    while (deque.length && deque[0] <= i - k) deque.shift();
    while (deque.length && nums[deque[deque.length - 1]] <= nums[i]) deque.pop();
    deque.push(i);
    if (i >= k - 1) out.push(nums[deque[0]]);
  }
  return out;
}`,
};

CONTENT['Maximum Gap'] = {
  signature: lang('maximumGap', [['nums', 'number[]']], 'number'),
  description:
    'Given an array of distinct integers `nums`, sort them in ascending order and return the '
    + 'largest difference between any two adjacent values in that sorted order. Only the gap '
    + 'between consecutive sorted values counts, not the difference between any arbitrary pair.',
  input: 'The only parameter `nums` is the array of distinct integers.',
  output: 'Return the largest gap between adjacent values after sorting, as a number.',
  constraints: [
    '0 <= nums.length <= 10^5',
    '-10^9 <= nums[i] <= 10^9',
    'All values in nums are distinct',
  ],
  cases: [
    { visible: true, nums: [3, 6, 9, 1] },
    { visible: true, nums: [10] },
    { visible: true, nums: [1, 1, 1, 1] },
    { visible: true, nums: [1, 10000000] },
    { visible: false, nums: [5, 1, 9, 3] },
    { visible: false, nums: [1, 2] },
    { visible: false, nums: [2, 1] },
    { visible: false, nums: [0, 3, 6, 9, 12] },
    { visible: false, nums: [-5, -1, 0, 4] },
    { visible: false, nums: [100, 50, 20, 5] },
    { visible: false, nums: [-1000000000, 1000000000] },
    { visible: false, nums: [4, 8, 1, 7, 11] },
  ],
  reference: `function maximumGap(nums) {
  if (nums.length < 2) return 0;
  const a = nums.slice().sort((x, y) => x - y);
  let best = 0;
  for (let i = 1; i < a.length; i++) {
    const d = a[i] - a[i - 1];
    if (d > best) best = d;
  }
  return best;
}`,
};

CONTENT['Palindromic Substrings'] = {
  signature: lang('countPalindromes', [['s', 'string']], 'number'),
  description:
    'Given a string `s`, return the number of contiguous substrings of `s` that are palindromes. '
    + 'Occurrences at different positions are counted separately, so a palindrome occurring twice '
    + 'counts twice, and a run of identical characters contributes substrings of every length.',
  input: 'The only parameter `s` is the string to examine.',
  output: 'Return the total number of palindromic substrings as a number.',
  constraints: [
    '1 <= s.length <= 1000',
    's consists of lowercase English letters',
  ],
  cases: [
    { visible: true, s: 'abc' },
    { visible: true, s: 'aaa' },
    { visible: true, s: 'aba' },
    { visible: true, s: 'a' },
    { visible: false, s: 'abba' },
    { visible: false, s: 'racecar' },
    { visible: false, s: 'abcd' },
    { visible: false, s: 'aa' },
    { visible: false, s: 'abcdefg' },
    { visible: false, s: 'ababab' },
    { visible: false, s: 'aabbcc' },
    { visible: false, s: 'z'.repeat(60) },
  ],
  reference: `function countPalindromes(s) {
  let total = 0;
  const expand = (l, r) => {
    while (l >= 0 && r < s.length && s[l] === s[r]) { total++; l--; r++; }
  };
  for (let i = 0; i < s.length; i++) { expand(i, i); expand(i, i + 1); }
  return total;
}`,
};

CONTENT['Longest Happy Prefix'] = {
  signature: lang('longestPrefixSuffix', [['s', 'string']], 'number'),
  description:
    'Given a string `s`, return the length of its longest proper prefix that is also a suffix. '
    + 'The whole string never counts as its own prefix here, so the answer is always strictly '
    + 'shorter than `s`. When no non-empty prefix is also a suffix, return 0.',
  input: 'The only parameter `s` is the string to examine.',
  output: 'Return the length of the longest proper prefix that is also a suffix, as a number.',
  constraints: [
    '1 <= s.length <= 10^5',
    's consists of lowercase English letters',
  ],
  cases: [
    { visible: true, s: 'ababc' },
    { visible: true, s: 'abcd' },
    { visible: true, s: 'a' },
    { visible: true, s: 'aaaaa' },
    { visible: false, s: 'abab' },
    { visible: false, s: 'abcab' },
    { visible: false, s: 'zz' },
    { visible: false, s: 'abcdefabcdef' },
    { visible: false, s: 'xyxyx' },
    { visible: false, s: 'aaaaaaaaaaaaab' },
    { visible: false, s: 'baaaaa' },
  ],
  reference: `function longestPrefixSuffix(s) {
  const fail = new Array(s.length).fill(0);
  for (let i = 1; i < s.length; i++) {
    let j = fail[i - 1];
    while (j > 0 && s[i] !== s[j]) j = fail[j - 1];
    if (s[i] === s[j]) j++;
    fail[i] = j;
  }
  return s.length ? fail[s.length - 1] : 0;
}`,
};

CONTENT['Repeated Substring Pattern'] = {
  signature: lang('repeatedSubstringPattern', [['s', 'string']], 'boolean'),
  description:
    'Given a string `s`, decide whether it can be built by taking a shorter string and repeating '
    + 'it a whole number of times, where the last repetition may be cut short. For example "abab" '
    + 'repeats "ab" and qualifies, while "aba" does not. The repeated unit must be strictly '
    + 'shorter than `s`.',
  input: 'The only parameter `s` is the string to examine.',
  output: 'Return true when s is made by repeating a shorter string, otherwise false.',
  constraints: [
    '1 <= s.length <= 10^5',
    's consists of lowercase English letters',
  ],
  cases: [
    { visible: true, s: 'abab' },
    { visible: true, s: 'aba' },
    { visible: true, s: 'aababaa' },
    { visible: true, s: 'a' },
    { visible: false, s: 'aaaa' },
    { visible: false, s: 'abcabcabc' },
    { visible: false, s: 'abcd' },
    { visible: false, s: 'aa' },
    { visible: false, s: 'abcab' },
    { visible: false, s: 'xyxyxy' },
    { visible: false, s: 'abababab' },
    { visible: false, s: 'aabaaab' },
  ],
  reference: `function repeatedSubstringPattern(s) {
  const n = s.length;
  const fail = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    let j = fail[i - 1];
    while (j > 0 && s[i] !== s[j]) j = fail[j - 1];
    if (s[i] === s[j]) j++;
    fail[i] = j;
  }
  const longest = n ? fail[n - 1] : 0;
  return longest > 0 && n % (n - longest) === 0;
}`,
};

CONTENT['Find First Unique Character'] = {
  signature: lang('firstUniqueChar', [['s', 'string']], 'number'),
  description:
    'Given a string `s`, return the index of the first character that occurs exactly once in the '
    + 'whole string. When every character occurs more than once, return -1. The index is '
    + 'zero-based, and among characters occurring once the leftmost one is returned.',
  input: 'The only parameter `s` is the string to examine.',
  output: 'Return the zero-based index of the first unique character, or -1 if none exists.',
  constraints: [
    '1 <= s.length <= 10^5',
    's consists of lowercase English letters',
  ],
  cases: [
    { visible: true, s: 'leetcode' },
    { visible: true, s: 'loveleetcode' },
    { visible: true, s: 'aabb' },
    { visible: true, s: 'z' },
    { visible: false, s: 'a' },
    { visible: false, s: 'ab' },
    { visible: false, s: 'aa' },
    { visible: false, s: 'abcabc' },
    { visible: false, s: 'xbcbb' },
    { visible: false, s: 'aadadaad' },
    { visible: false, s: 'message' },
    { visible: false, s: 'mom' },
  ],
  reference: `function firstUniqueChar(s) {
  const count = new Map();
  for (const ch of s) count.set(ch, (count.get(ch) || 0) + 1);
  for (let i = 0; i < s.length; i++) {
    if (count.get(s[i]) === 1) return i;
  }
  return -1;
}`,
};

CONTENT['House Robber II'] = {
  signature: lang('rob', [['nums', 'number[]']], 'number'),
  description:
    'Given a circular array `nums` of amounts, choose positions such that no two chosen '
    + 'positions are adjacent, treating the first and last positions as adjacent too. Return the '
    + 'largest total that can be collected. An empty array collects nothing.',
  input: 'The only parameter `nums` is the circular array of amounts.',
  output: 'Return the maximum total collectable as a number.',
  constraints: [
    '1 <= nums.length <= 10^5',
    '0 <= nums[i] <= 10^5',
  ],
  cases: [
    { visible: true, nums: [2, 3, 2] },
    { visible: true, nums: [1, 2, 3, 1] },
    { visible: true, nums: [1] },
    { visible: true, nums: [0] },
    { visible: false, nums: [1, 2] },
    { visible: false, nums: [200, 3, 140, 20, 10] },
    { visible: false, nums: [5] },
    { visible: false, nums: [1, 2, 1] },
    { visible: false, nums: [10, 1, 1, 10] },
    { visible: false, nums: [0, 0, 0] },
    { visible: false, nums: [7, 4, 6, 9] },
  ],
  reference: `function rob(nums) {
  if (!nums || nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];
  const take = (range) => {
    let prev2 = 0, prev1 = 0;
    for (const n of range) {
      const best = Math.max(prev1, prev2 + n);
      prev2 = prev1;
      prev1 = best;
    }
    return prev1;
  };
  return Math.max(take(nums.slice(0, -1)), take(nums.slice(1)));
}`,
};

CONTENT['Unique Paths II'] = {
  signature: lang('uniquePathsWithObstacles', [['grid', 'number[][]']], 'number'),
  description:
    'Given a rectangular grid where each cell is either 0 (open) or 1 (blocked), count the '
    + 'distinct paths a robot can take from the top-left cell to the bottom-right cell. The robot '
    + 'may only move right or down and may never step onto a blocked cell. Return 0 when no path '
    + 'exists.',
  input: 'The only parameter `grid` is the array of rows, each row an array of 0 or 1 cells.',
  output: 'Return the number of valid paths as a number.',
  constraints: [
    '0 <= grid.length <= 50',
    '0 <= grid[i].length <= 50',
    'Every cell is either 0 or 1',
  ],
  cases: [
    { visible: true, grid: [[0, 0, 0], [0, 1, 0], [0, 0, 0]] },
    { visible: true, grid: [[0, 1], [0, 0]] },
    { visible: true, grid: [[1]] },
    { visible: true, grid: [[0]] },
    { visible: false, grid: [[0, 0], [0, 1]] },
    { visible: false, grid: [[0, 0], [0, 0]] },
    { visible: false, grid: [[0, 0, 0], [0, 0, 0]] },
    { visible: false, grid: [[0, 1, 0], [1, 0, 0]] },
    { visible: false, grid: [[0, 0, 0], [1, 1, 1], [0, 0, 0]] },
    { visible: false, grid: [[0], [0]] },
  ],
  reference: `function uniquePathsWithObstacles(grid) {
  if (!grid || grid.length === 0 || !grid[0] || grid[0].length === 0) return 0;
  const m = grid.length, n = grid[0].length;
  const dp = new Array(n).fill(0);
  dp[0] = 1;
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === 1) dp[c] = 0;
      else if (c > 0) dp[c] += dp[c - 1];
    }
  }
  return dp[n - 1];
}`,
};

CONTENT['Longest Common Subsequence'] = {
  signature: lang('longestCommonSubsequence', [['text1', 'string'], ['text2', 'string']], 'number'),
  description:
    'Given two strings `text1` and `text2`, return the length of their longest common '
    + 'subsequence: the longest sequence of characters appearing in both strings in the same '
    + 'order, though not necessarily contiguously. Characters may be skipped in either string.',
  input: 'The first parameter is `text1`; the second parameter is `text2`.',
  output: 'Return the length of the longest common subsequence as a number.',
  constraints: [
    '1 <= text1.length <= 1000',
    '1 <= text2.length <= 1000',
    'Both strings consist of lowercase English letters',
  ],
  cases: [
    { visible: true, text1: 'abcde', text2: 'ace' },
    { visible: true, text1: 'abc', text2: 'abc' },
    { visible: true, text1: 'abc', text2: 'def' },
    { visible: true, text1: 'a', text2: 'a' },
    { visible: false, text1: 'abc', text2: 'abcd' },
    { visible: false, text1: 'abcd', text2: 'abc' },
    { visible: false, text1: 'aa', text2: 'ab' },
    { visible: false, text1: 'bsbininm', text2: 'jmjkbkjkv' },
    { visible: false, text1: 'oxcpqrsvwf', text2: 'shmtulqrypy' },
    { visible: false, text1: 'aaa', text2: 'aa' },
    { visible: false, text1: 'abcdefgh', text2: 'acegi' },
  ],
  reference: `function longestCommonSubsequence(text1, text2) {
  let prev = new Array(text2.length + 1).fill(0);
  for (let i = 1; i <= text1.length; i++) {
    const cur = new Array(text2.length + 1).fill(0);
    for (let j = 1; j <= text2.length; j++) {
      cur[j] = text1[i - 1] === text2[j - 1]
        ? prev[j - 1] + 1
        : Math.max(prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[text2.length];
}`,
};

CONTENT['Partition Equal Subset Sum'] = {
  signature: lang('canPartition', [['nums', 'number[]']], 'boolean'),
  description:
    'Given an array of integers `nums`, decide whether it can be split into two disjoint subsets '
    + 'whose sums are equal. Every element belongs to exactly one of the two subsets.',
  input: 'The only parameter `nums` is the array to partition.',
  output: 'Return true when such an equal-sum partition exists, otherwise false.',
  constraints: [
    '1 <= nums.length <= 200',
    '0 <= nums[i] <= 100',
  ],
  cases: [
    { visible: true, nums: [1, 5, 11, 5] },
    { visible: true, nums: [1, 2, 3, 5] },
    { visible: true, nums: [1] },
    { visible: true, nums: [0] },
    { visible: false, nums: [1, 2, 5] },
    { visible: false, nums: [2, 2] },
    { visible: false, nums: [1, 1] },
    { visible: false, nums: [3, 3, 3, 4, 5] },
    { visible: false, nums: [0, 0, 0] },
    { visible: false, nums: [100, 100] },
    { visible: false, nums: [1, 3, 5, 7] },
  ],
  reference: `function canPartition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2 !== 0) return false;
  const target = total / 2;
  const reachable = new Set([0]);
  for (const n of nums) {
    for (const r of Array.from(reachable)) {
      if (r + n <= target) reachable.add(r + n);
    }
    if (reachable.has(target)) return true;
  }
  return reachable.has(target);
}`,
};

module.exports = { CONTENT };