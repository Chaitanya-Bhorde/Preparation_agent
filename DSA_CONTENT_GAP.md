# DSA Content Gap Report

Generated 2026-09-30 during the final stabilization pass. Per-problem detail is in
[`DSA_CONTENT_GAP.csv`](./DSA_CONTENT_GAP.csv) (226 rows, one per incomplete problem).

## Summary

| Metric | Count |
| --- | --- |
| Total DSA problems | 266 |
| **Complete** (description, input format, output format, constraints, samples, hidden tests, reference solution) | **40** |
| Incomplete | 226 |
| Empty descriptions | 0 |
| Placeholder descriptions (`"Solve the X problem. (Spec not yet reviewed)"`) | 184 |
| Missing sample input/output | 185 |
| Missing hidden test cases | 185 |
| Missing reference solution | 226 |
| **Safely repairable from existing repository content** | **0** |

## What the 226 incomplete problems look like

| Missing fields | Count |
| --- | --- |
| Sample Input/Output + Hidden Test Cases + Reference Solution + Problem Description | 185 |
| Reference Solution only | 40 |
| Reference Solution + Constraints | 1 |

## Why nothing could be repaired

The instruction was to use only content that already exists in the repository, and to
report rather than invent anything. Every candidate source was checked:

1. **`scripts/curatedProblems.js`** — 51 entries, each with description, constraints,
   examples, sample, hidden cases and a typed signature. **All 51 are already applied**
   to the live collection; there is nothing left to project from it.
2. **`scripts/testCaseGenerators.js` (`SOLVERS`)** — 51 reference implementations.
   **All 51 belong to problems that already have samples and hidden cases.** None of
   the 185 uncovered problems appears here.
3. **`scripts/authoredDsaBatch1..5.js`** — 40 authored records. **All 40 are already
   applied.**
4. **Recovery artifacts** — `_current_codingproblems_snapshot.json` (447 KB, 266 docs),
   `_b3_seedDSA100.js.backup` (150 KB), `_incident_live_catalog.json`,
   `_incident_old_map.json`, `_recovery_inventory.json` and the four `*_inventory.jsonl`
   batch files were each parsed. The snapshot confirms 185 problems with
   `sampleTests = 0` and `hiddenTests = 0`; no artifact supplies a single missing case.
5. **Direct text search** — all 671 `.js`/`.json`/`.jsonl`/`.txt`/`.md` files under the
   repository were scanned for a concrete `input:` literal adjacent to any of the 185
   titles. **Zero matches.**

### The 40 "reference solution only" problems — deliberately not projected

`SOLVERS[t].solve` has the signature `solve(input)` where `input` is the whole stdin
string. `CodingProblem.referenceSolution.code` is invoked differently:

```js
// server/utils/genericValidator.js
const fn = createSolveFunction(problem.referenceSolution.code);
const args = parseTestCaseInput(problem, input).args;
const value = fn.apply(null, args);          // positional arguments
```

Copying a `SOLVERS` entry across would call `input.split('\n')` on an array and throw
the first time a case had to be derived. It is a different contract, not a normalization.
These 40 problems already store their own expected outputs for every sample and hidden
case, so the reference solution is an unused fallback and nothing is functionally
missing.

### The 184 placeholder descriptions

These are the seeder's own template text, written by `seedCodingProblemsExpanded.js` for
any problem without an authored spec. They are not corruptions and not recoverable
from anywhere else in the repository. Lengthening them would mean inventing problem
statements, so they are reported rather than rewritten.

## What was deliberately NOT done

- No problem statement, example, constraint, hidden test or expected output was invented.
- No placeholder was replaced with a plausible-looking fabrication.
- Problems that already carry a full spec were not modified at all.
