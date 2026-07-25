const { computeVerdict, JUDGE0_STATUS } = require('../utils/judge0Coding');

describe('computeVerdict', () => {
  it('should return Accepted when all test cases pass', () => {
    const results = [
      { passed: true, input: '1', output: '2', expectedOutput: '2' },
      { passed: true, input: '2', output: '3', expectedOutput: '3' },
    ];
    const verdict = computeVerdict(results);
    expect(verdict.verdict).toBe('Accepted');
    expect(verdict.passedTestCases).toBe(2);
    expect(verdict.totalTestCases).toBe(2);
  });

  it('should return WrongAnswer when any test case fails', () => {
    const results = [
      { passed: true, input: '1', output: '2', expectedOutput: '2' },
      { passed: false, input: '2', output: '5', expectedOutput: '3' },
    ];
    const verdict = computeVerdict(results);
    expect(verdict.verdict).toBe('WrongAnswer');
    expect(verdict.passedTestCases).toBe(1);
    expect(verdict.totalTestCases).toBe(2);
  });

  it('should return first failed test case details', () => {
    const results = [
      { passed: false, input: '2', output: '5', expectedOutput: '3' },
      { passed: true, input: '1', output: '2', expectedOutput: '2' },
    ];
    const verdict = computeVerdict(results);
    expect(verdict.firstFailedInput).toBe('2');
    expect(verdict.firstFailedExpected).toBe('3');
    expect(verdict.firstFailedActual).toBe('5');
  });

  it('should return null first failed values when all pass', () => {
    const results = [
      { passed: true, input: '1', output: '2', expectedOutput: '2' },
      { passed: true, input: '2', output: '3', expectedOutput: '3' },
    ];
    const verdict = computeVerdict(results);
    expect(verdict.firstFailedInput).toBeNull();
    expect(verdict.firstFailedExpected).toBeNull();
    expect(verdict.firstFailedActual).toBeNull();
  });

  it('should return WrongAnswer when no results provided', () => {
    const results = [];
    const verdict = computeVerdict(results);
    expect(verdict.verdict).toBe('WrongAnswer');
    expect(verdict.passedTestCases).toBe(0);
    expect(verdict.totalTestCases).toBe(0);
  });
});

describe('JUDGE0_STATUS', () => {
  it('should map status ids correctly', () => {
    expect(JUDGE0_STATUS[1]).toBe('queued');
    expect(JUDGE0_STATUS[2]).toBe('queued');
    expect(JUDGE0_STATUS[3]).toBe('processing');
    expect(JUDGE0_STATUS[4]).toBe('accepted');
    expect(JUDGE0_STATUS[5]).toBe('wrong_answer');
    expect(JUDGE0_STATUS[6]).toBe('compilation_error');
    expect(JUDGE0_STATUS[7]).toBe('runtime_error');
    expect(JUDGE0_STATUS[13]).toBe('internal_error');
  });
});