# PrepAgent — Phase 1 & Phase 2 Report (Bugs 1–3)

> Audits executed against the **live production MongoDB** (`prepagent` / `CodingProblem` collection, 265 docs).
> Date: 2026-08-07

## Schema reality (critical)
The three bugs in the ticket were described with fields (`inputFormat`, `problemBoilerplate`,
`outputDescription`) that **do not exist** in this codebase. The real schema uses:
- Input types → `functionSignature.<lang>.params[].type` / `.returnType`
- Starter code → `starterCode.<lang>` + on-the-fly generation in `server/utils/codeGenerator.js`
- Narrative → `description` + `examples`

The bugs are real, but they originate from **placeholder seed data**
(`server/scripts/seedCodingProblemsExpanded.js`), which seeded all 265 problems with a generic
`solve(input=string)->string` signature and templated prose.

---

## BUG 1 — Input type mismatch  (REAL, HIGH)
- **Sample:** 20/265 random problems via `$sample`.
- **Result:** 20/20 = **100% mismatch** — every sampled problem exposed a generic
  `solve(string)->String` signature regardless of the real input.
  (e.g. *Median of Two Sorted Arrays* claims two arrays of ints but shipped `solve(String)->String`.)
- **Deliverable CSV:** `phase1_inputtype_audit.csv` (repo root).
- **Root cause:** `seedCodingProblemsExpanded.js` shell generator.

## BUG 2 — Lazy / templated descriptions  (REAL, HIGH)
- **Sample:** 20/265; **18/20 HIGH** + 2 LOW were templated technique-buzzword prose
  (`"Use a hash map ... Problem: <Title>."`) with no real input/output contract.
- **Root cause:** same seed-script shell generator.

## BUG 3 — Language selector  (ALREADY FIXED ✅)
- Component is `client/src/pages/CodingProblemDetail.jsx` (there is no `ProblemDisplay.jsx`).
- State `language` is updated, `onChange` is wired (lines 279–287), and the editor resets per
  selected language (line 411). Fixed in commits `ca42325` and `4a342fe`.
- **No state/API/render bug found.**

---

## PHASE 2 — Fixes applied (Option B: 50 priority + flag the rest)

### Bug 1 + Bug 2 fix
Created `server/scripts/curatedProblems.js` — **51** production-quality specs with accurate
per-language typed `functionSignature`, specific descriptions with I/O contracts, constraints,
examples, and real sample+hidden test cases.

Applied to the live DB via `server/scripts/applyCuratedFixes.js`.

**Verification (`server/scripts/verifyCuratedFixes.js`):**
- Found 51/51 curated problems.
- **Bug 1:** typed signatures — 51/51 correctly typed (the single heuristic-flagged item,
  `longestPalindrome(string)->string`, is a legitimate string→string function, not the `solve` shell).
- **Bug 2:** specific descriptions — **51/51**, 0 generic.

Proof (before → after JS signature):
```
Two Sum                    BEFORE twoSum(number[],number)->number[]  (already typed)
Median of Two Sorted Arrays BEFORE solve(string)->string  →  findMedianSortedArrays(number[],number[])->number
Increasing Triplet Subseq  BEFORE solve(string)->string  →  increasingTriplet(number[])->boolean
Basic Calculator III       BEFORE solve(string)->string  →  calculate(string)->number
Edit Distance              BEFORE solve(string)->string  →  minDistance(string,string)->number
(31 signatures changed in total; the rest were already typed and still received description/starter updates)
```

### Phase 2C — spec-validation guard
`seedCodingProblemsExpanded.js` now requires a reviewed spec: any title without a curated entry is
flagged at seed time (`[SPEC-VALIDATION]`) and keeps a clearly-marked placeholder
`"(Spec not yet reviewed)"` description instead of silently passing as real content. ~214 problems
remain flagged for a follow-up sprint.

---

## Remaining (flagged, not fixed in this pass)
The following sampled problems are **not** yet in the curated set and still carry generic prose in
the DB — recommended for Phase 2B sprint planning:
`Logger Rate Limiter, Nth Digit, Top K Frequent Elements, Maximum Frequency Stack, Symmetric Tree,
Wiggle Sort II, Binary Tree Maximum Path Sum, Binary Tree Zigzag Level Order, Find Duplicate
Subtrees, Count Primes, Remove All Adjacent Duplicates, Palindrome Number, Gas Station Greedy,
Validate Binary Search Tree, Minimum Window Substring(examples only), word ladder variants, ...`

## Production readiness
- Bug 3 was already fixed pre-existing.
- Bugs 1 & 2 fixed for **51 priority DSA problems** (typed signatures + specific descriptions +
  typed starters + sample/hidden test cases) in the live DB.
- ~214 remaining problems flagged with spec-validation guard; schedule a follow-up to curate them.
