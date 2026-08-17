// === Seeded Random (deterministic per seed) ===
let _seed = 42;
function srand(seed) { _seed = seed >>> 0; }
function rand() {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
function randInt(min, max) { // inclusive
  return Math.floor(rand() * (max - min + 1)) + min;
}

// === Output Formatting ===
function fBool(b) { return b ? 'true' : 'false'; }
function fArr(arr) { return JSON.stringify(arr); }

// === Input Generation Helpers ===
function genNumArray(len, min, max) {
  const arr = [];
  for (let i = 0; i < len; i++) arr.push(randInt(min, max));
  return arr;
}
function genSortedArray(len, min, max) {
  return genNumArray(len, min, max).sort((a, b) => a - b);
}
function genUniqueSorted(len, min, max) {
  const set = new Set();
  while (set.size < len) set.add(randInt(min, max));
  return [...set].sort((a, b) => a - b);
}
function genLowerStr(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

// Simple expression evaluator for Basic Calculator III
function evalExpr(s) {
  let i = 0;
  const parseNum = () => {
    let num = 0;
    while (i < s.length && /\d/.test(s[i])) {
      num = num * 10 + (s.charCodeAt(i) - 48);
      i++;
    }
    return num;
  };
  const parseFactor = () => {
    if (s[i] === '(') { i++; const r = parseTerm(); i++; return r; }
    if (s[i] === '-') { i++; return -parseFactor(); }
    if (s[i] === '+') { i++; return parseFactor(); }
    return parseNum();
  };
  const parseTerm = () => {
    let r = parseFactor();
    while (i < s.length && (s[i] === '*' || s[i] === '/')) {
      const op = s[i]; i++;
      const rv = parseFactor();
      r = op === '*' ? r * rv : Math.trunc(r / rv);
    }
    return r;
  };
  const parseExpr = () => {
    let r = parseTerm();
    while (i < s.length && (s[i] === '+' || s[i] === '-')) {
      const op = s[i]; i++;
      const rv = parseTerm();
      r = op === '+' ? r + rv : r - rv;
    }
    return r;
  };
  return parseExpr();
}


function genUpperStr(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}


const SOLVERS = {};﻿// [1] Two Sum
SOLVERS['Two Sum'] = {
  solve(input) {
    const lines = input.split('\n');
    const nums = JSON.parse(lines[0]);
    const target = parseInt(lines[1]);
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
      const complement = target - nums[i];
      if (map.has(complement)) return JSON.stringify([map.get(complement), i]);
      map.set(nums[i], i);
    }
    return '[]';
  },
  gen(i) {
    srand(1000 + i * 7);
    if (i < 2) return ['[2,7,11,15]\n9', '[3,2,4]\n6'][i];
    const len = randInt(2, 10);
    const nums = genNumArray(len, 0, 20);
    const a = randInt(0, len - 1);
    let b = randInt(0, len - 1);
    while (b === a) b = randInt(0, len - 1);
    const target = nums[a] + nums[b];
    return JSON.stringify(nums) + '\n' + target;
  }
};

// [2] Valid Parentheses
SOLVERS['Valid Parentheses'] = {
  solve(input) {
    const s = input.replace(/\n$/, '');
    const stack = [];
    const pairs = { ')': '(', '}': '{', ']': '[' };
    for (const c of s) {
      if (c === '(' || c === '{' || c === '[') stack.push(c);
      else if (pairs[c] !== stack.pop()) return 'false';
    }
    return stack.length === 0 ? 'true' : 'false';
  },
  gen(i) {
    srand(1500 + i * 11);
    if (i < 2) return ['()', '()[]{}'][i];
    const len = randInt(2, 8);
    const chars = ['(', ')', '{', '}', '[', ']'];
    let s = '';
    for (let k = 0; k < len; k++) s += chars[randInt(0, 5)];
    return s;
  }
};

// [3] Roman to Integer
SOLVERS['Roman to Integer'] = {
  solve(input) {
    const s = input.replace(/\n$/, '');
    const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let res = 0;
    for (let i = 0; i < s.length; i++) {
      const v = map[s[i]];
      if (i < s.length - 1 && v < map[s[i + 1]]) res -= v;
      else res += v;
    }
    return String(res);
  },
  gen(i) {
    srand(2000 + i * 13);
    if (i < 2) return ['III', 'IV'][i];
    const romans = ['I', 'V', 'X', 'L', 'C', 'D', 'M'];
    let s = '';
    for (let k = 0; k < randInt(1, 8); k++) s += romans[randInt(0, 6)];
    return s;
  }
};

// [4] Merge Two Sorted Lists
SOLVERS['Merge Two Sorted Lists'] = {
  solve(input) {
    const lines = input.split('\n');
    const l1 = JSON.parse(lines[0]);
    const l2 = JSON.parse(lines[1]);
    const dummy = { val: 0, next: null };
    let curr = dummy;
    while (l1 && l2) {
      if (l1.val < l2.val) { curr.next = l1; l1 = l1.next; }
      else { curr.next = l2; l2 = l2.next; }
      curr = curr.next;
    }
    curr.next = l1 || l2;
    return JSON.stringify(dummy.next);
  },
  gen(i) {
    srand(2500 + i * 13);
    if (i < 1) return '[1,2,4]\n[1,3,4]';
    const a = genSortedArray(randInt(2, 5), 1, 10);
    const b = genSortedArray(randInt(2, 5), 1, 10);
    return JSON.stringify(a) + '\n' + JSON.stringify(b);
  }
};

// [5] Valid Palindrome
SOLVERS['Valid Palindrome'] = {
  solve(input) {
    const s = input.replace(/\n$/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    let l = 0, r = s.length - 1;
    while (l < r) {
      if (s[l] !== s[r]) return 'false';
      l++; r--;
    }
    return 'true';
  },
  gen(i) {
    srand(3000 + i * 17);
    if (i < 2) return ['A man, a plan, a canal: Panama', 'race a car'][i];
    const len = randInt(3, 15);
    return genLowerStr(len);
  }
};

// [6] Best Time to Buy and Sell Stock
SOLVERS['Best Time to Buy and Sell Stock'] = {
  solve(input) {
    const prices = JSON.parse(input);
    let min = Infinity, max = 0;
    for (const p of prices) {
      min = Math.min(min, p);
      max = Math.max(max, p - min);
    }
    return String(max);
  },
  gen(i) {
    srand(3500 + i * 19);
    if (i < 2) return ['[7,1,5,3,6,4]', '[7,6,4,3,1]'][i];
    return JSON.stringify(genNumArray(randInt(2, 10), 1, 20));
  }
};

// [7] Move Zeroes
SOLVERS['Move Zeroes'] = {
  solve(input) {
    const nums = JSON.parse(input);
    let j = 0;
    for (let i = 0; i < nums.length; i++)
      if (nums[i] !== 0) { [nums[i], nums[j]] = [nums[j], nums[i]]; j++; }
    return JSON.stringify(nums);
  },
  gen(i) {
    srand(4000 + i * 23);
    if (i < 1) return '[0,1,0,3,12]';
    const nums = genNumArray(randInt(3, 10), 0, 5);
    for (let k = 0; k < Math.floor(nums.length / 3); k++)
      nums[randInt(0, nums.length - 1)] = 0;
    return JSON.stringify(nums);
  }
};

// [8] Contains Duplicate
SOLVERS['Contains Duplicate'] = {
  solve(input) {
    const nums = JSON.parse(input);
    const set = new Set();
    for (const n of nums) {
      if (set.has(n)) return 'true';
      set.add(n);
    }
    return 'false';
  },
  gen(i) {
    srand(4500 + i * 29);
    if (i < 2) return ['[1,2,3,1]', '[1,2,3,4]'][i];
    const hasDup = i % 2 === 0;
    const nums = hasDup ? [1, 1, 2, 3] : [1, 2, 3, 4];
    if (!hasDup) nums.push(randInt(5, 10));
    return JSON.stringify(nums);
  }
};

// [9] Pascal's Triangle
SOLVERS['Pascal\'s Triangle'] = {
  solve(input) {
    const n = parseInt(input.replace(/\n$/, ''), 10);
    const res = [];
    for (let i = 0; i < n; i++) {
      const row = [1];
      for (let j = 1; j < i; j++)
        row.push(res[i - 1][j - 1] + res[i - 1][j]);
      if (i > 0) row.push(1);
      res.push(row);
    }
    return JSON.stringify(res);
  },
  gen(i) {
    srand(5000 + i * 31);
    if (i < 2) return ['5', '1'][i];
    return String(randInt(1, 8));
  }
};

// [10] Remove Duplicates from Sorted Array
SOLVERS['Remove Duplicates from Sorted Array'] = {
  solve(input) {
    const nums = JSON.parse(input);
    let j = 0;
    for (let i = 1; i < nums.length; i++)
      if (nums[i] !== nums[j]) { j++; nums[j] = nums[i]; }
    return JSON.stringify(nums.slice(0, j + 1));
  },
  gen(i) {
    srand(5500 + i * 37);
    if (i < 2) return ['[1,1,2]', '[0,0,1,1,1,2,2,3,3,4]'][i];
    const nums = [];
    const uniq = genUniqueSorted(randInt(3, 8), 1, 10);
    for (const u of uniq) {
      const count = randInt(1, 4);
      for (let k = 0; k < count; k++) nums.push(u);
    }
    return JSON.stringify(nums);
  }
};

// [11] Rotate Array
SOLVERS['Rotate Array'] = {
  solve(input) {
    const [nums, k] = [JSON.parse(input.split('\n')[0]), parseInt(input.split('\n')[1])];
    const n = nums.length, r = k % n;
    const res = new Array(n);
    for (let i = 0; i < n; i++) res[(i + r) % n] = nums[i];
    return JSON.stringify(res);
  },
  gen(i) {
    srand(6000 + i * 41);
    if (i < 1) return '[1,2,3,4,5,6,7]\n3';
    const nums = genNumArray(randInt(3, 10), 1, 10);
    const k = randInt(1, nums.length * 2);
    return JSON.stringify(nums) + '\n' + k;
  }
};

// [12] Product of Array Except Self
SOLVERS['Product of Array Except Self'] = {
  solve(input) {
    const nums = JSON.parse(input);
    const n = nums.length;
    const res = new Array(n).fill(1);
    let left = 1, right = 1;
    for (let i = 0; i < n; i++) { res[i] *= left; left *= nums[i]; }
    for (let i = n - 1; i >= 0; i--) { res[i] *= right; right *= nums[i]; }
    return JSON.stringify(res);
  },
  gen(i) {
    srand(6500 + i * 43);
    if (i < 1) return '[1,2,3,4]';
    return JSON.stringify(genNumArray(randInt(3, 10), 1, 5));
  }
};

// [13] Maximum Subarray
SOLVERS['Maximum Subarray'] = {
  solve(input) {
    const nums = JSON.parse(input);
    let max = nums[0], cur = nums[0];
    for (let i = 1; i < nums.length; i++) {
      cur = Math.max(nums[i], cur + nums[i]);
      max = Math.max(max, cur);
    }
    return String(max);
  },
  gen(i) {
    srand(7000 + i * 47);
    if (i < 2) return ['[-2,1,-3,4,-1,2,1,-5,4]', '[1]'][i];
    return JSON.stringify(genNumArray(randInt(3, 12), -10, 10));
  }
};

// [14] Merge Intervals
SOLVERS['Merge Intervals'] = {
  solve(input) {
    const intervals = JSON.parse(input);
    intervals.sort((a, b) => a[0] - b[0]);
    const res = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i][0] <= res[res.length - 1][1])
        res[res.length - 1][1] = Math.max(res[res.length - 1][1], intervals[i][1]);
      else res.push(intervals[i]);
    }
    return JSON.stringify(res);
  },
  gen(i) {
    srand(7500 + i * 53);
    if (i < 1) return '[[1,3],[2,6],[8,10],[15,18]]';
    const n = randInt(2, 6);
    const intervals = [];
    for (let j = 0; j < n; j++) {
      const s = randInt(0, 10);
      intervals.push([s, s + randInt(1, 5)]);
    }
    return JSON.stringify(intervals);
  }
};

