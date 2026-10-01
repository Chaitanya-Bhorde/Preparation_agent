'use strict';

/**
 * dsaBatch4Contracts.js
 * ---------------------------------------------------------------------------
 * Per-problem judgement on whether the contract can be established from the
 * title alone, for the 20 records batch 4 selected.
 *
 * A title is enough ONLY when it names one universally defined algorithm, so
 * both the task and the output shape follow from convention. Where a title
 * admits materially different contracts - different input, different return
 * type, or an answer that is not uniquely determined - the intended problem
 * cannot be derived from the record and it must go to manual review.
 *
 * Three of these return a NODE/OBJECT graph or a non-unique answer, which an
 * exact-match judge cannot express without an invented format.
 * ---------------------------------------------------------------------------
 */

const CONTRACTS = {

  // -------------------------------------------------------------------- Tree
  'Binary Tree Zigzag Level Order': {
    unambiguous: true,
    note: 'Level-order traversal of the values, alternating left-to-right and right-to-left on '
      + 'alternate levels, as one flat array of values. The active "Binary Tree Level Order '
      + 'Traversal" already returns values, so this is consistent with the catalogue.',
  },
  'Path Sum II': {
    unambiguous: true,
    note: 'Count of root-to-leaf paths whose values sum to a target. Distinct from "Path Sum" '
      + '(already active, returns a boolean) and from "Path Sum III" (starts at ANY node).',
  },
  'Path Sum III': {
    unambiguous: true,
    note: 'Count of downward paths starting at ANY node whose values sum to a target. Negative '
      + 'values are allowed, which is what makes it differ from Path Sum II.',
  },
  'Convert Sorted List to BST': {
    unambiguous: false,
    note: 'Same non-uniqueness as "Convert Sorted Array to BST": the output tree is one of '
      + 'exponentially many height-balanced trees, and the list gives no extra information that '
      + 'pins one of them down. An exact-match judge would mark a correct solution wrong.',
    variants: ['lower midpoint as root', 'upper midpoint as root', 'any height-balanced BST'],
  },
  'Flatten Binary Tree to Linked List': {
    unambiguous: true,
    note: 'Flatten to a list in PREORDER order. The catalogue represents the result as a flat '
      + 'array of node values, its established linked-list convention.',
  },
  'Construct Binary Tree Preorder Inorder': {
    unambiguous: true,
    note: 'Rebuild a binary tree from its preorder and inorder traversals. Unique whenever the '
      + 'traversals contain distinct values, which the authored constraints require.',
  },
  'Binary Tree Right Side View': {
    unambiguous: true,
    note: 'The values visible looking at the tree from its right side: for each level, the '
      + 'rightmost node. One canonical answer per level.',
  },
  'Kth Smallest Element in BST': {
    unambiguous: true,
    note: 'The k-th smallest value in a binary search tree, 1-indexed. Unique.',
  },
  'Count Complete Tree Nodes': {
    unambiguous: true,
    note: 'The number of nodes in a complete binary tree, as a single number. Unique.',
  },
  'Binary Tree Level Order II': {
    unambiguous: true,
    note: 'Level-order traversal grouped per level, but BOTTOM-UP. The canonical counterpart of '
      + 'the active top-down "Binary Tree Level Order Traversal".',
  },
  'Sum Root to Leaf Numbers': {
    unambiguous: true,
    note: 'Each root-to-leaf path forms a number by concatenating its digits left to right; return '
      + 'the sum. The path DOES pass through the root, which separates it from the variant that '
      + 'starts at every node.',
  },

  // ------------------------------------------------------------------- Graph
  'Clone Graph': {
    unambiguous: false,
    note: 'The return value is a NODE OBJECT GRAPH, not a value. This platform has no canonical '
      + 'text form for that: object identity, neighbour ordering and pointer identity are all '
      + 'unconstrained, so no expected-output string can be both correct and unique.',
    variants: ['return a cloned node graph (no canonical serialisation)',
      'return an adjacency list (a different contract)'],
  },
  'Max Area of Island': {
    unambiguous: true,
    note: 'Largest area of a group of connected 1s in a binary grid, where connectivity is '
      + 'up/down/left/right. Four-directional connectivity is the standard definition and is '
      + 'stated explicitly, since eight-directional variants also exist.',
  },
  'Pacific Atlantic Water Flow': {
    unambiguous: true,
    note: 'Grid cells from which water reaches BOTH the Pacific (top/left edges) and the Atlantic '
      + '(bottom/right edges). The two borders and their directions are stated in the description.',
  },
  'Surrounded Regions': {
    unambiguous: true,
    note: 'Replace every 4-connected region of X that does NOT touch the grid border with O; leave '
      + 'border-touching X as X. One canonical output.',
  },
  'Course Schedule II': {
    unambiguous: true,
    note: 'Return ONE valid ordering of the courses, or an empty array when a cycle makes one '
      + 'impossible. The algorithm is unambiguous; the description fixes a deterministic tie-break '
      + 'so the answer key is unique.',
  },
  'Number of Connected Components': {
    unambiguous: true,
    note: 'Number of connected components in an undirected graph given as an adjacency list.',
  },
  'Graph Valid Tree': {
    unambiguous: true,
    note: 'Decide whether a graph given as an edge list is a valid tree: connected and with exactly '
      + 'n-1 edges. Both conditions are stated.',
  },
  'Redundant Connection': {
    unambiguous: false,
    note: 'The answer is a CONNECTION, and the canonical problem allows ANY redundant edge to be '
      + 'returned. An exact-match judge needs one specific edge, which the title does not pick. '
      + 'Same non-uniqueness class as Convert Sorted Array to BST.',
    variants: ['any redundant connection (many valid answers)',
      'the first redundant connection scanning in input order (must be stated)'],
  },
  'Accounts Merge': {
    unambiguous: false,
    note: 'The return value is a graph of MERGED USER ACCOUNTS (user -> set of emails). Like Clone '
      + 'Graph this is an object graph with no canonical text form and no specified email ordering, '
      + 'so the expected output is not well defined.',
    variants: ['return merged user -> emails mapping (no canonical order)',
      'return a sorted adjacency list (a different contract)'],
  },

};

module.exports = CONTRACTS;