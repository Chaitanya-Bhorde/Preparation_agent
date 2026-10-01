/**
 * live_demo_check.js
 * ---------------------------------------------------------------------------
 * STEP 17: drives the LIVE HTTP API the way the browser does - register/login,
 * list, filter, open a problem, Run correct/wrong code, Submit correct/wrong
 * code, read submission history, and confirm no response ever leaks hidden
 * cases or the reference solution.
 *
 * Expects the dev server on BASE_URL. Creates one throwaway test account.
 * ---------------------------------------------------------------------------
 */
'use strict';
const BASE = process.env.BASE_URL || 'http://localhost:5000';

const email = `dsa_live_${Date.now()}@example.com`;
const password = 'LiveDemo#2026';

const results = [];

function check(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
}

async function api(pathname, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + pathname, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch (_) { /* non-JSON */ }
  return { status: res.status, json };
}

async function authenticate() {
  let res = await api('/api/auth/register', {
    method: 'POST',
    body: { name: 'DSA Live Demo', email, password },
  });
  if (res.status >= 400) {
    res = await api('/api/auth/login', { method: 'POST', body: { email, password } });
  }
  const token = (res.json && res.json.token) || (res.json && res.json.data && res.json.data.token);
  check('auth: obtain a session token', !!token, `status ${res.status}`);
  return token;
}
async function checkCatalogue(token) {
  const list = await api('/api/coding-problems?limit=100', { token });
  const items = (list.json && list.json.data) || [];
  check('GET /coding-problems returns a populated catalogue',
    list.status === 200 && items.length > 0, `${items.length} problems`);

  const stats = await api('/api/coding-problems/stats', { token });
  const sd = (stats.json && stats.json.data) || {};
  check('stats denominator equals the active catalogue', sd.total === items.length,
    `stats.total=${sd.total} listed=${items.length}`);

  const topics = await api('/api/coding-problems/topics', { token });
  const topicList = (topics.json && topics.json.data) || [];
  check('topic filter options are offered', topicList.length > 0, `${topicList.length} topics`);

  const search = await api('/api/coding-problems?search=Two%20Sum', { token });
  const found = (search.json && search.json.data) || [];
  check('search finds an active problem', found.length > 0, `"Two Sum" -> ${found.length}`);

  const filtered = await api('/api/coding-problems?difficulty=easy', { token });
  const easy = (filtered.json && filtered.json.data) || [];
  check('difficulty filter returns only easy problems',
    easy.length > 0 && easy.every((p) => p.difficulty === 'easy'), `${easy.length} easy`);

  return items;
}

async function checkProblemPage(token) {
  const detail = await api('/api/coding-problems/two-sum', { token });
  const p = (detail.json && detail.json.data) || {};
  check('problem detail loads', detail.status === 200 && !!p.title, p.title);

  check('statement has a real description',
    String(p.description || '').trim().length >= 80
    && !/not yet reviewed/i.test(p.description || ''),
    `${String(p.description || '').trim().length} chars`);
  check('statement has constraints',
    Array.isArray(p.constraints) && p.constraints.length > 0, `${(p.constraints || []).length} constraints`);
  check('statement has examples with input AND output',
    Array.isArray(p.examples) && p.examples.length > 0
    && p.examples.every((e) => String(e.input || '').trim() && String(e.output || '').trim()),
    `${(p.examples || []).length} examples`);
  check('starter code is generated',
    !!(p.starterCode && p.starterCode.javascript),
    `${String((p.starterCode || {}).javascript || '').length} chars`);

  const payload = JSON.stringify(p);
  check('hidden tests are NOT in the payload', !/hiddenTests|hiddenTestCases/.test(payload));
  check('reference solution is NOT in the payload', !/referenceSolution/.test(payload));

  const retired = await api('/api/coding-problems/sliding-window-maximum', { token });
  check('a retired problem 404s', retired.status === 404, `status ${retired.status}`);

  return p;
}

