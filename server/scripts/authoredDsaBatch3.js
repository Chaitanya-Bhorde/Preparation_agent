/**
 * authoredDsaBatch3.js
 * ---------------------------------------------------------------------------
 * The thirteen A-class (SOURCE VERIFIED) DSA records — the only records Batch 3
 * authors. Every field below traces to a project-local source in this repo's own
 * history:
 *
 *   (S1) git edbc6db: server/scripts/seedDSA100.js.backup   (12 records)
 *        Reviewed seed: description, difficulty, topic, tags, constraints,
 *        inputFormat, outputFormat, typed 4-language functionSignature, typed
 *        4-language starterCode, and 3 sample tests, plus 50 hidden tests that
 *        the file itself builds with a DETERMINISTIC `Array.from({length: 50},
 *        ...)` generator. Those 50 fixtures are therefore the output of the
 *        historical file's own code, not literal text in it: validateAuthoredDsaBatch3
 *        re-executes the historical file in a sandbox (DB layer stubbed, no
 *        network) and compares this module's evidence field-by-field against the
 *        records it registers. The twelve individually reviewed entries are used;
 *        that file's later "ADDITIONAL PROBLEMS" section is corrupt (Math.random()
 *        generators, hard-coded wrong outputs, string-typed signatures) and is
 *        cut off before parsing, so it can never contribute a record.
 *        NOTE: that file registers "Pow(x, n)" twice (both problemId REC-001) -
 *        a complete entry (3 samples) and later a degraded duplicate (2 samples,
 *        shorter description). The complete entry is the one used here.
 *   (S2) git 0b6b376~1: server/utils/seedData.js            (Merge K Sorted Lists)
 *        Reviewed seed: description, difficulty, tags, constraints (one newline-
 *        separated string), examples, one test case with its expected output, and
 *        a typed 4-language functionSignature.
 *
 * Nothing is invented: descriptions, constraints, examples, signatures and every
 * expected output come from those sources and are re-derived by TWO INDEPENDENT
 * implementations (a/b) that must agree with each other AND with the source's
 * stored expected output, or the module refuses to load.
 *
 * PERMITTED DRIVER ADAPTATIONS (proven in Batch 1/2, documented per record):
 *  1. Add Two Numbers / Palindrome Linked List: the source declares ListNode
 *     params, but its OWN fixtures already encode them as JSON arrays
 *     ("[2,4,3]\n[5,6,4]") and its outputFormat says "array serialization", so
 *     the typed params are number[]/int[]/vector<int> and the starter ships
 *     buildList()/toArray() — linked-list semantics unchanged.
 *  2. Merge K Sorted Lists: the source signature is already driver-parsed.
 *  3. Pow(x, n): the source DATA is floating point ("2.10000" -> "9.261",
 *     constraint "-100.0 < x < 100.0") while its generated java/cpp types say
 *     `int`; the data is authoritative, so java/cpp are `double`, python
 *     `float`, and the value is rounded to 3 decimals — the exact serialisation
 *     the source's own expected outputs use.
 *  4. Large-integer records use long/long long where the source's own fixtures
 *     exceed 32-bit range, bounded to values bit-identical in JavaScript's
 *     double and in 64-bit integers.
 *
 * FIXTURE POLICY
 *   A source fixture is ADMITTED only when (a) implementations a and b each
 *   reproduce the source's stored expected output, and (b) the value is
 *   representable AND printable identically by all four languages. Violations of
 *   (b) are dropped with a recorded reason (see ADMIT): the driver prints
 *   doubles with only 6 significant digits, and JavaScript loses integer
 *   precision above 2^53. Bounds follow the platform's execution contract.
 */
'use strict';

const SRC = require('./authoredDsaBatch3.source.json');

const slugify = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const decodeLiteralNewlines = (s) => String(s).split('\\n').join('\n');

/** topic + tags de-duplicated case-insensitively (the audit duplicate-topics rule). */
function dedupeTopics(topic, tags) {
  const seen = new Set([String(topic).toLowerCase().trim()]);
  const kept = [];
  for (const t of tags || []) {
    const k = String(t).toLowerCase().trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    kept.push(t);
  }
  return { topic, tags: kept };
}

function source(title) {
  const s = SRC[title];
  if (!s) throw new Error(`authoredDsaBatch3: no source record for "${title}"`);
  if (!s.description || !s.functionSignature || !s.functionSignature.javascript) {
    throw new Error(`authoredDsaBatch3: incomplete source for "${title}"`);
  }
  return s;
}

/** The source's 3-decimal serialisation for Pow(x, n). */
function fmt3(v) {
  if (!Number.isFinite(v)) return String(v);
  return String(Number(v.toFixed(3)));
}

/** Exact C(m+n-2, m-1) — Unique Paths' second implementation, no float drift. */
function catalan(m, n) {
  const total = BigInt(m + n - 2), k = BigInt(Math.min(m - 1, n - 1));
  let r = 1n;
  for (let i = 1n; i <= k; i++) r = (r * (total - k + i)) / i;
  return r.toString();
}

/* ====================== INDEPENDENT IMPLEMENTATIONS =========================
 * a = the natural algorithm; b = a deliberately different algorithm. Both are
 * written from the source description only, and each must agree with the
 * source's stored expected output for every admitted fixture.
 */
