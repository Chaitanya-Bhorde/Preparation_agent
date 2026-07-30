const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const CodingProblem = require('../models/CodingProblem');

// A focused set of 150+ unique coding problems
const codingProblems = [
  // Arrays (30 problems)
  { title: 'Two Sum', topic: 'Arrays', tags: ['array', 'hash-table'], difficulty: 'easy' },
  { title: 'Valid Palindrome', topic: 'Arrays', tags: ['array', 'two-pointer'], difficulty: 'easy' },
  { title: 'Best Time to Buy and Sell Stock', topic: 'Arrays', tags: ['array', 'dynamic-programming'], difficulty: 'easy' },
  { title: 'Move Zeroes', topic: 'Arrays', tags: ['array', 'two-pointer'], difficulty: 'easy' },
  { title: 'Contains Duplicate', topic: 'Arrays', tags: ['array', 'hash-table'], difficulty: 'easy' },
  { title: 'Pascals Triangle', topic: 'Arrays', tags: ['array', 'dynamic-programming'], difficulty: 'easy' },
  { title: 'Remove Duplicates from Sorted Array', topic: 'Arrays', tags: ['array', 'two-pointer'], difficulty: 'easy' },
  { title: 'Rotate Array', topic: 'Arrays', tags: ['array', 'math'], difficulty: 'medium' },
  { title: 'Product of Array Except Self', topic: 'Arrays', tags: ['array', 'prefix-sum'], difficulty: 'medium' },
  { title: 'Maximum Subarray', topic: 'Arrays', tags: ['array', 'dynamic-programming'], difficulty: 'medium' },
  { title: 'Merge Intervals', topic: 'Arrays', tags: ['array', 'sorting'], difficulty: 'medium' },
  { title: 'Spiral Matrix', topic: 'Arrays', tags: ['array', 'simulation'], difficulty: 'medium' },
  { title: 'Set Matrix Zeroes', topic: 'Arrays', tags: ['array', 'matrix'], difficulty: 'medium' },
  { title: 'Subarray Sum Equals K', topic: 'Arrays', tags: ['array', 'hash-table', 'prefix-sum'], difficulty: 'medium' },
  { title: 'Sort Colors', topic: 'Arrays', tags: ['array', 'sorting', 'two-pointer'], difficulty: 'medium' },
  { title: '3Sum', topic: 'Arrays', tags: ['array', 'two-pointer', 'sorting'], difficulty: 'medium' },
  { title: '3Sum Closest', topic: 'Arrays', tags: ['array', 'two-pointer'], difficulty: 'medium' },
  { title: '4Sum', topic: 'Arrays', tags: ['array', 'two-pointer', 'hash-table'], difficulty: 'medium' },
  { title: 'Group Anagrams', topic: 'Arrays', tags: ['array', 'hash-table', 'string'], difficulty: 'medium' },
  { title: 'Container With Most Water', topic: 'Arrays', tags: ['array', 'two-pointer'], difficulty: 'medium' },
  { title: 'Minimum Size Subarray Sum', topic: 'Arrays', tags: ['array', 'sliding-window'], difficulty: 'medium' },
  { title: 'Maximum Product Subarray', topic: 'Arrays', tags: ['array', 'dynamic-programming'], difficulty: 'medium' },
  { title: 'Find Peak Element', topic: 'Arrays', tags: ['array', 'binary-search'], difficulty: 'medium' },
  { title: 'Sort an Array', topic: 'Arrays', tags: ['array', 'sorting'], difficulty: 'medium' },
  { title: 'Increasing Triplet Subsequence', topic: 'Arrays', tags: ['array', 'greedy'], difficulty: 'medium' },
  { title: 'Trapping Rain Water', topic: 'Arrays', tags: ['array', 'two-pointer', 'stack'], difficulty: 'hard' },
  { title: 'First Missing Positive', topic: 'Arrays', tags: ['array', 'hash-table'], difficulty: 'hard' },
  { title: 'Median of Two Sorted Arrays', topic: 'Arrays', tags: ['array', 'binary-search'], difficulty: 'hard' },
  { title: 'Sliding Window Maximum', topic: 'Arrays', tags: ['array', 'sliding-window', 'heap'], difficulty: 'hard' },
  { title: 'Maximum Gap', topic: 'Arrays', tags: ['array', 'sorting', 'bucket-sort'], difficulty: 'hard' },

  // Strings (25 problems)
  { title: 'Valid Parentheses String', topic: 'Strings', tags: ['string', 'stack'], difficulty: 'easy' },
  { title: 'Roman to Integer', topic: 'Strings', tags: ['string', 'hash-table'], difficulty: 'easy' },
  { title: 'Implement strStr', topic: 'Strings', tags: ['string', 'two-pointer'], difficulty: 'easy' },
  { title: 'Longest Common Prefix', topic: 'Strings', tags: ['string', 'sorting'], difficulty: 'easy' },
  { title: 'Valid Anagram', topic: 'Strings', tags: ['string', 'hash-table'], difficulty: 'easy' },
  { title: 'Count and Say', topic: 'Strings', tags: ['string', 'recursion'], difficulty: 'medium' },
  { title: 'String to Integer', topic: 'Strings', tags: ['string', 'math'], difficulty: 'medium' },
  { title: 'Longest Substring Without Repeating', topic: 'Strings', tags: ['string', 'sliding-window'], difficulty: 'medium' },
  { title: 'Longest Palindromic Substring', topic: 'Strings', tags: ['string', 'dynamic-programming'], difficulty: 'medium' },
  { title: 'Multiply Strings', topic: 'Strings', tags: ['string', 'math'], difficulty: 'medium' },
  { title: 'Integer to Roman', topic: 'Strings', tags: ['string', 'math'], difficulty: 'medium' },
  { title: 'Group Anagrams', topic: 'Strings', tags: ['string', 'hash-table', 'sorting'], difficulty: 'medium' },
  { title: 'Palindromic Substrings', topic: 'Strings', tags: ['string', 'dynamic-programming'], difficulty: 'medium' },
  { title: 'Longest Repeating Character Replacement', topic: 'Strings', tags: ['string', 'sliding-window'], difficulty: 'medium' },
  { title: 'Zigzag Conversion', topic: 'Strings', tags: ['string', 'simulation'], difficulty: 'medium' },
  { title: 'Generate Parentheses', topic: 'Strings', tags: ['string', 'backtracking'], difficulty: 'medium' },
  { title: 'Letter Combinations', topic: 'Strings', tags: ['string', 'backtracking'], difficulty: 'medium' },
  { title: 'Minimum Window Substring', topic: 'Strings', tags: ['string', 'sliding-window', 'hash-table'], difficulty: 'hard' },
  { title: 'Word Ladder', topic: 'Strings', tags: ['string', 'graph', 'breadth-first-search'], difficulty: 'hard' },
  { title: 'Word Ladder II', topic: 'Strings', tags: ['string', 'graph', 'breadth-first-search'], difficulty: 'hard' },
  { title: 'Longest Happy Prefix', topic: 'Strings', tags: ['string', 'rolling-hash'], difficulty: 'hard' },
  { title: 'Repeated Substring Pattern', topic: 'Strings', tags: ['string'], difficulty: 'easy' },
  { title: 'Reverse Words in String', topic: 'Strings', tags: ['string'], difficulty: 'medium' },
  { title: 'Find First Unique Character', topic: 'Strings', tags: ['string', 'hash-table'], difficulty: 'easy' },
  { title: 'Valid Palindrome II', topic: 'Strings', tags: ['string', 'two-pointer'], difficulty: 'easy' },

  // Dynamic Programming (25 problems)
  { title: 'Climbing Stairs', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'math'], difficulty: 'easy' },
  { title: 'House Robber', topic: 'Dynamic Programming', tags: ['dynamic-programming'], difficulty: 'medium' },
  { title: 'House Robber II', topic: 'Dynamic Programming', tags: ['dynamic-programming'], difficulty: 'medium' },
  { title: 'Longest Increasing Subsequence', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'binary-search'], difficulty: 'medium' },
  { title: 'Coin Change', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'breadth-first-search'], difficulty: 'medium' },
  { title: 'Coin Change II', topic: 'Dynamic Programming', tags: ['dynamic-programming'], difficulty: 'medium' },
  { title: 'Unique Paths', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'math'], difficulty: 'medium' },
  { title: 'Unique Paths II', topic: 'Dynamic Programming', tags: ['dynamic-programming'], difficulty: 'medium' },
  { title: 'Longest Common Subsequence', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'string'], difficulty: 'medium' },
  { title: 'Minimum Path Sum', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'matrix'], difficulty: 'medium' },
  { title: 'Target Sum', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'backtracking'], difficulty: 'medium' },
  { title: 'Partition Equal Subset Sum', topic: 'Dynamic Programming', tags: ['dynamic-programming'], difficulty: 'medium' },
  { title: 'Triangle', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'matrix'], difficulty: 'medium' },
  { title: 'Interleaving String', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'string'], difficulty: 'medium' },
  { title: 'Decode Ways', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'string'], difficulty: 'medium' },
  { title: 'Best Time to Buy and Sell Stock Cooldown', topic: 'Dynamic Programming', tags: ['dynamic-programming'], difficulty: 'medium' },
  { title: 'Maximum Product Subarray', topic: 'Dynamic Programming', tags: ['dynamic-programming'], difficulty: 'medium' },
  { title: 'Edit Distance', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'string'], difficulty: 'hard' },
  { title: 'Best Time to Buy and Sell Stock IV', topic: 'Dynamic Programming', tags: ['dynamic-programming'], difficulty: 'hard' },
  { title: 'Burst Balloons', topic: 'Dynamic Programming', tags: ['dynamic-programming'], difficulty: 'hard' },
  { title: 'Regular Expression Matching', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'string'], difficulty: 'hard' },
  { title: 'Wildcard Matching', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'string'], difficulty: 'hard' },
  { title: 'Distinct Subsequences', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'string'], difficulty: 'hard' },
  { title: 'Scramble String', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'string'], difficulty: 'hard' },
  { title: 'Palindrome Partitioning II', topic: 'Dynamic Programming', tags: ['dynamic-programming', 'string'], difficulty: 'hard' },

  // Linked List (20 problems)
  { title: 'Merge Two Sorted Lists', topic: 'Linked List', tags: ['linked-list', 'recursion'], difficulty: 'easy' },
  { title: 'Linked List Cycle', topic: 'Linked List', tags: ['linked-list', 'two-pointer'], difficulty: 'easy' },
  { title: 'Reverse Linked List', topic: 'Linked List', tags: ['linked-list', 'recursion'], difficulty: 'easy' },
  { title: 'Remove Duplicates from Sorted List', topic: 'Linked List', tags: ['linked-list'], difficulty: 'easy' },
  { title: 'Palindrome Linked List', topic: 'Linked List', tags: ['linked-list', 'two-pointer'], difficulty: 'easy' },
  { title: 'Intersection of Two Linked Lists', topic: 'Linked List', tags: ['linked-list', 'two-pointer'], difficulty: 'easy' },
  { title: 'Remove Nth Node From End', topic: 'Linked List', tags: ['linked-list', 'two-pointer'], difficulty: 'medium' },
  { title: 'Swap Nodes in Pairs', topic: 'Linked List', tags: ['linked-list'], difficulty: 'medium' },
  { title: 'Rotate List', topic: 'Linked List', tags: ['linked-list', 'two-pointer'], difficulty: 'medium' },
  { title: 'Reorder List', topic: 'Linked List', tags: ['linked-list', 'two-pointer'], difficulty: 'medium' },
  { title: 'Copy List with Random Pointer', topic: 'Linked List', tags: ['linked-list', 'hash-table'], difficulty: 'medium' },
  { title: 'Add Two Numbers', topic: 'Linked List', tags: ['linked-list', 'math'], difficulty: 'medium' },
  { title: 'Add Two Numbers II', topic: 'Linked List', tags: ['linked-list', 'stack'], difficulty: 'medium' },
  { title: 'Reverse Linked List II', topic: 'Linked List', tags: ['linked-list'], difficulty: 'medium' },
  { title: 'Remove Duplicates from Sorted List II', topic: 'Linked List', tags: ['linked-list'], difficulty: 'medium' },
  { title: 'Sort List', topic: 'Linked List', tags: ['linked-list', 'sorting', 'merge-sort'], difficulty: 'medium' },
  { title: 'Merge k Sorted Lists', topic: 'Linked List', tags: ['linked-list', 'heap', 'divide-and-conquer'], difficulty: 'hard' },
  { title: 'LRU Cache', topic: 'Linked List', tags: ['hash-table', 'linked-list', 'design'], difficulty: 'medium' },
  { title: 'LFU Cache', topic: 'Linked List', tags: ['hash-table', 'linked-list', 'design'], difficulty: 'hard' },
  { title: 'Design Twitter', topic: 'Linked List', tags: ['hash-table', 'linked-list', 'design'], difficulty: 'medium' },

  // Stack (15 problems)
  { title: 'Min Stack', topic: 'Stack', tags: ['stack', 'design'], difficulty: 'medium' },
  { title: 'Valid Parenthesis String', topic: 'Stack', tags: ['string', 'stack', 'greedy'], difficulty: 'medium' },
  { title: 'Simplify Path', topic: 'Stack', tags: ['string', 'stack'], difficulty: 'medium' },
  { title: 'Evaluate Reverse Polish Notation', topic: 'Stack', tags: ['array', 'stack'], difficulty: 'medium' },
  { title: 'Daily Temperatures', topic: 'Stack', tags: ['array', 'stack'], difficulty: 'medium' },
  { title: 'Next Greater Element I', topic: 'Stack', tags: ['array', 'stack', 'hash-table'], difficulty: 'easy' },
  { title: 'Next Greater Element II', topic: 'Stack', tags: ['array', 'stack'], difficulty: 'medium' },
  { title: 'Basic Calculator', topic: 'Stack', tags: ['string', 'stack', 'math'], difficulty: 'hard' },
  { title: 'Basic Calculator II', topic: 'Stack', tags: ['string', 'stack'], difficulty: 'medium' },
  { title: 'Basic Calculator III', topic: 'Stack', tags: ['string', 'stack'], difficulty: 'hard' },
  { title: 'Largest Rectangle in Histogram', topic: 'Stack', tags: ['array', 'stack'], difficulty: 'hard' },
  { title: 'Maximal Rectangle', topic: 'Stack', tags: ['array', 'stack', 'matrix'], difficulty: 'hard' },
  { title: 'Trapping Rain Water', topic: 'Stack', tags: ['array', 'stack', 'two-pointer'], difficulty: 'hard' },
  { title: 'Remove All Adjacent Duplicates', topic: 'Stack', tags: ['string', 'stack'], difficulty: 'easy' },
  { title: 'Online Stock Span', topic: 'Stack', tags: ['array', 'stack'], difficulty: 'medium' },

  // Tree (25 problems)
  { title: 'Binary Tree Inorder Traversal', topic: 'Tree', tags: ['tree', 'binary-tree', 'recursion'], difficulty: 'easy' },
  { title: 'Binary Tree Preorder Traversal', topic: 'Tree', tags: ['tree', 'binary-tree', 'recursion'], difficulty: 'easy' },
  { title: 'Binary Tree Postorder Traversal', topic: 'Tree', tags: ['tree', 'binary-tree', 'recursion'], difficulty: 'easy' },
  { title: 'Maximum Depth of Binary Tree', topic: 'Tree', tags: ['tree', 'binary-tree', 'recursion'], difficulty: 'easy' },
  { title: 'Minimum Depth of Binary Tree', topic: 'Tree', tags: ['tree', 'binary-tree', 'breadth-first-search'], difficulty: 'easy' },
  { title: 'Symmetric Tree', topic: 'Tree', tags: ['tree', 'binary-tree', 'recursion'], difficulty: 'easy' },
  { title: 'Same Tree', topic: 'Tree', tags: ['tree', 'binary-tree', 'recursion'], difficulty: 'easy' },
  { title: 'Balanced Binary Tree', topic: 'Tree', tags: ['tree', 'binary-tree', 'recursion'], difficulty: 'easy' },
  { title: 'Path Sum', topic: 'Tree', tags: ['tree', 'binary-tree', 'recursion'], difficulty: 'easy' },
  { title: 'Convert Sorted Array to BST', topic: 'Tree', tags: ['tree', 'binary-search-tree', 'recursion'], difficulty: 'easy' },
  { title: 'Diameter of Binary Tree', topic: 'Tree', tags: ['tree', 'binary-tree', 'recursion'], difficulty: 'easy' },
  { title: 'Binary Tree Level Order Traversal', topic: 'Tree', tags: ['tree', 'binary-tree', 'breadth-first-search'], difficulty: 'medium' },
  { title: 'Binary Tree Zigzag Level Order', topic: 'Tree', tags: ['tree', 'breadth-first-search'], difficulty: 'medium' },
  { title: 'Path Sum II', topic: 'Tree', tags: ['tree', 'binary-tree', 'backtracking'], difficulty: 'medium' },
  { title: 'Path Sum III', topic: 'Tree', tags: ['tree', 'binary-tree', 'recursion'], difficulty: 'medium' },
  { title: 'Validate Binary Search Tree', topic: 'Tree', tags: ['tree', 'binary-search-tree', 'recursion'], difficulty: 'medium' },
  { title: 'Convert Sorted List to BST', topic: 'Tree', tags: ['tree', 'linked-list', 'recursion'], difficulty: 'medium' },
  { title: 'Flatten Binary Tree to Linked List', topic: 'Tree', tags: ['tree', 'linked-list', 'recursion'], difficulty: 'medium' },
  { title: 'Construct Binary Tree Preorder Inorder', topic: 'Tree', tags: ['tree', 'recursion', 'hash-table'], difficulty: 'medium' },
  { title: 'Binary Tree Right Side View', topic: 'Tree', tags: ['tree', 'breadth-first-search'], difficulty: 'medium' },
  { title: 'Kth Smallest Element in BST', topic: 'Tree', tags: ['tree', 'binary-search-tree', 'recursion'], difficulty: 'medium' },
  { title: 'Count Complete Tree Nodes', topic: 'Tree', tags: ['tree', 'binary-search'], difficulty: 'medium' },
  { title: 'Binary Tree Level Order II', topic: 'Tree', tags: ['tree', 'breadth-first-search'], difficulty: 'medium' },
  { title: 'Sum Root to Leaf Numbers', topic: 'Tree', tags: ['tree', 'binary-tree', 'recursion'], difficulty: 'medium' },
  { title: 'Binary Tree Maximum Path Sum', topic: 'Tree', tags: ['tree', 'binary-tree', 'dynamic-programming'], difficulty: 'hard' },

  // Graph (20 problems)
  { title: 'Number of Islands', topic: 'Graph', tags: ['graph', 'depth-first-search', 'breadth-first-search'], difficulty: 'medium' },
  { title: 'Clone Graph', topic: 'Graph', tags: ['graph', 'depth-first-search', 'breadth-first-search'], difficulty: 'medium' },
  { title: 'Max Area of Island', topic: 'Graph', tags: ['graph', 'depth-first-search'], difficulty: 'medium' },
  { title: 'Pacific Atlantic Water Flow', topic: 'Graph', tags: ['graph', 'depth-first-search', 'breadth-first-search'], difficulty: 'medium' },
  { title: 'Surrounded Regions', topic: 'Graph', tags: ['graph', 'depth-first-search', 'breadth-first-search'], difficulty: 'medium' },
  { title: 'Course Schedule', topic: 'Graph', tags: ['graph', 'topological-sort', 'depth-first-search'], difficulty: 'medium' },
  { title: 'Course Schedule II', topic: 'Graph', tags: ['graph', 'topological-sort', 'depth-first-search'], difficulty: 'medium' },
  { title: 'Number of Connected Components', topic: 'Graph', tags: ['graph', 'union-find', 'depth-first-search'], difficulty: 'medium' },
  { title: 'Graph Valid Tree', topic: 'Graph', tags: ['graph', 'union-find', 'breadth-first-search'], difficulty: 'medium' },
  { title: 'Redundant Connection', topic: 'Graph', tags: ['graph', 'union-find'], difficulty: 'medium' },
  { title: 'Accounts Merge', topic: 'Graph', tags: ['graph', 'union-find', 'depth-first-search'], difficulty: 'medium' },
  { title: 'Network Delay Time', topic: 'Graph', tags: ['graph', 'depth-first-search', 'breadth-first-search'], difficulty: 'medium' },
  { title: 'Evaluate Division', topic: 'Graph', tags: ['graph', 'depth-first-search', 'breadth-first-search'], difficulty: 'medium' },
  { title: 'Cheapest Flights Within K Stops', topic: 'Graph', tags: ['graph', 'dynamic-programming', 'depth-first-search'], difficulty: 'medium' },
  { title: 'Minimum Height Trees', topic: 'Graph', tags: ['graph', 'breadth-first-search'], difficulty: 'medium' },
  { title: 'Friend Circles', topic: 'Graph', tags: ['graph', 'union-find', 'depth-first-search'], difficulty: 'medium' },
  { title: 'Keys and Rooms', topic: 'Graph', tags: ['graph', 'depth-first-search', 'breadth-first-search'], difficulty: 'medium' },
  { title: 'Is Graph Bipartite', topic: 'Graph', tags: ['graph', 'breadth-first-search', 'depth-first-search'], difficulty: 'medium' },
  { title: 'Find Eventual Safe States', topic: 'Graph', tags: ['graph', 'depth-first-search'], difficulty: 'medium' },
  { title: 'Possible Bipartition', topic: 'Graph', tags: ['graph', 'union-find'], difficulty: 'medium' },

  // Binary Search (15 problems)
  { title: 'Binary Search', topic: 'Binary Search', tags: ['array', 'binary-search'], difficulty: 'easy' },
  { title: 'Search Insert Position', topic: 'Binary Search', tags: ['array', 'binary-search'], difficulty: 'easy' },
  { title: 'Sqrt(x)', topic: 'Binary Search', tags: ['binary-search', 'math'], difficulty: 'easy' },
  { title: 'Valid Perfect Square', topic: 'Binary Search', tags: ['binary-search', 'math'], difficulty: 'easy' },
  { title: 'Find Smallest Letter Greater Than Target', topic: 'Binary Search', tags: ['array', 'binary-search'], difficulty: 'easy' },
  { title: 'Missing Number', topic: 'Binary Search', tags: ['array', 'binary-search'], difficulty: 'easy' },
  { title: 'Search a 2D Matrix', topic: 'Binary Search', tags: ['array', 'binary-search', 'matrix'], difficulty: 'medium' },
  { title: 'Search in Rotated Sorted Array', topic: 'Binary Search', tags: ['array', 'binary-search'], difficulty: 'medium' },
  { title: 'Search in Rotated Sorted Array II', topic: 'Binary Search', tags: ['array', 'binary-search'], difficulty: 'medium' },
  { title: 'Find First and Last Position', topic: 'Binary Search', tags: ['array', 'binary-search'], difficulty: 'medium' },
  { title: 'Find Minimum in Rotated Sorted Array', topic: 'Binary Search', tags: ['array', 'binary-search'], difficulty: 'medium' },
  { title: 'Find Peak Element', topic: 'Binary Search', tags: ['array', 'binary-search'], difficulty: 'medium' },
  { title: 'Search a 2D Matrix II', topic: 'Binary Search', tags: ['array', 'binary-search', 'matrix'], difficulty: 'medium' },
  { title: 'Koko Eating Bananas', topic: 'Binary Search', tags: ['binary-search', 'array'], difficulty: 'medium' },
  { title: 'Median of Two Sorted Arrays', topic: 'Binary Search', tags: ['array', 'binary-search'], difficulty: 'hard' },

  // Heap (15 problems)
  { title: 'Kth Largest Element in Array', topic: 'Heap', tags: ['array', 'heap'], difficulty: 'medium' },
  { title: 'Kth Largest Element in Stream', topic: 'Heap', tags: ['heap', 'design'], difficulty: 'easy' },
  { title: 'Top K Frequent Elements', topic: 'Heap', tags: ['array', 'hash-table', 'heap'], difficulty: 'medium' },
  { title: 'Top K Frequent Words', topic: 'Heap', tags: ['trie', 'hash-table', 'heap'], difficulty: 'medium' },
  { title: 'K Closest Points to Origin', topic: 'Heap', tags: ['array', 'heap', 'divide-and-conquer'], difficulty: 'medium' },
  { title: 'Find K Pairs with Smallest Sums', topic: 'Heap', tags: ['heap'], difficulty: 'medium' },
  { title: 'Task Scheduler', topic: 'Heap', tags: ['array', 'hash-table', 'heap'], difficulty: 'medium' },
  { title: 'Rearrange String k Distance Apart', topic: 'Heap', tags: ['hash-table', 'heap'], difficulty: 'hard' },
  { title: 'Smallest Range From Lists', topic: 'Heap', tags: ['heap', 'greedy'], difficulty: 'hard' },
  { title: 'IPO', topic: 'Heap', tags: ['heap', 'greedy'], difficulty: 'hard' },
  { title: 'Find K-th Smallest Pair Distance', topic: 'Heap', tags: ['array', 'binary-search', 'heap'], difficulty: 'hard' },
  { title: 'Maximum Frequency Stack', topic: 'Heap', tags: ['hash-table', 'stack', 'design'], difficulty: 'hard' },
  { title: 'Trapping Rain Water II', topic: 'Heap', tags: ['array', 'heap'], difficulty: 'hard' },
  { title: 'K Items with Maximum Sum', topic: 'Heap', tags: ['array', 'heap'], difficulty: 'easy' },
  { title: 'Find the Most Competitive Subsequence', topic: 'Heap', tags: ['array', 'stack'], difficulty: 'medium' },

  // Hash Table (15 problems)
  { title: 'Two Sum Hash', topic: 'Hash Table', tags: ['array', 'hash-table'], difficulty: 'easy' },
  { title: 'Contains Duplicate', topic: 'Hash Table', tags: ['array', 'hash-table'], difficulty: 'easy' },
  { title: 'Contains Duplicate II', topic: 'Hash Table', tags: ['array', 'hash-table'], difficulty: 'easy' },
  { title: 'Design HashSet', topic: 'Hash Table', tags: ['hash-table', 'design'], difficulty: 'easy' },
  { title: 'Design HashMap', topic: 'Hash Table', tags: ['hash-table', 'design'], difficulty: 'easy' },
  { title: 'Logger Rate Limiter', topic: 'Hash Table', tags: ['hash-table', 'design'], difficulty: 'easy' },
  { title: 'Longest Palindrome', topic: 'Hash Table', tags: ['string', 'hash-table'], difficulty: 'easy' },
  { title: 'Word Pattern', topic: 'Hash Table', tags: ['string', 'hash-table'], difficulty: 'easy' },
  { title: 'Isomorphic Strings', topic: 'Hash Table', tags: ['string', 'hash-table'], difficulty: 'easy' },
  { title: 'Happy Number', topic: 'Hash Table', tags: ['hash-table', 'math'], difficulty: 'easy' },
  { title: 'Minimum Index Sum of Two Lists', topic: 'Hash Table', tags: ['hash-table', 'string'], difficulty: 'easy' },
  { title: 'Find Duplicate Subtrees', topic: 'Hash Table', tags: ['tree', 'hash-table'], difficulty: 'medium' },
  { title: 'Encode and Decode TinyURL', topic: 'Hash Table', tags: ['hash-table', 'design'], difficulty: 'medium' },
  { title: 'Longest Consecutive Sequence', topic: 'Hash Table', tags: ['array', 'hash-table'], difficulty: 'medium' },
  { title: 'Word Break', topic: 'Hash Table', tags: ['string', 'hash-table', 'dynamic-programming'], difficulty: 'medium' },

  // Sorting (15 problems)
  { title: 'Bubble Sort', topic: 'Sorting', tags: ['array', 'sorting'], difficulty: 'easy' },
  { title: 'Insertion Sort', topic: 'Sorting', tags: ['array', 'sorting'], difficulty: 'easy' },
  { title: 'Selection Sort', topic: 'Sorting', tags: ['array', 'sorting'], difficulty: 'easy' },
  { title: 'Merge Sort', topic: 'Sorting', tags: ['array', 'sorting', 'divide-and-conquer'], difficulty: 'medium' },
  { title: 'Quick Sort', topic: 'Sorting', tags: ['array', 'sorting', 'divide-and-conquer'], difficulty: 'medium' },
  { title: 'Sort Colors', topic: 'Sorting', tags: ['array', 'sorting', 'two-pointer'], difficulty: 'medium' },
  { title: 'Largest Number', topic: 'Sorting', tags: ['array', 'sorting', 'string'], difficulty: 'medium' },
  { title: 'Relative Sort Array', topic: 'Sorting', tags: ['array', 'sorting'], difficulty: 'easy' },
  { title: 'Kth Largest Element in Array', topic: 'Sorting', tags: ['array', 'sorting'], difficulty: 'medium' },
  { title: 'Meeting Rooms', topic: 'Sorting', tags: ['array', 'sorting'], difficulty: 'easy' },
  { title: 'Meeting Rooms II', topic: 'Sorting', tags: ['array', 'sorting', 'heap'], difficulty: 'medium' },
  { title: 'Insert Interval', topic: 'Sorting', tags: ['array', 'sorting'], difficulty: 'medium' },
  { title: 'Non-overlapping Intervals', topic: 'Sorting', tags: ['array', 'sorting', 'greedy'], difficulty: 'medium' },
  { title: 'Wiggle Sort II', topic: 'Sorting', tags: ['array', 'sorting'], difficulty: 'medium' },
  { title: 'Queue Reconstruction by Height', topic: 'Sorting', tags: ['array', 'sorting'], difficulty: 'medium' },

  // Backtracking (20 problems)
  { title: 'Subsets', topic: 'Backtracking', tags: ['array', 'backtracking'], difficulty: 'medium' },
  { title: 'Subsets II', topic: 'Backtracking', tags: ['array', 'backtracking'], difficulty: 'medium' },
  { title: 'Permutations', topic: 'Backtracking', tags: ['array', 'backtracking'], difficulty: 'medium' },
  { title: 'Permutations II', topic: 'Backtracking', tags: ['array', 'backtracking'], difficulty: 'medium' },
  { title: 'Combinations', topic: 'Backtracking', tags: ['array', 'backtracking'], difficulty: 'medium' },
  { title: 'Combination Sum', topic: 'Backtracking', tags: ['array', 'backtracking'], difficulty: 'medium' },
  { title: 'Combination Sum II', topic: 'Backtracking', tags: ['array', 'backtracking'], difficulty: 'medium' },
  { title: 'Combination Sum III', topic: 'Backtracking', tags: ['backtracking'], difficulty: 'medium' },
  { title: 'Generate Parentheses', topic: 'Backtracking', tags: ['string', 'backtracking'], difficulty: 'medium' },
  { title: 'Letter Combinations', topic: 'Backtracking', tags: ['string', 'backtracking'], difficulty: 'medium' },
  { title: 'N-Queens', topic: 'Backtracking', tags: ['backtracking'], difficulty: 'hard' },
  { title: 'N-Queens II', topic: 'Backtracking', tags: ['backtracking'], difficulty: 'hard' },
  { title: 'Sudoku Solver', topic: 'Backtracking', tags: ['array', 'backtracking'], difficulty: 'hard' },
  { title: 'Combination Sum IV', topic: 'Backtracking', tags: ['array', 'backtracking', 'dynamic-programming'], difficulty: 'medium' },
  { title: 'Palindrome Partitioning', topic: 'Backtracking', tags: ['string', 'backtracking', 'dynamic-programming'], difficulty: 'medium' },
  { title: 'Word Search', topic: 'Backtracking', tags: ['array', 'backtracking'], difficulty: 'medium' },
  { title: 'Word Search II', topic: 'Backtracking', tags: ['array', 'backtracking', 'trie'], difficulty: 'hard' },
  { title: 'Remove Invalid Parentheses', topic: 'Backtracking', tags: ['string', 'backtracking', 'breadth-first-search'], difficulty: 'hard' },
  { title: 'Beautiful Arrangement', topic: 'Backtracking', tags: ['backtracking'], difficulty: 'medium' },
  { title: 'Letter Case Permutation', topic: 'Backtracking', tags: ['string', 'backtracking'], difficulty: 'easy' },

  // Greedy (15 problems)
  { title: 'Jump Game Greedy', topic: 'Greedy', tags: ['array', 'greedy'], difficulty: 'medium' },
  { title: 'Jump Game II Greedy', topic: 'Greedy', tags: ['array', 'greedy', 'dynamic-programming'], difficulty: 'medium' },
  { title: 'Gas Station Greedy', topic: 'Greedy', tags: ['array', 'greedy'], difficulty: 'medium' },
  { title: 'Candy Greedy', topic: 'Greedy', tags: ['array', 'greedy'], difficulty: 'hard' },
  { title: 'Partition Labels Greedy', topic: 'Greedy', tags: ['string', 'hash-table', 'greedy'], difficulty: 'medium' },
  { title: 'Best Time to Buy Sell Stock II', topic: 'Greedy', tags: ['array', 'greedy'], difficulty: 'medium' },
  { title: 'Largest Number Greedy', topic: 'Greedy', tags: ['string', 'sorting'], difficulty: 'medium' },
  { title: 'Task Scheduler Greedy', topic: 'Greedy', tags: ['array', 'hash-table'], difficulty: 'medium' },
  { title: 'IPO Greedy', topic: 'Greedy', tags: ['heap', 'greedy'], difficulty: 'hard' },
  { title: 'Construct K Palindrome Strings', topic: 'Greedy', tags: ['string', 'greedy'], difficulty: 'medium' },
  { title: 'Maximum Length of Pair Chain', topic: 'Greedy', tags: ['array', 'dynamic-programming', 'greedy'], difficulty: 'medium' },
  { title: 'Employee Free Time', topic: 'Greedy', tags: ['array', 'heap', 'greedy'], difficulty: 'hard' },
  { title: 'Maximum Number of Events', topic: 'Greedy', tags: ['array', 'greedy'], difficulty: 'medium' },
  { title: 'Create Maximum Number', topic: 'Greedy', tags: ['array', 'stack', 'greedy'], difficulty: 'hard' },
  { title: 'Maximum Subarray Sum Divisible by K', topic: 'Greedy', tags: ['array', 'prefix-sum', 'hash-table'], difficulty: 'medium' },

  // Math (20 problems)
  { title: 'Count Primes', topic: 'Math', tags: ['math', 'hash-table'], difficulty: 'easy' },
  { title: 'Fizz Buzz', topic: 'Math', tags: ['math'], difficulty: 'easy' },
  { title: 'Power of Two', topic: 'Math', tags: ['math', 'bit-manipulation'], difficulty: 'easy' },
  { title: 'Power of Three', topic: 'Math', tags: ['math'], difficulty: 'easy' },
  { title: 'Power of Four', topic: 'Math', tags: ['math', 'bit-manipulation'], difficulty: 'easy' },
  { title: 'Add Digits', topic: 'Math', tags: ['math'], difficulty: 'easy' },
  { title: 'Ugly Number', topic: 'Math', tags: ['math'], difficulty: 'easy' },
  { title: 'Perfect Number', topic: 'Math', tags: ['math'], difficulty: 'easy' },
  { title: 'Excel Column Title', topic: 'Math', tags: ['math', 'string'], difficulty: 'easy' },
  { title: 'Excel Column Number', topic: 'Math', tags: ['math', 'string'], difficulty: 'easy' },
  { title: 'Factorial Trailing Zeroes', topic: 'Math', tags: ['math'], difficulty: 'easy' },
  { title: 'Palindrome Number', topic: 'Math', tags: ['math'], difficulty: 'easy' },
  { title: 'Reverse Integer', topic: 'Math', tags: ['math'], difficulty: 'medium' },
  { title: 'Divide Two Integers', topic: 'Math', tags: ['math', 'bit-manipulation'], difficulty: 'medium' },
  { title: 'Roman to Integer Math', topic: 'Math', tags: ['string', 'hash-table'], difficulty: 'easy' },
  { title: 'Integer to Roman Math', topic: 'Math', tags: ['string', 'hash-table'], difficulty: 'medium' },
  { title: 'Super Pow', topic: 'Math', tags: ['math'], difficulty: 'medium' },
  { title: 'Nth Digit', topic: 'Math', tags: ['math', 'binary-search'], difficulty: 'medium' },
  { title: 'Ugly Number II', topic: 'Math', tags: ['math', 'dynamic-programming'], difficulty: 'medium' },
  { title: 'Pow(x,n)', topic: 'Math', tags: ['math', 'recursion'], difficulty: 'medium' },
];

const COMPANY_TAG_MAP = {
  Google: { dsa: ['arrays','strings','dynamic-programming','graph','tree','binary-search','heap','trie'], difficulty: ['medium','hard'] },
  Amazon: { dsa: ['arrays','strings','linked-list','tree','graph','dynamic-programming','stack','queue'], difficulty: ['medium','hard'] },
  Microsoft: { dsa: ['arrays','strings','linked-list','tree','dynamic-programming','backtracking'], difficulty: ['medium','hard'] },
  Meta: { dsa: ['arrays','strings','graph','tree','binary-search','dynamic-programming'], difficulty: ['medium','hard'] },
  TCS: { dsa: ['arrays','strings','linked-list','stack','queue','tree'], difficulty: ['easy','medium'] },
  Infosys: { dsa: ['arrays','strings','sorting','searching','linked-list'], difficulty: ['easy','medium'] },
  Wipro: { dsa: ['arrays','strings','basic-algorithms','sorting'], difficulty: ['easy','medium'] },
  Cognizant: { dsa: ['arrays','strings','linked-list','tree-basics','stack'], difficulty: ['easy','medium'] },
  HCL: { dsa: ['arrays','strings','sorting','basic-ds'], difficulty: ['easy','medium'] },
  'Tech Mahindra': { dsa: ['arrays','strings','linked-list','stack','queue'], difficulty: ['easy','medium'] },
  Zensar: { dsa: ['arrays','strings','basic-algorithms','sorting','searching'], difficulty: ['easy','medium'] },
  Accenture: { dsa: ['arrays','strings','linked-list','tree','dynamic-programming'], difficulty: ['easy','medium'] },
  Capgemini: { dsa: ['arrays','strings','stack','queue','basic-ds'], difficulty: ['easy','medium'] },
  Deloitte: { dsa: ['arrays','strings','linked-list','tree','dynamic-programming'], difficulty: ['medium','hard'] },
  IBM: { dsa: ['arrays','strings','graph','tree','dynamic-programming'], difficulty: ['medium','hard'] },
  Oracle: { dsa: ['arrays','strings','linked-list','tree','dynamic-programming'], difficulty: ['medium','hard'] },
  SAP: { dsa: ['arrays','strings','tree','graph','dynamic-programming'], difficulty: ['medium','hard'] },
  EY: { dsa: ['arrays','strings','linked-list','stack','queue','tree-basics'], difficulty: ['easy','medium'] },
};

