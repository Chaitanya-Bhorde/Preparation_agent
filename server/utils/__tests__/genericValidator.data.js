/**
 * genericValidator.data.js
 * ---------------------------------------------------------------------------
 * Shared, metadata-driven problem fixtures for the generic-validator test suite.
 * Each problem is described ENTIRELY by metadata — no problem-specific logic — so
 * we can prove the engine is generic. Every problem carries 5 test cases, giving
 * 10 x 5 = 50 assertions across the unit/integration suites.
 * ---------------------------------------------------------------------------
 */
module.exports = {
  PROBLEMS: [
    // 1. Binary Search
    {
      title: 'Binary Search',
      description: 'Find the target in a sorted array; return its index or -1.',
      difficulty: 'easy',
      topic: 'array',
      inputFormat: {
        type: 'array_number',
        fields: [
          { name: 'nums', type: 'integer[]' },
          { name: 'target', type: 'integer' },
        ],
      },
      outputFormat: { type: 'integer', description: 'Index of target (-1 if absent)' },
      referenceSolution: {
        language: 'js',
        code: `function solve(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}`,
      },
      testCases: [
        { input: '{"nums":[],"target":3}', expectedOutput: '-1', isHidden: false, explanation: 'empty array' },
        { input: '{"nums":[1,3,5,6],"target":5}', expectedOutput: '2', isHidden: false, explanation: 'found' },
        { input: '{"nums":[1,3,5,6],"target":0}', expectedOutput: '-1', isHidden: true, explanation: 'not found' },
        { input: '{"nums":[-5,-2,0,3,9],"target":-2}', expectedOutput: '1', isHidden: true, explanation: 'negative target' },
        { input: '{"nums":[1,2,2,2,3],"target":2}', expectedOutput: '2', isHidden: true, explanation: 'duplicate values' },
      ],
    },

    // 2. Word Search
    {
      title: 'Word Search',
      description: 'Check whether a word exists in a 2D grid via adjacent (DFS) cells.',
      difficulty: 'medium',
      topic: 'matrix',
      inputFormat: {
        type: 'board_string',
        fields: [
          { name: 'board', type: 'string[][]' },
          { name: 'word', type: 'string' },
        ],
      },
      outputFormat: { type: 'boolean', description: 'Whether the word exists in the grid' },
      referenceSolution: {
        language: 'js',
        code: `function solve(board, word) {
  const m = board.length, n = board[0].length;
  const visited = Array.from({ length: m }, () => new Array(n).fill(false));
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
  const dfs = (r, c, k) => {
    if (board[r][c] !== word[k]) return false;
    if (k === word.length - 1) return true;
    visited[r][c] = true;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < m && nc >= 0 && nc < n && !visited[nr][nc] && dfs(nr, nc, k + 1)) return true;
    }
    visited[r][c] = false;
    return false;
  };
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++) if (dfs(i, j, 0)) return true;
  return false;
}`,
      },
      testCases: [
        { input: '{"board":[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]],"word":"ABCCED"}', expectedOutput: 'true', isHidden: false, explanation: 'exists' },
        { input: '{"board":[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]],"word":"ABCZ"}', expectedOutput: 'false', isHidden: false, explanation: 'not found' },
        { input: '{"board":[["A"]],"word":"A"}', expectedOutput: 'true', isHidden: true, explanation: 'single char' },
        { input: '{"board":[["A","B"]],"word":"BA"}', expectedOutput: 'true', isHidden: true, explanation: 'adjacent' },
        { input: '{"board":[["A","B"],["C","D"]],"word":"ACBD"}', expectedOutput: 'false', isHidden: true, explanation: 'cannot snake' },
      ],
    },

    // 3. Number of Islands
    {
      title: 'Number of Islands',
      description: 'Count connected components of 1s in a binary grid (4-direction).',
      difficulty: 'medium',
      topic: 'matrix',
      inputFormat: {
        type: 'grid',
        fields: [{ name: 'grid', type: 'integer[][]' }],
      },
      outputFormat: { type: 'integer', description: 'Number of islands' },
      referenceSolution: {
        language: 'js',
        code: `function solve(grid) {
  if (!grid.length) return 0;
  const m = grid.length, n = grid[0].length;
  const isLand = (r, c) => grid[r][c] === '1' || grid[r][c] === 1;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const sink = (r, c) => {
    if (r < 0 || r >= m || c < 0 || c >= n || !isLand(r, c)) return;
    grid[r][c] = 0;
    for (const [dr, dc] of dirs) sink(r + dr, c + dc);
  };
  let count = 0;
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++) if (isLand(i, j)) { count++; sink(i, j); }
  return count;
}`,
      },
      testCases: [
        { input: '{"grid":[[1,1,0],[1,1,0],[0,0,1]]}', expectedOutput: '2', isHidden: false, explanation: 'two islands' },
        { input: '{"grid":[[1,0,1],[0,0,0],[1,0,1]]}', expectedOutput: '4', isHidden: false, explanation: 'disconnected' },
        { input: '{"grid":[[0,0],[0,0]]}', expectedOutput: '0', isHidden: true, explanation: 'no islands' },
        { input: '{"grid":[[1,1],[1,1]]}', expectedOutput: '1', isHidden: true, explanation: 'one big island' },
        { input: '{"grid":[[1,0,1],[1,0,1],[1,1,1]]}', expectedOutput: '1', isHidden: true, explanation: 'snake connects' },
      ],
    },

    // 4. Course Schedule
    {
      title: 'Course Schedule',
      description: 'Can all courses be finished given prerequisites (cycle detection).',
      difficulty: 'medium',
      topic: 'graph',
      inputFormat: {
        type: 'multiple_arrays',
        fields: [
          { name: 'numCourses', type: 'integer' },
          { name: 'prerequisites', type: 'integer[][]' },
        ],
      },
      outputFormat: { type: 'boolean', description: 'Whether all courses can be finished' },
      referenceSolution: {
        language: 'js',
        code: `function solve(numCourses, prerequisites) {
  const indeg = new Array(numCourses).fill(0);
  const adj = Array.from({ length: numCourses }, () => []);
  for (const [a, b] of prerequisites) { adj[b].push(a); indeg[a]++; }
  const queue = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);
  let visited = 0;
  while (queue.length) {
    const node = queue.shift(); visited++;
    for (const next of adj[node]) { indeg[next]--; if (indeg[next] === 0) queue.push(next); }
  }
  return visited === numCourses;
}`,
      },
      testCases: [
        { input: '{"numCourses":2,"prerequisites":[]}', expectedOutput: 'true', isHidden: false, explanation: 'no prerequisites' },
        { input: '{"numCourses":2,"prerequisites":[[1,0]]}', expectedOutput: 'true', isHidden: false, explanation: 'linear' },
        { input: '{"numCourses":2,"prerequisites":[[1,0],[0,1]]}', expectedOutput: 'false', isHidden: true, explanation: 'cycle' },
        { input: '{"numCourses":1,"prerequisites":[]}', expectedOutput: 'true', isHidden: true, explanation: 'single course' },
        { input: '{"numCourses":4,"prerequisites":[[1,0],[2,0],[3,1],[3,2]]}', expectedOutput: 'true', isHidden: true, explanation: 'acyclic' },
      ],
    },

    // 5. Valid Palindrome II
    {
      title: 'Valid Palindrome II',
      description: 'Can s become a palindrome by deleting at most one character.',
      difficulty: 'easy',
      topic: 'string',
      inputFormat: {
        type: 'string',
        fields: [{ name: 's', type: 'string' }],
      },
      outputFormat: { type: 'boolean', description: 'Whether it is a valid palindrome after <=1 delete' },
      referenceSolution: {
        language: 'js',
        code: `function solve(s) {
  const isPal = (lo, hi) => {
    while (lo < hi) { if (s[lo] !== s[hi]) return false; lo++; hi--; }
    return true;
  };
  let lo = 0, hi = s.length - 1;
  while (lo < hi) {
    if (s[lo] !== s[hi]) return isPal(lo + 1, hi) || isPal(lo, hi - 1);
    lo++; hi--;
  }
  return true;
}`,
      },
      testCases: [
        { input: '{"s":"aba"}', expectedOutput: 'true', isHidden: false, explanation: 'already palindrome' },
        { input: '{"s":"abc"}', expectedOutput: 'false', isHidden: false, explanation: 'cannot fix' },
        { input: '{"s":""}', expectedOutput: 'true', isHidden: true, explanation: 'empty' },
        { input: '{"s":"a"}', expectedOutput: 'true', isHidden: true, explanation: 'single char' },
        { input: '{"s":"abca"}', expectedOutput: 'true', isHidden: true, explanation: 'delete one char' },
      ],
    },

    // 6. Letter Combinations
    {
      title: 'Letter Combinations of a Phone Number',
      description: 'All letter combinations a phone number could represent.',
      difficulty: 'medium',
      topic: 'backtracking',
      inputFormat: {
        type: 'string',
        fields: [{ name: 'digits', type: 'string' }],
      },
      outputFormat: { type: 'string[]', description: 'All possible combinations' },
      referenceSolution: {
        language: 'js',
        code: `function solve(digits) {
  if (!digits || digits.length === 0) return [];
  const map = ['', '', 'abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz'];
  const out = [];
  const bt = (i, cur) => {
    if (i === digits.length) { out.push(cur); return; }
    for (const ch of map[digits.charCodeAt(i) - 48]) bt(i + 1, cur + ch);
  };
  bt(0, '');
  return out;
}`,
      },
      testCases: [
        { input: '{"digits":""}', expectedOutput: '[]', isHidden: false, explanation: 'empty' },
        { input: '{"digits":"2"}', expectedOutput: '["a","b","c"]', isHidden: false, explanation: 'single digit' },
        { input: '{"digits":"23"}', expectedOutput: '["ad","ae","af","bd","be","bf","cd","ce","cf"]', isHidden: true, explanation: 'two digits' },
        { input: '{"digits":"9"}', expectedOutput: '["w","x","y","z"]', isHidden: true, explanation: 'digit 9' },
        { input: '{"digits":"5"}', expectedOutput: '["j","k","l"]', isHidden: true, explanation: 'digit 5' },
      ],
    },

    // 7. Basic Calculator III
    {
      title: 'Basic Calculator III',
      description: 'Evaluate + - * / with parentheses (no eval).',
      difficulty: 'hard',
      topic: 'stack',
      inputFormat: {
        type: 'string',
        fields: [{ name: 's', type: 'string' }],
      },
      outputFormat: { type: 'integer', description: 'Evaluated integer result (division truncates toward zero)' },
      referenceSolution: {
        language: 'js',
        code: `function solve(s) {
  let i = 0; const n = s.length;
  const skip = () => { while (i < n && s[i] === ' ') i++; };
  const num = () => { let x = 0; while (i < n && s[i] >= '0' && s[i] <= '9') { x = x * 10 + (s.charCodeAt(i) - 48); i++; } return x; };
  const factor = () => {
    skip();
    if (s[i] === '(') { i++; const r = expr(); skip(); if (s[i] === ')') i++; return r; }
    if (s[i] === '+' || s[i] === '-') { const op = s[i]; i++; const v = factor(); return op === '-' ? -v : v; }
    return num();
  };
  const term = () => {
    let r = factor(); skip();
    while (i < n && (s[i] === '*' || s[i] === '/')) { const op = s[i]; i++; const v = factor(); r = op === '*' ? r * v : Math.trunc(r / v); skip(); }
    return r;
  };
  const expr = () => {
    let r = term(); skip();
    while (i < n && (s[i] === '+' || s[i] === '-')) { const op = s[i]; i++; const v = term(); r = op === '+' ? r + v : r - v; skip(); }
    return r;
  };
  return expr();
}`,
      },
      testCases: [
        { input: '{"s":"1 + 1 + 1"}', expectedOutput: '3', isHidden: false, explanation: 'addition' },
        { input: '{"s":"10 - 3"}', expectedOutput: '7', isHidden: false, explanation: 'subtraction' },
        { input: '{"s":"2 * 3 * 4"}', expectedOutput: '24', isHidden: true, explanation: 'multiplication' },
        { input: '{"s":"14 - 3 / 2"}', expectedOutput: '13', isHidden: true, explanation: 'division truncates' },
        { input: '{"s":"(1+(4+5+2)-3)-(6+8)"}', expectedOutput: '-5', isHidden: true, explanation: 'complex parentheses' },
      ],
    },

    // 8. Minimum Size Subarray Sum
    {
      title: 'Minimum Size Subarray Sum',
      description: 'Smallest contiguous subarray length with sum >= target.',
      difficulty: 'medium',
      topic: 'sliding window',
      inputFormat: {
        type: 'array_number',
        fields: [
          { name: 'target', type: 'integer' },
          { name: 'nums', type: 'integer[]' },
        ],
      },
      outputFormat: { type: 'integer', description: 'Minimum length (0 if none)' },
      referenceSolution: {
        language: 'js',
        code: `function solve(target, nums) {
  let left = 0, sum = 0, minLen = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {
      if (right - left + 1 < minLen) minLen = right - left + 1;
      sum -= nums[left]; left++;
    }
  }
  return minLen === Infinity ? 0 : minLen;
}`,
      },
      testCases: [
        { input: '{"target":7,"nums":[2,3,1,2,4,3]}', expectedOutput: '2', isHidden: false, explanation: 'found' },
        { input: '{"target":100,"nums":[1,2,3]}', expectedOutput: '0', isHidden: false, explanation: 'not found' },
        { input: '{"target":5,"nums":[5]}', expectedOutput: '1', isHidden: true, explanation: 'single element' },
        { input: '{"target":1,"nums":[2,3]}', expectedOutput: '1', isHidden: true, explanation: 'small target' },
        { input: '{"target":15,"nums":[1,2,3,4,5]}', expectedOutput: '5', isHidden: true, explanation: 'entire array' },
      ],
    },

    // 9. Increasing Triplet Subsequence
    {
      title: 'Increasing Triplet Subsequence',
      description: 'Does there exist i<j<k with nums[i]<nums[j]<nums[k].',
      difficulty: 'medium',
      topic: 'greedy',
      inputFormat: {
        type: 'array_number',
        fields: [{ name: 'nums', type: 'integer[]' }],
      },
      outputFormat: { type: 'boolean', description: 'Whether such a triplet exists' },
      referenceSolution: {
        language: 'js',
        code: `function solve(nums) {
  let first = Infinity, second = Infinity;
  for (const x of nums) {
    if (x <= first) first = x;
    else if (x <= second) second = x;
    else return true;
  }
  return false;
}`,
      },
      testCases: [
        { input: '{"nums":[1,2,3,4,5]}', expectedOutput: 'true', isHidden: false, explanation: 'found' },
        { input: '{"nums":[5,4,3,2,1]}', expectedOutput: 'false', isHidden: false, explanation: 'descending' },
        { input: '{"nums":[1,1,1,1]}', expectedOutput: 'false', isHidden: true, explanation: 'duplicates' },
        { input: '{"nums":[-1,0,1]}', expectedOutput: 'true', isHidden: true, explanation: 'negatives' },
        { input: '{"nums":[2,1,5,0,4,6]}', expectedOutput: 'true', isHidden: true, explanation: 'non-contiguous' },
      ],
    },

    // 10. Valid Parentheses String
    {
      title: 'Valid Parentheses String',
      description: 'Is s valid where * may be "(", ")" or empty.',
      difficulty: 'medium',
      topic: 'greedy',
      inputFormat: {
        type: 'string',
        fields: [{ name: 's', type: 'string' }],
      },
      outputFormat: { type: 'boolean', description: 'Whether the string is valid' },
      referenceSolution: {
        language: 'js',
        code: `function solve(s) {
  let low = 0, high = 0;
  for (const ch of s) {
    if (ch === '(') { low++; high++; }
    else if (ch === ')') { low = Math.max(low - 1, 0); high--; }
    else { low = Math.max(low - 1, 0); high++; }
    if (high < 0) return false;
  }
  return low === 0;
}`,
      },
      testCases: [
        { input: '{"s":"()"}', expectedOutput: 'true', isHidden: false, explanation: 'valid' },
        { input: '{"s":")"}', expectedOutput: 'false', isHidden: false, explanation: 'close first' },
        { input: '{"s":"(*)"}', expectedOutput: 'true', isHidden: true, explanation: 'wildcard as open' },
        { input: '{"s":"(*))"}', expectedOutput: 'true', isHidden: true, explanation: 'wildcard as close' },
        { input: '{"s":"())"}', expectedOutput: 'false', isHidden: true, explanation: 'unbalanced' },
      ],
    },
  ],
};

