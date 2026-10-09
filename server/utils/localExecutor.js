/**
 * localExecutor.js
 * ---------------------------------------------------------------------------
 * Runs generated DSA driver programs DIRECTLY on this machine using the
 * installed compilers/interpreters (Java, Node, gcc/g++) — no Docker, no
 * external code-execution API, no API keys. This is the free fallback when
 * Judge0 cannot execute (e.g. Judge0's isolate sandbox is incompatible with
 * Windows Docker Desktop / WSL2 cgroups v2).
 *
 * It mirrors the result shape returned by judge0Coding.executeSingleCase so
 * the run/submit routes and the frontend work unchanged.
 *
 * PERFORMANCE — WHY THIS FILE HAS TWO ENTRY POINTS
 *   executeSingleCase()  : one input -> one result. Kept for compatibility
 *                           with every existing caller (validation scripts,
 *                           legacy run route, unit tests).
 *   executeTestCases()   : MANY inputs -> MANY results, and it COMPILES ONCE.
 *
 *   The original implementation compiled the program inside executeSingleCase,
 *   so a submission with 50 hidden test cases compiled the same source 50
 *   times. Measured on the live problem bank (53 cases): C++ 41,026 ms and
 *   Java 28,908 ms, i.e. 774 ms / 545 ms of pure compiler time per test case.
 *   `prepareProgram()` splits compilation from execution so the batch path
 *   compiles once and then only spawns the resulting binary, and independent
 *   cases run concurrently under a bounded worker pool. The per-case
 *   comparison, verdict classification, timeouts and error messages are
 *   identical to the single-case path, so verdicts do not change.
 * ---------------------------------------------------------------------------
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { outputsMatch } = require('./testCaseCompare');

const PYTHON_CANDIDATES = ['python', 'python3', 'py'];
const CSHARP_CANDIDATES = ['dotnet'];

let pythonBinCache = null;
let pythonProbeDone = false;
let dotnetProbeDone = false;
let dotnetAvailableCache = false;

function commandExists(cmd) {
  try {
    const r = spawnSync(cmd, ['--version'], { windowsHide: true, timeout: 8000 });
    return !!(r && (r.status === 0 || (r.stdout && r.stdout.length > 0) || (r.stderr && r.stderr.length > 0)));
  } catch (_) {
    return false;
  }
}

function detectPython() {
  if (pythonProbeDone) return pythonBinCache;
  pythonProbeDone = true;
  for (const c of PYTHON_CANDIDATES) {
    try {
      const args = c === 'py' ? ['-3', '--version'] : ['--version'];
      const r = spawnSync(c, args, { windowsHide: true, timeout: 8000 });
      const out = ((r.stdout || '') + ' ' + (r.stderr || '')).toString();
      if (r && r.status === 0 && /Python 3/i.test(out)) { pythonBinCache = c; break; }
    } catch (_) {}
  }
  return pythonBinCache;
}

function detectDotnet() {
  if (dotnetProbeDone) return dotnetAvailableCache;
  dotnetProbeDone = true;
  dotnetAvailableCache = commandExists('dotnet');
  return dotnetAvailableCache;
}

const SUPPORTED_LOCAL_LANGUAGES = ['javascript', 'typescript', 'java', 'cpp', 'c', 'python'];

function isLocallySupported(language) {
  const lang = String(language || '').toLowerCase();
  if (lang === 'python') return !!detectPython();
  if (lang === 'csharp' || lang === 'c#' || lang === 'go' || lang === 'rust') return !!detectDotnet() && false;
  return SUPPORTED_LOCAL_LANGUAGES.includes(lang);
}

const TIMEOUT_MS = 10000;

// Compilation is a ONE-TIME setup cost (javac/g++/gcc on the generated driver),
// not the user's algorithm runtime, so it must NOT share the tight execution
// TLE. A cold compiler cache — e.g. the first g++ run pulling in the huge
// <bits/stdc++.h> header — can legitimately take well over 10s; killing it at
// the execution limit made a CORRECT C++ program surface as "compilation
// failed". Compile gets its own generous (still bounded) budget; the 10s TLE
// above continues to govern how long a user's PROGRAM may run.
const COMPILE_TIMEOUT_MS = 60000;

// Bounded worker pool for the batch path. Keeps peak CPU/memory predictable
// (each compiled process is short-lived) while still overlapping the process
// spawn latency that dominates interpreted languages such as Node.
const DEFAULT_BATCH_CONCURRENCY = 4;

/** Spawn a process, feed `input` on stdin, and resolve with captured output. */
function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(cmd, args, { cwd: opts.cwd, windowsHide: true });
    } catch (err) {
      resolve({ ok: false, error: err.message });
      return;
    }
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGKILL'); } catch (_) {}
    }, opts.timeout || TIMEOUT_MS);

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', (err) => { clearTimeout(timer); resolve({ ok: false, error: err.message }); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ ok: true, code, stdout, stderr, timedOut }); });
    child.on('spawn', () => {
      try {
        if (opts.input) child.stdin.write(opts.input);
      } catch (_) {}
      try { child.stdin.end(); } catch (_) {}
    });
  });
}

