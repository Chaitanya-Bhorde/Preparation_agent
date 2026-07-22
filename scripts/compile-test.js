const codegen = require('../server/utils/codeGenerator.js');
const fs = require('fs');
const { execSync } = require('child_process');

const userCode = 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{0,1};\n    }\n}\n';
const signature = { name: 'twoSum', params: [{name:'nums',type:'int[]'},{name:'target',type:'int'}], returnType: 'int[]' };
const testCases = [{input: ['[2,7,11,15]','9'], expected: '[0,1]'}];

const result = codegen.buildFullSubmissionCode(userCode, signature, testCases, 'java');
fs.mkdirSync('javatest', {recursive: true});
fs.writeFileSync('javatest/Main.java', result);
console.log('Generated javatest/Main.java');

try {
  execSync('javac javatest/Main.java', {stdio:'inherit'});
  console.log('COMPILATION SUCCEEDED');
} catch (e) {
  console.error('COMPILATION FAILED');
  process.exit(1);
}