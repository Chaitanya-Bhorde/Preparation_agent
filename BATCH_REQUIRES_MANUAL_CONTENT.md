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

## Batch 2 (3 problems)

### 8. `Triangle` — CP-0068-MEDIUM — topic: Dynamic Programming
- **Ambiguity:** minimum total triangle sum that can be killed (top-down), count of triangles formed from points, largest perimeter triangle from an array, or a grid path traversal length.
- **Missing:** four unrelated algorithms share this title. They take different inputs (grid vs array vs point set) and return different types (`number` vs `number[][]`).
- **Needed:** which quantity to compute.

### 9. `Distinct Subsequences` — CP-0078-HARD — topic: Dynamic Programming
- **Ambiguity:** count of distinct subsequences of one string, count of those equal to a target, the list of distinct subsequences, or the count of subsequences of `s1` absent from `s2`.
- **Missing:** the title spans four different DP problems with different inputs and return types.
- **Needed:** the input pair and which quantity is returned.

### 10. `Scramble String` — CP-0079-HARD — topic: Dynamic Programming
- **Ambiguity:** the boolean "is `s2` a scramble of `s1`", the number of distinct scrambles, or an anagram check.
- **Why inactive despite an unambiguous-looking title:** the boolean form is conventional, but its recursive reference is genuinely subtle. A standard prefix/suffix split DP was cross-checked against an independent insertion-based oracle over 4,000 random anagram pairs and **disagreed on 16 of them** — it reports `false` for real scrambles. Rather than ship a reference that silently contradicts the definition on inputs a learner can construct, this stays inactive until a reference cross-checked against an independent oracle is supplied.
- **Needed:** confirm the boolean contract **and** provide/approve a reference that matches it on all anagram pairs.

---

## Batch 3 (3 problems)

### 11. `Design Twitter` — CP-0100-MEDIUM — topic: Hash Map / Linked List
- **Ambiguity:** two materially different problems share this title.
  - **System-design reading:** asks for an architecture — timeline fan-out on write versus read, sharding, storage choice, cache layers. This has **no canonical input or output at all**; it cannot be expressed as a judgeable function.
  - **Algorithmic reading:** a fixed API (`follow`, `unfollow`, `postTweet`, `getNewsFeed`, `getTweets`) with a specific return shape.
- **Missing:** the record stores only a placeholder description. Nothing indicates which reading is intended, and the two are not interchangeable — one has no I/O contract at all, the other has a very specific one.
- **Sources checked:** the `CodingProblem` record (placeholder only), legacy `Problem` records (no match), `scripts/curatedProblems`, `scripts/testCaseGenerators` `SOLVERS`, and authored batch scripts 1–5. The only repository hit was a one-line hashing seed stub (`add({problemId:'HMAP-004',title:'LRU Cache',...})`) that contains no contract.
- **Needed:** confirm which reading is intended. If algorithmic, state the exact method signatures and return types; if system-design, this problem does not belong in a judged DSA catalogue.

### 12. `Remove All Adjacent Duplicates` — CP-0114-EASY — topic: Stack
- **Ambiguity:** at least two standard problems share this title and return **different answers for the same input**.
  - **Fully-reducing form:** repeatedly remove adjacent equal pairs until none remain. `"abbaca"` → `"ca"`.
  - **k-parameter form:** remove runs of exactly `k` adjacent duplicates. Needs an extra integer input; `"abbaca"` with `k=2` → `""`.
  - **Single-pass form:** remove each run once. `"abbaca"` → `"aca"`.
- **Missing:** the record supplies only a placeholder description, so nothing selects a reading. These variants are different problems with different signatures and different expected outputs.
- **Sources checked:** same as entry 11 — record, legacy `Problem`, curated set, `SOLVERS` map, authored batch scripts. No canonical spec found.
- **Needed:** specify which variant, and for the `k` form, the value range for `k`.

### 13. `Convert Sorted Array to BST` — CP-0125-EASY — topic: Tree / BST
- **Ambiguity:** the answer is **not uniquely determined**. Every height-balanced BST built from the same sorted array is a correct answer, and there are exponentially many of them (choosing the lower vs upper midpoint at each of the `n` nodes already yields different valid trees).
- **Why this is unsafe to activate:** this platform judges by exact output match. A learner who picks the other midpoint submits a genuinely correct solution and is marked Wrong Answer. LeetCode accepts any balanced BST; an exact-match judge cannot do that without a tie-break rule the title does not state.
- **Missing:** any statement of a deterministic construction rule (e.g. "always choose the lower midpoint"), plus a decision on the output representation.
- **Sources checked:** same as entry 11. Note the catalogue already has an established tree convention (level-order array with `null` for missing children) that would make the representation unambiguous — the ambiguity is the *answer*, not the format.
- **Needed:** a deterministic construction rule, so that exactly one output is correct.

---

## Batch 4 (4 problems)

All four store only a placeholder description (`solve(input)` returning a string, 0 samples, 0 hidden tests). Sources inspected for each: the `CodingProblem` record, legacy `Problem` records for the same title, `scripts/curatedProblems`, the `SOLVERS` map in `scripts/testCaseGenerators.js`, and authored batch scripts 1-3. None contained a contract.

### 14. `Convert Sorted List to BST` — CP-0132-MEDIUM — topic: Tree / Linked List
- **Ambiguity:** the answer is **not uniquely determined**. Every height-balanced BST over the same sorted list is a correct answer, and there are exponentially many (choosing the lower versus upper midpoint at each node already yields different valid trees). The list form carries no extra information that pins one of them down — this is the same defect already recorded for `Convert Sorted Array to BST` in entry 13.
- **Why activation was unsafe:** this platform judges by exact output match, so a learner who picks the other midpoint submits a genuinely correct solution and is marked Wrong Answer.
- **Needed:** a deterministic construction rule (for example "always choose the lower midpoint"), so exactly one output is correct.

### 15. `Clone Graph` — CP-0142-MEDIUM — topic: Graph
- **Ambiguity:** the return value is a **node object graph**, not a value. Object identity, neighbour ordering and pointer identity are all unconstrained by the title, so there is no canonical text form for the result.
- **Why activation was unsafe:** any expected-output string would have to fix an arbitrary serialisation (and an arbitrary neighbour order) that the problem never specifies. Two equally correct clones could produce different strings and one would be judged wrong. Returning an adjacency list instead would be a *different* contract, not a clarification.
- **Needed:** a stated output representation — for example "return the clone's adjacency list with each node's neighbours sorted ascending" — if that is the intended judging contract.

### 16. `Redundant Connection` — CP-0150-MEDIUM — topic: Graph
- **Ambiguity:** the answer is a **connection**, and the canonical problem permits returning **any** redundant edge. A graph can have several, and the title does not pick one.
- **Why activation was unsafe:** exact-match judging needs one specific edge. Choosing "the first found scanning in input order" would be inventing a tie-break the title does not state — the same non-uniqueness class recorded for the BST problems above.
- **Needed:** either a stated tie-break rule, or a change to the contract so the answer is unique (for example "return the number of redundant connections").

### 17. `Accounts Merge` — CP-0151-MEDIUM — topic: Graph
- **Ambiguity:** the return value is a graph of **merged user accounts** (user -> set of email addresses). Like `Clone Graph` this is an object graph, and email sets additionally have no specified ordering.
- **Why activation was unsafe:** no canonical text form exists. Whether the emails come back as a set, a list, or a joined string — and in what order — are all unspecified, so no single expected-output string can be both correct and unique.
- **Needed:** a stated output representation and ordering rule, for example "return, per user, their merged emails sorted ascending as a comma-separated string".

---

## How to clear an entry

1. Add one clarifying line to the problem above.
2. Add a matching entry to `server/scripts/dsaBatch1Content.js` / `dsaBatch2Content.js` / `dsaBatch3Content.js` / `dsaBatch4Content.js`-style content: `signature`, `description`, `input`, `output`, `constraints`, `cases`, and a `reference`.
3. Add a deliberately wrong solution for that problem to the matching `dsaBatchNWrong.js`.
4. Re-run the batch builder. It derives every expected output by executing the reference, verifies the parsed arguments equal the authored arguments, checks each authored `expect` value against the reference, and proves the reference is Accepted while the wrong solution is rejected **on both the visible and the hidden cases** — so content, fixtures and judge cannot drift apart.

## Progress

| Batch | Attempted | Activated | Manual review |
| --- | --- | --- | --- |
| 1 | 20 | 13 | 7 |
| 2 | 20 | 17 | 3 |
| 3 | 20 | 17 | 3 |
| 4 | 20 | 16 | 4 |

**Remaining inactive after batch 4: 122**