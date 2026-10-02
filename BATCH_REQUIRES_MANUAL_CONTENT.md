# Batch 5 - Problems Requiring Manual Content

These problems were selected for batch 5 and confirmed inactive, but were **not**
activated. Each one has at least one standard, defensible reading that cannot be
reconciled with the stored record, and activating it would have meant either
guessing the contract or shipping expected outputs that are not determined by the
input.

Selected for batch 5: 30
Activated: 24
Held for manual review: 6

| # | problemId | Title | Decision |
|---|---|---|---|
| 1 | CP-0152-MEDIUM | Network Delay Time | activated |
| 2 | CP-0153-MEDIUM | Evaluate Division | activated |
| 3 | CP-0154-MEDIUM | Cheapest Flights Within K Stops | activated |
| 4 | CP-0155-MEDIUM | Minimum Height Trees | activated |
| 5 | CP-0156-MEDIUM | Friend Circles | MANUAL REVIEW |
| 6 | CP-0157-MEDIUM | Keys and Rooms | activated |
| 7 | CP-0158-MEDIUM | Is Graph Bipartite | activated |
| 8 | CP-0159-MEDIUM | Find Eventual Safe States | activated |
| 9 | CP-0160-MEDIUM | Possible Bipartition | MANUAL REVIEW |
| 10 | CP-0163-EASY | Sqrt(x) | activated |
| 11 | CP-0164-EASY | Valid Perfect Square | activated |
| 12 | CP-0165-EASY | Find Smallest Letter Greater Than Target | activated |
| 13 | CP-0166-EASY | Missing Number | activated |
| 14 | CP-0167-MEDIUM | Search a 2D Matrix | activated |
| 15 | CP-0168-MEDIUM | Search in Rotated Sorted Array | activated |
| 16 | CP-0169-MEDIUM | Search in Rotated Sorted Array II | MANUAL REVIEW |
| 17 | CP-0170-MEDIUM | Find First and Last Position | activated |
| 18 | CP-0173-MEDIUM | Search a 2D Matrix II | activated |
| 19 | CP-0174-MEDIUM | Koko Eating Bananas | activated |
| 20 | CP-0176-MEDIUM | Kth Largest Element in Array | activated |
| 21 | CP-0177-EASY | Kth Largest Element in Stream | activated |
| 22 | CP-0179-MEDIUM | Top K Frequent Words | activated |
| 23 | CP-0181-MEDIUM | Find K Pairs with Smallest Sums | MANUAL REVIEW |
| 24 | CP-0182-MEDIUM | Task Scheduler | activated |
| 25 | CP-0183-HARD | Rearrange String k Distance Apart | MANUAL REVIEW |
| 26 | CP-0184-HARD | Smallest Range From Lists | MANUAL REVIEW |
| 27 | CP-0185-HARD | IPO | activated |
| 28 | CP-0186-HARD | Find K-th Smallest Pair Distance | activated |
| 29 | CP-0187-HARD | Maximum Frequency Stack | activated |
| 30 | CP-0188-HARD | Trapping Rain Water II | activated |

---

## 1. Friend Circles

- **problemId:** CP-0156-MEDIUM
- **Topic / difficulty / tags:** Graph / medium / graph, union-find, depth-first-search
- **Sources checked:** Current CodingProblem record (title, topic, difficulty, tags, and the stock "(Spec not yet reviewed)" description); the legacy Problem collection and the DSA seeders (seedCodingProblemsExpanded and related) which record only title/topic/tags; scripts/curatedProblems; the SOLVERS table; authored batches 1-4; repository snapshots and state-probe exports; and the existing active catalogue, which was searched for an already-published contract covering the same task.
- **Exact ambiguity:** "Friend circles" names at least two standard contracts that return different values: the NUMBER of connected groups, or the SIZE of the largest group. The tags (union-find, depth-first-search) fit the first, but the title alone does not decide it. The catalogue also already carries "Number of Connected Components" as an ACTIVE problem with exactly the count-the-groups contract, so activating this record on that reading would publish a duplicate under a second name.
- **Competing variants:** `number of connected groups`  vs  `size of the largest group`  vs  `per-person number of circles`
- **Why activation is unsafe:** "Friend circles" names at least two standard contracts that return different values: the NUMBER of connected groups, or the SIZE of the largest group. The stored tags (union-find, depth-first-search) fit the first, but the title alone does not decide it, and the catalogue already publishes the count-the-groups contract as the ACTIVE problem "Number of Connected Components", so activating this record on that reading would duplicate an existing problem under a second name.
- **What is needed:** A decision on which value the record must return: the number of connected groups, or the size of the largest group. If it is the count, this record should be retired or merged into the already-active "Number of Connected Components" instead of activated.

