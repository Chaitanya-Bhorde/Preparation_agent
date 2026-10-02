'use strict';

/**
 * dsaBatch5ContentSearch.js
 * ---------------------------------------------------------------------------
 * Authored content for the Binary Search problems of batch 5.
 *
 * `cases` declare the INPUTS plus an `expect` that an INDEPENDENT oracle
 * (scripts/dsaBatch5Oracle.js) re-derives; dsa_batch5_build.js requires the
 * authored value, the oracle and the reference to agree before any write.
 *
 * Representations follow the catalogue: flat integer arrays for 1D inputs and
 * arrays of equal-length integer arrays for matrices. Where an index pair is
 * the answer it is returned as a two-element array [row, col], and an absent
 * target is reported as [-1, -1] rather than an empty array, so the return type
 * never varies in shape.
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

CONTENT['Sqrt(x)'] = {
  signature: lang('integerSqrt', [['x', 'number']], 'number'),
  description:
    'Given a non-negative integer x, return its square root rounded DOWN: the largest integer r such '
    + 'that r * r <= x. For example the floor of the square root of 8 is 2, because 2 * 2 = 4 <= 8 '
    + 'while 3 * 3 = 9 > 8. The floor of the square root of 0 is 0. The value must be exact, so '
    + 'floating-point arithmetic that rounds to the wrong integer does not count.',
  input: 'The single parameter `x` is the non-negative integer on the first line.',
  output: 'Return the largest integer r with r * r <= x.',
  constraints: [
    '0 <= x <= 2147483647',
  ],
  cases: [
    { visible: true, x: 4, expect: 2 },
    { visible: true, x: 8, expect: 2 },
    { visible: true, x: 0, expect: 0 },
    // x = 1 is the smallest non-trivial case.
    { visible: false, x: 1, expect: 1 },
    // 46340 * 46340 == 2147395600 exactly, so this is a perfect square at the top
    // of the range and its floor square root is 46340.
    { visible: false, x: 2147395600, expect: 46340 },
    // One below it: 46340 * 46340 now exceeds x, so the floor drops to 46339.
    { visible: false, x: 2147395599, expect: 46339 },
    // x = 3 is not a square.
    { visible: false, x: 3, expect: 1 },
    { visible: false, x: 2, expect: 1 },
    { visible: false, x: 99, expect: 9 },
    { visible: false, x: 100, expect: 10 },
    { visible: false, x: 101, expect: 10 },
    // A large square that a float sqrt would represent exactly.
    { visible: false, x: 1000000, expect: 1000 },
    // Just under a large square.
    { visible: false, x: 999999, expect: 999 },
    { visible: false, x: 46340, expect: 215 },
    // The largest input the constraints allow: 46341^2 would exceed it.
    { visible: false, x: 2147483647, expect: 46340 },
  ],
  reference: `function integerSqrt(x) {
  // Binary search over [0, x]. Multiplication is used rather than a float
  // sqrt so the answer is exact for every input in range.
  if (x < 2) return x;
  let lo = 1;
  let hi = x;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (mid * mid <= x) lo = mid + 1;
    else hi = mid - 1;
  }
  return hi;
}`,
};

CONTENT['Valid Perfect Square'] = {
  signature: lang('isPerfectSquare', [['x', 'number']], 'boolean'),
  description:
    'Given a non-negative integer x, return true when x is a perfect square, that is when some '
    + 'integer r satisfies r * r == x, and false otherwise. Note that 0 is a perfect square, since '
    + '0 * 0 == 0, and 1 is a perfect square too.',
  input: 'The single parameter `x` is the non-negative integer on the first line.',
  output: 'Return true when x is a perfect square, otherwise false.',
  constraints: [
    '0 <= x <= 2147483646',
  ],
  cases: [
    { visible: true, x: 16, expect: true },
    { visible: true, x: 14, expect: false },
    { visible: true, x: 1, expect: true },
    // 8 sits one below the square 9, so a "within 1 of a square" test accepts it.
    { visible: true, x: 8, expect: false },
    // 0 is a perfect square.
    { visible: false, x: 0, expect: true },
    { visible: false, x: 2, expect: false },
    { visible: false, x: 3, expect: false },
    // One above and one below a perfect square.
    { visible: false, x: 17, expect: false },
    { visible: false, x: 15, expect: false },
    // Large perfect square and its neighbours.
    { visible: false, x: 2147395600, expect: true },
    { visible: false, x: 2147395599, expect: false },
    { visible: false, x: 2147483645, expect: false },
    { visible: false, x: 1000000, expect: true },
    { visible: false, x: 999999, expect: false },
    { visible: false, x: 46340, expect: false },
    // 215 * 215 == 46225, one above 46340's own square root.
    { visible: false, x: 46225, expect: true },
    { visible: false, x: 46224, expect: false },
  ],
  reference: `function isPerfectSquare(x) {
  if (x < 2) return true;
  // Binary search on r: shrink [1, x] until r * r brackets x.
  let lo = 1;
  let hi = Math.floor(x / 2);
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const sq = mid * mid;
    if (sq === x) return true;
    if (sq < x) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}`,
};

CONTENT['Find Smallest Letter Greater Than Target'] = {
  signature: lang('findSmallestLetter',
    [['letters', 'string[]'], ['target', 'string']],
    'string'),
  description:
    'Given an array of distinct lowercase letters sorted in ascending order, and a target letter, '
    + 'return the smallest letter in `letters` that is strictly GREATER than target. `letters` may '
    + 'hold letters on either side of target; only their ascending order matters. If no letter is '
    + 'greater than target, the search wraps around and the answer is `letters[0]`, the smallest '
    + 'letter overall.',
  input:
    'The parameters are `letters` on the first line, a sorted array of single lowercase letters, '
    + 'then `target` on the second line as a single letter.',
  output:
    'Return the smallest letter strictly greater than target, or letters[0] when the array wraps.',
  constraints: [
    '1 <= letters.length <= 26',
    'letters contains distinct lowercase letters in ascending order',
    'target is a single lowercase letter',
  ],
  cases: [
    { visible: true, letters: ['c', 'f', 'j'], target: 'a', expect: 'c' },
    { visible: true, letters: ['c', 'f', 'j'], target: 'c', expect: 'f' },
    // No letter is greater than 'z': the answer wraps to letters[0].
    { visible: true, letters: ['c', 'f', 'j'], target: 'k', expect: 'c' },
    // Single letter, and the wrap case on a one-letter array.
    { visible: false, letters: ['a'], target: 'a', expect: 'a' },
    { visible: false, letters: ['x'], target: 'z', expect: 'x' },
    // The comparison is STRICT: a letter equal to target does not answer.
    { visible: false, letters: ['a', 'b', 'c'], target: 'b', expect: 'c' },
    { visible: false, letters: ['a', 'b', 'c'], target: 'c', expect: 'a' },
    // The largest letter answers when target is the second largest.
    { visible: false, letters: ['a', 'y', 'z'], target: 'y', expect: 'z' },
    { visible: false, letters: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], target: 'd', expect: 'e' },
    { visible: false, letters: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], target: 'g', expect: 'a' },
    { visible: false, letters: ['b', 'c', 'd', 'f', 'g'], target: 'a', expect: 'b' },
    // A gap in the alphabet: the next present letter, not the next letter overall.
    { visible: false, letters: ['a', 'd', 'f'], target: 'a', expect: 'd' },
  ],
  reference: `function findSmallestLetter(letters, target) {
  // Find the first index whose letter is strictly greater than target.
  let lo = 0;
  let hi = letters.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (letters[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo === letters.length ? letters[0] : letters[lo];
}`,
};

CONTENT['Missing Number'] = {
  signature: lang('missingNumber', [['nums', 'number[]']], 'number'),
  description:
    'Given an array `nums` of n distinct integers taken from the range 0 to n inclusive, exactly one '
    + 'integer in that range is missing. Return the missing integer. The array therefore always '
    + 'holds n values out of the n+1 candidates 0, 1, ..., n.',
  input: 'The single parameter `nums` is the array of distinct integers on the first line.',
  output: 'Return the one integer from 0 to nums.length inclusive that is absent.',
  constraints: [
    '1 <= nums.length <= 100000',
    'All values are distinct and lie in [0, nums.length]',
    'Exactly one value in [0, nums.length] is absent',
  ],
  cases: [
    { visible: true, nums: [3, 0, 1], expect: 2 },
    { visible: true, nums: [0, 1], expect: 2 },
    { visible: true, nums: [9, 6, 4, 2, 3, 5, 7, 0, 1], expect: 8 },
    // Single element: the array holds one of {0, 1}, so the other is missing.
    { visible: false, nums: [1], expect: 0 },
    { visible: false, nums: [0], expect: 1 },
    // Missing 0.
    { visible: false, nums: [1, 2, 3], expect: 0 },
    // Missing the largest value in the range.
    { visible: false, nums: [0, 1, 2, 3], expect: 4 },
    // Missing in the middle.
    { visible: false, nums: [0, 1, 3, 4], expect: 2 },
    { visible: false, nums: [2, 3, 0, 1], expect: 4 },
    // Already sorted and reverse sorted: order must not matter.
    { visible: false, nums: [0, 1, 2, 4, 5], expect: 3 },
    { visible: false, nums: [5, 4, 3, 1, 0], expect: 2 },
    { visible: false, nums: [1, 3, 0, 2], expect: 4 },
  ],
  reference: `function missingNumber(nums) {
  // XOR every value from 0..n together with every element present. A number
  // XORed with itself cancels, so exactly the missing value survives.
  let acc = nums.length;
  for (let i = 0; i < nums.length; i++) acc ^= nums[i] ^ i;
  return acc;
}`,
};

CONTENT['Search a 2D Matrix'] = {
  signature: lang('searchMatrix',
    [['matrix', 'number[][]'], ['target', 'number']],
    'number[]'),
  description:
    'Given an m x n integer matrix where every row is sorted ascending from left to right and the '
    + 'first element of row i is strictly greater than the last element of row i-1, treat the matrix '
    + 'as a single sorted list read row by row. Return the position of `target` as the pair '
    + '[row, column] with both counted from 0, or [-1, -1] when target does not appear.',
  input:
    'The parameters are `matrix` on the first line as an array of rows, then `target` on the '
    + 'second line.',
  output: 'Return [row, column] of target, or [-1, -1] when it is absent.',
  constraints: [
    '1 <= matrix.length <= 200',
    '1 <= matrix[0].length <= 200',
    'Every row has the same length',
    '-10000 <= matrix[i][j] <= 10000',
    'Rows are ascending and strictly separated from each other',
  ],
  cases: [
    { visible: true, matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target: 3, expect: [0, 1] },
    { visible: true, matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target: 13, expect: [-1, -1] },
    // A 2x3 grid is NOT square, so flattening the grid at a guessed width reads
    // the wrong cell: 6 sits at [0, 2].
    { visible: true, matrix: [[1, 3, 6], [10, 11, 16]], target: 6, expect: [0, 2] },
    // Single row and single cell.
    { visible: false, matrix: [[1]], target: 1, expect: [0, 0] },
    { visible: false, matrix: [[1]], target: 0, expect: [-1, -1] },
    { visible: false, matrix: [[1, 3]], target: 3, expect: [0, 1] },
    // Single column, several rows.
    { visible: false, matrix: [[1], [3], [5]], target: 5, expect: [2, 0] },
    { visible: false, matrix: [[1], [3], [5]], target: 2, expect: [-1, -1] },
    // First and last elements.
    { visible: false, matrix: [[-10000, 0], [1, 10000]], target: -10000, expect: [0, 0] },
    { visible: false, matrix: [[-10000, 0], [1, 10000]], target: 10000, expect: [1, 1] },
    // The boundary between two rows: it belongs to the SECOND row.
    { visible: false, matrix: [[1, 5], [6, 10]], target: 6, expect: [1, 0] },
    { visible: false, matrix: [[1, 5], [6, 10]], target: 5, expect: [0, 1] },
    // Negative values must not be treated as absent.
    { visible: false, matrix: [[-5, -3], [0, 2]], target: -3, expect: [0, 1] },
  ],
  reference: `function searchMatrix(matrix, target) {
  if (matrix.length === 0 || matrix[0].length === 0) return [-1, -1];
  const rows = matrix.length;
  const cols = matrix[0].length;
  // The matrix is sorted in row-major order, so binary search over the
  // flattened index and convert back to a [row, column] pair.
  let lo = 0;
  let hi = rows * cols - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const val = matrix[Math.floor(mid / cols)][mid % cols];
    if (val === target) return [Math.floor(mid / cols), mid % cols];
    if (val < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return [-1, -1];
}`,
};

CONTENT['Search in Rotated Sorted Array'] = {
  signature: lang('searchRotated', [['nums', 'number[]'], ['target', 'number']], 'number'),
  description:
    'An ascending array of DISTINCT integers was rotated at some unknown pivot, for example '
    + '[0,1,2,4,5,6,7] rotated to [4,5,6,7,0,1,2]. Return the index of `target` if it is present, '
    + 'counting from 0, or -1 when it is absent. Because the values are distinct there is exactly '
    + 'one index holding the target whenever it is present.',
  input:
    'The parameters are `nums` on the first line and `target` on the second line.',
  output: 'Return the 0-based index of target in nums, or -1 when it is absent.',
  constraints: [
    '1 <= nums.length <= 5000',
    '-10000 <= nums[i] <= 10000',
    'All values are distinct',
    'nums is an ascending array rotated at an unknown pivot',
  ],
  cases: [
    { visible: true, nums: [4, 5, 6, 7, 0, 1, 2], target: 0, expect: 4 },
    { visible: true, nums: [4, 5, 6, 7, 0, 1, 2], target: 3, expect: -1 },
    { visible: true, nums: [1], target: 0, expect: -1 },
    // Not rotated at all.
    { visible: false, nums: [1, 3, 5], target: 5, expect: 2 },
    { visible: false, nums: [1, 3, 5], target: 1, expect: 0 },
    // Rotated at the very end and at the very start.
    { visible: false, nums: [1, 2, 3, 4, 5], target: 1, expect: 0 },
    { visible: false, nums: [2, 3, 4, 5, 1], target: 1, expect: 4 },
    // Both sorted halves present; the target sits in the right half.
    { visible: false, nums: [3, 4, 5, 1, 2], target: 2, expect: 4 },
    { visible: false, nums: [3, 4, 5, 1, 2], target: 4, expect: 1 },
    // Negative values around the pivot.
    { visible: false, nums: [-3, -1, 0, -5], target: -5, expect: 3 },
    { visible: false, nums: [-3, -1, 0, -5], target: 0, expect: 2 },
    // Two elements, both rotations.
    { visible: false, nums: [3, 1], target: 1, expect: 1 },
    { visible: false, nums: [1, 3], target: 1, expect: 0 },
  ],
  reference: `function searchRotated(nums, target) {
  // At every step one of the two halves around the midpoint is properly
  // sorted. Comparing target against that half tells us which side to keep.
  let lo = 0;
  let hi = nums.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`,
};

CONTENT['Find First and Last Position'] = {
  signature: lang('searchRange', [['nums', 'number[]'], ['target', 'number']], 'number[]'),
  description:
    'Given an array of integers sorted in ascending order, where equal values may appear more '
    + 'than once, and a target value, return the first and last index of target as the pair '
    + '[first, last], both counted from 0 and both inclusive. When target is absent from the array '
    + 'return [-1, -1].',
  input:
    'The parameters are `nums` on the first line and `target` on the second line.',
  output: 'Return [firstIndex, lastIndex] of target, or [-1, -1] when target is absent.',
  constraints: [
    '0 <= nums.length <= 100000',
    '-10000 <= nums[i] <= 10000',
    'nums is sorted ascending; repeated values are allowed',
  ],
  cases: [
    { visible: true, nums: [5, 7, 7, 8, 8, 10], target: 8, expect: [3, 4] },
    { visible: true, nums: [5, 7, 7, 8, 8, 10], target: 6, expect: [-1, -1] },
    { visible: true, nums: [], target: 0, expect: [-1, -1] },
    // The first and last elements of the array.
    { visible: false, nums: [1], target: 1, expect: [0, 0] },
    { visible: false, nums: [2, 2], target: 2, expect: [0, 1] },
    { visible: false, nums: [1, 2, 3], target: 1, expect: [0, 0] },
    { visible: false, nums: [1, 2, 3], target: 3, expect: [2, 2] },
    // Below and above every value.
    { visible: false, nums: [1, 2, 3], target: 0, expect: [-1, -1] },
    { visible: false, nums: [1, 2, 3], target: 4, expect: [-1, -1] },
    // Negative values.
    { visible: false, nums: [-5, -3, -3, 0], target: -3, expect: [1, 2] },
    { visible: false, nums: [-5, -3, -3, 0], target: -4, expect: [-1, -1] },
    // Every element is the target.
    { visible: false, nums: [4, 4, 4, 4], target: 4, expect: [0, 3] },
  ],
  reference: `function searchRange(nums, target) {
  // Two lower-bound searches: the first index >= target, then the first index
  // > target. That brackets every copy of target, duplicated values included.
  const lower = (v) => {
    let lo = 0;
    let hi = nums.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (nums[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const first = lower(target);
  if (first === nums.length || nums[first] !== target) return [-1, -1];
  return [first, lower(target + 1) - 1];
}`,
};

CONTENT['Search a 2D Matrix II'] = {
  signature: lang('searchMatrixII',
    [['matrix', 'number[][]'], ['target', 'number']],
    'number[]'),
  description:
    'Given an m x n integer matrix where every row is sorted ascending from left to right and every '
    + 'COLUMN is also sorted ascending from top to bottom, return the position of `target` as the '
    + 'pair [row, column], both counted from 0, or [-1, -1] when target does not appear. The whole '
    + 'matrix is NOT necessarily sorted row by row, so it cannot be read as one flat list. Values '
    + 'may repeat, so when the target occurs more than once return the occurrence with the '
    + 'SMALLEST row, and among those the smallest column.',
  input:
    'The parameters are `matrix` on the first line as an array of rows, then `target` on the '
    + 'second line.',
  output: 'Return [row, column] of the FIRST occurrence of target, or [-1, -1] when it is absent.',
  constraints: [
    '1 <= matrix.length <= 300',
    '1 <= matrix[0].length <= 300',
    'Every row has the same length',
    '-10000 <= matrix[i][j] <= 10000',
    'Every row is ascending and every column is ascending',
  ],
  cases: [
    { visible: true, matrix: [[1, 4, 7, 11], [2, 5, 8, 12], [3, 6, 9, 16], [10, 13, 14, 17]], target: 5, expect: [1, 1] },
    { visible: true, matrix: [[1, 4, 7, 11], [2, 5, 8, 12], [3, 6, 9, 16], [10, 13, 14, 17]], target: 13, expect: [3, 1] },
    // Single cell and single row / column.
    { visible: false, matrix: [[1]], target: 1, expect: [0, 0] },
    { visible: false, matrix: [[1]], target: 0, expect: [-1, -1] },
    { visible: false, matrix: [[1, 3, 5]], target: 5, expect: [0, 2] },
    { visible: false, matrix: [[1], [3], [5]], target: 3, expect: [1, 0] },
    // Corners.
    { visible: false, matrix: [[-10000, -1], [1, 10000]], target: -10000, expect: [0, 0] },
    { visible: false, matrix: [[-10000, -1], [1, 10000]], target: 10000, expect: [1, 1] },
    // Absent, below and above the whole range.
    { visible: false, matrix: [[1, 3], [5, 7]], target: 4, expect: [-1, -1] },
    { visible: false, matrix: [[1, 3], [5, 7]], target: 0, expect: [-1, -1] },
    { visible: false, matrix: [[1, 3], [5, 7]], target: 8, expect: [-1, -1] },
    // Column-sorted only: row-major flattening would give the wrong answer.
    { visible: false, matrix: [[1, 10, 20], [2, 11, 21], [3, 12, 22]], target: 12, expect: [2, 1] },
    // Duplicate values: the FIRST occurrence (topmost, then leftmost) answers.
    { visible: true, matrix: [[1, 1, 1, 1]], target: 1, expect: [0, 0] },
    { visible: true, matrix: [[3, 3, 3], [3, 3, 3]], target: 3, expect: [0, 0] },
    // Three 4s in the first row: only the leftmost [0, 0] is the contract's
    // answer, so a per-row binary search that stops on any midpoint fails here.
    { visible: true, matrix: [[4, 4, 4], [5, 6, 7]], target: 4, expect: [0, 0] },
    // Duplicated values: the FIRST occurrence is the answer, so the staircase
    // search must not stop on a later copy.
    { visible: false, matrix: [[1, 2], [2, 2]], target: 2, expect: [0, 1] },
    // Two duplicates in a row: the lower bound returns [0, 1], while an equality
    // binary search over [1, 4, 4, 4, 4] lands on midpoint 2 and reports [0, 2].
    { visible: false, matrix: [[1, 4, 4, 4, 4], [2, 5, 5, 5, 5], [3, 6, 6, 6, 6]], target: 4, expect: [0, 1] },
    { visible: false, matrix: [[1, 4, 4], [4, 5, 9], [4, 8, 9]], target: 4, expect: [0, 1] },
  ],
  reference: `function searchMatrixII(matrix, target) {
  if (matrix.length === 0 || matrix[0].length === 0) return [-1, -1];
  // The contract asks for the FIRST occurrence, and rows may repeat values, so
  // a corner staircase is not enough: starting top-right finds the RIGHTMOST
  // match and starting bottom-left finds the lowest-row one. Instead binary
  // search each row top to bottom; the first row that contains target also
  // holds its leftmost copy.
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    // Lower bound: the first index whose value is >= target. If that cell holds
    // the target it is the LEFTMOST copy in this row, which is what the
    // contract asks for; a plain equality binary search would return whichever
    // midpoint it happened to land on.
    let lo = 0;
    let hi = row.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (row[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    if (lo < row.length && row[lo] === target) return [r, lo];
  }
  return [-1, -1];
}`,
};

CONTENT['Koko Eating Bananas'] = {
  signature: lang('eatBananas', [['piles', 'number[]'], ['h', 'number']], 'number'),
  description:
    'Koko has a pile of bananas and h hours to eat them. At a speed of v bananas per hour she eats v '
    + 'bananas in an hour, and any speed above v only helps for the part of that pile still left '
    + 'after the full hour, so a pile of p bananas takes ceil(p / v) hours. She has several piles '
    + 'and must finish ALL of them within h hours. Return the SMALLEST whole-number speed that '
    + 'lets her finish in time.',
  input:
    'The parameters are `piles` on the first line, an array of pile sizes, then `h` on the second '
    + 'line as the number of hours available.',
  output: 'Return the smallest eating speed that finishes every pile within h hours.',
  constraints: [
    '1 <= piles.length <= 10000',
    '1 <= piles[i] <= 10000',
    '1 <= h <= 10000',
  ],
  cases: [
    { visible: true, piles: [3, 6, 7, 11], h: 8, expect: 4 },
    { visible: true, piles: [30, 11, 23, 4, 20], h: 5, expect: 30 },
    { visible: true, piles: [30, 11, 23, 4, 20], h: 6, expect: 23 },
    // A single pile.
    { visible: false, piles: [10], h: 1, expect: 10 },
    { visible: false, piles: [10], h: 10, expect: 1 },
    // Equal piles: the largest pile sets the speed exactly. With three piles the
    // per-pile hour is counted three times, so h = 5 is not enough at v = 2.
    { visible: false, piles: [5, 5, 5], h: 1, expect: 5 },
    { visible: false, piles: [5, 5, 5], h: 5, expect: 5 },
    { visible: false, piles: [5, 5, 5], h: 6, expect: 3 },
    { visible: false, piles: [5, 5, 5], h: 9, expect: 2 },
    // Time is rounded UP per pile, so partial hours are wasted: at v = 4 each
    // pile still costs 2 whole hours, giving 4 hours for two piles.
    { visible: false, piles: [7, 7], h: 2, expect: 7 },
    { visible: false, piles: [7, 7], h: 3, expect: 7 },
    { visible: false, piles: [7, 7], h: 4, expect: 4 },
    { visible: false, piles: [2, 3], h: 1, expect: 3 },
    { visible: false, piles: [2, 3], h: 2, expect: 3 },
    { visible: false, piles: [2, 3], h: 3, expect: 2 },
    // The largest pile is always a valid speed, and the answer moves down only
    // as more time is granted.
    { visible: false, piles: [1, 100], h: 50, expect: 3 },
    { visible: false, piles: [1, 100], h: 51, expect: 2 },
    { visible: false, piles: [1, 100], h: 100, expect: 2 },
    { visible: false, piles: [1, 100], h: 101, expect: 1 },
  ],
  reference: `function eatBananas(piles, h) {
  // Binary search on the speed. Finishing time is non-increasing in v, so the
  // predicate "all piles finish within h hours" is monotone.
  const canFinish = (v) => {
    let hours = 0;
    for (const p of piles) {
      hours += Math.ceil(p / v);
      if (hours > h) return false;
    }
    return true;
  };
  let lo = 1;
  let hi = Math.max(...piles);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (canFinish(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}`,
};

module.exports = { CONTENT, lang };