// [15] Set Matrix Zeroes
SOLVERS['Set Matrix Zeroes'] = {
  solve(input) {
    const matrix = JSON.parse(input);
    const rows = matrix.length, cols = matrix[0].length;
    const zeroRows = new Set(), zeroCols = new Set();
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (matrix[r][c] === 0) { zeroRows.add(r); zeroCols.add(c); }
    for (const r of zeroRows)
      for (let c = 0; c < cols; c++) matrix[r][c] = 0;
    for (const c of zeroCols)
      for (let r = 0; r < rows; r++) matrix[r][c] = 0;
    return JSON.stringify(matrix);
  },
  gen(i) {
    srand(8000 + i * 59);
    if (i < 1) return '[[1,1,1],[1,0,1],[1,1,1]]';
    const rows = randInt(2, 4), cols = randInt(2, 4);
    const matrix = Array.from({ length: rows }, () => genNumArray(cols, 0, 3));
    if (i % 2 === 0) matrix[randInt(0, rows - 1)][randInt(0, cols - 1)] = 0;
    return JSON.stringify(matrix);
  }
};

// [16] 3Sum
SOLVERS['3Sum'] = {
  solve(input) {
    const nums = JSON.parse(input);
    nums.sort((a, b) => a - b);
    const res = [];
    for (let i = 0; i < nums.length - 2; i++) {
      if (i > 0 && nums[i] === nums[i - 1]) continue;
      let l = i + 1, r = nums.length - 1;
      while (l < r) {
        const sum = nums[i] + nums[l] + nums[r];
        if (sum === 0) {
          res.push([nums[i], nums[l], nums[r]]);
          while (l < r && nums[l] === nums[l + 1]) l++;
          while (l < r && nums[r] === nums[r - 1]) r--;
          l++; r--;
        } else if (sum < 0) l++;
        else r--;
      }
    }
    return JSON.stringify(res);
  },
  gen(i) {
    srand(8500 + i * 61);
    if (i < 2) return ['[-1,0,1,2,-1,-4]', '[]'][i];
    const nums = genNumArray(randInt(3, 10), -5, 5);
    if (i % 3 === 0) { nums.push(-nums[0]); nums.push(-nums[0]); }
    return JSON.stringify(nums);
  }
};

