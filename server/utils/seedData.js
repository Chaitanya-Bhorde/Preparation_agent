const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const Problem = require('../models/Problem');
const connectDB = require('../config/db');

const DRIVER_PLACEHOLDER = '// USER_FUNCTION_PLACEHOLDER';

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
      { input: '2 7 11 15\n9', expectedOutput: '0 1', isSample: true, isHidden: false },
      { input: '3 2 4\n6', expectedOutput: '1 2', isSample: true, isHidden: false },
      { input: '3 3\n6', expectedOutput: '0 1', isHidden: true },
      { input: '1 5 3 7 9\n12', expectedOutput: '1 4', isHidden: true },
      { input: '-1 -2 -3 -4 -5\n-8', expectedOutput: '2 4', isHidden: true },
      { input: '0 4 3 0\n0', expectedOutput: '0 3', isHidden: true },
      { input: '2 5 5 11\n10', expectedOutput: '1 2', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10\n19', expectedOutput: '8 9', isHidden: true },
      { input: '1000000 2000000 3000000 4000000\n5000000', expectedOutput: '0 4', isHidden: true },
      { input: '-1000000000 1000000000\n0', expectedOutput: '0 1', isHidden: true },
      { input: '2 7 11 15 20 25\n18', expectedOutput: '0 4', isHidden: true },
      { input: '1 1 1 1 1 1 1 1 1 1\n2', expectedOutput: '0 1', isHidden: true },
      { input: '3 2 3\n6', expectedOutput: '1 2', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9\n10', expectedOutput: '4 5', isHidden: true },
      { input: '-5 -4 -3 -2 -1\n-8', expectedOutput: '0 3', isHidden: true },
      { input: '10 20 30 40 50 60 70 80 90 100\n110', expectedOutput: '9 0', isHidden: true },
      { input: '2 7 11 15\n9\n8 15 2 9\n17', expectedOutput: '1 3', isHidden: true },
      { input: '5 75 25\n100', expectedOutput: '1 2', isHidden: true },
      { input: '1 3 4 2\n6', expectedOutput: '2 3', isHidden: true },
      { input: '2 5 5 11\n10', expectedOutput: '1 2', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20\n39', expectedOutput: '18 19', isHidden: true },
      { input: '100 200 300 400 500 600 700 800 900 1000\n1100', expectedOutput: '9 0', isHidden: true },
      { input: '-10 20 -30 40 -50 60\n10', expectedOutput: '1 5', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30\n59', expectedOutput: '28 29', isHidden: true },
    ],
    functionSignature: {
      javascript: { name: 'twoSum', params: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }], returnType: 'number[]' },
      python: { name: 'two_sum', params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }], returnType: 'List[int]' },
      java: { name: 'twoSum', params: [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }], returnType: 'int[]' },
      cpp: { name: 'twoSum', params: [{ name: 'nums', type: 'vector<int>' }, { name: 'target', type: 'int' }], returnType: 'vector<int>' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    const nums = lines[0].split(' ').map(Number);
    const target = parseInt(lines[1]);
    const result = ${DRIVER_PLACEHOLDER}(nums, target);
    console.log(result.join(' '));
});`,
      python: `import sys
if __name__ == "__main__":
    lines = sys.stdin.read().strip().split('\\n')
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    result = ${DRIVER_PLACEHOLDER}(nums, target)
    print(' '.join(map(str, result)))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] line1 = sc.nextLine().split(" ");
        int[] nums = new int[line1.length];
        for (int i = 0; i < line1.length; i++) nums[i] = Integer.parseInt(line1[i]);
        int target = Integer.parseInt(sc.nextLine());
        int[] result = ${DRIVER_PLACEHOLDER}(nums, target);
        StringBuilder sb = new StringBuilder();
        for (int v : result) sb.append(v).append(" ");
        System.out.println(sb.toString().trim());
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    vector<int> nums;
    int num;
    while (ss >> num) nums.push_back(num);
    int target;
    cin >> target;
    vector<int> result = ${DRIVER_PLACEHOLDER}(nums, target);
    for (int i = 0; i < result.size(); i++) {
        if (i > 0) cout << " ";
        cout << result[i];
    }
    cout << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    int nums[10000], n = 0, target;
    char line[100000];
    fgets(line, 100000, stdin);
    char* token = strtok(line, " \\n");
    while (token) { nums[n++] = atoi(token); token = strtok(NULL, " \\n"); }
    target = nums[n-1];
    n--;
    int* result = ${DRIVER_PLACEHOLDER}(nums, n, target);
    if (result) printf("%d %d\\n", result[0], result[1]);
    return 0;
}`,
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
      { input: 'hello', expectedOutput: 'olleh', isSample: true, isHidden: false },
      { input: 'Hannah', expectedOutput: 'hannaH', isSample: true, isHidden: false },
      { input: 'a', expectedOutput: 'a', isHidden: true },
      { input: 'ab', expectedOutput: 'ba', isHidden: true },
      { input: 'abcde', expectedOutput: 'edcba', isHidden: true },
      { input: 'racecar', expectedOutput: 'racecar', isHidden: true },
      { input: 'A', expectedOutput: 'A', isHidden: true },
      { input: 'ab1cd2', expectedOutput: '2dc1ba', isHidden: true },
      { input: 'Was it a car or a cat I saw', expectedOutput: 'was I tac a ro rac a ti saW', isHidden: true },
      { input: 'hello world', expectedOutput: 'dlrow olleh', isHidden: true },
      { input: '12345', expectedOutput: '54321', isHidden: true },
      { input: 'aAaAaA', expectedOutput: 'aAaAaA', isHidden: true },
      { input: 'z', expectedOutput: 'z', isHidden: true },
      { input: 'ab cd ef', expectedOutput: 'fe dc ba', isHidden: true },
      { input: 'Python', expectedOutput: 'nohtyP', isHidden: true },
      { input: 'JavaScript', expectedOutput: 'tpircSavaJ', isHidden: true },
      { input: 'C++ Programming', expectedOutput: 'gnimmargorP ++C', isHidden: true },
      { input: 'Data Structures', expectedOutput: 'serutcurtS ataD', isHidden: true },
      { input: 'OpenAI ChatGPT', expectedOutput: 'GPTtaC IA nepO', isHidden: true },
      { input: 'leetcode is fun', expectedOutput: 'nuf si edocteel', isHidden: true },
      { input: 'Reverse Me!', expectedOutput: '!eM esreveR', isHidden: true },
      { input: 'aaa', expectedOutput: 'aaa', isHidden: true },
      { input: 'abBA', expectedOutput: 'ABba', isHidden: true },
      { input: 'Test123', expectedOutput: '321tseT', isHidden: true },
      { input: 'madam', expectedOutput: 'madam', isHidden: true },
      { input: 'level', expectedOutput: 'level', isHidden: true },
      { input: 'rotator', expectedOutput: 'rotator', isHidden: true },
      { input: 'civic', expectedOutput: 'civic', isHidden: true },
      { input: 'deified', expectedOutput: 'deified', isHidden: true },
      { input: 'noon', expectedOutput: 'noon', isHidden: true },
    ],
    functionSignature: {
      javascript: { name: 'reverseString', params: [{ name: 's', type: 'string' }], returnType: 'string' },
      python: { name: 'reverse_string', params: [{ name: 's', type: 'str' }], returnType: 'str' },
      java: { name: 'reverseString', params: [{ name: 's', type: 'String' }], returnType: 'String' },
      cpp: { name: 'reverseString', params: [{ name: 's', type: 'string' }], returnType: 'string' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    console.log(${DRIVER_PLACEHOLDER}(line));
    rl.close();
});`,
      python: `import sys
if __name__ == "__main__":
    s = sys.stdin.read().strip()
    print(${DRIVER_PLACEHOLDER}(s))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        System.out.println(${DRIVER_PLACEHOLDER}(s));
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    getline(cin, s);
    cout << ${DRIVER_PLACEHOLDER}(s) << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <string.h>
int main() {
    char s[100000];
    fgets(s, 100000, stdin);
    s[strcspn(s, "\\n")] = 0;
    ${DRIVER_PLACEHOLDER}(s);
    printf("%s\\n", s);
    return 0;
}`,
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
      { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isSample: true, isHidden: false },
      { input: 'race a car', expectedOutput: 'false', isSample: true, isHidden: false },
      { input: ' ', expectedOutput: 'true', isHidden: true },
      { input: 'a', expectedOutput: 'true', isHidden: true },
      { input: 'ab', expectedOutput: 'false', isHidden: true },
      { input: 'aba', expectedOutput: 'true', isHidden: true },
      { input: 'abba', expectedOutput: 'true', isHidden: true },
      { input: 'abcba', expectedOutput: 'true', isHidden: true },
      { input: 'abccba', expectedOutput: 'true', isHidden: true },
      { input: 'abcdecba', expectedOutput: 'false', isHidden: true },
      { input: 'abaxyzzyxf', expectedOutput: 'false', isHidden: true },
      { input: 'aa', expectedOutput: 'true', isHidden: true },
      { input: 'aaa', expectedOutput: 'true', isHidden: true },
      { input: 'aabbaa', expectedOutput: 'true', isHidden: true },
      { input: 'abc', expectedOutput: 'false', isHidden: true },
      { input: 'abcddcba', expectedOutput: 'true', isHidden: true },
      { input: 'abcdeedcba', expectedOutput: 'true', isHidden: true },
      { input: 'abcdefedcba', expectedOutput: 'false', isHidden: true },
      { input: 'Aba', expectedOutput: 'true', isHidden: true },
      { input: '0P', expectedOutput: 'false', isHidden: true },
      { input: 'a!a', expectedOutput: 'true', isHidden: true },
      { input: 'ab@ba', expectedOutput: 'true', isHidden: true },
      { input: 'ab#cba', expectedOutput: 'false', isHidden: true },
      { input: 'was it a car or a cat i saw', expectedOutput: 'true', isHidden: true },
      { input: 'step on no pets', expectedOutput: 'true', isHidden: true },
      { input: 'live on time emit no evil', expectedOutput: 'true', isHidden: true },
      { input: 'Mr Owl ate my metal worm', expectedOutput: 'true', isHidden: true },
      { input: 'Do geese see God', expectedOutput: 'true', isHidden: true },
      { input: 'Never odd or even', expectedOutput: 'true', isHidden: true },
      { input: '9119', expectedOutput: 'true', isHidden: true },
    ],
    functionSignature: {
      javascript: { name: 'isPalindrome', params: [{ name: 's', type: 'string' }], returnType: 'boolean' },
      python: { name: 'is_palindrome', params: [{ name: 's', type: 'str' }], returnType: 'bool' },
      java: { name: 'isPalindrome', params: [{ name: 's', type: 'String' }], returnType: 'boolean' },
      cpp: { name: 'isPalindrome', params: [{ name: 's', type: 'string' }], returnType: 'bool' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    console.log(${DRIVER_PLACEHOLDER}(line));
    rl.close();
});`,
      python: `import sys
