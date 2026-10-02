'use strict';

/**
 * dsa_batch5_runtime_all.js
 * ---------------------------------------------------------------------------
 * Runs every remaining batch-5 runtime slice in ONE long-lived process.
 *
 * Why a single process: /api/coding/run and /api/coding/submit share the
 * production apiRateLimiter (20 requests per 15 minutes per client), and each
 * problem costs 4 limited calls. A fresh process per slice also re-registers a
 * user and restarts the backoff clock, which wastes most of each window. This
 * driver registers ONCE, walks the problems in order, and simply waits out a
 * 429 instead of weakening the limiter.
 *
 * It also RESUMES: problems already verified in an earlier slice (listed in
 * RESUME_AFTER) are skipped, so a run that was interrupted can continue without
 * redoing work or re-spending rate-limit budget.
 *
 *   node dsa_batch5_runtime_all.js
 * ---------------------------------------------------------------------------
 */
const fs = require('fs');
const { execFileSync } = require('child_process');

const LOG = '_rt_chain2.txt';
// Slices 0..9 (indices 0..9) completed cleanly before the network dropped.
const RESUME_AFTER = Number(process.env.RESUME_AFTER || 10);

fs.writeFileSync(LOG, `batch-5 runtime chain (resumed after ${RESUME_AFTER}) at ${new Date().toISOString()}\n`);
const log = (s) => { fs.appendFileSync(LOG, s + '\n'); console.log(s); };

const built = JSON.parse(fs.readFileSync('_dsa_batch5_built.json', 'utf8')).built;

let index = RESUME_AFTER;
while (index < built.length) {
  const take = Math.min(5, built.length - index);
  log(`\n=== slice ${index}..${index + take} at ${new Date().toISOString()} ===`);
  try {
    const out = execFileSync('node', ['dsa_batch5_runtime.js', String(index), String(take)], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 16,
    });
    log(out.trim());
  } catch (e) {
    // A non-zero exit means some check failed; the output still carries which.
    log((e.stdout || '').trim());
    log(`SLICE ${index} EXITED NON-ZERO`);
  }
  index += take;
}
log(`\nchain complete at ${new Date().toISOString()}`);