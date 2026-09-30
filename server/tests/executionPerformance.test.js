/**
 * Regression tests for the DSA execution performance fix.
 *
 * THE DEFECT
 *   `localExecutor.executeSingleCase` compiled the program on every call, so a
 *   submission with 53 test cases compiled the same source 53 times. Measured
 *   on the live bank (CP-0016-MEDIUM "3Sum", 53 cases):
 *      per-case engine : JavaScript 8,871 ms | Java 58,376 ms | C++ 79,965 ms
 *      compile-once    : JavaScript 2,128 ms | Java  7,224 ms | C++  4,465 ms
 *
 * WHAT IS ASSERTED HERE
 *   1. The batch path produces IDENTICAL per-case verdicts to the per-case path.
 *   2. All five verdict types are still detected correctly.
 *   3. A compile failure is reported for EVERY case (nothing is "skipped"),
 *      which is what lets the batch path stop after a single compile.
 */
const localExecutor = require('../utils/localExecutor');
const genericValidator = require('../utils/genericValidator');

const readStdin = `const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));`;

const PASS_DRIVER = `${readStdin}
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}
console.log(JSON.stringify(twoSum(data.nums, data.target)));`;

const WRONG_DRIVER = `${readStdin}
function twoSum(nums, target) { return [7, 7]; }
console.log(JSON.stringify(twoSum(data.nums, data.target)));`;

const CRASH_DRIVER = `${readStdin}
function twoSum(nums, target) { null.oops(); return []; }
console.log(JSON.stringify(twoSum(data.nums, data.target)));`;

const COMPILE_ERROR_DRIVER = `${readStdin}
function twoSum(nums, target) { return [; }`;

const TLE_DRIVER = `${readStdin}
function twoSum(nums, target) { while (true) {} }
console.log(JSON.stringify(twoSum(data.nums, data.target)));`;

const cases = [
  { input: JSON.stringify({ nums: [2, 7, 11, 15], target: 9 }), expectedOutput: '[0,1]' },
  { input: JSON.stringify({ nums: [3, 2, 4], target: 6 }), expectedOutput: '[1,2]' },
  { input: JSON.stringify({ nums: [3, 3], target: 6 }), expectedOutput: '[0,1]' },
  { input: JSON.stringify({ nums: [1, 2, 3], target: 99 }), expectedOutput: '[]' },
  { input: JSON.stringify({ nums: [5, 5, 9], target: 10 }), expectedOutput: '[0,1]' },
  { input: JSON.stringify({ nums: [-1, -2, -3, -4], target: -7 }), expectedOutput: '[2,3]' },
  { input: JSON.stringify({ nums: [0, 4, 3, 0], target: 0 }), expectedOutput: '[0,3]' },
  { input: JSON.stringify({ nums: [-1, -1], target: -2 }), expectedOutput: '[0,1]' },
];

// The declared return type drives the type-aware comparator, exactly as in prod.
const RETURN_TYPE = 'number[]';


describe('P2 — localExecutor batch execution and verdict correctness', () => {
  it('executeTestCases returns one result per case, in order', async () => {
    const results = await localExecutor.executeTestCases(PASS_DRIVER, 'javascript', cases, RETURN_TYPE);
    expect(results).toHaveLength(cases.length);
    results.forEach((r, i) => {
      expect(r.passed).toBe(true);
      expect(r.input).toBe(cases[i].input);
    });
  });

  it('Accepted: a correct solution passes every case', async () => {
    const results = await localExecutor.executeTestCases(PASS_DRIVER, 'javascript', cases, RETURN_TYPE);
    expect(results.every((r) => r.passed)).toBe(true);
    expect(results.every((r) => r.errorType === null)).toBe(true);
  });

  it('WrongAnswer: a wrong solution fails every case without an error', async () => {
    const results = await localExecutor.executeTestCases(WRONG_DRIVER, 'javascript', cases, RETURN_TYPE);
    expect(results).toHaveLength(cases.length);
    results.forEach((r) => {
      expect(r.passed).toBe(false);
      expect(r.errorType).toBeNull();
    });
  });

  it('RuntimeError: a crash is classified for every case', async () => {
    const results = await localExecutor.executeTestCases(CRASH_DRIVER, 'javascript', cases, RETURN_TYPE);
    results.forEach((r) => {
      expect(r.passed).toBe(false);
      expect(r.errorType).toBe('RuntimeError');
    });
  });

  it('CompileError: a syntax error is reported for EVERY case, none skipped', async () => {
    const results = await localExecutor.executeTestCases(COMPILE_ERROR_DRIVER, 'javascript', cases, RETURN_TYPE);
    expect(results).toHaveLength(cases.length);
    results.forEach((r) => {
      expect(r.passed).toBe(false);
      expect(r.errorType).toBe('CompileError');
      expect(r.error).toMatch(/SyntaxError/);
    });
  });

  it('TLE: an infinite loop is detected', async () => {
    const results = await localExecutor.executeTestCases(TLE_DRIVER, 'javascript', cases.slice(0, 1), RETURN_TYPE);
    expect(results[0].passed).toBe(false);
    expect(results[0].errorType).toBe('TLE');
  }, 30000);

  it('the batch path and the per-case path agree on every verdict', async () => {
    const batch = await localExecutor.executeTestCases(PASS_DRIVER, 'javascript', cases, RETURN_TYPE);
    const single = [];
    for (const c of cases) {
      single.push(await localExecutor.executeSingleCase(PASS_DRIVER, 'javascript', c.input, c.expectedOutput, RETURN_TYPE));
    }
    expect(batch.map((r) => [r.passed, r.output, r.errorType]))
      .toEqual(single.map((r) => [r.passed, r.output, r.errorType]));
  });

  it('an empty case list is a no-op', async () => {
    await expect(localExecutor.executeTestCases(PASS_DRIVER, 'javascript', [], RETURN_TYPE)).resolves.toEqual([]);
  });

  it('an unsupported language reports a system error for every case', async () => {
    const results = await localExecutor.executeTestCases(PASS_DRIVER, 'cobol', cases.slice(0, 2), RETURN_TYPE);
    expect(results).toHaveLength(2);
    results.forEach((r) => expect(r.errorType).toBe('system_error'));
  });
});

