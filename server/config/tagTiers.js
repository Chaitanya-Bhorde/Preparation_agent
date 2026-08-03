// Static mapping of problem tags to skill tiers
// Fundamental: core data structures and basic algorithms
// Intermediate: advanced algorithms and patterns
// Advanced: specialized/domain-specific algorithms

const FUNDAMENTAL_TAGS = new Set([
  'Array',
  'String',
  'Hash Table',
  'Linked List',
  'Stack',
  'Queue',
  'Tree',
  'Binary Tree',
  'Binary Search Tree',
  'Graph',
  'Sorting',
  'Searching',
  'Two Pointers',
  'Recursion',
  'Math',
  'Bit Manipulation',
  'Sliding Window',
]);

const INTERMEDIATE_TAGS = new Set([
  'Dynamic Programming',
  'DP',
  'Greedy',
  'Binary Search',
  'Heap',
  'Trie',
  'Backtracking',
  'Divide and Conquer',
  'Merge Sort',
  'Quick Sort',
  'Breadth-First Search',
  'Depth-First Search',
  'Topological Sort',
  'Shortest Path',
  'Minimum Spanning Tree',
  'Union Find',
  'Disjoint Set',
]);

const ADVANCED_TAGS = new Set([
  'Segment Tree',
  'Fenwick Tree',
  'Binary Indexed Tree',
  'Suffix Array',
  'Suffix Automaton',
  'Suffix Tree',
  'Aho-Corasick',
  'Rabin-Karp',
  'KMP',
  'Z Algorithm',
  'Mo\'s Algorithm',
  'Heavy-Light Decomposition',
  'Centroid Decomposition',
  'Convex Hull',
  'Line Sweep',
  'Geometry',
  'Number Theory',
  'Game Theory',
  'Probability',
  'Matrix',
  'Bitmask DP',
  'State Compression',
  'Meet-in-the-Middle',
  'Parametric Search',
  'Network Flow',
  'Bipartite Matching',
  'Strongly Connected Component',
  'Eulerian Path',
  'Hamiltonian Path',
  'NP-Complete',
]);

function getTagTier(tag) {
  if (FUNDAMENTAL_TAGS.has(tag)) return 'Fundamental';
  if (INTERMEDIATE_TAGS.has(tag)) return 'Intermediate';
  if (ADVANCED_TAGS.has(tag)) return 'Advanced';
  return 'Fundamental'; // default fallback
}

function getTierStats() {
  return {
    Fundamental: { label: 'Fundamental', tags: [...FUNDAMENTAL_TAGS] },
    Intermediate: { label: 'Intermediate', tags: [...INTERMEDIATE_TAGS] },
    Advanced: { label: 'Advanced', tags: [...ADVANCED_TAGS] },
  };
}

module.exports = { getTagTier, getTierStats, FUNDAMENTAL_TAGS, INTERMEDIATE_TAGS, ADVANCED_TAGS };
