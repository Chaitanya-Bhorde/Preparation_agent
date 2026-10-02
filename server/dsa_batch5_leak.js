'use strict';

/**
 * dsa_batch5_leak.js  (READ-ONLY, no rate-limited endpoints)
 * ---------------------------------------------------------------------------
 * Hidden-test / reference-solution security, verified WITHOUT touching
 * /api/coding/run or /api/coding/submit.
 *
 * dsa_batch5_security.js proves the limiter is enforced by bursting 40 requests
 * at a limited route. That is the right proof, but it deliberately consumes the
 * whole apiRateLimiter window, so it must not run while a runtime slice is
 * waiting for that window. This script covers the same security claims using
 * only endpoints the limiter does NOT guard (GET routes), which means it can be
 * run at any time without starving in-flight verification.
 *
 * Checks, for every batch-5 problem:
 *   - GET /api/coding-problems/:slug never returns hiddenTests / referenceSolution
 *   - the public LIST endpoint never returns them either
 *   - an unauthenticated caller still cannot read submission history
 *   - the manually-held record is still not publicly served
 *
 *   node dsa_batch5_leak.js
 * ---------------------------------------------------------------------------
 */
const BASE = process.env.BASE_URL || 'http://localhost:5000';
const fs = require('fs');
const path = require('path');

const built = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_dsa_batch5_built.json'), 'utf8')
).built;

const LEAK = /hiddenTests|hiddenTestCases|referenceSolution/;

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
}

async function raw(p, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + p, {
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

(async () => {
  const health = await raw('/api/health');
  check('health endpoint', health.status === 200, `status ${health.status}`);

  const email = `dsa_b5_leak_${Date.now()}@example.com`;
  const password = 'BatchFive#2026';
  const reg = await raw('/api/auth/register', {
    method: 'POST', body: { name: 'b5leak', email, password },
  });
  const token = (reg.json && reg.json.token) || (reg.json && reg.json.data && reg.json.data.token);
  check('register a throwaway test user', reg.status === 201 && !!token, `status ${reg.status}`);
  if (!token) { console.log('FATAL: no token'); process.exit(1); }

  // --- public list must not carry hidden material ---------------------------
  const list = await raw('/api/coding-problems?limit=300', { token });
  const listBody = JSON.stringify(list.json || {});
  check('public LIST hides hiddenTests / referenceSolution',
    !LEAK.test(listBody), `leak=${LEAK.test(listBody)}`);

  // --- per-problem detail must not carry hidden material --------------------
  const leaks = [];
  const missing = [];
  for (const b of built) {
    const d = await raw(`/api/coding-problems/${b.slug}`, { token });
    if (d.status !== 200) { missing.push(`${b.slug}:${d.status}`); continue; }
    if (LEAK.test(JSON.stringify(d.json || {}))) leaks.push(b.slug);
  }
  check(`all ${built.length} batch-5 details hide hiddenTests / referenceSolution`,
    leaks.length === 0, leaks.length ? `leaked: ${leaks.join(', ')}` : `${built.length} checked`);
  check('every batch-5 problem is publicly readable',
    missing.length === 0, missing.length ? missing.join(', ') : 'all 200');

  // --- unauthenticated history must still be refused ------------------------
  const anonSub = await raw('/api/coding/submissions');
  check('submission history requires auth', anonSub.status === 401, `status ${anonSub.status}`);

  // --- a manually-held record must stay invisible ---------------------------
  const held = await raw('/api/coding-problems/friend-circles', { token });
  check('manual-review record is not publicly served', held.status === 404, `status ${held.status}`);

  // --- admin route must refuse an ordinary user -----------------------------
  const admin = await raw('/api/coding-problems/admin/all', { token });
  check('admin route refuses an ordinary user',
    admin.status === 403 || admin.status === 404, `status ${admin.status}`);

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} leak/security checks passed`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
  console.error('LEAK CHECK CRASHED:', e.message);
  process.exit(1);
});