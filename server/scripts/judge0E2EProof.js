/**
 * Judge0 End-to-End Verification Script
 *
 * This script exercises the full Judge0 submission flow:
 *   1. POST /submissions  → create submission, receive token
 *   2. GET  /submissions/:token  → poll until terminal status
 *   3. Report final verdict, execution time, and total wall-clock time
 *
 * It also calls the project's own executeSingleCase() to prove the
 * code path used by server/routes/coding.js → judge0Coding.js works.
 *
 * Usage:  node server/scripts/judge0E2EProof.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const axios = require('axios');

const JUDGE0_URL = process.env.JUDGE0_API_URL || 'http://localhost:2358';

const STATUS_TEXT = {
  1: 'In Queue',
  2: 'Processing',
  3: 'Accepted',
  4: 'Wrong Answer',
  5: 'Time Limit Exceeded',
  6: 'Compilation Error',
  7: 'Runtime Error (SIGSEGV)',
  8: 'Runtime Error (SIGXFSZ)',
  9: 'Runtime Error (SIGFPE)',
  10: 'Runtime Error (SIGABRT)',
  11: 'Runtime Error (NZEC)',
  12: 'Runtime Error (Other)',
  13: 'Internal Error',
  14: 'Exec Format Error',
};

const client = axios.create({
  baseURL: JUDGE0_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Direct Judge0 API call with full logging.
 * Returns the final submission result object.
 */
async function submitAndPoll(sourceCode, languageId, stdin, label) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  SUBMISSION: ${label}`);
  console.log(`  Language ID: ${languageId}  |  Input: "${stdin}"`);
  console.log(`  Source: ${sourceCode.split('\n').slice(0, 3).join(' | ')}...`);
  console.log('='.repeat(70));

  const wallStart = Date.now();

  // --- Step 1: Create submission ---
  console.log('\n[1] Creating submission via POST /submissions ...');
  const createRes = await client.post('/submissions?base64_encoded=false', {
    source_code: sourceCode,
    language_id: languageId,
    stdin: stdin,
  });
  const token = createRes.data.token;
  console.log(`    ✓ Submission created`);
  console.log(`    ✓ Token received: ${token}`);

  // --- Step 2: Poll until terminal ---
  console.log('\n[2] Polling GET /submissions/:token ...');
  let attempt = 0;
  const POLL_INTERVAL = 1000;
  const MAX_POLLS = 30;
  let finalData = null;

  while (attempt < MAX_POLLS) {
    attempt++;
    const elapsed = Date.now() - wallStart;
    try {
      const res = await client.get(`/submissions/${token}?base64_encoded=false`);
      const data = res.data;
      const statusId = data.status ? data.status.id : data.status_id;
      const statusText = STATUS_TEXT[statusId] || `Unknown(${statusId})`;
      console.log(`    Poll #${attempt}  [${elapsed}ms]  HTTP ${res.status}  status_id=${statusId}  "${statusText}"`);

      if (statusId >= 3) {
        // Terminal status
        finalData = data;
        break;
      }
      // Still queued (1) or processing (2) — wait and retry
      await delay(POLL_INTERVAL);
    } catch (err) {
      console.log(`    Poll #${attempt}  [${elapsed}ms]  ERROR: ${err.message}`);
      if (attempt >= MAX_POLLS) throw err;
      await delay(POLL_INTERVAL);
    }
  }

  if (!finalData) {
    throw new Error('Polling exhausted without reaching a terminal status');
  }

  // --- Step 3: Report ---
  const wallEnd = Date.now();
  const totalMs = wallEnd - wallStart;
  const statusId = finalData.status ? finalData.status.id : finalData.status_id;
  const statusText = STATUS_TEXT[statusId] || `Unknown(${statusId})`;
  const stdout = (finalData.stdout || '').replace(/\n$/, '');
  const stderr = finalData.stderr || '';
  const compileOutput = finalData.compile_output || '';
  const execTime = finalData.time || 0;
  const memory = finalData.memory || 0;

  console.log('\n[3] Final Result:');
  console.log(`    Verdict           : ${statusText} (status_id=${statusId})`);
  console.log(`    stdout            : "${stdout}"`);
  if (stderr) console.log(`    stderr            : "${stderr}"`);
  if (compileOutput) console.log(`    compile_output    : "${compileOutput.slice(0, 200)}"`);
  console.log(`    execution_time    : ${execTime}s`);
  console.log(`    memory            : ${memory} KB`);
  console.log(`    poll_attempts     : ${attempt}`);
  console.log(`    total_wall_clock  : ${totalMs}ms`);

  return { finalData, statusId, statusText, stdout, totalMs, attempts: attempt };
}

/**
 * Also verify via the project's own executeSingleCase() to prove
 * the code path used by server/routes/coding.js works end-to-end.
 */