## 2. Possible Bipartition

- **problemId:** CP-0160-MEDIUM
- **Topic / difficulty / tags:** Graph / medium / graph, union-find
- **Sources checked:** Current CodingProblem record (title, topic, difficulty, tags, and the stock "(Spec not yet reviewed)" description); the legacy Problem collection and the DSA seeders (seedCodingProblemsExpanded and related) which record only title/topic/tags; scripts/curatedProblems; the SOLVERS table; authored batches 1-4; repository snapshots and state-probe exports; and the existing active catalogue, which was searched for an already-published contract covering the same task.
- **Exact ambiguity:** The title matches two different standard problems: "is the graph 2-colourable", and the equal-size two-group split over a set of people and their same-language pairs. The record cannot say which; the two return different booleans on ordinary inputs, and this very batch already contains "Is Graph Bipartite" as a separate record, which makes the overlap concrete rather than theoretical.
- **Competing variants:** `2-colourable check (same as Is Graph Bipartite)`  vs  `split into two groups of EQUAL size`
- **Why activation is unsafe:** The two readings return different booleans on ordinary inputs, and the 2-colourable reading is already published in this same catalogue as "Is Graph Bipartite". Choosing silently would either duplicate an active problem under a second name or ship a record whose description does not match what the title leads a learner to expect.
- **What is needed:** A decision from the catalogue owner on which contract this record means: the plain 2-colourability check, or the equal-size two-group split. If the former, this record should probably be retired or merged into "Is Graph Bipartite" rather than activated.

## 3. Search in Rotated Sorted Array II

- **problemId:** CP-0169-MEDIUM
- **Topic / difficulty / tags:** Binary Search / medium / array, binary-search
- **Sources checked:** Current CodingProblem record (title, topic, difficulty, tags, and the stock "(Spec not yet reviewed)" description); the legacy Problem collection and the DSA seeders (seedCodingProblemsExpanded and related) which record only title/topic/tags; scripts/curatedProblems; the SOLVERS table; authored batches 1-4; repository snapshots and state-probe exports; and the existing active catalogue, which was searched for an already-published contract covering the same task.
- **Exact ambiguity:** The "II" marks the variant WITH duplicates, and that is exactly what destroys a unique answer: when the array contains the target more than once, several distinct indices are all correct, and exact-match judging would mark a correct solution wrong. Forcing the problem to distinct values would make it identical to the "Search in Rotated Sorted Array" record already selected in this batch, so there is no reconstruction that is both faithful and single-valued.
- **Competing variants:** `any index of a duplicated target (not unique)`  vs  `requires distinct values, which is the other record in this batch`
- **Why activation is unsafe:** The problem is only distinguishable from its non-"II" sibling by allowing duplicates, and duplicates are exactly what makes the correct index non-unique. Exact-match judging would reject correct solutions; removing duplicates would make the record a duplicate of "Search in Rotated Sorted Array", which this batch already activated.
- **What is needed:** Either a stated tie-break for duplicate targets (for example "return the leftmost index"), or confirmation that duplicate-free inputs are acceptable, or agreement to retire this record in favour of the distinct-value version already activated.

## 4. Find K Pairs with Smallest Sums