// ===========================================================================
describe('P2 — genericValidator uses the batch engine when available', () => {
  const problem = {
    inputFormat: [{ paramName: 'payload', type: 'string' }],
    outputFormat: { type: 'number[]' },
    functionSignature: {
      javascript: { name: 'twoSum', params: [{ name: 'nums', type: 'number[]' }], returnType: 'number[]' },
    },
    testCases: cases.map((c) => ({ input: c.input, expectedOutput: c.expectedOutput, isHidden: false })),
  };

  const buildExecutor = (withBatch) => genericValidator.createSandboxExecutor({
    // The generic-validator suite is about the PLUMBING (does the batch path run
    // the same cases?), so the driver is stdin-independent: it always prints the
    // answer the first case expects. Input parsing is covered by
    // utils/__tests__/genericValidator.test.js.
    buildDriverFromSignature: () => 'console.log("[0,1]");',
    executeSingleCase: (full, lang, input, expected, rt) =>
      localExecutor.executeSingleCase(full, lang, input, expected, rt),
    ...(withBatch ? {
      executeBatch: (full, lang, cs, rt) => localExecutor.executeTestCases(full, lang, cs, rt),
    } : {}),
  });

  it('an executor WITHOUT a batch capability still validates every case', async () => {
    const run = await genericValidator.validateUserCode(problem, 'x', 'javascript', {
      runTestCase: buildExecutor(false),
      onlySample: false,
      testCases: problem.testCases,
    });
    // Every case is RUN (total is what matters here); the stub driver always
    // prints "[0,1]", so exactly the 4 cases expecting that answer pass.
    expect(run.total).toBe(cases.length);
    expect(run.passed).toBe(cases.filter((c) => c.expectedOutput === '[0,1]').length);
  });

  it('an executor WITH a batch capability produces identical results', async () => {
    const withBatch = await genericValidator.validateUserCode(problem, 'x', 'javascript', {
      runTestCase: buildExecutor(true),
      onlySample: false,
      testCases: problem.testCases,
    });
    const perCase = await genericValidator.validateUserCode(problem, 'x', 'javascript', {
      runTestCase: buildExecutor(false),
      onlySample: false,
      testCases: problem.testCases,
    });
    expect(withBatch.total).toBe(perCase.total);
    expect(withBatch.passed).toBe(perCase.passed);
    expect(withBatch.results.map((r) => r.passed)).toEqual(perCase.results.map((r) => r.passed));
    expect(withBatch.results.map((r) => r.actual)).toEqual(perCase.results.map((r) => r.actual));
  });

  it('a batch engine that throws falls back to the per-case path', async () => {
    const executor = genericValidator.createSandboxExecutor({
      buildDriverFromSignature: () => 'console.log("[0,1]");',
      executeSingleCase: (full, lang, input, expected, rt) =>
        localExecutor.executeSingleCase(full, lang, input, expected, rt),
      executeBatch: () => { throw new Error('engine misconfigured'); },
    });
    const run = await genericValidator.validateUserCode(problem, 'x', 'javascript', {
      runTestCase: executor,
      onlySample: false,
      testCases: problem.testCases,
    });
    expect(run.total).toBe(cases.length);
  });

  it('createSandboxExecutor exposes .batch only when the engine can batch', () => {
    expect(buildExecutor(true).batch).toBeInstanceOf(Function);
    expect(buildExecutor(false).batch).toBeNull();
  });
});