if __name__ == "__main__":
    s = sys.stdin.read().strip()
    print(${DRIVER_PLACEHOLDER}(s))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        System.out.println(${DRIVER_PLACEHOLDER}(s));
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    getline(cin, s);
    cout << (${DRIVER_PLACEHOLDER}(s) ? "true" : "false") << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <string.h>
#include <ctype.h>
int main() {
    char s[100000];
    fgets(s, 100000, stdin);
    s[strcspn(s, "\\n")] = 0;
    printf("%s\\n", ${DRIVER_PLACEHOLDER}(s) ? "true" : "false");
    return 0;
}`,
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
      { input: '()', expectedOutput: 'true', isSample: true, isHidden: false },
      { input: '()[]{}', expectedOutput: 'true', isSample: true, isHidden: false },
      { input: '(]', expectedOutput: 'false', isSample: true, isHidden: false },
      { input: '([)]', expectedOutput: 'false', isHidden: true },
      { input: '(([]){})', expectedOutput: 'true', isHidden: true },
      { input: '((()))', expectedOutput: 'true', isHidden: true },
      { input: '(()', expectedOutput: 'false', isHidden: true },
      { input: '){', expectedOutput: 'false', isHidden: true },
      { input: '([{}])', expectedOutput: 'true', isHidden: true },
      { input: '[({})]', expectedOutput: 'true', isHidden: true },
      { input: '(((((())))))', expectedOutput: 'true', isHidden: true },
      { input: '((())))(((', expectedOutput: 'false', isHidden: true },
      { input: '(())', expectedOutput: 'true', isHidden: true },
      { input: '()()', expectedOutput: 'true', isHidden: true },
      { input: '[()]', expectedOutput: 'true', isHidden: true },
      { input: '{[]}', expectedOutput: 'true', isHidden: true },
      { input: '({[]})', expectedOutput: 'true', isHidden: true },
      { input: '({[})]', expectedOutput: 'false', isHidden: true },
      { input: '(((', expectedOutput: 'false', isHidden: true },
      { input: ')))', expectedOutput: 'false', isHidden: true },
      { input: '([)]', expectedOutput: 'false', isHidden: true },
      { input: '([]', expectedOutput: 'false', isHidden: true },
      { input: '[])', expectedOutput: 'false', isHidden: true },
      { input: '[({})', expectedOutput: 'false', isHidden: true },
      { input: '([]{})', expectedOutput: 'true', isHidden: true },
      { input: '{()[]}', expectedOutput: 'true', isHidden: true },
      { input: '(((((((((()))))))))))', expectedOutput: 'true', isHidden: true },
      { input: '())(()', expectedOutput: 'false', isHidden: true },
      { input: '((())())', expectedOutput: 'true', isHidden: true },
      { input: '[({[()]})]', expectedOutput: 'true', isHidden: true },
    ],
    functionSignature: {
      javascript: { name: 'isValid', params: [{ name: 's', type: 'string' }], returnType: 'boolean' },
      python: { name: 'is_valid', params: [{ name: 's', type: 'str' }], returnType: 'bool' },
      java: { name: 'isValid', params: [{ name: 's', type: 'String' }], returnType: 'boolean' },
      cpp: { name: 'isValid', params: [{ name: 's', type: 'string' }], returnType: 'bool' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    console.log(${DRIVER_PLACEHOLDER}(line));
    rl.close();
});`,
      python: `import sys
if __name__ == "__main__":
    s = sys.stdin.read().strip()
    print(${DRIVER_PLACEHOLDER}(s))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        System.out.println(${DRIVER_PLACEHOLDER}(s));
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    getline(cin, s);
    cout << (${DRIVER_PLACEHOLDER}(s) ? "true" : "false") << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <string.h>
int main() {
    char s[100000];
    fgets(s, 100000, stdin);
    s[strcspn(s, "\\n")] = 0;
    printf("%s\\n", ${DRIVER_PLACEHOLDER}(s) ? "true" : "false");
    return 0;
}`,
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
      { input: '-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isSample: true, isHidden: false },
      { input: '1', expectedOutput: '1', isSample: true, isHidden: false },
      { input: '5 4 -1 7 8', expectedOutput: '23', isHidden: true },
      { input: '-1', expectedOutput: '-1', isHidden: true },
      { input: '-2 -1', expectedOutput: '-1', isHidden: true },
      { input: '-1 -2 -3', expectedOutput: '-1', isHidden: true },
      { input: '1 2 3 4 5', expectedOutput: '15', isHidden: true },
      { input: '-5 -4 -3 -2 -1', expectedOutput: '-1', isHidden: true },
      { input: '2 -1 3 -4 5 -6 7', expectedOutput: '7', isHidden: true },
      { input: '1 -1 1 -1 1 -1', expectedOutput: '1', isHidden: true },
      { input: '-2 -3 -1 -5 -4', expectedOutput: '-1', isHidden: true },
      { input: '100 -1 2 3 4 5 -100', expectedOutput: '14', isHidden: true },
      { input: '-10 20 -30 40 -50 60', expectedOutput: '60', isHidden: true },
      { input: '1 2 3 -2 5 6', expectedOutput: '12', isHidden: true },
      { input: '-100 -50 -25 -10 -5', expectedOutput: '-5', isHidden: true },
      { input: '0 0 0 0 0', expectedOutput: '0', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10', expectedOutput: '55', isHidden: true },
      { input: '-1 -2 -3 -4 -5 -6 -7 -8 -9 -10', expectedOutput: '-1', isHidden: true },
      { input: '3 -2 5 -1 2 -6 7 -8 9 -10', expectedOutput: '9', isHidden: true },
      { input: '100 200 -100 -200 300', expectedOutput: '300', isHidden: true },
      { input: '1 2 3 4 5 6 -20 7 8 9', expectedOutput: '27', isHidden: true },
      { input: '-1000 500 -200 100 -50 25 -10 5', expectedOutput: '500', isHidden: true },
      { input: '1 -2 3 -4 5 -6 7 -8 9 -10 11 -12 13 -14 15', expectedOutput: '15', isHidden: true },
      { input: '-1 2 -3 4 -5 6 -7 8 -9 10 -11 12 -13 14 -15 16', expectedOutput: '16', isHidden: true },
      { input: '100 -1 2 3 -50 4 5 6 -10 7 8 9', expectedOutput: '28', isHidden: true },
      { input: '-5 -4 -3 -2 -1 0 1 2 3 4 5', expectedOutput: '15', isHidden: true },
    ],
    functionSignature: {
      javascript: { name: 'maxSubArray', params: [{ name: 'nums', type: 'number[]' }], returnType: 'number' },
      python: { name: 'max_sub_array', params: [{ name: 'nums', type: 'List[int]' }], returnType: 'int' },
      java: { name: 'maxSubArray', params: [{ name: 'nums', type: 'int[]' }], returnType: 'int' },
      cpp: { name: 'maxSubArray', params: [{ name: 'nums', type: 'vector<int>' }], returnType: 'int' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const nums = line.split(' ').map(Number);
    console.log(${DRIVER_PLACEHOLDER}(nums));
    rl.close();
});`,
      python: `import sys
if __name__ == "__main__":
    nums = list(map(int, sys.stdin.read().strip().split()))
    print(${DRIVER_PLACEHOLDER}(nums))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().split(" ");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        System.out.println(${DRIVER_PLACEHOLDER}(nums));
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    vector<int> nums;
    int num;
    while (ss >> num) nums.push_back(num);
    cout << ${DRIVER_PLACEHOLDER}(nums) << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    int nums[100000], n = 0;
    char line[1000000];
    fgets(line, 1000000, stdin);
    char* token = strtok(line, " \\n");
    while (token) { nums[n++] = atoi(token); token = strtok(NULL, " \\n"); }
    printf("%d\\n", ${DRIVER_PLACEHOLDER}(nums, n));
    return 0;
}`,
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
      { input: '1 2 3 4', expectedOutput: '24 12 8 6', isSample: true, isHidden: false },
      { input: '-1 1 0 -3 3', expectedOutput: '0 0 9 0 0', isSample: true, isHidden: false },
      { input: '2 3 4 5', expectedOutput: '60 40 30 24', isHidden: true },
      { input: '-2 -3 -4 -5', expectedOutput: '-60 -40 -30 -24', isHidden: true },
      { input: '0 1 2 3', expectedOutput: '6 0 0 0', isHidden: true },
      { input: '1 0 1', expectedOutput: '0 1 0', isHidden: true },
      { input: '-1 1 1 -1', expectedOutput: '1 -1 -1 1', isHidden: true },
      { input: '1 2', expectedOutput: '2 1', isHidden: true },
      { input: '1 -1 -1 1', expectedOutput: '-1 1 1 -1', isHidden: true },
      { input: '0 0 0 0', expectedOutput: '0 0 0 0', isHidden: true },
      { input: '1 2 3 4 5', expectedOutput: '120 60 40 30 24', isHidden: true },
      { input: '-1 -2 -3 -4 -5', expectedOutput: '-120 -60 -40 -30 -24', isHidden: true },
      { input: '2 3 5 7 11', expectedOutput: '2310 1540 1155 770 462', isHidden: true },
      { input: '1 3 2 4 5', expectedOutput: '120 40 60 30 24', isHidden: true },
      { input: '5 4 3 2 1', expectedOutput: '120 150 200 300 600', isHidden: true },
      { input: '1 1 1 1 1 1', expectedOutput: '1 1 1 1 1 1', isHidden: true },
      { input: '-1 -2 -3 -4 -5 -6', expectedOutput: '-720 -360 -240 -180 -144 -120', isHidden: true },
      { input: '1 2 3 4 5 6', expectedOutput: '720 360 240 180 144 120', isHidden: true },
      { input: '10 20 30 40 50', expectedOutput: '1200000 600000 400000 300000 240000', isHidden: true },
      { input: '5 10 15 20 25 30', expectedOutput: '1800000 900000 600000 450000 360000 300000', isHidden: true },
      { input: '2 4 6 8 10 12', expectedOutput: '46080 23040 15360 11520 9216 7680', isHidden: true },
      { input: '1 3 5 7 9 11 13', expectedOutput: '135135 45045 27027 19205 15795 12155 10395', isHidden: true },
      { input: '-5 -4 -3 -2 -1 1 2 3', expectedOutput: '2880 360 480 720 1440 0 0 0', isHidden: true },
      { input: '1 1 2 3 5 8 13 21', expectedOutput: '21840 10920 7280 5460 3640 2730 1820 1365', isHidden: true },
    ],
    functionSignature: {
      javascript: { name: 'productExceptSelf', params: [{ name: 'nums', type: 'number[]' }], returnType: 'number[]' },
      python: { name: 'product_except_self', params: [{ name: 'nums', type: 'List[int]' }], returnType: 'List[int]' },
      java: { name: 'productExceptSelf', params: [{ name: 'nums', type: 'int[]' }], returnType: 'int[]' },
      cpp: { name: 'productExceptSelf', params: [{ name: 'nums', type: 'vector<int>' }], returnType: 'vector<int>' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const nums = line.split(' ').map(Number);
    const result = ${DRIVER_PLACEHOLDER}(nums);
    console.log(result.join(' '));
    rl.close();
});`,
      python: `import sys
if __name__ == "__main__":
    nums = list(map(int, sys.stdin.read().strip().split()))
    result = ${DRIVER_PLACEHOLDER}(nums)
    print(' '.join(map(str, result)))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().split(" ");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        int[] result = ${DRIVER_PLACEHOLDER}(nums);
        StringBuilder sb = new StringBuilder();
        for (int v : result) sb.append(v).append(" ");
        System.out.println(sb.toString().trim());
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    vector<int> nums;
    int num;
    while (ss >> num) nums.push_back(num);
    vector<int> result = ${DRIVER_PLACEHOLDER}(nums);
    for (int i = 0; i < result.size(); i++) {
        if (i > 0) cout << " ";
        cout << result[i];
    }
    cout << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    int nums[100000], n = 0;
    char line[1000000];
    fgets(line, 1000000, stdin);
    char* token = strtok(line, " \\n");
    while (token) { nums[n++] = atoi(token); token = strtok(NULL, " \\n"); }
    int* result = ${DRIVER_PLACEHOLDER}(nums, n);
    for (int i = 0; i < n; i++) {
        if (i > 0) printf(" ");
        printf("%d", result[i]);
    }
    printf("\\n");
    return 0;
}`,
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
      { input: 'abcabcbb', expectedOutput: '3', isSample: true, isHidden: false },
      { input: 'bbbbb', expectedOutput: '1', isSample: true, isHidden: false },
      { input: 'pwwkew', expectedOutput: '3', isHidden: true },
      { input: '0', expectedOutput: '0', isHidden: true },
      { input: 'a', expectedOutput: '1', isHidden: true },
      { input: 'au', expectedOutput: '2', isHidden: true },
      { input: 'dvdf', expectedOutput: '3', isHidden: true },
      { input: 'abba', expectedOutput: '2', isHidden: true },
      { input: 'abcde', expectedOutput: '5', isHidden: true },
      { input: 'abcabcde', expectedOutput: '5', isHidden: true },
      { input: 'tmmzuxt', expectedOutput: '5', isHidden: true },
      { input: 'abcdefg', expectedOutput: '7', isHidden: true },
      { input: 'abcdefgh', expectedOutput: '8', isHidden: true },
      { input: 'abcdefghi', expectedOutput: '9', isHidden: true },
      { input: 'abccdefg', expectedOutput: '5', isHidden: true },
      { input: 'abccba', expectedOutput: '3', isHidden: true },
      { input: 'abcabcbbabc', expectedOutput: '3', isHidden: true },
      { input: 'aab', expectedOutput: '2', isHidden: true },
      { input: 'abbc', expectedOutput: '2', isHidden: true },
      { input: 'abcabcdabcde', expectedOutput: '5', isHidden: true },
      { input: 'abcdefghijklmnopqrstuvwxyz', expectedOutput: '26', isHidden: true },
      { input: 'abcddcba', expectedOutput: '4', isHidden: true },
      { input: 'abdefgda', expectedOutput: '6', isHidden: true },
      { input: 'abcabcbabcd', expectedOutput: '4', isHidden: true },
      { input: 'bbtablud', expectedOutput: '6', isHidden: true },
      { input: 'tthat', expectedOutput: '3', isHidden: true },
      { input: 'brnk', expectedOutput: '4', isHidden: true },
      { input: 'abcdeabcdeabcde', expectedOutput: '5', isHidden: true },
      { input: 'abcdefga', expectedOutput: '7', isHidden: true },
    ],
    functionSignature: {
      javascript: { name: 'lengthOfLongestSubstring', params: [{ name: 's', type: 'string' }], returnType: 'number' },
      python: { name: 'length_of_longest_substring', params: [{ name: 's', type: 'str' }], returnType: 'int' },
      java: { name: 'lengthOfLongestSubstring', params: [{ name: 's', type: 'String' }], returnType: 'int' },
      cpp: { name: 'lengthOfLongestSubstring', params: [{ name: 's', type: 'string' }], returnType: 'int' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    console.log(${DRIVER_PLACEHOLDER}(line));
    rl.close();
});`,
      python: `import sys
