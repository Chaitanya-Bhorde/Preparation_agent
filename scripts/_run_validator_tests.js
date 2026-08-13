/**
 * Standalone validation runner for the generic validator engine.
 * Runs the SAME coverage as the Jest suite (50 problem test cases + edge cases)
 * without requiring Jest — usable anywhere `node` exists.
 * Run: node scripts/_run_validator_tests.js
 */
const path = require('path');
const G = require(path.join(__dirname, '..', 'server', 'utils', 'genericValidator.js'));
const { PROBLEMS } = require(path.join(__dirname, '..', 'server', 'utils', '__tests__', 'genericValidator.data.js'));

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log('  PASS: ' + name); }
  else { failed++; console.log('  FAIL: ' + name + (extra ? '  -> ' + extra : '')); }
}

(async () => {
  // ---------- 1. parseInput: generic, any shape ----------
  console.log('\n=== parseInput edge cases ===');
  const fmtArrNum = { fields: [{ name: 'nums', type: 'integer[]' }, { name: 'target', type: 'integer' }] };
  const arr = G.parseInput('{"nums":[1,3,5,6],"target":5}', fmtArrNum);
  check('ordered args', JSON.stringify(arr) === '[[1,3,5,6],5]', JSON.stringify(arr));

  const fmtBoard = { fields: [{ name: 'board', type: 'string[][]' }, { name: 'word', type: 'string' }] };
  const bArgs = G.parseInput('{"board":[["A","B"],["C","D"]],"word":"ACB"}', fmtBoard);
  check('matrix + string', JSON.stringify(bArgs) === '[[["A","B"],["C","D"]],"ACB"]', JSON.stringify(bArgs));

  const fmtGrid = { fields: [{ name: 'grid', type: 'integer[][]' }] };
  check('nested arrays', JSON.stringify(G.parseInput('{"grid":[[1,2],[3,4]]}', fmtGrid)) === '[[[1,2],[3,4]]]');
  check('empty array', JSON.stringify(G.parseInput('{"grid":[]}', fmtGrid)) === '[[]]');
  check('null value', JSON.stringify(G.parseInput('{"grid":null}', fmtGrid)) === '[null]');
  check('negative + large int', JSON.stringify(G.parseInput('{"nums":[-2147483648,2147483647]}', { fields: [{ name: 'nums', type: 'integer[]' }] })) === '[[-2147483648,2147483647]]');
  check('floats', JSON.stringify(G.parseInput('{"ratio":3.14}', { fields: [{ name: 'ratio', type: 'float' }] })) === '[3.14]');
  check('string escaping', G.parseInput('{"s":"a\\"b"}', { fields: [{ name: 's', type: 'string' }] })[0] === 'a"b');
  check('extra keys ignored', G.parseInput('{"nums":[1],"target":5,"extra":9}', fmtArrNum).length === 2);

  // ---------- 2. extractFunctionFromCode ----------
  console.log('\n=== extractFunctionFromCode ===');
  const fn = G.extractFunctionFromCode('function solve(a, b) { return a + b; }', 'js');
  check('js function callable', fn(2, 3) === 5);
  const arrow = G.extractFunctionFromCode('const solve = (x) => x * 2;', 'javascript');
  check('arrow callable', arrow(21) === 42);
  let threw = false;
  try { G.extractFunctionFromCode('def solve(a):', 'python'); } catch (e) { threw = true; }
  check('non-js throws clear error', threw);

  // ---------- 3. compareOutputs: type-aware ----------
  console.log('\n=== compareOutputs edge cases ===');
  check('int equal', G.compareOutputs('5', '5', { type: 'integer' }));
  check('int whitespace', G.compareOutputs(' 5 ', '5', { type: 'integer' }));
  check('int mismatch', !G.compareOutputs('5', '6', { type: 'integer' }));
  check('float tolerance', G.compareOutputs('3.14159', '3.14160', { type: 'float' }));
  check('float far', !G.compareOutputs('1.0', '2.0', { type: 'float' }));
  check('bool true', G.compareOutputs('true', 'true', { type: 'boolean' }));
  check('bool case-insensitive', G.compareOutputs('True', 'true', { type: 'boolean' }));
  check('bool 1 == true', G.compareOutputs('1', 'true', { type: 'boolean' }));
  check('bool mismatch', !G.compareOutputs('true', 'false', { type: 'boolean' }));
  check('string exact', G.compareOutputs('hello', ' hello ', { type: 'string' }));
  check('string mismatch', !G.compareOutputs('hello', 'world', { type: 'string' }));
  check('array equal', G.compareOutputs('[1,2,3]', '[1,2,3]', { type: 'integer[]' }));
  check('array order matters', !G.compareOutputs('[1,2,3]', '[3,2,1]', { type: 'integer[]' }));
  check('array of arrays', G.compareOutputs('[[1,2],[3,4]]', '[[1,2],[3,4]]', { type: 'integer[][]' }));
  check('array of arrays mismatch', !G.compareOutputs('[[1,2],[3,4]]', '[[1,2],[4,3]]', { type: 'integer[][]' }));
  check('string[] equal', G.compareOutputs('["ad","ae"]', '["ad","ae"]', { type: 'string[]' }));

  // ---------- 4. reference computes expected for all 50 cases ----------
  console.log('\n=== computeExpectedFromReference (50 stored answers) ===');
  let refOk = 0, refTotal = 0;
  for (const p of PROBLEMS) {
    for (const tc of p.testCases) {
      refTotal++;
      try {
        const got = G.computeExpectedFromReference(p, tc.input);
        if (G.compareOutputs(tc.expectedOutput, got, p.outputFormat)) refOk++; else check('REF mismatch [' + p.title + '] ' + tc.explanation, false, 'expected=' + tc.expectedOutput + ' got=' + got);
      } catch (e) {
        check('REF error [' + p.title + '] ' + tc.explanation, false, e.message);
      }
    }
  }
  check('reference matches all ' + refTotal + ' stored answers', refOk === refTotal, refOk + '/' + refTotal);

  // ---------- 5. validateSingleTestCase: 50 end-to-end runs ----------
  console.log('\n=== validateSingleTestCase (50 end-to-end, JS in-process) ===');
  let tcOk = 0, tcTotal = 0;
  for (const p of PROBLEMS) {
    for (const tc of p.testCases) {
      tcTotal++;
      const r = await G.validateSingleTestCase(p, p.referenceSolution.code, 'js', tc);
      if (r.passed) tcOk++; else check('TC fail [' + p.title + '] ' + tc.explanation, false, 'actual=' + r.actual + ' err=' + r.error);
    }
  }
  check('single-test validates all ' + tcTotal + ' cases', tcOk === tcTotal, tcOk + '/' + tcTotal);

  // ---------- 6. validateUserCode: correct code passes samples ----------
  console.log('\n=== validateUserCode (correct reference === user code) ===');
  for (const p of PROBLEMS) {
    const out = await G.validateUserCode(p, p.referenceSolution.code, 'js');
    const allSamples = p.testCases.filter((t) => !t.isHidden).length;
    check('[' + p.title + '] allSamplesPassed', out.allSamplesPassed === true, out.summary);
    check('[' + p.title + '] summary ' + allSamples + '/' + allSamples, out.summary === (allSamples + '/' + allSamples + ' passed'), out.summary);
    check('[' + p.title + '] hidden wouldRun', out.hidden.wouldRun === true);
    check('[' + p.title + '] hidden count', out.hidden.count === p.testCases.length - allSamples);
  }

  // ---------- 7. validateUserCode: intentionally wrong code fails ----------
  console.log('\n=== validateUserCode (intentionally wrong user code) ===');
  let wrongDetected = 0;
  for (const p of PROBLEMS) {
    const wrong = await G.validateUserCode(p, 'function solve() { return "garbage"; }', 'js');
    if (wrong.allSamplesPassed === false) wrongDetected++; else check('wrong not caught [' + p.title + ']', false, wrong.summary);
  }
  check('wrong code caught on all ' + PROBLEMS.length + ' problems', wrongDetected === PROBLEMS.length, wrongDetected + '/' + PROBLEMS.length);

  // ---------- 8. Integration: runtime error surfaced ----------
  console.log('\n=== integration: runtime error, missing clauses ===');
  const first = PROBLEMS[0];
  const errRes = await G.validateUserCode(first, 'function solve() { throw new Error("boom"); }', 'js');
  check('runtime error non-passing', errRes.allSamplesPassed === false);
  check('runtime error has message', errRes.sampleResults[0].error === 'boom' || /boom/.test(String(errRes.sampleResults[0].error)));

  const badJson = await G.validateSingleTestCase(first, first.referenceSolution.code, 'js', { input: 'not-json', expectedOutput: '' });
  check('unparseable input => error not crash', badJson.passed === false && !!badJson.error);

  // validateUserCode with a problem that has missing expected outputs uses reference
  const noExpected = JSON.parse(JSON.stringify(first));
  noExpected.testCases = noExpected.testCases.map((t) => ({ input: t.input, isHidden: t.isHidden }));
  const autoFill = await G.validateUserCode(noExpected, noExpected.referenceSolution.code, 'js');
  check('auto-computes expected from reference', autoFill.allSamplesPassed === true, autoFill.summary);

  // buildFunctionSignature plugs into existing driver/starter infra
  console.log('\n=== buildFunctionSignature ===');
  const sig = G.buildFunctionSignature(first.inputFormat, first.outputFormat, 'solve');
  check('signature name', sig.name === 'solve');
  check('signature params', JSON.stringify(sig.params) === '[{"name":"nums","type":"int[]"},{"name":"target","type":"int"}]', JSON.stringify(sig.params));
  check('signature returnType', sig.returnType === 'int');

  console.log('\n===== VALIDATION REPORT =====');
  console.log('Total passes : ' + passed);
  console.log('Total fails  : ' + failed);
  console.log('Test cases   : 50 (10 problems x 5 each)');
  console.log('Problems     : 10');
  console.log('ALL PASS     : ' + (failed === 0 ? 'YES' : 'NO'));
  if (failed > 0) process.exit(1);
})();

