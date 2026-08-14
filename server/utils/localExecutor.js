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
 * ---------------------------------------------------------------------------
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { outputsMatch } = require('./testCaseCompare');

const TIMEOUT_MS = 10000;

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
 * @param {string} fullCode     generated driver program (buildDriver / buildDriverFromSignature output)
 * @param {string} language     java | c | cpp | javascript | typescript | python
 * @param {string} input        stdin for the single test case
 * @param {string} expectedOutput
 * @param {string} returnType
 */
async function executeSingleCase(fullCode, language, input, expectedOutput, returnType) {
  const t0 = Date.now();
  // Test-case inputs are stored with literal escape sequences (e.g. `[2,7,11,15]\n9`
  // meaning two stdin lines). Translate them to real control characters so the
  // driver's Scanner/readline splits params onto separate lines correctly.
  const normalizedInput = String(input || '')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prepagent-local-'));
  try {
    let run;
    switch (language) {
      case 'java': {
        fs.writeFileSync(path.join(tmp, 'Main.java'), fullCode);
        const comp = await runCmd('javac', ['Main.java'], { cwd: tmp });
        if (!comp.ok) throw new Error(`javac not found on this machine: ${comp.error}`);
        if (comp.code !== 0) {
          return fail({ input, expectedOutput, error: (comp.stderr || comp.stdout || 'Java compilation failed.').trim(), errorType: 'CompileError', status: 'compilation_error', statusId: 6, time: Date.now() - t0 });
        }
        run = await runCmd('java', ['-cp', '.', 'Main'], { cwd: tmp, input: normalizedInput });
        break;
      }
      case 'c': {
        fs.writeFileSync(path.join(tmp, 'main.c'), fullCode);
        const comp = await runCmd('gcc', ['main.c', '-o', 'main.exe', '-lm'], { cwd: tmp });
        if (!comp.ok) throw new Error(`gcc not found on this machine: ${comp.error}`);
        if (comp.code !== 0) {
          return fail({ input, expectedOutput, error: (comp.stderr || comp.stdout || 'C compilation failed.').trim(), errorType: 'CompileError', status: 'compilation_error', statusId: 6, time: Date.now() - t0 });
        }
        run = await runCmd(path.join(tmp, 'main.exe'), [], { cwd: tmp, input: normalizedInput });
        break;
      }
      case 'cpp': {
        fs.writeFileSync(path.join(tmp, 'main.cpp'), fullCode);
        const comp = await runCmd('g++', ['main.cpp', '-o', 'main.exe', '-std=c++17', '-lm'], { cwd: tmp });
        if (!comp.ok) throw new Error(`g++ not found on this machine: ${comp.error}`);
        if (comp.code !== 0) {
          return fail({ input, expectedOutput, error: (comp.stderr || comp.stdout || 'C++ compilation failed.').trim(), errorType: 'CompileError', status: 'compilation_error', statusId: 6, time: Date.now() - t0 });
        }
        run = await runCmd(path.join(tmp, 'main.exe'), [], { cwd: tmp, input: normalizedInput });
        break;
      }
      case 'javascript':
      case 'typescript': {
        fs.writeFileSync(path.join(tmp, 'main.js'), fullCode);
        run = await runCmd('node', ['main.js'], { cwd: tmp, input: normalizedInput });
        break;
      }
      case 'python':
        return fail({ input, expectedOutput, error: 'Python is not installed on this machine, so local execution cannot run Python. Install Python, or use a hosted execution engine for Python problems.', errorType: 'system_error', status: 'internal_error', statusId: 13 });
      default:
        return fail({ input, expectedOutput, error: `Local execution is not available for language "${language}". This machine supports Java, Node (JavaScript/TypeScript), C and C++.`, errorType: 'system_error', status: 'internal_error', statusId: 13 });
    }

    if (!run.ok) throw new Error(run.error);
    if (run.timedOut) {
      return fail({ input, expectedOutput, error: 'Time limit exceeded (local execution)', errorType: 'TLE', status: 'time_limit_exceeded', statusId: 5, time: Date.now() - t0 });
    }
    if (run.code !== 0) {
      return fail({ input, expectedOutput, error: (run.stderr || run.stdout || 'Runtime error (non-zero exit code)').trim(), errorType: 'RuntimeError', status: 'runtime_error', statusId: 7, time: Date.now() - t0 });
    }

    const stdout = (run.stdout || '').replace(/\n$/, '').trim();
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
  } catch (err) {
    return fail({ input, expectedOutput, error: `Local execution error: ${err.message}`, errorType: 'system_error', status: 'internal_error', statusId: 13 });
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
  }
}

module.exports = { executeSingleCase };
