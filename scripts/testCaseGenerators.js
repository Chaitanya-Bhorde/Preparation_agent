function referenceSolver_BinarySearch(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

function referenceSolver_WordSearch(board, word) {
  if (word.length === 0) return true;
  if (board.length === 0 || board[0].length === 0) return false;
  const m = board.length, n = board[0].length;
  const visited = Array.from({ length: m }, () => new Array(n).fill(false));
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
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
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (!visited[i][j] && board[i][j] === word[0] && dfs(i, j, 0)) return true;
    }
  }
  return false;
}

function referenceSolver_NumberOfIslands(grid) {
  if (grid.length === 0 || grid[0].length === 0) return 0;
  const m = grid.length, n = grid[0].length;
  const isLand = (r, c) => grid[r][c] === '1' || grid[r][c] === 1;
  const visited = Array.from({ length: m }, () => new Array(n).fill(false));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const sink = (r, c) => {
    if (r < 0 || r >= m || c < 0 || c >= n || visited[r][c] || !isLand(r, c)) return;
    visited[r][c] = true;
    for (const [dr, dc] of dirs) sink(r + dr, c + dc);
  };
  let count = 0;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (isLand(i, j) && !visited[i][j]) {
        count++;
        sink(i, j);
      }
    }
  }
  return count;
}

function referenceSolver_CourseSchedule(numCourses, prerequisites) {
  if (numCourses === 0) return true;
  const indeg = new Array(numCourses).fill(0);
  const adj = Array.from({ length: numCourses }, () => []);
  for (const [a, b] of prerequisites) {
    adj[b].push(a);
    indeg[a]++;
  }
  const queue = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);
  let visited = 0;
  while (queue.length > 0) {
    const node = queue.shift();
    visited++;
    for (const next of adj[node]) {
      indeg[next]--;
      if (indeg[next] === 0) queue.push(next);
    }
  }
  return visited === numCourses;
}

function referenceSolver_ValidPalindromeII(s) {
  const isPal = (lo, hi) => {
    while (lo < hi) {
      if (s[lo] !== s[hi]) return false;
      lo++; hi--;
    }
    return true;
  };
  let lo = 0, hi = s.length - 1;
  while (lo < hi) {
    if (s[lo] !== s[hi]) return isPal(lo + 1, hi) || isPal(lo, hi - 1);
    lo++; hi--;
  }
  return true;
}

function referenceSolver_LetterCombinations(digits) {
  if (!digits || digits.length === 0) return [];
  const map = ['', '', 'abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz'];
  const result = [];
  const backtrack = (idx, cur) => {
    if (idx === digits.length) { result.push(cur); return; }
    const letters = map[digits.charCodeAt(idx) - 48];
    for (let k = 0; k < letters.length; k++) backtrack(idx + 1, cur + letters[k]);
  };
  backtrack(0, '');
  return result;
}

function referenceSolver_BasicCalculatorIII(s) {
  let i = 0;
  const n = s.length;
  const skipSpaces = () => { while (i < n && s[i] === ' ') i++; };
  const parseNum = () => {
    let num = 0;
    while (i < n && s[i] >= '0' && s[i] <= '9') {
      num = num * 10 + (s.charCodeAt(i) - 48);
      i++;
    }
    return num;
  };
  const parseFactor = () => {
    skipSpaces();
    if (i < n && s[i] === '(') {
      i++;
      const r = parseExpr();
      skipSpaces();
      if (i < n && s[i] === ')') i++;
      return r;
    }
    if (i < n && (s[i] === '+' || s[i] === '-')) {
      const op = s[i];
      i++;
      const v = parseFactor();
      return op === '-' ? -v : v;
    }
    return parseNum();
  };
  const parseTerm = () => {
    let r = parseFactor();
    skipSpaces();
    while (i < n && (s[i] === '*' || s[i] === '/')) {
      const op = s[i];
      i++;
      const v = parseFactor();
      r = op === '*' ? r * v : Math.trunc(r / v);
      skipSpaces();
    }
    return r;
  };
  const parseExpr = () => {
    let r = parseTerm();
    skipSpaces();
    while (i < n && (s[i] === '+' || s[i] === '-')) {
      const op = s[i];
      i++;
      const v = parseTerm();
      r = op === '+' ? r + v : r - v;
      skipSpaces();
    }
    return r;
  };
  return parseExpr();
}

function referenceSolver_MinimumSizeSubarraySum(target, nums) {
  let left = 0, sum = 0, minLen = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {
      if (right - left + 1 < minLen) minLen = right - left + 1;
      sum -= nums[left];
      left++;
    }
  }
  return minLen === Infinity ? 0 : minLen;
}

function referenceSolver_IncreasingTripletSubsequence(nums) {
  let first = Infinity, second = Infinity;
  for (const x of nums) {
    if (x <= first) first = x;
    else if (x <= second) second = x;
    else return true;
  }
  return false;
}

function referenceSolver_ValidParenthesesString(s) {
  let low = 0, high = 0;
  for (const ch of s) {
    if (ch === '(') {
      low++; high++;
    } else if (ch === ')') {
      low = Math.max(low - 1, 0);
      high--;
    } else {
      low = Math.max(low - 1, 0);
      high++;
    }
    if (high < 0) return false;
  }
  return low === 0;
}

module.exports = {
  referenceSolver_BinarySearch,
  referenceSolver_WordSearch,
  referenceSolver_NumberOfIslands,
  referenceSolver_CourseSchedule,
  referenceSolver_ValidPalindromeII,
  referenceSolver_LetterCombinations,
  referenceSolver_BasicCalculatorIII,
  referenceSolver_MinimumSizeSubarraySum,
  referenceSolver_IncreasingTripletSubsequence,
  referenceSolver_ValidParenthesesString,
};
