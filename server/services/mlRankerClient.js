const { spawn } = require('child_process');
const path = require('path');

const SERVICE = path.resolve(__dirname, '..', '..', 'ml', 'service.py');
const TIMEOUT_MS = Number(process.env.ML_TIMEOUT_MS || 5000);

// Windows resolves `python` to a Store stub on many machines, so the real
// interpreter is tried in a known order and can be pinned with ML_PYTHON_BIN.
const CANDIDATES = (process.env.ML_PYTHON_BIN || 'python3,py -3,python').split(',').map((s) => s.trim()).filter(Boolean);

function runInterpreter(bin, args, payload) {
  return new Promise((resolve) => {
    const child = spawn(bin, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      child.kill();
      finish({ ok: false, reason: 'timeout' });
    }, TIMEOUT_MS);

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (err) => finish({ ok: false, reason: err.code || 'spawn-error' }));
    child.on('close', (code) => {
      if (code !== 0) return finish({ ok: false, reason: `exit-${code}`, stderr: stderr.slice(0, 400) });
      try {
        finish({ ok: true, data: JSON.parse(stdout) });
      } catch {
        finish({ ok: false, reason: 'bad-json' });
      }
    });

    child.stdin.on('error', () => {});
    child.stdin.end(payload);
  });
}

/**
 * Ask the Python ranker to score a user's real feature vectors.
 * Always resolves: any missing interpreter, timeout, crash or malformed output
 * returns null so the caller can fall back to the built-in ranker.
 * Returns null, never throws.
 */
async function rankWithPython(features) {
  if (!Array.isArray(features) || features.length === 0) return null;
  const payload = JSON.stringify({ features });

  for (const interpreter of CANDIDATES) {
    const parts = interpreter.split(/\s+/);
    const bin = parts[0];
    const result = await runInterpreter(bin, [...parts.slice(1), SERVICE], payload);
    if (result.ok && result.data && typeof result.data === 'object') return result.data;
    if (result.reason === 'bad-json' || result.reason === 'timeout') return null;
  }
  return null;
}

module.exports = { rankWithPython, SERVICE, TIMEOUT_MS, CANDIDATES };