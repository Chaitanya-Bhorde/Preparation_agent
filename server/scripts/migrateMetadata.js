/* migrateMetadata.js (Phase 4.1.3)
 * ---------------------------------------------------------------------------
 * Backfills metadata for existing CodingProblem documents so the metadata-driven
 * validator (and the new admin endpoints) work for every problem:
 *   - inputFormat        <- functionSignature.javascript.params  (if missing)
 *   - outputFormat       <- functionSignature.javascript.returnType (if missing)
 *   - referenceSolution  <- canonical reference solver (if missing)
 *
 * Idempotent & non-destructive: it only sets fields that are absent.
 * Run: node server/scripts/migrateMetadata.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');

// Canonical reference solvers (JS `function solve(...)` expressions taking the
// problem's positional args), keyed by DB title. Consumed by
// genericValidator.computeExpectedFromReference when a stored expected output
// is absent.
const REFERENCE = {
  'Binary Search': `function solve(nums, target) { let lo = 0, hi = nums.length - 1; while (lo <= hi) { const mid = (lo + hi) >>> 1; if (nums[mid] === target) return mid; if (nums[mid] < target) lo = mid + 1; else hi = mid - 1; } return -1; }`,
  'Word Search': `function solve(board, word) { const m = board.length, n = board[0].length; const dirs = [[0,1],[0,-1],[1,0],[-1,0]]; const dfs = (r, c, k) => { if (board[r][c] !== word[k]) return false; if (k === word.length - 1) return true; const tmp = board[r][c]; board[r][c] = 0; for (const [dr, dc] of dirs) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < m && nc >= 0 && nc < n && board[nr][nc] !== 0 && dfs(nr, nc, k + 1)) return true; } board[r][c] = tmp; return false; }; for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (dfs(i, j, 0)) return true; return false; }`,
  'Number of Islands': `function solve(grid) { if (!grid.length) return 0; const m = grid.length, n = grid[0].length; const isLand = (r, c) => grid[r][c] === '1' || grid[r][c] === 1; const sink = (r, c) => { if (r < 0 || r >= m || c < 0 || c >= n || !isLand(r, c)) return; grid[r][c] = 0; sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1); }; let count = 0; for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (isLand(i, j)) { count++; sink(i, j); } return count; }`,
  'Course Schedule': `function solve(numCourses, prerequisites) { const indeg = new Array(numCourses).fill(0); const adj = Array.from({ length: numCourses }, () => []); for (const [a, b] of prerequisites) { adj[b].push(a); indeg[a]++; } const queue = []; for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i); let visited = 0; while (queue.length) { const node = queue.shift(); visited++; for (const next of adj[node]) { indeg[next]--; if (indeg[next] === 0) queue.push(next); } } return visited === numCourses; }`,
  'Valid Palindrome II': `function solve(s) { const isPal = (lo, hi) => { while (lo < hi) { if (s[lo] !== s[hi]) return false; lo++; hi--; } return true; }; let lo = 0, hi = s.length - 1; while (lo < hi) { if (s[lo] !== s[hi]) return isPal(lo + 1, hi) || isPal(lo, hi - 1); lo++; hi--; } return true; }`,
  'Letter Combinations': `function solve(digits) { if (!digits || digits.length === 0) return []; const map = ['', '', 'abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz']; const out = []; const bt = (i, cur) => { if (i === digits.length) { out.push(cur); return; } for (const ch of map[digits.charCodeAt(i) - 48]) bt(i + 1, cur + ch); }; bt(0, ''); return out; }`,
'Letter Combinations of a Phone Number': `function solve(digits) { if (!digits || digits.length === 0) return []; const map = ['', '', 'abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz']; const out = []; const bt = (i, cur) => { if (i === digits.length) { out.push(cur); return; } for (const ch of map[digits.charCodeAt(i) - 48]) bt(i + 1, cur + ch); }; bt(0, ''); return out; }`,
  'Basic Calculator III': `function solve(s) { let i = 0; const n = s.length; const skip = () => { while (i < n && s[i] === ' ') i++; }; const num = () => { let x = 0; while (i < n && s[i] >= '0' && s[i] <= '9') { x = x * 10 + (s.charCodeAt(i) - 48); i++; } return x; }; const factor = () => { skip(); if (s[i] === '(') { i++; const r = expr(); skip(); if (s[i] === ')') i++; return r; } if (s[i] === '+' || s[i] === '-') { const op = s[i]; i++; const v = factor(); return op === '-' ? -v : v; } return num(); }; const term = () => { let r = factor(); skip(); while (i < n && (s[i] === '*' || s[i] === '/')) { const op = s[i]; i++; const v = factor(); r = op === '*' ? r * v : Math.trunc(r / v); skip(); } return r; }; const expr = () => { let r = term(); skip(); while (i < n && (s[i] === '+' || s[i] === '-')) { const op = s[i]; i++; const v = term(); r = op === '+' ? r + v : r - v; skip(); } return r; }; return expr(); }`,
  'Minimum Size Subarray Sum': `function solve(target, nums) { let left = 0, sum = 0, minLen = Infinity; const n = nums.length; for (let right = 0; right < n; right++) { sum += nums[right]; while (sum >= target) { minLen = Math.min(minLen, right - left + 1); sum -= nums[left]; left++; } } return minLen === Infinity ? 0 : minLen; }`,
  'Increasing Triplet Subsequence': `function solve(nums) { let first = Infinity, second = Infinity; for (const x of nums) { if (x <= first) first = x; else if (x <= second) second = x; else return true; } return false; }`,
  'Valid Parentheses String': `function solve(s) { let low = 0, high = 0; for (const ch of s) { if (ch === '(') { low++; high++; } else if (ch === ')') { low = Math.max(low - 1, 0); high--; } else { low = Math.max(low - 1, 0); high++; } if (high < 0) return false; } return low === 0; }`,
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('connected to Atlas');

  const docs = await CodingProblem.find({}).lean().exec();
  let total = 0, inputDerived = 0, outputDerived = 0, refPopulated = 0;

  for (const p of docs) {
    const sig = p.functionSignature && p.functionSignature.javascript;
    const update = {};

    if (!Array.isArray(p.inputFormat) || p.inputFormat.length === 0) {
      if (sig && Array.isArray(sig.params)) {
        update.inputFormat = sig.params.map((pr) => ({ paramName: pr.name, type: pr.type, constraints: '' }));
        inputDerived++;
      }
    }

    if (!p.outputFormat || !p.outputFormat.type) {
      if (sig && sig.returnType) {
        update.outputFormat = { type: sig.returnType, description: 'Expected output of the function' };
        outputDerived++;
      }
    }

    if ((!p.referenceSolution || !p.referenceSolution.code) && REFERENCE[p.title]) {
      update.referenceSolution = { code: REFERENCE[p.title], language: 'js' };
      refPopulated++;
    }

    if (Object.keys(update).length > 0) {
      await CodingProblem.updateOne({ _id: p._id }, { $set: update });
      total++;
    }
  }

  console.log('\n=== MIGRATION REPORT ===');
  console.log('Total documents scanned     :', docs.length);
  console.log('Documents updated          :', total);
  console.log('InputFormat derived        :', inputDerived);
  console.log('OutputFormat derived       :', outputDerived);
  console.log('ReferenceSolution populated:', refPopulated);

  await mongoose.disconnect();
  process.exit(0);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });