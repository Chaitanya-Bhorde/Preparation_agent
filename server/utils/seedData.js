const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Problem = require('../models/Problem');
const connectDB = require('../config/db');
const problems = [
  {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    difficulty: 'easy',
    tags: ['arrays', 'hash-map'],
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    ],
    testCases: [
      { input: '2\n2 7 11 15\n9', expectedOutput: '0 1', isSample: true },
      { input: '2\n3 2 4\n6', expectedOutput: '1 2', isSample: true },
      { input: '2\n3 3\n6', expectedOutput: '0 1' },
    ],
    solution: 'function twoSum(nums, target) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (map.has(complement)) return [map.get(complement), i]; map.set(nums[i], i); } }',
  },
  {
    title: 'Reverse a String',
    description: 'Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.',
    difficulty: 'easy',
    tags: ['strings', 'two-pointers'],
    constraints: '1 <= s.length <= 10^5\ns[i] is a printable ascii character.',
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' },
    ],
    testCases: [
      { input: 'hello', expectedOutput: 'olleh', isSample: true },
      { input: 'Hannah', expectedOutput: 'hannaH' },
      { input: 'a', expectedOutput: 'a' },
    ],
  },
  {
    title: 'Palindrome Check',
    description: 'Given a string s, return true if it is a palindrome, or false otherwise.\n\nA phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
    difficulty: 'easy',
    tags: ['strings', 'two-pointers'],
    constraints: '1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.',
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 's = "race a car"', output: 'false' },
    ],
    testCases: [
      { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isSample: true },
      { input: 'race a car', expectedOutput: 'false', isSample: true },
      { input: ' ', expectedOutput: 'true' },
    ],
  },
  {
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    difficulty: 'easy',
    tags: ['strings', 'stack'],
    constraints: '1 <= s.length <= 10^4\ns consists of parentheses only \'()[]{}\'.',
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    testCases: [
      { input: '()', expectedOutput: 'true', isSample: true },
      { input: '()[]{}', expectedOutput: 'true', isSample: true },
      { input: '(]', expectedOutput: 'false', isSample: true },
      { input: '([)]', expectedOutput: 'false' },
    ],
  },
  {
    title: 'Maximum Subarray',
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    difficulty: 'medium',
    tags: ['arrays', 'dynamic-programming'],
    constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]', output: '1' },
    ],
    testCases: [
      { input: '-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isSample: true },
      { input: '1', expectedOutput: '1', isSample: true },
      { input: '5 4 -1 7 8', expectedOutput: '23' },
    ],
  },
  {
    title: 'Product of Array Except Self',
    description: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].\n\nThe product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.\n\nYou must write an algorithm that runs in O(n) time and without using the division operation.',
    difficulty: 'medium',
    tags: ['arrays', 'prefix-sum'],
    constraints: '2 <= nums.length <= 10^5\n-30 <= nums[i] <= 30\nThe product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.',
    examples: [
      { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' },
      { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]' },
    ],
    testCases: [
      { input: '1 2 3 4', expectedOutput: '24 12 8 6', isSample: true },
      { input: '-1 1 0 -3 3', expectedOutput: '0 0 9 0 0', isSample: true },
    ],
  },
  {
    title: 'LRU Cache',
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.\n- int get(int key) Return the value of the key if the key exists, otherwise return -1.\n- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.\n\nThe functions get and put must each run in O(1) average time complexity.',
    difficulty: 'medium',
    tags: ['hash-map', 'linked-list', 'design'],
    constraints: '1 <= capacity <= 3000\n0 <= key <= 10^4\n0 <= value <= 10^5\nAt most 2 * 10^5 calls will be made to get and put.',
    examples: [
      { input: 'LRUCache lru = new LRUCache(2);\nlru.put(1, 1);\nlru.put(2, 2);\nlru.get(1);\nlru.put(3, 3);\nlru.get(2);', output: '1\n-1' },
    ],
    testCases: [
      { input: '2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2', expectedOutput: '1 -1', isSample: true },
    ],
  },
  {
    title: 'Merge K Sorted Lists',
    description: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.',
    difficulty: 'hard',
    tags: ['linked-list', 'divide-and-conquer', 'heap'],
    constraints: 'k == lists.length\n0 <= k <= 10^4\n0 <= lists[i].length <= 500\n-10^4 <= lists[i][j] <= 10^4',
    examples: [
      { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' },
      { input: 'lists = []', output: '[]' },
    ],
    testCases: [
      { input: '1 4 5 1 3 4 2 6', expectedOutput: '1 1 2 3 4 4 5 6', isSample: true },
    ],
  },
  {
    title: 'Trapping Rain Water',
    description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    difficulty: 'hard',
    tags: ['arrays', 'two-pointers', 'stack'],
    constraints: 'n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5',
    examples: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: 'The above elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.' },
      { input: 'height = [4,2,0,3,2,5]', output: '9' },
    ],
    testCases: [
      { input: '0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6', isSample: true },
      { input: '4 2 0 3 2 5', expectedOutput: '9', isSample: true },
    ],
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    difficulty: 'medium',
    tags: ['strings', 'sliding-window', 'hash-map'],
    constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1' },
    ],
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3', isSample: true },
      { input: 'bbbbb', expectedOutput: '1', isSample: true },
      { input: 'pwwkew', expectedOutput: '3' },
    ],
  },
  {
    title: 'Binary Search',
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.',
    difficulty: 'easy',
    tags: ['arrays', 'binary-search'],
    constraints: '1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll the integers in nums are unique.\nnums is sorted in ascending order.',
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists in nums and its index is 4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 does not exist in nums so return -1' },
    ],
    testCases: [
      { input: '-1 0 3 5 9 12\n9', expectedOutput: '4', isSample: true },
      { input: '-1 0 3 5 9 12\n2', expectedOutput: '-1', isSample: true },
    ],
  },
  {
    title: 'Container With Most Water',
    description: 'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.',
    difficulty: 'medium',
    tags: ['arrays', 'two-pointers', 'greedy'],
    constraints: 'n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4',
    examples: [
      { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49' },
      { input: 'height = [1,1]', output: '1' },
    ],
    testCases: [
      { input: '1 8 6 2 5 4 8 3 7', expectedOutput: '49', isSample: true },
      { input: '1 1', expectedOutput: '1', isSample: true },
    ],
  },
  {
    title: 'Climbing Stairs',
    description: 'You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    difficulty: 'easy',
    tags: ['dynamic-programming', 'math'],
    constraints: '1 <= n <= 45',
    examples: [
      { input: 'n = 2', output: '2', explanation: 'There are two ways to climb to the top.\n1. 1 step + 1 step\n2. 2 steps' },
      { input: 'n = 3', output: '3', explanation: 'There are three ways:\n1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step' },
    ],
    testCases: [
      { input: '2', expectedOutput: '2', isSample: true },
      { input: '3', expectedOutput: '3', isSample: true },
      { input: '5', expectedOutput: '8' },
    ],
  },
  {
    title: 'Number of Islands',
    description: 'Given an m x n 2D binary grid grid which represents a map of \'1\'s (land) and \'0\'s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are surrounded by water.',
    difficulty: 'medium',
    tags: ['matrix', 'dfs', 'bfs'],
    constraints: 'm == grid.length\nn == grid[i].length\n1 <= m, n <= 300\ngrid[i][j] is \'0\' or \'1\'.',
    examples: [
      { input: 'grid = [\n  ["1","1","1","1","0"],\n  ["1","1","0","1","0"],\n  ["1","1","0","0","0"],\n  ["0","0","0","0","0"]\n]', output: '1' },
      { input: 'grid = [\n  ["1","1","0","0","0"],\n  ["1","1","0","0","0"],\n  ["0","0","1","0","0"],\n  ["0","0","0","1","1"]\n]', output: '3' },
    ],
    testCases: [
      { input: '11110\n11010\n11000\n00000', expectedOutput: '1', isSample: true },
      { input: '11000\n11000\n00100\n00011', expectedOutput: '3', isSample: true },
    ],
  },
  {
    title: 'Find Median from Data Stream',
    description: 'The median is the middle value in an ordered integer list. If the size of the list is even, there is no middle value, and the median is the mean of the two middle values.\n\nImplement the MedianFinder class:\n- MedianFinder() initializes the MedianFinder object.\n- void addNum(int num) adds the integer num from the data stream to the data structure.\n- double findMedian() returns the median of all elements so far.',
    difficulty: 'hard',
    tags: ['heap', 'design'],
    constraints: '-10^5 <= num <= 10^5\nAt most 5 * 10^4 calls will be made to addNum and findMedian.',
    examples: [
      { input: 'MedianFinder mf = new MedianFinder();\nmf.addNum(1);\nmf.addNum(2);\nmf.findMedian();\nmf.addNum(3);\nmf.findMedian();', output: '1.5\n2.0' },
    ],
    testCases: [
      { input: 'addNum 1\naddNum 2\nfindMedian\naddNum 3\nfindMedian', expectedOutput: '1.5 2.0', isSample: true },
    ],
  },
];
const seedData = async () => {
  try {
    await connectDB();
    await Problem.deleteMany({});
    for (const problemData of problems) {
      await Problem.create(problemData);
    }
    console.log(`Seeded ${problems.length} problems successfully!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};
seedData();