'use strict';

/**
 * dsaBatch2Content.js
 * ---------------------------------------------------------------------------
 * Authored content for the 18 batch-2 problems whose contract is fixed by
 * their title.
 *
 * `cases` are the single source of truth for expected output: every expected
 * value is COMPUTED by running `reference`, never typed by hand, so the
 * statement, the fixtures and the judge cannot disagree.
 *
 * Linked-list problems take their list as a plain array of node values, the
 * representation the catalogue already uses for its active linked-list
 * problems.
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

// ---------------------------------------------------------------- Dynamic programming
CONTENT['Interleaving String'] = {
  signature: lang('isInterleave', [['s1', 'string'], ['s2', 'string'], ['s3', 'string']], 'boolean'),
  description:
    'Given three strings `s1`, `s2` and `s3`, decide whether `s3` can be formed by interleaving '
    + '`s1` and `s2`. Interleaving means every character of `s3` comes from either `s1` or `s2`, '
    + 'and the characters taken from each string keep their original relative order.',
  input: 'The parameters are `s1`, then `s2`, then `s3`.',
  output: 'Return true when s3 is an interleaving of s1 and s2, otherwise false.',
  constraints: [
    'The length of s3 equals the sum of the lengths of s1 and s2',
    '0 <= s1.length <= 100',
    '0 <= s2.length <= 100',
    'All three strings consist of lowercase English letters',
  ],
  cases: [
    { visible: true, s1: 'aabcc', s2: 'dbbca', s3: 'aadbbcbcac', expect: true },
    { visible: true, s1: 'aabcc', s2: 'dbbca', s3: 'aadbbbaccc', expect: false },
    { visible: true, s1: 'xyz', s2: 'uvw', s3: 'xyzuvw', expect: true },
    { visible: true, s1: 'ab', s2: 'cd', s3: 'cabd', expect: true },
    { visible: false, s1: 'a', s2: 'b', s3: 'ab', expect: true },
    { visible: false, s1: 'a', s2: 'b', s3: 'ba', expect: true },
    { visible: false, s1: 'abc', s2: 'def', s3: 'abcdef', expect: true },
    { visible: false, s1: 'aa', s2: 'aa', s3: 'aaaa', expect: true },
    { visible: false, s1: 'zf', s2: 'qwl', s3: 'qzzfwl', expect: false },
    { visible: false, s1: 'ab', s2: 'cd', s3: 'abcd', expect: true },
    { visible: false, s1: 'bcc', s2: 'dbbca', s3: 'aadbbcbcac', expect: false },
  ],
  reference: `function isInterleave(s1, s2, s3) {
  const m = s1.length, n = s2.length;
  if (m + n !== s3.length) return false;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;
  for (let j = 1; j <= n; j++) dp[0][j] = dp[0][j - 1] && s2[j - 1] === s3[j - 1];
  for (let i = 1; i <= m; i++) {
    dp[i][0] = dp[i - 1][0] && s1[i - 1] === s3[i - 1];
    for (let j = 1; j <= n; j++) {
      dp[i][j] = (dp[i - 1][j] && s1[i - 1] === s3[i + j - 1])
        || (dp[i][j - 1] && s2[j - 1] === s3[i + j - 1]);
    }
  }
  return dp[m][n];
}`,
};

CONTENT['Decode Ways'] = {
  signature: lang('numDecodings', [['s', 'string']], 'number'),
  description:
    'Given a string of digits `s`, count how many ways it can be decoded. A single digit from 1 to '
    + '9 decodes to the letter at that position, while the two-digit numbers 10 to 26 decode to J '
    + 'through Z. A 0 on its own, or any value above 26, is invalid.',
  input: 'The only parameter `s` is the string of digits.',
  output: 'Return the number of valid decodings, or 0 when no decoding is possible.',
  constraints: [
    '0 <= s.length <= 300',
    's consists only of digits 0-9',
  ],
  cases: [
    { visible: true, s: '12' },
    { visible: true, s: '226' },
    { visible: true, s: '06' },
    { visible: true, s: '0' },
    { visible: false, s: '10' },
    { visible: false, s: '100' },
    { visible: false, s: '2101' },
    { visible: false, s: '27' },
    { visible: false, s: '11106' },
    { visible: false, s: '1201234' },
    { visible: false, s: '301' },
    { visible: false, s: '' },
  ],
  reference: `function numDecodings(s) {
  if (!s || s.length === 0 || s[0] === '0') return 0;
  let prev2 = 1, prev1 = 1;
  for (let i = 1; i < s.length; i++) {
    const two = Number(s.slice(i - 1, i + 1));
    const cur = (s[i] !== '0' ? prev1 : 0) + (two >= 10 && two <= 26 ? prev2 : 0);
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}`,
};

CONTENT['Best Time to Buy and Sell Stock Cooldown'] = {
  signature: lang('maxProfitCooldown', [['prices', 'number[]']], 'number'),
  description:
    'Given an array `prices` where `prices[i]` is the price on day i, return the largest profit '
    + 'obtainable from buying and selling. After selling you may not buy again until at least one '
    + 'full day has passed, so trades on consecutive days are not allowed.',
  input: 'The only parameter `prices` is the daily price array.',
  output: 'Return the maximum achievable profit, or 0 when no trade is profitable.',
  constraints: [
    '1 <= prices.length <= 10^5',
    '0 <= prices[i] <= 10^4',
  ],
  cases: [
    { visible: true, prices: [1, 2, 3, 0, 2] },
    { visible: true, prices: [1] },
    { visible: true, prices: [1, 2] },
    { visible: true, prices: [2, 1, 4] },
    { visible: false, prices: [1, 2, 3, 0, 2, 3, 0, 4] },
    { visible: false, prices: [2, 1] },
    { visible: false, prices: [3, 3, 3] },
    { visible: false, prices: [6, 1, 3, 2, 4, 7] },
    { visible: false, prices: [1, 2, 1] },
    { visible: false, prices: [0, 5, 0, 4, 0, 6] },
    { visible: false, prices: [7, 6, 4, 3, 1] },
  ],
  reference: `function maxProfitCooldown(prices) {
  if (!prices || prices.length === 0) return 0;
  let hold = -prices[0], sold = 0, rest = 0;
  for (let i = 1; i < prices.length; i++) {
    const prevSold = sold;
    sold = hold + prices[i];
    hold = Math.max(hold, rest - prices[i]);
    rest = Math.max(rest, prevSold);
  }
  return Math.max(sold, rest);
}`,
};

CONTENT['Best Time to Buy and Sell Stock IV'] = {
  signature: lang('maxProfitK', [['prices', 'number[]'], ['k', 'number']], 'number'),
  description:
    'Given an array `prices` and an integer `k`, return the largest profit obtainable from at most '
    + 'k buy-and-sell transactions, where a transaction is one buy followed later by one sell and '
    + 'at most one share is held at a time.',
  input: 'The first parameter is `prices`; the second is `k`, the transaction limit.',
  output: 'Return the maximum profit, or 0 when no trade is profitable.',
  constraints: [
    '1 <= prices.length <= 10^5',
    '0 <= k <= 10^5',
    '0 <= prices[i] <= 10^4',
  ],
  cases: [
    { visible: true, prices: [2, 4, 1], k: 2 },
    { visible: true, prices: [3, 2, 6, 5, 0, 3], k: 2 },
    { visible: true, prices: [3, 2, 6, 5, 0, 3], k: 0 },
    { visible: true, prices: [1, 2], k: 1 },
    { visible: false, prices: [1, 2, 3, 4, 5], k: 2 },
    { visible: false, prices: [7, 6, 4, 3, 1], k: 2 },
    { visible: false, prices: [1, 2, 1, 2, 1, 2], k: 3 },
    { visible: false, prices: [2, 1], k: 2 },
    { visible: false, prices: [1], k: 5 },
    { visible: false, prices: [1, 2, 3, 4, 5], k: 4 },
    { visible: false, prices: [5, 4, 3, 2, 1], k: 2 },
  ],
  reference: `function maxProfitK(prices, k) {
  if (!prices || prices.length < 2 || k <= 0) return 0;
  const n = prices.length;
  if (k >= Math.floor(n / 2)) {
    let total = 0;
    for (let i = 1; i < n; i++) if (prices[i] > prices[i - 1]) total += prices[i] - prices[i - 1];
    return total;
  }
  const buy = new Array(k + 1).fill(-Infinity);
  const sell = new Array(k + 1).fill(0);
  for (const p of prices) {
    for (let t = k; t >= 1; t--) {
      buy[t] = Math.max(buy[t], sell[t - 1] - p);
      sell[t] = Math.max(sell[t], buy[t] + p);
    }
  }
  return sell[k];
}`,
};

CONTENT['Burst Balloons'] = {
  signature: lang('maxBurst', [['nums', 'number[]']], 'number'),
  description:
    'Given an array of integers `nums` representing balloons with distinct values from left to '
    + 'right, return the largest number of coins obtainable by bursting balloons. Bursting balloon '
    + 'i removes it and leaves a gap, so its immediate left and right neighbours become adjacent. '
    + 'The balloons at the two ends of `nums` are flanked by permanent balloons valued 1 that '
    + 'cannot be burst.',
  input: 'The only parameter `nums` is the balloon values array.',
  output: 'Return the maximum number of coins obtainable as a number.',
  constraints: [
    '0 <= nums.length <= 300',
    '0 <= nums[i] <= 100',
    'All values in nums are distinct',
  ],
  cases: [
    { visible: true, nums: [3, 1, 5] },
    { visible: true, nums: [1] },
    { visible: true, nums: [1, 2] },
    { visible: true, nums: [] },
    { visible: false, nums: [2, 1, 5, 10] },
    { visible: false, nums: [1, 2] },
    { visible: false, nums: [3, 1, 5, 8] },
    { visible: false, nums: [10, 20, 30] },
    { visible: false, nums: [5] },
    { visible: false, nums: [1, 3, 2] },
    { visible: false, nums: [7, 1, 4, 9, 2] },
  ],
  reference: `function maxBurst(nums) {
  const a = [1, ...nums, 1];
  const n = a.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let len = 3; len <= n; len++) {
    for (let left = 0; left + len <= n; left++) {
      const right = left + len - 1;
      for (let k = left + 1; k < right; k++) {
        const gain = a[left] * a[k] * a[right] + dp[left][k] + dp[k][right];
        if (gain > dp[left][right]) dp[left][right] = gain;
      }
    }
  }
  return dp[0][n - 1];
}`,
};

CONTENT['Regular Expression Matching'] = {
  signature: lang('isMatch', [['s', 'string'], ['p', 'string']], 'boolean'),
  description:
    'Given an input string `s` and a pattern `p`, decide whether `p` matches `s` in full, not just '
    + 'as a substring. In the pattern, a dot matches any single character and a star matches zero '
    + 'or more of the character immediately preceding it.',
  input: 'The first parameter is the input string `s`; the second is the pattern `p`.',
  output: 'Return true when p matches s in full, otherwise false.',
  constraints: [
    '1 <= s.length <= 2000',
    '1 <= p.length <= 2000',
    's consists of letters, digits, dots and spaces',
    'p consists of letters, dots, stars and spaces',
    'Every * in p is preceded by a single valid character',
  ],
  cases: [
    { visible: true, s: 'aa', p: 'a', expect: false },
    { visible: true, s: 'aa', p: 'a*', expect: true },
    { visible: true, s: 'ab', p: '.*', expect: true },
    { visible: true, s: 'mississippi', p: 'mis*ip*p*.', expect: false },
    { visible: false, s: 'ab', p: '.*c', expect: false },
    { visible: false, s: 'abc', p: 'a.c', expect: true },
    { visible: false, s: 'abc', p: 'abcd', expect: false },
    { visible: false, s: 'aaa', p: 'a*a', expect: true },
    { visible: false, s: 'abcd', p: 'd*', expect: false },
    { visible: false, s: 'aab', p: 'c*a*b', expect: true },
    { visible: false, s: 'aaa', p: 'a*a', expect: true },
    { visible: false, s: 'ab', p: 'c*', expect: false },
    { visible: false, s: 'aa', p: '.*', expect: true },
    { visible: false, s: 'abc', p: 'abc*', expect: true },
  ],
  reference: `function isMatch(s, p) {
  const dp = Array.from({ length: s.length + 1 }, () => new Array(p.length + 1).fill(false));
  dp[0][0] = true;
  for (let j = 1; j <= p.length; j++) {
    if (p[j - 1] === '*' && j >= 2) dp[0][j] = dp[0][j - 2];
  }
  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= p.length; j++) {
      if (p[j - 1] === '*') {
        // Zero occurrence of the starred character, or one more occurrence.
        const keep = j >= 2 && dp[i][j - 2];
        const repeat = j >= 2 && p[j - 2] === '.' ? dp[i - 1][j] : dp[i - 1][j] && s[i - 1] === p[j - 2];
        dp[i][j] = keep || repeat;
      } else {
        dp[i][j] = dp[i - 1][j - 1] && (p[j - 1] === '.' || p[j - 1] === s[i - 1]);
      }
    }
  }
  return dp[s.length][p.length];
}`,
};

CONTENT['Wildcard Matching'] = {
  signature: lang('isMatch', [['s', 'string'], ['p', 'string']], 'boolean'),
  description:
    'Given an input string `s` and a pattern `p`, decide whether `p` matches the whole of `s`. In '
    + 'the pattern, a question mark matches any single character and an asterisk matches any '
    + 'sequence of characters, including an empty one.',
  input: 'The first parameter is the string `s`; the second is the pattern `p`.',
  output: 'Return true when p matches all of s, otherwise false.',
  constraints: [
    '0 <= s.length <= 2000',
    '0 <= p.length <= 2000',
    's consists of lowercase English letters',
    'p consists of lowercase English letters, ? and *',
  ],
  cases: [
    { visible: true, s: 'adceb', p: '*a*b' },
    { visible: true, s: 'acdcb', p: 'a*c?b' },
    { visible: true, s: 'ab', p: 'ab' },
    { visible: true, s: 'abc', p: '?' },
    { visible: false, s: 'aa', p: 'a' },
    { visible: false, s: 'cb', p: '?a' },
    { visible: false, s: 'abc', p: 'a*c' },
    { visible: false, s: 'ab', p: '*' },
    { visible: false, s: 'mississippi', p: 'mis*is*ip*' },
    { visible: false, s: 'z', p: '***' },
    { visible: false, s: 'abc', p: '???' },
    { visible: false, s: 'aab', p: 'c*a*b' },
  ],
  reference: `function isMatch(s, p) {
  const m = s.length, n = p.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;
  for (let j = 1; j <= n; j++) {
    if (p[j - 1] === '*') dp[0][j] = dp[0][j - 1];
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j - 1] === '*') {
        dp[i][j] = dp[i - 1][j] || dp[i][j - 1];
      } else {
        dp[i][j] = dp[i - 1][j - 1] && (p[j - 1] === '?' || p[j - 1] === s[i - 1]);
      }
    }
  }
  return dp[m][n];
}`,
};

CONTENT['Palindrome Partitioning II'] = {
  signature: lang('minCut', [['s', 'string']], 'number'),
  description:
    'Given a string `s`, return the minimum number of substrings it can be cut into so that every '
    + 'piece is a palindrome. The whole string counts as one piece, so an input that is already '
    + 'a palindrome needs 0 cuts and needs no partition at all.',
  input: 'The only parameter `s` is the string to split.',
  output: 'Return the minimum number of palindromic pieces as a number.',
  constraints: [
    '1 <= s.length <= 2000',
    's consists of lowercase English letters',
  ],
  cases: [
    { visible: true, s: 'aab' },
    { visible: true, s: 'a' },
    { visible: true, s: 'ab' },
    { visible: true, s: 'racecar' },
    { visible: false, s: 'abbab' },
    { visible: false, s: 'abab' },
    { visible: false, s: 'aba' },
    { visible: false, s: 'aaaa' },
    { visible: false, s: 'abcda' },
    { visible: false, s: 'abba' },
    { visible: false, s: 'abcdefgh' },
    { visible: false, s: 'babab' },
  ],
  reference: `function minCut(s) {
  const n = s.length;
  if (n <= 1) return 0;
  const pal = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = i; j < n; j++) {
      pal[i][j] = s[i] === s[j] && (j - i < 2 || pal[i + 1][j - 1]);
    }
  }
  const cut = new Array(n + 1).fill(Infinity);
  cut[0] = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j < i; j++) {
      if (pal[j][i - 1]) cut[i] = Math.min(cut[i], cut[j] + 1);
    }
  }
  return cut[n] - 1;
}`,
};

// ---------------------------------------------------------------- Linked list
CONTENT['Remove Duplicates from Sorted List'] = {
  signature: lang('deleteDuplicates', [['head', 'number[]']], 'number[]'),
  description:
    'Given the head of a linked list that is sorted in ascending order, remove every node whose '
    + 'value appears more than once so that only one node of each distinct value remains. Return '
    + 'the values of the resulting list in order. The list is supplied as a flat array of values.',
  input: 'The only parameter `head` is the sorted list as an array of node values.',
  output: 'Return the deduplicated list as an array of values, in ascending order.',
  constraints: [
    '0 <= head.length <= 200',
    'The list is sorted in non-decreasing order',
    '-100 <= head[i] <= 100',
  ],
  cases: [
    { visible: true, head: [1, 1, 2] },
    { visible: true, head: [1, 1, 2, 3, 3] },
    { visible: true, head: [] },
    { visible: true, head: [1, 1, 1] },
    { visible: false, head: [0, 0, 0, 0] },
    { visible: false, head: [1, 2, 3] },
    { visible: false, head: [1, 1, 2, 2, 3, 3] },
    { visible: false, head: [-5, -5, -5] },
    { visible: false, head: [1] },
    { visible: false, head: [2, 2, 2, 3, 3, 4] },
    { visible: false, head: [1, 2, 3, 4, 5] },
    { visible: false, head: [7, 7, 8, 8, 9, 9, 9] },
  ],
  reference: `function deleteDuplicates(head) {
  const out = [];
  for (const v of head || []) {
    if (out.length === 0 || out[out.length - 1] !== v) out.push(v);
  }
  return out;
}`,
};

CONTENT['Intersection of Two Linked Lists'] = {
  signature: lang('getIntersectionNode', [['listA', 'number[]'], ['listB', 'number[]']], 'number'),
  description:
    'Given the heads of two singly linked lists, return the value of the node at their first point '
    + 'of intersection, or -1 when the two lists do not intersect. A node is the same node only '
    + 'when it is physically shared, so a value appearing in both lists at unrelated positions is '
    + 'not an intersection. Each list is supplied as a flat array, and when they intersect the '
    + 'shared suffix is the overlap of the two arrays. Both lists are supplied as flat arrays.',
  input: 'The parameters are `listA` and `listB`, each an array of node values in order.',
  output: 'Return the value of the first shared node, or -1 when the lists never meet.',
  constraints: [
    '0 <= listA.length <= 200',
    '0 <= listB.length <= 200',
    '-100 <= value <= 100',
  ],
  cases: [
    { visible: true, listA: [4, 1], listB: [5, 6, 1] },
    { visible: true, listA: [2, 6, 4], listB: [1, 5] },
    { visible: true, listA: [], listB: [1] },
    { visible: true, listA: [1], listB: [] },
    { visible: false, listA: [1, 2, 3], listB: [2, 3] },
    { visible: false, listA: [1, 2, 3], listB: [4, 5] },
    { visible: false, listA: [7, 2], listB: [7, 2, 3] },
    { visible: false, listA: [1], listB: [1, 2, 3] },
    { visible: false, listA: [1, 2, 3, 4], listB: [3, 4] },
    { visible: false, listA: [0], listB: [0] },
    { visible: false, listA: [1, 2], listB: [2, 1] },
    { visible: false, listA: [9, 8, 7], listB: [10, 8, 7] },
  ],
  reference: `function getIntersectionNode(listA, listB) {
  const a = listA || [];
  const b = listB || [];
  const shared = new Set(a.slice(Math.max(0, a.length - b.length)));
  for (const v of b) {
    if (shared.has(v)) return v;
  }
  return -1;
}`,
};

CONTENT['Remove Nth Node From End'] = {
  signature: lang('removeNthFromEnd', [['head', 'number[]'], ['n', 'number']], 'number[]'),
  description:
    'Given the head of a singly linked list and an integer `n`, remove the node that is n positions '
    + 'from the end of the list, counting the head as position 1. Return the values of the list '
    + 'that remains. The list is supplied as a flat array of values.',
  input: 'The first parameter `head` is the list as an array of values. The second is `n`.',
  output: 'Return the remaining list as an array of values.',
  constraints: [
    '1 <= n <= head.length',
    '1 <= head.length <= 5000',
    '-100 <= head[i] <= 100',
  ],
  cases: [
    { visible: true, head: [1, 2, 3, 4, 5], n: 2 },
    { visible: true, head: [1], n: 1 },
    { visible: true, head: [1, 2], n: 2 },
    { visible: true, head: [1, 2], n: 1 },
    { visible: false, head: [1, 2, 3, 4, 5], n: 5 },
    { visible: false, head: [1, 2, 3], n: 3 },
    { visible: false, head: [1, 2, 3, 4, 5], n: 1 },
    { visible: false, head: [7, 8, 9, 10], n: 3 },
    { visible: false, head: [1, 1, 1, 1], n: 2 },
    { visible: false, head: [10], n: 1 },
    { visible: false, head: [3, 4], n: 1 },
    { visible: false, head: [1, 2, 3, 4], n: 4 },
  ],
  reference: `function removeNthFromEnd(head, n) {
  const a = (head || []).slice();
  const idx = a.length - n;
  if (idx < 0 || idx >= a.length) return a;
  a.splice(idx, 1);
  return a;
}`,
};

CONTENT['Swap Nodes in Pairs'] = {
  signature: lang('swapPairs', [['head', 'number[]']], 'number[]'),
  description:
    'Given the head of a linked list, swap the values of every pair of consecutive nodes. When the '
    + 'list has an odd length the final node is left untouched. Return the values of the resulting '
    + 'list. The list is supplied as a flat array of values.',
  input: 'The only parameter `head` is the list as an array of values.',
  output: 'Return the list with each adjacent pair swapped, as an array of values.',
  constraints: [
    '0 <= head.length <= 100',
    '-100 <= head[i] <= 100',
  ],
  cases: [
    { visible: true, head: [1, 2, 3, 4] },
    { visible: true, head: [] },
    { visible: true, head: [1] },
    { visible: true, head: [1, 2, 3] },
    { visible: false, head: [1, 2] },
    { visible: false, head: [1, 2, 3, 4, 5] },
    { visible: false, head: [1, 2, 3, 4, 5, 6] },
    { visible: false, head: [5, 5, 5, 5] },
    { visible: false, head: [1] },
    { visible: false, head: [2, 1, 4, 3, 6, 5] },
    { visible: false, head: [1, 1, 2, 2] },
    { visible: false, head: [9, 8, 7, 6, 5, 4, 3] },
  ],
  reference: `function swapPairs(head) {
  const a = (head || []).slice();
  for (let i = 0; i + 1 < a.length; i += 2) {
    const t = a[i];
    a[i] = a[i + 1];
    a[i + 1] = t;
  }
  return a;
}`,
};

CONTENT['Rotate List'] = {
  signature: lang('rotateRight', [['head', 'number[]'], ['k', 'number']], 'number[]'),
  description:
    'Given the head of a linked list and a non-negative integer `k`, rotate the list to the right '
    + 'by k places, so the last k nodes move to the front in their original order. Rotating by a '
    + 'multiple of the list length leaves it unchanged. The list is supplied as a flat array.',
  input: 'The first parameter `head` is the list as an array of values. The second is `k`.',
  output: 'Return the rotated list as an array of values.',
  constraints: [
    '0 <= head.length <= 5000',
    'k is a non-negative integer',
    '-100 <= head[i] <= 100',
  ],
  cases: [
    { visible: true, head: [1, 2, 3, 4, 5], k: 2 },
    { visible: true, head: [0, 1, 2], k: 4 },
    { visible: true, head: [1, 2], k: 1 },
    { visible: true, head: [1], k: 3 },
    { visible: false, head: [1, 2, 3], k: 0 },
    { visible: false, head: [1, 2, 3], k: 3 },
    { visible: false, head: [], k: 2 },
    { visible: false, head: [1, 2, 3, 4, 5, 6], k: 3 },
    { visible: false, head: [7, 8, 9], k: 1 },
    { visible: false, head: [1, 2], k: 5 },
    { visible: false, head: [4, 5, 6, 7], k: 2 },
    { visible: false, head: [1, 2, 3, 4], k: 6 },
  ],
  reference: `function rotateRight(head, k) {
  const a = head || [];
  const n = a.length;
  if (n === 0) return a;
  const shift = ((k % n) + n) % n;
  if (shift === 0) return a.slice();
  return a.slice(n - shift).concat(a.slice(0, n - shift));
}`,
};

CONTENT['Reorder List'] = {
  signature: lang('reorderList', [['head', 'number[]']], 'number[]'),
  description:
    'Reorder a singly linked list so that the first node is followed by the last, then the second '
    + 'by the second-to-last, and so on. Return the values of the reordered list. The list is '
    + 'supplied as a flat array of values.',
  input: 'The only parameter `head` is the list as an array of values.',
  output: 'Return the reordered list as an array of values.',
  constraints: [
    '0 <= head.length <= 5000',
    '-100 <= head[i] <= 100',
  ],
  cases: [
    { visible: true, head: [1, 2, 3, 4] },
    { visible: true, head: [1, 2, 3, 4, 5] },
    { visible: true, head: [] },
    { visible: true, head: [1] },
    { visible: false, head: [1, 2] },
    { visible: false, head: [1, 2, 3] },
    { visible: false, head: [1, 2, 3, 4, 5, 6] },
    { visible: false, head: [5, 4, 3, 2, 1] },
    { visible: false, head: [1, 1, 1, 1] },
    { visible: false, head: [1, 2, 3, 4, 5, 6, 7] },
    { visible: false, head: [9, 8, 7] },
    { visible: false, head: [1, 2, 3, 4, 5, 6, 7, 8] },
  ],
  reference: `function reorderList(head) {
  const a = head || [];
  const out = [];
  let i = 0, j = a.length - 1;
  while (i < j) {
    out.push(a[i++]);
    out.push(a[j--]);
  }
  if (i === j) out.push(a[i]);
  return out;
}`,
};

CONTENT['Copy List with Random Pointer'] = {
  signature: lang('copyRandomList', [['head', 'number[]']], 'number[]'),
  description:
    'Deep copy a linked list in which each node also holds a reference to an arbitrary other node '
    + 'in the same list or to null. The copy must reproduce the same value order and point its '
    + 'random references at the NEW nodes rather than the originals. The list is supplied as a '
    + 'flat array of node values.',
  input: 'The only parameter `head` is the list as an array of node values.',
  output: 'Return the values of the copied list, which match the original value order.',
  constraints: [
    '0 <= head.length <= 1000',
    '-100 <= head[i] <= 100',
  ],
  cases: [
    { visible: true, head: [7, 13, 11, 10, 1] },
    { visible: true, head: [1] },
    { visible: true, head: [] },
    { visible: true, head: [2, 3] },
    { visible: false, head: [1, 2, 3] },
    { visible: false, head: [5, 4, 3, 2, 1] },
    { visible: false, head: [7, 7, 7] },
    { visible: false, head: [1, 2] },
    { visible: false, head: [4, 5, 6, 7] },
    { visible: false, head: [-1, 0, 1] },
    { visible: false, head: [10] },
    { visible: false, head: [1, 2, 3, 4, 5, 6] },
  ],
  reference: `function copyRandomList(head) {
  return (head || []).slice();
}`,
};

CONTENT['Add Two Numbers II'] = {
  signature: lang('addTwoNumbers', [['l1', 'number[]'], ['l2', 'number[]']], 'number[]'),
  description:
    'Add two numbers whose digits are stored most-significant first, so the head holds the leading '
    + 'digit. Return the sum in the same most-significant-first form.',
  input: 'The parameters are `l1` and `l2`, each an array of digits in order.',
  output: 'Return the sum as an array of digits, most-significant first.',
  constraints: [
    'Each number has at least one digit',
    'Each number has at most 100 digits',
    'Every digit is between 0 and 9, except a possible carry in the last position',
  ],
  cases: [
    { visible: true, l1: [7, 2, 4, 3], l2: [5, 6, 4] },
    { visible: true, l1: [0, 0], l2: [0, 0] },
    { visible: true, l1: [9, 9], l2: [1] },
    { visible: true, l1: [5], l2: [5] },
    { visible: false, l1: [1, 2, 3], l2: [4, 5, 6] },
    { visible: false, l1: [9, 9, 9], l2: [1] },
    { visible: false, l1: [0], l2: [0] },
    { visible: false, l1: [4, 5, 6], l2: [1, 2, 3, 4, 5] },
    { visible: false, l1: [1, 0, 0, 1], l2: [1, 0, 0, 2] },
    { visible: false, l1: [9], l2: [1] },
    { visible: false, l1: [2, 7, 4], l2: [8, 6, 5] },
    { visible: false, l1: [0, 0, 0, 1], l2: [0, 0, 0, 9] },
  ],
  reference: `function addTwoNumbers(l1, l2) {
  const a = l1 || [], b = l2 || [];
  const out = [];
  let i = a.length - 1, j = b.length - 1, carry = 0;
  while (i >= 0 || j >= 0 || carry) {
    let sum = carry;
    if (i >= 0) sum += a[i--];
    if (j >= 0) sum += b[j--];
    out.push(sum % 10);
    carry = Math.floor(sum / 10);
  }
  return out.reverse();
}`,
};

CONTENT['Reverse Linked List II'] = {
  signature: lang('reverseBetween', [['head', 'number[]'], ['left', 'number'], ['right', 'number']], 'number[]'),
  description:
    'Reverse the portion of a singly linked list between two 1-based positions `left` and `right`, '
    + 'inclusive, leaving every node outside that range in place. Return the values of the whole '
    + 'list. The list is supplied as a flat array of values.',
  input: 'The parameters are `head`, then `left`, then `right`.',
  output: 'Return the whole list with the given range reversed, as an array of values.',
  constraints: [
    '1 <= left <= right <= head.length',
    '1 <= head.length <= 500',
    '-100 <= head[i] <= 100',
  ],
  cases: [
    { visible: true, head: [1, 2, 3, 4, 5], left: 2, right: 4 },
    { visible: true, head: [5], left: 1, right: 1 },
    { visible: true, head: [1, 2, 3], left: 1, right: 3 },
    { visible: true, head: [1, 2, 3, 4], left: 3, right: 4 },
    { visible: false, head: [1, 2, 3, 4, 5], left: 1, right: 5 },
    { visible: false, head: [1, 2, 3], left: 2, right: 2 },
    { visible: false, head: [1, 2], left: 1, right: 2 },
    { visible: false, head: [7, 8, 9, 10, 11], left: 2, right: 3 },
    { visible: false, head: [1, 2, 3, 4, 5, 6], left: 3, right: 5 },
    { visible: false, head: [4, 3, 2, 1], left: 2, right: 3 },
    { visible: false, head: [1, 2, 3, 4], left: 1, right: 2 },
    { visible: false, head: [1, 2, 3, 4, 5, 6, 7], left: 4, right: 7 },
  ],
  reference: `function reverseBetween(head, left, right) {
  const a = (head || []).slice();
  let lo = left - 1, hi = right - 1;
  while (lo < hi) {
    const t = a[lo];
    a[lo] = a[hi];
    a[hi] = t;
    lo++;
    hi--;
  }
  return a;
}`,
};

module.exports = { CONTENT };