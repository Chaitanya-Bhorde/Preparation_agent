/**
 * authoredDsaBatch2.js
 * ---------------------------------------------------------------------------
 * The eight (C) CURATED source-verified records — the ONLY DSA records Batch 2
 * authors. Every one of them has a complete reviewed specification in
 * scripts/curatedProblems.js (CURATED[title]): description, constraints,
 * examples, sample + hidden test, and a typed per-language functionSignature,
 * cross-confirmed by the canonical seeder metadata row
 * (scripts/seedCodingProblemsExpanded.js codingProblems[title]: topic/tags/
 * difficulty).
 *
 * WHY THESE EIGHT (and only these)
 *   The other 202 remaining audit failures have NO project-local ground truth:
 *   their sole source is the DB row itself, whose description is the seeder's
 *   "Solve the <title> problem. (Spec not yet reviewed)" placeholder and whose
 *   sampleTests are empty. testCaseGenerators.SOLVERS holds 51 titles and NONE
 *   of them is one of these eight, so no solver can regenerate or verify
 *   semantics. Authoring them would mean inventing a specification from a
 *   title. They stay CONTENT SOURCE REQUIRED, untouched.
 *
 * WHAT THE DB ACTUALLY HOLDS FOR THESE EIGHT
 *   scripts/applyCuratedFixes.js wrote description/constraints/functionSignature
 *   through the mongoose model, but `examples`, `visibleTestCases`,
 *   `hiddenTestCases` are NOT in models/CodingProblem.js, so strict mode
 *   stripped them, and it never wrote `sampleTests`/`hiddenTests` at all. That
 *   is precisely why the audit reports "NO sampleTests" for exactly these rows
 *   (plus a duplicate-topics issue for Basic Calculator III and Word Search,
 *   whose seeder tags repeat their own topic: Stack/stack, Backtracking/
 *   backtracking).
 *
 * PRESERVATION / DEVIATIONS
 *   - description, constraints, difficulty, topic, tags: taken from (C)+(M) and
 *     re-asserted at build time, never rewritten. The only edit is the audit's
 *     own case-insensitive de-duplication of topic vs tags (same rule Batch 1
 *     used, no invented tags).
 *   - FIXTURES: the curated sample and curated hidden case are kept verbatim and
 *     become sampleTests[0] and hiddenTests[0]. Extra fixtures are added ONLY
 *     where the expected output is derivable with certainty; every fixture's
 *     expected output is computed here by TWO INDEPENDENT ALGORITHMS (A and B)
 *     and the module refuses to load unless they agree, and unless the two
 *     curated fixtures reproduce the curated expected output exactly.
 *   - INPUT ENCODING: multi-line inputs carry REAL newlines, never a literal
 *     backslash-n, because the platform driver reads stdin verbatim
 *     (judge0Coding.js sends `stdin: input`) while localExecutor also rewrites
 *     \n; real newlines are correct in both paths. Word Search and Minimum Size
 *     Subarray Sum are the two multi-line records, both taking one value per
 *     line, which is what every driver parses.
 *   - Letter Combinations omits the 0-length input: the JS/C++ drivers drop
 *     blank stdin lines, so an empty string is not representable as a fixture.
 *
 * Each record ships reference implementations for all four languages; the
 * platform's drivers parse the typed parameters, so the fixtures are the
 * contract those drivers are validated against.
 */
'use strict';

/* ---------------------------------------------------------- source bindings */
const fs = require('fs');
const path = require('path');
const { CURATED } = require('./curatedProblems');

/** Curated multi-line inputs store a LITERAL backslash-n (char codes 92,110). */
function decodeLiteralNewlines(s) {
  return String(s).split('\\n').join('\n');
}

/** The exact CodingProblem pre-save slug formula (models/CodingProblem.js). */
function slugify(title) {
  return String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Read the canonical seeder's literal problem array (topic/tags/difficulty). */
function loadLiteralArray(file, declMarker) {
  const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const at = src.indexOf(declMarker);
  if (at < 0) throw new Error(`authoredDsaBatch2: declaration "${declMarker}" missing in ${file}`);
  const arrStart = src.indexOf('[', at);
  const arrEnd = arrStart < 0 ? -1 : src.indexOf('\n];', arrStart);
  if (arrEnd < 0) throw new Error(`authoredDsaBatch2: literal array not closed in ${file}`);
  const arr = new Function(`return (${src.slice(arrStart, arrEnd + 2)});`)();
  if (!Array.isArray(arr) || arr.length === 0) throw new Error(`authoredDsaBatch2: empty array from ${file}`);
  return arr;
}

const META_ROWS = loadLiteralArray('seedCodingProblemsExpanded.js', 'const codingProblems = [');

function metaRow(title) {
  const r = META_ROWS.find((x) => x && x.title === title);
  if (!r || !r.difficulty || !r.topic) throw new Error(`authoredDsaBatch2: no (M) metadata row for "${title}"`);
  return r;
}

/** Register topic first, then keep only tags not already seen case-insensitively
 *  (fixes the audit's "duplicate topics" issue without inventing new tags). */
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

/* ============================ FIXTURE DERIVATION ==============================
 * For each record: inputA / inputB are two independent implementations of the
 * curated specification. buildTests() refuses to emit a fixture unless both
 * produce byte-identical output, and unless the curated fixtures reproduce the
 * curated expected output. A disagreement means the fixture is not provable and
 * must not be authored.
 */
const phone = { 2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl', 6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz' };

/** Pascal: recurrence (A) vs binomial coefficients (B). */
const pascalA = (n) => { const r = []; for (let i = 0; i < n; i++) { const row = [1]; for (let j = 1; j <= i; j++) row[j] = (r[i - 1][j - 1] || 0) + (r[i - 1][j] || 0); r.push(row); } return r; };
const pascalB = (n) => { const r = []; for (let i = 0; i < n; i++) { const row = []; for (let j = 0; j <= i; j++) { let c = 1; for (let k = 1; k <= j; k++) c = (c * (i - k + 1)) / k; row.push(c); } r.push(row); } return r; };

/** Min-size subarray: sliding window (A) vs enumerate-earliest-window (B). */
const mssA = (target, nums) => { let best = Infinity, sum = 0, l = 0; for (let r = 0; r < nums.length; r++) { sum += nums[r]; while (sum >= target) { best = Math.min(best, r - l + 1); sum -= nums[l++]; } } return best === Infinity ? 0 : best; };
const mssB = (target, nums) => { let best = Infinity; for (let i = 0; i < nums.length; i++) { let s = 0; for (let j = i; j < nums.length; j++) { s += nums[j]; if (s >= target) { best = Math.min(best, j - i + 1); break; } } } return best === Infinity ? 0 : best; };

/** Increasing triplet: two running minima (A) vs exhaustive triple scan (B). */

/** Calculator: recursive descent (A) vs two-stack shunting yard (B). Division
 *  truncates toward zero in both, as the curated description requires. */
const calcA = (s) => { const t = s.replace(/\s+/g, ''); let i = 0; const expr = () => { let v = term(); while (t[i] === '+' || t[i] === '-') { const op = t[i++]; const r = term(); v = op === '+' ? v + r : v - r; } return v; }; const term = () => { let v = factor(); while (t[i] === '*' || t[i] === '/') { const op = t[i++]; const r = factor(); v = op === '*' ? v * r : Math.trunc(v / r); } return v; }; const factor = () => { if (t[i] === '(') { i++; const v = expr(); i++; return v; } let d = ''; while (i < t.length && t[i] >= '0' && t[i] <= '9') d += t[i++]; return parseInt(d, 10); }; return expr(); };
const calcB = (s) => { const t = s.replace(/\s+/g, ''); const vals = [], ops = []; let i = 0; const prec = { '+': 1, '-': 1, '*': 2, '/': 2 }; const apply = () => { const b = vals.pop(), a = vals.pop(), o = ops.pop(); vals.push(o === '+' ? a + b : o === '-' ? a - b : o === '*' ? a * b : Math.trunc(a / b)); }; while (i < t.length) { const c = t[i]; if (c >= '0' && c <= '9') { let n = ''; while (i < t.length && t[i] >= '0' && t[i] <= '9') n += t[i++]; vals.push(parseInt(n, 10)); } else if (c === '(') { ops.push(c); i++; } else if (c === ')') { while (ops[ops.length - 1] !== '(') apply(); ops.pop(); i++; } else { while (ops.length && prec[ops[ops.length - 1]] >= prec[c]) apply(); ops.push(c); i++; } } while (ops.length) apply(); return vals[0]; };

/** Word search: in-place-marking DFS (A) vs immutable-visited DFS (B). */
const wsA = (rows, word) => { if (!word.length) return false; const g = rows.map((r) => r.split('')); const m = g.length, n = g[0].length; const dfs = (r, c, k) => { if (g[r][c] !== word[k]) return false; if (k === word.length - 1) return true; const ch = g[r][c]; g[r][c] = '#'; let res = false; for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < m && nc >= 0 && nc < n && g[nr][nc] !== '#' && dfs(nr, nc, k + 1)) { res = true; break; } } g[r][c] = ch; return res; }; for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (dfs(r, c, 0)) return true; return false; };
const wsB = (rows, word) => { const g0 = rows.map((r) => r.split('')); const m = g0.length, n = g0[0].length; const go = (used, r, c, k) => { if (g0[r][c] !== word[k]) return false; if (k === word.length - 1) return true; const nu = used.map((row) => row.slice()); nu[r][c] = 1; return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dr, dc]) => { const nr = r + dr, nc = c + dc; return nr >= 0 && nr < m && nc >= 0 && nc < n && !nu[nr][nc] && go(nu, nr, nc, k + 1); }); }; const z = Array.from({ length: m }, () => new Array(n).fill(0)); for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (go(z, r, c, 0)) return true; return false; };

