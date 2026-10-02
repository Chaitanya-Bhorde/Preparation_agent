'use strict';

/**
 * dsaBatch6ContentHash.js
 * ---------------------------------------------------------------------------
 * Authored content for the Heap and Hash Table problems of batch 6.
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

CONTENT["K Items with Maximum Sum"] = {
  signature: lang("maxSum", [["k","number"],["nums","number[]"]], "number"),
  description: "You are given `k` buckets and `nums[i]` litres of petrol in bucket `i`. Each bucket may contribute at most one litre to the trip, and you must draw from exactly `k` distinct buckets. Return the largest total number of litres obtainable under those rules.",
  input: "The parameters are `k` on the first line and `nums` on the second line.",
  output: "Return the largest sum obtainable by taking exactly k distinct elements of nums.",
  constraints: ["1 <= k <= nums.length","1 <= nums.length <= 100000","0 <= nums[i] <= 10^4"],
  cases: [
    {"visible":true,"k":3,"nums":[1,2,3,4],"expect":9},
    {"visible":true,"k":2,"nums":[3,2,1,5,6,4],"expect":11},
    {"visible":false,"k":1,"nums":[3],"expect":3},
    {"visible":false,"k":2,"nums":[1,2],"expect":3},
    {"visible":false,"k":3,"nums":[1,2,3],"expect":6},
    {"visible":false,"k":2,"nums":[0,0],"expect":0},
    {"visible":false,"k":3,"nums":[0,1,0,2],"expect":3},
    {"visible":false,"k":4,"nums":[0,0,0,0],"expect":0},
    {"visible":false,"k":2,"nums":[5,5,1],"expect":10},
    {"visible":false,"k":3,"nums":[5,5,1],"expect":11},
    {"visible":false,"k":1,"nums":[5,5,1],"expect":5},
    {"visible":false,"k":2,"nums":[9,8,7],"expect":17},
    {"visible":false,"k":2,"nums":[1,2,3],"expect":5},
    {"visible":false,"k":2,"nums":[10000,9999,1],"expect":19999},
  ],
  reference: "function maxSum(k, nums) {\n  // A min-heap of the k largest values seen so far. Once it holds k entries\n  // its root is the smallest of them, so a larger incoming value evicts it.\n  const heap = [];\n  const push = (v) => {\n    heap.push(v);\n    let i = heap.length - 1;\n    while (i > 0) {\n      const parent = (i - 1) >> 1;\n      if (heap[parent] <= heap[i]) break;\n      const t = heap[parent]; heap[parent] = heap[i]; heap[i] = t;\n      i = parent;\n    }\n  };\n  const pop = () => {\n    const top = heap[0];\n    const last = heap.pop();\n    if (heap.length) {\n      heap[0] = last;\n      let i = 0;\n      for (;;) {\n        const l = 2 * i + 1, r = l + 1;\n        let s = i;\n        if (l < heap.length && heap[l] < heap[s]) s = l;\n        if (r < heap.length && heap[r] < heap[s]) s = r;\n        if (s === i) break;\n        const t = heap[s]; heap[s] = heap[i]; heap[i] = t;\n        i = s;\n      }\n    }\n    return top;\n  };\n  for (const v of nums) {\n    if (heap.length < k) { push(v); continue; }\n    if (v > heap[0]) { pop(); push(v); }\n  }\n  let total = 0;\n  for (const v of heap) total += v;\n  return total;\n}",
};

CONTENT["Word Pattern"] = {
  signature: lang("wordPattern", [["pattern","string"],["str","string"]], "boolean"),
  description: "Decide whether `str` follows `pattern`. Split `str` on single spaces into words, and split `pattern` into its characters. The two must correspond one-to-one: a character of `pattern` must always map to the same word, and two different characters must never map to the same word.",
  input: "The parameters are `pattern` on the first line and `str` on the second line.",
  output: "Return true when the words of str follow pattern exactly, otherwise false.",
  constraints: ["1 <= pattern.length <= 300","1 <= str.length <= 300","pattern contains only lowercase English letters","str contains only lowercase English letters and single spaces"],
  cases: [
    {"visible":true,"pattern":"abba","str":"dog cat cat dog","expect":true},
    {"visible":true,"pattern":"abba","str":"dog cat cat fish","expect":false},
    {"visible":true,"pattern":"aaaa","str":"dog cat cat dog","expect":false},
    {"visible":true,"pattern":"ab","str":"dog dog","expect":false},
    {"visible":true,"pattern":"ab","str":"dog cat","expect":true},
    {"visible":false,"pattern":"a","str":"dog","expect":true},
    {"visible":false,"pattern":"a","str":"dog cat","expect":false},
    {"visible":false,"pattern":"ab","str":"dog","expect":false},
    {"visible":false,"pattern":"abc","str":"a b c","expect":true},
    {"visible":false,"pattern":"abc","str":"a b b","expect":false},
    {"visible":false,"pattern":"abab","str":"x y x y","expect":true},
    {"visible":false,"pattern":"abab","str":"x y y x","expect":false},
    {"visible":false,"pattern":"abc","str":"one two three","expect":true},
    {"visible":false,"pattern":"abc","str":"one two one","expect":false},
  ],
  reference: "function wordPattern(pattern, str) {\n  const words = str.split(' ');\n  if (words.length !== pattern.length) return false;\n  // Two maps: the relation must be injective as well as consistent, so a\n  // character may not reuse a word and a word may not serve two characters.\n  const charToWord = new Map();\n  const wordToChar = new Map();\n  for (let i = 0; i < words.length; i++) {\n    const ch = pattern[i];\n    const w = words[i];\n    if (charToWord.has(ch) && charToWord.get(ch) !== w) return false;\n    if (wordToChar.has(w) && wordToChar.get(w) !== ch) return false;\n    charToWord.set(ch, w);\n    wordToChar.set(w, ch);\n  }\n  return true;\n}",
};

CONTENT["Isomorphic Strings"] = {
  signature: lang("areIsomorphic", [["s","string"],["t","string"]], "boolean"),
  description: "Two strings are isomorphic when the character at every position of `s` corresponds to the character at the same position of `t`, and the correspondence runs in both directions. Two different characters of `s` may not become the same character of `t`, and one character of `s` may not stand for two different characters of `t`.",
  input: "The parameters are `s` on the first line and `t` on the second line.",
  output: "Return true when s and t are isomorphic, otherwise false.",
  constraints: ["1 <= s.length <= 50000","1 <= t.length <= 50000","s and t consist of lowercase English letters"],
  cases: [
    {"visible":true,"s":"egg","t":"add","expect":true},
    {"visible":true,"s":"foo","t":"bar","expect":false},
    {"visible":true,"s":"paper","t":"title","expect":true},
    {"visible":true,"s":"ab","t":"a","expect":false},
    {"visible":true,"s":"ab","t":"aa","expect":false},
    {"visible":false,"s":"badc","t":"baba","expect":false},
    {"visible":false,"s":"abc","t":"abc","expect":true},
    {"visible":false,"s":"a","t":"a","expect":true},
    {"visible":false,"s":"a","t":"b","expect":true},
    {"visible":false,"s":"aa","t":"bb","expect":true},
    {"visible":false,"s":"aa","t":"ab","expect":false},
    {"visible":false,"s":"abcdef","t":"fedcba","expect":true},
    {"visible":false,"s":"abcd","t":"abba","expect":false},
    {"visible":false,"s":"aaaa","t":"bbbb","expect":true},
    {"visible":false,"s":"abab","t":"baba","expect":true},
    {"visible":false,"s":"abab","t":"aaaa","expect":false},
    {"visible":false,"s":"abcd","t":"abcd","expect":true},
  ],
  reference: "function areIsomorphic(s, t) {\n  if (s.length !== t.length) return false;\n  const sToT = new Map();\n  const tToS = new Map();\n  for (let i = 0; i < s.length; i++) {\n    const a = s[i], b = t[i];\n    if (sToT.has(a) && sToT.get(a) !== b) return false;\n    if (tToS.has(b) && tToS.get(b) !== a) return false;\n    sToT.set(a, b);\n    tToS.set(b, a);\n  }\n  return true;\n}",
};

CONTENT["Longest Consecutive Sequence"] = {
  signature: lang("longestConsecutive", [["nums","number[]"]], "number"),
  description: "Given an unsorted array of integers, return the length of the longest run of consecutive values present in it. A run is a maximal set of values differing by exactly 1, and input order is irrelevant: `[1,2,0,1]` contains the run 0,1,2, so the answer is 3. Repeated values do not extend a run.",
  input: "The parameter `nums` is on the first line.",
  output: "Return the length of the longest consecutive run of values present in nums.",
  constraints: ["0 <= nums.length <= 100000","-10^9 <= nums[i] <= 10^9"],
  cases: [
    {"visible":true,"nums":[100,4,200,1,3,2],"expect":4},
    {"visible":true,"nums":[0,3,7,2,5,8,4,6,0,1],"expect":9},
    {"visible":true,"nums":[1,2,0,1],"expect":3},
    {"visible":false,"nums":[],"expect":0},
    {"visible":false,"nums":[7],"expect":1},
    {"visible":false,"nums":[-5],"expect":1},
    {"visible":false,"nums":[1,3,5,7],"expect":1},
    {"visible":false,"nums":[5,4,3,2,1],"expect":5},
    {"visible":false,"nums":[1,1,1],"expect":1},
    {"visible":false,"nums":[1,2,2,2,3],"expect":3},
    {"visible":false,"nums":[-3,-2,-1,0,1],"expect":5},
    {"visible":false,"nums":[-2,0,-1],"expect":3},
    {"visible":false,"nums":[-1,1],"expect":1},
    {"visible":false,"nums":[1,2,3,10,11,12,13],"expect":4},
    {"visible":false,"nums":[90,91,92,1,2,3],"expect":3},
  ],
  reference: "function longestConsecutive(nums) {\n  const set = new Set(nums);\n  let best = 0;\n  for (const v of set) {\n    // Only start counting at the BEGINNING of a run. Without this guard the\n    // same run is walked once per element and the answer is wrong.\n    if (set.has(v - 1)) continue;\n    let length = 1;\n    while (set.has(v + length)) length++;\n    if (length > best) best = length;\n  }\n  return best;\n}",
};

module.exports = { CONTENT, lang };