/** Build a shaped failure result (mirrors judge0Coding result shape). */
function fail({ input, expectedOutput, error, errorType, status, statusId, time }) {
  return {
    passed: false,
    input: input || '',
    output: '',
    expectedOutput: expectedOutput || '',
    error: error || null,
    errorType: errorType || null,
    status: status || 'unknown',
    status_id: statusId || 0,
    executionTime: time || 0,
    memoryUsed: 0,
  };
}

/**
 * Test-case inputs are stored with literal escape sequences (e.g. `[2,7,11,15]\n9`
 * meaning two stdin lines). Translate them to real control characters so the
 * driver's Scanner/readline splits params onto separate lines correctly.
 */
function normalizeStdin(input) {
  return String(input || '')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r');
}

/**
 * Compile (or materialise) a driver program ONCE and return a reusable runner.
 *
 * @returns {{ ok: boolean, dir: string, run?: Function, error?: string,
 *            errorType?: string, status?: string, statusId?: number }}
 *   On failure `ok` is false and the shaped error fields are filled in, so the
 *   caller can turn ONE compile failure into per-test-case results without
 *   re-invoking the compiler for every case.
 */
async function prepareProgram(fullCode, language) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prepagent-local-'));
  let run = null;

  switch (language) {
    case 'java': {
      fs.writeFileSync(path.join(dir, 'Main.java'), fullCode);
      const comp = await runCmd('javac', ['Main.java'], { cwd: dir, timeout: COMPILE_TIMEOUT_MS });
      if (!comp.ok) {
        return { ok: false, dir, error: `javac not found on this machine: ${comp.error}`, errorType: 'system_error', status: 'internal_error', statusId: 13 };
      }
      if (comp.code !== 0) {
        return { ok: false, dir, error: (comp.stderr || comp.stdout || 'Java compilation failed.').trim(), errorType: 'CompileError', status: 'compilation_error', statusId: 6 };
      }
      run = (input) => runCmd('java', ['-cp', '.', 'Main'], { cwd: dir, input });
      break;
    }
    case 'c': {
      fs.writeFileSync(path.join(dir, 'main.c'), fullCode);
      const comp = await runCmd('gcc', ['main.c', '-o', 'main.exe', '-lm'], { cwd: dir, timeout: COMPILE_TIMEOUT_MS });
      if (!comp.ok) {
        return { ok: false, dir, error: `gcc not found on this machine: ${comp.error}`, errorType: 'system_error', status: 'internal_error', statusId: 13 };
      }
      if (comp.code !== 0) {
        return { ok: false, dir, error: (comp.stderr || comp.stdout || 'C compilation failed.').trim(), errorType: 'CompileError', status: 'compilation_error', statusId: 6 };
      }
      const exe = path.join(dir, 'main.exe');
      run = (input) => runCmd(exe, [], { cwd: dir, input });
      break;
    }
    case 'cpp': {
      fs.writeFileSync(path.join(dir, 'main.cpp'), fullCode);
      const comp = await runCmd('g++', ['main.cpp', '-o', 'main.exe', '-std=c++17', '-lm'], { cwd: dir, timeout: COMPILE_TIMEOUT_MS });
      if (!comp.ok) {
        return { ok: false, dir, error: `g++ not found on this machine: ${comp.error}`, errorType: 'system_error', status: 'internal_error', statusId: 13 };
      }
      if (comp.code !== 0) {
        return { ok: false, dir, error: (comp.stderr || comp.stdout || 'C++ compilation failed.').trim(), errorType: 'CompileError', status: 'compilation_error', statusId: 6 };
      }
      const exe = path.join(dir, 'main.exe');
      run = (input) => runCmd(exe, [], { cwd: dir, input });
      break;
    }
    case 'javascript':
    case 'typescript': {
      const script = path.join(dir, 'main.js');
      fs.writeFileSync(script, fullCode);
      // process.execPath is this same Node binary, so the batch path does not
      // depend on a `node` entry existing on PATH.
      run = (input) => runCmd(process.execPath, [script], { cwd: dir, input });
      break;
    }
    case 'python': {
      const bin = detectPython();
      if (!bin) {
        return { ok: false, dir, error: 'Python execution backend is unavailable: no Python 3 runtime was found on this machine. Install Python 3 or configure Judge0 for Python execution.', errorType: 'system_error', status: 'internal_error', statusId: 13 };
      }
      const script = path.join(dir, 'main.py');
      fs.writeFileSync(script, fullCode);
      const args = bin === 'py' ? ['-3', script] : [script];
      run = (input) => runCmd(bin, args, { cwd: dir, input });
      break;
    }
    case 'csharp':
      return { ok: false, dir, error: 'C# execution is currently unavailable because no configured C# runtime exists. C# requires Judge0 or a dotnet SDK that is not installed here.', errorType: 'system_error', status: 'internal_error', statusId: 13 };
    default:
      return { ok: false, dir, error: `Local execution is not available for language "${language}". Supported local languages: JavaScript, TypeScript, Java, C, C++, Python (when a Python 3 runtime is installed).`, errorType: 'system_error', status: 'internal_error', statusId: 13 };
  }

  return { ok: true, dir, run };
}