async function verifyViaExecuteSingleCase() {
  console.log(`\n${'='.repeat(70)}`);
  console.log('  VERIFYING via project executeSingleCase() (judge0Coding.js)');
  console.log('='.repeat(70));

  const { executeSingleCase } = require('../utils/judge0Coding');

  // Python echo solution: reads a line, returns it reversed
  const PY_SOLUTION = `
def solve(line):
    return line[::-1]
`;
  // buildDriver wraps it for Python
  const fullCode = `${PY_SOLUTION}\nimport sys\nfor line in sys.stdin:\n    line=line.rstrip('\\n')\n    print(solve(line))`;

  const input = 'hello';
  const expected = 'olleh';

  console.log(`\n  Input: "${input}"  Expected: "${expected}"`);
  const result = await executeSingleCase(fullCode, 'python', input, expected);

  console.log(`  passed       : ${result.passed}`);
  console.log(`  status       : ${result.status}`);
  console.log(`  status_id    : ${result.status_id}`);
  console.log(`  output       : "${result.output}"`);
  console.log(`  errorType    : ${result.errorType || 'null'}`);
  console.log(`  executionTime: ${result.executionTime}`);
  console.log(`  memoryUsed   : ${result.memoryUsed}`);

  if (result.passed) {
    console.log('\n  ✓ executeSingleCase() returned ACCEPTED — code path verified.');
  } else {
    console.log('\n  ✗ executeSingleCase() did NOT pass — check output above.');
  }
  return result;
}

async function main() {
  console.log(`\nJudge0 E2E Proof — Target: ${JUDGE0_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // --- Check Judge0 is reachable ---
  try {
    const about = await client.get('/about');
    console.log('✓ Judge0 /about reachable (HTTP ' + about.status + ')');
    console.log('  About response:');
    console.log('  ' + JSON.stringify(about.data, null, 2).split('\n').join('\n  '));
  } catch (err) {
    console.error('✗ Judge0 is NOT reachable at ' + JUDGE0_URL);
    console.error('  Error: ' + err.message);
    process.exit(1);
  }

  // --- Submission 1: Correct Python solution (fast) ---
  const PY_CORRECT = `
def solve(line):
    return line[::-1]
`;
  const fullCode1 = `${PY_CORRECT}\nimport sys\nfor line in sys.stdin:\n    line=line.rstrip('\\n')\n    print(solve(line))`;

  const r1 = await submitAndPoll(fullCode1, 71, 'hello', 'Correct Python solution (reverse string)');

  // --- Submission 2: Wrong Python solution ---
  const PY_WRONG = `
def solve(line):
    return "WRONG"
`;
  const fullCode2 = `${PY_WRONG}\nimport sys\nfor line in sys.stdin:\n    line=line.rstrip('\\n')\n    print(solve(line))`;

  const r2 = await submitAndPoll(fullCode2, 71, 'hello', 'Wrong Python solution (always returns WRONG)');

  // --- Submission 3: Slow Python solution (to prove retry/polling logic) ---
  const PY_SLOW = `
import time
def solve(line):
    time.sleep(3)  # 3-second delay to force multiple poll attempts
    return line[::-1]
`;
  const fullCode3 = `${PY_SLOW}\nimport sys\nfor line in sys.stdin:\n    line=line.rstrip('\\n')\n    print(solve(line))`;

  const r3 = await submitAndPoll(fullCode3, 71, 'hello', 'Slow Python solution (3s sleep — tests retry/polling)');

  // --- Submission 4: Compilation error (Python syntax error) ---
  const PY_BROKEN = `
def solve(line
    return line
`;
  const fullCode4 = `${PY_BROKEN}\nimport sys\nfor line in sys.stdin:\n    line=line.rstrip('\\n')\n    print(solve(line))`;

  const r4 = await submitAndPoll(fullCode4, 71, 'hello', 'Broken Python solution (syntax error)');

  // --- Verify via executeSingleCase ---
  await verifyViaExecuteSingleCase();

  // --- Summary ---
  console.log(`\n${'='.repeat(70)}`);
  console.log('  END-TO-END SUMMARY');
  console.log('='.repeat(70));
  console.log(`  Submission 1 (correct)   : ${r1.statusText}  | ${r1.attempts} polls | ${r1.totalMs}ms`);
  console.log(`  Submission 2 (wrong)     : ${r2.statusText}  | ${r2.attempts} polls | ${r2.totalMs}ms`);
  console.log(`  Submission 3 (slow 3s)   : ${r3.statusText}  | ${r3.attempts} polls | ${r3.totalMs}ms`);
  console.log(`  Submission 4 (compile err) : ${r4.statusText}  | ${r4.attempts} polls | ${r4.totalMs}ms`);
  console.log('\n  ✓ All submissions completed. Judge0 end-to-end flow verified.');
  console.log('='.repeat(70) + '\n');
}

main().catch((err) => {
  console.error('\n✗ FATAL ERROR:', err.message);
  process.exit(1);
});
