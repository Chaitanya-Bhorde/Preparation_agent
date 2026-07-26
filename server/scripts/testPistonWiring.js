const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');

const PYTHON_SOLUTION = `
def solve(line):
    import re
    text = line
    n = int(re.search(r"n=(\\d+)", text).group(1))
    m = int(re.search(r"m=(\\d+)", text).group(1))
    edges = re.search(r"edges=\\[(.*)\\]", text).group(1)
    if edges.strip():
        pairs = re.findall(r"\\((\\d+),(\\d+)\\)", edges)
        adj = [[] for _ in range(n)]
        for u, v in pairs:
            a, b = int(u), int(v)
            adj[a].append(b)
            adj[b].append(a)
    else:
        adj = [[] for _ in range(n)]
    source = int(re.search(r"source=(\\d+)", text).group(1))
    destination = int(re.search(r"destination=(\\d+)", text).group(1))
    from collections import deque
    dist = [-1] * n
    dist[source] = 0
    q = deque([source])
    while q:
        u = q.popleft()
        if u == destination:
            break
        for v in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                q.append(v)
    return str(dist[destination] if destination < n and dist[destination] != -1 else -1)
`;

const JAVA_SOLUTION = `
import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) { sc.close(); return; }
        String line = sc.nextLine();
        sc.close();
        System.out.println(Solution.solve(line));
    }
}
class Solution {
    public static String solve(String text) {
        int n = Integer.parseInt(text.replaceAll(".*n=(\\d+).*", "$1").trim());
        int m = Integer.parseInt(text.replaceAll(".*m=(\\d+).*", "$1").trim());
        List<int[]> edges = new ArrayList<>();
        String edgeBlock = text.replaceAll(".*edges=\\[(.*)\\].*", "$1").trim();
        if (!edgeBlock.isEmpty()) {
            for (String pair : edgeBlock.split("(?<=\\)),(?=\\()")) {
                pair = pair.trim();
                String[] nums = pair.replaceAll("[\\(\\)]", "").split(",");
                edges.add(new int[]{Integer.parseInt(nums[0].trim()), Integer.parseInt(nums[1].trim())});
            }
        }
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
        }
        int source = Integer.parseInt(text.replaceAll(".*source=(\\d+).*", "$1").trim());
        int destination = Integer.parseInt(text.replaceAll(".*destination=(\\d+).*", "$1").trim());
        int[] dist = new int[n];
        Arrays.fill(dist, -1);
        dist[source] = 0;
        Queue<Integer> q = new ArrayDeque<>();
        q.add(source);
        while (!q.isEmpty()) {
            int u = q.poll();
            if (u == destination) break;
            for (int v : adj.get(u)) {
                if (dist[v] == -1) {
                    dist[v] = dist[u] + 1;
                    q.add(v);
                }
            }
        }
        return String.valueOf(destination < n && dist[destination] != -1 ? dist[destination] : -1);
    }
}
`;