const tripA = (nums) => { let a = Infinity, b = Infinity; for (const v of nums) { if (v <= a) a = v; else if (v <= b) b = v; else return true; } return false; };
const tripB = (nums) => { for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) for (let k = j + 1; k < nums.length; k++) if (nums[i] < nums[j] && nums[j] < nums[k]) return true; return false; };

/** Brackets: stack (A) vs repeated cancellation (B). */
const parA = (s) => { const st = []; const m = { ')': '(', ']': '[', '}': '{' }; for (const c of s) { if (c === '(' || c === '[' || c === '{') st.push(c); else if (st.pop() !== m[c]) return false; } return st.length === 0; };
const parB = (s) => { let t = s; for (let changed = true; changed;) { changed = false; for (const p of ['()', '[]', '{}']) { const i = t.indexOf(p); if (i >= 0) { t = t.slice(0, i) + t.slice(i + 2); changed = true; break; } } } return t === ''; };

/** Letter combinations: iterative product (A) vs recursive build (B). */
const lcA = (d) => { let r = ['']; for (const ch of d) { const nx = []; for (const p of r) for (const l of phone[ch]) nx.push(p + l); r = nx; } return r; };
const lcB = (d) => { const r = []; (function rec(i, cur) { if (i === d.length) { r.push(cur); return; } for (const l of phone[d[i]]) rec(i + 1, cur + l); })(0, ''); return r; };

/** Valid palindrome II: two-pointer skip (A) vs try-every-deletion (B). */
const palA = (s) => { let l = 0, r = s.length - 1; const ok = (a, b) => { while (a < b) { if (s[a] !== s[b]) return false; a++; b--; } return true; }; while (l < r) { if (s[l] === s[r]) { l++; r--; } else return ok(l + 1, r) || ok(l, r - 1); } return true; };
const palB = (s) => { const isPal = (t) => t === t.split('').reverse().join(''); if (isPal(s)) return true; for (let i = 0; i < s.length; i++) if (isPal(s.slice(0, i) + s.slice(i + 1))) return true; return false; };

function curated(title) {
  const c = CURATED[title];
  if (!c || !c.desc || !c.sample || !c.hidden) {
    throw new Error(`authoredDsaBatch2: incomplete (C) curated entry for "${title}"`);
  }
  if (!c.functionSignature || Object.keys(c.functionSignature).length !== 4) {
    throw new Error(`authoredDsaBatch2: curated entry for "${title}" lacks 4 language signatures`);
  }
  return c;
}

/* ============================== FIXTURE TABLES ===============================
 * Only inputs whose expected output is derivable with certainty. Each entry
 * lists raw input text (real newlines) plus the parse used by both algorithms.
 * `curated: 'sample' | 'hidden'` marks the two fixtures taken verbatim from (C).
 */
