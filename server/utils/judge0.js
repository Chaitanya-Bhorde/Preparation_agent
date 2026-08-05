const axios = require('axios');
const { buildFullSubmissionCode } = require('./codeGenerator');
const { outputsMatch } = require('./testCaseCompare');

const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  go: 60,
  rust: 73,
  typescript: 74,
};

const JUDGE0_STATUS = {
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

const JUDGE0_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

const judge0Headers = {
  'Content-Type': 'application/json',
};

if (JUDGE0_API_KEY) {
  judge0Headers['X-RapidAPI-Key'] = JUDGE0_API_KEY;
  judge0Headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
}

const judge0Client = axios.create({
  baseURL: JUDGE0_URL,
  headers: judge0Headers,
});

const createJudge0Submission = async (sourceCode, languageId, stdin) => {
  const response = await judge0Client.post('/submissions', {
    source_code: sourceCode,
    language_id: languageId,
    stdin: stdin,
    wait: false,
  });
  return response.data.token;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const pollJudge0Result = async (token, maxRetries = 15, intervalMs = 1500) => {
  let attempts = 0;
  while (attempts < maxRetries) {
    attempts++;
    try {
      const response = await judge0Client.get(`/submissions/${token}`, {
        params: {
          base64_encoded: false,
          fields: 'stdout,stderr,status_id,status,time,memory,stdin,expected_output,compile_output,message',
        },
      });
      const data = response.data;
      if (data.status_id >= 3) {
        return data;
      }
      if (data.status_id === 1 || data.status_id === 2) {
        await delay(intervalMs);
        continue;
      }
      return data;
    } catch (error) {
      if (attempts >= maxRetries) {
        return {
          status_id: 13,
          status: { description: 'Internal Error' },
          stdout: null,
          stderr: null,
          compile_output: 'Execution timed out after multiple polling attempts.',
          time: null,
          memory: null,
        };
      }
      await delay(intervalMs);
    }
  }
  return {
    status_id: 13,
    status: { description: 'Internal Error' },
    stdout: null,
    stderr: null,
    compile_output: 'Execution timed out after multiple polling attempts.',
    time: null,
    memory: null,
  };
};

const formatError = (data) => {
  if (data.status_id === 6) {
    return { type: 'compilation_error', message: data.compile_output || data.stderr || 'Compilation failed with no output.' };
  }
  if (data.status_id === 5) {
    return { type: 'time_limit_exceeded', message: `Time limit exceeded (${data.time || 'N/A'}s)` };
  }
  if (data.status_id >= 7 && data.status_id <= 12) {
    return { type: 'runtime_error', message: data.stderr || data.message || JUDGE0_STATUS[data.status_id] };
  }
  if (data.status_id === 4) {
    return { type: 'wrong_answer', message: `Wrong Answer: expected "${(data.expected_output || '').trim()}" but got "${(data.stdout || '').trim()}"` };
  }
  return null;
};

const executeSingleCase = async (sourceCode, languageId, input, expectedOutput, isSample = false, returnType) => {
  try {
    const token = await createJudge0Submission(sourceCode, languageId, input);
    const result = await pollJudge0Result(token);

    const stdOut = (result.stdout || '').replace(/\n$/, '');
    const stdErr = result.stderr || '';
    const compileOutput = result.compile_output || '';

    if (result.status_id === 3) {
      const passed = outputsMatch(stdOut, expectedOutput, returnType);
      return {
        passed,
        input: input || '',
        output: stdOut,
        expectedOutput: expectedOutput || '',
        error: null,
        errorType: null,
        status: JUDGE0_STATUS[result.status_id],
        status_id: result.status_id,
        executionTime: result.time || 0,
        memoryUsed: result.memory || 0,
        isSample,
      };
    }

    const errorInfo = formatError(result);
    return {
      passed: result.status_id === 4 ? outputsMatch(stdOut, expectedOutput, returnType) : false,
      input: input || '',
      output: stdOut,
      expectedOutput: expectedOutput || '',
      error: errorInfo ? errorInfo.message : JUDGE0_STATUS[result.status_id],
      errorType: errorInfo ? errorInfo.type : 'unknown',
      status: JUDGE0_STATUS[result.status_id],
      status_id: result.status_id,
      executionTime: result.time || 0,
      memoryUsed: result.memory || 0,
      isSample,
    };
  } catch (err) {
    return {
      passed: false,
      input: input || '',
      output: '',
      expectedOutput: expectedOutput || '',
      error: `Judge0 connection error: ${err.message}`,
      errorType: 'system_error',
      status: 'Internal Error',
      status_id: 13,
      executionTime: 0,
      memoryUsed: 0,
      isSample,
    };
  }
};

const MAX_CONCURRENCY = 5;

const runCasesConcurrently = async (cases, fullCode, languageId, returnType) => {
  const results = [];
  for (let i = 0; i < cases.length; i += MAX_CONCURRENCY) {
    const batch = cases.slice(i, i + MAX_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((tc) => executeSingleCase(fullCode, languageId, tc.input, tc.expectedOutput, tc.isSample, returnType))
    );
    results.push(...batchResults);
  }
  return results;
};

exports.runCode = async (sourceCode, language, testCases, signature) => {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }
  const returnType = signature && signature.returnType ? signature.returnType : '';
  const fullCode = buildFullSubmissionCode(sourceCode, signature, testCases, language);
  const sampleCases = testCases.filter((tc) => !tc.isHidden);
  const casesToRun = sampleCases.length > 0 ? sampleCases : testCases.slice(0, 2);
  return runCasesConcurrently(casesToRun, fullCode, languageId, returnType);
};

exports.submitCode = async (sourceCode, language, testCases, signature) => {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }
  const returnType = signature && signature.returnType ? signature.returnType : '';
  const fullCode = buildFullSubmissionCode(sourceCode, signature, testCases, language);
  return runCasesConcurrently(testCases, fullCode, languageId, returnType);
};

exports.LANGUAGE_IDS = LANGUAGE_IDS;
exports.JUDGE0_STATUS = JUDGE0_STATUS;