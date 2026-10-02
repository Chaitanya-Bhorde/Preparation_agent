/**
 * dsaBatch5Contracts.js
 * ---------------------------------------------------------------------------
 * Per-problem judgement on whether the contract can be established from the
 * title plus the repository's own metadata, for the 30 records batch 5
 * selected.
 *
 * A title is enough ONLY when it names one universally defined algorithm, so
 * both the task and the output shape follow from convention. Where a title
 * admits materially different contracts - different input, different return
 * type, or an answer that is not uniquely determined - the intended problem
 * cannot be derived from the record and it must go to manual review.
 *
 * Source recovery (performed before this file was written): the live
 * CodingProblem records are all generic shells ("Solve the X problem. (Spec not
 * yet reviewed)", signature solve(input:string)->string, zero fixtures), the
 * legacy Problem collection has no DSA record for any of the 30, neither
 * scripts/curatedProblems nor scripts/testCaseGenerators.js SOLVERS mentions
 * them, and neither the authored batches nor the historical seedDSA100 blobs
 * recovered from git carry a contract. The only surviving evidence is the
 * title/topic/tags/difficulty skeleton in scripts/seedCodingProblemsExpanded.js,
 * which fixes the ALGORITHM family but not the input encoding, so each contract
 * below is anchored on the title AND on that tag evidence.
 *
 * Six titles go to manual review: two admit several standard contracts
 * ("Friend Circles", "Possible Bipartition") and four have no unique answer
 * under exact-match judging.
 * ---------------------------------------------------------------------------
 */

const CONTRACTS = {};
const C = CONTRACTS;

// ---------------------------------------------------------------------- Graph

C['Network Delay Time'] = {
  unambiguous: true,
  note: 'The task is one thing only: the shortest travel time from a source node '
    + 'to a target node in a directed graph whose edge weights are non-negative, '
    + 'or -1 when the target cannot be reached. The tags (depth-first-search, '
    + 'breadth-first-search) and the Graph topic agree, and the answer is a single '
    + 'integer, so no variant changes the result. The catalogue already represents '
    + 'graphs as edge lists, so edges are supplied as [from, to, weight] triples.',
};

C['Evaluate Division'] = {
  unambiguous: true,
  note: 'A ratio graph: equations declare variable pairs that divide to a known '
    + 'value, queries ask for x raised to y. The answer is -1 exactly when no chain '
    + 'of equations determines the value, which is the standard and only '
    + 'convention. Equations and queries are given as string tiers because the '
    + 'variables are names, not numbers.',
};

C['Cheapest Flights Within K Stops'] = {
  unambiguous: true,
  note: 'Cheapest cost from src to dst using at most k intermediate stops, i.e. at '
    + 'most k+1 edges, or -1 when no such route exists. The stop budget is stated '
    + 'explicitly so the off-by-one is unambiguous, and the answer is one integer.',
};

C['Minimum Height Trees'] = {
  unambiguous: true,
  note: 'The nodes whose eccentricity (largest shortest-path distance to any node) '
    + 'is minimal. The set is unique, so returning it sorted ascending gives '
    + 'exactly one answer.',
};

C['Friend Circles'] = {
  unambiguous: false,
  note: '"Friend circles" names at least two standard contracts that return '
    + 'different values: the NUMBER of connected groups, or the SIZE of the largest '
    + 'group. The tags (union-find, depth-first-search) fit the first, but the title '
    + 'alone does not decide it. The catalogue also already carries "Number of '
    + 'Connected Components" as an ACTIVE problem with exactly the count-the-groups '
    + 'contract, so activating this record on that reading would publish a duplicate '
    + 'under a second name.',
  variants: ['number of connected groups', 'size of the largest group',
    'per-person number of circles'],
};

C['Keys and Rooms'] = {
  unambiguous: true,
  note: 'Reachability: starting in room 0 and moving only to rooms whose key is '
    + 'already held, decide whether room n-1 can be entered. One boolean, one '
    + 'standard definition of what keys[i] holds.',
};

C['Is Graph Bipartite'] = {
  unambiguous: true,
  note: 'Whether the graph admits a 2-colouring in which no edge joins two '
    + 'like-coloured vertices. That single definition covers every variant; '
    + 'self-loops and odd cycles simply make the answer false. One boolean.',
};