function getCompaniesForProblem(topic, tags, difficulty) {
  const t = (topic || '').toLowerCase();
  const tagsLower = (tags || []).map(x => x.toLowerCase());
  const matches = [];
  for (const [company, patterns] of Object.entries(COMPANY_TAG_MAP)) {
    let score = 0;
    if (patterns.dsa.some(pt => t.includes(pt))) score += 2;
    score += tagsLower.filter(tag => patterns.dsa.some(pt => tag.includes(pt))).length;
    if (patterns.difficulty.includes(difficulty)) score += 1;
    if (score >= 2) matches.push(company);
  }
  return matches;
}

const seedCodingProblems = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent');
    await CodingProblem.deleteMany({});
    
    const now = new Date();
    const problems = codingProblems.map((p, idx) => {
      const slug = `${p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${idx}`;
      const companies = getCompaniesForProblem(p.topic, p.tags, p.difficulty);
      return {
        title: p.title,
        slug,
        description: `Solve the ${p.title} problem.`,
        difficulty: p.difficulty,
        topic: p.topic,
        tags: p.tags,
        companies,
        constraints: ['1 <= input.length <= 1000', 'All inputs are valid'],
        examples: [{ input: 'Example input', output: 'Expected output', explanation: 'Explanation here' }],
        visibleTestCases: [
          { input: 'test-input-0', expectedOutput: 'expected-0' },
          { input: 'test-input-1', expectedOutput: 'expected-1' },
          { input: 'test-input-2', expectedOutput: 'expected-2' },
        ],
        hiddenTestCases: Array.from({ length: 10 }, (_, i) => ({
          input: `hidden-input-${i}`,
          expectedOutput: `hidden-expected-${i}`,
        })),
        starterCode: {
          javascript: 'function solve(input) {\n  // Your code here\n  return null;\n}',
          python: 'def solve(input):\n    # Your code here\n    return None',
          java: 'class Solution {\n    public static Object solve(String input) {\n        return null;\n    }\n}',
          cpp: 'int solve(string input) {\n    return 0;\n}',
        },
        functionSignature: {
          javascript: { name: 'solve', params: [{ name: 'input', type: 'string' }], returnType: 'string' },
          python: { name: 'solve', params: [{ name: 'input', type: 'string' }], returnType: 'string' },
          java: { name: 'solve', params: [{ name: 'input', type: 'String' }], returnType: 'String' },
          cpp: { name: 'solve', params: [{ name: 'input', type: 'string' }], returnType: 'string' },
        },
        timeLimitMs: p.difficulty === 'hard' ? 3000 : p.difficulty === 'medium' ? 2000 : 1500,
        memoryLimitKb: 256,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
    });

    const seenTitles = new Map();
    const duplicates = [];
    problems.forEach(p => {
      if (seenTitles.has(p.title)) {
        duplicates.push({ title: p.title, topic: p.topic, originalTopic: seenTitles.get(p.title) });
      } else {
        seenTitles.set(p.title, p.topic);
      }
    });

    if (duplicates.length > 0) {
      console.log(`[PRE-FLIGHT] Found ${duplicates.length} duplicate title(s):`);
      duplicates.forEach(d => console.log(`  - "${d.title}" in "${d.topic}" (original: ${d.originalTopic})`));
      const deduped = problems.filter((p, idx, arr) => arr.findIndex(q => q.title === p.title) === idx);
      const removed = problems.length - deduped.length;
      console.log(`[PRE-FLIGHT] Removed ${removed} duplicate(s), proceeding with ${deduped.length} unique problems.`);
      await CodingProblem.insertMany(deduped, { ordered: false });
      console.log(`Seeded ${deduped.length} coding problems.`);
      process.exit(0);
      return;
    }

    await CodingProblem.insertMany(problems, { ordered: false });
    console.log(`Seeded ${problems.length} coding problems.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    if (error.writeErrors) {
      error.writeErrors.forEach(w => console.error(`  Failed doc ${w.err.index}:`, w.err.message));
    }
    process.exit(1);
  }
};

seedCodingProblems();