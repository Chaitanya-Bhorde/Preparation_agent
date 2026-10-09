/**
 * codingExecutionContract.test.js
 * ---------------------------------------------------------------------------
 * End-to-end contract suite for the DSA execution pipeline, exercising the
 * REAL engines (real gcc/g++/javac/node/python) and the REAL routes:
 *
 *   Section 2/3 — error-case classification: for each supported language
 *                 (C, C++, Java, JavaScript, Python) all four outcomes —
 *                 correct, wrong answer, compile error, runtime error — are
 *                 executed locally and must classify exactly.
 *   Section 4   — hidden tests: samples are visible in /run responses, hidden
 *                 cases are executed on /submit but their content never
 *                 appears in the API response or in either persisted
 *                 collection, and a solution that only satisfies the samples
 *                 is NOT Accepted.
 *   Section 5   — Python must run through whichever backend actually exists
 *                 (local python here) and never show a misleading
 *                 "no Python 3 runtime" style message when one does exist.
 *   Section 6   — C# must be rejected with a 400 + UNSUPPORTED_LANGUAGE_MESSAGE
 *                 on both /run and /submit, never judged as WrongAnswer.
 *   Section 7   — engine fallback: 'auto' falls back to local execution when
 *                 Judge0 is unreachable; 'judge0' fails honestly with
 *                 SystemError (never a fake verdict); 'local' never touches
 *                 Judge0 at all.
 *
 * DETERMINISM: JUDGE0_API_URL is pointed at a closed port BEFORE the modules
 * load, so "Judge0 unreachable" is a property of the test, not of the machine.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');

// Must be set before ../routes/coding (and its judge0Coding dependency) loads.
const ORIGINAL_JUDGE0_API_URL = process.env.JUDGE0_API_URL;
process.env.JUDGE0_API_URL = 'http://127.0.0.1:59999';

// Jest does not load server/.env; the auth cookie is built from COOKIE_EXPIRE.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-jwt-secret';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
process.env.COOKIE_EXPIRE = process.env.COOKIE_EXPIRE || '7';

const User = require('../models/User');
const CodeSubmission = require('../models/CodeSubmission');
const Submission = require('../models/Submission');
const CodingProblem = require('../models/CodingProblem');
const codingRouter = require('../routes/coding');
// Mount the auth router on this suite's harness EXACTLY as production does
// (server.js: `app.use('/api/auth', require('./routes/auth'))`) so that
// /api/auth/register resolves instead of falling through to Express's
// default "Cannot POST" 404 handler. Assertions are untouched.
const authRouter = require('../routes/auth');
const errorHandler = require('../middleware/errorHandler');
const localExecutor = require('../utils/localExecutor');
const {
  buildDriverFromSignature,
  executeSingleCase,
  getLanguageSupport,
  LANGUAGE_SUPPORT,
} = require('../utils/judge0Coding');

jest.setTimeout(120000);

// Restore the env for any suite loaded after this file (relevant under
// --runInBand, where process.env is shared across test files).
afterAll(() => {
  if (ORIGINAL_JUDGE0_API_URL === undefined) delete process.env.JUDGE0_API_URL;
  else process.env.JUDGE0_API_URL = ORIGINAL_JUDGE0_API_URL;
});

/* ======================================================== fixtures: code */

const SIG_JS = {
  name: 'twoSum',
  params: [
    { name: 'nums', type: 'number[]' },
    { name: 'target', type: 'number' },
  ],
  returnType: 'number[]',
};

const JS_CORRECT = `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`;

// Passes the sample [2,7,11,15]/9 -> [0,1] but fails the hidden [3,2,4]/6.
const JS_SAMPLE_ONLY = `function twoSum(nums, target) { return [0, 1]; }`;
const JS_WRONG = `function twoSum(nums, target) { return [-1, -1]; }`;
const JS_COMPILE_ERROR = `function twoSum(nums, target) { return [; }`;
const JS_RUNTIME_ERROR = `function twoSum(nums, target) { throw new Error('boom'); }`;
const PY_CORRECT = `def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        need = target - n
        if need in seen:
            return [seen[need], i]
        seen[n] = i
    return []
`;
const PY_COMPILE_ERROR = `def twoSum(nums, target):
    return [)
`;
const PY_RUNTIME_ERROR = `def twoSum(nums, target):
    raise RuntimeError('boom')
`;
const PY_WRONG = `def twoSum(nums, target):
    return [-1, -1]
`;

