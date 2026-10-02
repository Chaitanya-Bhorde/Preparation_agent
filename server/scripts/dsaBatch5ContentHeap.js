'use strict';

/**
 * dsaBatch5ContentHeap.js
 * ---------------------------------------------------------------------------
 * Authored content for the Heap problems of batch 5.
 *
 * `cases` declare the INPUTS plus an `expect` that an INDEPENDENT oracle
 * (scripts/dsaBatch5Oracle.js) re-derives; dsa_batch5_build.js requires the
 * authored value, the oracle and the reference to agree before any write.
 *
 * OPERATION SEQUENCES. The three design problems here follow the convention
 * the catalogue already fixed for design problems in batch 3 (LRU Cache, LFU
 * Cache): operations arrive as a flat array of strings, one operation per
 * element, and the function returns one entry per operation that produces a
 * value. This keeps the contract aligned with the rest of the catalogue rather
 * than inventing a second serialisation for "design" questions.
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

CONTENT['Kth Largest Element in Array'] = {
  signature: lang('findKthLargest', [['nums', 'number[]'], ['k', 'number']], 'number'),
  description:
    'Return the k-th largest element of `nums`. The count starts at 1, so k = 1 asks for the largest '
    + 'value, k = 2 for the second largest, and so on. Duplicate values each occupy their own place '
    + 'in the ordering, so an array [2,2,1] has 2 as both its largest and its second largest value.',
  input:
    'The parameters are `nums` on the first line and `k` on the second line.',
  output: 'Return the k-th largest value of nums, counting from 1.',
  constraints: [
    '1 <= nums.length <= 100000',
    '-10000 <= nums[i] <= 10000',
    '1 <= k <= nums.length',
  ],
  cases: [
    { visible: true, nums: [3, 2, 1, 5, 6, 4], k: 2, expect: 5 },
    { visible: true, nums: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4, expect: 4 },
    // Single element, and k = 1.
    { visible: false, nums: [1], k: 1, expect: 1 },
    { visible: false, nums: [1, 2], k: 1, expect: 2 },
    { visible: false, nums: [1, 2], k: 2, expect: 1 },
    // k equals the array length: the smallest value.
    { visible: false, nums: [2, 1], k: 2, expect: 1 },
    { visible: false, nums: [7, 7, 7], k: 3, expect: 7 },
    // All values equal.
    { visible: false, nums: [5, 5, 5, 5], k: 2, expect: 5 },
    // Duplicates occupy distinct ranks.
    { visible: false, nums: [2, 2, 1], k: 1, expect: 2 },
    { visible: false, nums: [2, 2, 1], k: 2, expect: 2 },
    { visible: false, nums: [2, 2, 1], k: 3, expect: 1 },
    // Already sorted and reverse sorted.
    { visible: false, nums: [1, 2, 3, 4, 5], k: 2, expect: 4 },
    { visible: false, nums: [5, 4, 3, 2, 1], k: 2, expect: 4 },
    // Negative values.
    { visible: false, nums: [-1, -5, -3], k: 2, expect: -3 },
    { visible: false, nums: [-1, -5, -3], k: 3, expect: -5 },
  ],
  reference: `function findKthLargest(nums, k) {
  // Keep a min-heap of at most k entries: its root is the smallest of the k
  // largest seen so far, so it is the answer once k values have been accepted.
  const heap = [];
  const push = (v) => {
    heap.push(v);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent] <= heap[i]) break;
      const t = heap[parent];
      heap[parent] = heap[i];
      heap[i] = t;
      i = parent;
    }
  };
  const popMin = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let small = i;
        if (l < heap.length && heap[l] < heap[small]) small = l;
        if (r < heap.length && heap[r] < heap[small]) small = r;
        if (small === i) break;
        const t = heap[small];
        heap[small] = heap[i];
        heap[i] = t;
        i = small;
      }
    }
    return top;
  };
  for (const v of nums) {
    push(v);
    if (heap.length > k) popMin();
  }
  return heap[0];
}`,
};

CONTENT['Kth Largest Element in Stream'] = {
  signature: lang('kthLargestInStream',
    [['k', 'number'], ['values', 'number[]']],
    'number[]'),
  description:
    'Values arrive one at a time. After each arrival, report the k-th largest value seen so far, '
    + 'counting from 1, where the largest overall value is 1. Until k values have arrived there '
    + 'are not yet k values to rank, so the answer for those steps is -1. Return one entry per '
    + 'value in `values`, in arrival order.',
  input:
    'The parameters are `k` on the first line and `values` on the second line as the arrival '
    + 'sequence.',
  output:
    'Return one entry per arrival: -1 while fewer than k values have arrived, then the k-th '
    + 'largest value seen so far.',
  constraints: [
    '1 <= k <= 1000',
    '0 <= values.length <= 10000',
    '-10000 <= values[i] <= 10000',
  ],
  cases: [
    { visible: true, k: 3, values: [4, 5, 8, 2], expect: [-1, -1, 4, 4] },
    // k = 1 asks for the running maximum, so it only ever rises or holds.
    { visible: true, k: 1, values: [3, 2, 1], expect: [3, 3, 3] },
    { visible: true, k: 1, values: [-1, -2, -3], expect: [-1, -1, -1] },
    { visible: false, k: 1, values: [7], expect: [7] },
    // k = 2 with a single arrival: not enough values to rank.
    { visible: false, k: 2, values: [7], expect: [-1] },
    { visible: false, k: 2, values: [7, 3], expect: [-1, 3] },
    // No arrivals at all.
    { visible: false, k: 3, values: [], expect: [] },
    // k equal to the number of arrivals: only the final step is answerable.
    { visible: false, k: 4, values: [1, 2, 3, 4], expect: [-1, -1, -1, 1] },
    // The answer can rise again when a larger value arrives late.
    { visible: false, k: 2, values: [5, 4, 3, 9], expect: [-1, 4, 4, 5] },
    // Duplicates each occupy a rank.
    { visible: false, k: 2, values: [2, 2, 2], expect: [-1, 2, 2] },
    // Already sorted and reverse sorted streams.
    { visible: false, k: 3, values: [1, 2, 3, 4, 5], expect: [-1, -1, 1, 2, 3] },
    { visible: false, k: 3, values: [5, 4, 3, 2, 1], expect: [-1, -1, 3, 3, 3] },
  ],
  reference: `function kthLargestInStream(k, values) {
  // Min-heap of at most k entries. Once it is full its root is the k-th
  // largest of everything seen so far.
  const heap = [];
  const out = [];
  const siftUp = (i) => {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent] <= heap[i]) break;
      const t = heap[parent];
      heap[parent] = heap[i];
      heap[i] = t;
      i = parent;
    }
  };
  const popMin = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let small = i;
        if (l < heap.length && heap[l] < heap[small]) small = l;
        if (r < heap.length && heap[r] < heap[small]) small = r;
        if (small === i) break;
        const t = heap[small];
        heap[small] = heap[i];
        heap[i] = t;
        i = small;
      }
    }
    return top;
  };
  for (const v of values) {
    heap.push(v);
    siftUp(heap.length - 1);
    if (heap.length > k) popMin();
    out.push(heap.length === k ? heap[0] : -1);
  }
  return out;
}`,
};

CONTENT['Top K Frequent Words'] = {
  signature: lang('topKFrequentWords', [['words', 'string[]'], ['k', 'number']], 'string[]'),
  description:
    'Given a list of words and a number k, return the k most frequent words. Order the result by '
    + 'descending frequency, and when two words share a frequency order them alphabetically, with '
    + 'the alphabetically smaller word first. Return fewer than k words only when the list holds '
    + 'fewer than k distinct words.',
  input:
    'The parameters are `words` on the first line as an array of lowercase words, then `k` on the '
    + 'second line.',
  output: 'Return the k most frequent words, ordered by frequency then alphabetically.',
  constraints: [
    '1 <= words.length <= 10000',
    '1 <= k <= 10000',
    'Every word is 2 to 20 lowercase letters long',
  ],
  cases: [
    { visible: true, words: ['aa', 'bb', 'aa', 'bb', 'cc'], k: 2, expect: ['aa', 'bb'] },
    // 'the' and 'day' both occur twice, so the tie breaks ALPHABETICALLY to
    // ['day', 'the'] even though 'the' arrived first.
    { visible: true, words: ['the', 'day', 'the', 'day', 'sun', 'fun'], k: 2, expect: ['day', 'the'] },
    { visible: true, words: ['the', 'day', 'is', 'sunny', 'the', 'the', 'the', 'sunny', 'is', 'is'], k: 4, expect: ['the', 'is', 'sunny', 'day'] },
    // Single distinct word.
    { visible: false, words: ['aa', 'aa', 'aa'], k: 1, expect: ['aa'] },
    // k larger than the number of distinct words.
    { visible: false, words: ['aa', 'bb'], k: 5, expect: ['aa', 'bb'] },
    // All words share one frequency, so the alphabetical tie-break decides.
    { visible: false, words: ['bb', 'aa', 'cc'], k: 3, expect: ['aa', 'bb', 'cc'] },
    { visible: false, words: ['bb', 'aa', 'cc'], k: 2, expect: ['aa', 'bb'] },
    // Frequency outranks the alphabetical tie-break.
    { visible: false, words: ['zz', 'aa', 'aa', 'zz'], k: 2, expect: ['aa', 'zz'] },
    { visible: false, words: ['aa', 'bb', 'aa', 'bb', 'aa'], k: 1, expect: ['aa'] },
    { visible: false, words: ['aa', 'bb', 'aa', 'bb', 'aa'], k: 2, expect: ['aa', 'bb'] },
    // Input order must not change the answer.
    { visible: false, words: ['cc', 'bb', 'bb', 'aa', 'aa'], k: 2, expect: ['aa', 'bb'] },
    { visible: false, words: ['bb', 'aa', 'cc'], k: 1, expect: ['aa'] },
    // Three-way frequency tie broken alphabetically.
    { visible: false, words: ['mm', 'aa', 'aa', 'mm', 'bb', 'bb', 'mm', 'cc', 'cc', 'cc'], k: 3, expect: ['cc', 'mm', 'aa'] },
    // k = 1 with a single word.
    { visible: false, words: ['solo'], k: 1, expect: ['solo'] },
  ],
  reference: `function topKFrequentWords(words, k) {
  const counts = new Map();
  for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
  // Sort by count descending, then by the word itself ascending so that ties
  // resolve alphabetically.
  const ranked = Array.from(counts.keys()).sort((a, b) => {
    if (counts.get(b) !== counts.get(a)) return counts.get(b) - counts.get(a);
    return a < b ? -1 : (a > b ? 1 : 0);
  });
  return ranked.slice(0, k);
}`,
};

CONTENT['Task Scheduler'] = {
  signature: lang('leastInterval', [['tasks', 'string[]'], ['n', 'number']], 'number'),
  description:
    'Tasks are single uppercase letters. Two runs of the SAME task must be separated by at least n '
    + 'intervals, so running a task again too soon wastes intervals. Given the multiset of tasks to '
    + 'perform, return the SMALLEST number of intervals in which all of them can be completed. '
    + 'Intervals with nothing to run are allowed, and the answer counts them.',
  input:
    'The parameters are `tasks` on the first line as an array of single uppercase letters, then `n` '
    + 'on the second line.',
  output: 'Return the minimum number of intervals needed to run every task.',
  constraints: [
    '1 <= tasks.length <= 100000',
    '0 <= n <= 100',
    'Every task is a single uppercase letter, so at most 26 distinct tasks',
  ],
  cases: [
    { visible: true, tasks: ['A', 'A', 'A', 'B', 'B', 'C'], n: 1, expect: 6 },
    { visible: true, tasks: ['A', 'A', 'A', 'B', 'B', 'C'], n: 3, expect: 9 },
    { visible: true, tasks: ['A', 'A', 'A', 'B', 'B', 'C'], n: 0, expect: 6 },
    // A and B TIE for the highest frequency, so the frame needs a slot for each
    // of them: (2 - 1) * (3 + 1) + 2 = 6, where a single-task frame gives 5.
    { visible: true, tasks: ['A', 'A', 'B', 'B'], n: 3, expect: 6 },
    // One dominant task: with only one letter, every extra run needs a gap, so
    // the answer is far above the 8 task count.
    { visible: false, tasks: ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'], n: 2, expect: 22 },
    // All tasks identical: every run but the last needs a gap.
    { visible: false, tasks: ['A', 'A', 'A'], n: 2, expect: 7 },
    // One dominant task with single copies of the others: the other letters
    // only partly fill the gaps, so idles are still needed and the answer
    // exceeds the 10 task count.
    { visible: false, tasks: ['A', 'A', 'A', 'A', 'A', 'B', 'B', 'C', 'C', 'C'], n: 2, expect: 13 },
    { visible: false, tasks: ['A', 'B', 'C'], n: 5, expect: 3 },
    // Already-distinct tasks: the cooldown never bites.
    { visible: false, tasks: ['A', 'B', 'C', 'D', 'E'], n: 3, expect: 5 },
    // Two tasks tied at the top frequency.
    { visible: false, tasks: ['A', 'A', 'B', 'B'], n: 2, expect: 5 },
    { visible: false, tasks: ['A', 'A', 'B', 'B', 'B'], n: 2, expect: 7 },
    // Three tasks tied at the top frequency: three letters cannot fill the gap
    // pattern, so two idles are still needed above the 9 task count.
    { visible: false, tasks: ['A', 'A', 'A', 'B', 'B', 'B', 'C', 'C', 'C'], n: 2, expect: 9 },
    { visible: false, tasks: ['A'], n: 100, expect: 1 },
  ],
  reference: `function leastInterval(tasks, n) {
  const counts = new Map();
  for (const t of tasks) counts.set(t, (counts.get(t) || 0) + 1);
  const total = tasks.length;
  let maxFreq = 0;
  let maxCount = 0;
  for (const c of counts.values()) {
    if (c > maxFreq) { maxFreq = c; maxCount = 1; }
    else if (c === maxFreq) { maxCount++; }
  }
  // The busiest tasks set the frame width; every other task simply fills it.
  // Taking the larger of the frame count and the task count covers the case
  // where there are so few distinct tasks that no idles are ever needed.
  const frame = (maxFreq - 1) * (n + 1) + maxCount;
  return Math.max(total, frame);
}`,
};

CONTENT['IPO'] = {
  signature: lang('maxIpoCapital',
    [['k', 'number'], ['w', 'number'], ['costs', 'number[]'], ['profits', 'number[]']],
    'number'),
  description:
    'You start with w units of capital and may pick at most k projects, one after another. A '
    + 'project costs costs[i] up front, which you must be able to pay from your current capital, '
    + 'and then returns profits[i], so capital changes from c to c - costs[i] + profits[i]. Every '
    + 'project is worth at least what it costs, so picking one never reduces your capital. Return '
    + 'the largest capital you can end up with; picking nothing is allowed, so the answer is at '
    + 'least w.',
  input:
    'The parameters are `k` on the first line, `w` on the second line, then `costs` and `profits` '
    + 'on the third and fourth lines as arrays of equal length.',
  output: 'Return the maximum capital reachable by picking at most k projects.',
  constraints: [
    '1 <= k <= 100',
    '1 <= costs.length == profits.length <= 500',
    '1 <= costs[i], profits[i] <= 1000',
    'costs[i] <= profits[i] for every i, so no project can lose capital',
    '0 <= w <= 1000000',
  ],
  cases: [
    // Capital 0 cannot afford anything, so nothing is ever picked.
    { visible: true, k: 2, w: 0, costs: [1, 2, 3], profits: [1, 3, 4], expect: 0 },
    { visible: true, k: 3, w: 0, costs: [1, 2, 3], profits: [1, 3, 4], expect: 0 },
    // Only the cheap project is affordable (cost 5 > w = 1), and its net gain is 0,
    // so the capital stays at 1.
    { visible: true, k: 1, w: 1, costs: [1, 5], profits: [1, 9], expect: 1 },
    // Both projects are affordable at w = 5, but the one with the larger RAW
    // profit (11) costs 5 and so gains only 6, while the other gains 9. Taking
    // the biggest gain reaches 14; chasing the biggest profit reaches 11.
    { visible: true, k: 1, w: 5, costs: [1, 5], profits: [10, 11], expect: 14 },
    // Nothing affordable at the start, so the capital never moves.
    { visible: false, k: 2, w: 2, costs: [3, 4], profits: [4, 6], expect: 2 },
    // Project 0 is affordable but breaks even, so capital stays at 1 and the cost-2
    // project remains out of reach.
    { visible: false, k: 2, w: 1, costs: [1, 2], profits: [1, 6], expect: 1 },
    // The biggest NET gain wins even though the other project has a larger raw
    // profit: project 1 gains 1, project 2 gains 2.
    { visible: false, k: 1, w: 10, costs: [3, 5], profits: [5, 6], expect: 12 },
    { visible: false, k: 2, w: 10, costs: [3, 5], profits: [5, 6], expect: 13 },
    // A project worth exactly its cost changes nothing but is still worth taking.
    { visible: false, k: 1, w: 5, costs: [5], profits: [5], expect: 5 },
    { visible: false, k: 1, w: 5, costs: [4], profits: [5], expect: 6 },
    // Several affordable projects, all with net gain 1, taken in sequence.
    { visible: false, k: 3, w: 1, costs: [1, 1, 1], profits: [2, 2, 2], expect: 4 },
    // k larger than the number of projects.
    { visible: false, k: 10, w: 5, costs: [2], profits: [6], expect: 9 },
    // Capital builds to 4, then pays for project 2 whose gain is 98.
    { visible: false, k: 2, w: 2, costs: [2, 3], profits: [4, 101], expect: 102 },
    { visible: false, k: 1, w: 2, costs: [2, 3], profits: [4, 101], expect: 4 },
    // Boundary capital: enough for exactly the cost.
    { visible: false, k: 1, w: 3, costs: [3, 9], profits: [3, 20], expect: 3 },
  ],
  reference: `function maxIpoCapital(k, w, costs, profits) {
  // Every project satisfies costs[i] <= profits[i], so taking one never shrinks
  // the capital. Maximise the NET gain (profit - cost) rather than the raw
  // profit: a project can pay a large profit and still cost more than that,
  // and capital is what decides what you can afford next. Because more capital
  // can only unlock more projects, taking the largest affordable gain each
  // round is optimal.
  const n = costs.length;
  const done = new Array(n).fill(false);
  let capital = w;
  for (let picked = 0; picked < k; picked++) {
    let best = -1;
    let bestGain = -1;
    for (let i = 0; i < n; i++) {
      if (done[i] || costs[i] > capital) continue;
      const gain = profits[i] - costs[i];
      if (best === -1 || gain > bestGain) { best = i; bestGain = gain; }
    }
    if (best === -1) break;
    done[best] = true;
    capital += bestGain;
  }
  return capital;
}`,
};

CONTENT['Find K-th Smallest Pair Distance'] = {
  signature: lang('kthSmallestPairDistance',
    [['points', 'number[]'], ['k', 'number']],
    'number'),
  description:
    'Given the positions of `points.length` points on a line, return the k-th smallest DISTANCE '
    + 'between any two of them. Every unordered pair contributes one distance, so two pairs that '
    + 'happen to be equally far apart still count separately. The count starts at 1, so the '
    + 'closest pair is distance 1.',
  input:
    'The parameters are `points` on the first line as an array of integer positions, then `k` on '
    + 'the second line.',
  output: 'Return the k-th smallest distance between two points.',
  constraints: [
    '1 <= points.length <= 100000',
    '-10000000 <= points[i] <= 10000000',
    'k counts distinct PAIRS, so 1 <= k <= n * (n - 1) / 2',
  ],
  cases: [
    { visible: true, points: [1, 3, 1], k: 1, expect: 0 },
    // Points [1,1,3] give distances 0, 0, 2, so the 2nd smallest is 2.
    { visible: true, points: [1, 3, 1], k: 2, expect: 2 },
    { visible: true, points: [1, 1], k: 1, expect: 0 },
    // Pair distances are 1, 1, 2 here, so the 2nd PAIR is 1. Answering with the
    // 2nd DISTINCT distance would wrongly give 2.
    { visible: true, points: [0, 1, 2], k: 2, expect: 1 },
    // Duplicate points make distance 0 the smallest value.
    { visible: false, points: [1, 1, 1], k: 3, expect: 0 },
    // Negative coordinates.
    { visible: false, points: [-3, -1], k: 1, expect: 2 },
    { visible: false, points: [-3, -1, 0], k: 2, expect: 2 },
    // Already sorted and reverse sorted input.
    { visible: false, points: [1, 2, 3], k: 3, expect: 2 },
    { visible: false, points: [3, 2, 1], k: 3, expect: 2 },
    // The largest distance: the two extreme points.
    { visible: false, points: [1, 2, 3, 4], k: 6, expect: 3 },
    { visible: false, points: [1, 2, 3, 4], k: 1, expect: 1 },
    // Equal gaps mean several pairs share a distance.
    { visible: false, points: [1, 3, 5, 7], k: 6, expect: 6 },
    { visible: false, points: [0, 10], k: 1, expect: 10 },
    // Counting PAIRS, not distinct distances: the six pair distances here are
    // 1,1,1,2,2,3, so the 5th is 2. Collapsing to the distinct set {1,2,3}
    // would wrongly answer 3.
    { visible: false, points: [1, 2, 3, 4], k: 5, expect: 2 },
    // An uneven spread, where no two pairs share a distance. The six distances
    // are 1,3,4,6,9,10, so the 4th is 6.
    { visible: false, points: [0, 1, 4, 10], k: 4, expect: 6 },
    // Repeated points make many zero-distance pairs.
    { visible: false, points: [1, 1, 2], k: 2, expect: 1 },
    { visible: false, points: [1, 1, 2], k: 3, expect: 1 },
    // Large magnitudes.
    { visible: false, points: [-10000000, 10000000], k: 1, expect: 20000000 },
  ],
  reference: `function kthSmallestPairDistance(points, k) {
  const sorted = points.slice().sort((a, b) => a - b);
  let lo = 0;
  let hi = sorted[sorted.length - 1] - sorted[0];
  // Count the pairs at distance <= mid with a two-pointer sweep; the count is
  // non-decreasing in mid, so binary search finds the distance holding the k-th
  // pair.
  const countPairsAtMost = (d) => {
    let count = 0;
    let left = 0;
    for (let right = 0; right < sorted.length; right++) {
      while (sorted[right] - sorted[left] > d) left++;
      count += right - left;
    }
    return count;
  };
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (countPairsAtMost(mid) >= k) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}`,
};

CONTENT['Maximum Frequency Stack'] = {
  signature: lang('maxFrequencyStack', [['operations', 'string[]']], 'number[]'),
  description:
    'Maintain a stack-like structure where a value can be pushed several times. "push V" adds one '
    + 'more copy of V, raising its frequency. "freq V" reports how many copies of V are currently '
    + 'held, and returns that count. "popMax" removes ONE copy of whichever value currently has '
    + 'the highest frequency and returns that value; when several values tie for the highest '
    + 'frequency, remove the one pushed most recently. Return one entry per operation that reports '
    + 'a value, which is every "freq" and every "popMax", in order.',
  input:
    'The single parameter `operations` is a flat array of strings, each one either "push V", '
    + '"freq V" or "popMax".',
  output:
    'Return the result of every "freq" and every "popMax", in operation order. "push" returns '
    + 'nothing and contributes no entry.',
  constraints: [
    '1 <= operations.length <= 1000',
    'Every "push V" and "freq V" carries an integer value in [-1000, 1000]',
    'No "popMax" occurs while the structure is empty',
  ],
  cases: [
    { visible: true, operations: ['push 5', 'push 7', 'push 5', 'push 7', 'popMax'], expect: [7] },
    { visible: true, operations: ['push 5', 'push 7', 'freq 7', 'push 5', 'freq 5', 'popMax'], expect: [1, 2, 5] },
    // Every operation reports a value.
    { visible: true, operations: ['freq 1'], expect: [0] },
    // Emptying the structure completely.
    { visible: false, operations: ['push 1', 'push 1', 'popMax', 'popMax'], expect: [1, 1] },
    // A frequency tie is broken by the most recent push.
    { visible: false, operations: ['push 1', 'push 2', 'popMax'], expect: [2] },
    { visible: false, operations: ['push 1', 'push 2', 'push 1', 'popMax'], expect: [1] },
    // Negative values are ordinary values here.
    { visible: false, operations: ['push -1', 'push -2', 'freq -1', 'popMax'], expect: [1, -2] },
    { visible: false, operations: ['push -1', 'push -1', 'push -2', 'freq -1', 'popMax'], expect: [2, -1] },
    // A value can be pushed again after being popped.
    { visible: false, operations: ['push 3', 'push 4', 'popMax', 'push 3', 'freq 3', 'popMax'], expect: [4, 2, 3] },
    // A long run of one value (frequency 3) and a single push of another (frequency
    // 1): the frequent value still wins, leaving 9 untouched.
    { visible: false, operations: ['push 2', 'push 2', 'push 2', 'push 9', 'popMax', 'freq 2'], expect: [2, 2] },
    // freq on a value that has never been pushed.
    { visible: false, operations: ['push 1', 'freq 7', 'popMax'], expect: [0, 1] },
    // Only pushes, so nothing is reported.
    { visible: false, operations: ['push 1', 'push 2', 'push 3'], expect: [] },
  ],
  reference: `function maxFrequencyStack(operations) {
  const frequency = new Map();
  // One stack per frequency level, so the most recently pushed value of the
  // current maximum is always on top and popMax stays O(1).
  const groups = new Map();
  const results = [];
  let maxFreq = 0;
  for (const op of operations) {
    const parts = op.split(' ');
    if (parts[0] === 'push') {
      const v = Number(parts[1]);
      const f = (frequency.get(v) || 0) + 1;
      frequency.set(v, f);
      if (!groups.has(f)) groups.set(f, []);
      groups.get(f).push(v);
      if (f > maxFreq) maxFreq = f;
      continue;
    }
    if (parts[0] === 'freq') {
      results.push(frequency.get(Number(parts[1])) || 0);
      continue;
    }
    // popMax: drop stale entries whose value has since fallen below this level,
    // then take the top. If the level empties, step down until one has an entry,
    // because the maximum frequency can fall as values are removed.
    let level = groups.get(maxFreq);
    while (maxFreq > 0 && level && level.length === 0) {
      maxFreq--;
      level = groups.get(maxFreq);
    }
    while (level && level.length && frequency.get(level[level.length - 1]) !== maxFreq) {
      level.pop();
    }
    const top = level[level.length - 1];
    level.pop();
    frequency.set(top, frequency.get(top) - 1);
    results.push(top);
  }
  return results;
}`,
};

CONTENT['Trapping Rain Water II'] = {
  signature: lang('trapRainWater2D', [['heightMap', 'number[][]']], 'number'),
  description:
    'Given an m x n grid of non-negative heights, rain falls and water flows to any of the four '
    + 'neighbours. Water cannot escape except by running off the outside edge of the grid, so a '
    + 'cell fills up to the LOWEST level along any route from that cell to the border. Return the '
    + 'total amount of water held across all cells. The border cells themselves can never hold '
    + 'water, because any water there has already run off.',
  input:
    'The single parameter `heightMap` is the grid on the first line, as an array of rows.',
  output: 'Return the total volume of water the grid can hold.',
  constraints: [
    '1 <= heightMap.length <= 200',
    '1 <= heightMap[0].length <= 200',
    'Every row has the same length',
    '0 <= heightMap[i][j] <= 10000',
  ],
  cases: [
    // Interior cell (1,1)=2 can escape sideways at level 3 and cell (1,2)=3 at
    // level 3, so nothing is trapped.
    { visible: true, heightMap: [[1, 4, 3, 1], [3, 2, 3, 4], [2, 2, 3, 1]], expect: 0 },
    { visible: true, heightMap: [[3, 4, 3, 3], [2, 2, 2, 4], [1, 1, 1, 4]], expect: 0 },
    // A single interior pit one unit below its surroundings.
    { visible: false, heightMap: [[5, 5, 5], [5, 0, 5], [5, 5, 5]], expect: 5 },
    // A single row or column has no interior at all.
    { visible: false, heightMap: [[1, 2, 3]], expect: 0 },
    { visible: false, heightMap: [[1], [2], [3]], expect: 0 },
    { visible: false, heightMap: [[5]], expect: 0 },
    // A deep pit fills only to the lowest rim.
    { visible: false, heightMap: [[5, 5, 5, 5], [5, 0, 5, 5], [5, 5, 5, 5]], expect: 5 },
    // Opening the floor lets the water drain, so LESS is held than in the
    // closed grid above it. A 2D result must differ from the 1D result here.
    { visible: false, heightMap: [[5, 5, 5, 5], [5, 1, 4, 5], [5, 5, 5, 5]], expect: 5 },
    { visible: false, heightMap: [[5, 5, 5, 5], [5, 1, 4, 5], [5, 4, 5, 5]], expect: 3 },
    // The low border row is the escape route, so only the pit cell holds water.
    { visible: false, heightMap: [[9, 9, 9], [9, 0, 9], [1, 1, 1]], expect: 1 },
    // All equal heights hold nothing.
    { visible: false, heightMap: [[2, 2, 2], [2, 2, 2]], expect: 0 },
    // Every cell can reach the border without climbing past its own height.
    { visible: false, heightMap: [[0, 1, 0], [1, 2, 1], [0, 1, 0]], expect: 0 },
    // Two basins at different depths: (1,1) holds 3 and (1,3) holds 4.
    { visible: false, heightMap: [[4, 4, 4, 4, 4], [4, 1, 4, 0, 4], [4, 4, 4, 4, 4]], expect: 7 },
  ],
  reference: `function trapRainWater2D(heightMap) {
  const rows = heightMap.length;
  if (rows === 0) return 0;
  const cols = heightMap[0].length;
  if (cols === 0) return 0;
  // Build the visited grid up front: pushing into it in a loop would lose the
  // rows allocated so far.
  const visited = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push(false);
    visited.push(row);
  }
  // The border is where water escapes, so every border cell starts the frontier
  // at its own height.
  const heap = [];
  for (let c = 0; c < cols; c++) {
    visited[0][c] = true;
    heap.push([heightMap[0][c], 0, c]);
    visited[rows - 1][c] = true;
    heap.push([heightMap[rows - 1][c], rows - 1, c]);
  }
  for (let r = 0; r < rows; r++) {
    visited[r][0] = true;
    heap.push([heightMap[r][0], r, 0]);
    visited[r][cols - 1] = true;
    heap.push([heightMap[r][cols - 1], r, cols - 1]);
  }
  let water = 0;
  // Binary min-heap over [height, row, column]. The array must be heapified
  // after seeding: pushing entries straight into an unsorted array would let a
  // HIGH border cell be popped before a LOWER one, so an enclosed cell would be
  // flooded to the wrong level.
  const siftDown = (start) => {
    let i = start;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let s = i;
      if (l < heap.length && heap[l][0] < heap[s][0]) s = l;
      if (r < heap.length && heap[r][0] < heap[s][0]) s = r;
      if (s === i) break;
      const t = heap[s];
      heap[s] = heap[i];
      heap[i] = t;
      i = s;
    }
  };
  const push = (item) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      const t = heap[p];
      heap[p] = heap[i];
      heap[i] = t;
      i = p;
    }
  };
  const popMin = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      siftDown(0);
    }
    return top;
  };
  for (let i = Math.floor(heap.length / 2) - 1; i >= 0; i--) siftDown(i);
  while (heap.length) {
    const [level, r, c] = popMin();
    const neighbours = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
    for (const [nr, nc] of neighbours) {
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (visited[nr][nc]) continue;
      visited[nr][nc] = true;
      // Water above this cell up to the frontier level is trapped.
      if (heightMap[nr][nc] < level) water += level - heightMap[nr][nc];
      push([Math.max(level, heightMap[nr][nc]), nr, nc]);
    }
  }
  return water;
}`,
};

module.exports = { CONTENT, lang };