- **problemId:** CP-0181-MEDIUM
- **Topic / difficulty / tags:** Heap / medium / heap
- **Sources checked:** Current CodingProblem record (title, topic, difficulty, tags, and the stock "(Spec not yet reviewed)" description); the legacy Problem collection and the DSA seeders (seedCodingProblemsExpanded and related) which record only title/topic/tags; scripts/curatedProblems; the SOLVERS table; authored batches 1-4; repository snapshots and state-probe exports; and the existing active catalogue, which was searched for an already-published contract covering the same task.
- **Exact ambiguity:** The task is to return k pairs with the smallest sums, but WHICH k pairs is not determined when several pairs share a sum. Ordinary inputs hit ties constantly - two equal elements in each array already give two different pairs with the same sum - and the judge would accept only one of them. No canonical tie-break is stated by the title.
- **Competing variants:** `any k pairs attaining the k smallest sums (not unique)`  vs  `sorted by sum then by first element (would have to be invented)`
- **Why activation is unsafe:** Several distinct pairs routinely share the same sum, so more than one pair list is correct. Storing a single expected output would reject correct answers. Any tie-break strong enough to make the answer unique would have to be invented, and nothing in the repository states one.
- **What is needed:** A stated ordering rule for equal sums (for example "sort by sum, then by first element, then by second element"), or a decision to judge this problem with a validator that accepts any set of k pairs attaining the k smallest sums.

## 5. Rearrange String k Distance Apart

- **problemId:** CP-0183-HARD
- **Topic / difficulty / tags:** Heap / hard / hash-table, heap
- **Sources checked:** Current CodingProblem record (title, topic, difficulty, tags, and the stock "(Spec not yet reviewed)" description); the legacy Problem collection and the DSA seeders (seedCodingProblemsExpanded and related) which record only title/topic/tags; scripts/curatedProblems; the SOLVERS table; authored batches 1-4; repository snapshots and state-probe exports; and the existing active catalogue, which was searched for an already-published contract covering the same task.
- **Exact ambiguity:** The canonical problem asks for ANY valid rearrangement, and its own statement says so. Several rearrangements are correct for essentially every input, so a single expected-output string would mark correct solutions wrong; this needs a validator rather than exact matching.
- **Competing variants:** `any valid rearrangement`  vs  `lexicographically smallest rearrangement`
- **Why activation is unsafe:** The canonical contract explicitly accepts any valid rearrangement. A single stored expected string would mark correct solutions wrong. Making the answer unique requires either inventing a canonical form or switching this problem to a validator-based comparison, which is a change to the judging contract rather than to the content.
- **What is needed:** A canonical form (for example "the lexicographically smallest valid rearrangement"), or a decision to judge with a validator that accepts any arrangement satisfying the distance constraint.

## 6. Smallest Range From Lists

- **problemId:** CP-0184-HARD
- **Topic / difficulty / tags:** Heap / hard / heap, greedy
- **Sources checked:** Current CodingProblem record (title, topic, difficulty, tags, and the stock "(Spec not yet reviewed)" description); the legacy Problem collection and the DSA seeders (seedCodingProblemsExpanded and related) which record only title/topic/tags; scripts/curatedProblems; the SOLVERS table; authored batches 1-4; repository snapshots and state-probe exports; and the existing active catalogue, which was searched for an already-published contract covering the same task.
- **Exact ambiguity:** The smallest range covering at least k of the lists. When two or more ranges share the minimum width they are all correct answers and the canonical problem returns any of them, so the pair to expect is not determined by the input.
- **Competing variants:** `any minimum-width range (not unique)`  vs  `smallest starting value among minimum-width ranges (would have to be invented)`
- **Why activation is unsafe:** Several ranges can share the minimum width, and the canonical problem returns any of them. Without a stated tie-break the expected [start, end] pair is not determined by the input, so expected outputs could not be generated honestly.
- **What is needed:** A tie-break for equal-width ranges (for example "among minimum-width ranges return the one with the smallest start"), or a validator-based judging decision.

---

No other problem in the selected 30 was held back. The remaining
24 were reconstructed from repository evidence, verified
against independent oracles, and activated.