const JAVA_CORRECT = `class Solution {
    public int[] twoSum(int[] nums, int target) {
        java.util.Map<Integer, Integer> seen = new java.util.HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) return new int[]{seen.get(need), i};
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`;
const JAVA_COMPILE_ERROR = `class Solution {
    public int[] twoSum(int[] nums, int target) { return ; }
}`;
const JAVA_RUNTIME_ERROR = `class Solution {
    public int[] twoSum(int[] nums, int target) { throw new RuntimeException("boom"); }
}`;
const JAVA_WRONG = `class Solution {
    public int[] twoSum(int[] nums, int target) { return new int[]{-1, -1}; }
}`;

const CPP_CORRECT = `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int,int> seen;
        for (int i = 0; i < (int)nums.size(); i++) {
            int need = target - nums[i];
            if (seen.count(need)) return {seen[need], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};`;
const CPP_COMPILE_ERROR = `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) { return ; }
};`;
const CPP_RUNTIME_ERROR = `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) { int* p = nullptr; *p = 1; return {}; }
};`;
const CPP_WRONG = `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) { return {-1, -1}; }
};`;

// C problems carry a C-shaped signature (int* / int are the only sane return
// types the C driver can emit), so C is exercised with a simpler add() probe.
const SIG_C = {
  name: 'add',
  params: [
    { name: 'a', type: 'int' },
    { name: 'b', type: 'int' },
  ],
  returnType: 'int',
};
const C_CORRECT = `int add(int a, int b) { return a + b; }`;
const C_WRONG = `int add(int a, int b) { return a - b; }`;
const C_COMPILE_ERROR = `int add(int a, int b) { return a + ; }`;
const C_RUNTIME_ERROR = `int add(int a, int b) { int* p = 0; *p = a + b; return *p; }`;

const TWOSUM_INPUT = '[2,7,11,15]\\n9';
const TWOSUM_EXPECTED = '[0,1]';
const ADD_INPUT = '3\\n4';
const ADD_EXPECTED = '7';

const hasPython = () => !!localExecutor.detectPython();

/** Build the driver exactly as the routes do, then run ONE case locally. */
async function runLocal(userCode, language, signature, input, expected) {
  const full = buildDriverFromSignature(userCode, language, signature);
  return localExecutor.executeSingleCase(full, language, input, expected, signature.returnType);
}
/* ==================================================== direct local matrix */

