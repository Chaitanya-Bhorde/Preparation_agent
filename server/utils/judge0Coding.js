const axios = require('axios');

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
  1: 'queued',
  2: 'queued',
  3: 'processing',
  4: 'accepted',
  5: 'wrong_answer',
  6: 'compilation_error',
  7: 'runtime_error',
  8: 'runtime_error',
  9: 'runtime_error',
  10: 'runtime_error',
  11: 'runtime_error',
  12: 'runtime_error',
  13: 'internal_error',
  14: 'exec_format_error',
};

const JUDGE0_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

const headers = {
  'Content-Type': 'application/json',
};

if (JUDGE0_API_KEY) {
  headers['X-RapidAPI-Key'] = JUDGE0_API_KEY;
  headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
}

const judge0Client = axios.create({
  baseURL: JUDGE0_URL,
  headers,
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

const pollJudge0Result = async (token) => {
  let backoffMs = 1000;
  const maxBackoffMs = 5000;
  const timeoutMs = 15000;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await judge0Client.get(`/submissions/${token}`, {
        params: {
          base64_encoded: false,
          fields: 'stdout,stderr,status_id,status,time,memory,stdin,expected_output,compile_output,message',
        },
      });
      const data = response.data;
      const statusId = data.status_id;

      if (statusId === 1 || statusId === 2) {
        await delay(backoffMs);
        backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
        continue;
      }

      if (statusId === 3) {
        await delay(backoffMs);
        backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
        continue;
      }

      return data;
    } catch (error) {
      if (Date.now() - start >= timeoutMs) {
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
      await delay(backoffMs);
      backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
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
    return { type: 'CompileError', message: data.compile_output || data.stderr || 'Compilation failed with no output.' };
  }
  if (data.status_id === 5) {
    return { type: 'TLE', message: `Time limit exceeded (${data.time || 'N/A'}s)` };
  }
  if (data.status_id >= 7 && data.status_id <= 12) {
    return { type: 'RuntimeError', message: data.stderr || data.message || JUDGE0_STATUS[data.status_id] };
  }
  if (data.status_id === 4) {
    return { type: 'WrongAnswer', message: `Wrong Answer: expected "${(data.expected_output || '').trim()}" but got "${(data.stdout || '').trim()}"` };
  }
  return null;
};

const executeSingleCase = async (sourceCode, languageId, input, expectedOutput) => {
  try {
    const token = await createJudge0Submission(sourceCode, languageId, input);
    const result = await pollJudge0Result(token);

    const stdOut = (result.stdout || '').replace(/\n$/, '');
    const stdErr = result.stderr || '';
    const compileOutput = result.compile_output || '';

    if (result.status_id === 4) {
      const passed = stdOut === (expectedOutput || '').trim();
      const errorInfo = formatError(result);
      return {
        passed,
        input: input || '',
        output: stdOut,
        expectedOutput: expectedOutput || '',
        error: errorInfo ? errorInfo.message : JUDGE0_STATUS[result.status_id],
        errorType: errorInfo ? errorInfo.type : 'WrongAnswer',
        status: JUDGE0_STATUS[result.status_id],
        status_id: result.status_id,
        executionTime: result.time || 0,
        memoryUsed: result.memory || 0,
      };
    }

    if (result.status_id === 3) {
      const passed = stdOut === (expectedOutput || '').trim();
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
      };
    }

    const errorInfo = formatError(result);
    return {
      passed: false,
      input: input || '',
      output: stdOut,
      expectedOutput: expectedOutput || '',
      error: errorInfo ? errorInfo.message : JUDGE0_STATUS[result.status_id],
      errorType: errorInfo ? errorInfo.type : 'unknown',
      status: JUDGE0_STATUS[result.status_id],
      status_id: result.status_id,
      executionTime: result.time || 0,
      memoryUsed: result.memory || 0,
    };
  } catch (err) {
    return {
      passed: false,
      input: input || '',
      output: '',
      expectedOutput: expectedOutput || '',
      error: `Judge0 connection error: ${err.message}`,
      errorType: 'system_error',
      status: 'internal_error',
      status_id: 13,
      executionTime: 0,
      memoryUsed: 0,
    };
  }
};

const buildDriver = (sourceCode, language) => {
  switch (language) {
    case 'python':
      return `${sourceCode}\nimport sys\nfor line in sys.stdin:\n    line=line.rstrip('\\n')\n    print(solve(line))`;
    case 'java':
      return `${sourceCode}\n\nimport java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            String input = sc.nextLine();\n            System.out.println(Solution.solve(input));\n        }\n        sc.close();\n    }\n}`;
    case 'cpp':
      return `${sourceCode}\n\n#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n    ios::sync_with_stdio(false);\n    cin.tie(NULL);\n    string input;\n    if(getline(cin,input)){\n        cout<<solve(input);\n    }\n    return 0;\n}`;
    case 'c':
      return `${sourceCode}\n\n#include <stdio.h>\n#include <string.h>\nint main(){\n    char input[10000];\n    if(fgets(input,10000,stdin)){\n        input[strcspn(input,\"\\n\")]=0;\n        char output[10000];\n        solve(input,output);\n        printf(\"%s\\n\",output);\n    }\n    return 0;\n}`;
    case 'javascript':
    default:
      return `${sourceCode}\n\nconst fs = require('fs');\nconst input = fs.readFileSync(0,'utf8').trim();\nconsole.log(solve(input));`;
  }
};

exports.runCode = async (sourceCode, language, testCases) => {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }
  const fullCode = buildDriver(sourceCode, language);
  const sampleCases = testCases.filter((tc) => !tc.isHidden);
  const casesToRun = sampleCases.length > 0 ? sampleCases : testCases.slice(0, 2);
  const results = [];
  for (const testCase of casesToRun) {
    const result = await executeSingleCase(fullCode, languageId, testCase.input, testCase.expectedOutput);
    results.push(result);
  }
  return results;
};

exports.submitCode = async (sourceCode, language, testCases) => {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }
  const fullCode = buildDriver(sourceCode, language);
  const results = [];
  for (const testCase of testCases) {
    const result = await executeSingleCase(fullCode, languageId, testCase.input, testCase.expectedOutput);
    results.push(result);
  }
  return results;
};

exports.computeVerdict = (results) => {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  let verdict = 'WrongAnswer';
  if (total > 0 && passed === total) {
    verdict = 'Accepted';
  }
  const firstFailed = results.find((r) => !r.passed);
  return {
    verdict,
    passedTestCases: passed,
    totalTestCases: total,
    firstFailedInput: firstFailed ? firstFailed.input : null,
    firstFailedExpected: firstFailed ? firstFailed.expectedOutput : null,
    firstFailedActual: firstFailed ? firstFailed.output : null,
  };
};

exports.LANGUAGE_IDS = LANGUAGE_IDS;
exports.JUDGE0_STATUS = JUDGE0_STATUS;