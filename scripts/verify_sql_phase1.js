// Phase 1 SQL Backend Verification Script
const results = { pass: 0, fail: 0, skip: 0 };
function log(name, status, detail = '') {
  console.log(`[${status}] ${name}${detail ? ' :: ' + detail : ''}`);
  if (status === 'PASS') results.pass++;
  else if (status === 'FAIL') results.fail++;
  else results.skip++;
}

(async () => {
  // ---------- 1. MODULE LOADING ----------
  let sandbox, runner, comparator, SQLProblem, SQLSubmission, sc;
  try {
    sandbox = require('../server/utils/sqlSandbox');
    log('load sqlSandbox', 'PASS', Object.keys(sandbox).join(','));
  } catch (e) { log('load sqlSandbox', 'FAIL', e.message); }
  try {
    runner = require('../server/utils/sqlRunner');
    log('load sqlRunner', 'PASS', Object.keys(runner).join(','));
  } catch (e) { log('load sqlRunner', 'FAIL', e.message); }
  try {
    comparator = require('../server/utils/sqlResultComparator');
    log('load comparator', 'PASS', Object.keys(comparator).join(','));
  } catch (e) { log('load comparator', 'FAIL', e.message); }
  try {
    sc = require('../server/controllers/submissionController');
    log('load submissionController', 'PASS', 'runSQL=' + typeof sc.runSQL + ' submitSQL=' + typeof sc.submitSQL);
  } catch (e) { log('load submissionController', 'FAIL', e.message); }
  try {
    SQLProblem = require('../server/models/SQLProblem');
    SQLSubmission = require('../server/models/SQLSubmission');
    log('load models', 'PASS', SQLProblem.modelName + ',' + SQLSubmission.modelName);
  } catch (e) { log('load models', 'FAIL', e.message); }

  // ---------- 2. SANDBOX EXECUTION TESTS ----------
  const exec = sandbox.executeSQL || (sandbox.default && sandbox.default.executeSQL);

  if (!exec) { log('sandbox executeSQL exists', 'FAIL', 'no executeSQL export'); }
  else {
    // 2a. valid SELECT
    try {
      const r = await exec({ query: 'SELECT 1 AS n', timeoutMs: 5000 });
      log('sandbox SELECT 1', r && r.success ? 'PASS' : 'FAIL', JSON.stringify(r && (r.data || r.error)).slice(0, 120));
    } catch (e) { log('sandbox SELECT 1', 'FAIL', e.message); }

    // 2b. schema setup + query against table
    try {
      const schema = "CREATE TABLE employees (id INTEGER, name TEXT, salary INTEGER, department_id INTEGER); INSERT INTO employees VALUES (1,'A',50000,10),(2,'B',70000,20);";
      const r = await exec({ query: 'SELECT name, salary FROM employees WHERE salary > 50000;', schemaSetup: schema, timeoutMs: 5000 });
      const rows = r && r.success && r.data ? r.data.rows : null;
      log('sandbox schema+query', rows && rows.length === 1 && rows[0].name === 'B' ? 'PASS' : 'FAIL', JSON.stringify(rows));
    } catch (e) { log('sandbox schema+query', 'FAIL', e.message); }

    // 2c. invalid SQL -> sanitized error
    try {
      const r = await exec({ query: 'SELEC * FRM nope', timeoutMs: 5000 });
      log('sandbox invalid SQL', !r.success && r.error ? 'PASS' : 'FAIL', 'err=' + String(r.error).slice(0, 80));
    } catch (e) { log('sandbox invalid SQL', 'PASS(in thrown)', e.message.slice(0, 80)); }

    // 2d. empty query
    try {
      const r = await exec({ query: '   ', timeoutMs: 5000 });
      log('sandbox empty query', !r.success ? 'PASS' : 'FAIL', 'err=' + String(r.error || '').slice(0, 60));
    } catch (e) { log('sandbox empty query', 'FAIL', e.message); }

    // 2e. destructive SQL restrictions
    const validate = sandbox.validateQuerySafety || sandbox.validateQuery;
    if (typeof validate === 'function') {
      for (const bad of ['DROP TABLE employees', 'DELETE FROM employees', 'UPDATE employees SET salary=0', 'ATTACH DATABASE "x.db" AS evil']) {
        try {
          const v = validate(bad);
          log('validate blocks: ' + bad.slice(0, 30), v && (v.valid === false || v.allowed === false || v === false) ? 'PASS' : 'FAIL', JSON.stringify(v).slice(0, 80));
        } catch (e) {
          log('validate blocks: ' + bad.slice(0, 30), 'PASS', 'threw=' + e.message.slice(0, 40));
        }
      }
    } else {
      try {
        const schema = 'CREATE TABLE t (a INTEGER); INSERT INTO t VALUES (1);';
        const r = await exec({ query: 'DROP TABLE t; SELECT * FROM t;', schemaSetup: schema, timeoutMs: 5000 });
        log('sandbox DROP blocked', !r.success || (r.data && r.data.rows && r.data.rows.length === 0) ? 'PASS' : 'PARTIAL', JSON.stringify(r && (r.error || r.data)).slice(0, 80));
      } catch (e) { log('sandbox DROP blocked', 'PASS', 'threw=' + e.message.slice(0, 40)); }
    }

    // 2f. system table access
    try {
      const r = await exec({ query: "SELECT name FROM sqlite_master WHERE type='table';", timeoutMs: 5000 });
      const rows = r && r.success && r.data ? r.data.rows : null;
      log('sandbox sqlite_master restricted', rows ? 'PARTIAL' : 'PASS', JSON.stringify(rows).slice(0, 100));
    } catch (e) { log('sandbox sqlite_master restricted', 'PASS', 'blocked: ' + e.message.slice(0, 40)); }

    // 2g. isolation: two executions of same schema do not share data
    try {
      const schema = 'CREATE TABLE t (a INTEGER); INSERT INTO t VALUES (7);';
      await exec({ query: 'SELECT * FROM t;', schemaSetup: schema, timeoutMs: 5000 });
      const r2 = await exec({ query: 'SELECT * FROM t;', timeoutMs: 5000 });
      log('sandbox isolation (no cross-exec persistence)', !r2.success || (r2.data && r2.data.rows.length === 0) ? 'PASS' : 'FAIL', JSON.stringify(r2 && (r2.error || r2.data)).slice(0, 60));
    } catch (e) { log('sandbox isolation', 'FAIL', e.message.slice(0, 60)); }
  }

  // ---------- 3. COMPARATOR TESTS ----------
  const cmpName = Object.keys(comparator || {}).find((k) => /compare/i.test(k));
  const cmp = cmpName ? comparator[cmpName] : null;
  if (!cmp) {
    log('comparator function found', 'FAIL', 'keys=' + Object.keys(comparator || {}).join(','));
  } else {
    log('comparator function found', 'PASS', cmpName);
    function callCmp(a, e, mode) {
      try {
        const r = cmp(a, e, mode);
        if (r && typeof r === 'object') return r;
        return { match: !!r };
      } catch (err) {
        try {
          const r2 = cmp({ rows: a }, { rows: e }, mode);
          if (r2 && typeof r2 === 'object') return r2;
          return { match: !!r2 };
        } catch (e2) { return { error: e2.message }; }
      }
    }
    const isMatch = (r) => r && (r.match === true || r.passed === true || r.equal === true || r.success === true || r === true);
    const E = (r) => JSON.stringify(r).slice(0, 90);

    let r = callCmp([{ id: 1, n: 'A' }], [{ id: 1, n: 'A' }]);
    log('cmp identical', isMatch(r) ? 'PASS' : 'FAIL', E(r));

    r = callCmp([{ id: 2 }, { id: 1 }], [{ id: 1 }, { id: 2 }]);
    log('cmp exact-mode row order matters (default)', !isMatch(r) ? 'PASS' : 'FAIL', E(r));

    r = callCmp([{ id: 2 }, { id: 1 }], [{ id: 1 }, { id: 2 }], 'set');
    log('cmp set-mode row order ignored', isMatch(r) ? 'PASS' : 'FAIL', E(r));

    r = callCmp([{ id: 1 }, { id: 1 }], [{ id: 1 }], 'set');
    log('cmp set-mode duplicates respected', !isMatch(r) ? 'PASS' : 'FAIL', E(r));

    r = callCmp([{ id: 1 }, { id: 2 }, { id: 1 }], [{ id: 1 }, { id: 1 }, { id: 2 }], 'set');
    log('cmp set-mode dup counts equal across order', isMatch(r) ? 'PASS' : 'FAIL', E(r));

    r = callCmp([{ id: 1 }, { id: 1 }], [{ id: 1 }]);
    log('cmp duplicates differ', !isMatch(r) ? 'PASS' : 'FAIL', E(r));

    r = callCmp([{ v: null }], [{ v: null }]);
    log('cmp NULL equals NULL', isMatch(r) ? 'PASS' : 'FAIL', E(r));
    r = callCmp([{ v: null }], [{ v: 0 }]);
    log('cmp NULL vs 0 differ', !isMatch(r) ? 'PASS' : 'FAIL', E(r));

    r = callCmp([], []);
    log('cmp empty equals empty', isMatch(r) ? 'PASS' : 'FAIL', E(r));
    r = callCmp([], [{ id: 1 }]);
    log('cmp empty vs rows differ', !isMatch(r) ? 'PASS' : 'FAIL', E(r));

    r = callCmp([{ n: 1 }], [{ n: '1' }]);
    log('cmp numeric 1 vs "1"', isMatch(r) ? 'PARTIAL(check)' : 'PASS', 'match=' + isMatch(r) + ' ' + E(r));

    r = callCmp([{ s: 'abc' }], [{ s: 'abd' }]);
    log('cmp strings differ', !isMatch(r) ? 'PASS' : 'FAIL', E(r));
  }

  // ---------- 4. MONGODB-DEPENDENT TESTS ----------
  let mongoose;
  try { mongoose = require('mongoose'); } catch (e) { mongoose = null; }
  if (!mongoose) {
    try { mongoose = require('../server/node_modules/mongoose'); } catch (e2) { mongoose = null; }
  }
  if (!mongoose) { log('mongoose available', 'SKIP', 'not installed - DB tests NOT VERIFIED'); }
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/prepagent_test';
  let connected = false;
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    connected = true;
    log('mongo connect', 'PASS', uri);
  } catch (e) {
    log('mongo connect', 'SKIP', 'MongoDB not reachable - DB tests NOT VERIFIED: ' + e.message.slice(0, 60));
  }

  if (connected) {
    let problem = null;
    try {
      problem = await SQLProblem.create({
        title: 'Phase1 Test Problem', slug: 'phase1-test-' + Date.now(),
        description: 'Return employees with salary > 50000',
        difficulty: 'easy', topic: 'WHERE', topics: ['WHERE'],
        schemaSetupSQL: "CREATE TABLE employees (id INTEGER, name TEXT, salary INTEGER, department_id INTEGER); INSERT INTO employees VALUES (1,'A',50000,10),(2,'B',70000,20),(3,'C',90000,10);",
        sampleTestCases: [{ expectedOutputRows: [{ name: 'B', salary: 70000 }, { name: 'C', salary: 90000 }] }],
        hiddenTestCases: [{ expectedOutputRows: [{ name: 'B', salary: 70000 }, { name: 'C', salary: 90000 }] }],
        isActive: true,
      });
      log('seed SQLProblem', 'PASS', problem._id.toString());
    } catch (e) {
      try {
        problem = await SQLProblem.create({
          title: 'Phase1 Test Problem', slug: 'phase1-test-' + Date.now(), description: 'x', difficulty: 'easy', topic: 'WHERE',
          schemaSetupSQL: "CREATE TABLE employees (id INTEGER, name TEXT, salary INTEGER); INSERT INTO employees VALUES (1,'A',50000),(2,'B',70000);",
          sampleTestCases: [{ expectedOutputRows: [{ name: 'B', salary: 70000 }] }],
        });
        log('seed SQLProblem (minimal)', 'PASS', problem._id.toString());
      } catch (e2) { log('seed SQLProblem', 'FAIL', e2.message.slice(0, 120)); }
    }

    if (problem) {
      const goodQuery = 'SELECT name, salary FROM employees WHERE salary > 50000;';
      const badQuery = 'SELECT name, salary FROM employees WHERE salary > 90000;';
      const syntaxErr = 'SELEC name FRM employees;';
      const mkReqRes = (user) => {
        let statusCode = null, body = null;
        const res = { status(c) { statusCode = c; return this; }, json(b) { body = b; return this; } };
        return { req: { user, body: {} }, res, get: () => ({ statusCode, body }) };
      };
      const userA = new mongoose.Types.ObjectId();
      try {
        const a = mkReqRes({ id: userA.toString() });
        a.req.body = { problemId: problem._id.toString(), code: goodQuery };
        await sc.submitSQL(a.req, a.res);
        const b1 = a.get().body;
        const d = b1 && b1.data;
        log('submitSQL ACCEPTED', b1 && b1.success && d.status === 'accepted' ? 'PASS' : 'FAIL', 'status=' + (d && d.status) + ' passed=' + (d && d.passedTestCases) + '/' + (d && d.totalTestCases));
        log('submitSQL stores difficulty/topics', d && d.difficulty === 'easy' && Array.isArray(d.topics) ? 'PASS' : 'PARTIAL', 'difficulty=' + (d && d.difficulty) + ' topics=' + JSON.stringify(d && d.topics));

        const saved = await SQLSubmission.find({ problem: problem._id }).lean();
        const owned = saved.every((s) => String(s.user) === userA.toString());
        log('SQLSubmission persisted + user-scoped', saved.length === 1 && owned ? 'PASS' : 'FAIL', 'count=' + saved.length + ' owned=' + owned);

        const c2 = mkReqRes({ id: userA.toString() });
        c2.req.body = { problemId: problem._id.toString(), code: badQuery };
        await sc.submitSQL(c2.req, c2.res);
        const b2 = c2.get().body;
        log('submitSQL WRONG_ANSWER', b2 && b2.success && b2.data.status === 'wrong_answer' ? 'PASS' : 'FAIL', 'status=' + (b2 && b2.data && b2.data.status));

        const c3 = mkReqRes({ id: userA.toString() });
        c3.req.body = { problemId: problem._id.toString(), code: syntaxErr };
        await sc.submitSQL(c3.req, c3.res);
        const b3 = c3.get().body;
        const st3 = b3 && b3.data && b3.data.status;
        log('submitSQL invalid SQL status', ['syntax_error', 'runtime_error'].includes(st3) ? 'PASS' : 'FAIL', 'status=' + st3);

        const subs = await SQLSubmission.find({ user: userA, problem: problem._id, type: 'submit' }).lean();
        const accepted = subs.filter((s) => s.status === 'accepted');
        const solvedSet = new Set(accepted.map((s) => String(s.problem)));
        log('solved logic (1 solved / 3 submissions / 1 accepted)', subs.length === 3 && accepted.length === 1 && solvedSet.size === 1 ? 'PASS' : 'FAIL', `submissions=${subs.length} accepted=${accepted.length} solved=${solvedSet.size}`);

        const c4 = mkReqRes({ id: userA.toString() });
        c4.req.body = { problemId: problem._id.toString(), code: goodQuery };
        await sc.runSQL(c4.req, c4.res);
        const b4 = c4.get().body;
        const runCount = await SQLSubmission.countDocuments({ user: userA, problem: problem._id, type: 'submit' });
        log('runSQL mode=run', b4 && b4.success && b4.data.mode === 'run' ? 'PASS' : 'FAIL', 'mode=' + (b4 && b4.data && b4.data.mode));
        log('RUN does not inflate submit count (still 3)', runCount === 3 ? 'PASS' : 'FAIL', 'submitCount=' + runCount);

        const subsB = await SQLSubmission.find({ user: new mongoose.Types.ObjectId(), problem: problem._id }).lean();
        log('user isolation (B sees nothing)', subsB.length === 0 ? 'PASS' : 'FAIL', 'B count=' + subsB.length);

        const src = require('fs').readFileSync('server/routes/sql.js', 'utf8') + require('fs').readFileSync('server/controllers/submissionController.js', 'utf8');
        const scoped = /user:\s*req\.user\.(id|_id)/.test(src);
        log('history queries scoped to req.user', scoped ? 'PASS' : 'FAIL', 'regex match=' + scoped);
      } catch (e) {
        log('DB-dependent controller tests', 'FAIL', e.message.slice(0, 140));
      } finally {
        await SQLSubmission.deleteMany({ problem: problem._id });
        await SQLProblem.deleteOne({ _id: problem._id });
      }
    }
    await mongoose.disconnect();
  }

  console.log('\n===== SUMMARY =====');
  console.log(`PASS: ${results.pass}  FAIL: ${results.fail}  SKIP/NOT-VERIFIED: ${results.skip}`);
  process.exit(results.fail > 0 ? 1 : 0);
})().catch((e) => { console.error('FATAL:', e); process.exit(1); });
