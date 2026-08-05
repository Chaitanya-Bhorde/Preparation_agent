const axios = require('axios');
const { outputsMatch } = require('./testCaseCompare');
const { buildCDriver } = require('./codeGenerator');

const JUDGE0_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

// On the hosted ce.judge0.com / RapidAPI endpoint an API key is required.
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
  timeout: 30000,
});

const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  csharp: 51,
  go: 60,
  rust: 73,
  typescript: 74,
};

const JUDGE0_STATUS = {
  1: 'queued',
  2: 'processing',
  3: 'accepted',
  4: 'wrong_answer',
  5: 'time_limit_exceeded',
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

const MAX_POLL_ATTEMPTS = 12;
const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 30000;

const isJudge0Reachable = async () => {
  try {
    await judge0Client.get('/about', { timeout: 3000 });
    return true;
  } catch (_) {
    try {
      await judge0Client.get('/status', { timeout: 3000 });
      return true;
    } catch (_) {
      return false;
    }
  }
};

const normalizeLanguage = (language) => {
  return (language || '').toLowerCase();
};

const formatJudge0Error = (data) => {
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

const pollJudge0Submission = async (token) => {
  const start = Date.now();
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    try {
      const { data } = await judge0Client.get(`/submissions/${token}?base64_encoded=false`);
      const statusId = data.status ? data.status.id : data.status_id;
      if (statusId >= 3) {
        return data;
      }
      if (Date.now() - start > POLL_TIMEOUT_MS) {
        throw new Error('Judge0 polling timed out after 30s while still processing');
      }
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    } catch (err) {
      if (Date.now() - start > POLL_TIMEOUT_MS || (err.code && err.code !== 'ECONNABORTED')) {
        throw err;
      }
    }
  }
  throw new Error('Judge0 polling exhausted max attempts while still in processing status');
};

const executeSingleCase = async (sourceCode, language, input, expectedOutput, returnType) => {
  const languageId = LANGUAGE_IDS[normalizeLanguage(language)];
  if (!languageId) {
    return {
      passed: false,
      input: input || '',
      output: '',
      expectedOutput: expectedOutput || '',
      error: `Unsupported language: ${language}`,
      errorType: 'system_error',
      status: 'unknown',
      status_id: 13,
      executionTime: 0,
      memoryUsed: 0,
    };
  }

  try {
    let response;
    try {
      const createRes = await judge0Client.post(
        '/submissions?base64_encoded=false',
        {
          source_code: sourceCode,
          language_id: languageId,
          stdin: input || '',
        },
        { timeout: 30000 }
      );
      const token = createRes.data.token;
      const data = await pollJudge0Submission(token);
      response = { data };
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ECONNRESET' || err.message.includes('timeout')) {
        return {
          passed: false,
          input: input || '',
          output: '',
          expectedOutput: expectedOutput || '',
          error: 'Judge0 is not running on http://localhost:2358. Please start Docker Desktop and run `docker-compose up -d` in the judge0-server directory.',
          errorType: 'system_error',
          status: 'internal_error',
          status_id: 13,
          executionTime: 0,
          memoryUsed: 0,
        };
      }
      throw err;
    }

    const data = response.data;
    const statusId = data.status ? data.status.id : data.status_id;

    const stdOut = (data.stdout || '').replace(/\n$/, '');
    const stdErr = data.stderr || '';
    const compileOutput = data.compile_output || '';

    if (statusId === 4) {
      const passed = outputsMatch(stdOut, expectedOutput, returnType);
      const errorInfo = formatJudge0Error({ ...data, status_id: statusId });
      return {
        passed,
        input: input || '',
        output: stdOut,
        expectedOutput: expectedOutput || '',
        error: errorInfo ? errorInfo.message : JUDGE0_STATUS[statusId],
        errorType: errorInfo ? errorInfo.type : 'WrongAnswer',
        status: JUDGE0_STATUS[statusId],
        status_id: statusId,
        executionTime: data.time || 0,
        memoryUsed: data.memory || 0,
      };
    }

    if (statusId === 3) {
      const passed = outputsMatch(stdOut, expectedOutput, returnType);
      return {
        passed,
        input: input || '',
        output: stdOut,
        expectedOutput: expectedOutput || '',
        error: null,
        errorType: null,
        status: JUDGE0_STATUS[statusId],
        status_id: statusId,
        executionTime: data.time || 0,
        memoryUsed: data.memory || 0,
      };
    }

    const errorInfo = formatJudge0Error({ ...data, status_id: statusId });
    return {
      passed: false,
      input: input || '',
      output: stdOut,
      expectedOutput: expectedOutput || '',
      error: errorInfo ? errorInfo.message : JUDGE0_STATUS[statusId],
      errorType: errorInfo ? errorInfo.type : 'unknown',
      status: JUDGE0_STATUS[statusId],
      status_id: statusId,
      executionTime: data.time || 0,
      memoryUsed: data.memory || 0,
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

const buildDriverFromSignature = (sourceCode, language, functionSignature) => {
  if (!functionSignature) return buildDriver(sourceCode, language);
  const fn = functionSignature.name || 'solve';
  const params = (functionSignature.params || []).map((p) => p.name || 'input').join(', ');
  switch (language) {
    case 'python':
      return `${sourceCode}\nimport sys\nfor line in sys.stdin:\n    line=line.rstrip('\\n')\n    print(${fn}(${params}))`;
    case 'java':
      return `${sourceCode}\n\nimport java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            String input = sc.nextLine();\n            System.out.println(Solution.${fn}(${params}));\n        }\n        sc.close();\n    }\n}`;
    case 'c':
      return buildCDriver(sourceCode, fn, functionSignature.params || [], functionSignature.returnType || '');
    case 'cpp':
      return `${sourceCode}\n\n#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n    ios::sync_with_stdio(false);\n    cin.tie(NULL);\n    string input;\n    if(getline(cin,input)){\n        cout<<${fn}(${params});\n    }\n    return 0;\n}`;
    case 'csharp':
      return `${sourceCode}\n\nusing System;\n\npublic class Program {\n    public static void Main(string[] args) {\n        string input = Console.ReadLine();\n        Console.WriteLine(Solution.${fn}(${params}));\n    }\n}`;
    case 'javascript':
    default:
      return `${sourceCode}\n\nconst fs = require('fs');\nconst input = fs.readFileSync(0,'utf8').trim();\nconsole.log(${fn}(${params}));`;
  }
};

exports.runCode = async (sourceCode, language, testCases, fullCodeOverride, returnType) => {
  const languageId = LANGUAGE_IDS[normalizeLanguage(language)];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }
  const fullCode = fullCodeOverride || buildDriver(sourceCode, language);
  const sampleCases = testCases.filter((tc) => !tc.isHidden);
  const casesToRun = sampleCases.length > 0 ? sampleCases : testCases.slice(0, 2);
  const results = [];
  for (const testCase of casesToRun) {
    const result = await executeSingleCase(fullCode, language, testCase.input, testCase.expectedOutput, returnType);
    results.push(result);
  }
  return results;
};

exports.submitCode = async (sourceCode, language, testCases, fullCodeOverride, returnType) => {
  const languageId = LANGUAGE_IDS[normalizeLanguage(language)];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }
  const fullCode = fullCodeOverride || buildDriver(sourceCode, language);
  const results = [];
  for (const testCase of testCases) {
    const result = await executeSingleCase(fullCode, language, testCase.input, testCase.expectedOutput, returnType);
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

exports.buildDriver = buildDriver;
exports.buildDriverFromSignature = buildDriverFromSignature;
exports.LANGUAGE_IDS = LANGUAGE_IDS;
exports.JUDGE0_STATUS = JUDGE0_STATUS;
exports.normalizeLanguage = normalizeLanguage;
exports.executeSingleCase = executeSingleCase;
exports.isJudge0Reachable = isJudge0Reachable;