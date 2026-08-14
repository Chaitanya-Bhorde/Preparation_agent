/**
 * genericValidator.js
 * ---------------------------------------------------------------------------
 * Metadata-driven, completely problem-agnostic code execution & validation
 * engine for the PrepAgent DSA platform.
 *
 * A problem is FULLY described by metadata (zero per-problem code):
 *   {
 *     inputFormat:  { fields: [{ name, type }] },    // JSON test input -> args
 *     outputFormat: { type },                        // integer/boolean/string/...[]/float
 *     referenceSolution: { code, language },         // stored CODE string (JS)
 *     testCases:    [{ input: <JSON string>, expectedOutput?, isHidden }]
 *   }
 *
 * Public, spec-compliant API:
 *   parseInput(inputJson, inputFormat)            -> [arg0, arg1, ...]
 *   extractFunctionFromCode(code, language)       -> callable function (JS)
 *   compareOutputs(expected, actual, outputFormat)-> boolean (type-aware)
 *   validateSingleTestCase(problem, code, lang, tc, opts) -> per-test result
 *   validateUserCode(problemOrId, code, lang, opts)       -> { sampleResults,
 *                                                             allSamplesPassed,
 *                                                             hidden, summary }
 *
 * Execution is injected (`opts.runTestCase`). For JavaScript, an in-process
 * executor is the default; production wires Judge0/localExecutor for any
 * language. No scheme-specific logic anywhere: inputFormat drives parsing,
 * outputFormat drives comparison, referenceSolution drives expected output.
 * ---------------------------------------------------------------------------
 */

const SCALAR_STRING = new Set(['string', 'char']);
const FLOAT_TYPES = new Set(['float', 'double', 'decimal']);
const NUMERIC_TYPES = /^(int|integer|long|short|byte|number|float|double|decimal)$/;
const ARRAY_LIKE = /(\[\])|^list|^vector|array/;

/** Deep equality (order matters for arrays, key-insensitive for objects). */
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka) if (!deepEqual(a[k], b[k])) return false;
    return true;
  }
  return false;
}

/**
 * Serialize a solution's return VALUE into the canonical stdout string the driver
 * programs print, so it is comparable against submitted code's actual output.
 */