const FIXTURES = {
  'Pascals Triangle': [
    { input: '5', parse: (s) => [parseInt(s, 10)], a: (n) => JSON.stringify(pascalA(n[0])), b: (n) => JSON.stringify(pascalB(n[0])), curated: 'sample' },
    { input: '1', parse: (s) => [parseInt(s, 10)], a: (n) => JSON.stringify(pascalA(n[0])), b: (n) => JSON.stringify(pascalB(n[0])), curated: 'hidden' },
    { input: '2', parse: (s) => [parseInt(s, 10)], a: (n) => JSON.stringify(pascalA(n[0])), b: (n) => JSON.stringify(pascalB(n[0])) },
    { input: '3', parse: (s) => [parseInt(s, 10)], a: (n) => JSON.stringify(pascalA(n[0])), b: (n) => JSON.stringify(pascalB(n[0])) },
    { input: '0', parse: (s) => [parseInt(s, 10)], a: (n) => JSON.stringify(pascalA(n[0])), b: (n) => JSON.stringify(pascalB(n[0])) },
    { input: '4', parse: (s) => [parseInt(s, 10)], a: (n) => JSON.stringify(pascalA(n[0])), b: (n) => JSON.stringify(pascalB(n[0])) },
    { input: '8', parse: (s) => [parseInt(s, 10)], a: (n) => JSON.stringify(pascalA(n[0])), b: (n) => JSON.stringify(pascalB(n[0])) },
    { input: '12', parse: (s) => [parseInt(s, 10)], a: (n) => JSON.stringify(pascalA(n[0])), b: (n) => JSON.stringify(pascalB(n[0])) },
    { input: '20', parse: (s) => [parseInt(s, 10)], a: (n) => JSON.stringify(pascalA(n[0])), b: (n) => JSON.stringify(pascalB(n[0])) },
    { input: '30', parse: (s) => [parseInt(s, 10)], a: (n) => JSON.stringify(pascalA(n[0])), b: (n) => JSON.stringify(pascalB(n[0])) },
  ],
  'Minimum Size Subarray Sum': [
    { input: '7\n[2,3,1,2,4,3]', parse: (s) => { const l = s.split('\n'); return [parseInt(l[0], 10), JSON.parse(l[1])]; }, a: (p) => String(mssA(p[0], p[1])), b: (p) => String(mssB(p[0], p[1])), curated: 'sample' },
    { input: '4\n[1,4,4]', parse: (s) => { const l = s.split('\n'); return [parseInt(l[0], 10), JSON.parse(l[1])]; }, a: (p) => String(mssA(p[0], p[1])), b: (p) => String(mssB(p[0], p[1])), curated: 'hidden' },
    { input: '5\n[1,2,3,4,5]', parse: (s) => { const l = s.split('\n'); return [parseInt(l[0], 10), JSON.parse(l[1])]; }, a: (p) => String(mssA(p[0], p[1])), b: (p) => String(mssB(p[0], p[1])) },
    { input: '1\n[]', parse: (s) => { const l = s.split('\n'); return [parseInt(l[0], 10), JSON.parse(l[1] || '[]')]; }, a: (p) => String(mssA(p[0], p[1])), b: (p) => String(mssB(p[0], p[1])) },
    { input: '1\n[1]', parse: (s) => { const l = s.split('\n'); return [parseInt(l[0], 10), JSON.parse(l[1])]; }, a: (p) => String(mssA(p[0], p[1])), b: (p) => String(mssB(p[0], p[1])) },
    { input: '11\n[1,1,1,1,1,1,1,1]', parse: (s) => { const l = s.split('\n'); return [parseInt(l[0], 10), JSON.parse(l[1])]; }, a: (p) => String(mssA(p[0], p[1])), b: (p) => String(mssB(p[0], p[1])) },
    { input: '100\n[1,2,3,4,5]', parse: (s) => { const l = s.split('\n'); return [parseInt(l[0], 10), JSON.parse(l[1])]; }, a: (p) => String(mssA(p[0], p[1])), b: (p) => String(mssB(p[0], p[1])) },
    { input: '8\n[2,3,4]', parse: (s) => { const l = s.split('\n'); return [parseInt(l[0], 10), JSON.parse(l[1])]; }, a: (p) => String(mssA(p[0], p[1])), b: (p) => String(mssB(p[0], p[1])) },
    { input: '213\n[12,28,83,4,25,26,25,2,25,25,25,12,54,12,43,7,35,92,36,46]', parse: (s) => { const l = s.split('\n'); return [parseInt(l[0], 10), JSON.parse(l[1])]; }, a: (p) => String(mssA(p[0], p[1])), b: (p) => String(mssB(p[0], p[1])) },
    { input: '15\n[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]', parse: (s) => { const l = s.split('\n'); return [parseInt(l[0], 10), JSON.parse(l[1])]; }, a: (p) => String(mssA(p[0], p[1])), b: (p) => String(mssB(p[0], p[1])) },
    { input: '10\n[3,2,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]', parse: (s) => { const l = s.split('\n'); return [parseInt(l[0], 10), JSON.parse(l[1])]; }, a: (p) => String(mssA(p[0], p[1])), b: (p) => String(mssB(p[0], p[1])) },
  ],
  'Increasing Triplet Subsequence': [
    { input: '[1,2,3,4,5]', parse: (s) => [JSON.parse(s)], a: (p) => String(tripA(p[0])), b: (p) => String(tripB(p[0])), curated: 'sample' },
    { input: '[5,4,3,2,1]', parse: (s) => [JSON.parse(s)], a: (p) => String(tripA(p[0])), b: (p) => String(tripB(p[0])), curated: 'hidden' },
    { input: '[2,1,5,0,4,6]', parse: (s) => [JSON.parse(s)], a: (p) => String(tripA(p[0])), b: (p) => String(tripB(p[0])) },
    { input: '[]', parse: (s) => [JSON.parse(s)], a: (p) => String(tripA(p[0])), b: (p) => String(tripB(p[0])) },
    { input: '[1]', parse: (s) => [JSON.parse(s)], a: (p) => String(tripA(p[0])), b: (p) => String(tripB(p[0])) },
    { input: '[1,2]', parse: (s) => [JSON.parse(s)], a: (p) => String(tripA(p[0])), b: (p) => String(tripB(p[0])) },
    { input: '[1,1,1,1]', parse: (s) => [JSON.parse(s)], a: (p) => String(tripA(p[0])), b: (p) => String(tripB(p[0])) },
    { input: '[2,2,2]', parse: (s) => [JSON.parse(s)], a: (p) => String(tripA(p[0])), b: (p) => String(tripB(p[0])) },
    { input: '[3,5,1,2,4]', parse: (s) => [JSON.parse(s)], a: (p) => String(tripA(p[0])), b: (p) => String(tripB(p[0])) },
    { input: '[-2,-1,0]', parse: (s) => [JSON.parse(s)], a: (p) => String(tripA(p[0])), b: (p) => String(tripB(p[0])) },
    { input: '[-3,5,0,1]', parse: (s) => [JSON.parse(s)], a: (p) => String(tripA(p[0])), b: (p) => String(tripB(p[0])) },
    { input: '[1,2,3,1,1]', parse: (s) => [JSON.parse(s)], a: (p) => String(tripA(p[0])), b: (p) => String(tripB(p[0])) },
    { input: '[10,20,30,40,50]', parse: (s) => [JSON.parse(s)], a: (p) => String(tripA(p[0])), b: (p) => String(tripB(p[0])) },
    { input: '[0,1,2,3,4,5,6,7,8,9]', parse: (s) => [JSON.parse(s)], a: (p) => String(tripA(p[0])), b: (p) => String(tripB(p[0])) },
  ],

  'Valid Parentheses String': [
    { input: '()[]{}', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])), curated: 'sample' },
    { input: '(]', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])), curated: 'hidden' },
    { input: '()[]', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '(', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: ')', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '()', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '([]{})', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '([)]', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '((()))', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '(){[]}', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '[]', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '}{', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '())(', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '([{}])', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '([]', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '[])', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '()' + '()'.repeat(20), parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '(' + '()'.repeat(20) + ')', parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
    { input: '([)]' + '()'.repeat(20), parse: (s) => [s], a: (p) => String(parA(p[0])), b: (p) => String(parB(p[0])) },
  ],
  'Letter Combinations': [
    { input: '23', parse: (s) => [s], a: (p) => JSON.stringify(lcA(p[0])), b: (p) => JSON.stringify(lcB(p[0])), curated: 'sample' },
    { input: '2', parse: (s) => [s], a: (p) => JSON.stringify(lcA(p[0])), b: (p) => JSON.stringify(lcB(p[0])), curated: 'hidden' },
    { input: '9', parse: (s) => [s], a: (p) => JSON.stringify(lcA(p[0])), b: (p) => JSON.stringify(lcB(p[0])) },
    { input: '234', parse: (s) => [s], a: (p) => JSON.stringify(lcA(p[0])), b: (p) => JSON.stringify(lcB(p[0])) },
    { input: '79', parse: (s) => [s], a: (p) => JSON.stringify(lcA(p[0])), b: (p) => JSON.stringify(lcB(p[0])) },
    { input: '2345', parse: (s) => [s], a: (p) => JSON.stringify(lcA(p[0])), b: (p) => JSON.stringify(lcB(p[0])) },
    { input: '6789', parse: (s) => [s], a: (p) => JSON.stringify(lcA(p[0])), b: (p) => JSON.stringify(lcB(p[0])) },
    { input: '22', parse: (s) => [s], a: (p) => JSON.stringify(lcA(p[0])), b: (p) => JSON.stringify(lcB(p[0])) },
    { input: '25', parse: (s) => [s], a: (p) => JSON.stringify(lcA(p[0])), b: (p) => JSON.stringify(lcB(p[0])) },
    { input: '7', parse: (s) => [s], a: (p) => JSON.stringify(lcA(p[0])), b: (p) => JSON.stringify(lcB(p[0])) },
  ],
  'Valid Palindrome II': [
    { input: 'abca', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])), curated: 'sample' },
    { input: 'abc', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])), curated: 'hidden' },
    { input: 'a', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'aa', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'ab', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'bb', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'abcba', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'abcda', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'abcd', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'aab', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'abb', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'abba', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'abcab', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'abccbad', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'abcdba', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'aabbaa', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'racecar', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'deeee', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'abcdefgfedcba', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
    { input: 'aaaa', parse: (s) => [s], a: (p) => String(palA(p[0])), b: (p) => String(palB(p[0])) },
  ],

  'Basic Calculator III': [
    { input: '2*(5+5*2)/3+(6/2+8)', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])), curated: 'sample' },
    { input: '(1+(4+5+2)-3)+(6+8)', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])), curated: 'hidden' },
    { input: '1+1', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '0', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '1', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '2147483647', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '2*3', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '7/2', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '1-2*3', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '100/5/2', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '2*3+4*5', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '((7))', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '1-10/3', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '2 * (5 + 5 * 2) / 3 + (6 / 2 + 8)', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '1+2*3-4/2', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '10-2-3', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '(((1)))', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '8/3', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '1*2*3*4', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '100-10*10', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
    { input: '5/2*2', parse: (s) => [s], a: (p) => String(calcA(p[0])), b: (p) => String(calcB(p[0])) },
  ],

  'Word Search': [
    { input: '["ABCE","SFCS","ADEE"]\nABCCED', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])), curated: 'sample' },
    { input: '["ABCE","SFCS","ADEE"]\nABCB', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])), curated: 'hidden' },
    { input: '["A"]\nA', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
    { input: '["A"]\nB', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
    { input: '["AB","CD"]\nAB', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
    { input: '["AB","CD"]\nAC', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
    { input: '["AB","CD"]\nDC', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
    { input: '["AB","AB"]\nAA', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
    { input: '["AAA","AAA","AAA"]\nAAAAAA', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
    { input: '["AAA"]\nAAAA', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
    { input: '["ab","cd"]\nDCBA', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
    { input: '["AAAA"]\nAAAAA', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
    { input: '["AAA","AAA","AAA","AAA"]\nAAAAAAAAAAAAAAAA', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
    { input: '["ABC","DEF","GHI"]\nADG', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
    { input: '["ABC","DEF","GHI"]\nAEG', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
    { input: '["ABC","DEF","GHI","JKL","MNO","PQR"]\nADGJMP', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
    { input: '["ABC","DEF","GHI","JKL","MNO","PQR"]\nAEIMKQ', parse: (s) => { const l = s.split('\n'); return [JSON.parse(l[0]), l[1]]; }, a: (p) => String(wsA(p[0], p[1])), b: (p) => String(wsB(p[0], p[1])) },
  ],
};


/** Build sample+hidden fixtures for one record, or throw if anything is unprovable. */
function buildTests(title) {
  const c = curated(title);
  const table = FIXTURES[title];
  if (!table || !Array.isArray(table) || table.length === 0) {
    throw new Error(`authoredDsaBatch2: no fixture table for "${title}"`);
  }
  const built = table.map((f) => {
    const p = f.parse(f.input);
    const a = f.a(p);
    const b = f.b(p);
    if (a !== b) {
      throw new Error(`authoredDsaBatch2: dual-derivation disagreement on "${title}" input ${JSON.stringify(f.input)}: A=${a} B=${b}`);
    }
    if (!String(f.input).trim()) throw new Error(`authoredDsaBatch2: empty fixture input for "${title}"`);
    if (String(a).trim() === '') throw new Error(`authoredDsaBatch2: empty expected output for "${title}"`);
    return { input: f.input, output: a, curated: f.curated || null };
  });

  // The two curated fixtures must reproduce the curated expected output exactly.
  for (const kind of ['sample', 'hidden']) {
    const want = String(c[kind].output);
    const wantInput = decodeLiteralNewlines(c[kind].input);
    const hit = built.find((t) => t.input === wantInput && t.curated === kind);
    if (!hit) throw new Error(`authoredDsaBatch2: curated ${kind} fixture missing for "${title}"`);
    if (hit.output !== want) {
      throw new Error(`authoredDsaBatch2: curated ${kind} output not reproduced for "${title}": derived=${hit.output} curated=${want}`);
    }
  }

  const curatedSample = built.find((t) => t.curated === 'sample');
  const samples = [curatedSample, ...built.filter((t) => !t.curated && t.input !== curatedSample.input)].slice(0, 3);
  const sampleInputs = new Set(samples.map((t) => t.input));
  const hidden = built.filter((t) => !sampleInputs.has(t.input));
  if (samples.length < 3) throw new Error(`authoredDsaBatch2: fewer than 3 samples for "${title}"`);
  if (hidden.length === 0) throw new Error(`authoredDsaBatch2: no hidden tests for "${title}"`);
  const dupes = (arr) => arr.filter((t, i) => arr.findIndex((u) => u.input === t.input) !== i).map((t) => t.input);
  if (dupes(samples).length) throw new Error(`authoredDsaBatch2: duplicate sample input for "${title}": ${dupes(samples)}`);
  if (dupes(hidden).length) throw new Error(`authoredDsaBatch2: duplicate hidden input for "${title}": ${dupes(hidden)}`);
  return { samples, hidden };
}


/* ============================ REFERENCE SOLUTIONS =============================
 * The stored reference is JavaScript (models/CodingProblem.js referenceSolution).
 * Java/C++/Python bodies are kept here too so the validator can prove the
 * platform drivers parse every fixture identically in all four languages.
 */
const REFERENCES = {
  'Pascals Triangle': {
    javascript: `function generate(numRows) {
  const rows = [];
  for (let i = 0; i < numRows; i++) {
    const row = [1];
    for (let j = 1; j <= i; j++) row[j] = (rows[i - 1][j - 1] || 0) + (rows[i - 1][j] || 0);
    rows.push(row);
  }
  return rows;
}`,
    java: `    public int[][] generate(int numRows) {
        int[][] rows = new int[numRows][];
        for (int i = 0; i < numRows; i++) {
            rows[i] = new int[i + 1];
            rows[i][0] = 1;
            rows[i][i] = 1;
            for (int j = 1; j < i; j++) rows[i][j] = rows[i - 1][j - 1] + rows[i - 1][j];
        }
        return rows;
    }`,
    cpp: `vector<vector<int>> generate(int numRows) {
    vector<vector<int>> rows;
    for (int i = 0; i < numRows; i++) {
        vector<int> row(i + 1, 1);
        for (int j = 1; j < i; j++) row[j] = rows[i - 1][j - 1] + rows[i - 1][j];
        rows.push_back(row);
    }
    return rows;
}`,
    python: `def generate(num_rows):
    rows = []
    for i in range(num_rows):
        row = [1]
        for j in range(1, i + 1):
            left = rows[i - 1][j - 1] if j - 1 < len(rows[i - 1]) else 0
            right = rows[i - 1][j] if j < len(rows[i - 1]) else 0
            row.append(left + right)
        rows.append(row)
    return rows`,
  },
  'Minimum Size Subarray Sum': {
    javascript: `function minSubArrayLen(target, nums) {
  let best = Infinity, sum = 0, left = 0;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) { best = Math.min(best, right - left + 1); sum -= nums[left++]; }
  }
  return best === Infinity ? 0 : best;
}`,
    java: `    public int minSubArrayLen(int target, int[] nums) {
        int best = Integer.MAX_VALUE, sum = 0, left = 0;
        for (int right = 0; right < nums.length; right++) {
            sum += nums[right];
            while (sum >= target) { best = Math.min(best, right - left + 1); sum -= nums[left++]; }
        }
        return best == Integer.MAX_VALUE ? 0 : best;
    }`,
    cpp: `int minSubArrayLen(int target, vector<int> nums) {
    int best = INT_MAX, sum = 0, left = 0;
    for (int right = 0; right < (int)nums.size(); right++) {
        sum += nums[right];
        while (sum >= target) { best = min(best, right - left + 1); sum -= nums[left++]; }
    }
    return best == INT_MAX ? 0 : best;
}`,
    python: `def min_sub_array_len(target, nums):
    best, total, left = None, 0, 0
    for right, value in enumerate(nums):
        total += value
        while total >= target:
            size = right - left + 1
            best = size if best is None else min(best, size)
            total -= nums[left]
            left += 1
    return 0 if best is None else best`,
  },
  'Increasing Triplet Subsequence': {
    javascript: `function increasingTriplet(nums) {
  let first = Infinity, second = Infinity;
  for (const value of nums) {
    if (value <= first) first = value;
    else if (value <= second) second = value;
    else return true;
  }
  return false;
}`,
    java: `    public boolean increasingTriplet(int[] nums) {
        int first = Integer.MAX_VALUE, second = Integer.MAX_VALUE;
        for (int value : nums) {
            if (value <= first) first = value;
            else if (value <= second) second = value;
            else return true;
        }
        return false;
    }`,
    cpp: `bool increasingTriplet(vector<int> nums) {
    int first = INT_MAX, second = INT_MAX;
    for (int value : nums) {
        if (value <= first) first = value;
        else if (value <= second) second = value;
        else return true;
    }
    return false;
}`,
    python: `def increasing_triplet(nums):
    first = second = None
    for value in nums:
        if first is None or value <= first:
            first = value
        elif second is None or value <= second:
            second = value
        else:
            return True
    return False`,
  },

  'Valid Parentheses String': {
    javascript: `function isValid(s) {
  const stack = [];
  const close = { ')': '(', ']': '[', '}': '{' };
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
    else if (stack.pop() !== close[ch]) return false;
  }
  return stack.length === 0;
}`,
    java: `    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '(' || ch == '[' || ch == '{') stack.push(ch);
            else if (stack.isEmpty() || !matches(stack.pop(), ch)) return false;
        }
        return stack.isEmpty();
    }

    private static boolean matches(char open, char close) {
        return (open == '(' && close == ')') || (open == '[' && close == ']') || (open == '{' && close == '}');
    }`,
    cpp: `bool isValid(string s) {
    vector<char> stack;
    for (char ch : s) {
        if (ch == '(' || ch == '[' || ch == '{') stack.push_back(ch);
        else if (stack.empty()) return false;
        else {
            char open = stack.back();
            stack.pop_back();
            bool ok = (open == '(' && ch == ')') || (open == '[' && ch == ']') || (open == '{' && ch == '}');
            if (!ok) return false;
        }
    }
    return stack.empty();
}`,
    python: `def is_valid(s):
    stack = []
    close = {')': '(', ']': '[', '}': '{'}
    for ch in s:
        if ch in '([{':
            stack.append(ch)
        elif not stack or stack.pop() != close.get(ch):
            return False
    return not stack`,
  },
  'Letter Combinations': {
    javascript: `function letterCombinations(digits) {
  if (!digits.length) return [];
  const phone = { 2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl', 6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz' };
  let result = [''];
  for (const digit of digits) {
    const next = [];
    for (const prefix of result) for (const letter of phone[digit]) next.push(prefix + letter);
    result = next;
  }
  return result;
}`,
    java: `    public List<String> letterCombinations(String digits) {
        if (digits == null || digits.isEmpty()) return new ArrayList<>();
        String[] phone = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        List<String> result = new ArrayList<>();
        result.add("");
        for (int i = 0; i < digits.length(); i++) {
            List<String> next = new ArrayList<>();
            for (String prefix : result) {
                for (char letter : phone[digits.charAt(i) - '0'].toCharArray()) next.add(prefix + letter);
            }
            result = next;
        }
        return result;
    }`,
    cpp: `vector<string> letterCombinations(string digits) {
    if (digits.empty()) return {};
    string phone[10] = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
    vector<string> result = {""};
    for (char digit : digits) {
        vector<string> next;
        for (const string& prefix : result)
            for (char letter : phone[digit - '0']) next.push_back(prefix + letter);
        result = next;
    }
    return result;
}`,
    python: `def letter_combinations(digits):
    if not digits:
        return []
    phone = {2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl', 6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz'}
    result = ['']
    for digit in digits:
        result = [prefix + letter for prefix in result for letter in phone[int(digit)]]
    return result`,
  },
  'Valid Palindrome II': {
    javascript: `function validPalindrome(s) {
  const isPal = (a, b) => { while (a < b) { if (s[a] !== s[b]) return false; a++; b--; } return true; };
  let left = 0, right = s.length - 1;
  while (left < right) {
    if (s[left] === s[right]) { left++; right--; }
    else return isPal(left + 1, right) || isPal(left, right - 1);
  }
  return true;
}`,
    java: `    public boolean validPalindrome(String s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            if (s.charAt(left) == s.charAt(right)) { left++; right--; }
            else return isPalindrome(s, left + 1, right) || isPalindrome(s, left, right - 1);
        }
        return true;
    }

    private static boolean isPalindrome(String s, int left, int right) {
        while (left < right) { if (s.charAt(left) != s.charAt(right)) return false; left++; right--; }
        return true;
    }`,
    cpp: `bool validPalindrome(string s) {
    auto isPal = [&](int a, int b) { while (a < b) { if (s[a] != s[b]) return false; a++; b--; } return true; };
    int left = 0, right = (int)s.size() - 1;
    while (left < right) {
        if (s[left] == s[right]) { left++; right--; }
        else return isPal(left + 1, right) || isPal(left, right - 1);
    }
    return true;
}`,
    python: `def valid_palindrome(s):
    def is_pal(a, b):
        while a < b:
            if s[a] != s[b]:
                return False
            a, b = a + 1, b - 1
        return True
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] == s[right]:
            left, right = left + 1, right - 1
        else:
            return is_pal(left + 1, right) or is_pal(left, right - 1)
    return True`,
  },

  'Basic Calculator III': {
    javascript: `function calculate(s) {
  const t = s.replace(/\\s+/g, '');
  let i = 0;
  const expr = () => { let v = term(); while (t[i] === '+' || t[i] === '-') { const op = t[i++]; const r = term(); v = op === '+' ? v + r : v - r; } return v; };
  const term = () => { let v = factor(); while (t[i] === '*' || t[i] === '/') { const op = t[i++]; const r = factor(); v = op === '*' ? v * r : Math.trunc(v / r); } return v; };
  const factor = () => { if (t[i] === '(') { i++; const v = expr(); i++; return v; } let d = ''; while (i < t.length && t[i] >= '0' && t[i] <= '9') d += t[i++]; return parseInt(d, 10); };
  return expr();
}`,
    java: `    public int calculate(String s) {
        String t = s.replaceAll("\\\\s+", "");
        return new CalcParser(t).parse();
    }

    private static class CalcParser {
        private final String t;
        private int i = 0;

        CalcParser(String text) { this.t = text; }

        int parse() { return expr(); }

        private int expr() {
            int v = term();
            while (i < t.length() && (t.charAt(i) == '+' || t.charAt(i) == '-')) {
                char op = t.charAt(i++);
                int r = term();
                v = op == '+' ? v + r : v - r;
            }
            return v;
        }

        private int term() {
            int v = factor();
            while (i < t.length() && (t.charAt(i) == '*' || t.charAt(i) == '/')) {
                char op = t.charAt(i++);
                int r = factor();
                if (op == '*') v = v * r; else v = v / r;
            }
            return v;
        }

        private int factor() {
            if (t.charAt(i) == '(') { i++; int v = expr(); i++; return v; }
            int v = 0;
            while (i < t.length() && Character.isDigit(t.charAt(i))) v = v * 10 + (t.charAt(i++) - '0');
            return v;
        }
    }`,
    cpp: `int calculate(string s) {
    string t;
    for (char ch : s) if (!isspace((unsigned char)ch)) t += ch;
    int i = 0;
    function<int()> factor, term, expr;
    factor = [&]() { if (t[i] == '(') { i++; int v = expr(); i++; return v; } int v = 0; while (i < (int)t.size() && isdigit((unsigned char)t[i])) v = v * 10 + (t[i++] - '0'); return v; };
    term = [&]() { int v = factor(); while (i < (int)t.size() && (t[i] == '*' || t[i] == '/')) { char op = t[i++]; int r = factor(); v = (op == '*') ? v * r : v / r; } return v; };
    expr = [&]() { int v = term(); while (i < (int)t.size() && (t[i] == '+' || t[i] == '-')) { char op = t[i++]; int r = term(); v = (op == '+') ? v + r : v - r; } return v; };
    return expr();
}`,
    python: `def calculate(s):
    t = ''.join(s.split())
    i = 0

    def expr():
        nonlocal i
        v = term()
        while i < len(t) and t[i] in '+-':
            op = t[i]
            i += 1
            r = term()
            v = v + r if op == '+' else v - r
        return v

    def term():
        nonlocal i
        v = factor()
        while i < len(t) and t[i] in '*/':
            op = t[i]
            i += 1
            r = factor()
            v = v * r if op == '*' else int(v / r)
        return v

    def factor():
        nonlocal i
        if t[i] == '(':
            i += 1
            v = expr()
            i += 1
            return v
        v = 0
        while i < len(t) and t[i].isdigit():
            v = v * 10 + int(t[i])
            i += 1
        return v

    return expr()`,
  },

  'Word Search': {
    javascript: `function exist(board, word) {
  const grid = board.map((row) => row.split(''));
  const rows = grid.length, cols = grid[0].length;
  const dfs = (r, c, k) => {
    if (grid[r][c] !== word[k]) return false;
    if (k === word.length - 1) return true;
    const saved = grid[r][c];
    grid[r][c] = '#';
    const found = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      return nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] !== '#' && dfs(nr, nc, k + 1);
    });
    grid[r][c] = saved;
    return found;
  };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (dfs(r, c, 0)) return true;
  return false;
}`,
    java: `    public boolean exist(String[] board, String word) {
        for (int r = 0; r < board.length; r++)
            for (int c = 0; c < board[r].length(); c++)
                if (search(board, word, r, c, 0)) return true;
        return false;
    }

    private static boolean search(String[] board, String word, int r, int c, int k) {
        if (board[r].charAt(c) != word.charAt(k)) return false;
        if (k == word.length() - 1) return true;
        String[] grid = board.clone();
        StringBuilder row = new StringBuilder(board[r]);
        char saved = board[r].charAt(c);
        row.setCharAt(c, '#');
        grid[r] = row.toString();
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[nr].length()
                    && grid[nr].charAt(nc) != '#' && search(grid, word, nr, nc, k + 1)) return true;
        }
        return false;
    }`,
    cpp: `bool exist(string board, string word) {
    vector<vector<char>> grid = toGrid(board);
    int rows = (int)grid.size(), cols = (int)grid[0].size();
    int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
    function<bool(int, int, int)> dfs = [&](int r, int c, int k) -> bool {
        if (grid[r][c] != word[k]) return false;
        if (k == (int)word.size() - 1) return true;
        char saved = grid[r][c];
        grid[r][c] = '#';
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] != '#' && dfs(nr, nc, k + 1)) {
                grid[r][c] = saved;
                return true;
            }
        }
        grid[r][c] = saved;
        return false;
    };
    for (int r = 0; r < rows; r++) for (int c = 0; c < cols; c++) if (dfs(r, c, 0)) return true;
    return false;
}`,
    python: `def exist(board, word):
    rows, cols = len(board), len(board[0])
    grid = [list(row) for row in board]

    def dfs(r, c, k):
        if grid[r][c] != word[k]:
            return False
        if k == len(word) - 1:
            return True
        saved = grid[r][c]
        grid[r][c] = '#'
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != '#' and dfs(nr, nc, k + 1):
                grid[r][c] = saved
                return True
        grid[r][c] = saved
        return False

    for r in range(rows):
        for c in range(cols):
            if dfs(r, c, 0):
                return True
    return False`,
  },
};


/* ====================== DRIVER-COMPATIBLE SIGNATURES =========================
 * The curated signatures are authoritative EXCEPT where the platform driver
 * cannot express the type. Two documented overrides, both required for the
 * template to compile and for the driver to parse the fixture:
 *
 *  1. Word Search `board`: curated declares char[][] / vector<vector<char>> /
 *     string[][] / List[List[str]]. The Java driver (javaParseLine) and the C++
 *     driver (buildCppDriver) have no parser for those, so they fall through to
 *     `String board = lines[0];` / `auto board = lines[0];` and the call fails
 *     to COMPILE. `string[]` IS parsed by all four drivers (JS JSON.parse, Java
 *     parseStringArray, C++ parseStringArray), so `board` is a flat array of
 *     rows and the starter turns it into the 2-D grid. Input encoding is
 *     unchanged (["ABCE","SFCS","ADEE"]).
 *  2. Pascals Triangle Java return: `List<List<Integer>>` prints via
 *     System.out.println (nested lists flatten to "[1], [1, 1]"), which
 *     outputsMatch cannot compare against a nested expected value.
 *     Arrays.deepToString (used for int[][]) preserves nesting, so the Java
 *     return type is int[][].
 */
const SIG_OVERRIDES = {
  'Word Search': {
    javascript: { name: 'exist', params: [{ name: 'board', type: 'string[]' }, { name: 'word', type: 'string' }], returnType: 'boolean' },
    python: { name: 'exist', params: [{ name: 'board', type: 'List[str]' }, { name: 'word', type: 'str' }], returnType: 'bool' },
    java: { name: 'exist', params: [{ name: 'board', type: 'String[]' }, { name: 'word', type: 'String' }], returnType: 'boolean' },
    // C++ takes the RAW line: the C++ driver's parseStringArray splits on whitespace
    // and would fold ["ABCE","SFCS","ADEE"] into a single bogus row, so the starter
    // parses the quoted row tokens itself (same pattern as the Batch 1 tree records).
    cpp: { name: 'exist', params: [{ name: 'board', type: 'string' }, { name: 'word', type: 'string' }], returnType: 'bool' },
  },
  'Pascals Triangle': {
    java: { name: 'generate', params: [{ name: 'numRows', type: 'int' }], returnType: 'int[][]' },
  },
};

/** Row-array -> 2-D grid helper prepended to the Word Search starters. */
const GRID_PREAMBLE = {
  javascript: `/** rows: ["ABCE", "SFCS", "ADEE"] -> grid[r][c] = 'A' | 'B' | ... */
function toGrid(rows) {
  return rows.map((row) => row.split(''));
}

`,
  python: `def to_grid(rows):
    """rows: ["ABCE", "SFCS", "ADEE"] -> grid[r][c] = 'A' | 'B' | ..."""
    return [list(row) for row in rows]

`,
  java: `    /** rows: ["ABCE", "SFCS", "ADEE"] -> grid[r][c] = 'A' | 'B' | ... */
    static char[][] toGrid(String[] rows) {
        char[][] grid = new char[rows.length][];
        for (int r = 0; r < rows.length; r++) grid[r] = rows[r].toCharArray();
        return grid;
    }

`,
  cpp: `/** board line '["ABCE", "SFCS", "ADEE"]' -> grid[r][c] = 'A' | 'B' | ... */
vector<vector<char>> toGrid(const string& raw) {
    vector<vector<char>> grid;
    string row;
    bool inQuotes = false;
    for (size_t i = 0; i < raw.size(); i++) {
        char ch = raw[i];
        if (ch == '"') { inQuotes = !inQuotes; continue; }
        if (!inQuotes && (ch == '[' || ch == ']' || ch == ',' || isspace((unsigned char)ch))) {
            if (!row.empty()) { grid.push_back(vector<char>(row.begin(), row.end())); row.clear(); }
            continue;
        }
        row.push_back(ch);
    }
    if (!row.empty()) grid.push_back(vector<char>(row.begin(), row.end()));
    return grid;
}

`,
};

/** Signature set for a record: curated, with the documented driver overrides. */
function signatures(title) {
  const c = curated(title);
  const out = {};
  for (const lang of ['javascript', 'python', 'java', 'cpp']) {
    const base = c.functionSignature[lang];
    if (!base || !base.name) throw new Error(`authoredDsaBatch2: curated signature missing (${lang}) for "${title}"`);
    const ov = (SIG_OVERRIDES[title] || {})[lang];
    out[lang] = ov ? ov : base;
  }
  return out;
}

/** Typed default return literal per language/return type (every stub compiles). */
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
    if (tl === 'int' || tl === 'long') return '0';
    if (tl.includes('vector')) return '{}';
    return '""';
  }
  if (lang === 'python') {
    if (tl === 'bool' || tl === 'boolean') return 'False';
    if (tl.startsWith('list') || tl.endsWith('[]')) return '[]';
    if (/int|float|double|number/.test(tl)) return '0';
    if (tl === 'str' || tl === 'string') return "''";
    return 'None';
  }
  // javascript
  if (tl === 'bool' || tl === 'boolean') return 'false';
  if (tl.startsWith('list') || tl.endsWith('[]')) return '[]';
  if (/int|float|double|number/.test(tl)) return '0';
  if (tl === 'str' || tl === 'string') return "''";
  return 'null';
}

/** Build the four-language typed starter block from the record's signatures. */
function typedStarters(title, sigs) {
  const js = sigs.javascript, py = sigs.python, jv = sigs.java, cp = sigs.cpp;
  for (const [lang, s] of Object.entries(sigs)) {
    if (!s || !s.name || !Array.isArray(s.params) || !s.returnType) {
      throw new Error(`authoredDsaBatch2: malformed ${lang} signature for "${title}"`);
    }
  }
  // Only Word Search needs the row-array -> 2-D grid helper; the other records
  // take their parameters directly from the driver-parsed lines.
  const preOf = (lang) => (title === 'Word Search' ? GRID_PREAMBLE[lang] : '');
  const jsParams = js.params.map((p) => p.name).join(', ');
  const pyParams = py.params.map((p) => p.name).join(', ');
  const jvParams = jv.params.map((p) => `${p.type} ${p.name}`).join(', ');
  const cpParams = cp.params.map((p) => `${p.type} ${p.name}`).join(', ');
  const javaHead = (jv.returnType.toLowerCase().startsWith('list') || jv.returnType.includes('Deque')) ? 'import java.util.*;\n\n' : '';
  if (!REFERENCES[title]) throw new Error(`authoredDsaBatch2: no reference solution for "${title}"`);
  return {
    javascript: `${preOf('javascript')}function ${js.name}(${jsParams}) {\n    \n    return ${defaultReturn('javascript', js.returnType)};\n}\n`,
    python: `${preOf('python')}def ${py.name}(${pyParams}):\n    \n    return ${defaultReturn('python', py.returnType)}\n`,
    java: `${preOf('java')}${javaHead}class Solution {\n    public ${jv.returnType} ${jv.name}(${jvParams}) {\n        \n        return ${defaultReturn('java', jv.returnType)};\n    }\n}\n`,
    cpp: `${preOf('cpp')}${cp.returnType} ${cp.name}(${cpParams}) {\n    \n    return ${defaultReturn('cpp', cp.returnType)};\n}\n`,
  };
}


/* ============================== RECORD ASSEMBLY ============================== */
const BATCH_TITLES = [
  'Pascals Triangle', 'Minimum Size Subarray Sum', 'Increasing Triplet Subsequence',
  'Valid Parentheses String', 'Letter Combinations', 'Valid Palindrome II',
  'Basic Calculator III', 'Word Search',
];

/** Human-readable input contract per record, derived from the curated signature. */
function inputFormats(title, sigs) {
  return sigs.javascript.params.map((p) => {
    const constraint = (curated(title).constraints || []).find((c) => c.toLowerCase().includes(String(p.name).toLowerCase()));
    return { paramName: p.name, type: p.type, constraints: constraint || 'see problem constraints' };
  });
}

function buildRecord(title) {
  const c = curated(title);
  const m = metaRow(title);
  const topics = dedupeTopics(m.topic, m.tags);
  const sigs = signatures(title);
  const starterCode = typedStarters(title, sigs);
  const built = buildTests(title);
  const ref = REFERENCES[title].javascript;
  const jsName = sigs.javascript.name;

  const record = {
    slug: slugify(title),
    title,
    provenance: {
      source: 'C+M',
      ref: `scripts/curatedProblems.js CURATED["${title}"] + scripts/seedCodingProblemsExpanded.js codingProblems["${title}"]`,
      note: 'description/constraints/examples/signature/sample+hidden from the reviewed curated spec; '
        + 'difficulty/topic/tags from the canonical seeder row (case-insensitive de-duplicated); '
        + 'fixtures extended beyond the curated pair only where two independent derivations agree; '
        + 'the two curated fixtures are reproduced verbatim and must match the curated expected output',
      deviations: title === 'Word Search'
        ? 'board typed string[]/String[]/vector<string>/List[str] (rows) + starter toGrid(): the Java/C++ drivers have no char[][] / vector<vector<char>> / string[][] parser and would not compile'
        : (title === 'Pascals Triangle'
          ? 'Java return type int[][] instead of List<List<Integer>>: only Arrays.deepToString preserves the nesting that outputsMatch compares'
          : 'none'),
    },
    description: c.desc,
    difficulty: m.difficulty,
    topic: topics.topic,
    tags: topics.tags,
    constraints: c.constraints,
    examples: c.examples,
    inputFormat: inputFormats(title, sigs),
    outputFormat: {
      type: sigs.javascript.returnType,
      description: outputDescription(title, sigs.javascript.returnType),
    },
    sampleTests: built.samples.map((t, i) => ({
      input: t.input,
      output: t.output,
      explanation: t.curated === 'sample' ? 'Sample test case 1 (curated)' : `Sample test case ${i + 1}`,
    })),
    hiddenTests: built.hidden.map((t, i) => ({
      input: t.input,
      output: t.output,
      category: t.curated === 'hidden' ? 'edge' : ['edge', 'stress', 'random', 'min'][i % 4],
    })),
    starterCode,
    functionSignature: sigs,
    referenceSolution: {
      // The in-process reference path looks up `solve`, while the sandbox driver
      // invokes the signature's own name; expose both so either path can run it.
      code: jsName === 'solve' ? ref : `${ref}\nconst solve = ${jsName};\n`,
      language: 'javascript',
    },
    timeLimitMs: m.difficulty === 'hard' ? 3000 : m.difficulty === 'medium' ? 2000 : 1500,
    memoryLimitKb: 256000,
  };
  return record;
}

/** One-line description of what the function returns (for outputFormat). */
function outputDescription(title, returnType) {
  const map = {
    'Pascals Triangle': 'The first numRows rows of the triangle as a list of rows.',
    'Minimum Size Subarray Sum': 'The minimal length of a subarray whose sum is at least target, or 0 if none exists.',
    'Increasing Triplet Subsequence': 'true if an increasing triplet exists, otherwise false.',
    'Valid Parentheses String': 'true if the brackets are balanced and correctly ordered, otherwise false.',
    'Letter Combinations': 'All letter combinations for the digits, in ascending order.',
    'Valid Palindrome II': 'true if at most one deletion makes the string a palindrome, otherwise false.',
    'Basic Calculator III': 'The integer value of the expression (division truncates toward zero).',
    'Word Search': 'true if the word exists in the grid, otherwise false.',
  };
  if (!map[title]) throw new Error(`authoredDsaBatch2: no output description for "${title}"`);
  if (!returnType) throw new Error(`authoredDsaBatch2: no return type for "${title}"`);
  return map[title];
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

const records = BATCH_TITLES.map((t) => {
  const r = buildRecord(t);
  const issues = auditReplica(r);
  if (issues.length) {
    throw new Error(`authoredDsaBatch2: "${t}" fails the structural contract: ${issues.join(' | ')}`);
  }
  return r;
});

// Batch 1 titles must not be touched by Batch 2.
const BATCH1_TITLES = require('./authoredDsaBatch1').BATCH_TITLES;
for (const t of BATCH1_TITLES) {
  if (BATCH_TITLES.includes(t)) throw new Error(`authoredDsaBatch2: "${t}" is a Batch 1 record and must not be re-authored`);
}
if (BATCH1_TITLES.length !== 16) throw new Error('authoredDsaBatch2: Batch 1 title set changed');

const slugs = new Set(records.map((r) => r.slug));
if (slugs.size !== records.length) throw new Error('authoredDsaBatch2: duplicate slug in payload');
for (const r of records) {
  if (r.slug !== slugify(r.title)) throw new Error(`authoredDsaBatch2: slug mismatch for "${r.title}"`);
}

module.exports = {
  BATCH_TITLES,
  records,
  REFERENCES,
  buildTests,
  auditReplica,
  slugify,
  decodeLiteralNewlines,
  _internals: { FIXTURES, SIG_OVERRIDES, GRID_PREAMBLE, signatures, metaRow, curated },
};