async function checkCodingFlow(token, problem) {
  const correct = [
    'function twoSum(nums, target) {',
    '  const seen = new Map();',
    '  for (let i = 0; i < nums.length; i++) {',
    '    if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];',
    '    seen.set(nums[i], i);',
    '  }',
    '  return [];',
    '}',
  ].join('\n');
  const wrong = 'function twoSum(nums, target) { return [0, 0]; }';
  const id = problem._id;

  const runOk = await api('/api/coding/run', {
    method: 'POST', token, body: { problemId: id, language: 'javascript', code: correct },
  });
  const a = (runOk.json && runOk.json.data) || {};
  check('Run: correct code is Accepted', a.verdict === 'Accepted',
    `${a.verdict} ${a.passedTestCases}/${a.totalTestCases}`);

  const runBad = await api('/api/coding/run', {
    method: 'POST', token, body: { problemId: id, language: 'javascript', code: wrong },
  });
  const b = (runBad.json && runBad.json.data) || {};
  check('Run: wrong code is WrongAnswer', b.verdict === 'WrongAnswer', b.verdict);

  const subOk = await api('/api/coding/submit', {
    method: 'POST', token, body: { problemId: id, language: 'javascript', code: correct },
  });
  const c = (subOk.json && subOk.json.data) || {};
  check('Submit: correct code is Accepted', c.verdict === 'Accepted',
    `${c.verdict} ${c.passedTestCases}/${c.totalTestCases}`);
  check('Submit: solved flag is true', c.solved === true);
  check('Submit: judged on more than the visible samples',
    c.totalTestCases > (problem.examples || []).length, `${c.totalTestCases} cases`);
  check('Submit: no hidden expected output leaks',
    !/"hiddenTests"|"referenceSolution"/.test(JSON.stringify(c)));

  // A second, failing attempt on the already-solved problem: the historical
  // card must stay green because `solved` is derived from ANY prior Accepted.
  const again = await api('/api/coding/submit', {
    method: 'POST', token, body: { problemId: id, language: 'javascript', code: wrong },
  });
  const g = (again.json && again.json.data) || {};
  check('Submit: re-submitting wrong code stays solved', g.verdict === 'WrongAnswer' && g.solved === true,
    `verdict=${g.verdict} solved=${g.solved}`);

  // Submit the WRONG solution first, on a problem this account has never solved:
// `solved` reflects any prior Accepted on the problem, so this must be false.
const fresh = await api('/api/coding-problems/valid-palindrome', { token });
const freshProb = (fresh.json && fresh.json.data) || {};
const subBad = await api('/api/coding/submit', {
  method: 'POST', token,
  body: { problemId: freshProb._id, language: 'javascript', code: 'function isPalindrome(s) { return true; }' },
});
const d = (subBad.json && subBad.json.data) || {};
check('Submit: wrong code is WrongAnswer', d.verdict === 'WrongAnswer', d.verdict);
check('Submit: wrong code is not marked solved', d.solved === false, `solved=${d.solved}`);

  const hist = await api(`/api/coding/submissions?problemId=${id}`, { token });
  const subs = (hist.json && hist.json.data) || [];
  check('submission history lists both attempts', subs.length >= 2, `${subs.length} submissions`);
  check('history keeps language + verdict + timestamp',
    subs.every((s) => s.language && s.verdict && s.createdAt));
  check('history exposes owner code for Copy Code',
    subs.some((s) => typeof s.code === 'string' && s.code.includes('twoSum')));
  check('history hides hidden-case expected outputs',
    !subs.some((s) => (s.testCaseResults || []).some((r) => r.isSample === false && r.expectedOutput)));

  const after = await api('/api/coding-problems/two-sum', { token });
  const e = (after.json && after.json.data) || {};
  check('solved state persists on reload', e.userStatus === 'solved', e.userStatus);

  const stats2 = await api('/api/coding-problems/stats', { token });
  const f = (stats2.json && stats2.json.data) || {};
  check('stats reflects the new solve', f.solved === 1, `solved=${f.solved}`);

  const lb = await api('/api/leaderboard/dsa');
  check('DSA leaderboard responds',
    lb.status === 200 && Array.isArray(lb.json.leaderboard),
    `${((lb.json || {}).leaderboard || []).length} rows`);

  const rec = await api('/api/recommendations', { token });
  check('recommendations respond', rec.status === 200, `status ${rec.status}`);
}

(async () => {
  const token = await authenticate();
  if (!token) process.exit(1);
  await checkCatalogue(token);
  const problem = await checkProblemPage(token);
  await checkCodingFlow(token, problem);

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} live-demo checks passed`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
  console.error('LIVE DEMO CHECK CRASHED:', e.message);
  process.exit(1);
});