if __name__ == "__main__":
    s = sys.stdin.read().strip()
    print(${DRIVER_PLACEHOLDER}(s))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        System.out.println(${DRIVER_PLACEHOLDER}(s));
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    getline(cin, s);
    cout << ${DRIVER_PLACEHOLDER}(s) << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <string.h>
int main() {
    char s[100000];
    fgets(s, 100000, stdin);
    s[strcspn(s, "\\n")] = 0;
    printf("%d\\n", ${DRIVER_PLACEHOLDER}(s));
    return 0;
}`,
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
      { input: '-1 0 3 5 9 12\n9', expectedOutput: '4', isSample: true, isHidden: false },
      { input: '-1 0 3 5 9 12\n2', expectedOutput: '-1', isSample: true, isHidden: false },
    ],
    functionSignature: {
      javascript: { name: 'search', params: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }], returnType: 'number' },
      python: { name: 'search', params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }], returnType: 'int' },
      java: { name: 'search', params: [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }], returnType: 'int' },
      cpp: { name: 'search', params: [{ name: 'nums', type: 'vector<int>' }, { name: 'target', type: 'int' }], returnType: 'int' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    const nums = lines[0].split(' ').map(Number);
    const target = parseInt(lines[1]);
    console.log(${DRIVER_PLACEHOLDER}(nums, target));
});`,
      python: `import sys
if __name__ == "__main__":
    lines = sys.stdin.read().strip().split('\\n')
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    print(${DRIVER_PLACEHOLDER}(nums, target))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().split(" ");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        int target = Integer.parseInt(sc.nextLine());
        System.out.println(${DRIVER_PLACEHOLDER}(nums, target));
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    vector<int> nums;
    int num;
    while (ss >> num) nums.push_back(num);
    int target;
    cin >> target;
    cout << ${DRIVER_PLACEHOLDER}(nums, target) << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    int nums[100000], n = 0, target;
    char line[1000000];
    fgets(line, 1000000, stdin);
    char* token = strtok(line, " \\n");
    while (token) { nums[n++] = atoi(token); token = strtok(NULL, " \\n"); }
    target = nums[n-1];
    n--;
    printf("%d\\n", ${DRIVER_PLACEHOLDER}(nums, n, target));
    return 0;
}`,
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
      { input: '1 8 6 2 5 4 8 3 7', expectedOutput: '49', isSample: true, isHidden: false },
      { input: '1 1', expectedOutput: '1', isSample: true, isHidden: false },
    ],
    functionSignature: {
      javascript: { name: 'maxArea', params: [{ name: 'height', type: 'number[]' }], returnType: 'number' },
      python: { name: 'max_area', params: [{ name: 'height', type: 'List[int]' }], returnType: 'int' },
      java: { name: 'maxArea', params: [{ name: 'height', type: 'int[]' }], returnType: 'int' },
      cpp: { name: 'maxArea', params: [{ name: 'height', type: 'vector<int>' }], returnType: 'int' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const height = line.split(' ').map(Number);
    console.log(${DRIVER_PLACEHOLDER}(height));
    rl.close();
});`,
      python: `import sys
