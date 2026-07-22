const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Problem = require('../models/Problem');
const connectDB = require('../config/db');

const starterCode = {
  javascript: `function solve(input) {\n  // Your code here\n  return input;\n}\n`,
  python: `def solve(input):\n    # Your code here\n    return input\n`,
  java: `public class Solution {\n    public static String solve(String input) {\n        // Your code here\n        return input;\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        String input = sc.nextLine();\n        System.out.println(solve(input));\n        sc.close();\n    }\n}`,
  cpp: `#include <iostream>\n#include <string>\nusing namespace std;\n\nstring solve(string input) {\n    // Your code here\n    return input;\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << solve(input) << endl;\n    return 0;\n}`,
  c: `#include <stdio.h>\n#include <string.h>\n\nvoid solve(char* input, char* output) {\n    // Your code here\n    strcpy(output, input);\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
};

const problems = [
  {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    difficulty: 'easy',
    tags: ['arrays', 'hash-map'],
    category: 'DSA',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    ],
    testCases: [
      { input: '2 7 11 15\n9', expectedOutput: '0 1', isSample: true },
      { input: '3 2 4\n6', expectedOutput: '1 2', isSample: true },
      { input: '3 3\n6', expectedOutput: '0 1' },
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) return [map.get(complement), i];\n        map.set(nums[i], i);\n    }\n    return [];\n}\n\n// Read input\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nlet lines = [];\nrl.on('line', (line) => lines.push(line));\nrl.on('close', () => {\n    const nums = lines[0].split(' ').map(Number);\n    const target = parseInt(lines[1]);\n    const result = twoSum(nums, target);\n    console.log(result.join(' '));\n});`,
      python: `def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []\n\nif __name__ == "__main__":\n    nums = list(map(int, input().split()))\n    target = int(input())\n    result = two_sum(nums, target)\n    print(' '.join(map(str, result)))`,
      java: `import java.util.*;\n\npublic class Solution {\n    public static String solve(String input) {\n        String[] lines = input.split("\\n");\n        String[] numStrs = lines[0].split(" ");\n        int[] nums = new int[numStrs.length];\n        for (int i = 0; i < numStrs.length; i++) nums[i] = Integer.parseInt(numStrs[i]);\n        int target = Integer.parseInt(lines[1]);\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return map.get(complement) + " " + i;\n            }\n            map.put(nums[i], i);\n        }\n        return "";\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        StringBuilder sb = new StringBuilder();\n        while (sc.hasNextLine()) sb.append(sc.nextLine()).append("\\n");\n        sc.close();\n        System.out.println(solve(sb.toString().trim()));\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <unordered_map>\n#include <sstream>\nusing namespace std;\n\nstring solve(string input) {\n    stringstream ss(input);\n    vector<int> nums;\n    int num, target;\n    while (ss >> num) nums.push_back(num);\n    target = nums.back();\n    nums.pop_back();\n    unordered_map<int, int> map;\n    for (int i = 0; i < nums.size(); i++) {\n        int complement = target - nums[i];\n        if (map.count(complement)) {\n            return to_string(map[complement]) + " " + to_string(i);\n        }\n        map[nums[i]] = i;\n    }\n    return "";\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    string line2;\n    getline(cin, line2);\n    input += "\\n" + line2;\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\n\nvoid solve(char* input, char* output) {\n    int nums[10000], n = 0, target;\n    char* token = strtok(input, " \\n");\n    while (token) {\n        nums[n++] = atoi(token);\n        token = strtok(NULL, " \\n");\n    }\n    target = nums[n-1];\n    n--;\n    for (int i = 0; i < n; i++) {\n        for (int j = i+1; j < n; j++) {\n            if (nums[i] + nums[j] == target) {\n                sprintf(output, "%d %d", i, j);\n                return;\n            }\n        }\n    }\n    output[0] = '\\0';\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    char line2[10000];\n    fgets(line2, 10000, stdin);\n    strcat(input, line2);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'Reverse a String',
    description: 'Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.',
    difficulty: 'easy',
    tags: ['strings', 'two-pointers'],
    category: 'DSA',
    constraints: '1 <= s.length <= 10^5\ns[i] is a printable ascii character.',
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' },
    ],
    testCases: [
      { input: 'hello', expectedOutput: 'olleh', isSample: true },
      { input: 'Hannah', expectedOutput: 'hannaH', isSample: true },
      { input: 'a', expectedOutput: 'a' },
    ],
    starterCode: {
      javascript: `function reverseString(s) {\n    let left = 0, right = s.length - 1;\n    while (left < right) {\n        [s[left], s[right]] = [s[right], s[left]];\n        left++;\n        right--;\n    }\n    return s;\n}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', (line) => {\n    console.log(reverseString(line.split('')).join(''));\n    rl.close();\n});`,
      python: `def reverse_string(s):\n    return s[::-1]\n\nif __name__ == "__main__":\n    s = input().strip()\n    print(reverse_string(s))`,
      java: `public class Solution {\n    public static String solve(String input) {\n        return new StringBuilder(input).reverse().toString();\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(solve(sc.nextLine()));\n        sc.close();\n    }\n}`,
      cpp: `#include <iostream>\n#include <algorithm>\n#include <string>\nusing namespace std;\n\nstring solve(string input) {\n    reverse(input.begin(), input.end());\n    return input;\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n\nvoid solve(char* input, char* output) {\n    int n = strlen(input);\n    for (int i = 0; i < n; i++) {\n        output[i] = input[n-1-i];\n    }\n    output[n] = '\\0';\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'Palindrome Check',
    description: 'Given a string s, return true if it is a palindrome, or false otherwise.\n\nA phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
    difficulty: 'easy',
    tags: ['strings', 'two-pointers'],
    category: 'DSA',
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
    starterCode: {
      javascript: `function isPalindrome(s) {\n    const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n    let left = 0, right = cleaned.length - 1;\n    while (left < right) {\n        if (cleaned[left] !== cleaned[right]) return false;\n        left++;\n        right--;\n    }\n    return true;\n}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', (line) => {\n    console.log(isPalindrome(line));\n    rl.close();\n});`,
      python: `def is_palindrome(s):\n    cleaned = ''.join(c.lower() for c in s if c.isalnum())\n    return cleaned == cleaned[::-1]\n\nif __name__ == "__main__":\n    s = input().strip()\n    print(str(is_palindrome(s)).lower())`,
      java: `public class Solution {\n    public static String solve(String input) {\n        String cleaned = input.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();\n        int left = 0, right = cleaned.length() - 1;\n        while (left < right) {\n            if (cleaned.charAt(left) != cleaned.charAt(right)) return "false";\n            left++;\n            right--;\n        }\n        return "true";\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(solve(sc.nextLine()));\n        sc.close();\n    }\n}`,
      cpp: `#include <iostream>\n#include <string>\n#include <algorithm>\n#include <cctype>\nusing namespace std;\n\nstring solve(string input) {\n    string cleaned;\n    for (char c : input) {\n        if (isalnum(c)) cleaned += tolower(c);\n    }\n    int left = 0, right = cleaned.length() - 1;\n    while (left < right) {\n        if (cleaned[left] != cleaned[right]) return "false";\n        left++;\n        right--;\n    }\n    return "true";\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n#include <ctype.h>\n\nvoid solve(char* input, char* output) {\n    char cleaned[10000];\n    int j = 0;\n    for (int i = 0; input[i]; i++) {\n        if (isalnum(input[i])) cleaned[j++] = tolower(input[i]);\n    }\n    cleaned[j] = '\\0';\n    int left = 0, right = j - 1;\n    while (left < right) {\n        if (cleaned[left] != cleaned[right]) {\n            strcpy(output, "false");\n            return;\n        }\n        left++;\n        right--;\n    }\n    strcpy(output, "true");\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    difficulty: 'easy',
    tags: ['strings', 'stack'],
    category: 'DSA',
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
    starterCode: {
      javascript: `function isValid(s) {\n    const stack = [];\n    const map = { ')': '(', '}': '{', ']': '[' };\n    for (const c of s) {\n        if (!map[c]) {\n            stack.push(c);\n        } else if (stack.pop() !== map[c]) {\n            return false;\n        }\n    }\n    return stack.length === 0;\n}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', (line) => {\n    console.log(isValid(line));\n    rl.close();\n});`,
      python: `def is_valid(s):\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    for c in s:\n        if c in mapping:\n            if not stack or stack.pop() != mapping[c]:\n                return False\n        else:\n            stack.append(c)\n    return not stack\n\nif __name__ == "__main__":\n    s = input().strip()\n    print(str(is_valid(s)).lower())`,
      java: `import java.util.*;\n\npublic class Solution {\n    public static String solve(String input) {\n        Stack<Character> stack = new Stack<>();\n        Map<Character, Character> map = new HashMap<>();\n        map.put(')', '(');\n        map.put('}', '{');\n        map.put(']', '[');\n        for (char c : input.toCharArray()) {\n            if (map.containsKey(c)) {\n                if (stack.isEmpty() || stack.pop() != map.get(c)) return "false";\n            } else {\n                stack.push(c);\n            }\n        }\n        return stack.isEmpty() ? "true" : "false";\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(solve(sc.nextLine()));\n        sc.close();\n    }\n}`,
      cpp: `#include <iostream>\n#include <stack>\n#include <unordered_map>\n#include <string>\nusing namespace std;\n\nstring solve(string input) {\n    stack<char> st;\n    unordered_map<char, char> map = {{')', '('}, {'}', '{'}, {']', '['}};\n    for (char c : input) {\n        if (map.count(c)) {\n            if (st.empty() || st.top() != map[c]) return "false";\n            st.pop();\n        } else {\n            st.push(c);\n        }\n    }\n    return st.empty() ? "true" : "false";\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n\nvoid solve(char* input, char* output) {\n    char stack[10000];\n    int top = -1;\n    for (int i = 0; input[i]; i++) {\n        char c = input[i];\n        if (c == '(' || c == '{' || c == '[') {\n            stack[++top] = c;\n        } else {\n            if (top == -1) { strcpy(output, "false"); return; }\n            char expected;\n            if (c == ')') expected = '(';\n            else if (c == '}') expected = '{';\n            else expected = '[';\n            if (stack[top--] != expected) { strcpy(output, "false"); return; }\n        }\n    }\n    strcpy(output, top == -1 ? "true" : "false");\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'Maximum Subarray',
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    difficulty: 'medium',
    tags: ['arrays', 'dynamic-programming'],
    category: 'DSA',
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
    starterCode: {
      javascript: `function maxSubArray(nums) {\n    let maxSum = nums[0], currentSum = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        currentSum = Math.max(nums[i], currentSum + nums[i]);\n        maxSum = Math.max(maxSum, currentSum);\n    }\n    return maxSum;\n}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', (line) => {\n    const nums = line.split(' ').map(Number);\n    console.log(maxSubArray(nums));\n    rl.close();\n});`,
      python: `def max_sub_array(nums):\n    max_sum = current_sum = nums[0]\n    for num in nums[1:]:\n        current_sum = max(num, current_sum + num)\n        max_sum = max(max_sum, current_sum)\n    return max_sum\n\nif __name__ == "__main__":\n    nums = list(map(int, input().split()))\n    print(max_sub_array(nums))`,
      java: `public class Solution {\n    public static String solve(String input) {\n        String[] parts = input.split(" ");\n        int[] nums = new int[parts.length];\n        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);\n        int maxSum = nums[0], currentSum = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            currentSum = Math.max(nums[i], currentSum + nums[i]);\n            maxSum = Math.max(maxSum, currentSum);\n        }\n        return String.valueOf(maxSum);\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(solve(sc.nextLine()));\n        sc.close();\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <sstream>\n#include <algorithm>\nusing namespace std;\n\nstring solve(string input) {\n    stringstream ss(input);\n    vector<int> nums;\n    int num;\n    while (ss >> num) nums.push_back(num);\n    int maxSum = nums[0], currentSum = nums[0];\n    for (int i = 1; i < nums.size(); i++) {\n        currentSum = max(nums[i], currentSum + nums[i]);\n        maxSum = max(maxSum, currentSum);\n    }\n    return to_string(maxSum);\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\n\nvoid solve(char* input, char* output) {\n    int nums[10000], n = 0;\n    char* token = strtok(input, " ");\n    while (token) { nums[n++] = atoi(token); token = strtok(NULL, " "); }\n    int maxSum = nums[0], currentSum = nums[0];\n    for (int i = 1; i < n; i++) {\n        currentSum = nums[i] > currentSum + nums[i] ? nums[i] : currentSum + nums[i];\n        maxSum = maxSum > currentSum ? maxSum : currentSum;\n    }\n    sprintf(output, "%d", maxSum);\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'Product of Array Except Self',
    description: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].\n\nThe product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.\n\nYou must write an algorithm that runs in O(n) time and without using the division operation.',
    difficulty: 'medium',
    tags: ['arrays', 'prefix-sum'],
    category: 'DSA',
    constraints: '2 <= nums.length <= 10^5\n-30 <= nums[i] <= 30\nThe product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.',
    examples: [
      { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' },
      { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]' },
    ],
    testCases: [
      { input: '1 2 3 4', expectedOutput: '24 12 8 6', isSample: true },
      { input: '-1 1 0 -3 3', expectedOutput: '0 0 9 0 0', isSample: true },
    ],
    starterCode: {
      javascript: `function productExceptSelf(nums) {\n    const n = nums.length;\n    const result = new Array(n).fill(1);\n    let prefix = 1;\n    for (let i = 0; i < n; i++) {\n        result[i] = prefix;\n        prefix *= nums[i];\n    }\n    let suffix = 1;\n    for (let i = n - 1; i >= 0; i--) {\n        result[i] *= suffix;\n        suffix *= nums[i];\n    }\n    return result;\n}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', (line) => {\n    const nums = line.split(' ').map(Number);\n    console.log(productExceptSelf(nums).join(' '));\n    rl.close();\n});`,
      python: `def product_except_self(nums):\n    n = len(nums)\n    result = [1] * n\n    prefix = 1\n    for i in range(n):\n        result[i] = prefix\n        prefix *= nums[i]\n    suffix = 1\n    for i in range(n-1, -1, -1):\n        result[i] *= suffix\n        suffix *= nums[i]\n    return result\n\nif __name__ == "__main__":\n    nums = list(map(int, input().split()))\n    print(' '.join(map(str, product_except_self(nums))))`,
      java: `public class Solution {\n    public static String solve(String input) {\n        String[] parts = input.split(" ");\n        int n = parts.length;\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = Integer.parseInt(parts[i]);\n        int[] result = new int[n];\n        java.util.Arrays.fill(result, 1);\n        int prefix = 1;\n        for (int i = 0; i < n; i++) { result[i] = prefix; prefix *= nums[i]; }\n        int suffix = 1;\n        for (int i = n-1; i >= 0; i--) { result[i] *= suffix; suffix *= nums[i]; }\n        StringBuilder sb = new StringBuilder();\n        for (int v : result) sb.append(v).append(" ");\n        return sb.toString().trim();\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(solve(sc.nextLine()));\n        sc.close();\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\nstring solve(string input) {\n    stringstream ss(input);\n    vector<int> nums;\n    int num;\n    while (ss >> num) nums.push_back(num);\n    int n = nums.size();\n    vector<int> result(n, 1);\n    int prefix = 1;\n    for (int i = 0; i < n; i++) { result[i] = prefix; prefix *= nums[i]; }\n    int suffix = 1;\n    for (int i = n-1; i >= 0; i--) { result[i] *= suffix; suffix *= nums[i]; }\n    stringstream out;\n    for (int v : result) out << v << " ";\n    string res = out.str();\n    if (!res.empty()) res.pop_back();\n    return res;\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\n\nvoid solve(char* input, char* output) {\n    int nums[10000], n = 0;\n    char* token = strtok(input, " ");\n    while (token) { nums[n++] = atoi(token); token = strtok(NULL, " "); }\n    int result[10000];\n    for (int i = 0; i < n; i++) result[i] = 1;\n    int prefix = 1;\n    for (int i = 0; i < n; i++) { result[i] = prefix; prefix *= nums[i]; }\n    int suffix = 1;\n    for (int i = n-1; i >= 0; i--) { result[i] *= suffix; suffix *= nums[i]; }\n    char temp[100];\n    output[0] = '\\0';\n    for (int i = 0; i < n; i++) {\n        sprintf(temp, "%d ", result[i]);\n        strcat(output, temp);\n    }\n    int len = strlen(output);\n    if (len > 0) output[len-1] = '\\0';\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    difficulty: 'medium',
    tags: ['strings', 'sliding-window', 'hash-map'],
    category: 'DSA',
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
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {\n    const map = new Map();\n    let maxLen = 0, left = 0;\n    for (let right = 0; right < s.length; right++) {\n        if (map.has(s[right])) {\n            left = Math.max(left, map.get(s[right]) + 1);\n        }\n        map.set(s[right], right);\n        maxLen = Math.max(maxLen, right - left + 1);\n    }\n    return maxLen;\n}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', (line) => {\n    console.log(lengthOfLongestSubstring(line));\n    rl.close();\n});`,
      python: `def length_of_longest_substring(s):\n    char_map = {}\n    max_len = left = 0\n    for right, c in enumerate(s):\n        if c in char_map:\n            left = max(left, char_map[c] + 1)\n        char_map[c] = right\n        max_len = max(max_len, right - left + 1)\n    return max_len\n\nif __name__ == "__main__":\n    s = input().strip()\n    print(length_of_longest_substring(s))`,
      java: `import java.util.*;\n\npublic class Solution {\n    public static String solve(String input) {\n        Map<Character, Integer> map = new HashMap<>();\n        int maxLen = 0, left = 0;\n        for (int right = 0; right < input.length(); right++) {\n            char c = input.charAt(right);\n            if (map.containsKey(c)) {\n                left = Math.max(left, map.get(c) + 1);\n            }\n            map.put(c, right);\n            maxLen = Math.max(maxLen, right - left + 1);\n        }\n        return String.valueOf(maxLen);\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(solve(sc.nextLine()));\n        sc.close();\n    }\n}`,
      cpp: `#include <iostream>\n#include <string>\n#include <unordered_map>\n#include <algorithm>\nusing namespace std;\n\nstring solve(string input) {\n    unordered_map<char, int> map;\n    int maxLen = 0, left = 0;\n    for (int right = 0; right < input.length(); right++) {\n        if (map.count(input[right])) {\n            left = max(left, map[input[right]] + 1);\n        }\n        map[input[right]] = right;\n        maxLen = max(maxLen, right - left + 1);\n    }\n    return to_string(maxLen);\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n\nvoid solve(char* input, char* output) {\n    int lastSeen[256];\n    for (int i = 0; i < 256; i++) lastSeen[i] = -1;\n    int maxLen = 0, left = 0;\n    for (int right = 0; input[right]; right++) {\n        if (lastSeen[(unsigned char)input[right]] >= left) {\n            left = lastSeen[(unsigned char)input[right]] + 1;\n        }\n        lastSeen[(unsigned char)input[right]] = right;\n        int len = right - left + 1;\n        if (len > maxLen) maxLen = len;\n    }\n    sprintf(output, "%d", maxLen);\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'Binary Search',
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.',
    difficulty: 'easy',
    tags: ['arrays', 'binary-search'],
    category: 'DSA',
    constraints: '1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll the integers in nums are unique.\nnums is sorted in ascending order.',
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists in nums and its index is 4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 does not exist in nums so return -1' },
    ],
    testCases: [
      { input: '-1 0 3 5 9 12\n9', expectedOutput: '4', isSample: true },
      { input: '-1 0 3 5 9 12\n2', expectedOutput: '-1', isSample: true },
    ],
    starterCode: {
      javascript: `function binarySearch(nums, target) {\n    let left = 0, right = nums.length - 1;\n    while (left <= right) {\n        const mid = Math.floor((left + right) / 2);\n        if (nums[mid] === target) return mid;\n        if (nums[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nlet lines = [];\nrl.on('line', (line) => lines.push(line));\nrl.on('close', () => {\n    const nums = lines[0].split(' ').map(Number);\n    const target = parseInt(lines[1]);\n    console.log(binarySearch(nums, target));\n});`,
      python: `def binary_search(nums, target):\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n\nif __name__ == "__main__":\n    nums = list(map(int, input().split()))\n    target = int(input())\n    print(binary_search(nums, target))`,
      java: `public class Solution {\n    public static String solve(String input) {\n        String[] lines = input.split("\\n");\n        String[] parts = lines[0].split(" ");\n        int[] nums = new int[parts.length];\n        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);\n        int target = Integer.parseInt(lines[1]);\n        int left = 0, right = nums.length - 1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (nums[mid] == target) return String.valueOf(mid);\n            if (nums[mid] < target) left = mid + 1;\n            else right = mid - 1;\n        }\n        return "-1";\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        StringBuilder sb = new StringBuilder();\n        while (sc.hasNextLine()) sb.append(sc.nextLine()).append("\\n");\n        sc.close();\n        System.out.println(solve(sb.toString().trim()));\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\nstring solve(string input) {\n    stringstream ss(input);\n    vector<int> nums;\n    int num;\n    while (ss >> num) nums.push_back(num);\n    int target = nums.back();\n    nums.pop_back();\n    int left = 0, right = nums.size() - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (nums[mid] == target) return to_string(mid);\n        if (nums[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return "-1";\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    string line2;\n    getline(cin, line2);\n    input += "\\n" + line2;\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\n\nvoid solve(char* input, char* output) {\n    int nums[10000], n = 0, target;\n    char* token = strtok(input, " \\n");\n    while (token) {\n        nums[n++] = atoi(token);\n        token = strtok(NULL, " \\n");\n    }\n    target = nums[n-1];\n    n--;\n    int left = 0, right = n - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (nums[mid] == target) { sprintf(output, "%d", mid); return; }\n        if (nums[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    strcpy(output, "-1");\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    char line2[10000];\n    fgets(line2, 10000, stdin);\n    strcat(input, line2);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'Container With Most Water',
    description: 'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.',
    difficulty: 'medium',
    tags: ['arrays', 'two-pointers', 'greedy'],
    category: 'DSA',
    constraints: 'n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4',
    examples: [
      { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49' },
      { input: 'height = [1,1]', output: '1' },
    ],
    testCases: [
      { input: '1 8 6 2 5 4 8 3 7', expectedOutput: '49', isSample: true },
      { input: '1 1', expectedOutput: '1', isSample: true },
    ],
    starterCode: {
      javascript: `function maxArea(height) {\n    let left = 0, right = height.length - 1;\n    let maxWater = 0;\n    while (left < right) {\n        const width = right - left;\n        const h = Math.min(height[left], height[right]);\n        maxWater = Math.max(maxWater, width * h);\n        if (height[left] < height[right]) left++;\n        else right--;\n    }\n    return maxWater;\n}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', (line) => {\n    const height = line.split(' ').map(Number);\n    console.log(maxArea(height));\n    rl.close();\n});`,
      python: `def max_area(height):\n    left, right = 0, len(height) - 1\n    max_water = 0\n    while left < right:\n        width = right - left\n        h = min(height[left], height[right])\n        max_water = max(max_water, width * h)\n        if height[left] < height[right]:\n            left += 1\n        else:\n            right -= 1\n    return max_water\n\nif __name__ == "__main__":\n    height = list(map(int, input().split()))\n    print(max_area(height))`,
      java: `public class Solution {\n    public static String solve(String input) {\n        String[] parts = input.split(" ");\n        int[] height = new int[parts.length];\n        for (int i = 0; i < parts.length; i++) height[i] = Integer.parseInt(parts[i]);\n        int left = 0, right = height.length - 1, maxWater = 0;\n        while (left < right) {\n            int width = right - left;\n            int h = Math.min(height[left], height[right]);\n            maxWater = Math.max(maxWater, width * h);\n            if (height[left] < height[right]) left++;\n            else right--;\n        }\n        return String.valueOf(maxWater);\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(solve(sc.nextLine()));\n        sc.close();\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <sstream>\n#include <algorithm>\nusing namespace std;\n\nstring solve(string input) {\n    stringstream ss(input);\n    vector<int> height;\n    int h;\n    while (ss >> h) height.push_back(h);\n    int left = 0, right = height.size() - 1, maxWater = 0;\n    while (left < right) {\n        int width = right - left;\n        int minH = min(height[left], height[right]);\n        maxWater = max(maxWater, width * minH);\n        if (height[left] < height[right]) left++;\n        else right--;\n    }\n    return to_string(maxWater);\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\n\nvoid solve(char* input, char* output) {\n    int height[10000], n = 0;\n    char* token = strtok(input, " ");\n    while (token) { height[n++] = atoi(token); token = strtok(NULL, " "); }\n    int left = 0, right = n - 1, maxWater = 0;\n    while (left < right) {\n        int width = right - left;\n        int minH = height[left] < height[right] ? height[left] : height[right];\n        int area = width * minH;\n        if (area > maxWater) maxWater = area;\n        if (height[left] < height[right]) left++;\n        else right--;\n    }\n    sprintf(output, "%d", maxWater);\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'Climbing Stairs',
    description: 'You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    difficulty: 'easy',
    tags: ['dynamic-programming', 'math'],
    category: 'DSA',
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
    starterCode: {
      javascript: `function climbStairs(n) {\n    if (n <= 2) return n;\n    let a = 1, b = 2;\n    for (let i = 3; i <= n; i++) {\n        const c = a + b;\n        a = b;\n        b = c;\n    }\n    return b;\n}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', (line) => {\n    console.log(climbStairs(parseInt(line)));\n    rl.close();\n});`,
      python: `def climb_stairs(n):\n    if n <= 2:\n        return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b\n\nif __name__ == "__main__":\n    n = int(input().strip())\n    print(climb_stairs(n))`,
      java: `public class Solution {\n    public static String solve(String input) {\n        int n = Integer.parseInt(input.trim());\n        if (n <= 2) return String.valueOf(n);\n        int a = 1, b = 2;\n        for (int i = 3; i <= n; i++) {\n            int c = a + b;\n            a = b;\n            b = c;\n        }\n        return String.valueOf(b);\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(solve(sc.nextLine()));\n        sc.close();\n    }\n}`,
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\n\nstring solve(string input) {\n    int n = stoi(input);\n    if (n <= 2) return to_string(n);\n    int a = 1, b = 2;\n    for (int i = 3; i <= n; i++) {\n        int c = a + b;\n        a = b;\n        b = c;\n    }\n    return to_string(b);\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\n\nvoid solve(char* input, char* output) {\n    int n = atoi(input);\n    if (n <= 2) { sprintf(output, "%d", n); return; }\n    int a = 1, b = 2;\n    for (int i = 3; i <= n; i++) {\n        int c = a + b;\n        a = b;\n        b = c;\n    }\n    sprintf(output, "%d", b);\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'Number of Islands',
    description: 'Given an m x n 2D binary grid grid which represents a map of \'1\'s (land) and \'0\'s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are surrounded by water.',
    difficulty: 'medium',
    tags: ['matrix', 'dfs', 'bfs'],
    category: 'DSA',
    constraints: 'm == grid.length\nn == grid[i].length\n1 <= m, n <= 300\ngrid[i][j] is \'0\' or \'1\'.',
    examples: [
      { input: 'grid = [\n  ["1","1","1","1","0"],\n  ["1","1","0","1","0"],\n  ["1","1","0","0","0"],\n  ["0","0","0","0","0"]\n]', output: '1' },
      { input: 'grid = [\n  ["1","1","0","0","0"],\n  ["1","1","0","0","0"],\n  ["0","0","1","0","0"],\n  ["0","0","0","1","1"]\n]', output: '3' },
    ],
    testCases: [
      { input: '11110\n11010\n11000\n00000', expectedOutput: '1', isSample: true },
      { input: '11000\n11000\n00100\n00011', expectedOutput: '3', isSample: true },
    ],
    starterCode: {
      javascript: `function numIslands(grid) {\n    if (!grid || grid.length === 0) return 0;\n    let count = 0;\n    const rows = grid.length, cols = grid[0].length;\n    function dfs(r, c) {\n        if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') return;\n        grid[r][c] = '0';\n        dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);\n    }\n    for (let r = 0; r < rows; r++) {\n        for (let c = 0; c < cols; c++) {\n            if (grid[r][c] === '1') { count++; dfs(r, c); }\n        }\n    }\n    return count;\n}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nlet grid = [];\nrl.on('line', (line) => { if (line.trim()) grid.push(line.trim().split('')); });\nrl.on('close', () => console.log(numIslands(grid)));`,
      python: `def num_islands(grid):\n    if not grid:\n        return 0\n    rows, cols = len(grid), len(grid[0])\n    count = 0\n    def dfs(r, c):\n        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] == '0':\n            return\n        grid[r][c] = '0'\n        dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == '1':\n                count += 1\n                dfs(r, c)\n    return count\n\nif __name__ == "__main__":\n    import sys\n    grid = [list(line.strip()) for line in sys.stdin if line.strip()]\n    print(num_islands(grid))`,
      java: `import java.util.*;\n\npublic class Solution {\n    public static String solve(String input) {\n        String[] lines = input.split("\\n");\n        int rows = lines.length, cols = lines[0].length();\n        char[][] grid = new char[rows][cols];\n        for (int i = 0; i < rows; i++) grid[i] = lines[i].toCharArray();\n        int count = 0;\n        for (int r = 0; r < rows; r++) {\n            for (int c = 0; c < cols; c++) {\n                if (grid[r][c] == '1') { count++; dfs(grid, r, c, rows, cols); }\n            }\n        }\n        return String.valueOf(count);\n    }\n    static void dfs(char[][] grid, int r, int c, int rows, int cols) {\n        if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] == '0') return;\n        grid[r][c] = '0';\n        dfs(grid, r+1, c, rows, cols);\n        dfs(grid, r-1, c, rows, cols);\n        dfs(grid, r, c+1, rows, cols);\n        dfs(grid, r, c-1, rows, cols);\n    }\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        StringBuilder sb = new StringBuilder();\n        while (sc.hasNextLine()) sb.append(sc.nextLine()).append("\\n");\n        sc.close();\n        System.out.println(solve(sb.toString().trim()));\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <string>\n#include <sstream>\nusing namespace std;\n\nvoid dfs(vector<vector<char>>& grid, int r, int c, int rows, int cols) {\n    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] == '0') return;\n    grid[r][c] = '0';\n    dfs(grid, r+1, c, rows, cols);\n    dfs(grid, r-1, c, rows, cols);\n    dfs(grid, r, c+1, rows, cols);\n    dfs(grid, r, c-1, rows, cols);\n}\n\nstring solve(string input) {\n    stringstream ss(input);\n    vector<vector<char>> grid;\n    string line;\n    while (ss >> line) {\n        grid.push_back(vector<char>(line.begin(), line.end()));\n    }\n    int rows = grid.size(), cols = grid[0].size(), count = 0;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (grid[r][c] == '1') { count++; dfs(grid, r, c, rows, cols); }\n        }\n    }\n    return to_string(count);\n}\n\nint main() {\n    string input, line;\n    while (getline(cin, line)) input += line + "\\n";\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n\nchar grid[300][300];\nint rows, cols;\n\nvoid dfs(int r, int c) {\n    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] == '0') return;\n    grid[r][c] = '0';\n    dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);\n}\n\nvoid solve(char* input, char* output) {\n    rows = 0;\n    char* line = strtok(input, "\\n");\n    while (line) {\n        strcpy(grid[rows], line);\n        rows++;\n        line = strtok(NULL, "\\n");\n    }\n    cols = strlen(grid[0]);\n    int count = 0;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (grid[r][c] == '1') { count++; dfs(r, c); }\n        }\n    }\n    sprintf(output, "%d", count);\n}\n\nint main() {\n    char input[100000];\n    char output[10000];\n    char line[10000];\n    input[0] = '\\0';\n    while (fgets(line, 10000, stdin) && line[0] != '\\n') {\n        line[strcspn(line, "\\n")] = 0;\n        if (strlen(line) > 0) {\n            strcat(input, line);\n            strcat(input, "\\n");\n        }\n    }\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'Trapping Rain Water',
    description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    difficulty: 'hard',
    tags: ['arrays', 'two-pointers', 'stack'],
    category: 'DSA',
    constraints: 'n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5',
    examples: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: 'The above elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.' },
      { input: 'height = [4,2,0,3,2,5]', output: '9' },
    ],
    testCases: [
      { input: '0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6', isSample: true },
      { input: '4 2 0 3 2 5', expectedOutput: '9', isSample: true },
    ],
    starterCode: {
      javascript: `function trap(height) {\n    let left = 0, right = height.length - 1;\n    let leftMax = 0, rightMax = 0, water = 0;\n    while (left < right) {\n        if (height[left] < height[right]) {\n            if (height[left] >= leftMax) leftMax = height[left];\n            else water += leftMax - height[left];\n            left++;\n        } else {\n            if (height[right] >= rightMax) rightMax = height[right];\n            else water += rightMax - height[right];\n            right--;\n        }\n    }\n    return water;\n}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', (line) => {\n    const height = line.split(' ').map(Number);\n    console.log(trap(height));\n    rl.close();\n});`,
      python: `def trap(height):\n    left, right = 0, len(height) - 1\n    left_max = right_max = water = 0\n    while left < right:\n        if height[left] < height[right]:\n            if height[left] >= left_max:\n                left_max = height[left]\n            else:\n                water += left_max - height[left]\n            left += 1\n        else:\n            if height[right] >= right_max:\n                right_max = height[right]\n            else:\n                water += right_max - height[right]\n            right -= 1\n    return water\n\nif __name__ == "__main__":\n    height = list(map(int, input().split()))\n    print(trap(height))`,
      java: `public class Solution {\n    public static String solve(String input) {\n        String[] parts = input.split(" ");\n        int[] height = new int[parts.length];\n        for (int i = 0; i < parts.length; i++) height[i] = Integer.parseInt(parts[i]);\n        int left = 0, right = height.length - 1, leftMax = 0, rightMax = 0, water = 0;\n        while (left < right) {\n            if (height[left] < height[right]) {\n                if (height[left] >= leftMax) leftMax = height[left];\n                else water += leftMax - height[left];\n                left++;\n            } else {\n                if (height[right] >= rightMax) rightMax = height[right];\n                else water += rightMax - height[right];\n                right--;\n            }\n        }\n        return String.valueOf(water);\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(solve(sc.nextLine()));\n        sc.close();\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <sstream>\n#include <algorithm>\nusing namespace std;\n\nstring solve(string input) {\n    stringstream ss(input);\n    vector<int> height;\n    int h;\n    while (ss >> h) height.push_back(h);\n    int left = 0, right = height.size() - 1, leftMax = 0, rightMax = 0, water = 0;\n    while (left < right) {\n        if (height[left] < height[right]) {\n            if (height[left] >= leftMax) leftMax = height[left];\n            else water += leftMax - height[left];\n            left++;\n        } else {\n            if (height[right] >= rightMax) rightMax = height[right];\n            else water += rightMax - height[right];\n            right--;\n        }\n    }\n    return to_string(water);\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\n\nvoid solve(char* input, char* output) {\n    int height[10000], n = 0;\n    char* token = strtok(input, " ");\n    while (token) { height[n++] = atoi(token); token = strtok(NULL, " "); }\n    int left = 0, right = n - 1, leftMax = 0, rightMax = 0, water = 0;\n    while (left < right) {\n        if (height[left] < height[right]) {\n            if (height[left] >= leftMax) leftMax = height[left];\n            else water += leftMax - height[left];\n            left++;\n        } else {\n            if (height[right] >= rightMax) rightMax = height[right];\n            else water += rightMax - height[right];\n            right--;\n        }\n    }\n    sprintf(output, "%d", water);\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'Merge K Sorted Lists',
    description: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.',
    difficulty: 'hard',
    tags: ['linked-list', 'divide-and-conquer', 'heap'],
    category: 'DSA',
    constraints: 'k == lists.length\n0 <= k <= 10^4\n0 <= lists[i].length <= 500\n-10^4 <= lists[i][j] <= 10^4',
    examples: [
      { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' },
      { input: 'lists = []', output: '[]' },
    ],
    testCases: [
      { input: '1 4 5 1 3 4 2 6', expectedOutput: '1 1 2 3 4 4 5 6', isSample: true },
    ],
    starterCode: {
      javascript: `function mergeKLists(lists) {\n    const flat = lists.reduce((acc, list) => acc.concat(list), []);\n    return flat.sort((a, b) => a - b);\n}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', (line) => {\n    const nums = line.split(' ').map(Number);\n    console.log(nums.sort((a, b) => a - b).join(' '));\n    rl.close();\n});`,
      python: `def merge_k_lists(lists):\n    flat = [num for sublist in lists for num in sublist]\n    return sorted(flat)\n\nif __name__ == "__main__":\n    nums = list(map(int, input().split()))\n    print(' '.join(map(str, sorted(nums))))`,
      java: `import java.util.*;\n\npublic class Solution {\n    public static String solve(String input) {\n        String[] parts = input.split(" ");\n        List<Integer> nums = new ArrayList<>();\n        for (String p : parts) nums.add(Integer.parseInt(p));\n        Collections.sort(nums);\n        StringBuilder sb = new StringBuilder();\n        for (int n : nums) sb.append(n).append(" ");\n        return sb.toString().trim();\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(solve(sc.nextLine()));\n        sc.close();\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <sstream>\n#include <algorithm>\nusing namespace std;\n\nstring solve(string input) {\n    stringstream ss(input);\n    vector<int> nums;\n    int num;\n    while (ss >> num) nums.push_back(num);\n    sort(nums.begin(), nums.end());\n    stringstream out;\n    for (int n : nums) out << n << " ";\n    string res = out.str();\n    if (!res.empty()) res.pop_back();\n    return res;\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\n\nint cmp(const void* a, const void* b) { return *(int*)a - *(int*)b; }\n\nvoid solve(char* input, char* output) {\n    int nums[10000], n = 0;\n    char* token = strtok(input, " ");\n    while (token) { nums[n++] = atoi(token); token = strtok(NULL, " "); }\n    qsort(nums, n, sizeof(int), cmp);\n    char temp[100];\n    output[0] = '\\0';\n    for (int i = 0; i < n; i++) { sprintf(temp, "%d ", nums[i]); strcat(output, temp); }\n    int len = strlen(output);\n    if (len > 0) output[len-1] = '\\0';\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'Find Median from Data Stream',
    description: 'The median is the middle value in an ordered integer list. If the size of the list is even, there is no middle value, and the median is the mean of the two middle values.\n\nImplement the MedianFinder class:\n- MedianFinder() initializes the MedianFinder object.\n- void addNum(int num) adds the integer num from the data stream to the data structure.\n- double findMedian() returns the median of all elements so far.',
    difficulty: 'hard',
    tags: ['heap', 'design'],
    category: 'DSA',
    constraints: '-10^5 <= num <= 10^5\nAt most 5 * 10^4 calls will be made to addNum and findMedian.',
    examples: [
      { input: 'MedianFinder mf = new MedianFinder();\nmf.addNum(1);\nmf.addNum(2);\nmf.findMedian();\nmf.addNum(3);\nmf.findMedian();', output: '1.5\n2.0' },
    ],
    testCases: [
      { input: '1 2 3 4 5', expectedOutput: '3', isSample: true },
    ],
    starterCode: {
      javascript: `function findMedian(nums) {\n    nums.sort((a, b) => a - b);\n    const n = nums.length;\n    if (n % 2 === 0) return (nums[n/2 - 1] + nums[n/2]) / 2;\n    return nums[Math.floor(n/2)];\n}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', (line) => {\n    const nums = line.split(' ').map(Number);\n    console.log(findMedian(nums));\n    rl.close();\n});`,
      python: `def find_median(nums):\n    nums.sort()\n    n = len(nums)\n    if n % 2 == 0:\n        return (nums[n//2 - 1] + nums[n//2]) / 2\n    return float(nums[n//2])\n\nif __name__ == "__main__":\n    nums = list(map(int, input().split()))\n    print(find_median(nums))`,
      java: `import java.util.*;\n\npublic class Solution {\n    public static String solve(String input) {\n        String[] parts = input.split(" ");\n        List<Integer> nums = new ArrayList<>();\n        for (String p : parts) nums.add(Integer.parseInt(p));\n        Collections.sort(nums);\n        int n = nums.size();\n        if (n % 2 == 0) {\n            double median = (nums.get(n/2 - 1) + nums.get(n/2)) / 2.0;\n            if (median == (int)median) return String.valueOf((int)median);\n            return String.valueOf(median);\n        }\n        return String.valueOf(nums.get(n/2));\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(solve(sc.nextLine()));\n        sc.close();\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <sstream>\n#include <algorithm>\nusing namespace std;\n\nstring solve(string input) {\n    stringstream ss(input);\n    vector<int> nums;\n    int num;\n    while (ss >> num) nums.push_back(num);\n    sort(nums.begin(), nums.end());\n    int n = nums.size();\n    if (n % 2 == 0) {\n        double median = (nums[n/2 - 1] + nums[n/2]) / 2.0;\n        if (median == (int)median) return to_string((int)median);\n        return to_string(median);\n    }\n    return to_string(nums[n/2]);\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\n\nint cmp(const void* a, const void* b) { return *(int*)a - *(int*)b; }\n\nvoid solve(char* input, char* output) {\n    int nums[10000], n = 0;\n    char* token = strtok(input, " ");\n    while (token) { nums[n++] = atoi(token); token = strtok(NULL, " "); }\n    qsort(nums, n, sizeof(int), cmp);\n    if (n % 2 == 0) {\n        double median = (nums[n/2 - 1] + nums[n/2]) / 2.0;\n        if (median == (int)median) sprintf(output, "%d", (int)median);\n        else sprintf(output, "%.1f", median);\n    } else {\n        sprintf(output, "%d", nums[n/2]);\n    }\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'LRU Cache',
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.\n- int get(int key) Return the value of the key if the key exists, otherwise return -1.\n- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.\n\nThe functions get and put must each run in O(1) average time complexity.',
    difficulty: 'medium',
    tags: ['hash-map', 'linked-list', 'design'],
    category: 'DSA',
    constraints: '1 <= capacity <= 3000\n0 <= key <= 10^4\n0 <= value <= 10^5\nAt most 2 * 10^5 calls will be made to get and put.',
    examples: [
      { input: 'LRUCache lru = new LRUCache(2);\nlru.put(1, 1);\nlru.put(2, 2);\nlru.get(1);\nlru.put(3, 3);\nlru.get(2);', output: '1\n-1' },
    ],
    testCases: [
      { input: '2 1 1 2 2 1 3 3 2', expectedOutput: '1 -1', isSample: true },
    ],
    starterCode: {
      javascript: `class LRUCache {\n    constructor(capacity) {\n        this.capacity = capacity;\n        this.cache = new Map();\n    }\n    get(key) {\n        if (!this.cache.has(key)) return -1;\n        const value = this.cache.get(key);\n        this.cache.delete(key);\n        this.cache.set(key, value);\n        return value;\n    }\n    put(key, value) {\n        if (this.cache.has(key)) this.cache.delete(key);\n        else if (this.cache.size >= this.capacity) {\n            const firstKey = this.cache.keys().next().value;\n            this.cache.delete(firstKey);\n        }\n        this.cache.set(key, value);\n    }\n}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', (line) => {\n    const parts = line.split(' ').map(Number);\n    const cap = parts[0];\n    const cache = new LRUCache(cap);\n    const results = [];\n    for (let i = 1; i < parts.length; i += 2) {\n        if (parts[i+1] === undefined) {\n            results.push(cache.get(parts[i]));\n            i--;\n        } else {\n            cache.put(parts[i], parts[i+1]);\n        }\n    }\n    console.log(results.join(' '));\n    rl.close();\n});`,
      python: `class LRUCache:\n    def __init__(self, capacity):\n        self.capacity = capacity\n        self.cache = {}\n        self.order = []\n    def get(self, key):\n        if key not in self.cache:\n            return -1\n        self.order.remove(key)\n        self.order.append(key)\n        return self.cache[key]\n    def put(self, key, value):\n        if key in self.cache:\n            self.order.remove(key)\n        elif len(self.cache) >= self.capacity:\n            oldest = self.order.pop(0)\n            del self.cache[oldest]\n        self.cache[key] = value\n        self.order.append(key)\n\nif __name__ == "__main__":\n    parts = list(map(int, input().split()))\n    cap = parts[0]\n    cache = LRUCache(cap)\n    results = []\n    i = 1\n    while i < len(parts):\n        if i + 1 < len(parts) and i % 2 == 1:\n            cache.put(parts[i], parts[i+1])\n            i += 2\n        else:\n            results.append(cache.get(parts[i]))\n            i += 1\n    print(' '.join(map(str, results)))`,
      java: `import java.util.*;\n\npublic class Solution {\n    public static String solve(String input) {\n        String[] parts = input.split(" ");\n        int cap = Integer.parseInt(parts[0]);\n        LinkedHashMap<Integer, Integer> cache = new LinkedHashMap<>(cap, 0.75f, true) {\n            protected boolean removeEldestEntry(Map.Entry eldest) {\n                return size() > cap;\n            }\n        };\n        StringBuilder sb = new StringBuilder();\n        for (int i = 1; i < parts.length; i += 2) {\n            int key = Integer.parseInt(parts[i]);\n            if (i + 1 < parts.length && i % 2 == 1) {\n                cache.put(key, Integer.parseInt(parts[i+1]));\n            } else {\n                sb.append(cache.getOrDefault(key, -1)).append(" ");\n                i--;\n            }\n        }\n        return sb.toString().trim();\n    }\n\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(solve(sc.nextLine()));\n        sc.close();\n    }\n}`,
      cpp: `#include <iostream>\n#include <unordered_map>\n#include <list>\n#include <sstream>\nusing namespace std;\n\nclass LRUCache {\n    int cap;\n    list<pair<int,int>> items;\n    unordered_map<int, list<pair<int,int>>::iterator> map;\npublic:\n    LRUCache(int capacity) : cap(capacity) {}\n    int get(int key) {\n        if (!map.count(key)) return -1;\n        items.splice(items.begin(), items, map[key]);\n        return map[key]->second;\n    }\n    void put(int key, int value) {\n        if (map.count(key)) {\n            items.splice(items.begin(), items, map[key]);\n            map[key]->second = value;\n        } else {\n            if (items.size() >= cap) {\n                map.erase(items.back().first);\n                items.pop_back();\n            }\n            items.push_front({key, value});\n            map[key] = items.begin();\n        }\n    }\n};\n\nstring solve(string input) {\n    stringstream ss(input);\n    int cap, key, val;\n    ss >> cap;\n    LRUCache cache(cap);\n    stringstream out;\n    while (ss >> key) {\n        if (ss >> val) cache.put(key, val);\n        else { out << cache.get(key) << " "; break; }\n    }\n    string res = out.str();\n    if (!res.empty()) res.pop_back();\n    return res;\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << solve(input) << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\n\ntypedef struct { int key, val; } Pair;\n\nvoid solve(char* input, char* output) {\n    int nums[10000], n = 0;\n    char* token = strtok(input, " ");\n    while (token) { nums[n++] = atoi(token); token = strtok(NULL, " "); }\n    int cap = nums[0];\n    Pair cache[10000];\n    int size = 0, order[10000], orderSize = 0;\n    char temp[100];\n    output[0] = '\\0';\n    for (int i = 1; i < n; i++) {\n        int key = nums[i];\n        if (i + 1 < n && i % 2 == 1) {\n            int val = nums[i+1];\n            int found = -1;\n            for (int j = 0; j < size; j++) if (cache[j].key == key) { found = j; break; }\n            if (found >= 0) {\n                cache[found].val = val;\n                int idx = -1;\n                for (int j = 0; j < orderSize; j++) if (order[j] == found) { idx = j; break; }\n                for (int j = idx; j < orderSize-1; j++) order[j] = order[j+1];\n                orderSize--;\n                order[orderSize++] = found;\n            } else {\n                if (size >= cap) {\n                    int evict = order[0];\n                    for (int j = 0; j < orderSize-1; j++) order[j] = order[j+1];\n                    orderSize--;\n                    cache[evict] = cache[size-1];\n                    size--;\n                    for (int j = 0; j < orderSize; j++) if (order[j] == size) order[j] = evict;\n                }\n                cache[size].key = key;\n                cache[size].val = val;\n                order[orderSize++] = size;\n                size++;\n            }\n            i++;\n        } else {\n            int found = -1;\n            for (int j = 0; j < size; j++) if (cache[j].key == key) { found = j; break; }\n            if (found >= 0) {\n                sprintf(temp, "%d ", cache[found].val);\n                strcat(output, temp);\n                int idx = -1;\n                for (int j = 0; j < orderSize; j++) if (order[j] == found) { idx = j; break; }\n                for (int j = idx; j < orderSize-1; j++) order[j] = order[j+1];\n                orderSize--;\n                order[orderSize++] = found;\n            } else {\n                strcat(output, "-1 ");\n            }\n        }\n    }\n    int len = strlen(output);\n    if (len > 0) output[len-1] = '\\0';\n}\n\nint main() {\n    char input[10000];\n    char output[10000];\n    fgets(input, 10000, stdin);\n    input[strcspn(input, "\\n")] = 0;\n    solve(input, output);\n    printf("%s\\n", output);\n    return 0;\n}`,
    },
  },
  {
    title: 'Employees Earning Above Average',
    description: 'Given an employees table with columns id, name, department, and salary, write a SQL query to find employees who earn more than the average salary of their department.\n\nReturn the employee name, department, and salary.',
    difficulty: 'medium',
    tags: ['SQL', 'subqueries', 'aggregate'],
    category: 'SQL',
    constraints: 'Table: employees(id INT, name VARCHAR, department VARCHAR, salary DECIMAL)',
    examples: [
      { input: 'employees: (1, "Alice", "Engineering", 120000), (2, "Bob", "Engineering", 90000), (3, "Charlie", "Marketing", 80000), (4, "Diana", "Marketing", 95000)', output: 'Alice, Engineering, 120000\\nDiana, Marketing, 95000' },
    ],
    testCases: [
      { input: 'SELECT * FROM employees', expectedOutput: '1|Alice|Engineering|120000\n2|Bob|Engineering|90000\n3|Charlie|Marketing|80000\n4|Diana|Marketing|95000', isSample: true, isHidden: false },
    ],
    starterCode: {
      javascript: '-- Write your SQL query here',
      python: '-- Write your SQL query here',
      java: '-- Write your SQL query here',
      cpp: '-- Write your SQL query here',
      c: '-- Write your SQL query here',
    },
  },
  {
    title: 'Department Top Salaries',
    description: 'Write a SQL query to find employees who have the highest salary in each department.\n\nReturn the department name, employee name, and salary.',
    difficulty: 'hard',
    tags: ['SQL', 'window-functions', 'joins'],
    category: 'SQL',
    constraints: 'Table: employees(id INT, name VARCHAR, department VARCHAR, salary DECIMAL)',
    examples: [
      { input: 'employees: (1, "Alice", "Engineering", 120000), (2, "Bob", "Engineering", 120000), (3, "Charlie", "Marketing", 80000)', output: 'Engineering, Alice, 120000\\nEngineering, Bob, 120000\\nMarketing, Charlie, 80000' },
    ],
    testCases: [
      { input: 'SELECT * FROM employees', expectedOutput: '1|Alice|Engineering|120000\n2|Bob|Engineering|120000\n3|Charlie|Marketing|80000', isSample: true, isHidden: false },
    ],
    starterCode: {
      javascript: '-- Write your SQL query here',
      python: '-- Write your SQL query here',
      java: '-- Write your SQL query here',
      cpp: '-- Write your SQL query here',
      c: '-- Write your SQL query here',
    },
  },
  {
    title: 'Order Summary with Running Total',
    description: 'Given an orders table with columns order_id, customer_id, order_date, and amount, write a SQL query to calculate a running total of order amounts for each customer, ordered by order_date.',
    difficulty: 'medium',
    tags: ['SQL', 'window-functions'],
    category: 'SQL',
    constraints: 'Table: orders(order_id INT, customer_id INT, order_date DATE, amount DECIMAL)',
    examples: [
      { input: 'orders: (1, 1, "2024-01-01", 100), (2, 1, "2024-01-15", 200), (3, 2, "2024-01-10", 150)', output: '1, 1, 2024-01-01, 100, 100\\n2, 1, 2024-01-15, 200, 300\\n3, 2, 2024-01-10, 150, 150' },
    ],
    testCases: [
      { input: 'SELECT * FROM orders', expectedOutput: '1|1|2024-01-01|100\n2|1|2024-01-15|200\n3|2|2024-01-10|150', isSample: true, isHidden: false },
    ],
    starterCode: {
      javascript: '-- Write your SQL query here',
      python: '-- Write your SQL query here',
      java: '-- Write your SQL query here',
      cpp: '-- Write your SQL query here',
      c: '-- Write your SQL query here',
    },
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