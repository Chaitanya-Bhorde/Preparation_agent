'use strict';

const { runSQL } = require('./sqlRunner');

/** Normalize SQL.js column-name casing while preserving row and value order. */
function normalizeSqlRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
    return Object.keys(row).sort().reduce((normalized, key) => {
      normalized[key.toLowerCase()] = row[key];
      return normalized;
    }, {});
  });
}

function classifySqlError(error) {
  const message = String(error || '');
  if (/syntax|sql_syntax_error/i.test(message)) return 'syntax_error';
  if (/timed out|timeout|time limit/i.test(message)) return 'time_limit';
  return 'runtime_error';
}

/** A case gets a fresh sandbox, then its own stored input mutation is applied. */
function schemaForCase(schemaSetup, inputStateSQL) {
  return [schemaSetup, inputStateSQL]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .map((part) => (/;\s*$/.test(part) ? part : `${part};`))
    .join('\n');
}

async function evaluateSqlCase({ query, schemaSetup, testCase, isSample, timeoutMs = 5000 }) {
  const tc = testCase || {};
  const expectedRows = Array.isArray(tc.expectedOutputRows) ? tc.expectedOutputRows : [];
  const sqlResult = await runSQL({
    query,
    schemaSetup: schemaForCase(schemaSetup, tc.inputStateSQL),
    timeoutMs,
  });

  if (!sqlResult.success) {
    return {
      passed: false,
      input: tc.inputStateSQL || '',
      expectedOutput: JSON.stringify(expectedRows),
      actualOutput: '',
      errorType: classifySqlError(sqlResult.error),
      errorMessage: sqlResult.error || 'Query execution failed',
      executionTime: sqlResult.executionTime || 0,
      memoryUsed: 0,
      isSample: Boolean(isSample),
    };
  }

  const actualRows = normalizeSqlRows(sqlResult.data && sqlResult.data.rows);
  const normalizedExpectedRows = normalizeSqlRows(expectedRows);
  const passed = JSON.stringify(actualRows) === JSON.stringify(normalizedExpectedRows);
  return {
    passed,
    input: tc.inputStateSQL || '',
    expectedOutput: JSON.stringify(expectedRows),
    actualOutput: JSON.stringify(actualRows),
    errorType: passed ? null : 'wrong_answer',
    errorMessage: passed ? null : 'Result did not match expected output',
    executionTime: sqlResult.executionTime || 0,
    memoryUsed: 0,
    isSample: Boolean(isSample),
  };
}

function summarizeSqlResults(results) {
  const list = Array.isArray(results) ? results : [];
  if (list.length === 0) {
    return { status: 'runtime_error', firstError: 'No executable SQL test cases are configured' };
  }
  const passed = list.filter((result) => result.passed).length;
  if (passed === list.length) return { status: 'accepted', firstError: null };
  const firstFailure = list.find((result) => !result.passed);
  const executionError = firstFailure && firstFailure.errorType !== 'wrong_answer';
  return {
    status: executionError ? firstFailure.errorType : 'wrong_answer',
    firstError: executionError ? firstFailure.errorMessage : null,
  };
}

/** Never expose hidden input, expected rows, actual rows, or hidden errors. */
function shapeSqlResults(results, sampleCount) {
  return (results || []).map((result, index) => {
    if (index < sampleCount) return result;
    return {
      ...result,
      input: null,
      expectedOutput: null,
      actualOutput: null,
      errorMessage: null,
      isSample: false,
    };
  });
}

module.exports = {
  normalizeSqlRows,
  classifySqlError,
  schemaForCase,
  evaluateSqlCase,
  summarizeSqlResults,
  shapeSqlResults,
};