if __name__ == "__main__":
    height = list(map(int, sys.stdin.read().strip().split()))
    print(${DRIVER_PLACEHOLDER}(height))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().split(" ");
        int[] height = new int[parts.length];
        for (int i = 0; i < parts.length; i++) height[i] = Integer.parseInt(parts[i]);
        System.out.println(${DRIVER_PLACEHOLDER}(height));
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    vector<int> height;
    int h;
    while (ss >> h) height.push_back(h);
    cout << ${DRIVER_PLACEHOLDER}(height) << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    int height[100000], n = 0;
    char line[1000000];
    fgets(line, 1000000, stdin);
    char* token = strtok(line, " \\n");
    while (token) { height[n++] = atoi(token); token = strtok(NULL, " \\n"); }
    printf("%d\\n", ${DRIVER_PLACEHOLDER}(height, n));
    return 0;
}`,
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
      { input: '2', expectedOutput: '2', isSample: true, isHidden: false },
      { input: '3', expectedOutput: '3', isSample: true, isHidden: false },
      { input: '5', expectedOutput: '8', isHidden: true },
    ],
    functionSignature: {
      javascript: { name: 'climbStairs', params: [{ name: 'n', type: 'number' }], returnType: 'number' },
      python: { name: 'climb_stairs', params: [{ name: 'n', type: 'int' }], returnType: 'int' },
      java: { name: 'climbStairs', params: [{ name: 'n', type: 'int' }], returnType: 'int' },
      cpp: { name: 'climbStairs', params: [{ name: 'n', type: 'int' }], returnType: 'int' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    console.log(${DRIVER_PLACEHOLDER}(parseInt(line)));
    rl.close();
});`,
      python: `import sys
if __name__ == "__main__":
    n = int(sys.stdin.read().strip())
    print(${DRIVER_PLACEHOLDER}(n))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.nextLine());
        System.out.println(${DRIVER_PLACEHOLDER}(n));
        sc.close();
    }
}`,
      cpp: `#include <iostream>
using namespace std;
int main() {
    int n;
    cin >> n;
    cout << ${DRIVER_PLACEHOLDER}(n) << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
int main() {
    int n;
    scanf("%d", &n);
    printf("%d\\n", ${DRIVER_PLACEHOLDER}(n));
    return 0;
}`,
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
      { input: '11110\n11010\n11000\n00000', expectedOutput: '1', isSample: true, isHidden: false },
      { input: '11000\n11000\n00100\n00011', expectedOutput: '3', isSample: true, isHidden: false },
    ],
    functionSignature: {
      javascript: { name: 'numIslands', params: [{ name: 'grid', type: 'string[][]' }], returnType: 'number' },
      python: { name: 'num_islands', params: [{ name: 'grid', type: 'List[List[str]]' }], returnType: 'int' },
      java: { name: 'numIslands', params: [{ name: 'grid', type: 'char[][]' }], returnType: 'int' },
      cpp: { name: 'numIslands', params: [{ name: 'grid', type: 'vector<vector<char>>' }], returnType: 'int' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let grid = [];
rl.on('line', (line) => { if (line.trim()) grid.push(line.trim().split('')); });
rl.on('close', () => console.log(${DRIVER_PLACEHOLDER}(grid)));`,
      python: `import sys
if __name__ == "__main__":
    grid = [list(line.strip()) for line in sys.stdin if line.strip()]
    print(${DRIVER_PLACEHOLDER}(grid))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<char[]> gridList = new ArrayList<>();
        while (sc.hasNextLine()) {
            String line = sc.nextLine();
            if (!line.isEmpty()) gridList.add(line.toCharArray());
        }
        char[][] grid = gridList.toArray(new char[0][]);
        System.out.println(${DRIVER_PLACEHOLDER}(grid));
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main() {
    vector<vector<char>> grid;
    string line;
    while (cin >> line) {
        grid.push_back(vector<char>(line.begin(), line.end()));
    }
    cout << ${DRIVER_PLACEHOLDER}(grid) << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <string.h>
int main() {
    char grid[300][300];
    int rows = 0;
    while (fgets(grid[rows], 300, stdin) && grid[rows][0] != '\\n') {
        int len = strlen(grid[rows]);
        if (len > 0 && grid[rows][len-1] == '\\n') grid[rows][len-1] = 0;
        rows++;
    }
    printf("%d\\n", ${DRIVER_PLACEHOLDER}(grid, rows));
    return 0;
}`,
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
      { input: '0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6', isSample: true, isHidden: false },
      { input: '4 2 0 3 2 5', expectedOutput: '9', isSample: true, isHidden: false },
    ],
    functionSignature: {
      javascript: { name: 'trap', params: [{ name: 'height', type: 'number[]' }], returnType: 'number' },
      python: { name: 'trap', params: [{ name: 'height', type: 'List[int]' }], returnType: 'int' },
      java: { name: 'trap', params: [{ name: 'height', type: 'int[]' }], returnType: 'int' },
      cpp: { name: 'trap', params: [{ name: 'height', type: 'vector<int>' }], returnType: 'int' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const height = line.split(' ').map(Number);
    console.log(${DRIVER_PLACEHOLDER}(height));
    rl.close();
});`,
      python: `import sys
if __name__ == "__main__":
    height = list(map(int, sys.stdin.read().strip().split()))
    print(${DRIVER_PLACEHOLDER}(height))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().split(" ");
        int[] height = new int[parts.length];
        for (int i = 0; i < parts.length; i++) height[i] = Integer.parseInt(parts[i]);
        System.out.println(${DRIVER_PLACEHOLDER}(height));
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    vector<int> height;
    int h;
    while (ss >> h) height.push_back(h);
    cout << ${DRIVER_PLACEHOLDER}(height) << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    int height[100000], n = 0;
    char line[1000000];
    fgets(line, 1000000, stdin);
    char* token = strtok(line, " \\n");
    while (token) { height[n++] = atoi(token); token = strtok(NULL, " \\n"); }
    printf("%d\\n", ${DRIVER_PLACEHOLDER}(height, n));
    return 0;
}`,
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
      { input: '1 4 5 1 3 4 2 6', expectedOutput: '1 1 2 3 4 4 5 6', isSample: true, isHidden: false },
    ],
    functionSignature: {
      javascript: { name: 'mergeKLists', params: [{ name: 'lists', type: 'number[][]' }], returnType: 'number[]' },
      python: { name: 'merge_k_lists', params: [{ name: 'lists', type: 'List[List[int]]' }], returnType: 'List[int]' },
      java: { name: 'mergeKLists', params: [{ name: 'lists', type: 'int[][]' }], returnType: 'int[]' },
      cpp: { name: 'mergeKLists', params: [{ name: 'lists', type: 'vector<vector<int>>' }], returnType: 'vector<int>' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const nums = line.split(' ').map(Number);
    const result = ${DRIVER_PLACEHOLDER}(nums);
    console.log(result.join(' '));
    rl.close();
});`,
      python: `import sys
if __name__ == "__main__":
    nums = list(map(int, sys.stdin.read().strip().split()))
    result = ${DRIVER_PLACEHOLDER}(nums)
    print(' '.join(map(str, result)))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().split(" ");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        int[] result = ${DRIVER_PLACEHOLDER}(nums);
        StringBuilder sb = new StringBuilder();
        for (int v : result) sb.append(v).append(" ");
        System.out.println(sb.toString().trim());
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    vector<int> nums;
    int num;
    while (ss >> num) nums.push_back(num);
    vector<int> result = ${DRIVER_PLACEHOLDER}(nums);
    for (int i = 0; i < result.size(); i++) {
        if (i > 0) cout << " ";
        cout << result[i];
    }
    cout << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    int nums[100000], n = 0;
    char line[1000000];
    fgets(line, 1000000, stdin);
    char* token = strtok(line, " \\n");
    while (token) { nums[n++] = atoi(token); token = strtok(NULL, " \\n"); }
    int* result = ${DRIVER_PLACEHOLDER}(nums, n);
    for (int i = 0; i < n; i++) {
        if (i > 0) printf(" ");
        printf("%d", result[i]);
    }
    printf("\\n");
    return 0;
}`,
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
      { input: '1 2 3 4 5', expectedOutput: '3', isSample: true, isHidden: false },
    ],
    functionSignature: {
      javascript: { name: 'findMedian', params: [{ name: 'nums', type: 'number[]' }], returnType: 'number' },
      python: { name: 'find_median', params: [{ name: 'nums', type: 'List[int]' }], returnType: 'float' },
      java: { name: 'findMedian', params: [{ name: 'nums', type: 'int[]' }], returnType: 'double' },
      cpp: { name: 'findMedian', params: [{ name: 'nums', type: 'vector<int>' }], returnType: 'double' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const nums = line.split(' ').map(Number);
    console.log(${DRIVER_PLACEHOLDER}(nums));
    rl.close();
});`,
      python: `import sys
if __name__ == "__main__":
    nums = list(map(int, sys.stdin.read().strip().split()))
    print(${DRIVER_PLACEHOLDER}(nums))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().split(" ");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        System.out.println(${DRIVER_PLACEHOLDER}(nums));
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    vector<int> nums;
    int num;
    while (ss >> num) nums.push_back(num);
    cout << ${DRIVER_PLACEHOLDER}(nums) << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    int nums[100000], n = 0;
    char line[1000000];
    fgets(line, 1000000, stdin);
    char* token = strtok(line, " \\n");
    while (token) { nums[n++] = atoi(token); token = strtok(NULL, " \\n"); }
    printf("%f\\n", ${DRIVER_PLACEHOLDER}(nums, n));
    return 0;
}`,
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
      { input: '2 1 1 2 2 1 3 3 2', expectedOutput: '1 -1', isSample: true, isHidden: false },
    ],
    functionSignature: {
      javascript: { name: 'LRUCache', params: [{ name: 'capacity', type: 'number' }], returnType: 'object' },
      python: { name: 'LRUCache', params: [{ name: 'capacity', type: 'int' }], returnType: 'object' },
      java: { name: 'LRUCache', params: [{ name: 'capacity', type: 'int' }], returnType: 'void' },
      cpp: { name: 'LRUCache', params: [{ name: 'capacity', type: 'int' }], returnType: 'void' },
    },
    driverTemplate: {
      javascript: `class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = new Map();
    }
    get(key) {
        if (!this.cache.has(key)) return -1;
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }
    put(key, value) {
        if (this.cache.has(key)) this.cache.delete(key);
        else if (this.cache.size >= this.capacity) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
}
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const parts = line.split(' ').map(Number);
    const cap = parts[0];
    const cache = new LRUCache(cap);
    const results = [];
    for (let i = 1; i < parts.length; i += 2) {
        if (parts[i+1] === undefined) {
            results.push(cache.get(parts[i]));
            i--;
        } else {
            cache.put(parts[i], parts[i+1]);
        }
    }
    console.log(results.join(' '));
    rl.close();
});`,
      python: `class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = {}
        self.order = []
    def get(self, key):
        if key not in self.cache:
            return -1
        self.order.remove(key)
        self.order.append(key)
        return self.cache[key]
    def put(self, key, value):
        if key in self.cache:
            self.order.remove(key)
        elif len(self.cache) >= self.capacity:
            oldest = self.order.pop(0)
            del self.cache[oldest]
        self.cache[key] = value
        self.order.append(key)

if __name__ == "__main__":
    import sys
    parts = list(map(int, sys.stdin.read().strip().split()))
    cap = parts[0]
    cache = LRUCache(cap)
    results = []
    i = 1
    while i < len(parts):
        if i + 1 < len(parts) and i % 2 == 1:
            cache.put(parts[i], parts[i+1])
            i += 2
        else:
            results.append(cache.get(parts[i]))
            i += 1
    print(' '.join(map(str, results)))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().split(" ");
        int cap = Integer.parseInt(parts[0]);
        LinkedHashMap<Integer, Integer> cache = new LinkedHashMap<>(cap, 0.75f, true) {
            protected boolean removeEldestEntry(Map.Entry eldest) {
                return size() > cap;
            }
        };
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i < parts.length; i += 2) {
            int key = Integer.parseInt(parts[i]);
            if (i + 1 < parts.length && i % 2 == 1) {
                cache.put(key, Integer.parseInt(parts[i+1]));
            } else {
                sb.append(cache.getOrDefault(key, -1)).append(" ");
                i--;
            }
        }
        System.out.println(sb.toString().trim());
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <unordered_map>
#include <list>
#include <sstream>
using namespace std;
class LRUCache {
    int cap;
    list<pair<int,int>> items;
    unordered_map<int, list<pair<int,int>>::iterator> map;
public:
    LRUCache(int capacity) : cap(capacity) {}
    int get(int key) {
        if (!map.count(key)) return -1;
        items.splice(items.begin(), items, map[key]);
        return map[key]->second;
    }
    void put(int key, int value) {
        if (map.count(key)) {
            items.splice(items.begin(), items, map[key]);
            map[key]->second = value;
        } else {
            if (items.size() >= cap) {
                map.erase(items.back().first);
                items.pop_back();
            }
            items.push_front({key, value});
            map[key] = items.begin();
        }
    }
};
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    int cap, key, val;
    ss >> cap;
    LRUCache cache(cap);
    stringstream out;
    while (ss >> key) {
        if (ss >> val) cache.put(key, val);
        else { out << cache.get(key) << " "; break; }
    }
    string res = out.str();
    if (!res.empty()) res.pop_back();
    cout << res << endl;
    return 0;
}`,
      c: ``,
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
  },
  {
    title: 'Order Summary with Running Total',
    description: 'Given an orders table with columns order_id, customer_id, order_date, and amount, write a SQL query to calculate a running total of order amounts for each customer, ordered by order_date.',
    difficulty: 'medium',
    tags: ['SQL', 'window-functions'],
    category: 'SQL',
    constraints: 'Table: orders(order_id INT, customer_id INT, order_date DATE, amount DECIMAL)',
    examples: [
      { input: 'orders: (1, 1, "2024-01-01", 100), (2, 1, "2024-01-15", 200), (3, 2, "2024-01-10", 150)', output: '1, 1, 2024-01-01, 100, 100\n2, 1, 2024-01-15, 200, 300\n3, 2, 2024-01-10, 150, 150' },
    ],
    testCases: [
      { input: 'SELECT * FROM orders', expectedOutput: '1|1|2024-01-01|100\n2|1|2024-01-15|200\n3|2|2024-01-10|150', isSample: true, isHidden: false },
    ],
  },
  {
    title: 'Two Sum II - Input Array Is Sorted',
    description: 'Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number. Let these two numbers be numbers[index1] and numbers[index2] where 1 <= index1 < index2 <= numbers.length. Return the indices of the two numbers, index1 and index2, added by one as an integer array [index1, index2] of length 2.',
    difficulty: 'medium',
    tags: ['arrays', 'two-pointers', 'binary-search'],
    category: 'DSA',
    constraints: '2 <= numbers.length <= 10^4\n-1000 <= numbers[i] <= 1000\nnumbers is sorted in non-decreasing order.\n-1000 <= target <= 1000\nThe tests are generated such that there is exactly one solution.',
    examples: [
      { input: 'numbers = [2,7,11,15], target = 9', output: '[1,2]', explanation: 'The sum of 2 and 7 is 9. Therefore, index1 = 1, index2 = 2. We return [1, 2].' },
      { input: 'numbers = [2,3,4], target = 6', output: '[1,3]' },
    ],
    testCases: [
      { input: '2 7 11 15\n9', expectedOutput: '1 2', isSample: true, isHidden: false },
      { input: '2 3 4\n6', expectedOutput: '1 3', isSample: true, isHidden: false },
      { input: '-1 0\n-1', expectedOutput: '1 2', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10\n19', expectedOutput: '9 10', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10\n1', expectedOutput: '1 2', isHidden: true },
      { input: '0 0 1 2\n0', expectedOutput: '1 2', isHidden: true },
      { input: '1 3 5 7 9 11 13 15 17 19\n30', expectedOutput: '5 10', isHidden: true },
      { input: '-10 -5 0 5 10 15 20 25 30 35\n25', expectedOutput: '6 7', isHidden: true },
      { input: '1 2 2 3 4 5 6 7 8 9\n10', expectedOutput: '2 8', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20\n39', expectedOutput: '19 20', isHidden: true },
      { input: '0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30\n59', expectedOutput: '29 30', isHidden: true },
      { input: '-100 -50 0 50 100 150 200 250 300 350\n200', expectedOutput: '5 6', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30\n119', expectedOutput: '28 30', isHidden: true },
      { input: '-5 -4 -3 -2 -1 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35\n70', expectedOutput: '34 35', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40\n159', expectedOutput: '39 40', isHidden: true },
      { input: '0 2 4 6 8 10 12 14 16 18 20 22 24 26 28 30 32 34 36 38 40 42 44 46 48 50 52 54 56 58 60\n89', expectedOutput: '29 30', isHidden: true },
      { input: '1 3 5 7 9 11 13 15 17 19 21 23 25 27 29 31 33 35 37 39 41 43 45 47 49 51 53 55 57 59 61 63 65 67 69 71 73 75 77 79\n159', expectedOutput: '79 80', isHidden: true },
      { input: '-20 -10 0 10 20 30 40 50 60 70 80 90 100 110 120 130 140 150 160 170 180 190 200 210 220 230 240 250 260 270 280 290 300 310 320 330 340 350 360 370\n690', expectedOutput: '37 39', isHidden: true },
      { input: '2 7 11 15\n9', expectedOutput: '1 2', isHidden: true },
      { input: '1 2 3\n4', expectedOutput: '2 3', isHidden: true },
      { input: '1 3 5 7 9 11 13 15 17 19 21 23 25 27 29 31 33 35 37 39 41 43 45 47 49 51 53 55 57 59\n118', expectedOutput: '59 60', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40\n159', expectedOutput: '79 80', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50\n99', expectedOutput: '49 50', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59 60\n119', expectedOutput: '59 60', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78 79 80\n159', expectedOutput: '79 80', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78 79 80 81 82 83 84 85 86 87 88 89 90\n179', expectedOutput: '89 90', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78 79 80 81 82 83 84 85 86 87 88 89 90 91 92 93 94 95 96 97 98 99 100\n199', expectedOutput: '99 100', isHidden: true },
    ],
    functionSignature: {
      javascript: { name: 'twoSumII', params: [{ name: 'numbers', type: 'number[]' }, { name: 'target', type: 'number' }], returnType: 'number[]' },
      python: { name: 'two_sum_ii', params: [{ name: 'numbers', type: 'List[int]' }, { name: 'target', type: 'int' }], returnType: 'List[int]' },
      java: { name: 'twoSumII', params: [{ name: 'numbers', type: 'int[]' }, { name: 'target', type: 'int' }], returnType: 'int[]' },
      cpp: { name: 'twoSumII', params: [{ name: 'numbers', type: 'vector<int>' }, { name: 'target', type: 'int' }], returnType: 'vector<int>' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    const numbers = lines[0].split(' ').map(Number);
    const target = parseInt(lines[1]);
    const result = ${DRIVER_PLACEHOLDER}(numbers, target);
    console.log(result.join(' '));
});`,
      python: `import sys
if __name__ == "__main__":
    lines = sys.stdin.read().strip().split('\\n')
    numbers = list(map(int, lines[0].split()))
    target = int(lines[1])
    result = ${DRIVER_PLACEHOLDER}(numbers, target)
    print(' '.join(map(str, result)))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().split(" ");
        int[] numbers = new int[parts.length];
        for (int i = 0; i < parts.length; i++) numbers[i] = Integer.parseInt(parts[i]);
        int target = Integer.parseInt(sc.nextLine());
        int[] result = ${DRIVER_PLACEHOLDER}(numbers, target);
        StringBuilder sb = new StringBuilder();
        for (int v : result) sb.append(v).append(" ");
        System.out.println(sb.toString().trim());
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    vector<int> numbers;
    int num;
    while (ss >> num) numbers.push_back(num);
    int target;
    cin >> target;
    vector<int> result = ${DRIVER_PLACEHOLDER}(numbers, target);
    for (int i = 0; i < result.size(); i++) {
        if (i > 0) cout << " ";
        cout << result[i];
    }
    cout << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    int numbers[10000], n = 0, target;
    char line[100000];
    fgets(line, 100000, stdin);
    char* token = strtok(line, " \\n");
    while (token) { numbers[n++] = atoi(token); token = strtok(NULL, " \\n"); }
    target = numbers[n-1];
    n--;
    int* result = ${DRIVER_PLACEHOLDER}(numbers, n, target);
    if (result) printf("%d %d\\n", result[0], result[1]);
    return 0;
}`,
    },
  },
  {
    title: '3Sum',
    description: 'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that the solution set must not contain duplicate triplets.',
    difficulty: 'medium',
    tags: ['arrays', 'two-pointers', 'sorting'],
    category: 'DSA',
    constraints: '3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5',
    examples: [
      { input: 'nums = [-1,0,1,2,-1,-4]', output: '[-1,-1,2]\n[-1,0,1]' },
      { input: 'nums = [0,1,1]', output: '[]' },
    ],
    testCases: [
      { input: '-1 0 1 2 -1 -4', expectedOutput: '-1 -1 2\n-1 0 1', isSample: true, isHidden: false },
      { input: '0 1 1', expectedOutput: 'No triplets found', isSample: true, isHidden: false },
      { input: '0 0 0 0', expectedOutput: '0 0 0', isHidden: true },
      { input: '-2 0 1 1 2', expectedOutput: '-2 1 1\n-2 0 2', isHidden: true },
      { input: '-1 0 1 2 -1 -4 2 -2 1', expectedOutput: '-2 0 2\n-1 -1 2\n-1 0 1', isHidden: true },
      { input: '3 0 -2 -1 1 2', expectedOutput: '-2 -1 3\n-2 0 2\n-1 0 1', isHidden: true },
      { input: '-1 0 1 0', expectedOutput: '-1 0 1', isHidden: true },
      { input: '1 2 -2 -1', expectedOutput: 'No triplets found', isHidden: true },
      { input: '0 0 0 0 0 0', expectedOutput: '0 0 0', isHidden: true },
      { input: '-4 -2 -1 -1 0 1 2 3 4 5', expectedOutput: '-4 -2 6\n-4 -1 5\n-4 0 4\n-4 1 3\n-2 -1 3\n-2 0 2\n-2 1 1\n-1 -1 2\n-1 0 1\n0 1 -1', isHidden: true },
      { input: '-5 -4 -3 -2 -1 0 1 2 3 4 5', expectedOutput: '-5 0 5\n-5 1 4\n-5 2 3\n-4 -1 5\n-4 0 4\n-4 1 3\n-3 -2 5\n-3 -1 4\n-3 0 3\n-3 1 2\n-2 -1 3\n-2 0 2\n-2 1 1\n-1 0 1', isHidden: true },
      { input: '1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1', expectedOutput: 'No triplets found', isHidden: true },
      { input: '-10 -5 0 5 10 15 20 25 30 35 40 45 50 55 60 65 70 75 80 85 90 95 100', expectedOutput: '-10 -5 15\n-10 0 10\n-10 5 5\n-5 0 5\n0 5 -5', isHidden: true },
      { input: '-3 -2 -1 0 0 0 1 2 3 4 5 6 7 8 9 10', expectedOutput: '-3 0 3\n-3 1 2\n-2 -1 3\n-2 0 2\n-2 1 1\n-1 0 1\n0 0 0', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40', expectedOutput: 'No triplets found', isHidden: true },
      { input: '-40 -20 -10 -5 0 5 10 15 20 25 30 35 40 45 50 55 60 65 70 75 80 85 90 95 100', expectedOutput: '-40 0 40\n-40 5 35\n-40 10 30\n-40 15 25\n-20 -10 30\n-20 -5 25\n-20 0 20\n-20 5 15\n-10 -5 15\n-10 0 10\n-10 5 5\n-5 0 5', isHidden: true },
      { input: '1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1', expectedOutput: 'No triplets found', isHidden: true },
      { input: '-1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1', expectedOutput: '-1 -1 2', isHidden: true },
      { input: '-100 -50 -25 -10 -5 0 5 10 25 50 100 150 200 250 300 350 400 450 500 550 600 650 700 750 800 850 900 950 1000', expectedOutput: '-100 0 100\n-100 5 95\n-100 10 90\n-100 25 75\n-100 50 50\n-50 -25 75\n-50 -10 60\n-50 -5 55\n-50 0 50\n-50 5 45\n-50 10 40\n-50 25 25\n-25 -10 35\n-25 -5 30\n-25 0 25\n-25 5 20\n-25 10 15\n-10 -5 15\n-10 0 10\n-10 5 5\n-5 0 5', isHidden: true },
      { input: '-5 -4 -3 -2 -1 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50', expectedOutput: '-5 0 5\n-5 1 4\n-4 -1 5\n-4 0 4\n-4 1 3\n-3 -1 4\n-3 0 3\n-3 1 2\n-2 -1 3\n-2 0 2\n-2 1 1\n-1 0 1\n0 1 -1', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78 79 80 81 82 83 84 85 86 87 88 89 90 91 92 93 94 95 96 97 98 99 100', expectedOutput: 'No triplets found', isHidden: true },
      { input: '-200 -100 -50 -25 -10 -5 0 5 10 25 50 100 200 250 300 350 400 450 500 550 600 650 700 750 800 850 900 950 1000', expectedOutput: '-200 0 200\n-200 5 195\n-200 10 190\n-200 25 175\n-200 50 150\n-200 100 100\n-100 -50 150\n-100 -25 125\n-100 -10 110\n-100 -5 105\n-100 0 100\n-100 5 95\n-100 10 90\n-100 25 75\n-100 50 50\n-50 -25 75\n-50 -10 60\n-50 -5 55\n-50 0 50\n-50 5 45\n-50 10 40\n-50 25 25\n-25 -10 35\n-25 -5 30\n-25 0 25\n-25 5 20\n-25 10 15\n-10 -5 15\n-10 0 10\n-10 5 5\n-5 0 5', isHidden: true },
      { input: '-300 -200 -100 -50 -25 -10 -5 0 5 10 25 50 100 200 300 350 400 450 500 550 600 650 700 750 800 850 900 950 1000', expectedOutput: '-300 0 300\n-300 5 295\n-300 10 290\n-300 25 275\n-300 50 250\n-300 100 200\n-200 -100 300\n-200 -50 250\n-200 -25 225\n-200 -10 210\n-200 -5 205\n-200 0 200\n-200 5 195\n-200 10 190\n-200 25 175\n-200 50 150\n-100 -50 150\n-100 -25 125\n-100 -10 110\n-100 -5 105\n-100 0 100\n-100 5 95\n-100 10 90\n-100 25 75\n-100 50 50\n-50 -25 75\n-50 -10 60\n-50 -5 55\n-50 0 50\n-50 5 45\n-50 10 40\n-50 25 25\n-25 -10 35\n-25 -5 30\n-25 0 25\n-25 5 20\n-25 10 15\n-10 -5 15\n-10 0 10\n-10 5 5\n-5 0 5', isHidden: true },
      { input: '-400 -300 -200 -100 -50 -25 -10 -5 0 5 10 25 50 100 200 300 400 450 500 550 600 650 700 750 800 850 900 950 1000', expectedOutput: '-400 0 400\n-400 5 395\n-400 10 390\n-400 25 375\n-400 50 350\n-400 100 300\n-400 200 200\n-300 -100 400\n-300 -50 350\n-300 -25 325\n-300 -10 310\n-300 -5 305\n-300 0 300\n-300 5 295\n-300 10 290\n-300 25 275\n-300 50 250\n-300 100 200\n-200 -100 300\n-200 -50 250\n-200 -25 225\n-200 -10 210\n-200 -5 205\n-200 0 200\n-200 5 195\n-200 10 190\n-200 25 175\n-200 50 150\n-100 -50 150\n-100 -25 125\n-100 -10 110\n-100 -5 105\n-100 0 100\n-100 5 95\n-100 10 90\n-100 25 75\n-100 50 50\n-50 -25 75\n-50 -10 60\n-50 -5 55\n-50 0 50\n-50 5 45\n-50 10 40\n-50 25 25\n-25 -10 35\n-25 -5 30\n-25 0 25\n-25 5 20\n-25 10 15\n-10 -5 15\n-10 0 10\n-10 5 5\n-5 0 5', isHidden: true },
    ],
    functionSignature: {
      javascript: { name: 'threeSum', params: [{ name: 'nums', type: 'number[]' }], returnType: 'number[][]' },
      python: { name: 'three_sum', params: [{ name: 'nums', type: 'List[int]' }], returnType: 'List[List[int]]' },
      java: { name: 'threeSum', params: [{ name: 'nums', type: 'int[]' }], returnType: 'int[][]' },
      cpp: { name: 'threeSum', params: [{ name: 'nums', type: 'vector<int>' }], returnType: 'vector<vector<int>>' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const nums = line.split(' ').map(Number);
    const result = ${DRIVER_PLACEHOLDER}(nums);
    if (result.length === 0) {
        console.log('No triplets found');
    } else {
        result.forEach(triplet => console.log(triplet.join(' ')));
    }
    rl.close();
});`,
      python: `import sys
if __name__ == "__main__":
    nums = list(map(int, sys.stdin.read().strip().split()))
    result = ${DRIVER_PLACEHOLDER}(nums)
    if not result:
        print('No triplets found')
    else:
        for triplet in result:
            print(' '.join(map(str, triplet)))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().split(" ");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        List<int[]> result = ${DRIVER_PLACEHOLDER}(nums);
        if (result.isEmpty()) {
            System.out.println("No triplets found");
        } else {
            for (int[] triplet : result) {
                System.out.println(triplet[0] + " " + triplet[1] + " " + triplet[2]);
            }
        }
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    vector<int> nums;
    int num;
    while (ss >> num) nums.push_back(num);
    vector<vector<int>> result = ${DRIVER_PLACEHOLDER}(nums);
    if (result.empty()) {
        cout << "No triplets found" << endl;
    } else {
        for (const auto& triplet : result) {
            for (int i = 0; i < triplet.size(); i++) {
                if (i > 0) cout << " ";
                cout << triplet[i];
            }
            cout << endl;
        }
    }
    return 0;
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    int nums[3000], n = 0;
    char line[1000000];
    fgets(line, 1000000, stdin);
    char* token = strtok(line, " \\n");
    while (token) { nums[n++] = atoi(token); token = strtok(NULL, " \\n"); }
    int** result = ${DRIVER_PLACEHOLDER}(nums, n);
    if (result == NULL) {
        printf("No triplets found\\n");
    } else {
        for (int i = 0; result[i] != NULL; i++) {
            printf("%d %d %d\\n", result[i][0], result[i][1], result[i][2]);
        }
    }
    return 0;
}`,
    },
  },
  {
    title: 'Valid Sudoku',
    description: 'Determine if a 9 x 9 Sudoku board is valid. Only the filled cells need to be validated according to the following rules: Each row must contain the digits 1-9 without repetition. Each column must contain the digits 1-9 without repetition. Each of the nine 3 x 3 sub-boxes of the grid must contain the digits 1-9 without repetition.',
    difficulty: 'medium',
    tags: ['matrix', 'hash-table', 'design'],
    category: 'DSA',
    constraints: 'board.length == 9\nboard[i].length == 9\nboard[i][j] is a digit 1-9 or \'.\'.',
    examples: [
      { input: 'board = [["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]', output: 'true' },
      { input: 'board = [["8","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]', output: 'false' },
    ],
    testCases: [
      { input: '53..7....\n6..195...\n.98....6.\n8...6...3\n4..8.3..1\n7...2...6\n.6....28.\n...419..5\n....8..79', expectedOutput: 'true', isSample: true, isHidden: false },
      { input: '83..7....\n6..195...\n.98....6.\n8...6...3\n4..8.3..1\n7...2...6\n.6....28.\n...419..5\n....8..79', expectedOutput: 'false', isSample: true, isHidden: false },
      { input: '....5....\n....9....\n.........\n...8.....\n..3...2..\n.........\n.........\n.........\n.........', expectedOutput: 'true', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8', expectedOutput: 'true', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9\n2 3 4 5 6 7 8 9 1\n3 4 5 6 7 8 9 1 2\n4 5 6 7 8 9 1 2 3\n5 6 7 8 9 1 2 3 4\n6 7 8 9 1 2 3 4 5\n7 8 9 1 2 3 4 5 6\n8 9 1 2 3 4 5 6 7\n9 1 2 3 4 5 6 7 8', expectedOutput: 'false', isHidden: true },
      { input: '1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1', expectedOutput: 'false', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9\n2 3 4 5 6 7 8 9 1\n3 4 5 6 7 8 9 1 2\n4 5 6 7 8 9 1 2 3\n5 6 7 8 9 1 2 3 4\n6 7 8 9 1 2 3 4 5\n7 8 9 1 2 3 4 5 6\n8 9 1 2 3 4 5 6 7\n9 1 2 3 4 5 6 7 8', expectedOutput: 'true', isHidden: true },
      { input: '5 3 4 6 7 8 9 1 2\n6 7 2 1 9 5 3 4 8\n1 9 8 3 4 2 5 6 7\n8 5 9 7 6 1 4 2 3\n4 2 6 8 5 3 7 9 1\n7 1 3 9 2 4 8 5 6\n9 6 1 5 3 7 2 8 4\n2 8 7 4 1 9 6 3 5\n3 4 5 2 8 6 1 7 9', expectedOutput: 'true', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9', expectedOutput: 'false', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8', expectedOutput: 'true', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8', expectedOutput: 'true', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8', expectedOutput: 'true', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8', expectedOutput: 'true', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8', expectedOutput: 'true', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8', expectedOutput: 'true', isHidden: true },
      { input: '1 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8', expectedOutput: 'true', isHidden: true },
    ],
    functionSignature: {
      javascript: { name: 'isValidSudoku', params: [{ name: 'board', type: 'string[][]' }], returnType: 'boolean' },
      python: { name: 'is_valid_sudoku', params: [{ name: 'board', type: 'List[List[str]]' }], returnType: 'bool' },
      java: { name: 'isValidSudoku', params: [{ name: 'board', type: 'char[][]' }], returnType: 'boolean' },
      cpp: { name: 'isValidSudoku', params: [{ name: 'board', type: 'vector<vector<char>>' }], returnType: 'bool' },
    },
    driverTemplate: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let board = [];
let row = 0;
rl.on('line', (line) => {
    if (row < 9) {
        board.push(line.trim().split(''));
        row++;
    }
});
rl.on('close', () => {
    console.log(${DRIVER_PLACEHOLDER}(board));
});`,
      python: `import sys
if __name__ == "__main__":
    board = []
    for line in sys.stdin:
        line = line.strip()
        if line:
            board.append(list(line))
    print(${DRIVER_PLACEHOLDER}(board))`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        char[][] board = new char[9][9];
        for (int i = 0; i < 9; i++) {
            String line = sc.nextLine();
            for (int j = 0; j < 9; j++) {
                board[i][j] = line.charAt(j);
            }
        }
        System.out.println(${DRIVER_PLACEHOLDER}(board));
        sc.close();
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main() {
    vector<vector<char>> board(9, vector<char>(9));
    for (int i = 0; i < 9; i++) {
        string line;
        getline(cin, line);
        for (int j = 0; j < 9; j++) {
            board[i][j] = line[j];
        }
    }
    cout << (${DRIVER_PLACEHOLDER}(board) ? "true" : "false") << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <string.h>
int main() {
    char board[9][10];
    for (int i = 0; i < 9; i++) {
        fgets(board[i], 10, stdin);
        board[i][strcspn(board[i], "\\n")] = 0;
    }
    printf("%s\\n", ${DRIVER_PLACEHOLDER}(board) ? "true" : "false");
    return 0;
}`,
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