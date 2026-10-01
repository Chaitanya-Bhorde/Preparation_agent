'use strict';

/**
 * dsaBatch3Contracts.js
 * ---------------------------------------------------------------------------
 * Per-problem judgement on whether the contract can be established from the
 * title alone, for the 20 records batch 3 selected.
 *
 * A title is enough ONLY when it names one universally defined algorithm, so
 * both the task and the output shape follow from convention. Where a title
 * admits materially different contracts - different input, different return
 * type, or an answer that is not uniquely determined - the intended problem
 * cannot be derived from the record and it must go to manual review.
 *
 * Rejections below are deliberately strict: a wrong answer key shipped to a
 * learner is worse than an inactive problem.
 * ---------------------------------------------------------------------------
 */

const CONTRACTS = {

  // ------------------------------------------------------------- Linked list
  'Remove Duplicates from Sorted List II': {
    unambiguous: true,
    note: 'Removes every node whose value appears more than once, keeping only values that occur once. '
      + 'The canonical counterpart of "Remove Duplicates from Sorted List", which keeps one copy instead. '
      + 'Single flat value array, the representation already used by the active linked-list problems.',
  },
  'Sort List': {
    unambiguous: true,
    note: 'Sorts a singly linked list in ascending order and returns the node values in order. '
      + 'One canonical task with one output shape.',
  },

  // ------------------------------------------------------------------ Design
  'LRU Cache': {
    unambiguous: true,
    note: 'Capacity-bounded cache with universally agreed semantics: get returns the stored value or -1 '
      + 'when absent and marks the entry most recently used; put inserts or updates and, when full, '
      + 'evicts the least recently used entry. Recency is totally ordered by operation index, so there '
      + 'are no ties and the output is uniquely determined. Operations are supplied as an explicit '
      + 'sequence, which is a representation choice rather than a different problem.',
  },
  'LFU Cache': {
    unambiguous: true,
    note: 'As LRU but evicting the least frequently used entry, breaking frequency ties by evicting the '
      + 'least recently used of those. The tie-break is part of the standard definition and is stated '
      + 'explicitly in the authored description so the answer key is unambiguous.',
  },
  'Design Twitter': {
    unambiguous: false,
    note: 'Two materially different problems share this title. The system-design reading asks for an '
      + 'architecture - timeline fan-out on write versus read, sharding, storage choice - and has no '
      + 'canonical input or output at all. The algorithmic reading is a fixed API (follow, unfollow, '
      + 'postTweet, getNewsFeed) with a specific return shape. They are not the same problem and the '
      + 'record supplies nothing to choose between them.',
    variants: ['system-design interview question (no I/O contract)',
      'algorithmic API with follow/unfollow/postTweet/getNewsFeed'],
  },
// ------------------------------------------------------------------- Stack
  'Valid Parenthesis String': {
    unambiguous: true,
    note: 'Decides whether a string of "(" and ")" can be split into valid parentheses blocks - the '
      + '"()()" is valid" rule, which is deliberately weaker than fully balanced parentheses. The '
      + 'distinction is stated in the authored description.',
  },
  'Simplify Path': {
    unambiguous: true,
    note: 'Canonical Unix path normalisation: collapse repeated separators, resolve "." and "..", and '
      + 'return an absolute path with no trailing slash. One canonical task.',
  },
  'Evaluate Reverse Polish Notation': {
    unambiguous: true,
    note: 'Evaluates postfix token list with + - * /, dividing by truncating toward zero. One canonical '
      + 'task with one output shape.',
  },
  'Next Greater Element I': {
    unambiguous: true,
    note: 'For each value of the first array returns the next strictly greater value in the second array, '
      + 'scanning left to right, or -1 when none exists. One canonical task.',
  },
  'Next Greater Element II': {
    unambiguous: true,
    note: 'The circular-array form of the previous problem: the search wraps around, so a larger value '
      + 'to the right of the last element may still count.',
  },
  'Basic Calculator': {
    unambiguous: true,
    note: 'Evaluates an expression containing only +, - and parentheses. No multiplication, no unary '
      + 'minus; the authored description says so explicitly.',
  },
  'Basic Calculator II': {
    unambiguous: true,
    note: 'Evaluates an expression containing + - * / with normal precedence, no parentheses, integer '
      + 'division truncating toward zero. Distinct from "Basic Calculator" by exactly these two '
      + 'differences, both stated in the authored description.',
  },
  'Largest Rectangle in Histogram': {
    unambiguous: true,
    note: 'Largest axis-aligned rectangle area under a bar chart. One canonical task.',
  },
  'Maximal Rectangle': {
    unambiguous: true,
    note: 'Largest rectangle consisting only of 1s in a binary matrix. One canonical task.',
  },
  'Remove All Adjacent Duplicates': {
    unambiguous: false,
    note: 'At least two standard problems share this title and they return different answers. The '
      + 'fully-reducing form repeatedly removes adjacent equal pairs until none remain; the '
      + 'k-parameter form removes exactly k adjacent duplicates at a time and needs an extra input; a '
      + 'single-pass form removes each run once. Nothing in the record selects one, and the same input '
      + 'such as "abbaca" yields different expected outputs under each reading.',
    variants: ['repeatedly remove adjacent pairs until none remain',
      'remove runs of exactly k adjacent duplicates (extra input k)',
      'single pass, remove each adjacent pair once'],
  },
  'Online Stock Span': {
    unambiguous: true,
    note: 'For each daily price reports the number of consecutive days back to the previous strictly '
      + 'higher price, inclusive of today. One canonical task.',
  },

  // -------------------------------------------------------------------- Tree
  'Binary Tree Postorder Traversal': {
    unambiguous: true,
    note: 'Postorder traversal - left subtree, right subtree, root - returning the node values. '
      + 'The tree arrives as a level-order array with null for missing children, the convention the '
      + 'active tree problems already use.',
  },
  'Balanced Binary Tree': {
    unambiguous: true,
    note: 'True when, at every node, the heights of the two subtrees differ by at most one. One '
      + 'canonical definition.',
  },
  'Convert Sorted Array to BST': {
    unambiguous: false,
    note: 'The answer is not uniquely determined. Every height-balanced BST over the same sorted array '
      + 'is a valid answer, and there are exponentially many, so an exact-match judge would reject a '
      + 'correct solution that chose a different midpoint. LeetCode accepts any of them, which this '
      + 'platform cannot do without inventing a tie-break rule the title does not state.',
    variants: ['choose the lower midpoint as root', 'choose the upper midpoint as root',
      'any height-balanced BST (exponentially many valid answers)'],
  },
  'Diameter of Binary Tree': {
    unambiguous: true,
    note: 'Number of edges on the longest path between any two nodes. The authored description states '
      + 'edges explicitly so the classic off-by-one against node counting cannot pass.',
  },

};

module.exports = CONTRACTS;