/**
 * Execute ONE already-prepared input and shape the result exactly like the
 * original single-case implementation (same verdicts, same timeouts, same
 * type-aware comparison), so switching the batch path in cannot change a verdict.
 */
async function runPreparedCase(prepared, language, input, expectedOutput, returnType) {
  const t0 = Date.now();
  const res = await prepared.run(normalizeStdin(input));

  // The Node driver is CommonJS: a syntax error in the user's code is thrown
  // at module-load time, surfacing as a non-zero exit with a stack trace.
  // Classify that as CompileError (matching the Java/C/C++ compile path),
  // not a generic RuntimeError.
  if ((language === 'javascript' || language === 'typescript') &&
      res && res.code !== 0 && /SyntaxError\b/.test(res.stderr || '')) {
    return fail({ input, expectedOutput, error: (res.stderr || res.stdout || 'Syntax error in user code.').trim(), errorType: 'CompileError', status: 'compilation_error', statusId: 6, time: Date.now() - t0 });
  }

  if (language === 'python' &&
      res && res.code !== 0 && /SyntaxError|IndentationError|TabError/i.test((res.stderr || '') + (res.stdout || ''))) {
    return fail({ input, expectedOutput, error: (res.stderr || res.stdout || 'Python syntax error.').trim(), errorType: 'CompileError', status: 'compilation_error', statusId: 6, time: Date.now() - t0 });
  }

  if (!res.ok) throw new Error(res.error);
  if (res.timedOut) {
    return fail({ input, expectedOutput, error: 'Time limit exceeded (local execution)', errorType: 'TLE', status: 'time_limit_exceeded', statusId: 5, time: Date.now() - t0 });
  }
  if (res.code !== 0) {
    return fail({ input, expectedOutput, error: (res.stderr || res.stdout || 'Runtime error (non-zero exit code)').trim(), errorType: 'RuntimeError', status: 'runtime_error', statusId: 7, time: Date.now() - t0 });
  }

  const stdout = (res.stdout || '').replace(/\n$/, '').trim();
  const passed = outputsMatch(stdout, expectedOutput, returnType);
  return {
    passed,
    input: input || '',
    output: stdout,
    expectedOutput: expectedOutput || '',
    error: null,
    errorType: null,
    status: 'accepted',
    status_id: 3,
    executionTime: Date.now() - t0,
    memoryUsed: 0,
  };
}