describe('local execution matrix — every supported language, every outcome', () => {
  const langs = [
    { name: 'javascript', sig: SIG_JS, correct: JS_CORRECT, wrong: JS_WRONG, compile: JS_COMPILE_ERROR, runtime: JS_RUNTIME_ERROR, input: TWOSUM_INPUT, expected: TWOSUM_EXPECTED },
    { name: 'java', sig: SIG_JS, correct: JAVA_CORRECT, wrong: JAVA_WRONG, compile: JAVA_COMPILE_ERROR, runtime: JAVA_RUNTIME_ERROR, input: TWOSUM_INPUT, expected: TWOSUM_EXPECTED },
    { name: 'cpp', sig: SIG_JS, correct: CPP_CORRECT, wrong: CPP_WRONG, compile: CPP_COMPILE_ERROR, runtime: CPP_RUNTIME_ERROR, input: TWOSUM_INPUT, expected: TWOSUM_EXPECTED },
    { name: 'c', sig: SIG_C, correct: C_CORRECT, wrong: C_WRONG, compile: C_COMPILE_ERROR, runtime: C_RUNTIME_ERROR, input: ADD_INPUT, expected: ADD_EXPECTED },
  ];

  langs.forEach((l) => {
    it(`${l.name}: correct code is Accepted`, async () => {
      const r = await runLocal(l.correct, l.name, l.sig, l.input, l.expected);
      expect(r.error).toBeNull();
      expect(r.errorType).toBeNull();
      expect(r.passed).toBe(true);
      expect(r.status_id).toBe(3);
    });

    it(`${l.name}: wrong code fails WITHOUT an error type (WrongAnswer)`, async () => {
      const r = await runLocal(l.wrong, l.name, l.sig, l.input, l.expected);
      expect(r.passed).toBe(false);
      expect(r.errorType).toBeNull();
      expect(r.error).toBeNull();
    });

    it(`${l.name}: a broken program is CompileError, never WrongAnswer`, async () => {
      const r = await runLocal(l.compile, l.name, l.sig, l.input, l.expected);
      expect(r.passed).toBe(false);
      expect(r.errorType).toBe('CompileError');
      expect(r.status_id).toBe(6);
    });

    it(`${l.name}: a crashing program is RuntimeError, never WrongAnswer`, async () => {
      const r = await runLocal(l.runtime, l.name, l.sig, l.input, l.expected);
      expect(r.passed).toBe(false);
      expect(r.errorType).toBe('RuntimeError');
      expect(r.status_id).toBe(7);
    });
  });

  it('python: correct/wrong/compile/runtime classify like every other language', async () => {
    if (!hasPython()) return; // no local interpreter on this machine — nothing to prove
    const ok = await runLocal(PY_CORRECT, 'python', SIG_JS, TWOSUM_INPUT, TWOSUM_EXPECTED);
    expect(ok.passed).toBe(true);
    expect(ok.errorType).toBeNull();

    const wrong = await runLocal(PY_WRONG, 'python', SIG_JS, TWOSUM_INPUT, TWOSUM_EXPECTED);
    expect(wrong.passed).toBe(false);
    expect(wrong.errorType).toBeNull();

    const compile = await runLocal(PY_COMPILE_ERROR, 'python', SIG_JS, TWOSUM_INPUT, TWOSUM_EXPECTED);
    expect(compile.passed).toBe(false);
    expect(compile.errorType).toBe('CompileError');

    const runtime = await runLocal(PY_RUNTIME_ERROR, 'python', SIG_JS, TWOSUM_INPUT, TWOSUM_EXPECTED);
    expect(runtime.passed).toBe(false);
    expect(runtime.errorType).toBe('RuntimeError');
  });
});
/* ================================================= engine selection policy */

