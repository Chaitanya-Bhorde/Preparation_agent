/**
 * genericValidator.test.js
 * Unit + per-problem tests for the metadata-driven generic validator.
 * Covers the 50 test cases (10 problems x 5) plus parser/extractor/comparator
 * edge cases. Run: npm test  (jest)
 */
const G = require('../genericValidator');
const { PROBLEMS } = require('./genericValidator.data');

describe('parseInput (generic, any shape)', () => {
  it('extracts ordered positional args in field order', () => {
    const f = { fields: [{ name: 'nums', type: 'integer[]' }, { name: 'target', type: 'integer' }] };
    expect(G.parseInput('{"nums":[1,3,5,6],"target":5}', f)).toEqual([[1, 3, 5, 6], 5]);
  });
  it('handles nested (matrix + scalar) structures', () => {
    const f = { fields: [{ name: 'board', type: 'string[][]' }, { name: 'word', type: 'string' }] };
    expect(G.parseInput('{"board":[["A","B"],["C","D"]],"word":"ACB"}', f)).toEqual([['A', 'B'], ['C', 'D']], 'ACB');
  });
  it('handles empty arrays and null values', () => {
    const f = { fields: [{ name: 'grid', type: 'integer[][]' }] };
    expect(G.parseInput('{"grid":[]}', f)).toEqual([[]]);
    expect(G.parseInput('{"grid":null}', f)).toEqual([null]);
  });
  it('handles negatives, large ints and floats', () => {
    expect(G.parseInput('{"nums":[-2147483648,2147483647]}', { fields: [{ name: 'nums', type: 'integer[]' }] })).toEqual([[-2147483648, 2147483647]]);
    expect(G.parseInput('{"ratio":3.14}', { fields: [{ name: 'ratio', type: 'float' }] })).toEqual([3.14]);
  });
  it('handles escaped strings and ignores extra JSON keys', () => {
    expect(G.parseInput('{"s":"a\\"b"}', { fields: [{ name: 's', type: 'string' }] })).toEqual(['a"b']);
    const args = G.parseInput('{"nums":[1],"target":5,"extra":9}', { fields: [{ name: 'nums', type: 'integer[]' }, { name: 'target', type: 'integer' }] });
    expect(args).toHaveLength(2);
  });
});

describe('extractFunctionFromCode', () => {
  it('compiles a function declaration', () => {
    const fn = G.extractFunctionFromCode('function solve(a, b) { return a + b; }', 'js');
    expect(fn(2, 3)).toBe(5);
  });
  it('compiles an arrow-function constant', () => {
    const fn = G.extractFunctionFromCode('const solve = (x) => x * 2;', 'js');
    expect(fn(21)).toBe(42);
  });
  it('throws a clear error for non-JavaScript languages', () => {
    expect(() => G.extractFunctionFromCode('def solve():', 'python')).toThrow(/JavaScript/);
  });
});

describe('compareOutputs (type-aware)', () => {
  it('integer: exact with whitespace tolerance', () => {
    expect(G.compareOutputs('5', '5', { type: 'integer' })).toBe(true);
    expect(G.compareOutputs(' 5 ', '5', { type: 'integer' })).toBe(true);
    expect(G.compareOutputs('5', '6', { type: 'integer' })).toBe(false);
  });
  it('float: relative tolerance', () => {
    expect(G.compareOutputs('3.14159', '3.14160', { type: 'float' })).toBe(true);
    expect(G.compareOutputs('1.0', '2.0', { type: 'float' })).toBe(false);
  });
  it('boolean: case-insensitive and tolerates 1/0', () => {
    expect(G.compareOutputs('true', 'true', { type: 'boolean' })).toBe(true);
    expect(G.compareOutputs('True', 'true', { type: 'boolean' })).toBe(true);
    expect(G.compareOutputs('1', 'true', { type: 'boolean' })).toBe(true);
    expect(G.compareOutputs('true', 'false', { type: 'boolean' })).toBe(false);
  });
  it('string: trimmed exact match', () => {
    expect(G.compareOutputs('hello', ' hello ', { type: 'string' })).toBe(true);
    expect(G.compareOutputs('hello', 'world', { type: 'string' })).toBe(false);
  });
  it('arrays and nested arrays: deep equality, order matters', () => {
    expect(G.compareOutputs('[1,2,3]', '[1,2,3]', { type: 'integer[]' })).toBe(true);
    expect(G.compareOutputs('[1,2,3]', '[3,2,1]', { type: 'integer[]' })).toBe(false);
    expect(G.compareOutputs('[[1,2],[3,4]]', '[[1,2],[3,4]]', { type: 'integer[][]' })).toBe(true);
    expect(G.compareOutputs('[[1,2],[3,4]]', '[[1,2],[4,3]]', { type: 'integer[][]' })).toBe(false);
    expect(G.compareOutputs('["ad","ae"]', '["ad","ae"]', { type: 'string[]' })).toBe(true);
  });
});

describe('50 reference answers (computeExpectedFromReference)', () => {
  it('matches every stored expected output across all 10 problems', () => {
    let ok = 0, total = 0;
    for (const p of PROBLEMS) {
      for (const tc of p.testCases) {
        total++;
        const got = G.computeExpectedFromReference(p, tc.input);
        if (G.compareOutputs(tc.expectedOutput, got, p.outputFormat)) ok++;
      }
    }
    expect(ok).toBe(total);
    expect(total).toBe(50);
  });
});

describe('validateSingleTestCase (end-to-end, 50 runs)', () => {
  it('passes all 50 cases when the submitted code matches the reference', async () => {
    let ok = 0, total = 0;
    for (const p of PROBLEMS) {
      for (const tc of p.testCases) {
        total++;
        const r = await G.validateSingleTestCase(p, p.referenceSolution.code, 'js', tc);
        if (r.passed) ok++;
      }
    }
    expect(ok).toBe(total);
    expect(total).toBe(50);
  });
});

describe('validateUserCode', () => {
  it('reports allSamplesPassed=true for correct code on every problem', async () => {
    for (const p of PROBLEMS) {
      const out = await G.validateUserCode(p, p.referenceSolution.code, 'js');
      expect(out.allSamplesPassed).toBe(true);
      expect(out.hidden.wouldRun).toBe(true);
    }
  });
  it('reports allSamplesPassed=false and correct summary for wrong code', async () => {
    for (const p of PROBLEMS) {
      const out = await G.validateUserCode(p, 'function solve() { return "garbage"; }', 'js');
      expect(out.allSamplesPassed).toBe(false);
      expect(out.summary).toMatch(/^0\/\d+ passed$/);
    }
  });
  it('computes expected outputs from the reference when they are missing', async () => {
    const p = JSON.parse(JSON.stringify(PROBLEMS[0]));
    p.testCases = p.testCases.map((t) => ({ input: t.input, isHidden: t.isHidden }));
    const out = await G.validateUserCode(p, p.referenceSolution.code, 'js');
    expect(out.allSamplesPassed).toBe(true);
  });
});

describe('buildFunctionSignature', () => {
  it('derives a driver/starter-compatible signature from metadata', () => {
    const p = PROBLEMS[0];
    expect(G.buildFunctionSignature(p.inputFormat, p.outputFormat, 'solve')).toEqual({
      name: 'solve',
      params: [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }],
      returnType: 'int',
    });
  });
});

