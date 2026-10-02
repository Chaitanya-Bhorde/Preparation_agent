'use strict';

/**
 * dsaBatch6ContentSort.js
 * ---------------------------------------------------------------------------
 * Authored content for the Sorting problems of batch 6.
 *
 * `cases` declare the INPUTS plus an `expect` that an INDEPENDENT oracle
 * (scripts/dsaBatch6Oracle.js) re-derives; dsa_batch6_build.js requires the
 * authored value, the oracle and the reference to all agree before any write.
 *
 * Only problems whose answer is UNIQUELY determined by the input appear here.
 * The other batch-6 selections are excluded on purpose and recorded in
 * scripts/dsaBatch6Contracts.js: design problems have no single expected value,
 * and the subset/permutation/combination families return every valid answer,
 * so a single stored expected output would reject correct solutions.
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

CONTENT["Bubble Sort"] = {
  signature: lang("bubbleSort", [["nums","number[]"]], "number[]"),
  description: "Sort `nums` into non-decreasing order using bubble sort: repeatedly walk the array and swap any neighbouring pair that is out of order, until a full pass makes no swap. Return the sorted array. Only the RESULT is judged, so any correct sort passes; the exercise is to implement this one.",
  input: "The parameter `nums` is on the first line.",
  output: "Return nums sorted into non-decreasing order.",
  constraints: ["0 <= nums.length <= 10000","-10^6 <= nums[i] <= 10^6"],
  cases: [
    {"visible":true,"nums":[5,2,4,6,1,3],"expect":[1,2,3,4,5,6]},
    {"visible":true,"nums":[],"expect":[]},
    {"visible":true,"nums":[1],"expect":[1]},
    {"visible":false,"nums":[2,1],"expect":[1,2]},
    {"visible":false,"nums":[1,2,3,4],"expect":[1,2,3,4]},
    {"visible":false,"nums":[4,3,2,1],"expect":[1,2,3,4]},
    {"visible":false,"nums":[7,7,7,7],"expect":[7,7,7,7]},
    {"visible":false,"nums":[-1,5,-3,0],"expect":[-3,-1,0,5]},
    {"visible":false,"nums":[3,1,3,2,1],"expect":[1,1,2,3,3]},
    {"visible":false,"nums":[9,0],"expect":[0,9]},
    {"visible":false,"nums":[1,5,2,6,3],"expect":[1,2,3,5,6]},
    {"visible":false,"nums":[2,2,1,1],"expect":[1,1,2,2]},
  ],
  reference: "function bubbleSort(nums) {\n  const a = nums.slice();\n  for (let end = a.length - 1; end > 0; end--) {\n    let swapped = false;\n    for (let i = 0; i < end; i++) {\n      if (a[i] > a[i + 1]) {\n        const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t;\n        swapped = true;\n      }\n    }\n    // The largest remaining value has bubbled to index `end`, so later\n    // passes exclude it.\n    if (!swapped) break;\n  }\n  return a;\n}",
};

CONTENT["Insertion Sort"] = {
  signature: lang("insertionSort", [["nums","number[]"]], "number[]"),
  description: "Sort `nums` into non-decreasing order using insertion sort: grow a sorted prefix one element at a time, shifting each newly added element left until it sits in the right place. Return the sorted array. Only the RESULT is judged, so any correct sort passes; the exercise is to implement this one.",
  input: "The parameter `nums` is on the first line.",
  output: "Return nums sorted into non-decreasing order.",
  constraints: ["0 <= nums.length <= 10000","-10^6 <= nums[i] <= 10^6"],
  cases: [
    {"visible":true,"nums":[5,2,4,6,1,3],"expect":[1,2,3,4,5,6]},
    {"visible":true,"nums":[],"expect":[]},
    {"visible":true,"nums":[1],"expect":[1]},
    {"visible":false,"nums":[2,1],"expect":[1,2]},
    {"visible":false,"nums":[1,2,3,4],"expect":[1,2,3,4]},
    {"visible":false,"nums":[4,3,2,1],"expect":[1,2,3,4]},
    {"visible":false,"nums":[7,7,7,7],"expect":[7,7,7,7]},
    {"visible":false,"nums":[-1,5,-3,0],"expect":[-3,-1,0,5]},
    {"visible":false,"nums":[3,1,3,2,1],"expect":[1,1,2,3,3]},
    {"visible":false,"nums":[9,0],"expect":[0,9]},
    {"visible":false,"nums":[1,5,2,6,3],"expect":[1,2,3,5,6]},
    {"visible":false,"nums":[2,2,1,1],"expect":[1,1,2,2]},
  ],
  reference: "function insertionSort(nums) {\n  const a = nums.slice();\n  for (let i = 1; i < a.length; i++) {\n    const key = a[i];\n    let j = i - 1;\n    // Shift the sorted prefix right until `key` is in its correct place.\n    while (j >= 0 && a[j] > key) {\n      a[j + 1] = a[j];\n      j--;\n    }\n    a[j + 1] = key;\n  }\n  return a;\n}",
};

CONTENT["Selection Sort"] = {
  signature: lang("selectionSort", [["nums","number[]"]], "number[]"),
  description: "Sort `nums` into non-decreasing order using selection sort: for each position, scan the remaining suffix for its smallest element and swap it into place. Return the sorted array. Only the RESULT is judged, so any correct sort passes; the exercise is to implement this one.",
  input: "The parameter `nums` is on the first line.",
  output: "Return nums sorted into non-decreasing order.",
  constraints: ["0 <= nums.length <= 10000","-10^6 <= nums[i] <= 10^6"],
  cases: [
    {"visible":true,"nums":[5,2,4,6,1,3],"expect":[1,2,3,4,5,6]},
    {"visible":true,"nums":[],"expect":[]},
    {"visible":true,"nums":[1],"expect":[1]},
    {"visible":false,"nums":[2,1],"expect":[1,2]},
    {"visible":false,"nums":[1,2,3,4],"expect":[1,2,3,4]},
    {"visible":false,"nums":[4,3,2,1],"expect":[1,2,3,4]},
    {"visible":false,"nums":[7,7,7,7],"expect":[7,7,7,7]},
    {"visible":false,"nums":[-1,5,-3,0],"expect":[-3,-1,0,5]},
    {"visible":false,"nums":[3,1,3,2,1],"expect":[1,1,2,3,3]},
    {"visible":false,"nums":[9,0],"expect":[0,9]},
    {"visible":false,"nums":[1,5,2,6,3],"expect":[1,2,3,5,6]},
    {"visible":false,"nums":[2,2,1,1],"expect":[1,1,2,2]},
  ],
  reference: "function selectionSort(nums) {\n  const a = nums.slice();\n  for (let i = 0; i < a.length - 1; i++) {\n    let min = i;\n    for (let j = i + 1; j < a.length; j++) {\n      if (a[j] < a[min]) min = j;\n    }\n    if (min !== i) {\n      const t = a[i]; a[i] = a[min]; a[min] = t;\n    }\n  }\n  return a;\n}",
};

CONTENT["Merge Sort"] = {
  signature: lang("mergeSort", [["nums","number[]"]], "number[]"),
  description: "Sort `nums` into non-decreasing order using merge sort: split the array in half, sort each half, then merge the two sorted halves into one. Return the sorted array. Only the RESULT is judged, so any correct sort passes; the exercise is to implement this one.",
  input: "The parameter `nums` is on the first line.",
  output: "Return nums sorted into non-decreasing order.",
  constraints: ["0 <= nums.length <= 100000","-10^6 <= nums[i] <= 10^6"],
  cases: [
    {"visible":true,"nums":[5,2,4,6,1,3],"expect":[1,2,3,4,5,6]},
    {"visible":true,"nums":[],"expect":[]},
    {"visible":true,"nums":[1],"expect":[1]},
    {"visible":false,"nums":[2,1],"expect":[1,2]},
    {"visible":false,"nums":[1,2,3,4],"expect":[1,2,3,4]},
    {"visible":false,"nums":[4,3,2,1],"expect":[1,2,3,4]},
    {"visible":false,"nums":[7,7,7,7],"expect":[7,7,7,7]},
    {"visible":false,"nums":[-1,5,-3,0],"expect":[-3,-1,0,5]},
    {"visible":false,"nums":[3,1,3,2,1],"expect":[1,1,2,3,3]},
    {"visible":false,"nums":[9,0],"expect":[0,9]},
    {"visible":false,"nums":[1,5,2,6,3],"expect":[1,2,3,5,6]},
    {"visible":false,"nums":[8,3,5,1,9,2,7,4,6,0],"expect":[0,1,2,3,4,5,6,7,8,9]},
  ],
  reference: "function mergeSort(nums) {\n  const a = nums.slice();\n  if (a.length <= 1) return a;\n  const mid = a.length >> 1;\n  const left = mergeSort(a.slice(0, mid));\n  const right = mergeSort(a.slice(mid));\n  const out = [];\n  let i = 0, j = 0;\n  while (i < left.length && j < right.length) {\n    if (left[i] <= right[j]) out.push(left[i++]);\n    else out.push(right[j++]);\n  }\n  while (i < left.length) out.push(left[i++]);\n  while (j < right.length) out.push(right[j++]);\n  return out;\n}",
};

CONTENT["Quick Sort"] = {
  signature: lang("quickSort", [["nums","number[]"]], "number[]"),
  description: "Sort `nums` into non-decreasing order using quick sort: choose a pivot, partition so that smaller values come before it and larger values after, then sort each side. Return the sorted array. Only the RESULT is judged, so any correct sort passes; the exercise is to implement this one.",
  input: "The parameter `nums` is on the first line.",
  output: "Return nums sorted into non-decreasing order.",
  constraints: ["0 <= nums.length <= 100000","-10^6 <= nums[i] <= 10^6"],
  cases: [
    {"visible":true,"nums":[5,2,4,6,1,3],"expect":[1,2,3,4,5,6]},
    {"visible":true,"nums":[],"expect":[]},
    {"visible":true,"nums":[1],"expect":[1]},
    {"visible":false,"nums":[2,1],"expect":[1,2]},
    {"visible":false,"nums":[1,2,3,4],"expect":[1,2,3,4]},
    {"visible":false,"nums":[4,3,2,1],"expect":[1,2,3,4]},
    {"visible":false,"nums":[7,7,7,7],"expect":[7,7,7,7]},
    {"visible":false,"nums":[-1,5,-3,0],"expect":[-3,-1,0,5]},
    {"visible":false,"nums":[3,1,3,2,1],"expect":[1,1,2,3,3]},
    {"visible":false,"nums":[9,0],"expect":[0,9]},
    {"visible":false,"nums":[1,5,2,6,3],"expect":[1,2,3,5,6]},
    {"visible":false,"nums":[8,3,5,1,9,2,7,4,6,0],"expect":[0,1,2,3,4,5,6,7,8,9]},
  ],
  reference: "function quickSort(nums) {\n  const a = nums.slice();\n  // Last element as pivot, with a three-way partition so values EQUAL to the\n  // pivot are not rescanned on every recursive call. Without the equal\n  // partition an all-equal array degenerates to quadratic time.\n  const sort = (lo, hi) => {\n    if (lo >= hi) return;\n    const pivot = a[hi];\n    let lt = lo, i = lo, gt = hi;\n    while (i <= gt) {\n      if (a[i] < pivot) { const t = a[lt]; a[lt] = a[i]; a[i] = t; lt++; i++; }\n      else if (a[i] > pivot) { const t = a[i]; a[i] = a[gt]; a[gt] = t; gt--; }\n      else i++;\n    }\n    sort(lo, lt - 1);\n    sort(gt + 1, hi);\n  };\n  sort(0, a.length - 1);\n  return a;\n}",
};

CONTENT["Largest Number"] = {
  signature: lang("largestNumber", [["nums","number[]"]], "string"),
  description: "Given an array of non-negative integers, arrange them so that the concatenation of the resulting strings is the largest possible number. Compare two candidates a and b by asking whether `a+b` is larger than `b+a`; that ordering is what the answer depends on. Return the concatenation as a string.",
  input: "The parameter `nums` is on the first line.",
  output: "Return the largest number obtainable, as a string.",
  constraints: ["1 <= nums.length <= 100","0 <= nums[i] <= 10^9"],
  cases: [
    {"visible":true,"nums":[10,2],"expect":"210"},
    {"visible":true,"nums":[3,30,34,5,9],"expect":"9534330"},
    {"visible":true,"nums":[0,0],"expect":"0"},
    {"visible":false,"nums":[1],"expect":"1"},
    {"visible":false,"nums":[0],"expect":"0"},
    {"visible":false,"nums":[9],"expect":"9"},
    {"visible":false,"nums":[12,121],"expect":"12121"},
    {"visible":false,"nums":[121,12],"expect":"12121"},
    {"visible":false,"nums":[1,2,3],"expect":"321"},
    {"visible":false,"nums":[9,8,7],"expect":"987"},
    {"visible":false,"nums":[1,0],"expect":"10"},
    {"visible":false,"nums":[0,1,0],"expect":"100"},
    {"visible":false,"nums":[121,12,1],"expect":"121211"},
    {"visible":false,"nums":[0,0,1],"expect":"100"},
    {"visible":false,"nums":[9,91,8],"expect":"9918"},
  ],
  reference: "function largestNumber(nums) {\n  // The comparator must join the strings: 12 sorts before 121 because\n  // \"12121\" > \"12112\", even though 12 < 121 numerically.\n  const cmp = (a, b) => (a === b ? 0 : ((a + b) > (b + a) ? -1 : 1));\n  const parts = nums.map((n) => String(n));\n  parts.sort(cmp);\n  // Every element may be \"0\", in which case the result is a single \"0\".\n  if (parts[0] === '0') return '0';\n  return parts.join('');\n}",
};

CONTENT["Relative Sort Array"] = {
  signature: lang("relativeSortArray", [["arr1","number[]"],["arr2","number[]"]], "number[]"),
  description: "Sort `arr1` so that its elements appear in the order given by `arr2`. Every value in `arr1` is guaranteed to occur in `arr2`, so the result is unique. Values occurring more than once in `arr1` are repeated, and any value of `arr2` absent from `arr1` contributes nothing. Return the sorted array.",
  input: "The parameters are `arr1` on the first line and `arr2` on the second line.",
  output: "Return arr1 sorted by the relative order given by arr2.",
  constraints: ["1 <= arr1.length, arr2.length <= 1000","1 <= arr1[i], arr2[i] <= 1000"],
  cases: [
    {"visible":true,"arr1":[2,3,1,3,2,4,6,7,9,2,19],"arr2":[2,1,4,3,19,9,6,7],"expect":[2,2,2,1,4,3,3,19,9,6,7]},
    {"visible":true,"arr1":[28,6,22,8,44,17],"arr2":[22,28,8,6,44,17],"expect":[22,28,8,6,44,17]},
    {"visible":false,"arr1":[1,1,1],"arr2":[1],"expect":[1,1,1]},
    {"visible":false,"arr1":[5],"arr2":[5],"expect":[5]},
    {"visible":false,"arr1":[2,1],"arr2":[3,2,1],"expect":[2,1]},
    {"visible":false,"arr1":[1],"arr2":[1,2,3],"expect":[1]},
    {"visible":false,"arr1":[3,3,2,1],"arr2":[1,3,2],"expect":[1,3,3,2]},
    {"visible":false,"arr1":[1,2,3,3],"arr2":[3,1,2],"expect":[3,3,1,2]},
    {"visible":false,"arr1":[1,2,3],"arr2":[3,2,1],"expect":[3,2,1]},
    {"visible":false,"arr1":[4,5,6],"arr2":[6,5,4],"expect":[6,5,4]},
    {"visible":false,"arr1":[2,1,2,1],"arr2":[1,2],"expect":[1,1,2,2]},
  ],
  reference: "function relativeSortArray(arr1, arr2) {\n  // Count occurrences, then emit values in arr2 order. A comparator built\n  // from arr2 is the alternative, but counting keeps this linear and makes\n  // the multiplicity rule explicit.\n  const count = new Map();\n  for (const v of arr1) count.set(v, (count.get(v) || 0) + 1);\n  const out = [];\n  for (const v of arr2) {\n    const n = count.get(v) || 0;\n    for (let i = 0; i < n; i++) out.push(v);\n    count.delete(v);\n  }\n  return out;\n}",
};

CONTENT["Meeting Rooms"] = {
  signature: lang("canAttendMeetings", [["intervals","number[][]"]], "boolean"),
  description: "You are given `intervals` of meeting times as [start, end] pairs. Decide whether one person can attend EVERY meeting. Return false as soon as any two meetings overlap; a meeting that starts exactly when another ends does NOT overlap. Return true when no pair overlaps.",
  input: "The parameter `intervals` is on the first line.",
  output: "Return true when no two meetings overlap, otherwise false.",
  constraints: ["0 <= intervals.length <= 10^6","intervals[i].length === 2","0 <= intervals[i][0] < intervals[i][1] <= 10^9"],
  cases: [
    {"visible":true,"intervals":[[0,30],[5,10],[15,20]],"expect":false},
    {"visible":true,"intervals":[[7,10],[2,4]],"expect":true},
    {"visible":true,"intervals":[[1,2],[2,3]],"expect":true},
    {"visible":true,"intervals":[[1,5],[2,3]],"expect":false},
    {"visible":false,"intervals":[],"expect":true},
    {"visible":false,"intervals":[[1,2]],"expect":true},
    {"visible":false,"intervals":[[1,10],[2,3]],"expect":false},
    {"visible":false,"intervals":[[1,5],[2,4]],"expect":false},
    {"visible":false,"intervals":[[1,2],[1,2]],"expect":false},
    {"visible":false,"intervals":[[9,10],[2,3],[5,6]],"expect":true},
    {"visible":false,"intervals":[[1,2],[2,3],[3,4]],"expect":true},
    {"visible":false,"intervals":[[0,1000000000],[1,2]],"expect":false},
  ],
  reference: "function canAttendMeetings(intervals) {\n  // Sort by start time; then each interval only needs comparing with the\n  // previous one, since that is the only earlier interval that can still\n  // overlap. Touching endpoints (end === start) are allowed.\n  const sorted = intervals.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);\n  for (let i = 1; i < sorted.length; i++) {\n    if (sorted[i][0] < sorted[i - 1][1]) return false;\n  }\n  return true;\n}",
};

CONTENT["Meeting Rooms II"] = {
  signature: lang("minMeetingRooms", [["intervals","number[][]"]], "number"),
  description: "Given meeting intervals as [start, end] pairs, return the SMALLEST number of rooms needed so that every meeting can take place. Meetings that touch at an endpoint do not need two rooms at once, so an end equal to the next start frees its room immediately.",
  input: "The parameter `intervals` is on the first line.",
  output: "Return the minimum number of rooms required to hold all meetings.",
  constraints: ["1 <= intervals.length <= 10^6","intervals[i].length === 2","0 <= intervals[i][0] < intervals[i][1] <= 10^9"],
  cases: [
    {"visible":true,"intervals":[[0,30],[5,10],[15,20]],"expect":2},
    {"visible":true,"intervals":[[7,10],[2,4]],"expect":1},
    {"visible":true,"intervals":[[1,2]],"expect":1},
    {"visible":false,"intervals":[[1,5],[2,6],[3,7]],"expect":3},
{"visible":true,"intervals":[[1,2],[2,3],[3,4]],"expect":1},
    {"visible":false,"intervals":[[1,2],[2,3]],"expect":1},
    {"visible":false,"intervals":[[1,2],[2,3],[3,4]],"expect":1},
    {"visible":false,"intervals":[[1,10],[2,3],[4,5]],"expect":2},
    {"visible":false,"intervals":[[1,5],[2,4],[3,6]],"expect":3},
    {"visible":false,"intervals":[[1,2],[1,2],[1,2]],"expect":3},
    {"visible":false,"intervals":[[9,10],[2,3],[5,6]],"expect":1},
    {"visible":false,"intervals":[[1,5],[2,6],[3,7],[8,10],[8,11]],"expect":3},
    {"visible":false,"intervals":[[0,1000000000],[1,2]],"expect":2},
  ],
  reference: "function minMeetingRooms(intervals) {\n  // Sweep line over sorted endpoints. Starts are +1 and ends are -1, and\n  // ends sort BEFORE starts at the same coordinate so back-to-back\n  // meetings release the room instead of needing a second one.\n  const events = [];\n  for (const iv of intervals) {\n    events.push([iv[0], 1]);\n    events.push([iv[1], -1]);\n  }\n  events.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));\n  let active = 0;\n  let best = 0;\n  for (let i = 0; i < events.length; i++) {\n    active += events[i][1];\n    if (active > best) best = active;\n  }\n  return best;\n}",
};

CONTENT["Insert Interval"] = {
  signature: lang("insertInterval", [["intervals","number[][]"],["newInterval","number[]"]], "number[][]"),
  description: "You are given `intervals`, a list of non-overlapping intervals already sorted by start and each strictly inside the next, and one more interval `newInterval`. Insert it and merge every overlap so that the result is again sorted and non-overlapping. Intervals that only touch at an endpoint are merged.",
  input: "The parameters are `intervals` on the first line and `newInterval` on the second line.",
  output: "Return the merged, sorted list of intervals.",
  constraints: ["0 <= intervals.length <= 10^4","each interval has exactly 2 values","-10^9 <= values <= 10^9"],
  cases: [
    {"visible":true,"intervals":[[1,3],[6,9]],"newInterval":[2,5],"expect":[[1,5],[6,9]]},
    {"visible":true,"intervals":[[1,2],[3,5],[6,7],[8,10],[12,16]],"newInterval":[4,8],"expect":[[1,2],[3,10],[12,16]]},
    {"visible":true,"intervals":[[1,5]],"newInterval":[6,8],"expect":[[1,5],[6,8]]},
    {"visible":false,"intervals":[[1,5]],"newInterval":[0,0],"expect":[[0,0],[1,5]]},
    {"visible":false,"intervals":[[1,5]],"newInterval":[1,5],"expect":[[1,5]]},
    {"visible":false,"intervals":[[1,2],[3,5]],"newInterval":[2,3],"expect":[[1,5]]},
    {"visible":false,"intervals":[],"newInterval":[5,7],"expect":[[5,7]]},
    {"visible":false,"intervals":[[1,2],[5,7]],"newInterval":[2,5],"expect":[[1,7]]},
    {"visible":false,"intervals":[[1,2],[8,9]],"newInterval":[4,5],"expect":[[1,2],[4,5],[8,9]]},
    {"visible":false,"intervals":[[1,2],[3,5],[6,8],[9,10]],"newInterval":[4,6],"expect":[[1,2],[3,8],[9,10]]},
    {"visible":false,"intervals":[[-5,-1]],"newInterval":[-3,3],"expect":[[-5,3]]},
  ],
  reference: "function insertInterval(intervals, newInterval) {\n  const out = [];\n  const ns = newInterval[0];\n  let e = newInterval[1];\n  let i = 0;\n  const n = intervals.length;\n  // 1. Everything strictly before the new interval, copied unchanged.\n  while (i < n && intervals[i][1] < ns) {\n    out.push(intervals[i]);\n    i++;\n  }\n  // 2. Everything that overlaps or touches it, merged into one span.\n  let s = ns;\n  while (i < n && intervals[i][0] <= e) {\n    if (intervals[i][0] < s) s = intervals[i][0];\n    if (intervals[i][1] > e) e = intervals[i][1];\n    i++;\n  }\n  out.push([s, e]);\n  // 3. Everything after, copied unchanged.\n  while (i < n) {\n    out.push(intervals[i]);\n    i++;\n  }\n  return out;\n}",
};

module.exports = { CONTENT, lang };