/** Run `worker` over `items` with at most `limit` calls in flight, order preserved. */
async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const size = Math.max(1, Math.min(limit, items.length));
  const lanes = Array.from({ length: size }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(lanes);
  return results;
}

/**
 * BATCH EXECUTION — compile ONCE, then run every test case against the compiled
 * artifact. This is the path the /api/coding/submit route uses.
 *
 * @param {string} fullCode  generated driver program
 * @param {string} language  java | c | cpp | javascript | typescript | python
 * @param {Array<{input:string, expectedOutput:string}>} cases
 * @param {string} returnType declared return type for type-aware comparison
 * @param {{concurrency?:number}} [options]
 * @returns {Promise<Array>} one shaped result per case, in the input order
 */
async function executeTestCases(fullCode, language, cases, returnType, options = {}) {
  const list = Array.isArray(cases) ? cases : [];
  if (list.length === 0) return [];

  const prepared = await prepareProgram(fullCode, language);
  try {
    if (!prepared.ok) {
      // A compile failure is deterministic for EVERY case: a program that does
      // not build cannot pass any test. Reporting the same compile error for
      // all of them is semantically identical to executing each one, and
      // avoids paying the compiler cost once per case. Verdict, passed count
      // and total count are unchanged; no test case is "skipped".
      return list.map((tc) => fail({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        error: prepared.error,
        errorType: prepared.errorType,
        status: prepared.status,
        statusId: prepared.statusId,
      }));
    }

    const concurrency = options.concurrency || DEFAULT_BATCH_CONCURRENCY;
    return await mapWithConcurrency(list, concurrency, async (tc) => {
      try {
        return await runPreparedCase(prepared, language, tc.input, tc.expectedOutput, returnType);
      } catch (err) {
        return fail({ input: tc.input, expectedOutput: tc.expectedOutput, error: `Local execution error: ${err.message}`, errorType: 'system_error', status: 'internal_error', statusId: 13 });
      }
    });
  } finally {
    try { fs.rmSync(prepared.dir, { recursive: true, force: true }); } catch (_) {}
  }
}

/**
 * @param {string} fullCode     generated driver program (buildDriver / buildDriverFromSignature output)
 * @param {string} language     java | c | cpp | javascript | typescript | python
 * @param {string} input        stdin for the single test case
 * @param {string} expectedOutput
 * @param {string} returnType
 */
async function executeSingleCase(fullCode, language, input, expectedOutput, returnType) {
  const prepared = await prepareProgram(fullCode, language);
  try {
    if (!prepared.ok) {
      return fail({
        input,
        expectedOutput,
        error: prepared.error,
        errorType: prepared.errorType,
        status: prepared.status,
        statusId: prepared.statusId,
      });
    }
    return await runPreparedCase(prepared, language, input, expectedOutput, returnType);
  } catch (err) {
    return fail({ input, expectedOutput, error: `Local execution error: ${err.message}`, errorType: 'system_error', status: 'internal_error', statusId: 13 });
  } finally {
    try { fs.rmSync(prepared.dir, { recursive: true, force: true }); } catch (_) {}
  }
}

module.exports = { executeSingleCase, executeTestCases, prepareProgram, normalizeStdin, mapWithConcurrency, detectPython, detectDotnet, isLocallySupported, SUPPORTED_LOCAL_LANGUAGES };
