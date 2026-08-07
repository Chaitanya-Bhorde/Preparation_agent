// Curated, production-quality specs for priority DSA problems.
// Each entry fixes Bugs 1 & 2:
//   - Bug 1: accurate per-language typed functionSignature (no more solve(string)->string)
//   - Bug 2: specific problem description with a real Input/Output contract (no templated prose)
//
// Structure per entry:
//   desc, constraints, examples, sample (visible TC), hidden (hidden TC),
//   functionSignature.<js|py|java|cpp>

function lang(n, p, r) {
  return { name: n, params: p.map(([name, type]) => ({ name, type })), returnType: r };
}

const CURATED = {};

function add(title, spec) {
  CURATED[title] = {
    desc: spec.desc,
    constraints: spec.constraints || [],
    examples: spec.examples || [],
    sample: spec.sample,
    hidden: spec.hidden,
    functionSignature: {
      javascript: spec.sig.js,
      python: spec.sig.py,
      java: spec.sig.java,
      cpp: spec.sig.cpp,
    },
  };
}

// ---------------------------------------------------------------- Arrays
add('Two Sum', {
  desc: 'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`. You may assume each input has exactly one solution, and you may not use the same element twice. Return the two indices as an array [i, j].',
  constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Exactly one solution exists'],
  examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 9, return [0, 1].' }],
  sample: { input: '[2,7,11,15]\\n9', output: '[0,1]' },
  hidden: { input: '[3,2,4]\\n6', output: '[1,2]' },
  sig: {
    js: lang('twoSum', [['nums', 'number[]'], ['target', 'number']], 'number[]'),
    py: lang('two_sum', [['nums', 'List[int]'], ['target', 'int']], 'List[int]'),
    java: lang('twoSum', [['nums', 'int[]'], ['target', 'int']], 'int[]'),
    cpp: lang('twoSum', [['nums', 'vector<int>'], ['target', 'int']], 'vector<int>'),
  },
});