const WRONG_SOLUTION_PY = `
def solve(line):
    return "0"
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const printResult = (label, caseIndex, input, expectedOutput, result) => {
  console.log(`Case ${String(caseIndex).padStart(3, ' ')} [${label}]`);
  console.log(`  input       : ${String(input).slice(0, 120)}${String(input).length > 120 ? '...' : ''}`);
  console.log(`  expected    : ${expectedOutput}`);
  console.log(`  actual      : ${result.output}`);
  console.log(`  matched     : ${result.passed}`);
  if (!result.passed) {
    console.log(`  errorType   : ${result.errorType || '-'}`);
    console.log(`  error       : ${(result.error || '-').slice(0, 220)}${(result.error || '').length > 220 ? '...' : ''}`);
  }
  console.log(`  status_id   : ${result.status_id}`);
  console.log(`  execTimeMs  : ${result.executionTime}`);
  console.log(`  memoryUsed  : ${result.memoryUsed}`);
};

const runSummary = async (problem, language, rawSource, label, mocked, submitCodeFn, computeVerdictFn) => {
  const t0 = Date.now();
  const wrapped = buildWrappedProblemDriver(rawSource, language);
  const results = await submitCodeFn(wrapped, language, problem.hiddenTestCases);
  const wallMs = Date.now() - t0;

  const verdict = computeVerdictFn(results);
  console.log(`\n========== ${label} ==========`);
  console.log(`Problem: ${problem.title}`);
  console.log(`Slug   : ${problem.slug}`);
  console.log(`Lang   : ${language}`);
  console.log(`Mode   : ${mocked ? 'mocked Piston result' : 'live Piston result'}`);
  console.log(`Verification summary:`);
  console.log(`  Total test cases      : ${results.length}`);
  console.log(`  Passed                : ${verdict.passedTestCases}`);
  console.log(`  Failed                : ${results.length - verdict.passedTestCases}`);
  console.log(`  Verdict               : ${verdict.verdict}`);
  console.log(`  Total wall-clock time : ${wallMs}ms`);

  const systemErrors = results.filter((r) => !r.passed && ['CompileError','RuntimeError','system_error'].includes(r.errorType));
  if (systemErrors.length) {
    console.log(`\nSystem-error cases: ${systemErrors.length}`);
    systemErrors.forEach((r, idx) => {
      console.log(`\nSystem error on hidden case ${idx}:`);
      printResult(label, idx, r.input, r.expectedOutput, r);
    });
  }

  const failed = results
    .map((r, idx) => ({ idx, ...r }))
    .filter((r) => !r.passed && !['CompileError','RuntimeError','system_error'].includes(r.errorType));

  if (failed.length) {
    console.log(`\nWrong-answer / mismatch details:`);
    failed.forEach(({ idx, input, expectedOutput, output, error, errorType, executionTime, memoryUsed }) => {
      printResult(label, idx, input, expectedOutput, {
        passed: false,
        output,
        error,
        errorType,
        status_id: errorType === 'WrongAnswer' ? 4 : 17,
        executionTime,
        memoryUsed,
      });
    });
  }

  return { results, verdict, wallMs };
};

const buildWrappedProblemDriver = (sourceCode, language) => {
  switch (language) {
    case 'python':
      return `${sourceCode}\nimport sys\nfor _line in sys.stdin:\n    _line=_line.rstrip('\\n')\n    print(solve(_line))`;
    case 'java':
      return `${sourceCode}\n\nimport java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            String input = sc.nextLine();\n            System.out.println(Solution.solve(input));\n        }\n        sc.close();\n    }\n}`;
    case 'cpp':
      return `${sourceCode}\n\n#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n    ios::sync_with_stdio(false);\n    cin.tie(NULL);\n    string input;\n    if(getline(cin,input)){\n        cout<<solve(input);\n    }\n    return 0;\n}`;
    case 'javascript':
    default:
      return `${sourceCode}\n\nconst fs = require('fs');\nconst input = fs.readFileSync(0,'utf8').trim();\nconsole.log(solve(input));`;
  }
};


const loadModule = (name) => {
  delete require.cache[require.resolve(name)];
  return require(name);
};