C['Find Eventual Safe States'] = {
  unambiguous: true,
  note: 'The nodes from which EVERY path eventually reaches a node with no outgoing '
    + 'edges - a node on, or able to reach, a cycle is unsafe. The safe set is '
    + 'unique, so sorted ascending is one canonical answer.',
};

C['Possible Bipartition'] = {
  unambiguous: false,
  note: 'The title matches two different standard problems: "is the graph '
    + '2-colourable", and the equal-size two-group split over a set of people and '
    + 'their same-language pairs. The record cannot say which; the two return '
    + 'different booleans on ordinary inputs, and this very batch already contains '
    + '"Is Graph Bipartite" as a separate record, which makes the overlap concrete '
    + 'rather than theoretical.',
  variants: ['2-colourable check (same as Is Graph Bipartite)',
    'split into two groups of EQUAL size'],
};

// ---------------------------------------------------------------- Binary Search

C['Sqrt(x)'] = {
  unambiguous: true,
  note: 'The floor of the square root: the largest integer r with r*r <= x. The '
    + 'binary-search tags and the Binary Search topic agree, and for x >= 0 the '
    + 'value is unique.',
};

C['Valid Perfect Square'] = {
  unambiguous: true,
  note: 'Whether x is a perfect square, i.e. whether some integer r has r*r == x. '
    + 'One boolean, one definition.',
};

C['Find Smallest Letter Greater Than Target'] = {
  unambiguous: true,
  note: 'The smallest letter strictly greater than target, wrapping to letters[0] '
    + 'when no letter is greater. Both the wrap-around rule and the strict '
    + 'comparison are part of the standard contract and are stated in the '
    + 'description.',
};

C['Missing Number'] = {
  unambiguous: true,
  note: 'The single value missing from a set of n distinct values drawn from '
    + '0..n. The range is stated in the constraints so the answer is unique; '
    + 'without that range "missing" would not be well defined.',
};

C['Search a 2D Matrix'] = {
  unambiguous: true,
  note: 'Each row is sorted ascending and the first element of row i is greater '
    + 'than the last element of row i-1, so the matrix is sorted in row-major '
    + 'order. The answer is the [row, col] of the target or [-1, -1].',
};

C['Search in Rotated Sorted Array'] = {
  unambiguous: true,
  note: 'A rotated ascending array of DISTINCT values. Distinctness is the whole '
    + 'point of this problem and is enforced in the constraints, so the index of '
    + 'the target (or -1) is unique.',
};

C['Search in Rotated Sorted Array II'] = {
  unambiguous: false,
  note: 'The "II" marks the variant WITH duplicates, and that is exactly what '
    + 'destroys a unique answer: when the array contains the target more than '
    + 'once, several distinct indices are all correct, and exact-match judging '
    + 'would mark a correct solution wrong. Forcing the problem to distinct values '
    + 'would make it identical to the "Search in Rotated Sorted Array" record '
    + 'already selected in this batch, so there is no reconstruction that is both '
    + 'faithful and single-valued.',
  variants: ['any index of a duplicated target (not unique)',
    'requires distinct values, which is the other record in this batch'],
};

C['Find First and Last Position'] = {
  unambiguous: true,
  note: 'The index range [first, last] of the target in an ascending array of '
    + 'distinct values, or [-1, -1] when the target is absent. One ordered pair.',
};

C['Search a 2D Matrix II'] = {
  unambiguous: true,
  note: 'Each row is sorted ascending and EACH COLUMN is sorted ascending, which '
    + 'is precisely what separates II from the first 2D matrix problem (rows '
    + 'only). The [row, col] answer, or [-1, -1], is unique.',
};

C['Koko Eating Bananas'] = {
  unambiguous: true,
  note: 'The smallest whole-number eating speed at which every pile can be '
    + 'finished within h hours, speed meaning bananas per hour. One integer, and '
    + 'the monotonicity that makes it binary-searchable is stated.',
};

// ---------------------------------------------------------------------- Heap

C['Kth Largest Element in Array'] = {
  unambiguous: true,
  note: 'The k-th largest value of the array with k counted from 1, i.e. the '
    + 'value at index n-k of the descending order. Unambiguous once the 1-based '
    + 'convention is stated, which the description does.',
};

