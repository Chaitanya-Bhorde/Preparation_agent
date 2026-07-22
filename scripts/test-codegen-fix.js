const path = require('path');
const codegen = require(path.join(__dirname, '..', 'server', 'utils', 'codeGenerator.js'));
const fs = require('fs');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  PASS: ${msg}`);
    passed++;
  } else {
    console.log(`  FAIL: ${msg}`);
    failed++;
  }
}

// --- Test 1: int[] input (Bug 2: regex escaping) ---
{
  console.log('\n=== Test 1: int[] input ===');
  const userCode = 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{0,1};\n    }\n}\n';
  const signature = {
    name: 'twoSum',
    params: [
      { name: 'nums', type: 'int[]' },
      { name: 'target', type: 'int' }
    ],
    returnType: 'int[]'
  };
  const testCases = [
    { input: ['[2,7,11,15]', '9'], expected: '[0,1]' }
  ];

  const result = codegen.buildFullSubmissionCode(userCode, signature, testCases, 'java');
  console.log('Generated file (first 30 lines):');
  console.log(result.split('\n').slice(0, 30).join('\n'));

  assert(result.startsWith('import java.util.*;\nimport java.util.stream.Collectors;'), 'Imports are at top of file');
  assert(result.includes('[\\\\[\\\\]\\\\s]'), 'Regex has correctly escaped backslashes (\\[\\]\\s)');
  assert(!result.includes('[\\[\\]\\s]'), 'Regex does NOT contain unescaped single-backslash form');
}

// --- Test 2: int[][] input (Bug 2: matrix regex + split) ---
{
  console.log('\n=== Test 2: int[][] input ===');
  const userCode = 'class Solution {\n    public int[][] multiply(int[][] a, int[][] b) {\n        return a;\n    }\n}\n';
  const signature = {
    name: 'multiply',
    params: [
      { name: 'a', type: 'int[][]' },
      { name: 'b', type: 'int[][]' }
    ],
    returnType: 'int[][]'
  };
  const testCases = [
    { input: ['[[1,0],[0,1]]', '[[1,2],[3,4]]'], expected: '[[1,2],[3,4]]' }
  ];

  const result = codegen.buildFullSubmissionCode(userCode, signature, testCases, 'java');
  assert(result.startsWith('import java.util.*;\nimport java.util.stream.Collectors;'), 'Imports are at top of file');
  assert(result.includes('\\\\s*\\\\['), 'Matrix regex contains escaped \\s and \\[');
  assert(result.includes('\\\\],\\\\s*\\\\['), 'Matrix split regex contains properly escaped delimiters');
}

// --- Test 3: Simple int input (should NOT break) ---
{
  console.log('\n=== Test 3: simple int input ===');
  const userCode = 'class Solution {\n    public int add(int a, int b) {\n        return a + b;\n    }\n}\n';
  const signature = {
    name: 'add',
    params: [
      { name: 'a', type: 'int' },
      { name: 'b', type: 'int' }
    ],
    returnType: 'int'
  };
  const testCases = [
    { input: ['1', '2'], expected: '3' }
  ];

  const result = codegen.buildFullSubmissionCode(userCode, signature, testCases, 'java');
  assert(result.includes('class Solution {'), 'User Solution class present');
  assert(result.includes('public static void main'), 'Main class present');
  assert(result.includes('import java.util.*;'), 'Imports still present');
}

// --- Test 4: No testCases -> returns raw user code (no regression) ---
{
  console.log('\n=== Test 4: no testCases ===');
  const userCode = 'class Solution {\n    public int f() { return 0; }\n}\n';
  const signature = { name: 'f', params: [], returnType: 'int' };
  const result = codegen.buildFullSubmissionCode(userCode, signature, [], 'java');
  assert(result === userCode, 'No testCases returns userCode unchanged');
}

// --- Test 5: String[] input ---
{
  console.log('\n=== Test 5: String[] input ===');
  const userCode = 'class Solution {\n    public String[] sort(String[] arr) {\n        return arr;\n    }\n}\n';
  const signature = {
    name: 'sort',
    params: [{ name: 'arr', type: 'String[]' }],
    returnType: 'String[]'
  };
  const testCases = [{ input: ['["foo","bar"]'], expected: '["bar","foo"]' }];
  const result = codegen.buildFullSubmissionCode(userCode, signature, testCases, 'java');
  assert(result.includes('parseStringArray'), 'String[] parser is invoked');
  assert(result.includes('[\\\\[\\\\]\\\\s]'), 'Regex is properly escaped in String[] path too');
}

console.log(`\n\n===== SUMMARY: ${passed} passed, ${failed} failed =====`);
if (failed > 0) process.exit(1);