const S = require('C:/Users/hp/Desktop/prepagent/scripts/testCaseGenerators.js');

let passed = 0, failed = 0;
function eq(name, got, exp) {
  const g = JSON.stringify(got), e = JSON.stringify(exp);
  const ok = g === e;
  if (ok) { passed++; console.log(`  PASS: ${name} -> ${g}`); }
  else { failed++; console.log(`  FAIL: ${name}\n    got: ${g}\n    exp: ${e}`); }
}
function eqb(name, got, exp) { eq(name, got === true ? 'true' : 'false', exp === true ? 'true' : 'false'); }

console.log('\n=== 1. BinarySearch (LeetCode 704) ===');
eq('found mid', S.referenceSolver_BinarySearch([-1,0,3,5,9,12], 9), 4);
eq('found start', S.referenceSolver_BinarySearch([-1,0,3,5,9,12], -1), 0);
eq('found end', S.referenceSolver_BinarySearch([2,5], 5), 1);
eq('not found', S.referenceSolver_BinarySearch([2,5], 7), -1);
eq('empty', S.referenceSolver_BinarySearch([], 1), -1);
eq('single match', S.referenceSolver_BinarySearch([5], 5), 0);
eq('single no match', S.referenceSolver_BinarySearch([5], 0), -1);
eq('dups', S.referenceSolver_BinarySearch([1,2,2,2,3], 2), 2);

console.log('\n=== 2. WordSearch (LeetCode 79) ===');
eqb('exists', S.referenceSolver_WordSearch([['A','B','C','E'],['S','F','C','S'],['A','D','E','E']], 'ABCCED'), true);
eqb('exists2', S.referenceSolver_WordSearch([['A','B','C','E'],['S','F','C','S'],['A','D','E','E']], 'SEE'), true);
eqb('not exists', S.referenceSolver_WordSearch([['A','B','C','E'],['S','F','C','S'],['A','D','E','E']], 'ABCB'), false);
eqb('empty word', S.referenceSolver_WordSearch([['A']], ''), true);
eqb('empty board', S.referenceSolver_WordSearch([], 'A'), false);
eqb('single cell match', S.referenceSolver_WordSearch([['A']], 'A'), true);
eqb('single cell no match', S.referenceSolver_WordSearch([['A']], 'B'), false);
eqb('string rows', S.referenceSolver_WordSearch(['ABCE','SFCE','ADEE'], 'ABCCED'), true);

console.log('\n=== 3. NumberOfIslands (LeetCode 200) ===');
eq('islands count', S.referenceSolver_NumberOfIslands([['1','1','0'],['1','1','0'],['0','0','1']]), 2);
eq('four islands', S.referenceSolver_NumberOfIslands([['1','0','1'],['0','0','0'],['1','0','1']]), 4);
eq('empty grid', S.referenceSolver_NumberOfIslands([]), 0);
eq('all water', S.referenceSolver_NumberOfIslands([['0','0'],['0','0']]), 0);
eq('all land', S.referenceSolver_NumberOfIslands([['1','1'],['1','1']]), 1);
eq('numeric grid', S.referenceSolver_NumberOfIslands([[1,1,0],[1,1,0]]), 1);
eq('long snake', S.referenceSolver_NumberOfIslands([['1','0','1'],['1','0','1'],['1','1','1']]), 1);
eq('cross islands', S.referenceSolver_NumberOfIslands([['1','1','0','0'],['1','0','0','1'],['0','1','1','1']]), 2);

console.log('\n=== 4. CourseSchedule (LeetCode 207) ===');
eqb('no prereq', S.referenceSolver_CourseSchedule(2, []), true);
eqb('linear', S.referenceSolver_CourseSchedule(2, [[1,0]]), true);
eqb('cycle', S.referenceSolver_CourseSchedule(2, [[1,0],[0,1]]), false);
eqb('zero courses', S.referenceSolver_CourseSchedule(0, []), true);
eqb('self loop', S.referenceSolver_CourseSchedule(1, [[0,0]]), false);
eqb('complex acyclic', S.referenceSolver_CourseSchedule(4, [[1,0],[2,0],[3,1],[3,2]]), true);
eqb('complex cycle', S.referenceSolver_CourseSchedule(4, [[1,0],[2,1],[3,2],[0,3]]), false);

console.log('\n=== 5. ValidPalindromeII (LeetCode 680) ===');
eqb('palindrome', S.referenceSolver_ValidPalindromeII('aba'), true);
eqb('delete one', S.referenceSolver_ValidPalindromeII('abca'), true);
eqb('no delete possible', S.referenceSolver_ValidPalindromeII('abc'), false);
eqb('empty', S.referenceSolver_ValidPalindromeII(''), true);
eqb('single', S.referenceSolver_ValidPalindromeII('a'), true);
eqb('two equal', S.referenceSolver_ValidPalindromeII('aa'), true);
eqb('two diff', S.referenceSolver_ValidPalindromeII('ab'), true);
eqb('raceacar', S.referenceSolver_ValidPalindromeII('raceacar'), true);
eqb('tail removable', S.referenceSolver_ValidPalindromeII('abcdcbaX'), true);

