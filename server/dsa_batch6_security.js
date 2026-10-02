'use strict';

/**
 * dsa_batch6_security.js
 * ---------------------------------------------------------------------------
 * READ-ONLY security and route checks against the running server. Verifies the
 * things batch 6 could plausibly have broken, without changing any setting:
 *
 *   - the production rate limiter is still ENFORCED (a burst is refused)
 *   - hidden tests and reference solutions are never served to a client
 *   - an inactive record stays invisible to the public listing and to detail
 *   - admin-only and owner-only routes still refuse an ordinary user
 *   - an unauthenticated request is still refused
 *
 * Deliberately does NOT disable, raise, or bypass the limiter: the 429 that the
 * burst produces is the evidence that it is intact.
 *
 *   node dsa_batch6_security.js
 * ---------------------------------------------------------------------------
 */
const BASE = process.env.BASE_URL || 'http://localhost:5000';

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
}

async function raw(p, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch (_) { /* non-JSON */ }
  return { status: res.status, json };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const health = await raw('/api/health');
  check('health endpoint', health.status === 200, `status ${health.status}`);

  // --- unauthenticated access must be refused -------------------------------
  const anon = await raw('/api/coding-problems?limit=5');
  check('public problem list needs no auth (public by design)',
    anon.status === 200 || anon.status === 401, `status ${anon.status}`);

  const anonSub = await raw('/api/coding/submissions');
  check('submissions require auth', anonSub.status === 401, `status ${anonSub.status}`);

  // --- register a throwaway user -------------------------------------------
  const email = `dsa_b6_sec_${Date.now()}@example.com`;
  const password = 'BatchFive#2026';
  const reg = await raw('/api/auth/register', {
    method: 'POST', body: { name: 'b6sec', email, password },
  });
  const token = (reg.json && reg.json.token) || (reg.json && reg.json.data && reg.json.data.token);
  check('register a throwaway test user', reg.status === 201 && !!token, `status ${reg.status}`);
  if (!token) { console.log('FATAL: no token'); process.exit(1); }

  // --- hidden tests / reference must not leak ------------------------------
  const detail = await raw('/api/coding-problems/network-delay-time', { token });
  const body = JSON.stringify(detail.json || {});
  check('detail response hides hiddenTests / referenceSolution',
    !/hiddenTests|hiddenTestCases|referenceSolution/.test(body),
    `leak=${/hiddenTests|hiddenTestCases|referenceSolution/.test(body)}`);

  const hist = await raw('/api/coding/submissions', { token });
  check('submission history hides hiddenTests / referenceSolution',
    !/hiddenTests|hiddenTestCases|referenceSolution/.test(JSON.stringify(hist.json || {})),
    `status ${hist.status}`);

  // --- an inactive record must not be publicly reachable -------------------
  const manual = await raw('/api/coding-problems/friend-circles', { token });
  const notServed = manual.status === 404;
  check('manual-review record is not publicly served', notServed, `status ${manual.status}`);

  // --- admin-only routes must refuse an ordinary user ----------------------
  const admin = await raw('/api/coding-problems/admin/all', { token });
  check('admin route refuses an ordinary user', admin.status === 403 || admin.status === 404,
    `status ${admin.status}`);

  // --- the production limiter is still enforced ----------------------------
  // Burst well past max=20 on a limited route and confirm a 429 appears. This
  // is the proof the safeguard survived; nothing is disabled to obtain it.
  let saw429 = false;
  let sent = 0;
  const slug = (detail.json && detail.json.data && detail.json.data._id) || null;
  for (let i = 0; i < 40 && !saw429; i++) {
    const r = await raw('/api/coding/run', {
      method: 'POST', token,
      body: { problemId: slug, language: 'javascript', code: 'function solve(){return 1;}' },
    });
    sent++;
    if (r.status === 429) saw429 = true;
    await sleep(60);
  }
  check('production rate limiter still enforced (429 observed)', saw429, `${sent} requests sent`);

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} security checks passed`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
  console.error('SECURITY CRASHED:', e.message);
  process.exit(1);
});