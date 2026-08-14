const axios = require('axios');
const { outputsMatch } = require('./testCaseCompare');
const { buildCDriver } = require('./codeGenerator');
const localExecutor = require('./localExecutor');

const JUDGE0_URL = process.env.JUDGE0_API_URL || 'http://localhost:2358';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

// Only add RapidAPI headers if using the hosted service (not local Docker)
const isLocalJudge0 = JUDGE0_URL.includes('localhost') || JUDGE0_URL.includes('127.0.0.1');
const judge0Headers = {
  'Content-Type': 'application/json',
};

// Only add RapidAPI headers for hosted Judge0 CE
if (!isLocalJudge0 && JUDGE0_API_KEY) {
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
  if (data.status_id === 13 || data.status_id === 14) {
    // Judge0 reports an *execution-engine* failure (e.g. isolate sandbox can't
    // create /box on Docker Desktop/WSL2, or missing language runtime). Surface
    // Judge0's real `message` so users aren't stuck with a bare "internal error".
    return { type: 'internal_error', message: data.message || JUDGE0_STATUS[data.status_id] };
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

/**
 * Execution entry point with a free fallback.
 * Engine selection via process.env.CODING_EXECUTION_ENGINE:
 *   - 'auto'  (default): try Judge0; if it reports an internal/unreachable
 *                        error (e.g. isolate incompatible with Docker Desktop
 *                        Windows/WSL2), fall back to running locally.
 *   - 'local': always run on this machine (Java/Node/C/C++).
 *   - 'judge0': always use Judge0 (fail with the raw Judge0 error otherwise).
 */
const executeSingleCase = async (sourceCode, language, input, expectedOutput, returnType) => {
  const engine = (process.env.CODING_EXECUTION_ENGINE || 'auto').toLowerCase();

  const tryLocal = async () => {
    try {
      // NOTE: `sourceCode` here is already the full generated driver program
      // (runCode/submitCode pass `fullCode` as the first arg). Pass it straight
      // to the local executor — do NOT re-generate a driver on top of a driver.
      return await localExecutor.executeSingleCase(sourceCode, language, input, expectedOutput, returnType);
    } catch (err) {
      return {
        passed: false,
        input: input || '',
        output: '',
        expectedOutput: expectedOutput || '',
        error: `Local execution error: ${err.message}`,
        errorType: 'system_error',
        status: 'internal_error',
        status_id: 13,
        executionTime: 0,
        memoryUsed: 0,
      };
    }
  };

  if (engine === 'local') {
    return tryLocal();
  }

  const judge0Result = await executeJudge0SingleCase(sourceCode, language, input, expectedOutput, returnType);

  if (engine === 'judge0') {
    return judge0Result;
  }

  // 'auto': fall back to local execution whenever Judge0 failed at the engine
  // level (unreachable, system error, internal/exec-format error) — i.e. any
  // result that is NOT a genuine pass/fail/compile/runtime verdict.
  const failedAtEngine =
    judge0Result.status_id === 13 || judge0Result.status_id === 14 ||
    judge0Result.errorType === 'system_error' ||
    judge0Result.status === 'internal_error';

  if (failedAtEngine) {
    return tryLocal();
  }
  return judge0Result;
};

const executeJudge0SingleCase = async (sourceCode, language, input, expectedOutput, returnType) => {
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
      // Log Java code for debugging
      if (language === 'java') {
        console.log('\n=== Submitting Java Code to Judge0 ===');
        console.log(sourceCode);
        console.log('=====================================\n');
      }
      
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
    
    // Log the error for debugging
    if (statusId >= 6) {
      console.error('Judge0 execution error:', {
        statusId,
        status: JUDGE0_STATUS[statusId],
        compileOutput: data.compile_output,
        stderr: data.stderr,
        stdout: stdOut,
        errorInfo
      });
    }
    
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

const javaParseType = (type) => {
  const map = {
    'int': 'int', 'long': 'long', 'double': 'double', 'float': 'float',
    'boolean': 'boolean', 'bool': 'boolean', 'char': 'char',
    'String': 'String', 'string': 'String',
    'int[]': 'int[]', 'number[]': 'int[]', 'String[]': 'String[]', 'char[]': 'char[]',
    'int[][]': 'int[][]', 'number[][]': 'int[][]', 'char[][]': 'char[][]',
    'List<Integer>': 'java.util.List<Integer>', 'List<String>': 'java.util.List<String>',
  };
  return map[type] || type;
};

const javaParseLine = (p, idx) => {
  const ln = `lines[${idx}]`;
  const t = p.type;
  if (t === 'int') return `int ${p.name} = Integer.parseInt(${ln}.trim());`;
  if (t === 'long') return `long ${p.name} = Long.parseLong(${ln}.trim());`;
  if (t === 'double') return `double ${p.name} = Double.parseDouble(${ln}.trim());`;
  if (t === 'float') return `float ${p.name} = Float.parseFloat(${ln}.trim());`;
  if (t === 'boolean' || t === 'bool') return `boolean ${p.name} = Boolean.parseBoolean(${ln}.trim());`;
  if (t === 'char') return `char ${p.name} = ${ln}.trim().isEmpty() ? ' ' : ${ln}.trim().charAt(0);`;
  if (t === 'String' || t === 'string') return `String ${p.name} = ${ln};`;
  if (t === 'int[]' || t === 'number[]') return `int[] ${p.name} = parseIntArray(${ln});`;
  if (t === 'String[]') return `String[] ${p.name} = parseStringArray(${ln});`;
  if (t === 'int[][]' || t === 'number[][]') return `int[][] ${p.name} = parseIntMatrix(${ln});`;
  if (t === 'char[][]') return `char[][] ${p.name} = parseCharMatrix(${ln});`;
  if (t === 'List<Integer>' || t === 'List<String>') return `${javaParseType(t)} ${p.name} = parseList(${ln});`;
  return `String ${p.name} = ${ln};`;
};

const javaPrintExpr = (varName, returnType) => {
  const t = returnType;
  if (t === 'int[]' || t === 'number[]' || t === 'String[]' || t === 'char[]') {
    return `System.out.println(java.util.Arrays.toString(${varName}));`;
  }
  if (t === 'int[][]' || t === 'number[][]' || t === 'char[][]' || t === 'String[][]') {
    return `System.out.println(java.util.Arrays.deepToString(${varName}));`;
  }
  return `System.out.println(${varName});`;
};

const buildJavaDriver = (userCode, funcName, params, returnType) => {
  const paramList = (params || []).map((p) => p.name).join(', ');
  const parsing = (params || []).map((p, idx) => `        ${javaParseLine(p, idx)}`).join('\n');
  const rt = javaParseType(returnType || 'String');

  // Remove any imports from user code (we'll add them at the top)
  const cleanedCode = userCode.replace(/^import\s+[^;]+;/gm, '').trim();
  
  // Check if user code already has "class Solution" wrapper
  const hasClassWrapper = /class\s+Solution\s*\{/.test(cleanedCode);
  
  let solutionCode;
  if (hasClassWrapper) {
    // User code already has "class Solution { ... }", add static keyword
    solutionCode = cleanedCode.replace(/class\s+Solution\s*\{/, 'static class Solution {');
  } else {
    // Wrap user code in Solution class
    solutionCode = `static class Solution {\n        ${cleanedCode.replace(/\n/g, '\n        ')}\n    }`;
  }

  return `import java.util.*;\n\npublic class Main {\n`
    + `    ${solutionCode}\n`
    + `    static int[] parseIntArray(String s) {\n`
    + `        s = s.replaceAll("[\\\\[\\\\] ]", "").trim();\n`
    + `        if (s.isEmpty()) return new int[0];\n`
    + `        String[] parts = s.split(",");\n`
    + `        int[] arr = new int[parts.length];\n`
    + `        for (int i = 0; i < parts.length; i++) arr[i] = Integer.parseInt(parts[i].trim());\n`
    + `        return arr;\n`
    + `    }\n`
    + `    static int[][] parseIntMatrix(String s) {\n`
    + `        s = s.trim().replaceAll("\\\\s+", "");\n`
    + `        if (s.equals("[]") || s.isEmpty()) return new int[0][0];\n`
    + `        s = s.substring(1, s.length() - 1);\n`
    + `        String[] rows = s.split("\\\\],\\\\[");\n`
    + `        int[][] res = new int[rows.length][];\n`
    + `        for (int i = 0; i < rows.length; i++) {\n`
    + `            String r = rows[i].replace("]", "").replace("[", "").trim();\n`
    + `            if (r.isEmpty()) { res[i] = new int[0]; continue; }\n`
    + `            String[] cells = r.split(",");\n`
    + `            res[i] = new int[cells.length];\n`
    + `            for (int j = 0; j < cells.length; j++) res[i][j] = Integer.parseInt(cells[j].trim());\n`
    + `        }\n`
    + `        return res;\n`
    + `    }\n`
    + `    static String[] parseStringArray(String s) {\n`
    + `        s = s.trim();\n`
    + `        if (s.startsWith("[")) s = s.substring(1);\n`
    + `        if (s.endsWith("]")) s = s.substring(0, s.length() - 1);\n`
    + `        if (s.trim().isEmpty()) return new String[0];\n`
    + `        String[] parts = s.split(",");\n`
    + `        for (int i = 0; i < parts.length; i++) parts[i] = parts[i].trim().replaceAll("^\\"|\\"$", "");\n`
    + `        return parts;\n`
    + `    }\n`
    + `    static char[][] parseCharMatrix(String s) {\n`
    + `        s = s.trim().replaceAll("\\\\s+", "");\n`
    + `        if (s.equals("[]") || s.isEmpty()) return new char[0][0];\n`
    + `        s = s.substring(1, s.length() - 1);\n`
    + `        String[] rows = s.split("\\\\],\\\\[");\n`
    + `        char[][] res = new char[rows.length][];\n`
    + `        for (int i = 0; i < rows.length; i++) {\n`
    + `            String r = rows[i].replaceAll("[\\\\[\\\\]\\\"]", "").replace(",", "").trim();\n`
    + `            res[i] = r.toCharArray();\n`
    + `        }\n`
    + `        return res;\n`
    + `    }\n`
    + `    static <T> List<T> parseList(String s) {\n`
    + `        List<T> list = new ArrayList<>();\n`
    + `        s = s.trim();\n`
    + `        if (s.startsWith("[")) s = s.substring(1);\n`
    + `        if (s.endsWith("]")) s = s.substring(0, s.length() - 1);\n`
    + `        if (s.trim().isEmpty()) return list;\n`
    + `        for (String part : s.split(",")) list.add((T) part.trim());\n`
    + `        return list;\n`
    + `    }\n`
    + `    public static void main(String[] args) {\n`
    + `        Scanner sc = new Scanner(System.in);\n`
    + `        List<String> raw = new ArrayList<>();\n`
    + `        while (sc.hasNextLine()) raw.add(sc.nextLine());\n`
    + `        String[] lines = raw.toArray(new String[0]);\n`
    + `        if (lines.length == 0) return;\n`
    + `        ${parsing}\n`
    + `        ${rt} result = new Main.Solution().${funcName}(${paramList});\n`
    + `        ${javaPrintExpr('result', returnType)}\n`
    + `    }\n`
    + `}\n`;
};

const buildDriver = (sourceCode, language) => {
  switch (language) {
    case 'python':
      return `${sourceCode}\nimport sys\nfor line in sys.stdin:\n    line=line.rstrip('\\n')\n    print(solve(line))`;
    case 'java':
      return buildJavaDriver(sourceCode, 'solve', [], '');
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
      return buildJavaDriver(sourceCode, fn, functionSignature.params || [], functionSignature.returnType || '');
    case 'c':
      return buildCDriver(sourceCode, fn, functionSignature.params || [], functionSignature.returnType || '');
    case 'cpp':
      return buildCppDriver(sourceCode, fn, functionSignature.params || [], functionSignature.returnType || '');
    case 'csharp':
      return `${sourceCode}\n\nusing System;\n\npublic class Program {\n    public static void Main(string[] args) {\n        string input = Console.ReadLine();\n        Console.WriteLine(new Solution().${fn}(${params}));\n    }\n}`;
    case 'javascript':
    case 'typescript':
      return buildJavascriptDriver(sourceCode, fn, functionSignature.params || [], functionSignature.returnType || '');
    default:
      return `${sourceCode}\n\nconst fs = require('fs');\nconst input = fs.readFileSync(0,'utf8').trim();\nconsole.log(${fn}(${params}));`;
  }
};

/**
 * Generate a JS driver that parses each typed parameter from its own stdin line
 * (test-case inputs are JSON-style, e.g. `[2,7,11,15]\n9`) and prints the result
 * in the format outputsMatch() expects.
 */
const buildJavascriptDriver = (userCode, fn, params, returnType) => {
  const parseExpr = (type, name) => {
    const ln = 'lines.shift()';
    const t = (type || '').trim();
    if (t === 'int' || t === 'long' || t === 'number' || t === 'integer') return `const ${name} = parseInt(${ln}, 10);`;
    if (t === 'double' || t === 'float' || t === 'decimal') return `const ${name} = parseFloat(${ln});`;
    if (t === 'boolean' || t === 'bool') return `const ${name} = (${ln}).trim().toLowerCase() === 'true';`;
    if (t === 'char') return `const ${name} = (${ln}).trim().charAt(0);`;
    if (t === 'String' || t === 'string') return `const ${name} = ${ln};`;
    // arrays / lists / matrices parse cleanly from JSON-style input
    return `const ${name} = JSON.parse(${ln});`;
  };
  const parsing = (params || []).map((p) => parseExpr(p.type, p.name)).join('\n');
  const args = (params || []).map((p) => p.name).join(', ');
  const printExpr = `const result = ${fn}(${args});\nconst out = Array.isArray(result) ? JSON.stringify(result) : (typeof result === 'string' ? result : String(result));\nconsole.log(out);`;
  return `${userCode}\n\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\nconst lines = input.split('\\n').filter((l) => l.trim() !== '');\n${parsing}\n${printExpr}\n`;
};

/**
 * Generate a C++ driver that parses each typed parameter from its own stdin line
 * and prints the result in a form outputsMatch() normalizes correctly.
 */
const buildCppDriver = (userCode, fn, params, returnType) => {
  const argDecls = [];
  for (let i = 0; i < params.length; i++) {
    const p = params[i];
    const t = (p.type || '').trim();
    const ln = `lines[${i}]`;
    if (t === 'int' || t === 'integer' || t === 'number') {
      argDecls.push(`    int ${p.name} = stoi(${ln}.size() ? ${ln} : "0");`);
    } else if (t === 'long') {
      argDecls.push(`    long long ${p.name} = ${ln}.size() ? stoll(${ln}) : 0;`);
    } else if (t === 'double' || t === 'float') {
      argDecls.push(`    double ${p.name} = ${ln}.size() ? stod(${ln}) : 0;`);
    } else if (t === 'bool' || t === 'boolean') {
      argDecls.push(`    bool ${p.name} = (${ln} == "true" || ${ln} == "1");`);
    } else if (t === 'char') {
      argDecls.push(`    char ${p.name} = ${ln}.empty() ? ' ' : ${ln}[0];`);
    } else if (t === 'string' || t === 'String') {
      argDecls.push(`    string ${p.name} = ${ln};`);
    } else if (t === 'vector<int>' || t === 'int[]' || t === 'number[]') {
      argDecls.push(`    vector<int> ${p.name} = parseIntArray(${ln});`);
    } else if (t === 'vector<string>' || t === 'String[]' || t === 'string[]') {
      argDecls.push(`    vector<string> ${p.name} = parseStringArray(${ln});`);
    } else if (t === 'vector<vector<int>>' || t === 'int[][]' || t === 'number[][]') {
      argDecls.push(`    vector<vector<int>> ${p.name} = parseIntMatrix(${ln});`);
    } else {
      argDecls.push(`    auto ${p.name} = ${ln};`);
    }
  }
  const args = params.map((p) => p.name).join(', ');
  const printStmt = `    printResult(result);`;
  const hasClass = /class\s+Solution/.test(userCode || '');
  const invoke = hasClass ? `Solution().${fn}(${args})` : `${fn}(${args})`;

  return `#include <bits/stdc++.h>
using namespace std;

${userCode}

static vector<string> splitLines(const string& s) {
    vector<string> out;
    string cur;
    for (char c : s) { if (c == '\\n') { if (!cur.empty()) out.push_back(cur); cur.clear(); } else cur.push_back(c); }
    if (!cur.empty()) out.push_back(cur);
    return out;
}
static vector<int> parseIntArray(const string& raw) {
    vector<int> res;
    string r = raw;
    r.erase(remove(r.begin(), r.end(), '['), r.end());
    r.erase(remove(r.begin(), r.end(), ']'), r.end());
    replace(r.begin(), r.end(), ',', ' ');
    istringstream iss(r);
    int v; while (iss >> v) res.push_back(v);
    return res;
}
static vector<string> parseStringArray(const string& raw) {
    vector<string> res;
    string r = raw;
    r.erase(remove(r.begin(), r.end(), '['), r.end());
    r.erase(remove(r.begin(), r.end(), ']'), r.end());
    r.erase(remove(r.begin(), r.end(), '\"'), r.end());
    istringstream iss(r);
    string v; while (iss >> v) res.push_back(v);
    return res;
}
static vector<vector<int>> parseIntMatrix(const string& raw) {
    vector<vector<int>> res;
    string r = raw;
    r.erase(remove(r.begin(), r.end(), ' '), r.end());
    if (r == "[]") return res;
    r = r.substr(1, r.size() - 2);
    size_t pos = 0;
    while (pos < r.size()) {
        size_t end = r.find("],[", pos);
        if (end == string::npos) end = r.size();
        string row = r.substr(pos, end - pos);
        if (!row.empty()) row.erase(remove(row.begin(), row.end(), '['), row.end());
        if (!row.empty()) row.erase(remove(row.begin(), row.end(), ']'), row.end());
        res.push_back(parseIntArray("[" + row + "]"));
        if (end == r.size()) break;
        pos = end + 3;
    }
    return res;
}
template <typename T>
void printResult(const vector<T>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) cout << ","; cout << v[i]; }
    cout << "]";
}
template <typename T>
void printResult(const vector<vector<T>>& vv) {
    cout << "[";
    for (size_t i = 0; i < vv.size(); i++) { if (i) cout << ","; printResult(vv[i]); }
    cout << "]";
}
void printResult(const string& s) { cout << s; }
template <typename T>
void printResult(const T& x) { cout << x; }

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);
    string all((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
    auto lines = splitLines(all);
${argDecls.join('\n')}
    auto result = ${invoke};
    printResult(result);
    cout << "\\n";
    return 0;
}
`;
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