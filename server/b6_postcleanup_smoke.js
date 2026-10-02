'use strict';

/**
 * b6_postcleanup_smoke.js  (rate-limit friendly)
 * ---------------------------------------------------------------------------
 * Post-cleanup smoke test that does NOT consume the apiRateLimiter window, so it
 * can run while another verification is legitimately waiting on that window.
 *
 * The limiter guards only /api/coding/run and /api/coding/submit (and
 * /api/ats/analyze). The catalogue GET routes are unguarded, so this script
 * proves the post-cleanup serving path using only those:
 *
 *   - auth works (register)                       -> authentication intact
 *   - public LIST returns exactly the 189 active  -> catalogue intact
 *   - a deleted (held) slug is NOT publicly served -> the 29 really are gone
 *   - detail carries statement/examples/constraints/starter, and still leaks
 *     neither hiddenTests nor referenceSolution      -> judge content intact
 *   - submission history still requires auth       -> RBAC intact
 *
 * The judge itself (Accepted / WrongAnswer verdicts) is proven by the completed
 * 4-slice runtime chain plus the server jest suite (judge0Coding), so this
 * script deliberately does not re-burn a limited window.
 *
 *   node b6_postcleanup_smoke.js
 * ---------------------------------------------------------------------------
 */
const BASE = process.env.BASE_URL || 'http://localhost:5000';
const fs = require('fs');
const path = require('path');

const built = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_dsa_batch6_built.json'), 'utf8')).built;
const allow = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_b6_cleanup_allowlist.json'), 'utf8'));

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

(async () => {
  const health = await raw('/api/health');
  check('health endpoint', health.status === 200, `status ${health.status}`);

  const email = `b6_smoke_${Date.now()}@example.com`;
  const reg = await raw('/api/auth/register', {
    method: 'POST', body: { name: 'b6smoke', email, password: 'SmokeSix#2026' },
  });
  const token = (reg.json && reg.json.token) || (reg.json && reg.json.data && reg.json.data.token);
  check('authentication works (register)', !!token, `status ${reg.status}`);

  // Catalogue must be exactly the 189 preserved problems.
  const list = await raw('/api/coding-problems?limit=400', { token });
  const active = (list.json && list.json.data) || [];
  check('catalogue serves exactly 189 active problems', active.length === 189, `${active.length} served`);
  check('all 21 batch-6 activated problems still listed',
    built.every((b) => active.some((p) => p.slug === b.slug)), `${built.length} found`);

  // The 29 deleted must be gone from the public API.
  let leakedDeleted = 0;
  for (const rec of allow.records.slice(0, 29)) {
    const d = await raw(`/api/coding-problems/${rec.slug}`, { token });
    if (d.status === 200) leakedDeleted++;
  }
  check('all 29 deleted records are unservable', leakedDeleted === 0,
    leakedDeleted ? `${leakedDeleted} still returned` : 'all 29 return non-200');

  // Content completeness + no hidden-test leak on a sample.
  const LEAK = /hiddenTests|hiddenTestCases|referenceSolution/;
  let incomplete = 0;
  let leaks = 0;
  for (const b of built) {
    const d = await raw(`/api/coding-problems/${b.slug}`, { token });
    const p = (d.json && d.json.data) || {};
    const ok = String(p.description || '').trim().length >= 80
      && Array.isArray(p.examples) && p.examples.length > 0
      && Array.isArray(p.constraints) && p.constraints.length > 0
      && !!(p.starterCode && p.starterCode.javascript);
    if (!ok) incomplete++;
    if (LEAK.test(JSON.stringify(p))) leaks++;
  }
  check('all 21 batch-6 problems serve complete content', incomplete === 0,
    incomplete ? `${incomplete} incomplete` : 'statement+examples+constraints+starter');
  check('no hidden tests or reference solutions are served', leaks === 0,
    leaks ? `${leaks} leaked` : '0 leaks across 21 problems');

  const hist = await raw('/api/coding/submissions');
  check('submission history still requires auth (RBAC intact)', hist.status === 401, `status ${hist.status}`);

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} POST-CLEANUP SMOKE CHECKS PASSED`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
  console.error('SMOKE CRASHED:', e.message);
  process.exit(1);
});