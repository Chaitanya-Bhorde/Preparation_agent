const codegen = require('../server/utils/codeGenerator.js');
const fs = require('fs');
const { execSync } = require('child_process');

function generateAndCompile(name, userCode, signature, testCases) {
  const result = codegen.buildFullSubmissionCode(userCode, signature, testCases, 'java');
  fs.mkdirSync('javatest', {recursive: true});
  fs.writeFileSync('javatest/Main.java', result);
  console.log(`\nGenerated ${name} -> javatest/Main.java`);
  execSync('javac javatest/Main.java', {stdio:'inherit'});
  console.log(`${name} COMPILATION SUCCEEDED`);
}

// Test 1: int[][] (2D array)
generateAndCompile(
  '2D array',
  'class Solution { public int[][] multiply(int[][] a, int[][] b) { return a; } }',
  { name: 'multiply', params: [{name:'a',type:'int[][]'},{name:'b',type:'int[][]'}], returnType: 'int[][]' },
  [{input: ['[[1,0],[0,1]]','[[1,2],[3,4]]'], expected: '[[1,2],[3,4]]'}]
);

// Test 2: simple int
generateAndCompile(
  'simple int',
  'class Solution { public int add(int a, int b) { return a + b; } }',
  { name: 'add', params: [{name:'a',type:'int'},{name:'b',type:'int'}], returnType: 'int' },
  [{input: ['1','2'], expected: '3'}]
);

// Test 3: int[]
generateAndCompile(
  'int[]',
  'class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{0,1}; } }',
  { name: 'twoSum', params: [{name:'nums',type:'int[]'},{name:'target',type:'int'}], returnType: 'int[]' },
  [{input: ['[2,7,11,15]','9'], expected: '[0,1]'}]
);