C['Kth Largest Element in Stream'] = {
  unambiguous: true,
  note: 'The k-th largest of everything added SO FAR, reported after each '
    + 'addition. This is a design problem, and the repository already has a '
    + 'fixed convention for those (LRU Cache and LFU Cache, both shipped in '
    + 'batch 3): the operations arrive as a flat string array and the function '
    + 'returns one entry per reported value. Following that convention keeps '
    + 'the problem aligned with the rest of the catalogue instead of inventing '
    + 'a second one.',
};

C['Top K Frequent Words'] = {
  unambiguous: true,
  note: 'The k most frequent words, ordered by descending frequency with ties '
    + 'broken alphabetically. The tie-break and the input domain (lowercase words '
    + 'of length >= 2) are stated in the description, which removes the variant '
    + 'where one-letter words are dropped or case is folded.',
};

C['Find K Pairs with Smallest Sums'] = {
  unambiguous: false,
  note: 'The task is to return k pairs with the smallest sums, but WHICH k pairs is '
    + 'not determined when several pairs share a sum. Ordinary inputs hit ties '
    + 'constantly - two equal elements in each array already give two different '
    + 'pairs with the same sum - and the judge would accept only one of them. No '
    + 'canonical tie-break is stated by the title.',
  variants: ['any k pairs attaining the k smallest sums (not unique)',
    'sorted by sum then by first element (would have to be invented)'],
};

C['Task Scheduler'] = {
  unambiguous: true,
  note: 'The minimum number of intervals needed to run every task when two '
    + 'occurrences of the SAME task must be separated by n intervals. It is a '
    + 'minimum, not an arrangement, so the answer is a single integer with no '
    + 'tie-break to settle.',
};

C['Rearrange String k Distance Apart'] = {
  unambiguous: false,
  note: 'The canonical problem asks for ANY valid rearrangement, and its own '
    + 'statement says so. Several rearrangements are correct for essentially every '
    + 'input, so a single expected-output string would mark correct solutions '
    + 'wrong; this needs a validator rather than exact matching.',
  variants: ['any valid rearrangement', 'lexicographically smallest rearrangement'],
};

C['Smallest Range From Lists'] = {
  unambiguous: false,
  note: 'The smallest range covering at least k of the lists. When two or more '
    + 'ranges share the minimum width they are all correct answers and the '
    + 'canonical problem returns any of them, so the pair to expect is not '
    + 'determined by the input.',
  variants: ['any minimum-width range (not unique)',
    'smallest starting value among minimum-width ranges (would have to be invented)'],
};

C['IPO'] = {
  unambiguous: true,
  note: 'With an initial capital w and a budget of at most k projects, each '
    + 'requiring a cost and paying a profit, return the maximum capital reachable. '
    + 'The tags (heap, greedy), the Heap topic and the hard difficulty all point at '
    + 'the single standard version, and the answer is one integer: the MAXIMUM over '
    + 'all achievable outcomes, which is unique even though the project set that '
    + 'reaches it is not. The input encoding (k, w, costs, profits) is stated in '
    + 'the description.',
};

C['Find K-th Smallest Pair Distance'] = {
  unambiguous: true,
  note: 'The k-th smallest absolute distance over all unordered pairs of the given '
    + 'points, counting equal distances from different pairs as separate pairs. One '
    + 'integer.',
};

C['Maximum Frequency Stack'] = {
  unambiguous: true,
  note: 'A stack where push(v) raises the frequency of v, freq(v) reports it, and '
    + 'popMax() removes and returns a value of highest frequency. The one thing the '
    + 'title leaves open is WHICH value is removed when several share the maximum '
    + 'frequency; the description fixes it to the most recently pushed, which is '
    + 'also what the canonical stack-per-level implementation does, so the returned '
    + 'sequence is unique.',
};

C['Trapping Rain Water II'] = {
  unambiguous: true,
  note: 'Water trapped in a 2D elevation map, where a cell fills up to the lowest '
    + 'level on any escape path to the border and water moves in all four '
    + 'directions. That is the II form; the 1D form is a different problem already '
    + 'active in the catalogue. The total is a single integer.',
};

module.exports = CONTRACTS;