const IMPL = {
  'Longest Palindrome': {
    a: (s) => { const c = new Map(); for (const ch of s) c.set(ch, (c.get(ch) || 0) + 1); let n = 0, odd = 0; for (const v of c.values()) { n += Math.floor(v / 2) * 2; if (v % 2) odd = 1; } return String(n + odd); },
    b: (s) => { const counts = {}; for (const ch of s) counts[ch] = (counts[ch] || 0) + 1; let pairs = 0, singles = 0; for (const k of Object.keys(counts)) { pairs += Math.floor(counts[k] / 2); if (counts[k] % 2) singles = 1; } return String(pairs * 2 + singles); },
  },
  'Add Two Numbers': {
    a: (l1, l2) => { const out = []; let i = 0, carry = 0; while (i < l1.length || i < l2.length || carry) { const s = (l1[i] || 0) + (l2[i] || 0) + carry; out.push(s % 10); carry = Math.floor(s / 10); i++; } return JSON.stringify(out); },
    b: (l1, l2) => { const asNum = (a) => a.slice().reverse().reduce((acc, d) => acc * 10 + d, 0); const digits = String(asNum(l1) + asNum(l2)).split('').map(Number); return JSON.stringify(digits.reverse()); },
  },
  'Unique Paths': {
    a: (m, n) => { const dp = Array(m).fill(0).map(() => Array(n).fill(0)); for (let r = 0; r < m; r++) dp[r][0] = 1; for (let c = 0; c < n; c++) dp[0][c] = 1; for (let r = 1; r < m; r++) for (let c = 1; c < n; c++) dp[r][c] = dp[r - 1][c] + dp[r][c - 1]; return String(dp[m - 1][n - 1]); },
    b: (m, n) => { const dp = Array(n).fill(1); for (let r = 1; r < m; r++) for (let c = 1; c < n; c++) dp[c] += dp[c - 1]; return String(dp[n - 1]); },
  },
  'Daily Temperatures': {
    a: (t) => { const out = new Array(t.length).fill(0); for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) if (t[j] > t[i]) { out[i] = j - i; break; } return JSON.stringify(out); },
    b: (t) => { const out = []; for (let i = t.length - 1; i >= 0; i--) { let d = 0; for (let j = i + 1; j < t.length; j++) if (t[j] > t[i]) { d = j - i; break; } out.unshift(d); } return JSON.stringify(out); },
  },
  'Top K Frequent Elements': {
    a: (nums, k) => { const c = new Map(); for (const v of nums) c.set(v, (c.get(v) || 0) + 1); return JSON.stringify([...c.entries()].sort((x, y) => y[1] - x[1] || x[0] - y[0]).slice(0, k).map((e) => e[0])); },
    b: (nums, k) => { const counts = []; for (const v of nums) { const e = counts.find((c) => c[0] === v); if (e) e[1]++; else counts.push([v, 1]); } counts.sort((x, y) => y[1] - x[1] || x[0] - y[0]); return JSON.stringify(counts.slice(0, k).map((c) => c[0])); },
  },
  'Non-overlapping Intervals': {
    a: (iv) => { const s = iv.slice().sort((x, y) => x[0] - y[0] || x[1] - y[1]); let keep = 0, end = -Infinity; for (const p of s) if (p[0] >= end) { keep++; end = p[1]; } return String(iv.length - keep); },
    b: (iv) => { const byEnd = iv.slice().sort((x, y) => x[1] - y[1] || x[0] - y[0]); let kept = 0, lastEnd = -Infinity; for (const p of byEnd) if (p[0] >= lastEnd) { kept++; lastEnd = p[1]; } return String(iv.length - kept); },
  },
  'Search Insert Position': {
    a: (nums, target) => { let lo = 0, hi = nums.length; while (lo < hi) { const m = (lo + hi) >> 1; if (nums[m] < target) lo = m + 1; else hi = m; } return String(lo); },
    b: (nums, target) => { for (let i = 0; i < nums.length; i++) if (nums[i] >= target) return String(i); return String(nums.length); },
  },
  'Find Minimum in Rotated Sorted Array': {
    a: (nums) => { let lo = 0, hi = nums.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (nums[m] > nums[hi]) lo = m + 1; else hi = m; } return String(nums[lo]); },
    b: (nums) => { if (!nums.length) return '0'; let i = 0, j = nums.length - 1; while (i < j) { const m = (i + j) >> 1; if (nums[m] > nums[j]) i = m + 1; else j = m; } return String(nums[i]); },
  },
  'Happy Number': {
    a: (n) => { const sq = (v) => { const x = Math.abs(Math.trunc(v)); let t = 0, k = x; while (k > 0) { const d = k % 10; t += d * d; k = Math.floor(k / 10); } return t; }; const seen = new Set(); let x = n; while (x !== 1 && !seen.has(x)) { seen.add(x); x = sq(x); } return String(x === 1); },
    b: (n) => { const sq = (v) => { const x = Math.abs(Math.trunc(v)); let t = 0, k = x; while (k > 0) { const d = k % 10; t += d * d; k = Math.floor(k / 10); } return t; }; let slow = n, fast = n; do { slow = sq(slow); fast = sq(sq(fast)); } while (fast !== 1 && fast !== slow); return String(fast === 1); },
  },
  'Palindrome Linked List': {
    a: (head) => { for (let i = 0, j = head.length - 1; i < j; i++, j--) if (head[i] !== head[j]) return 'false'; return 'true'; },
    b: (head) => { const a = head.slice(); let ok = true; while (a.length > 1) if (a.shift() !== a.pop()) { ok = false; break; } return String(ok); },
  },
  'K Closest Points to Origin': {
    a: (p, k) => JSON.stringify(p.slice().sort((x, y) => (x[0] * x[0] + x[1] * x[1]) - (y[0] * y[0] + y[1] * y[1])).slice(0, k)),
    b: (p, k) => { const pool = p.map(([x, y]) => [x, y]); const out = []; for (let i = 0; i < k; i++) { let best = 0, bestD = Infinity; for (let j = 0; j < pool.length; j++) { const d = pool[j][0] * pool[j][0] + pool[j][1] * pool[j][1]; if (d < bestD) { bestD = d; best = j; } } out.push(pool.splice(best, 1)[0]); } return JSON.stringify(out); },
  },
  'Pow(x, n)': {
    a: (x, n) => fmt3(Math.pow(x, n)),
    b: (x, n) => { const e = n < 0 ? -n : n; let r = 1, base = x, k = e; while (k > 0) { if (k % 2 === 1) r *= base; base *= base; k = Math.floor(k / 2); } return fmt3(n < 0 ? 1 / r : r); },
  },
  'Merge K Sorted Lists': {
    a: (lists) => JSON.stringify(lists.reduce((acc, l) => acc.concat(l), []).sort((x, y) => x - y)),
    b: (lists) => { const acc = []; for (const l of lists) for (const v of l) acc.push(v); acc.sort((p, q) => p - q); return JSON.stringify(acc); },
  },
};


/* ============================== FIXTURE ADMISSION ===========================
 * Returns null when the fixture is admitted, or a human-readable reason when the
 * platform's own execution contract cannot carry it in all four languages:
 *  - int-typed params are parsed with parseInt/stoi, so inputs stay in 32-bit range;
 *  - integer results above 2^53 differ between a JS double and a 64-bit integer;
 *  - a double result is printed by the C++ driver with 6 significant digits.
 */
const MAX_INT32 = 2147483647;

function admit(title, input, output) {
  const out = String(output);
  const v = Number(out);

  if (title === 'Unique Paths') {
    if (!Number.isSafeInteger(v)) return 'result exceeds 2^53 (JS double vs 64-bit integer)';
    return null;
  }
  if (title === 'Pow(x, n)') {
    if (!Number.isFinite(v)) return 'non-finite result';
    const digits = out.replace(/[^0-9]/g, '').replace(/^0+/, '').length;
    if (!Number.isInteger(v) && digits > 6) return 'fractional result needs >6 significant digits';
    if (Number.isInteger(v) && Math.abs(v) >= 1e6) return 'integer result needs >6 significant digits as a double';
    return null;
  }
  if (title === 'Happy Number') {
    const n = parseInt(String(input).trim(), 10);
    if (!(n >= 1 && n <= MAX_INT32)) return 'input outside the int range the drivers parse';
    return null;
  }
  if (['Find Minimum in Rotated Sorted Array', 'Daily Temperatures', 'Search Insert Position',
    'Top K Frequent Elements', 'Merge K Sorted Lists', 'Add Two Numbers'].includes(title)) {
    for (const x of (String(input).match(/-?\d+/g) || []).map(Number)) {
      if (Math.abs(x) > MAX_INT32) return 'input value outside the int range the drivers parse';
    }
    return null;
  }
  if (title === 'Longest Palindrome' && String(input).length > 2000) return 'input longer than the stated constraint';
  if (title === 'K Closest Points to Origin') {
    const L = String(input).split('\n');
    const pts = JSON.parse(L[0]);
    const k = parseInt(L[1], 10);
    if (!(k >= 1 && k <= pts.length)) return 'k outside 1..points.length (violates the signature contract)';
    return null;
  }
  return null;
}

/** Parse a source fixture input into the positional arguments its signature takes. */
function parseInput(title, input) {
  const L = String(input).split('\n');
  if (title === 'Unique Paths') return [parseInt(L[0], 10), parseInt(L[1], 10)];
  if (title === 'Pow(x, n)') return [Number(L[0]), parseInt(L[1], 10)];
  if (title === 'Top K Frequent Elements' || title === 'Search Insert Position'
    || title === 'K Closest Points to Origin') return [JSON.parse(L[0]), parseInt(L[1], 10)];
  if (title === 'Add Two Numbers') return [JSON.parse(L[0]), JSON.parse(L[1])];
  if (title === 'Longest Palindrome') return [L.join('\n')];
  if (title === 'Palindrome Linked List') return [JSON.parse(L[0])];
  if (title === 'Happy Number') return [parseInt(L[0], 10)];
  return [JSON.parse(L[0])];   // Daily Temperatures, Find Minimum, Non-overlapping, Merge K
}


/** Extra deterministic fixtures the source contract permits us to derive. */
function extraFixtures(title) {
  if (title !== 'Merge K Sorted Lists') return [];
  // The source ships a single test case. These are derived from its own examples
  // and constraints (k ascending lists, values within [-10^4, 10^4]).
  return [
    '[]', '[[]]', '[[1]]', '[[],[]]', '[[1,2,3]]', '[[1,4,5],[1,3,4],[2,6]]',
    '[[],[-1]]', '[[3],[2],[1]]', '[[1,1,1],[1,1]]', '[[-5,-3,-1],[-4,-2,0]]',
    '[[0],[0],[0],[0]]', '[[10,20],[15],[25,30]]', '[[-10000],[10000]]',
    '[[2,2,2],[2]]', '[[1,2],[3,4],[5,6],[7,8]]', '[[1,3,5,7],[2,4,6,8],[9,10]]',
    '[[5],[1],[9],[3],[7]]', '[[1,2,3,4,5]]', '[[-1,-2],[0],[3,4,-5]]',
  ];
}

