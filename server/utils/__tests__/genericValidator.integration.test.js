/**
 * genericValidator.integration.test.js
 * End-to-end: problem metadata -> submitted code -> validation -> verdict.
 * Verifies correct code passes, deliberately wrong code fails, runtime errors are
 * surfaced, expected outputs are auto-derived from the reference, and the generic
 * engine works identically across all 10 problems with zero per-problem code.
 */
const G = require('../genericValidator');
const { PROBLEMS } = require('./genericValidator.data');

describe('End-to-end generic validation across all 10 problems', () => {
  const sampleCount = (p) => p.testCases.filter((t) => !t.isHidden).length;

  it('correct submitted code passes every sample for every problem', async () => {
    for (const p of PROBLEMS) {
      const out = await G.validateUserCode(p, p.referenceSolution.code, 'js');
      expect(out.allSamplesPassed).toBe(true);
      expect(out.sampleResults).toHaveLength(sampleCount(p));
      expect(out.hidden.wouldRun).toBe(true);
      expect(out.hidden.count).toBe(p.testCases.length - sampleCount(p));
    }
  });

  it('deliberately wrong code is rejected on every problem', async () => {
    for (const p of PROBLEMS) {
      const out = await G.validateUserCode(p, 'function solve() { return "garbage"; }', 'js');
      expect(out.allSamplesPassed).toBe(false);
      expect(out.summary).toMatch(/^0\/\d+ passed$/);
    }
  });

  it('a runtime error is surfaced instead of silently passing', async () => {
    const p = PROBLEMS[0];
    const out = await G.validateUserCode(p, 'function solve() { throw new Error("boom"); }', 'js');
    expect(out.allSamplesPassed).toBe(false);
    expect(String(out.sampleResults[0].error)).toMatch(/boom/);
  });

  it('unparseable JSON input produces an error entry, not a crash', async () => {
    const p = PROBLEMS[0];
    const r = await G.validateSingleTestCase(p, p.referenceSolution.code, 'js', { input: 'not-json', expectedOutput: '' });
    expect(r.passed).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('derives expected outputs from the reference when they are missing', async () => {
    const p = JSON.parse(JSON.stringify(PROBLEMS[0]));
    p.testCases = p.testCases.map((t) => ({ input: t.input, isHidden: t.isHidden }));
    const out = await G.validateUserCode(p, p.referenceSolution.code, 'js');
    expect(out.allSamplesPassed).toBe(true);
  });

  it('a problem id is resolved through opts.loadProblem', async () => {
    const p = PROBLEMS[1];
    const out = await G.validateUserCode('some-id', p.referenceSolution.code, 'js', {
      loadProblem: async (id) => {
        expect(id).toBe('some-id');
        return p;
      },
    });
    expect(out.allSamplesPassed).toBe(true);
  });

  it('the OOP facade mirrors the functional API', async () => {
    const p = PROBLEMS[2];
    const v = new G.GenericValidator(p);
    expect(v.extractFunction('function solve(g){ return g.length; }', 'js')([1, 2])).toBe(2);
    expect(v.compareOutputs('2', '2', { type: 'integer' })).toBe(true);
    const out = await v.validate('function solve(g){ return 1; }', 'js');
    expect(typeof out.allSamplesPassed).toBe('boolean');
  });
});