console.log('\n=== 6. LetterCombinations (LeetCode 17) ===');
eq('two digits', S.referenceSolver_LetterCombinations('23'), ['ad','ae','af','bd','be','bf','cd','ce','cf']);
eq('empty', S.referenceSolver_LetterCombinations(''), []);
eq('single digit', S.referenceSolver_LetterCombinations('2'), ['a','b','c']);
eq('digit 9', S.referenceSolver_LetterCombinations('9'), ['w','x','y','z']);
eq('234 full', S.referenceSolver_LetterCombinations('234'), ['adg','adh','adi','aeg','aeh','aei','afg','afh','afi','bdg','bdh','bdi','beg','beh','bei','bfg','bfh','bfi','cdg','cdh','cdi','ceg','ceh','cei','cfg','cfh','cfi']);
eq('239 count', S.referenceSolver_LetterCombinations('23').length, 9);

console.log('\n=== 7. BasicCalculatorIII (LeetCode 772) ===');
eq('simple add', S.referenceSolver_BasicCalculatorIII('1 + 1 + 1'), 3);
eq('precedence', S.referenceSolver_BasicCalculatorIII(' 3/2 '), 1);
eq('trunc zero', S.referenceSolver_BasicCalculatorIII(' 3+5 / 2 '), 5);
eq('mixed', S.referenceSolver_BasicCalculatorIII('14-3/2'), 13);
eq('paren negative', S.referenceSolver_BasicCalculatorIII('(1+(4+5+2)-3)-(6+8)'), -5);
eq('mult precedence', S.referenceSolver_BasicCalculatorIII('2*3+4'), 10);
eq('combined', S.referenceSolver_BasicCalculatorIII('10-2*3+4/2'), 6);
eq('neg paren', S.referenceSolver_BasicCalculatorIII('-(2+3)'), -5);
eq('double unary', S.referenceSolver_BasicCalculatorIII('1--2'), 3);
eq('spaces', S.referenceSolver_BasicCalculatorIII('  231  -  32  +  4  '), 203);
eq('div trunc neg', S.referenceSolver_BasicCalculatorIII('-7/3'), -2);

console.log('\n=== 8. MinimumSizeSubarraySum (LeetCode 209) ===');
eq('min len', S.referenceSolver_MinimumSizeSubarraySum(7, [2,3,1,2,4,3]), 2);
eq('full array', S.referenceSolver_MinimumSizeSubarraySum(15, [1,2,3,4,5]), 5);
eq('none', S.referenceSolver_MinimumSizeSubarraySum(100, [1,2,3,4,5]), 0);
eq('empty', S.referenceSolver_MinimumSizeSubarraySum(3, []), 0);
eq('exact single', S.referenceSolver_MinimumSizeSubarraySum(4, [4]), 1);
eq('single too small', S.referenceSolver_MinimumSizeSubarraySum(5, [3]), 0);
eq('large single', S.referenceSolver_MinimumSizeSubarraySum(7, [7]), 1);
eq('shrink window', S.referenceSolver_MinimumSizeSubarraySum(11, [1,2,3,4,5]), 3);

console.log('\n=== 9. IncreasingTripletSubsequence (LeetCode 334) ===');
eqb('true case', S.referenceSolver_IncreasingTripletSubsequence([1,2,3,4,5]), true);
eqb('true unsorted', S.referenceSolver_IncreasingTripletSubsequence([5,4,3,2,1,2,3]), true);
eqb('false case', S.referenceSolver_IncreasingTripletSubsequence([5,4,3,2,1]), false);
eqb('empty', S.referenceSolver_IncreasingTripletSubsequence([]), false);
eqb('two elems', S.referenceSolver_IncreasingTripletSubsequence([1,2]), false);
eqb('dups no triplet', S.referenceSolver_IncreasingTripletSubsequence([1,1,1,1]), false);
eqb('triplet mid', S.referenceSolver_IncreasingTripletSubsequence([2,1,5,0,4,6]), true);
eqb('dip then rise', S.referenceSolver_IncreasingTripletSubsequence([5,1,2,3]), true);

console.log('\n=== 10. ValidParenthesesString (LeetCode 678) ===');
eqb('valid star', S.referenceSolver_ValidParenthesesString('(*)'), true);
eqb('valid close', S.referenceSolver_ValidParenthesesString('(*))'), true);
eqb('plain valid', S.referenceSolver_ValidParenthesesString('()'), true);
eqb('plain invalid', S.referenceSolver_ValidParenthesesString('('), false);
eqb('close first', S.referenceSolver_ValidParenthesesString(')'), false);
eqb('all stars', S.referenceSolver_ValidParenthesesString('***'), true);
eqb('empty', S.referenceSolver_ValidParenthesesString(''), true);
eqb('double close', S.referenceSolver_ValidParenthesesString('())'), false);
eqb('nested stars', S.referenceSolver_ValidParenthesesString('(*())'), true);
eqb('hard', S.referenceSolver_ValidParenthesesString('((*)'), true);

console.log('\n===== SUMMARY: ' + passed + ' passed, ' + failed + ' failed =====');
if (failed > 0) process.exit(1);

