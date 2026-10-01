'use strict';

/**
 * Whether each batch title fixes its own contract.
 *
 * unambiguous: the title alone names one universally defined algorithm, so
 *   both the task and the output shape follow from convention.
 * variants: materially different readings that share the title. When these
 *   exist the intended problem cannot be established from the repository.
 */
module.exports = {
  'Spiral Matrix': {
    unambiguous: true,
    note: 'Single standard contract: return the elements of an m x n matrix in clockwise spiral order.',
  },
  'Subarray Sum Equals K': {
    unambiguous: true,
    note: 'Single standard contract: count contiguous subarrays whose sum equals k.',
  },
  '3Sum Closest': {
    unambiguous: true,
    note: 'Single standard contract: sum of the three integers whose total is closest to target.',
  },
  '4Sum': {
    unambiguous: false,
    variants: [
      'sorted list of quadruplets',
      'count of quadruplets summing to 0',
      'four-element sum closest to target',
      'smallest-first-element quadruple',
    ],
    note: 'The title admits four materially different contracts with different outputs.',
  },
  'Sort an Array': {
    unambiguous: false,
    variants: [
      'ascending integer sort',
      'descending sort',
      'sort by a custom comparator',
      'sort objects by a key',
      'sort by frequency',
    ],
    note: 'No ordering, key or comparator is specified anywhere in the record.',
  },
  'Sliding Window Maximum': {
    unambiguous: true,
    note: 'Single standard contract: for each index, the maximum value within that window.',
  },
  'Maximum Gap': {
    unambiguous: true,
    note: 'Single standard contract: largest difference between consecutive sorted values.',
  },
  'Palindromic Substrings': {
    unambiguous: true,
    note: 'Single standard contract: count of contiguous substrings that are palindromes.',
  },
  'Word Ladder II': {
    unambiguous: false,
    variants: [
      'all shortest transformation sequences',
      'number of shortest sequences',
      'lexicographically smallest sequence only',
      'sequences of any length',
    ],
    note: 'Shares its title with the count-returning sibling; the output shape is not evidenced.',
  },
  'Longest Happy Prefix': {
    unambiguous: true,
    note: 'Single standard contract: length of the longest prefix that is also a suffix.',
  },
  'Repeated Substring Pattern': {
    unambiguous: true,
    note: 'Single standard contract: boolean whether s can be built by repeating a shorter string.',
  },
  'Reverse Words in String': {
    unambiguous: false,
    variants: [
      'trim and collapse internal spaces',
      'reverse characters within words only',
      'preserve original spacing exactly',
    ],
    note: 'The spacing and trimming rule, which is the substance of this problem, is unstated.',
  },
  'Find First Unique Character': {
    unambiguous: true,
    note: 'Single standard contract: index of the first non-repeating character, else -1.',
  },
  'House Robber II': {
    unambiguous: true,
    note: 'Single standard contract: circular-array House Robber, maximum sum of non-adjacent values.',
  },
  'Coin Change II': {
    unambiguous: false,
    variants: [
      'number of combinations making the amount with unlimited coins',
      'minimum number of coins',
      'number of ordered sequences',
    ],
    note: 'Ambiguous between the combinations problem and its min-coins sibling.',
  },
  'Unique Paths II': {
    unambiguous: true,
    note: 'Single standard contract: count grid paths that avoid blocked cells.',
  },
  'Longest Common Subsequence': {
    unambiguous: true,
    note: 'Single standard contract: length of the longest common subsequence of two sequences.',
  },
  'Minimum Path Sum': {
    unambiguous: false,
    variants: [
      'minimum top-left to bottom-right grid sum',
      'minimum falling path',
      'minimum sum with arbitrary start and end',
    ],
    note: 'Several distinct minimum-path problems share this title.',
  },
  'Target Sum': {
    unambiguous: false,
    variants: [
      'assign + or - to reach target',
      'subset sum against a target',
      'assign +1 and -1 to reach a target difference',
    ],
    note: 'Only the title exists; the operator set and target semantics are unstated.',
  },
  'Partition Equal Subset Sum': {
    unambiguous: true,
    note: 'Single standard contract: boolean whether the array splits into two equal-sum subsets.',
  },
};