describe('engine selection with Judge0 unreachable (Section 5 & 7)', () => {
  const prevEngine = process.env.CODING_EXECUTION_ENGINE;

  afterEach(() => {
    if (prevEngine === undefined) delete process.env.CODING_EXECUTION_ENGINE;
    else process.env.CODING_EXECUTION_ENGINE = prevEngine;
  });

  const driver = () => buildDriverFromSignature(JS_CORRECT, 'javascript', SIG_JS);

  it("auto (default): Judge0 down -> falls back to local and judges normally", async () => {
    delete process.env.CODING_EXECUTION_ENGINE;
    const r = await executeSingleCase(driver(), 'javascript', TWOSUM_INPUT, TWOSUM_EXPECTED, 'number[]');
    expect(r.passed).toBe(true);
    expect(r.errorType).toBeNull();
  });

  it("auto: wrong code still classifies as a genuine wrong answer after fallback", async () => {
    delete process.env.CODING_EXECUTION_ENGINE;
    const r = await executeSingleCase(
      buildDriverFromSignature(JS_WRONG, 'javascript', SIG_JS),
      'javascript', TWOSUM_INPUT, TWOSUM_EXPECTED, 'number[]'
    );
    expect(r.passed).toBe(false);
    expect(r.errorType).toBeNull();
  });

  it("judge0: fails honestly as system_error — no silent local fallback, no fake verdict", async () => {
    process.env.CODING_EXECUTION_ENGINE = 'judge0';
    const r = await executeSingleCase(driver(), 'javascript', TWOSUM_INPUT, TWOSUM_EXPECTED, 'number[]');
    expect(r.passed).toBe(false);
    expect(r.errorType).toBe('system_error');
    expect(r.status_id).toBe(13);
    expect(String(r.error)).toMatch(/Judge0/i);
  });

  it('local: never touches Judge0 and runs Python through the detected interpreter', async () => {
    process.env.CODING_EXECUTION_ENGINE = 'local';
    if (!hasPython()) return;
    const r = await executeSingleCase(
      buildDriverFromSignature(PY_CORRECT, 'python', SIG_JS),
      'python', TWOSUM_INPUT, TWOSUM_EXPECTED, 'number[]'
    );
    expect(r.passed).toBe(true);
    // The misleading "not installed" message must NOT appear when python exists.
    expect(String(r.error || '')).not.toMatch(/backend is unavailable|no Python 3 runtime/i);
  });

  it('python is detected locally (no misleading "not installed" state)', () => {
    const bin = localExecutor.detectPython();
    if (bin) {
      expect(bin).toMatch(/^(python|python3|py)$/);
      expect(localExecutor.isLocallySupported('python')).toBe(true);
      const support = getLanguageSupport().find((l) => l.id === 'python');
      expect(support.localAvailable).toBe(true);
      expect(support.executable).toBe(true);
    } else {
      // Honest alternative: no interpreter present, the language reports as
      // unavailable instead of pretending to be locally runnable.
      expect(localExecutor.isLocallySupported('python')).toBe(false);
      const support = getLanguageSupport().find((l) => l.id === 'python');
      expect(support.localAvailable).toBe(false);
    }
  });

  it("csharp is flagged unsupported end-to-end (never a pass, never a normal verdict)", async () => {
    delete process.env.CODING_EXECUTION_ENGINE;
    expect(LANGUAGE_SUPPORT.csharp.unsupported).toBe(true);
    expect(LANGUAGE_SUPPORT.csharp.local).toBe(false);
    const r = await executeSingleCase('class Solution { }', 'csharp', 'x', 'y', 'int');
    expect(r.passed).toBe(false);
    expect(r.errorType).toBe('system_error');
    expect(r.status).toBe('unsupported_language');
    expect(String(r.error)).toMatch(/C# execution is currently unavailable/);
  });
});
/* ====================================================== route-level suite */

describe('POST /api/coding/run and /api/coding/submit contracts (Sections 3, 4, 6)', () => {
  let mongoServer;
  let server;
  let baseUrl;
  let cookie;
  let problemId;
  let cProblemId;
  let noTestProblemId;
  const prevEngine = process.env.CODING_EXECUTION_ENGINE;

  const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(require('cookie-parser')());
    app.use('/api/auth', authRouter);
    app.use('/api/coding', codingRouter);
    app.use(errorHandler);
    return app;
  };

  const req = async (p, opts = {}) => {
    const res = await fetch(baseUrl + p, opts);
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, body, raw: text, headers: res.headers };
  };

  const json = (method, p, payload) =>
    req(p, {
      method,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(payload),
    });

  const registerFreshUser = async () => {
    const reg = await json('POST', '/api/auth/register', {
      name: 'Judge Probe',
      email: `judge-probe-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: 'secret123',
    });
    if (reg.status !== 200 && reg.status !== 201) {
      throw new Error(`register failed: ${reg.status} ${reg.raw}`);
    }
    cookie = reg.headers.getSetCookie()[0].split(';')[0];
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    server = buildApp().listen(0);
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    await registerFreshUser();
  });

  afterAll(async () => {
    if (prevEngine === undefined) delete process.env.CODING_EXECUTION_ENGINE;
    else process.env.CODING_EXECUTION_ENGINE = prevEngine;
    await new Promise((r) => server.close(r));
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });
  beforeEach(async () => {
    await Promise.all([
      CodeSubmission.deleteMany({}),
      Submission.deleteMany({}),
      CodingProblem.deleteMany({}),
      User.deleteMany({}),
    ]);
    // Re-register after the user wipe so the cookie stays valid.
    await registerFreshUser();

    const problem = await CodingProblem.create({
      problemId: 'TEST-TWOSUM',
      title: 'Contract Two Sum',
      description: 'Return indices of the two numbers that add up to target.',
      difficulty: 'easy',
      topic: 'Arrays',
      tags: ['Array'],
      sampleTests: [{ input: '[2,7,11,15]\\n9', output: '[0,1]' }],
      hiddenTests: [
        { input: '[3,2,4]\\n6', output: '[1,2]' },
        { input: '[3,3]\\n6', output: '[0,1]' },
      ],
      functionSignature: {
        javascript: SIG_JS,
        python: SIG_JS,
        java: SIG_JS,
        cpp: SIG_JS,
        c: SIG_C,
      },
      isActive: true,
    });
    problemId = problem._id;

    const cProblem = await CodingProblem.create({
      problemId: 'TEST-ADD',
      title: 'Contract Add',
      description: 'Add two integers.',
      difficulty: 'easy',
      topic: 'Math',
      tags: ['Math'],
      sampleTests: [{ input: '3\\n4', output: '7' }],
      hiddenTests: [{ input: '5\\n6', output: '11' }],
      functionSignature: { c: SIG_C },
      isActive: true,
    });
    cProblemId = cProblem._id;

    const noTests = await CodingProblem.create({
      problemId: 'TEST-NOTEST',
      title: 'Contract No Tests',
      description: 'A problem that ships without any test cases.',
      difficulty: 'easy',
      topic: 'Arrays',
      tags: [],
      sampleTests: [],
      hiddenTests: [],
      functionSignature: { javascript: SIG_JS },
      isActive: true,
    });
    noTestProblemId = noTests._id;
  });

  /* --------------------------------------------------------- 400 / 401 */

  it('rejects unauthenticated access to /run and /submit with 401', async () => {
    const r1 = await req('/api/coding/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problemId, language: 'javascript', code: JS_CORRECT }) });
    const r2 = await req('/api/coding/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problemId, language: 'javascript', code: JS_CORRECT }) });
    expect(r1.status).toBe(401);
    expect(r2.status).toBe(401);
  });

  it("C# on /run -> 400 with the UNSUPPORTED message (Section 6)", async () => {
    const r = await json('POST', '/api/coding/run', { problemId, language: 'csharp', code: 'class Solution { }' });
    expect(r.status).toBe(400);
    expect(r.body.success).toBe(false);
    expect(r.body.message).toBe(LANGUAGE_SUPPORT.csharp.reason);
    expect(r.body.data).toBeUndefined();
    expect(r.body.verdict).toBeUndefined();
  });

  it("C# on /submit -> 400 with the UNSUPPORTED message, never judged (Section 6)", async () => {
    const r = await json('POST', '/api/coding/submit', { problemId, language: 'csharp', code: 'class Solution { }' });
    expect(r.status).toBe(400);
    expect(r.body.success).toBe(false);
    expect(r.body.message).toBe(LANGUAGE_SUPPORT.csharp.reason);
    expect(r.body.verdict).toBeUndefined();
    expect(await CodeSubmission.countDocuments({})).toBe(0);
    expect(await Submission.countDocuments({})).toBe(0);
  });

  it('unsupported/unknown languages get a clear 400, not a fake judgement', async () => {
    const r = await json('POST', '/api/coding/run', { problemId, language: 'ruby', code: 'puts 1' });
    expect(r.status).toBe(400);
    expect(r.body.message).toMatch(/not supported/);
  });

  it('missing fields are 400 on BOTH /run and /submit', async () => {
    const cases = [
      { payload: { language: 'javascript', code: JS_CORRECT }, msg: 'Missing problemId' },
      { payload: { problemId, code: JS_CORRECT }, msg: 'Missing language' },
      { payload: { problemId, language: 'javascript' }, msg: 'Missing user code' },
    ];
    for (const c of cases) {
      const run = await json('POST', '/api/coding/run', c.payload);
      expect(run.status).toBe(400);
      expect(run.body.message).toBe(c.msg);
      const submit = await json('POST', '/api/coding/submit', c.payload);
      expect(submit.status).toBe(400);
      expect(submit.body.message).toBe(c.msg);
    }
  });
  /* ------------------------------------------------------ /run verdicts */

  it('/run: correct JS -> Accepted (samples only)', async () => {
    const r = await json('POST', '/api/coding/run', { problemId, language: 'javascript', code: JS_CORRECT });
    expect(r.status).toBe(200);
    expect(r.body.data.verdict).toBe('Accepted');
    expect(r.body.data.status).toBe('accepted');
    expect(r.body.data.passedTestCases).toBe(1);
    expect(r.body.data.totalTestCases).toBe(1);
    expect(r.body.data.testCaseResults[0].isSample).toBe(true);
    expect(r.body.data.testCaseResults[0].input).toBe('[2,7,11,15]\\n9');
  });

  it('/run: wrong JS -> WrongAnswer', async () => {
    const r = await json('POST', '/api/coding/run', { problemId, language: 'javascript', code: JS_WRONG });
    expect(r.body.data.verdict).toBe('WrongAnswer');
    expect(r.body.data.status).toBe('wrong_answer');
  });

  it('/run: syntax error -> CompileError (not WrongAnswer)', async () => {
    const r = await json('POST', '/api/coding/run', { problemId, language: 'javascript', code: JS_COMPILE_ERROR });
    expect(r.body.data.verdict).toBe('CompileError');
    expect(r.body.data.status).toBe('compilation_error');
  });

  it('/run: crash -> RuntimeError (not WrongAnswer)', async () => {
    const r = await json('POST', '/api/coding/run', { problemId, language: 'javascript', code: JS_RUNTIME_ERROR });
    expect(r.body.data.verdict).toBe('RuntimeError');
    expect(r.body.data.status).toBe('runtime_error');
  });

  it('/run: a problem without test cases -> Untested (not WrongAnswer)', async () => {
    const r = await json('POST', '/api/coding/run', { problemId: noTestProblemId, language: 'javascript', code: JS_CORRECT });
    expect(r.body.data.verdict).toBe('Untested');
    expect(r.body.data.status).toBe('untested');
    expect(r.body.data.totalTestCases).toBe(0);
  });

  it('/run: engine failure (judge0 forced, backend down) -> SystemError, never WrongAnswer', async () => {
    process.env.CODING_EXECUTION_ENGINE = 'judge0';
    try {
      const r = await json('POST', '/api/coding/run', { problemId, language: 'javascript', code: JS_CORRECT });
      expect(r.body.data.verdict).toBe('SystemError');
      expect(r.body.data.status).toBe('system_error');
      expect(r.body.data.verdict).not.toBe('WrongAnswer');
    } finally {
      delete process.env.CODING_EXECUTION_ENGINE;
    }
  });

  it('/run: correct Python executes and reports no misleading backend message (Section 5)', async () => {
    if (!hasPython()) return;
    const r = await json('POST', '/api/coding/run', { problemId, language: 'python', code: PY_CORRECT });
    expect(r.body.data.verdict).toBe('Accepted');
    expect(r.raw).not.toMatch(/Python execution backend is unavailable|no Python 3 runtime/i);
  });

  it('/run: correct Java compiles and passes (Section 2)', async () => {
    const r = await json('POST', '/api/coding/run', { problemId, language: 'java', code: JAVA_CORRECT });
    expect(r.body.data.verdict).toBe('Accepted');
    expect(r.body.data.status).toBe('accepted');
  });

  it('/run: correct C++ compiles and passes (Section 2)', async () => {
    const r = await json('POST', '/api/coding/run', { problemId, language: 'cpp', code: CPP_CORRECT });
    expect(r.body.data.verdict).toBe('Accepted');
  });

  it('/run: correct C compiles and passes (Section 2)', async () => {
    const r = await json('POST', '/api/coding/run', { problemId: cProblemId, language: 'c', code: C_CORRECT });
    expect(r.body.data.verdict).toBe('Accepted');
  });
  /* ------------------------------------------- /submit hidden-test gate */

  it('/submit: solution satisfying samples AND hidden -> Accepted, 3/3 (Section 4)', async () => {
    const r = await json('POST', '/api/coding/submit', { problemId, language: 'javascript', code: JS_CORRECT });
    expect(r.status).toBe(201);
    expect(r.body.data.verdict).toBe('Accepted');
    expect(r.body.data.status).toBe('accepted');
    expect(r.body.data.passedTestCases).toBe(3);
    expect(r.body.data.totalTestCases).toBe(3);
    expect(r.body.data.solved).toBe(true);
    expect(r.body.data.verified).toBe(true);

    // Hidden content must never leave the server.
    expect(r.raw).not.toContain('[3,2,4]');
    expect(r.raw).not.toContain('[1,2]');
    const shaped = r.body.data.testCaseResults;
    expect(shaped).toHaveLength(3);
    expect(shaped[0].isSample).toBe(true);
    expect(shaped[1].isSample).toBe(false);
    expect(shaped[1].input).toBeNull();
    expect(shaped[1].expectedOutput).toBeNull();
    expect(shaped[1].actualOutput).toBeNull();

    // Persisted records are redacted too.
    const stored = await CodeSubmission.findOne({ problem: problemId }).sort({ createdAt: -1 });
    expect(stored.testCaseResults[1].input).toBe('');
    expect(stored.testCaseResults[1].expected).toBe('');
    expect(stored.testCaseResults[1].isSample).toBe(false);
    const storedJson = JSON.stringify(stored.toObject());
    expect(storedJson).not.toContain('[3,2,4]');

    const ledger = await Submission.findOne({ problem: problemId }).sort({ createdAt: -1 });
    const ledgerJson = JSON.stringify(ledger.toObject());
    expect(ledgerJson).not.toContain('[3,2,4]');
    expect(ledgerJson).not.toContain('[1,2]');
  });

  it('/submit: sample-only solution is NOT Accepted — hidden cases run and fail (Section 4)', async () => {
    const r = await json('POST', '/api/coding/submit', { problemId, language: 'javascript', code: JS_SAMPLE_ONLY });
    expect(r.status).toBe(201);
    expect(r.body.data.verdict).toBe('WrongAnswer');
    expect(r.body.data.solved).toBe(false);
    // The hidden cases were executed: all three are counted.
    expect(r.body.data.totalTestCases).toBe(3);
    expect(r.body.data.passedTestCases).toBe(2);
    // The first failure is hidden, so no hidden content may be echoed back.
    expect(r.body.data.firstFailedInput).toBeNull();
    expect(r.body.data.firstFailedExpected).toBeNull();
    expect(r.body.data.firstFailedActual).toBeNull();
    expect(r.raw).not.toContain('[3,2,4]');
    expect(r.raw).not.toContain('[1,2]');
  });

  it('/submit: wrong sample stops the gate — only samples run (1 total)', async () => {
    const r = await json('POST', '/api/coding/submit', { problemId, language: 'javascript', code: JS_WRONG });
    expect(r.body.data.verdict).toBe('WrongAnswer');
    expect(r.body.data.totalTestCases).toBe(1);
    expect(r.body.data.passedTestCases).toBe(0);
  });

  it('/submit: compile error on a sample -> CompileError with the right status', async () => {
    const r = await json('POST', '/api/coding/submit', { problemId, language: 'javascript', code: JS_COMPILE_ERROR });
    expect(r.body.data.verdict).toBe('CompileError');
    expect(r.body.data.status).toBe('compilation_error');
  });

  it('/submit: crash on a sample -> RuntimeError with the right status', async () => {
    const r = await json('POST', '/api/coding/submit', { problemId, language: 'javascript', code: JS_RUNTIME_ERROR });
    expect(r.body.data.verdict).toBe('RuntimeError');
    expect(r.body.data.status).toBe('runtime_error');
  });

  it('/submit: correct Python passes samples + hidden with no misleading message (Section 5)', async () => {
    if (!hasPython()) return;
    const r = await json('POST', '/api/coding/submit', { problemId, language: 'python', code: PY_CORRECT });
    expect(r.body.data.verdict).toBe('Accepted');
    expect(r.body.data.totalTestCases).toBe(3);
    expect(r.raw).not.toMatch(/Python execution backend is unavailable|no Python 3 runtime/i);
  });

  it('/submit: engine failure (judge0 forced) -> SystemError, never WrongAnswer', async () => {
    process.env.CODING_EXECUTION_ENGINE = 'judge0';
    try {
      const r = await json('POST', '/api/coding/submit', { problemId, language: 'javascript', code: JS_CORRECT });
      expect(r.status).toBe(201);
      expect(r.body.data.verdict).toBe('SystemError');
      expect(r.body.data.status).toBe('system_error');
      expect(r.body.data.solved).toBe(false);
    } finally {
      delete process.env.CODING_EXECUTION_ENGINE;
    }
  });

  it('/submit: missing or retired problems are 4xx, not misjudgements', async () => {
    const missing = await json('POST', '/api/coding/submit', { problemId: new mongoose.Types.ObjectId(), language: 'javascript', code: JS_CORRECT });
    expect(missing.status).toBe(404);

    await CodingProblem.updateOne({ _id: problemId }, { isActive: false });
    const retired = await json('POST', '/api/coding/submit', { problemId, language: 'javascript', code: JS_CORRECT });
    expect(retired.status).toBe(404);
  });
});