function serializeValue(value, outputFormat) {
  const type = String((outputFormat && outputFormat.type) || '').toLowerCase();
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    // Floats keep their decimal representation; integers print bare.
    const s = String(value);
    return FLOAT_TYPES.has(type) || !Number.isInteger(value) ? s : String(value);
  }
  if (typeof value === 'string') {
    // A scalar string is printed without JSON quotes by all drivers.
    if (SCALAR_STRING.has(type) || (!type.endsWith('[]') && !type.endsWith(']'))) return value;
    return JSON.stringify(value);
  }
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Serialize one input field to its single line for line-based drivers. */
function toStdinLine(fieldType, value) {
  const t = String(fieldType || '').toLowerCase();
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (SCALAR_STRING.has(t) || (!t.endsWith('[]') && !t.endsWith(']'))) return value;
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

/**
 * Detailed parse used internally: yields the ordered positional args, the
 * line-based stdin string, the raw parsed object, and any missing field names.
 */
function _parseDetailed(inputJson, inputFormat) {
  const input = typeof inputJson === 'string' ? JSON.parse(inputJson) : (inputJson || {});
  const fields = (inputFormat && inputFormat.fields) || [];
  const args = fields.map((f) => input[f.name]);
  const stdin = fields.map((f) => toStdinLine(f.type, input[f.name])).join('\n');
  const missing = fields.filter((f) => input[f.name] === undefined).map((f) => f.name);
  return { args, stdin, input, missing };
}

/**
 * #1 — GENERIC INPUT PARSER.
 * Parses any JSON test-case input into the ordered positional argument list that
 * the solution function expects. Purely metadata-driven: the `fields` array of
 * `inputFormat` says which keys to pull and in which order. Handles scalars,
 * arrays, nested structures, empty values, escapes, negatives, large ints.
 *
 * @param {string|object} inputJson  e.g. '{"nums":[1,3,5,6],"target":5}'
 * @param {object} inputFormat       e.g. { fields: [{name:"nums",type:"integer[]"},{name:"target",type:"integer"}] }
 * @returns {Array}                  e.g. [[1,3,5,6], 5]
 */
function parseInput(inputJson, inputFormat) {
  return _parseDetailed(inputJson, inputFormat).args;
}

/**
 * Compile a trusted reference-solution JS function from its stored CODE string.
 * Only ever called with admin-provided reference metadata (never user code), so
 * in-process compilation is safe and fast. Works for `function solve(...)`,
 * arrow functions, and any expression that evaluates to a function.
 */
function createSolveFunction(code) {
  if (typeof code !== 'string' || !code.trim()) {
    throw new Error('genericValidator: solution code is empty');
  }
  const source = code.trim();
  // Strategy A: the code is a function expression / arrow expression.
  try {
    const asExpression = new Function('return (' + source + ');');
    const fn = asExpression();
    if (typeof fn === 'function') return fn;
  } catch (_) { /* fall through - it is a statement body, not an expression */ }
  // Strategy B: the code is a statement body that declares/assigns `solve`
  // (e.g. "function solve(...) {...}" or "const solve = (...) => ...").
  const body =
    source +
    '\n;return (typeof solve === "function") ? solve' +
    ' : (typeof exports === "object" && typeof exports.default === "function") ? exports.default : undefined;';
  const asStatement = new Function(body);
  const fn = asStatement();
  if (typeof fn === 'function') {
    return fn;
  }
  throw new Error('genericValidator: code does not expose a callable function');
}

const JS_LANGUAGES = new Set(['js', 'javascript', 'node', 'nodejs', 'javascript (node.js)']);

/**
 * #2 — EXECUTE REFERENCE SOLUTION CODE.
 * Extracts a callable function from a stored code string. JavaScript reference
 * solutions (the supported/trusted case per the platform) are compiled and
 * returned as a real callable. Any other language cannot run in-process safely,
 * so a clear, actionable error is thrown — those languages execute via Judge0 in
 * the route layer instead.
 *
 * @param {string} code       e.g. "function solve(nums, target) { ... }"
 * @param {string} language   e.g. "js" | "python" | "java" | "cpp" | "c" | "csharp"
 * @returns {Function}        callable function (JavaScript only)
 */
function extractFunctionFromCode(code, language) {
  const lang = String(language || '').toLowerCase().trim();
  if (JS_LANGUAGES.has(lang)) return createSolveFunction(code);
  throw new Error(
    'genericValidator: in-process execution is only supported for JavaScript ' +
    '(got "' + language + '"). Non-JS reference/user code must run through the ' +
    'Judge0/localExecutor sandbox (pass an opts.runTestCase executor).'
  );
}

// Compatibility alias used elsewhere in the codebase / tests.
const extractFunction = extractFunctionFromCode;

/**
 * #3 — GENERIC TYPE-AWARE OUTPUT COMPARATOR.
 * Compares the expected output string against the actual stdout string using the
 * declared `outputFormat.type`. Rules:
 *   integer/long/short/byte -> exact numeric equality
 *   float/double/decimal    -> relative tolerance |a-b| <= 1e-5 * max(1,|a|,|b|)
 *   boolean/bool            -> case-insensitive (accepts true/false/1/0)
 *   string                  -> trimmed exact match
 *   *[] / list / vector     -> deep equality, order matters; tolerant of spacing
 *   object / fallback       -> trimmed string equality then JSON deep equality
 *
 * @param {string} expected    e.g. "2"
 * @param {string} actual      e.g. "2"
 * @param {object} outputFormat e.g. { type: "integer" }
 * @returns {boolean}
 */
function compareOutputs(expected, actual, outputFormat) {
  const type = String((outputFormat && outputFormat.type) || 'string').toLowerCase().trim();
  const e = String(expected == null ? '' : expected).trim();
  const a = String(actual == null ? '' : actual).trim();

  // Boolean (case-insensitive, tolerates 1/0).
  if (type === 'boolean' || type === 'bool') {
    const norm = (s) => {
      const l = s.toLowerCase();
      if (l === 'true' || s === '1') return 'true';
      if (l === 'false' || s === '0') return 'false';
      return l;
    };
    return norm(a) === norm(e);
  }

  // Numeric (exact for integers, relative epsilon for floats).
  if (NUMERIC_TYPES.test(type)) {
    const na = Number(a), ne = Number(e);
    if (Number.isNaN(na) || Number.isNaN(ne)) return a === e;
    if (FLOAT_TYPES.has(type)) {
      return Math.abs(na - ne) <= 1e-5 * Math.max(1, Math.abs(na), Math.abs(ne));
    }
    return na === ne;
  }

  // Array / list / vector (deep equality, order matters, spacing tolerant).
  if (ARRAY_LIKE.test(type)) {
    const toArray = (s) => {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) { /* fall through to tokenization */ }
      return s.replace(/[[\]{}"]/g, '').split(/[\s,]+/).filter(Boolean);
    };
    return deepEqual(toArray(a), toArray(e));
  }

  // Scalar string: trimmed exact match.
  if (SCALAR_STRING.has(type)) return a === e;

  // Object / unknown: try JSON deep equality, fall back to trimmed equality.
  try {
    if (a && e) {
      const pa = JSON.parse(a), pe = JSON.parse(e);
      if (typeof pa === 'object' && typeof pe === 'object') return deepEqual(pa, pe);
    }
  } catch (_) { /* not JSON */ }
  return a === e;
}

// Public alias matching the older validateOutput name used by previous layers.
const validateOutput = compareOutputs;

// Map generic input/output type tokens to driver/starter type tokens used by the
// rest of the codebase (codeGenerator.generateStarterCode / judge0Coding).
const TYPE_MAP = {
  'integer': 'int', 'number': 'int', 'int': 'int', 'long': 'long',
  'double': 'double', 'float': 'double', 'decimal': 'double',
  'boolean': 'boolean', 'bool': 'boolean', 'string': 'string', 'char': 'string',
  'integer[]': 'int[]', 'number[]': 'int[]', 'int[]': 'int[]', 'long[]': 'long[]',
  'string[]': 'string[]', 'char[]': 'string[]',
  'integer[][]': 'int[][]', 'number[][]': 'int[][]', 'int[][]': 'int[][]',
  'string[][]': 'string[][]', 'char[][]': 'char[][]',
};

function mapType(typeToken) {
  if (typeToken == null) return '';
  return TYPE_MAP[String(typeToken).toLowerCase()] || String(typeToken);
}

/**
 * Compute the expected output STRING for a test input by running the stored
 * reference solution in-process with the parsed positional args.
 */
function computeExpectedFromReference(problem, input) {
  if (!problem || !problem.referenceSolution || !problem.referenceSolution.code) {
    throw new Error('genericValidator: problem has no referenceSolution to compute expected output');
  }
  const fn = createSolveFunction(problem.referenceSolution.code);
  const args = parseTestCaseInput(problem, input).args;
  const value = fn.apply(null, args);
  return serializeValue(value, problem.outputFormat);
}

/**
 * Derive the { name, params:[{name,type}], returnType } signature object used by
 * the existing starter-code generator / driver builder, purely from metadata.
 */
function buildFunctionSignature(inputFormat, outputFormat, fnName) {
  const name = fnName || 'solve';
  const fields = (inputFormat && inputFormat.fields) || [];
  return {
    name,
    params: fields.map((f) => ({ name: f.name, type: mapType(f.type) })),
    returnType: mapType(outputFormat && outputFormat.type),
  };
}

/**
 * For each test case, keep the stored expected output or derive it from the
 * reference solution. Returns an array of { input, expectedOutput, isHidden,
 * explanation, referenceError? } suitable for persisting / executing.
 */
function runReferenceTestCases(problem, testCases) {
  const list = Array.isArray(testCases) ? testCases : (testCases || []);
  return list.map((tc) => {
    const entry = {
      input: tc.input,
      expectedOutput: '',
      isHidden: !!tc.isHidden,
      explanation: tc.explanation || '',
    };
    if (tc.expectedOutput != null && String(tc.expectedOutput).trim() !== '') {
      entry.expectedOutput = String(tc.expectedOutput).trim();
      return entry;
    }
    try {
      entry.expectedOutput = computeExpectedFromReference(problem, tc.input);
    } catch (e) {
      entry.referenceError = (e && e.message) || String(e);
    }
    return entry;
  });
}

/**
 * Build a runTestCase-compatible executor that compiles & runs JS code fully
 * in-process. Intended for trusted reference solutions and local testing. Returns
 * the same shape the sandbox executors produce: { output, error, errorType, ... }.
 */
function createInProcessExecutor(sourceCode, outputFormat) {
  const fn = createSolveFunction(sourceCode);
  return async (task) => {
    try {
      const value = fn.apply(null, (task && task.args) || []);
      return { output: serializeValue(value, outputFormat), error: null, errorType: null, executionTime: 0 };
    } catch (e) {
      return { output: '', error: (e && e.message) || String(e), errorType: 'RuntimeError', executionTime: 0 };
    }
  };
}

/** Resolve the executor for a run: explicit injected executor, else in-process JS. */
function resolveExecutor(problem, userCode, language, opts) {
  const lang = String(language || '').toLowerCase().trim();
  if (typeof opts.runTestCase === 'function') return opts.runTestCase;
  if (JS_LANGUAGES.has(lang)) return createInProcessExecutor(userCode, problem.outputFormat);
  throw new Error(
    'genericValidator: no runTestCase executor provided for language "' +
    language + '" — wire Judge0/localExecutor (JS is supported in-process).'
  );
}

/**
 * #4 — VALIDATE A SINGLE TEST CASE END-TO-END.
 * 1. parse JSON input -> positional args
 * 2. expected output = stored value, else computed from reference solution
 * 3. execute the user code via the executor
 * 4. compare type-aware with compareOutputs
 *
 * @returns {{ testCaseId, input, expected, actual, passed, error, time }}
 */
async function validateSingleTestCase(problem, userCode, language, testCase, opts) {
  const o = opts || {};
  const runner = resolveExecutor(problem, userCode, language, o);
    const result = {
    testCaseId: (testCase && (testCase._id || testCase.testCaseId || testCase.id)) || null,
    input: testCase && testCase.input,
    expected: '',
    actual: '',
    passed: false,
    error: null,
    errorType: null,
    time: 0,
  };
  try {
    const detail = parseTestCaseInput(problem, testCase.input);
    result.expected =
      testCase.expectedOutput != null && String(testCase.expectedOutput).trim() !== ''
        ? String(testCase.expectedOutput).trim()
        : computeExpectedFromReference(problem, testCase.input);

    const signature = (problem.functionSignature && problem.functionSignature[language]) || null;

    const exec = await runner({
      code: userCode,
      language,
      args: detail.args,
      stdin: detail.stdin,
      format: detail.format,
      signature,
      expected: result.expected,
      returnType: problem.outputFormat && problem.outputFormat.type,
      testCaseId: result.testCaseId,
    });

        result.actual = (exec && exec.output) || '';
    result.error = (exec && exec.error) || null;
    result.errorType = (exec && exec.errorType) || (result.error ? 'RuntimeError' : null);
    result.time = (exec && exec.executionTime) || 0;
    result.passed = !result.error && compareOutputs(result.expected, result.actual, problem.outputFormat);
    } catch (e) {
    result.error = (e && e.message) || String(e);
    result.errorType = 'RuntimeError';
  }
  return result;
}

/**
 * #5 — MAIN GENERIC VALIDATOR.
 * Runs the user's code against every test case (or just the visible samples when
 * `onlySample` defaults true, LeetCode-style). Accepts either a problem document
 * or a problem id (with opts.loadProblem(id) to fetch it).
 *
 * @returns {{
 *   sampleResults: [], allSamplesPassed: boolean,
 *   hidden: { wouldRun, count }, summary: string,
 *   passed: number, total: number
 * }}
 */
async function validateUserCode(problemOrId, userCode, language, opts) {
  const o = opts || {};
  let problem = problemOrId;
  if (typeof problemOrId === 'string' && typeof o.loadProblem === 'function') {
    problem = await o.loadProblem(problemOrId);
  }
  if (!problem) throw new Error('genericValidator: problem not found');

  const testCases = o.testCases || problem.testCases || [];
  const onlySample = o.onlySample !== false;
  const casesToRun = onlySample ? testCases.filter((tc) => !tc.isHidden) : testCases;

  const results = [];
  for (const tc of casesToRun) {
    const r = await validateSingleTestCase(problem, userCode, language, tc, o);
    r.isSample = !tc.isHidden;
    r.isHidden = !!tc.isHidden;
    results.push(r);
  }

  const sampleResults = results.filter((r) => r.isSample);
  const samplePassed = sampleResults.filter((r) => r.passed).length;
  const allSamplesPassed = sampleResults.length > 0 && samplePassed === sampleResults.length;
  const hiddenCount = testCases.filter((tc) => tc.isHidden).length;

    return {
    results,
    sampleResults,
    allSamplesPassed,
    hidden: { wouldRun: allSamplesPassed, count: hiddenCount },
    summary: samplePassed + '/' + sampleResults.length + ' passed',
    passed: results.filter((r) => r.passed).length,
    total: results.length,
  };
}

/**
 * DB-INTEGRATION LAYER -----------------------------------------------------
 * The functions below let the generic engine work against the platform's REAL
 * database documents (CodingProblem) and FUTURE admin-created problems with zero
 * per-problem code:
 *   - Existing docs store test input as LINE-BASED stdin strings (e.g.
 *     "[2,7,11,15]\n9") under sampleTests/hiddenTests with an `output` field,
 *     and their metadata lives in functionSignature (inputFormat/outputFormat
 *     are typically empty). normalizeProblem() derives the generic metadata.
 *   - New admin docs may use JSON test inputs + inputFormat/outputFormat.
 * parseTestCaseInput() detects and handles BOTH formats.
 */

/**
 * Derive generic inputFormat/outputFormat metadata from a per-language function
 * signature ({ name, params:[{name,type}], returnType }).
 */
function deriveFormatFromSignature(fnSig) {
  const params = (fnSig && fnSig.params) || [];
  return {
    inputFormat: { fields: params.map((p) => ({ name: p.name, type: p.type })) },
    outputFormat: { type: (fnSig && fnSig.returnType) || '' },
  };
}

/** Parse one legacy line-based value into its JS value using the declared type. */
function parseLineValue(type, raw) {
  const t = String(type || '').toLowerCase();
  const v = raw == null ? '' : String(raw).trim();
  if (t.endsWith(']') || t.includes('[]')) return JSON.parse(v);
  if (/int|number|long|float|double|decimal/.test(t)) return v === '' ? 0 : Number(v);
  if (t === 'boolean' || t === 'bool') return v.toLowerCase() === 'true';
  if (t === 'char') return v === '' ? '' : v[0];
  return v; // string / raw
}

/** Convert a legacy LINE-BASED test input into positional args (field order). */
function lineInputToArgs(lineInput, fields) {
  const lines = String(lineInput == null ? '' : lineInput).split('\n');
  return fields.map((f, i) => parseLineValue(f.type, lines[i]));
}

/**
 * Parse a test-case input string into { args, stdin, format }. Handles BOTH the
 * new JSON-object format ('{"nums":[...],"target":5}') and the legacy line-based
 * format ('[2,7,11,15]\n9') used by every existing database problem.
 */
function parseTestCaseInput(problem, input) {
  const s = String(input == null ? '' : input).trim();
  const fields = ((problem && problem.inputFormat && problem.inputFormat.fields) || []);
  if (s.startsWith('{')) {
    const detail = _parseDetailed(input, problem.inputFormat);
    return { args: detail.args, stdin: detail.stdin, format: 'json', missing: detail.missing };
  }
  return {
    args: fields.length > 0 ? lineInputToArgs(s, fields) : [s],
    stdin: input == null ? '' : String(input),
    format: 'line',
    missing: [],
  };
}

/** Pick the most usable per-language function signature from a problem doc. */
function pickSignature(doc) {
  const fns = (doc && doc.functionSignature) || {};
  return fns.javascript || fns.typescript || Object.values(fns).find(Boolean) || null;
}

/**
 * Normalize ANY CodingProblem database document into the generic problem shape
 * the engine consumes. Existing docs (empty inputFormat, line-based tests under
 * sampleTests/hiddenTests with `output`, metadata in functionSignature) and new
 * admin docs (inputFormat/outputFormat + JSON testCases) BOTH map to the same
 * shape — this is the compatibility layer that makes ONE validator serve every
 * problem, present and future.
 */
function normalizeProblem(doc) {
  if (!doc) return null;
  const sig = pickSignature(doc);
  const hasFields = doc.inputFormat && Array.isArray(doc.inputFormat.fields) && doc.inputFormat.fields.length > 0;
  const derived = sig
    ? deriveFormatFromSignature(sig)
    : { inputFormat: { fields: [] }, outputFormat: { type: '' } };

  const problem = {
    _id: doc._id,
    title: doc.title,
    slug: doc.slug,
    problemId: doc.problemId,
    inputFormat: hasFields ? doc.inputFormat : derived.inputFormat,
    outputFormat: (doc.outputFormat && doc.outputFormat.type) ? doc.outputFormat : derived.outputFormat,
    referenceSolution: doc.referenceSolution || null,
    functionSignature: doc.functionSignature || null,
    testCases: [],
  };

  if (Array.isArray(doc.testCases) && doc.testCases.length > 0) {
    problem.testCases = doc.testCases.map((tc) => ({
      input: tc.input,
      expectedOutput: (tc.expectedOutput != null ? tc.expectedOutput : tc.output) ?? '',
      isHidden: !!tc.isHidden,
      explanation: tc.explanation || '',
    }));
    return problem;
  }

  const samples = (doc.sampleTests || []).map((tc) => ({
    input: tc.input,
    expectedOutput: (tc.output != null ? tc.output : tc.expectedOutput) ?? '',
    isHidden: false,
    explanation: tc.explanation || '',
  }));
  const hidden = (doc.hiddenTests || []).map((tc) => ({
    input: tc.input,
    expectedOutput: (tc.output != null ? tc.output : tc.expectedOutput) ?? '',
    isHidden: true,
  }));
  problem.testCases = samples.concat(hidden);
  return problem;
}

/**
 * Build a runTestCase-compatible executor that runs user code through the
 * platform's EXISTING sandbox (Judge0/localExecutor), never in-process for
 * untrusted user code. `deps.buildDriverFromSignature` and
 * `deps.executeSingleCase` come from server/utils/judge0Coding.js. The driver is
 * built from the problem's per-language function signature, so the correct
 * function name and typed line/JSON parsing are used automatically.
 */
function createSandboxExecutor(deps) {
  const buildDriver = deps && deps.buildDriverFromSignature;
  const execute = deps && deps.executeSingleCase;
  if (typeof buildDriver !== 'function' || typeof execute !== 'function') {
    throw new Error('genericValidator.createSandboxExecutor: buildDriverFromSignature and executeSingleCase are required');
  }
  return async (task) => {
    const fullCode = buildDriver(task.code, task.language, task.signature || null);
    const raw = await execute(
      fullCode,
      task.language,
      task.stdin != null ? task.stdin : '',
      task.expected || '',
      task.returnType || ''
    );
    return {
      output: raw.output || '',
      error: raw.error || null,
      errorType: raw.errorType || null,
      executionTime: raw.executionTime || 0,
      statusId: raw.status_id || null,
    };
  };
}

// Optional OOP facade over the functional API.
class GenericValidator {
  constructor(problem, opts) {
    this.problem = problem;
    this.opts = opts || {};
  }
  parseInput(inputJson, fmt) {
    return parseInput(inputJson, fmt || this.problem.inputFormat);
  }
  extractFunction(code, lang) {
    return extractFunctionFromCode(code, lang);
  }
  compareOutputs(expected, actual, fmt) {
    return compareOutputs(expected, actual, fmt || this.problem.outputFormat);
  }
  validateTestCase(testCase, userCode, lang) {
    return validateSingleTestCase(this.problem, userCode, lang, testCase, this.opts);
  }
  validate(userCode, lang) {
    return validateUserCode(this.problem, userCode, lang, this.opts);
  }
}

module.exports = {
  // Spec API
  parseInput,
  extractFunctionFromCode,
  extractFunction,
  compareOutputs,
  validateSingleTestCase,
  validateUserCode,
  // Helpers
  GenericValidator,
  serializeValue,
  toStdinLine,
  createSolveFunction,
  computeExpectedFromReference,
  buildFunctionSignature,
  runReferenceTestCases,
    createInProcessExecutor,
  createSandboxExecutor,
  normalizeProblem,
  parseTestCaseInput,
  mapType,
  validateOutput,
  deepEqual,
  _parseDetailed,
};