// [17] Container With Most Water
SOLVERS['Container With Most Water'] = {
  solve(input) {
    const heights = JSON.parse(input);
    let l = 0, r = heights.length - 1, max = 0;
    while (l < r) {
      max = Math.max(max, Math.min(heights[l], heights[r]) * (r - l));
      if (heights[l] < heights[r]) l++;
      else r--;
    }
    return String(max);
  },
  gen(i) {
    srand(9000 + i * 67);
    if (i < 1) return '[1,8,6,2,5,4,8,3,7]';
    return JSON.stringify(genNumArray(randInt(2, 10), 1, 10));
  }
};

// [18] Maximum Product Subarray
SOLVERS['Maximum Product Subarray'] = {
  solve(input) {
    const nums = JSON.parse(input);
    let max = nums[0], min = nums[0], res = nums[0];
    for (let i = 1; i < nums.length; i++) {
      const tmp = max;
      max = Math.max(nums[i], Math.max(max * nums[i], min * nums[i]));
      min = Math.min(nums[i], Math.min(tmp * nums[i], min * nums[i]));
      res = Math.max(res, max);
    }
    return String(res);
  },
  gen(i) {
    srand(9500 + i * 71);
    if (i < 2) return ['[2,3,-2,4]', '[-2,0,-1]'][i];
    return JSON.stringify(genNumArray(randInt(3, 10), -3, 4));
  }
};

// [19] Find Peak Element
SOLVERS['Find Peak Element'] = {
  solve(input) {
    const nums = JSON.parse(input);
    let l = 0, r = nums.length - 1;
    while (l < r) {
      const mid = (l + r) >> 1;
      if (nums[mid] > nums[mid + 1]) r = mid;
      else l = mid + 1;
    }
    return String(l);
  },
  gen(i) {
    srand(10000 + i * 73);
    if (i < 2) return ['[1,2,3,1]', '[1,2,1,3,5,6,4]'][i];
    const nums = genNumArray(randInt(3, 10), 1, 10);
    return JSON.stringify(nums);
  }
};

// [20] Sort Colors
SOLVERS['Sort Colors'] = {
  solve(input) {
    const nums = JSON.parse(input);
    let l = 0, i = 0, r = nums.length - 1;
    while (i <= r) {
      if (nums[i] === 0) { [nums[l], nums[i]] = [nums[i], nums[l]]; l++; i++; }
      else if (nums[i] === 2) { [nums[i], nums[r]] = [nums[r], nums[i]]; r--; }
      else i++;
    }
    return JSON.stringify(nums);
  },
  gen(i) {
    srand(10500 + i * 79);
    if (i < 1) return '[2,0,2,1,1,0]';
    const nums = genNumArray(randInt(4, 10), 0, 2);
    return JSON.stringify(nums);
  }
};