add('Valid Palindrome', {
  desc: 'Given a string `s`, return true if it is a palindrome, ignoring non-alphanumeric characters and case. A palindrome reads the same forward and backward.',
  constraints: ['1 <= s.length <= 2 * 10^5', 's consists of printable ASCII characters'],
  examples: [{ input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' }],
  sample: { input: 'A man, a plan, a canal: Panama', output: 'true' },
  hidden: { input: 'race a car', output: 'false' },
  sig: {
    js: lang('isPalindrome', [['s', 'string']], 'boolean'),
    py: lang('is_palindrome', [['s', 'str']], 'bool'),
    java: lang('isPalindrome', [['s', 'String']], 'boolean'),
    cpp: lang('isPalindrome', [['s', 'string']], 'bool'),
  },
});

add('Best Time to Buy and Sell Stock', {
  desc: 'Given an array `prices` where prices[i] is the price of a stock on day i, return the maximum profit you can achieve by buying on one day and selling on a later day. If no profit is possible, return 0.',
  constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
  examples: [{ input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (1) and sell on day 5 (6), profit = 5.' }],
  sample: { input: '[7,1,5,3,6,4]', output: '5' },
  hidden: { input: '[7,6,4,3,1]', output: '0' },
  sig: {
    js: lang('maxProfit', [['prices', 'number[]']], 'number'),
    py: lang('max_profit', [['prices', 'List[int]']], 'int'),
    java: lang('maxProfit', [['prices', 'int[]']], 'int'),
    cpp: lang('maxProfit', [['prices', 'vector<int>']], 'int'),
  },
});

add('Move Zeroes', {
  desc: 'Given an integer array `nums`, move all 0s to the end of the array while maintaining the relative order of the non-zero elements. Return the rearranged array.',
  constraints: ['1 <= nums.length <= 10^4', '-2^31 <= nums[i] <= 2^31 - 1'],
  examples: [{ input: 'nums = [0,1,0,3,12]', output: '[1,3,12,0,0]', explanation: 'Non-zeroes keep order and lead, zeroes trail.' }],
  sample: { input: '[0,1,0,3,12]', output: '[1,3,12,0,0]' },
  hidden: { input: '[0,0,1]', output: '[1,0,0]' },
  sig: {
    js: lang('moveZeroes', [['nums', 'number[]']], 'number[]'),
    py: lang('move_zeroes', [['nums', 'List[int]']], 'List[int]'),
    java: lang('moveZeroes', [['nums', 'int[]']], 'void'),
    cpp: lang('moveZeroes', [['nums', 'vector<int>']], 'void'),
  },
});

add('Contains Duplicate', {
  desc: 'Given an integer array `nums`, return true if any value appears at least twice in the array, and false if every element is distinct.',
  constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
  examples: [{ input: 'nums = [1,2,3,1]', output: 'true', explanation: 'The value 1 appears twice.' }],
  sample: { input: '[1,2,3,1]', output: 'true' },
  hidden: { input: '[1,2,3,4]', output: 'false' },
  sig: {
    js: lang('containsDuplicate', [['nums', 'number[]']], 'boolean'),
    py: lang('contains_duplicate', [['nums', 'List[int]']], 'bool'),
    java: lang('containsDuplicate', [['nums', 'int[]']], 'boolean'),
    cpp: lang('containsDuplicate', [['nums', 'vector<int>']], 'bool'),
  },
});

add('Pascals Triangle', {
  desc: 'Given an integer `numRows`, return the first numRows rows of Pascal\'s triangle as a 2D list of integers, where each row is built from the sum of the two numbers directly above it.',
  constraints: ['1 <= numRows <= 30'],
  examples: [{ input: 'numRows = 5', output: '[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]', explanation: 'The first 5 rows of Pascal\'s triangle.' }],
  sample: { input: '5', output: '[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]' },
  hidden: { input: '1', output: '[[1]]' },
  sig: {
    js: lang('generate', [['numRows', 'number']], 'number[][]'),
    py: lang('generate', [['numRows', 'int']], 'List[List[int]]'),
    java: lang('generate', [['numRows', 'int']], 'List<List<Integer>>'),
    cpp: lang('generate', [['numRows', 'int']], 'vector<vector<int>>'),
  },
});


add('Remove Duplicates from Sorted Array', {
  desc: 'Given a sorted (non-decreasing) integer array `nums`, remove the duplicates so each unique element appears once and return the number of unique elements k. The first k slots of nums must hold the unique values in original order.',
  constraints: ['1 <= nums.length <= 3 * 10^4', '-100 <= nums[i] <= 100'],
  examples: [{ input: 'nums = [1,1,2]', output: '2', explanation: 'Unique values are [1,2]; return count 2.' }],
  sample: { input: '[1,1,2]', output: '2' },
  hidden: { input: '[0,0,1,1,1,2,2,3,3,4]', output: '5' },
  sig: {
    js: lang('removeDuplicates', [['nums', 'number[]']], 'number'),
    py: lang('remove_duplicates', [['nums', 'List[int]']], 'int'),
    java: lang('removeDuplicates', [['nums', 'int[]']], 'int'),
    cpp: lang('removeDuplicates', [['nums', 'vector<int>']], 'int'),
  },
});

add('Rotate Array', {
  desc: 'Given an integer array `nums`, rotate the array to the right by `k` steps (k is non-negative). Return the rotated array.',
  constraints: ['1 <= nums.length <= 10^5', '0 <= k <= 10^5'],
  examples: [{ input: 'nums = [1,2,3,4,5,6,7], k = 3', output: '[5,6,7,1,2,3,4]', explanation: 'Rotate right by 3 steps.' }],
  sample: { input: '[1,2,3,4,5,6,7]\\n3', output: '[5,6,7,1,2,3,4]' },
  hidden: { input: '[-1,-100,3,99]\\n2', output: '[3,99,-1,-100]' },
  sig: {
    js: lang('rotate', [['nums', 'number[]'], ['k', 'number']], 'number[]'),
    py: lang('rotate', [['nums', 'List[int]'], ['k', 'int']], 'List[int]'),
    java: lang('rotate', [['nums', 'int[]'], ['k', 'int']], 'void'),
    cpp: lang('rotate', [['nums', 'vector<int>'], ['k', 'int']], 'void'),
  },
});



add('Product of Array Except Self', {
  desc: 'Given an integer array `nums`, return an array `answer` where answer[i] is the product of all elements of nums except nums[i]. Solve in O(n) without division.',
  constraints: ['2 <= nums.length <= 10^5', '-30 <= nums[i] <= 30'],
  examples: [{ input: 'nums = [1,2,3,4]', output: '[24,12,8,6]', explanation: 'answer[0] = 2*3*4 = 24, etc.' }],
  sample: { input: '[1,2,3,4]', output: '[24,12,8,6]' },
  hidden: { input: '[-1,1,0,-3,3]', output: '[0,0,9,0,0]' },
  sig: {
    js: lang('productExceptSelf', [['nums', 'number[]']], 'number[]'),
    py: lang('product_except_self', [['nums', 'List[int]']], 'List[int]'),
    java: lang('productExceptSelf', [['nums', 'int[]']], 'int[]'),
    cpp: lang('productExceptSelf', [['nums', 'vector<int>']], 'vector<int>'),
  },
});

add('Maximum Subarray', {
  desc: 'Given an integer array `nums`, return the sum of the contiguous subarray (containing at least one number) with the largest sum.',
  constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
  examples: [{ input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' }],
  sample: { input: '[-2,1,-3,4,-1,2,1,-5,4]', output: '6' },
  hidden: { input: '[1]', output: '1' },
  sig: {
    js: lang('maxSubArray', [['nums', 'number[]']], 'number'),
    py: lang('max_sub_array', [['nums', 'List[int]']], 'int'),
    java: lang('maxSubArray', [['nums', 'int[]']], 'int'),
    cpp: lang('maxSubArray', [['nums', 'vector<int>']], 'int'),
  },
});

add('Merge Intervals', {
  desc: 'Given an array of intervals where intervals[i] = [start, end], merge all overlapping intervals and return an array of the non-overlapping intervals that cover all input intervals.',
  constraints: ['1 <= intervals.length <= 10^4', 'intervals[i].length == 2', '0 <= start <= end <= 10^4'],
  examples: [{ input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Intervals [1,3] and [2,6] overlap, merging to [1,6].' }],
  sample: { input: '[[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' },
  hidden: { input: '[[1,4],[4,5]]', output: '[[1,5]]' },
  sig: {
    js: lang('merge', [['intervals', 'number[][]']], 'number[][]'),
    py: lang('merge', [['intervals', 'List[List[int]]']], 'List[List[int]]'),
    java: lang('merge', [['intervals', 'int[][]']], 'int[][]'),
    cpp: lang('merge', [['intervals', 'vector<vector<int>>']], 'vector<vector<int>>'),
  },
});



add('Set Matrix Zeroes', {
  desc: 'Given an m x n integer matrix `matrix`, if an element is 0, set its entire row and column to 0. Return the modified matrix.',
  constraints: ['m == matrix.length', 'n == matrix[0].length', '1 <= m, n <= 200'],
  examples: [{ input: 'matrix = [[1,1,1],[1,0,1],[1,1,1]]', output: '[[1,0,1],[0,0,0],[1,0,1]]', explanation: 'Row 2 and column 2 are zeroed.' }],
  sample: { input: '[[1,1,1],[1,0,1],[1,1,1]]', output: '[[1,0,1],[0,0,0],[1,0,1]]' },
  hidden: { input: '[[0,1,2,0],[3,4,5,2],[1,3,1,5]]', output: '[[0,0,0,0],[0,4,5,0],[0,3,1,0]]' },
  sig: {
    js: lang('setZeroes', [['matrix', 'number[][]']], 'number[][]'),
    py: lang('set_zeroes', [['matrix', 'List[List[int]]']], 'List[List[int]]'),
    java: lang('setZeroes', [['matrix', 'int[][]']], 'void'),
    cpp: lang('setZeroes', [['matrix', 'vector<vector<int>>']], 'void'),
  },
});

add('3Sum', {
  desc: 'Given an integer array `nums`, return all triplets [nums[i], nums[j], nums[k]] with distinct indices i, j, k where nums[i] + nums[j] + nums[k] == 0. The solution set must not contain duplicate triplets.',
  constraints: ['3 <= nums.length <= 3000', '-10^5 <= nums[i] <= 10^5'],
  examples: [{ input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]', explanation: 'The distinct triplets summing to zero.' }],
  sample: { input: '[-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]' },
  hidden: { input: '[0,1,1]', output: '[]' },
  sig: {
    js: lang('threeSum', [['nums', 'number[]']], 'number[][]'),
    py: lang('three_sum', [['nums', 'List[int]']], 'List[List[int]]'),
    java: lang('threeSum', [['nums', 'int[]']], 'List<List<Integer>>'),
    cpp: lang('threeSum', [['nums', 'vector<int>']], 'vector<vector<int>>'),
  },
});

add('Container With Most Water', {
  desc: 'Given an integer array `height` of length n where height[i] is the height of a vertical line, return the maximum amount of water a container formed by two lines and the x-axis can store.',
  constraints: ['2 <= n <= 10^5', '0 <= height[i] <= 10^4'],
  examples: [{ input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49', explanation: 'Lines at indices 1 and 8 form the max area.' }],
  sample: { input: '[1,8,6,2,5,4,8,3,7]', output: '49' },
  hidden: { input: '[1,1]', output: '1' },
  sig: {
    js: lang('maxArea', [['height', 'number[]']], 'number'),
    py: lang('max_area', [['height', 'List[int]']], 'int'),
    java: lang('maxArea', [['height', 'int[]']], 'int'),
    cpp: lang('maxArea', [['height', 'vector<int>']], 'int'),
  },
});

add('Increasing Triplet Subsequence', {
  desc: 'Given an integer array `nums`, return true if there exists a triple of indices (i, j, k) such that i < j < k and nums[i] < nums[j] < nums[k]. Return false otherwise.',
  constraints: ['1 <= nums.length <= 5 * 10^5', '-2^31 <= nums[i] <= 2^31 - 1'],
  examples: [{ input: 'nums = [1,2,3,4,5]', output: 'true', explanation: 'Any triplet like (1,2,3) satisfies the condition.' }],
  sample: { input: '[1,2,3,4,5]', output: 'true' },
  hidden: { input: '[5,4,3,2,1]', output: 'false' },
  sig: {
    js: lang('increasingTriplet', [['nums', 'number[]']], 'boolean'),
    py: lang('increasing_triplet', [['nums', 'List[int]']], 'bool'),
    java: lang('increasingTriplet', [['nums', 'int[]']], 'boolean'),
    cpp: lang('increasingTriplet', [['nums', 'vector<int>']], 'bool'),
  },
});



add('First Missing Positive', {
  desc: 'Given an unsorted integer array `nums`, return the smallest positive integer that is missing from the array. The algorithm must run in O(n) time and O(1) extra space.',
  constraints: ['1 <= nums.length <= 10^5', '-2^31 <= nums[i] <= 2^31 - 1'],
  examples: [{ input: 'nums = [1,2,0]', output: '3', explanation: '1 and 2 are present, so 3 is the smallest missing positive.' }],
  sample: { input: '[1,2,0]', output: '3' },
  hidden: { input: '[3,4,-1,1]', output: '2' },
  sig: {
    js: lang('firstMissingPositive', [['nums', 'number[]']], 'number'),
    py: lang('first_missing_positive', [['nums', 'List[int]']], 'int'),
    java: lang('firstMissingPositive', [['nums', 'int[]']], 'int'),
    cpp: lang('firstMissingPositive', [['nums', 'vector<int>']], 'int'),
  },
});

add('Median of Two Sorted Arrays', {
  desc: 'Given two sorted arrays `nums1` and `nums2` of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity must be O(log(m+n)).',
  constraints: ['0 <= m, n <= 1000', '1 <= m + n <= 2000'],
  examples: [{ input: 'nums1 = [1,3], nums2 = [2]', output: '2.0', explanation: 'Merged array [1,2,3], median is 2.' }],
  sample: { input: '[1,3]\\n[2]', output: '2.0' },
  hidden: { input: '[1,2]\\n[3,4]', output: '2.5' },
  sig: {
    js: lang('findMedianSortedArrays', [['nums1', 'number[]'], ['nums2', 'number[]']], 'number'),
    py: lang('find_median_sorted_arrays', [['nums1', 'List[int]'], ['nums2', 'List[int]']], 'float'),
    java: lang('findMedianSortedArrays', [['nums1', 'int[]'], ['nums2', 'int[]']], 'double'),
    cpp: lang('findMedianSortedArrays', [['nums1', 'vector<int>'], ['nums2', 'vector<int>']], 'double'),
  },
});

add('Trapping Rain Water', {
  desc: 'Given an array `height` of non-negative integers representing an elevation map where the width of each bar is 1, return how much water it can trap after raining.',
  constraints: ['1 <= n <= 2 * 10^4', '0 <= height[i] <= 10^5'],
  examples: [{ input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: 'The elevation map traps 6 units of water.' }],
  sample: { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' },
  hidden: { input: '[4,2,0,3,2,5]', output: '9' },
  sig: {
    js: lang('trap', [['height', 'number[]']], 'number'),
    py: lang('trap', [['height', 'List[int]']], 'int'),
    java: lang('trap', [['height', 'int[]']], 'int'),
    cpp: lang('trap', [['height', 'vector<int>']], 'int'),
  },
});



add('Valid Parentheses String', {
  desc: 'Given a string `s` containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', return true if the input string is valid. A string is valid if open brackets are closed by the same type in the correct order.',
  constraints: ['1 <= s.length <= 10^4', 's consists of parentheses/brackets/braces only'],
  examples: [{ input: 's = "()[]{}"', output: 'true', explanation: 'All brackets close correctly.' }],
  sample: { input: '()[]{}', output: 'true' },
  hidden: { input: '(]', output: 'false' },
  sig: {
    js: lang('isValid', [['s', 'string']], 'boolean'),
    py: lang('is_valid', [['s', 'str']], 'bool'),
    java: lang('isValid', [['s', 'String']], 'boolean'),
    cpp: lang('isValid', [['s', 'string']], 'bool'),
  },
});

add('Roman to Integer', {
  desc: 'Given a roman numeral `s`, convert it to an integer. Return the integer value.',
  constraints: ['1 <= s.length <= 15', 's contains only the characters (I, V, X, L, C, D, M)', 's is a valid roman numeral in the range [1, 3999]'],
  examples: [{ input: 's = "III"', output: '3', explanation: 'III = 3.' }],
  sample: { input: 'III', output: '3' },
  hidden: { input: 'MCMXCIV', output: '1994' },
  sig: {
    js: lang('romanToInt', [['s', 'string']], 'number'),
    py: lang('roman_to_int', [['s', 'str']], 'int'),
    java: lang('romanToInt', [['s', 'String']], 'int'),
    cpp: lang('romanToInt', [['s', 'string']], 'int'),
  },
});

add('Longest Common Prefix', {
  desc: 'Given an array of strings `strs`, return the longest common prefix string among all of them. If there is no common prefix, return an empty string.',
  constraints: ['1 <= strs.length <= 200', '0 <= strs[i].length <= 200'],
  examples: [{ input: 'strs = ["flower","flow","flight"]', output: '"fl"', explanation: 'The longest common prefix is "fl".' }],
  sample: { input: '["flower","flow","flight"]', output: 'fl' },
  hidden: { input: '["flower","flower","flower"]', output: 'flower' },
  sig: {
    js: lang('longestCommonPrefix', [['strs', 'string[]']], 'string'),
    py: lang('longest_common_prefix', [['strs', 'List[str]']], 'str'),
    java: lang('longestCommonPrefix', [['strs', 'String[]']], 'String'),
    cpp: lang('longestCommonPrefix', [['strs', 'vector<string>']], 'string'),
  },
});

add('Valid Anagram', {
  desc: 'Given two strings `s` and `t`, return true if t is an anagram of s, and false otherwise. An anagram is a word formed by rearranging the letters of another word.',
  constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters'],
  examples: [{ input: 's = "anagram", t = "nagaram"', output: 'true', explanation: 'Both use the same letters.' }],
  sample: { input: 'anagram\\nnagaram', output: 'true' },
  hidden: { input: 'rat\\ncar', output: 'false' },
  sig: {
    js: lang('isAnagram', [['s', 'string'], ['t', 'string']], 'boolean'),
    py: lang('is_anagram', [['s', 'str'], ['t', 'str']], 'bool'),
    java: lang('isAnagram', [['s', 'String'], ['t', 'String']], 'boolean'),
    cpp: lang('isAnagram', [['s', 'string'], ['t', 'string']], 'bool'),
  },
});



add('Longest Substring Without Repeating', {
  desc: 'Given a string `s`, return the length of the longest substring that contains no repeating characters.',
  constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces'],
  examples: [{ input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", length 3.' }],
  sample: { input: 'abcabcbb', output: '3' },
  hidden: { input: 'bbbbb', output: '1' },
  sig: {
    js: lang('lengthOfLongestSubstring', [['s', 'string']], 'number'),
    py: lang('length_of_longest_substring', [['s', 'str']], 'int'),
    java: lang('lengthOfLongestSubstring', [['s', 'String']], 'int'),
    cpp: lang('lengthOfLongestSubstring', [['s', 'string']], 'int'),
  },
});

add('Longest Palindromic Substring', {
  desc: 'Given a string `s`, return the longest palindromic substring in s. If there are multiple, return any one.',
  constraints: ['1 <= s.length <= 1000', 's consists of digits and English letters'],
  examples: [{ input: 's = "babad"', output: '"bab"', explanation: '"aba" is also a valid answer.' }],
  sample: { input: 'babad', output: 'bab' },
  hidden: { input: 'cbbd', output: 'bb' },
  sig: {
    js: lang('longestPalindrome', [['s', 'string']], 'string'),
    py: lang('longest_palindrome', [['s', 'str']], 'str'),
    java: lang('longestPalindrome', [['s', 'String']], 'String'),
    cpp: lang('longestPalindrome', [['s', 'string']], 'string'),
  },
});

add('Integer to Roman', {
  desc: 'Given an integer `num`, convert it to a roman numeral and return it as a string. The integer is in the range [1, 3999].',
  constraints: ['1 <= num <= 3999'],
  examples: [{ input: 'num = 1994', output: '"MCMXCIV"', explanation: '1994 = 1000 + 900 + 90 + 4 = M + CM + XC + IV.' }],
  sample: { input: '1994', output: 'MCMXCIV' },
  hidden: { input: '58', output: 'LVIII' },
  sig: {
    js: lang('intToRoman', [['num', 'number']], 'string'),
    py: lang('int_to_roman', [['num', 'int']], 'str'),
    java: lang('intToRoman', [['num', 'int']], 'String'),
    cpp: lang('intToRoman', [['num', 'int']], 'string'),
  },
});

add('Group Anagrams', {
  desc: 'Given an array of strings `strs`, group the anagrams together. Return groups as an array of string arrays, in any order. Words are anagrams if they share the same multiset of letters.',
  constraints: ['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100'],
  examples: [{ input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]', explanation: 'Anagrams grouped together.' }],
  sample: { input: '["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' },
  hidden: { input: '[""]', output: '[[""]]' },
  sig: {
    js: lang('groupAnagrams', [['strs', 'string[]']], 'string[][]'),
    py: lang('group_anagrams', [['strs', 'List[str]']], 'List[List[str]]'),
    java: lang('groupAnagrams', [['strs', 'String[]']], 'List<List<String>>'),
    cpp: lang('groupAnagrams', [['strs', 'vector<string>']], 'vector<vector<string>>'),
  },
});



add('Longest Repeating Character Replacement', {
  desc: 'Given a string `s` and an integer `k`, return the length of the longest substring you can create after replacing at most k characters so that all characters in the substring are the same.',
  constraints: ['1 <= s.length <= 10^5', '0 <= k <= s.length'],
  examples: [{ input: 's = "ABAB", k = 2', output: '4', explanation: 'Replace the two As with Bs (or vice versa) to get "BBBB".' }],
  sample: { input: 'ABAB\\n2', output: '4' },
  hidden: { input: 'AABABBA\\n1', output: '4' },
  sig: {
    js: lang('characterReplacement', [['s', 'string'], ['k', 'number']], 'number'),
    py: lang('character_replacement', [['s', 'str'], ['k', 'int']], 'int'),
    java: lang('characterReplacement', [['s', 'String'], ['k', 'int']], 'int'),
    cpp: lang('characterReplacement', [['s', 'string'], ['k', 'int']], 'int'),
  },
});

add('Generate Parentheses', {
  desc: 'Given an integer `n`, return all combinations of well-formed parentheses strings that can be formed with n pairs of parentheses.',
  constraints: ['1 <= n <= 8'],
  examples: [{ input: 'n = 3', output: '["((()))","(()())","(())()","()(())","()()()"]', explanation: 'All 5 valid arrangements.' }],
  sample: { input: '3', output: '["((()))","(()())","(())()","()(())","()()()"]' },
  hidden: { input: '1', output: '["()"]' },
  sig: {
    js: lang('generateParenthesis', [['n', 'number']], 'string[]'),
    py: lang('generate_parenthesis', [['n', 'int']], 'List[str]'),
    java: lang('generateParenthesis', [['n', 'int']], 'List<String>'),
    cpp: lang('generateParenthesis', [['n', 'int']], 'vector<string>'),
  },
});

add('Minimum Window Substring', {
  desc: 'Given two strings `s` and `t`, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If there is no such window, return an empty string.',
  constraints: ['1 <= s.length, t.length <= 10^5', 's and t consist of uppercase and lowercase English letters'],
  examples: [{ input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"', explanation: 'The smallest window is "BANC".' }],
  sample: { input: 'ADOBECODEBANC\\nABC', output: 'BANC' },
  hidden: { input: 'aa\\naa', output: 'aa' },
  sig: {
    js: lang('minWindow', [['s', 'string'], ['t', 'string']], 'string'),
    py: lang('min_window', [['s', 'str'], ['t', 'str']], 'str'),
    java: lang('minWindow', [['s', 'String'], ['t', 'String']], 'String'),
    cpp: lang('minWindow', [['s', 'string'], ['t', 'string']], 'string'),
  },
});

add('Zigzag Conversion', {
  desc: 'Given a string `s` and an integer `numRows`, return the string read by a zigzag pattern written in numRows rows, read row by row.',
  constraints: ['1 <= s.length <= 1000', '1 <= numRows <= 1000'],
  examples: [{ input: 's = "PAYPALISHIRING", numRows = 3', output: '"PAHNAPLSIIGYIR"', explanation: 'The zigzag pattern reordered.' }],
  sample: { input: 'PAYPALISHIRING\\n3', output: 'PAHNAPLSIIGYIR' },
  hidden: { input: 'PAYPALISHIRING\\n4', output: 'PINALSIGYAHRPI' },
  sig: {
    js: lang('convert', [['s', 'string'], ['numRows', 'number']], 'string'),
    py: lang('convert', [['s', 'str'], ['numRows', 'int']], 'str'),
    java: lang('convert', [['s', 'String'], ['numRows', 'int']], 'String'),
    cpp: lang('convert', [['s', 'string'], ['numRows', 'int']], 'string'),
  },
});



add('String to Integer', {
  desc: 'Implement the myAtoi function which converts a string to a 32-bit signed integer. Skip leading whitespace, handle an optional +/- sign, read digits until a non-digit, and clamp the result to the 32-bit signed range. Return the integer.',
  constraints: ['0 <= s.length <= 200', 's consists of English letters, digits, spaces, and +/-'],
  examples: [{ input: 's = "42"', output: '42', explanation: 'Simple digits parsed to 42.' }],
  sample: { input: '42', output: '42' },
  hidden: { input: '   -42', output: '-42' },
  sig: {
    js: lang('myAtoi', [['s', 'string']], 'number'),
    py: lang('my_atoi', [['s', 'str']], 'int'),
    java: lang('myAtoi', [['s', 'String']], 'int'),
    cpp: lang('myAtoi', [['s', 'string']], 'int'),
  },
});

add('Multiply Strings', {
  desc: 'Given two non-negative integers `num1` and `num2` represented as strings, return the product of num1 and num2, also represented as a string. You must not use any built-in big integer library.',
  constraints: ['1 <= num1.length, num2.length <= 200', 'num1 and num2 do not contain leading zeros except the number 0'],
  examples: [{ input: 'num1 = "2", num2 = "3"', output: '"6"', explanation: '2 * 3 = 6.' }],
  sample: { input: '2\\n3', output: '6' },
  hidden: { input: '123\\n456', output: '56088' },
  sig: {
    js: lang('multiply', [['num1', 'string'], ['num2', 'string']], 'string'),
    py: lang('multiply', [['num1', 'str'], ['num2', 'str']], 'str'),
    java: lang('multiply', [['num1', 'String'], ['num2', 'String']], 'String'),
    cpp: lang('multiply', [['num1', 'string'], ['num2', 'string']], 'string'),
  },
});

add('Implement strStr', {
  desc: 'Given two strings `haystack` and `needle`, return the index of the first occurrence of needle in haystack, or -1 if needle is not part of haystack. If needle is empty, return 0.',
  constraints: ['1 <= haystack.length <= 10^4', '0 <= needle.length <= 10^4'],
  examples: [{ input: 'haystack = "hello", needle = "ll"', output: '2', explanation: '"ll" first occurs at index 2.' }],
  sample: { input: 'hello\\nll', output: '2' },
  hidden: { input: 'aaaaa\\nbba', output: '-1' },
  sig: {
    js: lang('strStr', [['haystack', 'string'], ['needle', 'string']], 'number'),
    py: lang('str_str', [['haystack', 'str'], ['needle', 'str']], 'int'),
    java: lang('strStr', [['haystack', 'String'], ['needle', 'String']], 'int'),
    cpp: lang('strStr', [['haystack', 'string'], ['needle', 'string']], 'int'),
  },
});

add('Count and Say', {
  desc: 'The count-and-say sequence is built recursively: countAndSay(1) = "1", and countAndSay(n) is the run-length encoding of countAndSay(n-1). Given an integer `n`, return the nth term of the count-and-say sequence as a string.',
  constraints: ['1 <= n <= 30'],
  examples: [{ input: 'n = 4', output: '"1211"', explanation: 'countAndSay(3)="21" -> "1211".' }],
  sample: { input: '4', output: '1211' },
  hidden: { input: '1', output: '1' },
  sig: {
    js: lang('countAndSay', [['n', 'number']], 'string'),
    py: lang('count_and_say', [['n', 'int']], 'str'),
    java: lang('countAndSay', [['n', 'int']], 'String'),
    cpp: lang('countAndSay', [['n', 'int']], 'string'),
  },
});



add('Climbing Stairs', {
  desc: 'You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. Return the number of distinct ways to reach the top.',
  constraints: ['1 <= n <= 45'],
  examples: [{ input: 'n = 3', output: '3', explanation: 'Ways: 1+1+1, 1+2, 2+1.' }],
  sample: { input: '3', output: '3' },
  hidden: { input: '2', output: '2' },
  sig: {
    js: lang('climbStairs', [['n', 'number']], 'number'),
    py: lang('climb_stairs', [['n', 'int']], 'int'),
    java: lang('climbStairs', [['n', 'int']], 'int'),
    cpp: lang('climbStairs', [['n', 'int']], 'int'),
  },
});

add('House Robber', {
  desc: 'Given an integer array `nums` representing the amount of money in each house, return the maximum amount of money you can rob tonight without robbing two adjacent houses.',
  constraints: ['1 <= nums.length <= 100', '0 <= nums[i] <= 400'],
  examples: [{ input: 'nums = [1,2,3,1]', output: '4', explanation: 'Rob house 1 (1) and house 3 (3) = 4.' }],
  sample: { input: '[1,2,3,1]', output: '4' },
  hidden: { input: '[2,7,9,3,1]', output: '12' },
  sig: {
    js: lang('rob', [['nums', 'number[]']], 'number'),
    py: lang('rob', [['nums', 'List[int]']], 'int'),
    java: lang('rob', [['nums', 'int[]']], 'int'),
    cpp: lang('rob', [['nums', 'vector<int>']], 'int'),
  },
});

add('Longest Increasing Subsequence', {
  desc: 'Given an integer array `nums`, return the length of the longest strictly increasing subsequence.',
  constraints: ['1 <= nums.length <= 2500', '-10^4 <= nums[i] <= 10^4'],
  examples: [{ input: 'nums = [10,9,2,5,3,7,101,18]', output: '4', explanation: 'The LIS is [2,3,7,101], length 4.' }],
  sample: { input: '[10,9,2,5,3,7,101,18]', output: '4' },
  hidden: { input: '[7,7,7,7,7,7,7]', output: '1' },
  sig: {
    js: lang('lengthOfLIS', [['nums', 'number[]']], 'number'),
    py: lang('length_of_lis', [['nums', 'List[int]']], 'int'),
    java: lang('lengthOfLIS', [['nums', 'int[]']], 'int'),
    cpp: lang('lengthOfLIS', [['nums', 'vector<int>']], 'int'),
  },
});

add('Coin Change', {
  desc: 'Given an array of coins `coins` of different denominations and an integer `amount`, return the fewest number of coins needed to make up that amount. If that amount cannot be made up, return -1.',
  constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
  examples: [{ input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1.' }],
  sample: { input: '[1,2,5]\\n11', output: '3' },
  hidden: { input: '[2]\\n3', output: '-1' },
  sig: {
    js: lang('coinChange', [['coins', 'number[]'], ['amount', 'number']], 'number'),
    py: lang('coin_change', [['coins', 'List[int]'], ['amount', 'int']], 'int'),
    java: lang('coinChange', [['coins', 'int[]'], ['amount', 'int']], 'int'),
    cpp: lang('coinChange', [['coins', 'vector<int>'], ['amount', 'int']], 'int'),
  },
});

add('Edit Distance', {
  desc: 'Given two strings `word1` and `word2`, return the minimum number of operations (insert, delete, replace) required to convert word1 into word2.',
  constraints: ['0 <= word1.length, word2.length <= 500'],
  examples: [{ input: 'word1 = "horse", word2 = "ros"', output: '3', explanation: 'horse -> rorse (replace h->r) -> rose (remove r) -> ros (remove e).' }],
  sample: { input: 'horse\\nros', output: '3' },
  hidden: { input: 'intention\\nexecution', output: '5' },
  sig: {
    js: lang('minDistance', [['word1', 'string'], ['word2', 'string']], 'number'),
    py: lang('min_distance', [['word1', 'str'], ['word2', 'str']], 'int'),
    java: lang('minDistance', [['word1', 'String'], ['word2', 'String']], 'int'),
    cpp: lang('minDistance', [['word1', 'string'], ['word2', 'string']], 'int'),
  },
});



add('Word Break', {
  desc: 'Given a string `s` and a dictionary of strings `wordDict`, return true if s can be segmented into a space-separated sequence of one or more dictionary words.',
  constraints: ['1 <= s.length <= 300', '1 <= wordDict.length <= 1000', '1 <= wordDict[i].length <= 20'],
  examples: [{ input: 's = "leetcode", wordDict = ["leet","code"]', output: 'true', explanation: 'segment as "leet code".' }],
  sample: { input: 'leetcode\\n["leet","code"]', output: 'true' },
  hidden: { input: 'catsandog\\n["cats","dog","sand","and","cat"]', output: 'false' },
  sig: {
    js: lang('wordBreak', [['s', 'string'], ['wordDict', 'string[]']], 'boolean'),
    py: lang('word_break', [['s', 'str'], ['wordDict', 'List[str]']], 'bool'),
    java: lang('wordBreak', [['s', 'String'], ['wordDict', 'List<String>']], 'boolean'),
    cpp: lang('wordBreak', [['s', 'string'], ['wordDict', 'vector<string>']], 'bool'),
  },
});

add('Number of Islands', {
  desc: 'Given an m x n 2D binary grid where "1" represents land and "0" represents water, return the number of islands. An island is surrounded by water and formed by connecting adjacent lands horizontally or vertically.',
  constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300', 'grid[i][j] is "0" or "1"'],
  examples: [{ input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1', explanation: 'One connected island.' }],
  sample: { input: '["11110","11010","11000","00000"]', output: '1' },
  hidden: { input: '["11000","11000","00100","00011"]', output: '3' },
  sig: {
    js: lang('numIslands', [['grid', 'string[][]']], 'number'),
    py: lang('num_islands', [['grid', 'List[List[str]]']], 'int'),
    java: lang('numIslands', [['grid', 'char[][]']], 'int'),
    cpp: lang('numIslands', [['grid', 'vector<vector<char>>']], 'int'),
  },
});

add('Course Schedule', {
  desc: 'There are a total of `numCourses` courses labelled from 0 to numCourses-1. Given an array `prerequisites` where prerequisites[i] = [a, b] means you must take course b before course a, return true if it is possible to finish all courses.',
  constraints: ['1 <= numCourses <= 2000', '0 <= prerequisites.length <= 5000', 'prerequisites[i].length == 2'],
  examples: [{ input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true', explanation: 'Take course 0 then course 1.' }],
  sample: { input: '2\\n[[1,0]]', output: 'true' },
  hidden: { input: '2\\n[[1,0],[0,1]]', output: 'false' },
  sig: {
    js: lang('canFinish', [['numCourses', 'number'], ['prerequisites', 'number[][]']], 'boolean'),
    py: lang('can_finish', [['numCourses', 'int'], ['prerequisites', 'List[List[int]]']], 'bool'),
    java: lang('canFinish', [['numCourses', 'int'], ['prerequisites', 'int[][]']], 'boolean'),
    cpp: lang('canFinish', [['numCourses', 'int'], ['prerequisites', 'vector<vector<int>>']], 'bool'),
  },
});

add('Word Search', {
  desc: 'Given an m x n grid of characters `board` and a string `word`, return true if the word exists in the grid. The word can be constructed from letters of sequentially adjacent cells (horizontally or vertically), each cell used at most once.',
  constraints: ['1 <= m, n <= 6', '1 <= word.length <= 15'],
  examples: [{ input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: 'true', explanation: 'Path exists forming "ABCCED".' }],
  sample: { input: '["ABCE","SFCS","ADEE"]\\nABCCED', output: 'true' },
  hidden: { input: '["ABCE","SFCS","ADEE"]\\nABCB', output: 'false' },
  sig: {
    js: lang('exist', [['board', 'string[][]'], ['word', 'string']], 'boolean'),
    py: lang('exist', [['board', 'List[List[str]]'], ['word', 'str']], 'bool'),
    java: lang('exist', [['board', 'char[][]'], ['word', 'String']], 'boolean'),
    cpp: lang('exist', [['board', 'vector<vector<char>>'], ['word', 'string']], 'bool'),
  },
});



add('Maximum Product Subarray', {
  desc: 'Given an integer array `nums`, return the maximum product of a contiguous non-empty subarray.',
  constraints: ['1 <= nums.length <= 2 * 10^4', '-10 <= nums[i] <= 10'],
  examples: [{ input: 'nums = [2,3,-2,4]', output: '6', explanation: 'The subarray [2,3] has the largest product 6.' }],
  sample: { input: '[2,3,-2,4]', output: '6' },
  hidden: { input: '[-2,0,-1]', output: '0' },
  sig: {
    js: lang('maxProduct', [['nums', 'number[]']], 'number'),
    py: lang('max_product', [['nums', 'List[int]']], 'int'),
    java: lang('maxProduct', [['nums', 'int[]']], 'int'),
    cpp: lang('maxProduct', [['nums', 'vector<int>']], 'int'),
  },
});

add('Find Peak Element', {
  desc: 'Given a 0-indexed integer array `nums`, find a peak element (an element strictly greater than its neighbors) and return its index. You may imagine nums[-1] = nums[n] = -infinity. The array may contain multiple peaks; return the index of any peak.',
  constraints: ['1 <= nums.length <= 1000', '-2^31 <= nums[i] <= 2^31 - 1'],
  examples: [{ input: 'nums = [1,2,3,1]', output: '2', explanation: '3 is strictly greater than 2 and 1, so 2 is a valid peak index.' }],
  sample: { input: '[1,2,3,1]', output: '2' },
  hidden: { input: '[1,2]', output: '1' },
  sig: {
    js: lang('findPeakElement', [['nums', 'number[]']], 'number'),
    py: lang('find_peak_element', [['nums', 'List[int]']], 'int'),
    java: lang('findPeakElement', [['nums', 'int[]']], 'int'),
    cpp: lang('findPeakElement', [['nums', 'vector<int>']], 'int'),
  },
});

add('Sort Colors', {
  desc: 'Given an array `nums` with n objects colored red, white, or blue (encoded as 0, 1, 2), sort them in place so objects of the same color are adjacent in the order red, white, blue. Return the sorted array.',
  constraints: ['n == nums.length', '1 <= n <= 300', 'nums[i] is 0, 1, or 2'],
  examples: [{ input: 'nums = [2,0,2,1,1,0]', output: '[0,0,1,1,2,2]', explanation: 'Sorted color order.' }],
  sample: { input: '[2,0,2,1,1,0]', output: '[0,0,1,1,2,2]' },
  hidden: { input: '[2,0,1]', output: '[0,1,2]' },
  sig: {
    js: lang('sortColors', [['nums', 'number[]']], 'number[]'),
    py: lang('sort_colors', [['nums', 'List[int]']], 'List[int]'),
    java: lang('sortColors', [['nums', 'int[]']], 'void'),
    cpp: lang('sortColors', [['nums', 'vector<int>']], 'void'),
  },
});

add('Minimum Size Subarray Sum', {
  desc: 'Given an array of positive integers `nums` and a positive integer `target`, return the minimal length of a contiguous subarray whose sum is greater than or equal to target. If there is no such subarray, return 0.',
  constraints: ['1 <= target <= 10^9', '1 <= nums.length <= 10^5', '1 <= nums[i] <= 10^4'],
  examples: [{ input: 'target = 7, nums = [2,3,1,2,4,3]', output: '2', explanation: 'The subarray [4,3] has minimal length 2.' }],
  sample: { input: '7\\n[2,3,1,2,4,3]', output: '2' },
  hidden: { input: '4\\n[1,4,4]', output: '1' },
  sig: {
    js: lang('minSubArrayLen', [['target', 'number'], ['nums', 'number[]']], 'number'),
    py: lang('min_sub_array_len', [['target', 'int'], ['nums', 'List[int]']], 'int'),
    java: lang('minSubArrayLen', [['target', 'int'], ['nums', 'int[]']], 'int'),
    cpp: lang('minSubArrayLen', [['target', 'int'], ['nums', 'vector<int>']], 'int'),
  },
});



add('Valid Palindrome II', {
  desc: 'Given a string `s`, return true if the string can become a palindrome by deleting at most one character from it.',
  constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],
  examples: [{ input: 's = "abca"', output: 'true', explanation: 'Delete the \'c\' to get "aba", a palindrome.' }],
  sample: { input: 'abca', output: 'true' },
  hidden: { input: 'abc', output: 'false' },
  sig: {
    js: lang('validPalindrome', [['s', 'string']], 'boolean'),
    py: lang('valid_palindrome', [['s', 'str']], 'bool'),
    java: lang('validPalindrome', [['s', 'String']], 'boolean'),
    cpp: lang('validPalindrome', [['s', 'string']], 'bool'),
  },
});

add('Binary Search', {
  desc: 'Given a sorted (ascending) integer array `nums` and an integer `target`, return the index of target in nums, or -1 if it is not present. The algorithm must run in O(log n) time.',
  constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4', 'all values in nums are unique'],
  examples: [{ input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 is at index 4.' }],
  sample: { input: '[-1,0,3,5,9,12]\\n9', output: '4' },
  hidden: { input: '[-1,0,3,5,9,12]\\n2', output: '-1' },
  sig: {
    js: lang('search', [['nums', 'number[]'], ['target', 'number']], 'number'),
    py: lang('search', [['nums', 'List[int]'], ['target', 'int']], 'int'),
    java: lang('search', [['nums', 'int[]'], ['target', 'int']], 'int'),
    cpp: lang('search', [['nums', 'vector<int>'], ['target', 'int']], 'int'),
  },
});

add('Letter Combinations', {
  desc: 'Given a string `digits` containing digits 2-9 inclusive, return all possible letter combinations that the number could represent, mapping each digit to its letters on a telephone keypad. Return combinations in any order.',
  constraints: ['0 <= digits.length <= 4', 'digits[i] is a digit in the range 2-9'],
  examples: [{ input: 'digits = "23"', output: '["ad","ae","af","bd","be","bf","cd","ce","cf"]', explanation: 'All 9 combos for 2 (abc) and 3 (def).' }],
  sample: { input: '23', output: '["ad","ae","af","bd","be","bf","cd","ce","cf"]' },
  hidden: { input: '2', output: '["a","b","c"]' },
  sig: {
    js: lang('letterCombinations', [['digits', 'string']], 'string[]'),
    py: lang('letter_combinations', [['digits', 'str']], 'List[str]'),
    java: lang('letterCombinations', [['digits', 'String']], 'List<String>'),
    cpp: lang('letterCombinations', [['digits', 'string']], 'vector<string>'),
  },
});

add('Basic Calculator III', {
  desc: 'Implement a basic calculator to evaluate a simple expression string `s`. The expression contains integers, the operators + - * /, and parentheses ( ). Division rounds toward zero. Return the integer result.',
  constraints: ['1 <= s.length <= 10^4', 's consists of integers, + - * /, parentheses, and spaces'],
  examples: [{ input: 's = "2*(5+5*2)/3+(6/2+8)"', output: '21', explanation: 'Evaluate following standard operator precedence.' }],
  sample: { input: '2*(5+5*2)/3+(6/2+8)', output: '21' },
  hidden: { input: '(1+(4+5+2)-3)+(6+8)', output: '23' },
  sig: {
    js: lang('calculate', [['s', 'string']], 'number'),
    py: lang('calculate', [['s', 'str']], 'int'),
    java: lang('calculate', [['s', 'String']], 'int'),
    cpp: lang('calculate', [['s', 'string']], 'int'),
  },
});


module.exports = { CURATED };
