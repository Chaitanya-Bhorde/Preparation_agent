'use strict';

/**
 * dsa_batch3_runtime.js
 * ---------------------------------------------------------------------------
 * Live-HTTP proof for the batch-2 problems over the real Run/Submit path:
 * open, Run correct, Run wrong, Submit correct, hidden tests, solved state and
 * submission history.
 *
 * /api/coding/run and /api/coding/submit share a production limiter of 20
 * requests per 15 minutes per client. Seventeen problems need more than that in
 * a single pass, so this takes a SLICE of the batch via argv and is meant to be
 * run across a few windows rather than weakening a real safeguard:
 *
 *   node dsa_batch3_runtime.js 0 4    -> problems 0..3
 *   node dsa_batch3_runtime.js 4 4    -> problems 4..7
 * ---------------------------------------------------------------------------
 */
const BASE = process.env.BASE_URL || 'http://localhost:5000';
const fs = require('fs');
const path = require('path');

const START = Number(process.argv[2] || 0);
const COUNT = Number(process.argv[3] || 4);
const PACE_MS = Number(process.env.PACE_MS || 3000);

const email = `dsa_b2_${Date.now()}@example.com`;
const password = 'BatchTwo#2026';
const results = [];

function check(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

/** Rate-limited calls wait for the window to reset rather than exceeding it. */
async function api(p, opts = {}) {
  for (let attempt = 0; attempt <= 60; attempt++) {
    const r = await raw(p, opts);
    if (r.status !== 429) return r;
    await sleep(20000);
  }
  return raw(p, opts);
}

(async () => {
  const all = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch3_built.json'), 'utf8')).built;
  const built = all.slice(START, START + COUNT);
  console.log(`slice ${START}..${START + COUNT} of ${all.length}\n`);

  let reg = await api('/api/auth/register', { method: 'POST', body: { name: 'batch3', email, password } });
  if (reg.status >= 400) reg = await api('/api/auth/login', { method: 'POST', body: { email, password } });
  const token = (reg.json && reg.json.token) || (reg.json && reg.json.data && reg.json.data.token);
  if (!token) { console.log('FATAL: no token'); process.exit(1); }
  check('auth', true, `status ${reg.status}`);

  const list = await api('/api/coding-problems?limit=200', { token });
  const active = (list.json && list.json.data) || [];
  const bySlug = new Map(active.map((p) => [p.slug, p]));
  check('all batch problems are listed as active',
    built.every((b) => bySlug.has(b.slug)),
    `${built.length} in a catalogue of ${active.length}`);

  for (const b of built) {
    const card = bySlug.get(b.slug);
    const detail = await api(`/api/coding-problems/${b.slug}`, { token });
    const p = (detail.json && detail.json.data) || {};

    const hasStatement = String(p.description || '').trim().length >= 80;
    const hasExamples = Array.isArray(p.examples) && p.examples.length > 0
      && p.examples.every((e) => String(e.input || '').trim() && String(e.output || '').trim());
    const hasConstraints = Array.isArray(p.constraints) && p.constraints.length > 0;
    const hasStarter = !!(p.starterCode && p.starterCode.javascript);
    const noLeak = !/hiddenTests|hiddenTestCases|referenceSolution/.test(JSON.stringify(p));

    const referenceCode = b.referenceCode;
    await sleep(PACE_MS);
    const runCorrect = await api('/api/coding/run', {
      method: 'POST', token, body: { problemId: card._id, language: 'javascript', code: referenceCode },
    });
    const rc = (runCorrect.json && runCorrect.json.data) || {};
    check(`Run correct: ${b.title}`, rc.verdict === 'Accepted',
      `${rc.verdict} ${rc.passedTestCases}/${rc.totalTestCases}`);

    await sleep(PACE_MS);
    const runWrong = await api('/api/coding/run', {
      method: 'POST', token, body: { problemId: card._id, language: 'javascript', code: b.wrongCode },
    });
    const rw = (runWrong.json && runWrong.json.data) || {};
    check(`Run wrong: ${b.title}`, rw.verdict === 'WrongAnswer', rw.verdict);

    await sleep(PACE_MS);
    const sub = await api('/api/coding/submit', {
      method: 'POST', token, body: { problemId: card._id, language: 'javascript', code: referenceCode },
    });
    const sd = (sub.json && sub.json.data) || {};
    const hiddenRan = sd.totalTestCases > b.samples;
    check(`Submit correct: ${b.title}`,
      sd.verdict === 'Accepted' && sd.solved === true && hiddenRan,
      `${sd.verdict} ${sd.passedTestCases}/${sd.totalTestCases} solved=${sd.solved} hidden=${hiddenRan}`);

    await sleep(PACE_MS);
    const subWrong = await api('/api/coding/submit', {
      method: 'POST', token, body: { problemId: card._id, language: 'javascript', code: b.wrongCode },
    });
    const swd = (subWrong.json && subWrong.json.data) || {};
    // The verdict is what proves the hidden suite rejected the bad code. The
    // `solved` flag is read back from the database by design, so it stays true
    // after a correct submit that already solved the problem; it is asserted
    // separately in the history check instead.
    check(`Submit wrong: ${b.title}`, swd.verdict !== 'Accepted',
      `${swd.verdict} ${swd.passedTestCases}/${swd.totalTestCases}`);

    const hist = await api(`/api/coding/submissions?problemId=${card._id}`, { token });
    const subs = (hist.json && hist.json.data) || [];
    // Re-read the problem AFTER the submit: userStatus must reflect the solve.
    const after = await api(`/api/coding-problems/${b.slug}`, { token });
    const afterData = (after.json && after.json.data) || {};
    // Both a correct and an incorrect submission must be persisted, so history
    // shows at least two rows and none of them leak a hidden case.
    const histNoLeak = !/hiddenTests|hiddenTestCases|referenceSolution/.test(JSON.stringify(subs));
    check(`History + solved: ${b.title}`,
      subs.length >= 2 && subs.every((s) => s.language && s.verdict && s.createdAt)
      && afterData.userStatus === 'solved' && histNoLeak,
      `${subs.length} submissions, userStatus=${afterData.userStatus}, leak=${!histNoLeak}`);

    check(`Content complete: ${b.title}`,
      hasStatement && hasExamples && hasConstraints && hasStarter && noLeak,
      `stmt=${hasStatement} ex=${hasExamples} cons=${hasConstraints} starter=${hasStarter} leak=${!noLeak}`);
  }

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} runtime checks passed`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
  console.error('RUNTIME CRASHED:', e.message);
  process.exit(1);
});