const main = async () => {
  console.log('Starting Piston wiring verification...\n');

  let publicPistonAvailable = false;
  try {
    const https = require('https');
    const body = await new Promise((resolve, reject) => {
      https.get('https://emkc.org/api/v2/piston/runtimes', (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve(d));
      }).on('error', reject);
    });
    const runtimes = JSON.parse(body);
    const javaRuntime = runtimes.find((r) => r.language === 'java');
    const pythonRuntime = runtimes.find((r) => r.language === 'python');
    console.log('Runtimes fetched:');
    console.log(`  java  : ${javaRuntime ? javaRuntime.language + ' ' + javaRuntime.version : 'NOT FOUND'}`);
    console.log(`  python: ${pythonRuntime ? pythonRuntime.language + ' ' + pythonRuntime.version : 'NOT FOUND'}\n`);
    publicPistonAvailable = !!(javaRuntime && pythonRuntime);
  } catch (e) {
    console.error('Failed to fetch runtimes:', e.message);
  }

  let executeAvailable = false;
  if (publicPistonAvailable) {
    try {
      const data = JSON.stringify({ language: 'python', version: '*', files: [{ content: 'print("oj")' }], stdin: '' });
      const result = await new Promise((resolve, reject) => {
        const req = require('https').request({
          hostname: 'emkc.org',
          path: '/api/v2/piston/execute',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Length': Buffer.byteLength(data) },
        }, (res) => {
          let b = '';
          res.on('data', (c) => (b += c));
          res.on('end', () => resolve({ status: res.statusCode, body: b }));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
      });
      console.log('Piston execute probe result:');
      console.log(`  HTTP status : ${result.status}`);
      console.log(`  Body        : ${(result.body || '').slice(0, 500)}\n`);
      executeAvailable = result.status === 200;
    } catch (e) {
      console.error('Piston execute probe failed:', e.message);
    }
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (e) {
    console.error('Mongo connection error:', e.message);
    process.exit(1);
  }

  let problem;
  try {
    problem = await CodingProblem.findOne({ slug: 'shortest-path-search-in-unweighted-graph' }).lean();
    if (!problem) {
      console.error('Problem not found: shortest-path-search-in-unweighted-graph');
      process.exit(1);
    }
    console.log(`Loaded problem: ${problem.title}`);
    console.log(`Hidden test cases: ${problem.hiddenTestCases.length}`);
    if (problem.hiddenTestCases.length) {
      console.log('First hidden test case preview:');
      console.log(`  input       : ${String(problem.hiddenTestCases[0].input).slice(0, 120)}...`);
      console.log(`  expected    : ${problem.hiddenTestCases[0].expectedOutput}`);
    }
    console.log('');
  } catch (e) {
    console.error('Failed to load problem:', e.message);
    process.exit(1);
  }

  const pythonLabel = 'Python correct solution';
  const javaLabel = 'Java correct solution';
  const wrongLabel = 'Python wrong solution';

  const useMock = !publicPistonAvailable || !executeAvailable;
  if (useMock) {
    console.log('Live Piston execution unavailable; using mocked execution to verify verdict wiring.\n');
    process.env.PISTON_MOCK = 'true';
  }

  try {
    const judge0 = loadModule('../utils/judge0Coding');
    const submitCodeFn = judge0.submitCode;
    const computeVerdictFn = judge0.computeVerdict;

    const { results: pythonResults, verdict: pythonVerdict } = await runSummary(problem, 'python', PYTHON_SOLUTION, pythonLabel, useMock, submitCodeFn, computeVerdictFn);
    await sleep(250);
    const { results: javaResults, verdict: javaVerdict } = await runSummary(problem, 'java', JAVA_SOLUTION, javaLabel, useMock, submitCodeFn, computeVerdictFn);
    await sleep(250);
    const { results: wrongResults, verdict: wrongVerdict } = await runSummary(problem, 'python', WRONG_SOLUTION_PY, wrongLabel, useMock, submitCodeFn, computeVerdictFn);

    console.log('\n========== Overall ==========');
    console.log(`Public Piston execute available : ${publicPistonAvailable && executeAvailable}`);
    console.log(`Python correct verdict : ${pythonVerdict.verdict} (${pythonVerdict.passedTestCases}/${pythonVerdict.totalTestCases})`);
    console.log(`Java correct verdict   : ${javaVerdict.verdict} (${javaVerdict.passedTestCases}/${javaVerdict.totalTestCases})`);
    console.log(`Wrong solution verdict : ${wrongVerdict.verdict} (${wrongVerdict.passedTestCases}/${wrongVerdict.totalTestCases})`);
  } finally {
    if (useMock) {
      delete process.env.PISTON_MOCK;
    }
  }

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
  process.exit(0);
};

main();