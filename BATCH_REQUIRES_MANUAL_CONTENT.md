# DSA — Problems Requiring Manual Content

These problems are **deliberately left inactive** (`isActive: false`). Their records and
any historical submissions are preserved; only the user-facing listing is withheld.

Reason: the intended problem cannot be established from the repository. Each title below
admits several materially different contracts, and the stored record contains nothing that
resolves which one was intended — the description is the seeder's template
(`"Solve the X problem. (Spec not yet reviewed)"`), there are **zero** sample cases,
**zero** hidden cases, no reference solution, and the generic `solve(input: string) -> string`
shell. Every in-repo source was checked: `curatedProblems.js` (51), `SOLVERS` in
`testCaseGenerators.js` (51), `authoredDsaBatch1–5`, the legacy `problems` collection, and
the recovery snapshots (`_current_codingproblems_snapshot.json`, `_incident_live_catalog.json`,
`_live_catalog.json`, `_recovery_inventory.json`, `_full_audit_report.json`) — every one of
which contains only the same template text, never a statement, fixture or expected output.

Activating any of these would mean inventing the problem, which would produce a question whose
statement, tests and judge disagree. Supplying one clarifying sentence per problem below is
enough to author it correctly.

---

## Batch 1 (7 problems)

### 1. `4Sum` — CP-0018-MEDIUM — topic: Arrays
- **Ambiguity:** return a sorted list of quadruplets, or the *count* of quadruplets summing to 0, or the four-element sum closest to a target, or the smallest-first-element quadruple.
- **Missing:** the output type is entirely unspecified, and the four readings have incompatible return types (`number[][]` vs `number`).
- **Needed:** one line stating which quantity to return.

### 2. `Sort an Array` — CP-0024-MEDIUM — topic: Arrays
- **Ambiguity:** ascending or descending; sort a scalar array or objects by a key; sort by value or by frequency.
- **Missing:** no ordering, key, or comparator is recorded anywhere.
- **Needed:** the sort ordering and the element shape.

### 3. `Word Ladder II` — CP-0050-HARD — topic: Strings
- **Ambiguity:** return *all* shortest transformation sequences, or their *count*, or only the lexicographically smallest one, or sequences of any length.
- **Missing:** output shape. Note the suffix "II" conventionally denotes the all-sequences variant, but the record shares its title with the count-returning sibling, so this is not evidenced rather than confirmed.
- **Needed:** confirm the all-sequences variant (or specify the output).

### 4. `Reverse Words in String` — CP-0053-MEDIUM — topic: Strings
- **Ambiguity:** trim and collapse internal whitespace, reverse characters within words only, or preserve the original spacing exactly.
- **Missing:** the spacing/trimming rule, which is the entire substance of this problem — the three readings differ on nearly every input.
- **Needed:** the exact whitespace rule.

### 5. `Coin Change II` — CP-0061-MEDIUM — topic: Dynamic Programming
- **Ambiguity:** the *number of combinations* that make an amount (unlimited coins), the *minimum number of coins*, or the number of ordered sequences.
- **Missing:** which quantity is counted. The combinations and min-coins problems are distinct algorithms with different return types.
- **Needed:** whether the answer is a count or a minimum.

### 6. `Minimum Path Sum` — CP-0065-MEDIUM — topic: Dynamic Programming
- **Ambiguity:** minimum top-left to bottom-right grid sum, minimum *falling* path, or minimum sum with arbitrary start and end.
- **Missing:** which path family and which endpoints. These differ even on the same grid.
- **Needed:** the movement rule and the fixed endpoints.

### 7. `Target Sum` — CP-0066-MEDIUM — topic: Dynamic Programming
- **Ambiguity:** assign `+`/`-` to every element to reach a target, ordinary subset sum against a target, or assign `+1`/`-1` to reach a difference.
- **Missing:** only the title exists. The operator set, whether every element must be used, and the sign convention are all unstated.
- **Needed:** the assignment rule (e.g. "every element gets `+` or `-`; return the number of assignments reaching `target`").

---

## How to clear an entry

1. Add one clarifying line to the problem above.
2. Add a matching entry to `server/scripts/dsaBatch1Content.js`-style content: `signature`,
   `description`, `input`, `output`, `constraints`, `cases`, and a `reference`.
3. Re-run the batch builder. It derives every expected output by executing the reference, then
   proves the reference is Accepted and a wrong solution is rejected, so content, fixtures and
   judge cannot drift apart.

## Progress

| Batch | Attempted | Activated | Manual review |
| --- | --- | --- | --- |
| 1 | 20 | 13 | 7 |

**Remaining inactive after batch 1: 172**