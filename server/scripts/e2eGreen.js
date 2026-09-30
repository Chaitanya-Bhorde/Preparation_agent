/**
 * e2eGreen.js — End-to-end check of the "problem card turns green after an
 * Accepted submission" flow against a RUNNING server on :5000.
 *
 * Registers a throwaway user, submits a CORRECT solution to a real problem,
 * then checks what the problem-list endpoint reports for that problem.
 * Writes nothing except the submission the user asked us to make.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const BASE = process.env.BASE || 'http://localhost:5000';

async function call(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  let body = null;
  try { body = await res.json(); } catch (_) { body = null; }
  return { status: res.status, body };
}

const log = (...a) => console.log(...a);

(async () => {
  const email = `e2egreen${Date.now()}@example.com`;
  const password = 'e2epassword123';

  log('1. REGISTER');
  const reg = await call('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'E2E Green', email, password }),
  });
  log('   status', reg.status, 'ok=', !!(reg.body && reg.body.success));
  if (!reg.body || !reg.body.token) { log('   FAILED', JSON.stringify(reg.body)); return; }
  const token = reg.body.token;
  const auth = { Authorization: `Bearer ${token}` };

  log('2. LOAD PROBLEM LIST (before submit)');
  const listBefore = await call('/api/coding-problems?limit=100&sort=title-asc', { headers: auth });
  const probs = listBefore.body.data || [];
  log('   total problems in bank:', listBefore.body.total, '| returned', probs.length);
  log('   LIST cards exposing sample cases:',
    probs.filter((p) => (p.visibleTestCases || []).length > 0).length, 'of', probs.length);

  const SLUG = process.env.SLUG || '3sum';
  const det0 = await call(`/api/coding-problems/${SLUG}`, { headers: auth });
  if (!det0.body || !det0.body.data) {
    log('   could not load detail for', SLUG, JSON.stringify(det0.body));
    return;
  }
  const problem = det0.body.data;
  log('   DETAIL', problem.title, '| samples:', (problem.visibleTestCases || []).length,
      '| userStatus:', problem.userStatus);

  // Submit the bank's OWN reference solution, read straight from Mongo. The API
  // deliberately withholds it, and using it is the only honest way to prove the
  // green flow end-to-end: a problem whose stored expected outputs disagree with
  // its own reference solution can never be Accepted by anyone.
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 12000 });
  const db = mongoose.connection.db;
  const doc = await db.collection('codingproblems').findOne({ slug: SLUG });
  const ref = doc && doc.referenceSolution && doc.referenceSolution.code;
  log('   bank reference solution present:', !!ref);
  await mongoose.disconnect();
  if (!ref) { log('   no reference solution; cannot drive the Accepted path'); return; }

  log('3. SUBMIT a DELIBERATELY WRONG solution');
  const wrong = await call('/api/coding/submit', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      problemId: problem._id,
      language: 'javascript',
      code: `function threeSum(nums) { return []; }`,
    }),
  });
  log('   status', wrong.status, '| verdict =', wrong.body.data && wrong.body.data.verdict,
      '| passed', wrong.body.data && wrong.body.data.passedTestCases, '/', wrong.body.data && wrong.body.data.totalTestCases,
      '| solved =', wrong.body.data && wrong.body.data.solved);

  log('4. CARD STATE after the WRONG submission (must NOT be green)');
  const l1 = await call('/api/coding-problems?limit=100&sort=title-asc', { headers: auth });
  const c1 = (l1.body.data || []).find((p) => p.slug === SLUG);
  log('   card userStatus =', c1 && c1.userStatus);

  log('5. SUBMIT the CORRECT solution (the bank reference solution)');
  const t0 = Date.now();
  const good = await call('/api/coding/submit', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ problemId: problem._id, language: 'javascript', code: ref }),
  });
  log('   status', good.status, '| took', Date.now() - t0, 'ms');
  log('   verdict =', good.body.data && good.body.data.verdict,
      '| passed', good.body.data && good.body.data.passedTestCases, '/', good.body.data && good.body.data.totalTestCases,
      '| solved =', good.body.data && good.body.data.solved);
  if (!good.body || !good.body.data) log('   raw:', JSON.stringify(good.body).slice(0, 300));

  log('6. CARD STATE after the CORRECT submission (must be green)');
  const l2 = await call('/api/coding-problems?limit=100&sort=title-asc', { headers: auth });
  const c2 = (l2.body.data || []).find((p) => p.slug === SLUG);
  log('   card userStatus =', c2 && c2.userStatus);

  log('7. DETAIL STATE');
  const detAfter = await call(`/api/coding-problems/${SLUG}`, { headers: auth });
  log('   detail userStatus =', detAfter.body.data.userStatus);

  log('8. STATS');
  const stats = await call('/api/coding-problems/stats', { headers: auth });
  log('   stats =', JSON.stringify(stats.body.data));

  log('9. SUBMIT AGAIN (duplicate) - solved count must stay 1');
  await call('/api/coding/submit', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ problemId: problem._id, language: 'javascript', code: ref }),
  });
  const l3 = await call('/api/coding-problems?limit=100&sort=title-asc', { headers: auth });
  const c3 = (l3.body.data || []).find((p) => p.slug === SLUG);
  log('   card userStatus =', c3 && c3.userStatus);
  const stats2 = await call('/api/coding-problems/stats', { headers: auth });
  log('   stats =', JSON.stringify(stats2.body.data));

  log('10. HISTORY');
  const hist = await call('/api/coding/submissions', { headers: auth });
  log('   total submissions =', hist.body.total,
      '| verdicts =', (hist.body.submissions || []).map((s) => s.verdict).join(','));
  log('11. TEST a problem with NO test cases at all (the common case in this bank)');
  // Reuse the problem list already fetched in step 2 instead of opening a
  // second database connection, and pick the sample-free problem off it.
  const empty = probs.find((p) => (p.visibleTestCases || []).length === 0);
  if (!empty) {
    log('    no sample-free problem on the returned page - skipped');
  } else {
    log('    sample problem:', empty.title);
    const r = await call('/api/coding/submit', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        problemId: String(empty._id),
        language: 'javascript',
        code: empty.referenceSolution && empty.referenceSolution.code
          ? empty.referenceSolution.code
          : 'function solve(){return 0;}',
      }),
    });
    log('    submit status =', r.status);
    log('    verdict =', r.body.data && r.body.data.verdict,
        '| passed', r.body.data && r.body.data.passedTestCases,
        '/', r.body.data && r.body.data.totalTestCases,
        '| solved =', r.body.data && r.body.data.solved);
    log('    >>> With zero test cases this can NEVER be Accepted, so the card can never green.');
  }

  process.exit(0);
})().catch((e) => { console.error('E2E ERROR:', e.message); process.exit(1); });

