'use strict';

const {
  schemaForCase,
  evaluateSqlCase,
  summarizeSqlResults,
  shapeSqlResults,
} = require('../sqlCaseRunner');

const schemaSetup = `
  CREATE TABLE employees (id INTEGER, name TEXT, salary INTEGER);
  INSERT INTO employees VALUES (1, 'Alice', 120000);
`;
const sample = { inputStateSQL: '', expectedOutputRows: [{ name: 'Alice', salary: 120000 }] };
const hidden = {
  inputStateSQL: "INSERT INTO employees VALUES (2, 'Bob', 95000);",
  expectedOutputRows: [{ name: 'Alice', salary: 120000 }, { name: 'Bob', salary: 95000 }],
};

describe('SQL per-case state', () => {
  it('applies schema setup and each case input to a fresh sandbox', async () => {
    expect(schemaForCase(schemaSetup, hidden.inputStateSQL)).toContain('Bob');
    const result = await evaluateSqlCase({
      query: 'SELECT name, salary FROM employees ORDER BY id;',
      schemaSetup,
      testCase: hidden,
      isSample: false,
    });
    expect(result.passed).toBe(true);
    expect(result.errorType).toBeNull();
  });

  it('classifies a real row mismatch as Wrong Answer', async () => {
    const result = await evaluateSqlCase({
      query: "SELECT name, salary FROM employees WHERE name = 'Nobody';",
      schemaSetup,
      testCase: sample,
      isSample: true,
    });
    expect(result.passed).toBe(false);
    expect(result.errorType).toBe('wrong_answer');
  });

  it('maps SQL syntax failures to syntax_error', async () => {
    const result = await evaluateSqlCase({
      query: 'SELECT FROM WHERE',
      schemaSetup,
      testCase: sample,
      isSample: true,
    });
    expect(result.errorType).toBe('syntax_error');
  });
});

describe('SQL result aggregation and response isolation', () => {
  it('does not accept a submission with zero executable cases', () => {
    expect(summarizeSqlResults([])).toEqual({
      status: 'runtime_error',
      firstError: 'No executable SQL test cases are configured',
    });
  });

  it('redacts hidden case content while retaining pass and timing', () => {
    const shaped = shapeSqlResults([
      { passed: true, input: 'visible', expectedOutput: '[]', actualOutput: '[]', isSample: true },
      { passed: false, input: 'secret', expectedOutput: 'secret', actualOutput: 'secret', errorMessage: 'secret', isSample: false },
    ], 1);
    expect(shaped[0].input).toBe('visible');
    expect(shaped[1]).toMatchObject({
      passed: false,
      input: null,
      expectedOutput: null,
      actualOutput: null,
      errorMessage: null,
      isSample: false,
    });
  });
});