// [21] First Missing Positive
SOLVERS['First Missing Positive'] = {
    solve(input) {
    const nums = JSON.parse(input);
    // Safe, guaranteed-terminating reference solution for "First Missing Positive".
    // (The previous in-place cyclic-sort could infinite-loop on certain inputs.)
    const set = new Set(nums);
    let ans = 1;
    while (set.has(ans)) ans++;
    return String(ans);
  },
  gen(i) {
    srand(11000 + i * 83);
    if (i < 2) return ['[1,2,0]', '[3,4,-1,1]'][i];
    const nums = genNumArray(randInt(3, 10), -5, 10);
    return JSON.stringify(nums);
  }
};

// [22] Median of Two Sorted Arrays
SOLVERS['Median of Two Sorted Arrays'] = {
  solve(input) {
    const [nums1, nums2] = input.split('\n').map(JSON.parse);
    const merged = [];
    let i = 0, j = 0;
    while (i < nums1.length && j < nums2.length) {
      if (nums1[i] <= nums2[j]) merged.push(nums1[i++]);
      else merged.push(nums2[j++]);
    }
    while (i < nums1.length) merged.push(nums1[i++]);
    while (j < nums2.length) merged.push(nums2[j++]);
    const mid = merged.length / 2;
    if (merged.length % 2 === 0) return String((merged[mid - 1] + merged[mid]) / 2);
    else return String(merged[Math.floor(mid)]);
  },
  gen(i) {
    srand(11500 + i * 89);
    if (i < 1) return '[1,3]\n[2]';
    const a = genSortedArray(randInt(2, 5), 1, 20);
    const b = genSortedArray(randInt(2, 5), 1, 20);
    return JSON.stringify(a) + '\n' + JSON.stringify(b);
  }
};

// [23] Trapping Rain Water
SOLVERS['Trapping Rain Water'] = {
  solve(input) {
    const height = JSON.parse(input);
    let l = 0, r = height.length - 1, lMax = 0, rMax = 0, water = 0;
    while (l < r) {
      if (height[l] < height[r]) {
        height[l] >= lMax ? lMax = height[l] : water += lMax - height[l];
        l++;
      } else {
        height[r] >= rMax ? rMax = height[r] : water += rMax - height[r];
        r--;
      }
    }
    return String(water);
  },
  gen(i) {
    srand(12000 + i * 97);
    if (i < 2) return ['[0,1,0,2,1,0,1,3,2,1,2,1]', '[4,2,0,3,2,5]'][i];
    const len = randInt(3, 10);
    const height = genNumArray(len, 0, 5);
    return JSON.stringify(height);
  }
};

// [24] Longest Common Prefix
SOLVERS['Longest Common Prefix'] = {
  solve(input) {
    const strs = JSON.parse(input);
    if (!strs.length) return '\"\"';
    let prefix = strs[0];
    for (let i = 1; i < strs.length; i++) {
      let j = 0;
      while (j < prefix.length && j < strs[i].length && prefix[j] === strs[i][j]) j++;
      prefix = prefix.slice(0, j);
      if (!prefix) return '\"\"';
    }
    return JSON.stringify(prefix);
  },
  gen(i) {
    srand(12500 + i * 103);
    if (i < 1) return '[\"flower\",\"flow\",\"flight\"]';
    const n = randInt(2, 5);
    const strs = [];
    const prefix = genLowerStr(randInt(1, 4));
    for (let j = 0; j < n; j++)
      strs.push(prefix + genLowerStr(randInt(0, 3)));
    return JSON.stringify(strs);
  }
};

// [25] Valid Anagram
SOLVERS['Valid Anagram'] = {
  solve(input) {
    const [s, t] = input.split('\n');
    if (s.length !== t.length) return 'false';
    const count = new Map();
    for (const c of s) count.set(c, (count.get(c) || 0) + 1);
    for (const c of t) {
      if (!count.has(c)) return 'false';
      count.set(c, count.get(c) - 1);
      if (count.get(c) === 0) count.delete(c);
    }
    return count.size === 0 ? 'true' : 'false';
  },
  gen(i) {
    srand(13000 + i * 107);
    if (i < 2) return ['anagram\nmargana', 'rat\ncar'][i];
    const len = randInt(2, 8);
    const s = genLowerStr(len);
    const t = i % 2 === 0 ? s.split('').sort().join('') : s.split('').reverse().join('');
    return s + '\n' + t;
  }
};

// [26] Longest Substring Without Repeating
SOLVERS['Longest Substring Without Repeating'] = {
  solve(input) {
    const s = input.replace(/\n$/, '');
    const map = new Map();
    let l = 0, max = 0;
    for (let r = 0; r < s.length; r++) {
      if (map.has(s[r])) l = Math.max(l, map.get(s[r]) + 1);
      map.set(s[r], r);
      max = Math.max(max, r - l + 1);
    }
    return String(max);
  },
  gen(i) {
    srand(13500 + i * 109);
    if (i < 2) return ['abcabcbb', 'bbbbb'][i];
    const len = randInt(3, 12);
    return genLowerStr(len);
  }
};

// [27] Longest Palindromic Substring
SOLVERS['Longest Palindromic Substring'] = {
  solve(input) {
    const s = input.replace(/\n$/, '');
    let start = 0, maxLen = 1;
    const expand = (l, r) => {
      while (l >= 0 && r < s.length && s[l] === s[r]) {
        if (r - l + 1 > maxLen) { maxLen = r - l + 1; start = l; }
        l--; r++;
      }
    };
    for (let i = 0; i < s.length; i++) {
      expand(i, i);
      expand(i, i + 1);
    }
    return JSON.stringify(s.slice(start, start + maxLen));
  },
  gen(i) {
    srand(14000 + i * 113);
    if (i < 2) return ['babad', 'cbbd'][i];
    const len = randInt(3, 15);
    return genLowerStr(len);
  }
};