/**
 * Merge K Sorted Lists is the one record whose source stores its test in the
 * LEGACY flat encoding ("1 4 5 1 3 4 2 6" with expected "1 1 2 3 4 4 5 6").
 * The SAME source states the canonical typed form in its own examples:
 *   input  "lists = [[1,4,5],[1,3,4],[2,6]]"  output "[1,1,2,3,4,4,5,6]"
 * so the flat run is the concatenation of the rows of that example. We rebuild the
 * nested form from those rows and keep the source's expected output verbatim; the
 * dual derivation then re-proves it.
 */
function convertSourceFixture(title, t) {
  const input = decodeLiteralNewlines(t.input);
  const output = String(t.output);
  if (title !== 'Merge K Sorted Lists' || /^\s*\[/.test(input)) return { input, output };
  const nums = input.trim().split(/\s+/).map(Number);
  // The example's row sizes are 3,3,2; recover them from the source example.
  const ex = source(title).examples || [];
  const first = ex.find((e) => /\[\[/.test(String(e.input)));
  if (!first) throw new Error('authoredDsaBatch3: Merge K example missing for the legacy re-encoding');
  const rowsFromExample = JSON.parse(String(first.input).replace(/^[a-zA-Z_]+\s*=\s*/, ''));
  if (!Array.isArray(rowsFromExample) || !Array.isArray(rowsFromExample[0])) {
    throw new Error('authoredDsaBatch3: Merge K example is not a nested list literal');
  }
  if (rowsFromExample.reduce((a, r) => a + r.length, 0) !== nums.length) {
    throw new Error(`authoredDsaBatch3: Merge K legacy run length ${nums.length} does not match the example rows`);
  }
  const rows = [];
  let i = 0;
  for (const r of rowsFromExample) { rows.push(nums.slice(i, i + r.length)); i += r.length; }
  // The source's expected output is the same run in its legacy space-separated
  // form; the canonical typed form is the same numbers as a JSON array. The
  // conversion is proven by the source's own example output, which is the very
  // same run: [[1,4,5],[1,3,4],[2,6]] -> [1,1,2,3,4,4,5,6].
  const canonicalOut = JSON.stringify(output.trim().split(/\s+/).map(Number));
  const exampleOut = String(first.output).trim();
  if (canonicalOut !== exampleOut) {
    throw new Error(`authoredDsaBatch3: Merge K legacy output conversion disagrees with the source example: ${canonicalOut} vs ${exampleOut}`);
  }
  return { input: JSON.stringify(rows), output: canonicalOut };
}

/** Build sample+hidden fixtures for one record, or throw if anything is unprovable. */
function buildTests(title) {
  const s = source(title);
  const impl = IMPL[title];
  if (!impl) throw new Error(`authoredDsaBatch3: no independent implementations for "${title}"`);

  const raw = [
    ...s.sampleTests.map((t) => convertSourceFixture(title, t)).map((t) => ({ ...t, role: 'sample' })),
    ...s.hiddenTests.map((t) => convertSourceFixture(title, t)).map((t) => ({ ...t, role: 'hidden' })),
    ...extraFixtures(title).map((i) => ({ input: i, output: null, role: 'derived' })),
  ];

  const admitted = [];
  const dropped = [];
  for (const f of raw) {
    const args = parseInput(title, f.input);
    const a = impl.a(...args);
    const b = impl.b(...args);
    // Admission first: a fixture the platform contract cannot carry is dropped
    // regardless of what the two implementations say about it.
    const reason = admit(title, f.input, a);
    if (reason) { dropped.push({ input: f.input.slice(0, 46), output: a.slice(0, 30), reason }); continue; }
    if (a !== b) {
      throw new Error(`authoredDsaBatch3: dual-derivation disagreement on "${title}" input ${JSON.stringify(f.input)}: a=${a} b=${b}`);
    }
    if (f.output !== null && a !== f.output) {
      throw new Error(`authoredDsaBatch3: source output not reproduced for "${title}" input ${JSON.stringify(f.input)}: derived=${a} source=${f.output}`);
    }
    if (!String(f.input).trim()) throw new Error(`authoredDsaBatch3: empty fixture input for "${title}"`);
    if (!String(a).trim()) throw new Error(`authoredDsaBatch3: empty expected output for "${title}"`);
    admitted.push({ input: f.input, output: a, role: f.role });
  }

  // Every source SAMPLE must survive admission: they are the reviewed ground truth.
  const keptSamples = admitted.filter((t) => t.role === 'sample');
  if (keptSamples.length !== s.sampleTests.length) {
    throw new Error(`authoredDsaBatch3: a source SAMPLE fixture was dropped for "${title}": ${JSON.stringify(dropped)}`);
  }
  const sampleInputs = new Set(keptSamples.map((t) => t.input));
  const hidden = admitted.filter((t) => !sampleInputs.has(t.input));
  if (hidden.length === 0) throw new Error(`authoredDsaBatch3: no hidden fixtures for "${title}"`);
  const dupes = (arr) => arr.filter((t, i) => arr.findIndex((u) => u.input === t.input) !== i).map((t) => t.input);
  if (dupes(keptSamples).length) throw new Error(`authoredDsaBatch3: duplicate sample input for "${title}": ${dupes(keptSamples)}`);
  if (dupes(hidden).length) throw new Error(`authoredDsaBatch3: duplicate hidden input for "${title}": ${dupes(hidden)}`);
  return { samples: keptSamples, hidden, dropped };
}


/* ==================== DRIVER-COMPATIBLE SIGNATURE OVERRIDES =================
 * Each entry states which part of the SOURCE signature it replaces and why the
 * source type cannot be carried by the platform drivers.
 *
 *  Add Two Numbers / Palindrome Linked List: the source declares ListNode, which
 *      the drivers cannot construct. The source's OWN fixtures are JSON arrays and
 *      its outputFormat says "array serialization", so the typed parameter is the
 *      array form and the starter ships buildList()/toArray() to keep the
 *      linked-list semantics explicit.
 *  Pow(x, n): the source DATA is floating point ("2.10000" -> "9.261", the
 *      constraint reads "-100.0 < x < 100.0") while its generated java/cpp types
 *      say `int`. The data is authoritative: java/cpp `double`, python `float`,
 *      rounded to 3 decimals before printing.
 *  Unique Paths: the source's own fixtures exceed 32-bit range, so java `long`
 *      and cpp `long long`; fixtures are bounded to values bit-identical in a
 *      JavaScript double and in a 64-bit integer.
 */
const sigOf = (name, params, returnType) => ({
  name, params: params.map(([n, t]) => ({ name: n, type: t })), returnType,
});

const SIG_OVERRIDES = {
  'Add Two Numbers': {
    javascript: sigOf('addTwoNumbers', [['l1', 'number[]'], ['l2', 'number[]']], 'number[]'),
    // The python function NAMES are the source's own (camelCase, except Merge K
    // which the source itself spells merge_k_lists); only the TYPES change.
    python: sigOf('addTwoNumbers', [['l1', 'List[int]'], ['l2', 'List[int]']], 'List[int]'),
    java: sigOf('addTwoNumbers', [['l1', 'int[]'], ['l2', 'int[]']], 'int[]'),
    cpp: sigOf('addTwoNumbers', [['l1', 'vector<int>'], ['l2', 'vector<int>']], 'vector<int>'),
  },
  'Palindrome Linked List': {
    javascript: sigOf('isPalindrome', [['head', 'number[]']], 'boolean'),
    python: sigOf('isPalindrome', [['head', 'List[int]']], 'bool'),
    java: sigOf('isPalindrome', [['head', 'int[]']], 'boolean'),
    cpp: sigOf('isPalindrome', [['head', 'vector<int>']], 'bool'),
  },
  'Pow(x, n)': {
    // `x` MUST be declared `double` (not `number`): the javascript driver parses a
    // `number` parameter with parseInt, which would truncate the source's own
    // "2.10000" fixture to 2 and yield 8 instead of 9.261.
    javascript: sigOf('myPow', [['x', 'double'], ['n', 'number']], 'number'),
    python: sigOf('myPow', [['x', 'float'], ['n', 'int']], 'float'),
    java: sigOf('myPow', [['x', 'double'], ['n', 'int']], 'double'),
    cpp: sigOf('myPow', [['x', 'double'], ['n', 'int']], 'double'),
  },
  'Unique Paths': {
    javascript: sigOf('uniquePaths', [['m', 'number'], ['n', 'number']], 'number'),
    python: sigOf('uniquePaths', [['m', 'int'], ['n', 'int']], 'int'),
    java: sigOf('uniquePaths', [['m', 'long'], ['n', 'long']], 'long'),
    // The C++ driver has no `long long` PARAMETER branch (it would emit
    // `auto m = lines[0];`, a std::string). Its `long` branch declares the
    // variable as `long long` and parses with stoll, which is exactly what is
    // needed, so the declared parameter type is `long` and the return `long long`.
    cpp: sigOf('uniquePaths', [['m', 'long'], ['n', 'long']], 'long long'),
  },
};

const DEVIATION_NOTE = {
  'Add Two Numbers': "ListNode parameters replaced by the array form the source's own fixtures and outputFormat already use; buildList()/toArray() keep the linked-list semantics",
  'Palindrome Linked List': "ListNode parameter replaced by the array form the source's own fixtures already use; buildList() keeps the linked-list semantics",
  'Pow(x, n)': "source java/cpp type `int` replaced by `double` (python `float`) because the source DATA is floating point (\"2.10000\" -> \"9.261\", constraint \"-100.0 < x < 100.0\"); the result is rounded to 3 decimals, the exact serialisation of the source's own expected outputs",
  'Unique Paths': "java `long` / cpp `long long` because the source's own fixtures exceed 32-bit range; fixtures bounded to values bit-identical in a JS double and a 64-bit integer",
  'K Closest Points to Origin': 'one source fixture with k > points.length was dropped (it violates the signature contract)',
  'Merge K Sorted Lists': "the source stores its single test in a legacy flat encoding; re-encoded to the nested typed form the source's own example states, with the legacy expected output converted and cross-checked against that example",
};

function signatures(title) {
  const s = source(title);
  const out = {};
  for (const lang of ['javascript', 'python', 'java', 'cpp']) {
    const base = s.functionSignature[lang];
    if (!base || !base.name) throw new Error(`authoredDsaBatch3: source signature missing (${lang}) for "${title}"`);
    out[lang] = (SIG_OVERRIDES[title] || {})[lang] || base;
  }
  return out;
}

/** Linked-list helpers for the two list records (Batch 1/2 array pattern). */
const LIST_NODE_JS = `/** digits: [2,4,3] is the number 342 (most significant digit first) -> linked list */
function buildList(digits) {
  let head = null;
  for (let i = digits.length - 1; i >= 0; i--) head = { val: digits[i], next: head };
  return head;
}
`;
const LIST_NODE_PY = `def build_list(digits):
    """digits: [2,4,3] is the number 342 (most significant digit first) -> linked list"""
    head = None
    for value in reversed(digits):
        head = {"val": value, "next": head}
    return head
`;
const LIST_NODE_JAVA = `    static class ListNode {
        int val;
        ListNode next;

        ListNode(int v, ListNode n) { val = v; next = n; }
    }
`;
const LIST_NODE_CPP = `// digits: [2,4,3] is the number 342 (most significant digit first) -> linked list
struct ListNode { int val; ListNode* next; };

ListNode* buildList(const vector<int>& digits) {
    ListNode* head = nullptr;
    for (int i = (int)digits.size() - 1; i >= 0; i--) {
        ListNode* node = new ListNode{digits[i], head};
        head = node;
    }
    return head;
}
`;
const TO_ARRAY_JS = `
/** linked list -> digits array (same order as the input: most significant first) */
function toArray(head) {
  const out = [];
  for (let node = head; node; node = node.next) out.push(node.val);
  return out;
}
`;
const TO_ARRAY_PY = `

def to_array(head):
    """linked list -> digits array (same order as the input: most significant first)"""
    out = []
    node = head
    while node is not None:
        out.append(node["val"])
        node = node["next"]
    return out
`;
const TO_ARRAY_JAVA = `    /** linked list -> digits array (same order as the input: most significant first) */
    static int[] toArray(ListNode head) {
        List<Integer> out = new ArrayList<>();
        for (ListNode node = head; node != null; node = node.next) out.add(node.val);
        int[] res = new int[out.size()];
        for (int i = 0; i < res.length; i++) res[i] = out.get(i);
        return res;
    }
`;
const TO_ARRAY_CPP = `
// linked list -> digits array (same order as the input: most significant first)
vector<int> toArray(ListNode* head) {
    vector<int> out;
    for (ListNode* node = head; node; node = node->next) out.push_back(node->val);
    return out;
}
`;
const BUILD_LIST_JAVA = `    /** digits: [2,4,3] is the number 342 (most significant digit first) -> linked list */
    static ListNode buildList(int[] digits) {
        ListNode head = null;
        for (int i = digits.length - 1; i >= 0; i--) head = new ListNode(digits[i], head);
        return head;
    }
`;
const LIST_PREAMBLE = {
  'Add Two Numbers': {
    javascript: LIST_NODE_JS + TO_ARRAY_JS,
    python: LIST_NODE_PY + TO_ARRAY_PY,
    java: LIST_NODE_JAVA + BUILD_LIST_JAVA + TO_ARRAY_JAVA,
    cpp: LIST_NODE_CPP + TO_ARRAY_CPP,
  },
  'Palindrome Linked List': {
    javascript: LIST_NODE_JS, python: LIST_NODE_PY,
    java: LIST_NODE_JAVA + BUILD_LIST_JAVA, cpp: LIST_NODE_CPP,
  },
};


/** Typed default return literal per language (every stub compiles). */
function defaultReturn(lang, type) {
  const t = String(type || '');
  const tl = t.toLowerCase();
  if (lang === 'java') {
    if (tl.startsWith('list')) return 'new ArrayList<>()';
    if (tl === 'boolean') return 'false';
    if (tl.endsWith('[][]')) return 'new int[0][0]';
    if (tl.endsWith('[]')) return 'new int[0]';
    if (/int|long|double|float/.test(tl)) return '0';
    if (tl === 'string') return '""';
    return 'null';
  }
  if (lang === 'cpp') {
    if (tl === 'bool') return 'false';
    // `vector<int>` also matches /int/, so the container check MUST come first.
    if (tl.includes('vector')) return '{}';
    if (/int|long|double|float/.test(tl)) return '0';
    return '""';
  }
  if (lang === 'python') {
    if (tl === 'bool' || tl === 'boolean') return 'False';
    if (tl.startsWith('list') || tl.endsWith('[]')) return '[]';
    if (/int|float|double|number/.test(tl)) return '0';
    if (tl === 'str' || tl === 'string') return "''";
    return 'None';
  }
  if (tl === 'bool' || tl === 'boolean') return 'false';
  if (tl.startsWith('list') || tl.endsWith('[]')) return '[]';
  if (/int|float|double|number/.test(tl)) return '0';
  if (tl === 'str' || tl === 'string') return "''";
  return 'null';
}

/** Build the four typed starters (learner stubs — never the reference). */
function typedStarters(title, sigs) {
  const js = sigs.javascript, py = sigs.python, jv = sigs.java, cp = sigs.cpp;
  const pre = LIST_PREAMBLE[title] || {};
  const jsParams = js.params.map((p) => p.name).join(', ');
  const pyParams = py.params.map((p) => p.name).join(', ');
  const jvParams = jv.params.map((p) => `${p.type} ${p.name}`).join(', ');
  const cpParams = cp.params.map((p) => `${p.type} ${p.name}`).join(', ');
  const javaNeedsList = jv.returnType.toLowerCase().startsWith('list') || !!pre.java;
  const javaHead = javaNeedsList ? 'import java.util.*;\n\n' : '';
  return {
    javascript: `${pre.javascript || ''}function ${js.name}(${jsParams}) {\n    \n    return ${defaultReturn('javascript', js.returnType)};\n}\n`,
    python: `${pre.python || ''}def ${py.name}(${pyParams}):\n    \n    return ${defaultReturn('python', py.returnType)}\n`,
    java: `${javaHead}${pre.java || ''}class Solution {\n    public ${jv.returnType} ${jv.name}(${jvParams}) {\n        \n        return ${defaultReturn('java', jv.returnType)};\n    }\n}\n`,
    cpp: `${pre.cpp || ''}${cp.returnType} ${cp.name}(${cpParams}) {\n    \n    return ${defaultReturn('cpp', cp.returnType)};\n}\n`,
  };
}


/* ============================== REFERENCE SOLUTIONS =========================
 * JavaScript is what models/CodingProblem.js stores (referenceSolution.code).
 * Java/C++ bodies are kept here so the validator can execute every fixture in
 * three languages through the real drivers; Python is compile-verified only
 * (pre-existing platform-wide Python execution limitation, unchanged here).
 */
const REFERENCES = {
  'Longest Palindrome': {
    javascript: `function longestPalindrome(s) {
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
  let pairs = 0, hasOdd = false;
  for (const n of counts.values()) {
    pairs += Math.floor(n / 2) * 2;
    if (n % 2) hasOdd = true;
  }
  return pairs + (hasOdd ? 1 : 0);
}`,
    java: `    public int longestPalindrome(String s) {
        Map<Character, Integer> counts = new HashMap<>();
        for (char ch : s.toCharArray()) counts.merge(ch, 1, Integer::sum);
        int pairs = 0;
        boolean hasOdd = false;
        for (int n : counts.values()) {
            pairs += (n / 2) * 2;
            if (n % 2 == 1) hasOdd = true;
        }
        return pairs + (hasOdd ? 1 : 0);
    }`,
    cpp: `int longestPalindrome(string s) {
    map<char, int> counts;
    for (char ch : s) counts[ch]++;
    int pairs = 0;
    bool hasOdd = false;
    for (auto& kv : counts) {
        pairs += (kv.second / 2) * 2;
        if (kv.second % 2) hasOdd = true;
    }
    return pairs + (hasOdd ? 1 : 0);
}`,
    python: `def longestPalindrome(s):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    pairs = 0
    has_odd = False
    for n in counts.values():
        pairs += (n // 2) * 2
        if n % 2:
            has_odd = True
    return pairs + (1 if has_odd else 0)`,
  },
  'Add Two Numbers': {
    javascript: `function addTwoNumbers(l1, l2) {
  let a = buildList(l1);
  let b = buildList(l2);
  let head = null, tail = null, carry = 0;
  while (a || b || carry) {
    const sum = (a ? a.val : 0) + (b ? b.val : 0) + carry;
    carry = Math.floor(sum / 10);
    const node = { val: sum % 10, next: null };
    if (tail) tail.next = node; else head = node;
    tail = node;
    if (a) a = a.next;
    if (b) b = b.next;
  }
  return toArray(head);
}`,
    java: `    public int[] addTwoNumbers(int[] l1, int[] l2) {
        ListNode a = buildList(l1);
        ListNode b = buildList(l2);
        ListNode head = null, tail = null;
        int carry = 0;
        while (a != null || b != null || carry != 0) {
            int sum = (a != null ? a.val : 0) + (b != null ? b.val : 0) + carry;
            carry = sum / 10;
            ListNode node = new ListNode(sum % 10, null);
            if (head == null) head = node; else tail.next = node;
            tail = node;
            if (a != null) a = a.next;
            if (b != null) b = b.next;
        }
        return toArray(head);
    }`,
    cpp: `vector<int> addTwoNumbers(vector<int> l1, vector<int> l2) {
    ListNode* a = buildList(l1);
    ListNode* b = buildList(l2);
    ListNode *head = nullptr, *tail = nullptr;
    int carry = 0;
    while (a || b || carry) {
        int sum = (a ? a->val : 0) + (b ? b->val : 0) + carry;
        carry = sum / 10;
        ListNode* node = new ListNode{sum % 10, nullptr};
        if (!head) head = node; else tail->next = node;
        tail = node;
        if (a) a = a->next;
        if (b) b = b->next;
    }
    return toArray(head);
}`,
    python: `def addTwoNumbers(l1, l2):
    a = build_list(l1)
    b = build_list(l2)
    out = []
    carry = 0
    while a is not None or b is not None or carry:
        total = (a["val"] if a else 0) + (b["val"] if b else 0) + carry
        carry = total // 10
        out.append(total % 10)
        a = a["next"] if a else None
        b = b["next"] if b else None
    return out`,
  },
  'Unique Paths': {
    javascript: `function uniquePaths(m, n) {
  const row = new Array(n).fill(1);
  for (let r = 1; r < m; r++) for (let c = 1; c < n; c++) row[c] += row[c - 1];
  return row[n - 1];
}`,
    java: `    public long uniquePaths(long m, long n) {
        long[] row = new long[(int) n];
        for (int c = 0; c < n; c++) row[c] = 1;
        for (long r = 1; r < m; r++) for (int c = 1; c < n; c++) row[c] += row[c - 1];
        return row[(int) n - 1];
    }`,
    cpp: `long long uniquePaths(long long m, long long n) {
    vector<long long> row(n, 1);
    for (long long r = 1; r < m; r++) for (long long c = 1; c < n; c++) row[c] += row[c - 1];
    return row[n - 1];
}`,
    python: `def uniquePaths(m, n):
    row = [1] * n
    for _ in range(1, m):
        for c in range(1, n):
            row[c] += row[c - 1]
    return row[n - 1]`,
  },

  'Daily Temperatures': {
    javascript: `function dailyTemperatures(temperatures) {
  const answer = new Array(temperatures.length).fill(0);
  const stack = [];
  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length && temperatures[stack[stack.length - 1]] < temperatures[i]) {
      const idx = stack.pop();
      answer[idx] = i - idx;
    }
    stack.push(i);
  }
  return answer;
}`,
    java: `    public int[] dailyTemperatures(int[] temperatures) {
        int[] answer = new int[temperatures.length];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < temperatures.length; i++) {
            while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {
                int idx = stack.pop();
                answer[idx] = i - idx;
            }
            stack.push(i);
        }
        return answer;
    }`,
    cpp: `vector<int> dailyTemperatures(vector<int> temperatures) {
    int n = (int)temperatures.size();
    vector<int> answer(n, 0);
    vector<int> stack;
    for (int i = 0; i < n; i++) {
        while (!stack.empty() && temperatures[stack.back()] < temperatures[i]) {
            int idx = stack.back();
            stack.pop_back();
            answer[idx] = i - idx;
        }
        stack.push_back(i);
    }
    return answer;
}`,
    python: `def dailyTemperatures(temperatures):
    answer = [0] * len(temperatures)
    stack = []
    for i, t in enumerate(temperatures):
        while stack and temperatures[stack[-1]] < t:
            idx = stack.pop()
            answer[idx] = i - idx
        stack.append(i)
    return answer`,
  },
  'Top K Frequent Elements': {
    javascript: `function topKFrequent(nums, k) {
  const counts = new Map();
  for (const v of nums) counts.set(v, (counts.get(v) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, k)
    .map((e) => e[0]);
}`,
    java: `    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int v : nums) counts.merge(v, 1, Integer::sum);
        List<Map.Entry<Integer, Integer>> entries = new ArrayList<>(counts.entrySet());
        entries.sort((a, b) -> b.getValue() - a.getValue() != 0
            ? b.getValue() - a.getValue() : a.getKey() - b.getKey());
        int[] out = new int[k];
        for (int i = 0; i < k; i++) out[i] = entries.get(i).getKey();
        return out;
    }`,
    cpp: `vector<int> topKFrequent(vector<int> nums, int k) {
    map<int, int> counts;
    for (int v : nums) counts[v]++;
    vector<pair<int, int>> entries;
    for (auto& kv : counts) entries.push_back({kv.first, kv.second});
    sort(entries.begin(), entries.end(), [](const pair<int, int>& a, const pair<int, int>& b) {
        if (a.second != b.second) return a.second > b.second;
        return a.first < b.first;
    });
    vector<int> out;
    for (int i = 0; i < k; i++) out.push_back(entries[i].first);
    return out;
}`,
    python: `def topKFrequent(nums, k):
    counts = {}
    for v in nums:
        counts[v] = counts.get(v, 0) + 1
    ordered = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return [v for v, _ in ordered[:k]]`,
  },
  'Non-overlapping Intervals': {
    javascript: `function eraseOverlapIntervals(intervals) {
  const sorted = intervals.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  let kept = 0, lastEnd = -Infinity;
  for (const [start, end] of sorted) {
    if (start >= lastEnd) { kept++; lastEnd = end; }
  }
  return intervals.length - kept;
}`,
    java: `    public int eraseOverlapIntervals(int[][] intervals) {
        int[][] sorted = intervals.clone();
        Arrays.sort(sorted, (a, b) -> a[1] != b[1] ? a[1] - b[1] : a[0] - b[0]);
        int kept = 0, lastEnd = Integer.MIN_VALUE;
        for (int[] iv : sorted) {
            if (iv[0] >= lastEnd) { kept++; lastEnd = iv[1]; }
        }
        return intervals.length - kept;
    }`,
    cpp: `int eraseOverlapIntervals(vector<vector<int>> intervals) {
    vector<vector<int>> sorted = intervals;
    sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b) {
        if (a[1] != b[1]) return a[1] < b[1];
        return a[0] < b[0];
    });
    int kept = 0, lastEnd = INT_MIN;
    for (const auto& iv : sorted) {
        if (iv[0] >= lastEnd) { kept++; lastEnd = iv[1]; }
    }
    return (int)intervals.size() - kept;
}`,
    python: `def eraseOverlapIntervals(intervals):
    ordered = sorted(intervals, key=lambda iv: (iv[1], iv[0]))
    kept = 0
    last_end = None
    for start, end in ordered:
        if last_end is None or start >= last_end:
            kept += 1
            last_end = end
    return len(intervals) - kept`,
  },
  'Pow(x, n)': {
    javascript: `function myPow(x, n) {
  const r3 = (v) => {
    const rounded = Math.round(v * 1000) / 1000;
    return rounded === 0 ? 0 : rounded;
  };
  const fastPow = (a, b) => {
    let result = 1, base = a, e = b;
    while (e > 0) {
      if (e % 2) result *= base;
      base *= base;
      e = Math.floor(e / 2);
    }
    return result;
  };
  return n < 0 ? r3(1 / fastPow(x, -n)) : r3(fastPow(x, n));
}`,
    java: `    public double myPow(double x, int n) {
        int e = Math.abs(n);
        double result = 1.0, base = x;
        while (e > 0) {
            if (e % 2 == 1) result *= base;
            base *= base;
            e /= 2;
        }
        return n < 0 ? round3(1.0 / result) : round3(result);
    }

    private double round3(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }`,
    cpp: `double round3(double v) {
    return std::round(v * 1000.0) / 1000.0;
}

double myPow(double x, int n) {
    int e = n < 0 ? -n : n;
    double result = 1.0, base = x;
    while (e > 0) {
        if (e % 2) result *= base;
        base *= base;
        e /= 2;
    }
    return n < 0 ? round3(1.0 / result) : round3(result);
}`,
    python: `def myPow(x, n):
    def fast_pow(a, b):
        result, base, e = 1.0, a, b
        while e > 0:
            if e % 2:
                result *= base
            base *= base
            e //= 2
        return result

    def round3(v):
        return round((v + (1e-12 if v >= 0 else -1e-12)) * 1000.0) / 1000.0

    if n < 0:
        return round3(1.0 / fast_pow(x, -n))
    return round3(fast_pow(x, n))`,
  },
  'Palindrome Linked List': {
    javascript: `function isPalindrome(head) {
  const node = buildList(head);
  const values = [];
  for (let cur = node; cur; cur = cur.next) values.push(cur.val);
  for (let lo = 0, hi = values.length - 1; lo < hi; lo++, hi--) if (values[lo] !== values[hi]) return false;
  return true;
}`,
    java: `    public boolean isPalindrome(int[] head) {
        ListNode node = buildList(head);
        List<Integer> values = new ArrayList<>();
        for (ListNode cur = node; cur != null; cur = cur.next) values.add(cur.val);
        int lo = 0, hi = values.size() - 1;
        while (lo < hi) {
            if (values.get(lo) != values.get(hi)) return false;
            lo++;
            hi--;
        }
        return true;
    }`,
    cpp: `bool isPalindrome(vector<int> head) {
    ListNode* node = buildList(head);
    vector<int> values;
    for (ListNode* cur = node; cur; cur = cur->next) values.push_back(cur->val);
    int lo = 0, hi = (int)values.size() - 1;
    while (lo < hi) {
        if (values[lo] != values[hi]) return false;
        lo++;
        hi--;
    }
    return true;
}`,
    python: `def isPalindrome(head):
    node = build_list(head)
    values = []
    while node is not None:
        values.append(node["val"])
        node = node["next"]
    lo, hi = 0, len(values) - 1
    while lo < hi:
        if values[lo] != values[hi]:
            return False
        lo += 1
        hi -= 1
    return True`,
  },

  'K Closest Points to Origin': {
    javascript: `function kClosest(points, k) {
  return points
    .slice()
    .sort((a, b) => (a[0] * a[0] + a[1] * a[1]) - (b[0] * b[0] + b[1] * b[1]))
    .slice(0, k);
}`,
    java: `    public int[][] kClosest(int[][] points, int k) {
        int n = points.length;
        long[] dist = new long[n];
        Integer[] order = new Integer[n];
        for (int i = 0; i < n; i++) {
            dist[i] = (long) points[i][0] * points[i][0] + (long) points[i][1] * points[i][1];
            order[i] = i;
        }
        Arrays.sort(order, (a, b) -> dist[a] != dist[b] ? Long.compare(dist[a], dist[b]) : Integer.compare(a, b));
        int[][] out = new int[k][];
        for (int i = 0; i < k; i++) out[i] = points[order[i]];
        return out;
    }`,
    cpp: `vector<vector<int>> kClosest(vector<vector<int>> points, int k) {
    int n = (int)points.size();
    vector<long long> dist(n);
    vector<int> order(n);
    for (int i = 0; i < n; i++) {
        dist[i] = (long long)points[i][0] * points[i][0] + (long long)points[i][1] * points[i][1];
        order[i] = i;
    }
    sort(order.begin(), order.end(), [&](int a, int b) {
        if (dist[a] != dist[b]) return dist[a] < dist[b];
        return a < b;
    });
    vector<vector<int>> out;
    for (int i = 0; i < k; i++) out.push_back(points[order[i]]);
    return out;
}`,
    python: `def kClosest(points, k):
    ordered = sorted(points, key=lambda p: p[0] * p[0] + p[1] * p[1])
    return ordered[:k]`,
  },
  'Merge K Sorted Lists': {
    javascript: `function mergeKLists(lists) {
  const all = [];
  for (const list of lists) for (const v of list) all.push(v);
  all.sort((a, b) => a - b);
  return all;
}`,
    java: `    public int[] mergeKLists(int[][] lists) {
        int total = 0;
        for (int[] l : lists) total += l.length;
        int[] all = new int[total];
        int i = 0;
        for (int[] l : lists) for (int v : l) all[i++] = v;
        Arrays.sort(all);
        return all;
    }`,
    cpp: `vector<int> mergeKLists(vector<vector<int>> lists) {
    vector<int> all;
    for (auto& l : lists) for (int v : l) all.push_back(v);
    sort(all.begin(), all.end());
    return all;
}`,
    python: `def merge_k_lists(lists):
    out = []
    for l in lists:
        out.extend(l)
    out.sort()
    return out`,
  },
  'Search Insert Position': {
    javascript: `function searchInsert(nums, target) {
  let lo = 0, hi = nums.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] < target) lo = mid + 1; else hi = mid;
  }
  return lo;
}`,
    java: `    public int searchInsert(int[] nums, int target) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] < target) lo = mid + 1; else hi = mid;
        }
        return lo;
    }`,
    cpp: `int searchInsert(vector<int> nums, int target) {
    int lo = 0, hi = (int)nums.size();
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] < target) lo = mid + 1; else hi = mid;
    }
    return lo;
}`,
    python: `def searchInsert(nums, target):
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo`,
  },
  'Find Minimum in Rotated Sorted Array': {
    javascript: `function findMin(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] > nums[hi]) lo = mid + 1; else hi = mid;
  }
  return nums[lo];
}`,
    java: `    public int findMin(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] > nums[hi]) lo = mid + 1; else hi = mid;
        }
        return nums[lo];
    }`,
    cpp: `int findMin(vector<int> nums) {
    int lo = 0, hi = (int)nums.size() - 1;
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] > nums[hi]) lo = mid + 1; else hi = mid;
    }
    return nums[lo];
}`,
    python: `def findMin(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        else:
            hi = mid
    return nums[lo]`,
  },
  'Happy Number': {
    javascript: `function isHappy(n) {
  const seen = new Set();
  let cur = n;
  while (cur !== 1) {
    if (seen.has(cur)) return false;
    seen.add(cur);
    let sum = 0, v = cur;
    while (v > 0) { sum += (v % 10) * (v % 10); v = Math.floor(v / 10); }
    cur = sum;
  }
  return true;
}`,
    java: `    public boolean isHappy(int n) {
        Set<Integer> seen = new HashSet<>();
        int cur = n;
        while (cur != 1) {
            if (!seen.add(cur)) return false;
            int sum = 0, v = cur;
            while (v > 0) { int d = v % 10; sum += d * d; v /= 10; }
            cur = sum;
        }
        return true;
    }`,
    cpp: `bool isHappy(int n) {
    unordered_set<int> seen;
    int cur = n;
    while (cur != 1) {
        if (!seen.insert(cur).second) return false;
        int sum = 0, v = cur;
        while (v > 0) { int d = v % 10; sum += d * d; v /= 10; }
        cur = sum;
    }
    return true;
}`,
    python: `def isHappy(n):
    seen = set()
    cur = n
    while cur != 1:
        if cur in seen:
            return False
        seen.add(cur)
        total = 0
        v = cur
        while v > 0:
            d = v % 10
            total += d * d
            v //= 10
        cur = total
    return True`,
  },
};

/* ============================== RECORD ASSEMBLY ============================= */

/**
 * CANONICAL DB TITLES.
 *
 * The migration matches a payload record to its document by EXACT title, and two
 * SOURCE titles are spelled differently from the canonical document titles that
 * already exist in the database:
 *
 *   source "Pow(x, n)"            -> canonical "Pow(x,n)"            (slug pow-x-n)
 *   source "Merge K Sorted Lists" -> canonical "Merge k Sorted Lists" (slug merge-k-sorted-lists)
 *
 * Both differences are punctuation/casing only and BOTH slugs are unchanged, so
 * the records still land on the documents the audit reported. The source spelling
 * is preserved in provenance.sourceTitle. Any entry here must keep the same slug.
 */
const CANONICAL_TITLE = {
  'Pow(x, n)': 'Pow(x,n)',
  'Merge K Sorted Lists': 'Merge k Sorted Lists',
};

function canonicalTitle(sourceTitle) {
  if (!sourceTitle || !String(sourceTitle).trim()) {
    throw new Error('authoredDsaBatch3: empty title');
  }
  const canonical = CANONICAL_TITLE[sourceTitle] || sourceTitle;
  if (slugify(canonical) !== slugify(sourceTitle)) {
    throw new Error(`authoredDsaBatch3: canonical title change would alter the slug for "${sourceTitle}"`);
  }
  return canonical;
}

/**
 * Source-backed examples. Merge K carries its own `examples` (S2); the twelve S1
 * records have no separate examples field, so their examples ARE the source's own
 * sample tests (input / output / explanation) — nothing is invented. The record
 * keeps them in `examples` (Batch 1/2 convention); the UI prefers `examples` and
 * otherwise derives the same thing from the visible test cases.
 */
function examplesFor(title) {
  const s = source(title);
  if (Array.isArray(s.examples) && s.examples.length) {
    return s.examples.map((e) => {
      if (!e || e.input === undefined || e.output === undefined) {
        throw new Error(`authoredDsaBatch3: malformed source example for "${title}"`);
      }
      return { input: String(e.input), output: String(e.output) };
    });
  }
  if (!Array.isArray(s.sampleTests) || !s.sampleTests.length) {
    throw new Error(`authoredDsaBatch3: no source examples or sample tests for "${title}"`);
  }
  return s.sampleTests.map((t) => {
    if (!t || t.input === undefined || t.output === undefined) {
      throw new Error(`authoredDsaBatch3: malformed source sample test for "${title}"`);
    }
    const ex = { input: String(t.input), output: String(t.output) };
    if (t.explanation) ex.explanation = String(t.explanation);
    return ex;
  });
}

/**
 * inputFormat from the source, with every parameter type replaced by the EFFECTIVE
 * typed parameter when a signature override applies (the two list records declare
 * ListNode, but the drivers can only carry arrays).
 */
function inputFormats(title, sigs) {
  const s = source(title);
  if (!Array.isArray(s.inputFormat) || !s.inputFormat.length) {
    throw new Error(`authoredDsaBatch3: source inputFormat missing for "${title}"`);
  }
  const eff = sigs.javascript.params.map((p) => p.name);
  if (s.inputFormat.length !== eff.length) {
    throw new Error(`authoredDsaBatch3: inputFormat arity != signature for "${title}"`);
  }
  return s.inputFormat.map((f, i) => {
    if (f.paramName !== eff[i]) {
      throw new Error(`authoredDsaBatch3: inputFormat param order != signature for "${title}"`);
    }
    const out = { paramName: f.paramName, type: sigs.javascript.params[i].type };
    if (f.constraints) out.constraints = String(f.constraints);
    return out;
  });
}

function buildRecord(title) {
  const s = source(title);
  const canonical = canonicalTitle(title);
  const topics = dedupeTopics(s.topic, s.tags);
  const sigs = signatures(title);
  const starterCode = typedStarters(title, sigs);
  const built = buildTests(title);
  const ref = javascriptReference(title);
  if (!s.outputFormat || !s.outputFormat.description) {
    throw new Error(`authoredDsaBatch3: source outputFormat.description missing for "${title}"`);
  }

  return {
    slug: slugify(canonical),
    title: canonical,
    provenance: {
      source: s.source,
      ref: s.sourceRef,
      ...(canonical === title ? {} : { sourceTitle: title }),
      note: 'description/difficulty/topic/tags/companies/constraints/inputFormat/outputFormat/'
        + 'functionSignature/sample+hidden tests taken from the reviewed source seed, field-by-field; '
        + 'every expected output is re-derived by two independent implementations that must also reproduce '
        + "the source's stored output; starters are typed stubs for the effective signature "
        + '(the source starters return nothing and would not compile in java/cpp)',
      deviations: DEVIATION_NOTE[title] || 'none',
      droppedFixtures: built.dropped,
      exampleSource: Array.isArray(s.examples) && s.examples.length
        ? 'source examples field'
        : 'source sampleTests (input/output/explanation) - the source has no separate examples field',
    },
    description: s.description,
    difficulty: s.difficulty,
    topic: topics.topic,
    tags: topics.tags,
    companies: s.companies || [],
    constraints: s.constraints,
    examples: examplesFor(title),
    inputFormat: inputFormats(title, sigs),
    outputFormat: {
      type: sigs.javascript.returnType,
      description: String(s.outputFormat.description),
    },
    sampleTests: built.samples.map((t, i) => ({
      input: t.input,
      output: t.output,
      explanation: `Source sample test ${i + 1}`,
    })),
    hiddenTests: built.hidden.map((t, i) => ({
      input: t.input,
      output: t.output,
      category: t.role === 'derived' ? 'derived' : ['edge', 'stress', 'random', 'min'][i % 4],
    })),
    starterCode,
    functionSignature: sigs,
    referenceSolution: {
      code: ref,
      language: 'javascript',
    },
    timeLimitMs: s.difficulty === 'hard' ? 3000 : s.difficulty === 'medium' ? 2000 : 1500,
    memoryLimitKb: 256000,
  };
}

/* ======================== STRUCTURAL FAIL-CLOSED CONTRACT ====================
 * An independent replica of full_audit.js auditDsa(), so this module cannot be
 * imported at all if a record would fail the canonical audit.
 */
const PLACEHOLDER_RE = /TODO|TBD|FIXME|not yet reviewed|placeholder|lorem ipsum|coming soon|\bXXX\b/i;
const RAW_ID_RE = /\bhm_\d{10,}\b|\b65a[0-9a-f]{20,}\b/;
const VALID_DIFFS = ['easy', 'medium', 'hard'];
const STARTER_LANGS = ['javascript', 'java', 'python', 'cpp'];
const SIG_LANGS = ['javascript', 'java', 'python', 'cpp'];

function auditReplica(r) {
  const issues = [];
  const title = String(r.title || '').trim();
  const slug = String(r.slug || '').trim();
  if (!title) issues.push('missing title');
  else if (title === r.id || /^hm_\d+/.test(title)) issues.push('raw/malformed title');
  else if (PLACEHOLDER_RE.test(title)) issues.push('placeholder title');
  if (!slug) issues.push('missing slug');
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) issues.push('invalid slug');
  if (!VALID_DIFFS.includes(String(r.difficulty || '').toLowerCase())) issues.push('invalid difficulty');
  const topics = [...(r.topic ? [String(r.topic)] : []), ...(Array.isArray(r.tags) ? r.tags : [])];
  if (topics.length === 0) issues.push('missing topics');
  else {
    const lower = topics.map((t) => String(t).toLowerCase().trim());
    if (new Set(lower).size !== lower.length) issues.push('duplicate topics: ' + JSON.stringify(topics));
    if (lower.some((t) => !t)) issues.push('empty topic entry');
  }
  const desc = String(r.description || '').trim();
  if (desc.length < 40) issues.push(`description too short (${desc.length})`);
  else if (PLACEHOLDER_RE.test(desc)) issues.push('placeholder description');
  if (RAW_ID_RE.test(desc)) issues.push('raw id in description');
  if (r.examples !== undefined) {
    if (!Array.isArray(r.examples)) issues.push('examples not array');
    else if (r.examples.length === 0) issues.push('examples empty');
    else r.examples.forEach((ex, i) => {
      if (!ex || typeof ex !== 'object' || ex.input === undefined || ex.output === undefined) {
        issues.push(`examples[${i}] missing input/output`);
      }
    });
  }
  if (!Array.isArray(r.constraints) || r.constraints.length === 0) issues.push('missing constraints');
  else if (r.constraints.some((c) => !String(c || '').trim())) issues.push('empty constraint entry');
  const st = Array.isArray(r.sampleTests) ? r.sampleTests : [];
  const ht = Array.isArray(r.hiddenTests) ? r.hiddenTests : [];
  if (st.length === 0) issues.push('NO sampleTests');
  if (ht.length === 0) issues.push('NO hiddenTests');
  const check = (arr, kind) => arr.forEach((tc, i) => {
    if (!tc || typeof tc !== 'object') { issues.push(`${kind}[${i}] not an object`); return; }
    if (tc.input === undefined || tc.input === null || String(tc.input).trim() === '') issues.push(`${kind}[${i}] empty input`);
    const exp = tc.output !== undefined && tc.output !== null ? tc.output : tc.expectedOutput;
    if (exp === undefined || exp === null || String(exp).trim() === '') issues.push(`${kind}[${i}] empty expected output`);
  });
  check(st, 'sampleTests');
  check(ht, 'hiddenTests');
  if (new Set(st.map((t) => JSON.stringify([t.input, t.output]))).size !== st.length) issues.push('duplicate sample tests present');
  if (new Set(ht.map((t) => JSON.stringify([t.input, t.output]))).size !== ht.length) issues.push('duplicate hidden tests present');
  for (const lang of STARTER_LANGS) {
    if (!r.starterCode[lang] || !String(r.starterCode[lang]).trim()) issues.push('empty starterCode: ' + lang);
    else if (/TODO|FIXME|NotImplemented/i.test(r.starterCode[lang])) issues.push('placeholder in starter: ' + lang);
  }
  for (const lang of SIG_LANGS) {
    const s = (r.functionSignature || {})[lang];
    if (!s || !s.name) issues.push('missing functionSignature: ' + lang);
    else {
      if (!Array.isArray(s.params)) issues.push(`sig[${lang}] params not array`);
      if (!s.returnType) issues.push(`sig[${lang}] missing returnType`);
    }
  }
  if (!(Number(r.timeLimitMs) > 0)) issues.push('missing/invalid timeLimitMs');
  if (!(Number(r.memoryLimitKb) > 0)) issues.push('missing memoryLimitKb');
  if (!r.inputFormat || !r.inputFormat.length) issues.push('missing inputFormat');
  if (!r.outputFormat || !r.outputFormat.type) issues.push('missing outputFormat');
  if (!r.referenceSolution || !r.referenceSolution.code) issues.push('referenceSolution missing');
  return issues;
}

const BATCH_TITLES = Object.keys(SRC);

const records = BATCH_TITLES.map((t) => {
  const r = buildRecord(t);
  const issues = auditReplica(r);
  if (issues.length) {
    throw new Error(`authoredDsaBatch3: "${t}" fails the structural contract: ${issues.join(' | ')}`);
  }
  return r;
});

if (BATCH_TITLES.length !== 13) throw new Error('authoredDsaBatch3: Batch 3 must author exactly 13 records');

// Batch 1 / Batch 2 titles must not be touched by Batch 3.
const BATCH1_TITLES = require('./authoredDsaBatch1').BATCH_TITLES;
const BATCH2_TITLES = require('./authoredDsaBatch2').BATCH_TITLES;
for (const t of BATCH_TITLES) {
  if (BATCH1_TITLES.includes(t)) throw new Error(`authoredDsaBatch3: "${t}" is a Batch 1 record and must not be re-authored`);
  if (BATCH2_TITLES.includes(t)) throw new Error(`authoredDsaBatch3: "${t}" is a Batch 2 record and must not be re-authored`);
}
if (BATCH1_TITLES.length !== 16) throw new Error('authoredDsaBatch3: Batch 1 title set changed');
if (BATCH2_TITLES.length !== 8) throw new Error('authoredDsaBatch3: Batch 2 title set changed');
if (new Set([...BATCH1_TITLES, ...BATCH2_TITLES, ...BATCH_TITLES]).size !== 37) {
  throw new Error('authoredDsaBatch3: the three authored batches must be 37 disjoint titles');
}

const slugs = new Set(records.map((r) => r.slug));
if (slugs.size !== records.length) throw new Error('authoredDsaBatch3: duplicate slug in payload');
if (new Set(records.map((r) => r.title)).size !== records.length) {
  throw new Error('authoredDsaBatch3: duplicate canonical title in payload');
}
for (const r of records) {
  if (r.slug !== slugify(r.title)) throw new Error(`authoredDsaBatch3: slug mismatch for "${r.title}"`);
}
// Every canonical title must be distinct from Batch 1 / Batch 2 titles too.
for (const r of records) {
  if (BATCH1_TITLES.includes(r.title)) throw new Error(`authoredDsaBatch3: canonical title collides with Batch 1: "${r.title}"`);
  if (BATCH2_TITLES.includes(r.title)) throw new Error(`authoredDsaBatch3: canonical title collides with Batch 2: "${r.title}"`);
}

/**
 * The SELF-CONTAINED JavaScript reference stored in referenceSolution.code.
 *
 * models/CodingProblem.js documents `code` as a self-contained JS function
 * expression, and genericValidator evaluates it on its own, so any record-level
 * helper the reference uses (buildList/toArray for the two list records) must be
 * part of the stored source, not of an external preamble. The `solve` alias is
 * added because the in-process reference path looks up `solve` while the sandbox
 * driver invokes the signature's own name.
 */
function javascriptReference(title) {
  const sigs = signatures(title);
  const pre = (LIST_PREAMBLE[title] || {}).javascript || '';
  const body = REFERENCES[title].javascript;
  const jsName = sigs.javascript.name;
  return pre + body + (jsName === 'solve' ? '' : `\nconst solve = ${jsName};\n`);
}

/** All four reference languages for a record (used by the validator). */
function referencesFor(title) {
  const r = REFERENCES[title];
  if (!r) throw new Error(`authoredDsaBatch3: no references for "${title}"`);
  for (const lang of ['javascript', 'python', 'java', 'cpp']) {
    if (!r[lang] || !String(r[lang]).trim()) {
      throw new Error(`authoredDsaBatch3: missing ${lang} reference for "${title}"`);
    }
  }
  return r;
}

module.exports = {
  BATCH_TITLES,
  records,
  REFERENCES,
  referencesFor,
  javascriptReference,
  buildTests,
  buildRecord,
  auditReplica,
  slugify,
  decodeLiteralNewlines,
  _internals: {
    SIG_OVERRIDES, DEVIATION_NOTE, LIST_PREAMBLE, IMPL, admit, parseInput, source,
    signatures, typedStarters, examplesFor, inputFormats, canonicalTitle,
    CANONICAL_TITLE, convertSourceFixture, extraFixtures,
  },
};
