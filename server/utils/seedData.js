const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
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
      { input: 'orders: (1, 1, "2024-01-01", 100), (2, 1, "2024-01-15", 200), (3, 2, "2024-01-10", 150)', output: '1, 1, 2024-01-01, 100, 100\\n2, 1, 2024-01-15, 200, 300\\n3, 2, 2024-01-10, 150, 150' },
    ],
    testCases: [
      { input: 'SELECT * FROM orders', expectedOutput: '1|1|2024-01-01|100\n2|1|2024-01-15|200\n3|2|2024-01-10|150', isSample: true, isHidden: false },
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