// [28] Integer to Roman
SOLVERS['Integer to Roman'] = {
  solve(input) {
    const num = parseInt(input.replace(/\n$/, ''), 10);
    const vals = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
        let res = '';
    let n = num;
    for (const [v, sym] of vals)
      while (n >= v) { res += sym; n -= v; }
    return JSON.stringify(res);
  },
  gen(i) {
    srand(14500 + i * 127);
    if (i < 2) return ['3', '58'][i];
    return String(randInt(1, 3999));
  }
};

// [29] Group Anagrams
SOLVERS['Group Anagrams'] = {
  solve(input) {
    const strs = JSON.parse(input);
    const map = new Map();
    for (const s of strs) {
      const key = s.split('').sort().join('');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return JSON.stringify([...map.values()]);
  },
  gen(i) {
    srand(15000 + i * 131);
    if (i < 1) return '[\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]';
    const n = randInt(3, 8);
    const strs = [];
    const groups = [];
    for (let j = 0; j < Math.ceil(n / 2); j++)
      groups.push(genLowerStr(randInt(2, 5)));
    for (let j = 0; j < n; j++)
      strs.push(groups[randInt(0, groups.length - 1)]);
    return JSON.stringify(strs);
  }
};

// [30] Longest Repeating Character Replacement
SOLVERS['Longest Repeating Character Replacement'] = {
  solve(input) {
    const [s, k] = input.split('\n');
    const count = new Map();
    let l = 0, maxFreq = 0, maxLen = 0;
    for (let r = 0; r < s.length; r++) {
      count.set(s[r], (count.get(s[r]) || 0) + 1);
      maxFreq = Math.max(maxFreq, count.get(s[r]));
      while (r - l + 1 - parseInt(k) > maxFreq) {
        count.set(s[l], count.get(s[l]) - 1);
        l++;
      }
      maxLen = Math.max(maxLen, r - l + 1);
    }
    return String(maxLen);
  },
  gen(i) {
    srand(15500 + i * 137);
    if (i < 2) return ['ABAB\n2', 'AABABBA\n1'][i];
    const len = randInt(3, 10);
    return genLowerStr(len) + '\n' + randInt(1, 3);
  }
};

// [31] Generate Parentheses
SOLVERS['Generate Parentheses'] = {
  solve(input) {
    const n = parseInt(input.replace(/\n$/, ''), 10);
    const res = [];
    const dfs = (open, close, path) => {
      if (path.length === n * 2) { res.push(path); return; }
      if (open < n) dfs(open + 1, close, path + '(');
      if (close < open) dfs(open, close + 1, path + ')');
    };
    dfs(0, 0, '');
    return JSON.stringify(res);
  },
  gen(i) {
    srand(16000 + i * 139);
    if (i < 2) return ['3', '1'][i];
    return String(randInt(1, 5));
  }
};

// [32] Minimum Window Substring
SOLVERS['Minimum Window Substring'] = {
  solve(input) {
    const [s, t] = input.split('\n');
    if (!t) return '\"\"';
    const need = new Map();
    for (const c of t) need.set(c, (need.get(c) || 0) + 1);
    let l = 0, formed = 0, minLen = Infinity, start = 0;
    const window = new Map();
    for (let r = 0; r < s.length; r++) {
      window.set(s[r], (window.get(s[r]) || 0) + 1);
      if (need.has(s[r]) && window.get(s[r]) === need.get(s[r])) formed++;
      while (formed === need.size) {
        if (r - l + 1 < minLen) { minLen = r - l + 1; start = l; }
        window.set(s[l], window.get(s[l]) - 1);
        if (need.has(s[l]) && window.get(s[l]) < need.get(s[l])) formed--;
        l++;
      }
    }
    return minLen === Infinity ? '\"\"' : JSON.stringify(s.slice(start, start + minLen));
  },
  gen(i) {
    srand(16500 + i * 149);
    if (i < 2) return ['ADOBECODEBANC\nABC', 'a\na'][i];
    const s = genUpperStr(randInt(5, 10));
    const tLen = randInt(1, 3);
    let t = '';
    for (let k = 0; k < tLen; k++) t += s[randInt(0, s.length - 1)];
    return s + '\n' + t;
  }
};

// [33] Zigzag Conversion
SOLVERS['Zigzag Conversion'] = {
  solve(input) {
    const [s, numRows] = input.split('\n');
    if (numRows == 1 || s.length <= numRows) return JSON.stringify(s);
    const rows = Array.from({ length: numRows }, () => '');
    let curRow = 0, goingDown = false;
    for (const c of s) {
      rows[curRow] += c;
      if (curRow === 0 || curRow === numRows - 1) goingDown = !goingDown;
      curRow += goingDown ? 1 : -1;
    }
    return JSON.stringify(rows.join(''));
  },
  gen(i) {
    srand(17000 + i * 151);
    if (i < 2) return ['PAYPALISHIRING\n3', 'PAYPALISHIRING\n4'][i];
    const s = genUpperStr(randInt(5, 12));
    const numRows = randInt(2, 5);
    return s + '\n' + numRows;
  }
};

// [34] String to Integer (atoi)
SOLVERS['String to Integer'] = {
  solve(input) {
    const s = input.replace(/\n$/, '').trim();
    let i = 0, sign = 1, res = 0;
    while (i < s.length && s[i] === ' ') i++;
    if (s[i] === '+' || s[i] === '-') {
      sign = s[i] === '-' ? -1 : 1;
      i++;
    }
    while (i < s.length && s[i] >= '0' && s[i] <= '9') {
      res = res * 10 + (s.charCodeAt(i) - 48);
      i++;
    }
    return String(Math.max(-2147483648, Math.min(2147483647, res * sign)));
  },
  gen(i) {
    srand(17500 + i * 157);
    if (i < 3) return ['42', '   -42', '4193 with words'][i];
    const num = randInt(-1000, 1000);
    const prefix = Math.random() > 0.5 ? genLowerStr(randInt(0, 3)) : '';
    const suffix = Math.random() > 0.5 ? genLowerStr(randInt(0, 3)) : '';
    return prefix + num + suffix;
  }
};

// [35] Multiply Strings
SOLVERS['Multiply Strings'] = {
  solve(input) {
    const [num1, num2] = input.split('\n');
    if (num1 === '0' || num2 === '0') return '\"0\"';
    const m = num1.length, n = num2.length;
    const res = new Array(m + n).fill(0);
    for (let i = m - 1; i >= 0; i--)
      for (let j = n - 1; j >= 0; j--) {
        const prod = (num1[i].charCodeAt(0) - 48) * (num2[j].charCodeAt(0) - 48);
        const p1 = i + j, p2 = i + j + 1;
        const sum = prod + res[p2];
        res[p2] = sum % 10;
        res[p1] += Math.floor(sum / 10);
      }
    return JSON.stringify(parseInt(res.join('')));
  },
  gen(i) {
    srand(18000 + i * 163);
    if (i < 1) return '2\n3';
    const len1 = randInt(1, 4);
    const len2 = randInt(1, 4);
    const num1 = genLowerStr(len1).replace(/[a-z]/g, () => String(randInt(0, 9)));
    const num2 = genLowerStr(len2).replace(/[a-z]/g, () => String(randInt(0, 9)));
    return num1 + '\n' + num2;
  }
};

// [36] Implement strStr()
SOLVERS['Implement strStr'] = {
  solve(input) {
    const [haystack, needle] = input.split('\n');
    if (!needle) return '0';
    for (let i = 0; i <= haystack.length - needle.length; i++)
      if (haystack.slice(i, i + needle.length) === needle) return String(i);
    return '-1';
  },
  gen(i) {
    srand(18500 + i * 167);
    if (i < 2) return ['hello\nll', 'aaaaa\nbba'][i];
    const hLen = randInt(3, 8);
    const nLen = randInt(1, 3);
    const haystack = genLowerStr(hLen);
    const needle = i % 2 === 0 ? haystack.slice(1, 1 + nLen) : genLowerStr(nLen);
    return haystack + '\n' + needle;
  }
};

// [37] Count and Say
SOLVERS['Count and Say'] = {
  solve(input) {
    const n = parseInt(input.replace(/\n$/, ''), 10);
    let res = '1';
    for (let i = 1; i < n; i++) {
      let next = '', count = 1;
      for (let j = 1; j < res.length; j++) {
        if (res[j] === res[j - 1]) count++;
        else { next += count + res[j - 1]; count = 1; }
      }
      next += count + res[res.length - 1];
      res = next;
    }
    return JSON.stringify(res);
  },
  gen(i) {
    srand(19000 + i * 173);
    if (i < 2) return ['1', '4'][i];
    return String(randInt(1, 6));
  }
};

// [38] Climbing Stairs
SOLVERS['Climbing Stairs'] = {
  solve(input) {
    const n = parseInt(input.replace(/\n$/, ''), 10);
    if (n <= 2) return String(n);
    let a = 1, b = 2;
    for (let i = 3; i <= n; i++) { const tmp = a + b; a = b; b = tmp; }
    return String(b);
  },
  gen(i) {
    srand(19500 + i * 179);
    if (i < 2) return ['2', '3'][i];
    return String(randInt(2, 20));
  }
};

// [39] House Robber
SOLVERS['House Robber'] = {
  solve(input) {
    const nums = JSON.parse(input);
    if (!nums.length) return '0';
    let prev = 0, curr = 0;
    for (const n of nums) { const tmp = curr; curr = Math.max(curr, prev + n); prev = tmp; }
    return String(curr);
  },
  gen(i) {
    srand(20000 + i * 181);
    if (i < 2) return ['[1,2,3,1]', '[2,7,9,3,1]'][i];
    return JSON.stringify(genNumArray(randInt(3, 10), 1, 10));
  }
};

// [40] Longest Increasing Subsequence
SOLVERS['Longest Increasing Subsequence'] = {
  solve(input) {
    const nums = JSON.parse(input);
    const dp = new Array(nums.length).fill(1);
    let max = 1;
    for (let i = 1; i < nums.length; i++) {
      for (let j = 0; j < i; j++)
        if (nums[i] > nums[j]) dp[i] = Math.max(dp[i], dp[j] + 1);
      max = Math.max(max, dp[i]);
    }
    return String(max);
  },
  gen(i) {
    srand(20500 + i * 191);
    if (i < 2) return ['[10,9,2,5,3,7,101,18]', '[0,1,0,3,2,3]'][i];
    return JSON.stringify(genNumArray(randInt(3, 20), 0, 100));
  }
};

// [41] Coin Change
SOLVERS['Coin Change'] = {
  solve(input) {
    const lines = input.split('\n');
    const coins = JSON.parse(lines[0]);
    const amount = parseInt(lines[1]);
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    for (const c of coins)
      for (let i = c; i <= amount; i++)
        dp[i] = Math.min(dp[i], dp[i - c] + 1);
    return dp[amount] === Infinity ? '-1' : String(dp[amount]);
  },
  gen(i) {
    srand(21000 + i * 193);
    if (i < 2) return ['[1,2,5]\n11', '[2]\n3'][i];
    const coins = genUniqueSorted(randInt(2, 5), 1, 10);
    const amount = randInt(1, 50);
    return JSON.stringify(coins) + '\n' + amount;
  }
};

// [42] Edit Distance
SOLVERS['Edit Distance'] = {
  solve(input) {
    const [word1, word2] = input.split('\n');
    const m = word1.length, n = word2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++) {
        if (word1[i - 1] === word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
        else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    return String(dp[m][n]);
  },
  gen(i) {
    srand(21500 + i * 197);
    if (i < 2) return ['horse\nros', 'intention\nexecution'][i];
    const len1 = randInt(2, 6);
    const len2 = randInt(2, 6);
    return genLowerStr(len1) + '\n' + genLowerStr(len2);
  }
};

// [43] Word Break
SOLVERS['Word Break'] = {
  solve(input) {
    const [s, wordDict] = input.split('\n');
    const words = new Set(JSON.parse(wordDict));
    const dp = new Array(s.length + 1).fill(false);
    dp[0] = true;
    for (let i = 1; i <= s.length; i++)
      for (let j = 0; j < i; j++)
        if (dp[j] && words.has(s.slice(j, i))) { dp[i] = true; break; }
    return fBool(dp[s.length]);
  },
  gen(i) {
    srand(22000 + i * 199);
    if (i < 2) return ['leetcode\n[\"leet\",\"code\"]', 'applepenapple\n[\"apple\",\"pen\"]'][i];
    const words = [];
    for (let k = 0; k < 3; k++) words.push(genLowerStr(randInt(2, 5)));
    let s = '';
    for (let k = 0; k < randInt(2, 4); k++) s += words[randInt(0, 2)];
    return s + '\n' + JSON.stringify(words);
  }
};

// [44] Binary Tree Inorder Traversal
SOLVERS['Binary Tree Inorder Traversal'] = {
  solve(input) {
    const root = JSON.parse(input);
    const res = [];
    const dfs = (node) => { if (!node) return; dfs(node.left); res.push(node.val); dfs(node.right); };
    dfs(root);
    return JSON.stringify(res);
  },
  gen(i) {
    srand(22500 + i * 211);
    if (i < 2) return ['{"val":1,"left":{"val":2,"left":{"val":3,"left":null,"right":null},"right":null},"right":null}', '{"val":1,"left":null,"right":{"val":2,"left":null,"right":{"val":3,"left":null,"right":null}}}'][i];
    const build = (depth) => { if (depth === 0) return null; return { val: randInt(1, 10), left: build(depth - 1), right: build(depth - 1) }; };
    const maxD = randInt(1, 3);
    return JSON.stringify(build(maxD));
  }
};

// [45] Binary Tree Level Order Traversal
SOLVERS['Binary Tree Level Order Traversal'] = {
  solve(input) {
    const root = JSON.parse(input);
    if (!root) return '[]';
    const res = [];
    const q = [root];
    while (q.length) {
      const size = q.length;
      const level = [];
      for (let i = 0; i < size; i++) {
        const n = q.shift();
        level.push(n.val);
        if (n.left) q.push(n.left);
        if (n.right) q.push(n.right);
      }
      res.push(level);
    }
    return JSON.stringify(res);
  },
  gen(i) {
    srand(23000 + i * 223);
    if (i < 1) return '{"val":3,"left":{"val":9,"left":null,"right":null},"right":{"val":20,"left":{"val":15,"left":null,"right":null},"right":{"val":7,"left":null,"right":null}}}';
    const build = (depth) => { if (depth === 0) return null; return { val: randInt(1, 10), left: build(depth - 1), right: build(depth - 1) }; };
    return JSON.stringify(build(randInt(1, 3)));
  }
};

// [46] Validate Binary Search Tree
SOLVERS['Validate Binary Search Tree'] = {
  solve(input) {
    const root = JSON.parse(input);
    const dfs = (node, lo, hi) => {
      if (!node) return true;
      if (node.val <= lo || node.val >= hi) return false;
      return dfs(node.left, lo, node.val) && dfs(node.right, node.val, hi);
    };
    return fBool(dfs(root, -Infinity, Infinity));
  },
  gen(i) {
    srand(23500 + i * 227);
    if (i < 2) return ['{"val":2,"left":{"val":1,"left":null,"right":null},"right":{"val":3,"left":null,"right":null}}', '{"val":5,"left":{"val":1,"left":null,"right":null},"right":{"val":4,"left":{"val":3,"left":null,"right":null},"right":{"val":6,"left":null,"right":null}}}'][i];
    const build = (lo, hi, depth) => { if (depth === 0) return null; const val = randInt(lo + 1, hi - 1); if (val <= lo || val >= hi) return null; return { val, left: build(lo, val, depth - 1), right: build(val, hi, depth - 1) }; };
    return JSON.stringify(build(0, 100, randInt(1, 3)));
  }
};

// [47] Binary Tree Maximum Path Sum
SOLVERS['Binary Tree Maximum Path Sum'] = {
  solve(input) {
    const root = JSON.parse(input);
    let max = -Infinity;
    const dfs = (node) => {
      if (!node) return 0;
      const l = Math.max(0, dfs(node.left));
      const r = Math.max(0, dfs(node.right));
      max = Math.max(max, l + r + node.val);
      return Math.max(l, r) + node.val;
    };
    dfs(root);
    return String(max);
  },
  gen(i) {
    srand(24000 + i * 229);
    if (i < 2) return ['{"val":1,"left":{"val":2,"left":null,"right":null},"right":{"val":3,"left":null,"right":null}}', '{"val":-10,"left":{"val":9,"left":null,"right":null},"right":{"val":20,"left":{"val":15,"left":null,"right":null},"right":{"val":7,"left":null,"right":null}}}'][i];
    const build = (depth) => { if (depth === 0) return null; return { val: randInt(-5, 5), left: build(depth - 1), right: build(depth - 1) }; };
    return JSON.stringify(build(randInt(1, 3)));
  }
};

// [48] Same Tree
SOLVERS['Same Tree'] = {
  solve(input) {
    const lines = input.split('\n');
    const same = (a, b) => {
      if (!a && !b) return true;
      if (!a || !b || a.val !== b.val) return false;
      return same(a.left, b.left) && same(a.right, b.right);
    };
    return fBool(same(JSON.parse(lines[0]), JSON.parse(lines[1])));
  },
  gen(i) {
    srand(24500 + i * 233);
    const build = (depth) => { if (depth === 0) return null; return { val: randInt(1, 5), left: build(depth - 1), right: build(depth - 1) }; };
    const a = build(randInt(1, 3));
    const b = i % 2 === 0 ? JSON.parse(JSON.stringify(a)) : build(randInt(1, 3));
    return JSON.stringify(a) + '\n' + JSON.stringify(b);
  }
};

// [49] Symmetric Tree
SOLVERS['Symmetric Tree'] = {
  solve(input) {
    const root = JSON.parse(input);
    const same = (a, b) => {
      if (!a && !b) return true;
      if (!a || !b || a.val !== b.val) return false;
      return same(a.left, b.right) && same(a.right, b.left);
    };
    return fBool(same(root.left, root.right));
  },
  gen(i) {
    srand(25000 + i * 239);
    if (i < 2) return ['{"val":1,"left":{"val":2,"left":{"val":3,"left":null,"right":null},"right":{"val":4,"left":null,"right":null}},"right":{"val":2,"left":{"val":4,"left":null,"right":null},"right":{"val":3,"left":null,"right":null}}}', '{"val":1,"left":{"val":2,"left":null,"right":{"val":3,"left":null,"right":null}},"right":{"val":2,"left":null,"right":{"val":3,"left":null,"right":null}}}'][i];
    const build = (depth) => { if (depth === 0) return null; return { val: randInt(1, 5), left: build(depth - 1), right: build(depth - 1) }; };
    return JSON.stringify({ val: randInt(1, 5), left: build(randInt(1, 2)), right: build(randInt(1, 2)) });
  }
};

// [50] Maximum Depth of Binary Tree
SOLVERS['Maximum Depth of Binary Tree'] = {
  solve(input) {
    const root = JSON.parse(input);
    const dfs = (node) => { if (!node) return 0; return 1 + Math.max(dfs(node.left), dfs(node.right)); };
    return String(dfs(root));
  },
  gen(i) {
    srand(25500 + i * 241);
    if (i < 1) return '{"val":3,"left":{"val":9,"left":null,"right":null},"right":{"val":20,"left":{"val":15,"left":null,"right":null},"right":{"val":7,"left":null,"right":null}}}';
    const build = (depth) => { if (depth === 0) return null; return { val: randInt(1, 10), left: build(depth - 1), right: build(depth - 1) }; };
    return JSON.stringify(build(randInt(1, 5)));
  }
};

// [51] Path Sum
SOLVERS['Path Sum'] = {
  solve(input) {
    const lines = input.split('\n');
    const root = JSON.parse(lines[0]);
    const target = parseInt(lines[1]);
    const dfs = (node, sum) => {
      if (!node) return false;
      sum += node.val;
      if (!node.left && !node.right) return sum === target;
      return dfs(node.left, sum) || dfs(node.right, sum);
    };
    return fBool(dfs(root, 0));
  },
  gen(i) {
    srand(26000 + i * 251);
    if (i < 2) return ['{"val":5,"left":{"val":4,"left":{"val":11,"left":{"val":7,"left":null,"right":null},"right":{"val":2,"left":null,"right":null}},"right":null},"right":{"val":8,"left":{"val":13,"left":null,"right":null},"right":{"val":4,"left":null,"right":{"val":1,"left":null,"right":null}}}}\n22', '{"val":1,"left":{"val":2,"left":null,"right":null},"right":{"val":3,"left":null,"right":null}}\n5'][i];
    const build = (depth) => { if (depth === 0) return null; const v = randInt(1, 5); return { val: v, left: build(depth - 1), right: build(depth - 1) }; };
    const root = build(randInt(2, 4));
    const target = randInt(5, 20);
    return JSON.stringify(root) + '\n' + target;
  }
};

function generateTestCases(title, spec) {
  if (!title || !spec) return { examples: [], sampleTests: [], hiddenTests: [] };
  const solver = SOLVERS[title];
  if (!solver) return { examples: [], sampleTests: [], hiddenTests: [] };
  
  const examples = [];
  const sampleTests = [];
  const hiddenTests = [];
  
  for (let i = 0; i < 3; i++) {
    const input = solver.gen(i);
    const expectedOutput = solver.solve(input);
    sampleTests.push({
      input,
      output: expectedOutput,
      explanation: 'Sample test case ' + (i + 1),
      isHidden: false
    });
  }
  
  for (let i = 3; i < 53; i++) {
    const input = solver.gen(i);
    const expectedOutput = solver.solve(input);
    const categories = ['edge', 'stress', 'random'];
    hiddenTests.push({
      input,
      output: expectedOutput,
      category: categories[i % 3],
      isHidden: true
    });
  }
  
  return {
    examples,
    sampleTests,
    hiddenTests,
    visibleTestCases: sampleTests,
    hiddenTestCases: hiddenTests
  };
}

module.exports = { generateTestCases, SOLVERS };
