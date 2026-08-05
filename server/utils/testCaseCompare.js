/**
 * testCaseCompare.js
 * ---------------------------------------------------------------------------
 * Type-aware test-case comparison and validation.
 *
 * PROBLEM IT'S FIXING
 *   Test-case `expectedOutput` is stored as a String in the MongoDB models
 *   (Problem.js / CodingProblem.js TestCaseSchema), and the Judge0 comparison
 *   was a blind `stdOut === expectedOutput.trim()` string-equality check. That
 *   failed whenever the declared return type wanted numeric/bool/array coercion
 *   (e.g. expected "5" vs stdout "5.0", "true" vs "1", "[1,2]" vs "1 2").
 *
 *   This module coerces/validates based on the problem's DECLARED return type
 *   (int/float/string/array/bool) instead of loose string equality.
 *
 * UNTESTED — logic traced manually (shell unavailable in this session);
 * a Jest run is required to confirm these helpers behave as intended.
 * ---------------------------------------------------------------------------
 */

const NUMERIC_EPSILON = 1e-9;

const NUMERIC_TYPES = new Set([
  'int', 'integer', 'long', 'short', 'byte', 'number',
  'float', 'double', 'decimal',
]);
const FLOAT_TYPES = new Set(['float', 'double', 'decimal']);
const BOOL_TYPES = new Set(['bool', 'boolean']);

function normalizeReturnType(type) {
  return (type == null ? '' : String(type)).trim();
}

function isNumericReturn(type) {
  return NUMERIC_TYPES.has(normalizeReturnType(type).toLowerCase());
}

function isFloatReturn(type) {
  return FLOAT_TYPES.has(normalizeReturnType(type).toLowerCase());
}

function isBoolReturn(type) {
  return BOOL_TYPES.has(normalizeReturnType(type).toLowerCase());
}

function isArrayReturn(type) {
  const t = normalizeReturnType(type).toLowerCase();
  if (!t) return false;
  // JS/Java: number[], int[], int[][], string[]; Python: List[int], List[List[str]];
  // C++: vector<int>, vector<vector<int>>. A bare ']' suffix (or vector<) => array.
  return t.endsWith(']') || t.startsWith('vector<') || t.includes('array');
}

/**
 * Normalize an array-shaped output string into a single comparable token.
 * - Flat arrays: "[1,2,3]" and "1 2 3" and "1, 2, 3" all become "1 2 3".
 * - Nested arrays ([[1,2],[3,4]]): keep JSON structure so nesting is respected.
 */
function normalizeArray(s) {
  const t = (s == null ? '' : String(s)).trim();
  if (t === '') return '';
  let parsed = null;
  if (t.startsWith('[') && t.endsWith(']')) {
    try {
      parsed = JSON.parse(t);
    } catch (_) {
      // malformed JSON — fall through to tokenization
    }
  }
  if (Array.isArray(parsed)) {
    if (parsed.some((x) => Array.isArray(x))) {
      return JSON.stringify(parsed);
    }
    return parsed.join(' ');
  }
  return t.replace(/[\[\]{}"]/g, '').split(/[\s,]+/).filter(Boolean).join(' ');
}

/**
 * Type-aware comparison of program stdout against the expected output.
 * @param {string} actual   stdout produced by the submitted code
 * @param {string} expected stored expectedOutput for the test case
 * @param {string} returnType declared return type (from the problem signature)
 * @returns {boolean}
 */
function outputsMatch(actual, expected, returnType) {
  const a = (actual == null ? '' : String(actual)).trim();
  const e = (expected == null ? '' : String(expected)).trim();

  if (isBoolReturn(returnType)) {
    const norm = (x) => {
      const l = x.toLowerCase();
      if (l === 'true' || l === '1') return 'true';
      if (l === 'false' || l === '0') return 'false';
      return l;
    };
    return norm(a) === norm(e);
  }

  if (isNumericReturn(returnType)) {
    const na = Number(a);
    const ne = Number(e);
    if (Number.isNaN(na) || Number.isNaN(ne)) {
      // Neither side parses as a number — fall back to trimmed string equality.
      return a === e;
    }
    if (isFloatReturn(returnType)) {
      return Math.abs(na - ne) <= NUMERIC_EPSILON * Math.max(1, Math.abs(na), Math.abs(ne));
    }
    return na === ne;
  }

  if (isArrayReturn(returnType)) {
    return normalizeArray(a) === normalizeArray(e);
  }

  // string / char / unknown → trimmed string equality
  return a === e;
}

/**
 * Return a human-readable message if an expected-output string is NOT coercible
 * to the declared return type, otherwise null.
 */
function expectedOutputError(returnType, expectedStr) {
  const exp = (expectedStr == null ? '' : String(expectedStr)).trim();

  if (isBoolReturn(returnType)) {
    const l = exp.toLowerCase();
    if (!['true', 'false', '1', '0'].includes(l)) {
      return `declared return type is boolean but expected output "${exp}" is not true/false`;
    }
    return null;
  }

  if (isNumericReturn(returnType)) {
    if (exp === '' || Number.isNaN(Number(exp))) {
      return `declared return type is numeric (${normalizeReturnType(returnType)}) but expected output "${exp}" is not a number`;
    }
    return null;
  }

  if (isArrayReturn(returnType)) {
    const t = normalizeReturnType(returnType).toLowerCase();
    const isNumericArray =
      t.includes('int') || t.includes('number') || t.includes('long') ||
      t.includes('float') || t.includes('double') || t.includes('byte');
    if (!isNumericArray) return null; // string arrays accept anything
    const tokens = normalizeArray(exp).split(' ');
    const bad = tokens.filter((tok) => tok !== '' && Number.isNaN(Number(tok)));
    if (bad.length > 0) {
      return `declared return type is numeric array (${normalizeReturnType(returnType)}) but expected output "${exp}" contains non-numeric tokens`;
    }
    return null;
  }

  return null; // string types accept anything
}

/**
 * Validate a set of test cases against a declared return type. Used at problem
 * create/seed time so mismatches are flagged loudly instead of silently passing.
 * @returns {{valid: boolean, problems: Array<{index, input, expectedOutput, message}>}}
 */
function validateReturnTypeAgainstTestCases(returnType, testCases) {
  const problems = [];
  const list = Array.isArray(testCases) ? testCases : [];
  for (let i = 0; i < list.length; i++) {
    const msg = expectedOutputError(returnType, list[i] && list[i].expectedOutput);
    if (msg) {
      problems.push({
        index: i,
        input: list[i] && list[i].input,
        expectedOutput: list[i] && list[i].expectedOutput,
        message: msg,
      });
    }
  }
  return { valid: problems.length === 0, problems };
}

module.exports = {
  normalizeReturnType,
  isNumericReturn,
  isFloatReturn,
  isBoolReturn,
  isArrayReturn,
  normalizeArray,
  outputsMatch,
  expectedOutputError,
  validateReturnTypeAgainstTestCases,
};
