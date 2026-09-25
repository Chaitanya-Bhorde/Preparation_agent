/**
 * authoredDsaBatch1.js
 * ---------------------------------------------------------------------------
 * Authored content for BATCH 1 of the DSA canonical-bank repair (16 of the 226
 * content-gap CodingProblem records).
 *
 * PROVENANCE — every field below is derived from an in-repo ground-truth
 * artifact. Nothing is inferred from a problem title alone.
 *
 *   (S) SOLVER source  : scripts/testCaseGenerators.js  SOLVERS[<title>]
 *                        Reviewed JS reference `solve(input)` + a deterministic
 *                        `gen(i)` fixture generator. Authority for the SEMANTICS,
 *                        input lines and expected outputs of all 53 fixtures of
 *                        the EIGHT binary-tree records.
 *                        NOT used for Merge Two Sorted Lists: its solve() reassigns
 *                        const parameters and throws ("Assignment to constant
 *                        variable"), so that record ships from the (L) source.
 *   (C) CURATED source : scripts/curatedProblems.js     CURATED[<title>]
 *                        Reviewed description / constraints / examples /
 *                        typed per-language function signature / sample+hidden.
 *                        Used for: Number of Islands, Course Schedule, Binary Search.
 *   (L) LEGACY source  : scripts/seedCodingProblems.js  codingProblems[<title>]
 *                        Authored description / constraints / examples /
 *                        visibleTestCases / hiddenTestCases (line-based stdin).
 *                        Used for: Merge Two Sorted Lists, Word Ladder, Linked
 *                        List Cycle, Reverse Linked List, Palindrome Partitioning.
 *   (M) METADATA source: scripts/seedCodingProblemsExpanded.js (title-keyed row)
 *                        difficulty / topic / tags for every one of the 16
 *                        records, case-insensitively de-duplicated so the audit's
 *                        "duplicate topics" check passes.
 *
 * INPUT ENCODING (documented, verified re-encoding rules)
 *   The merged /api/coding/submit pipeline feeds ONE line-based stdin string to
 *   the per-language driver, so every parameter must be serialisable to a line.
 *   - Trees: the SOLVER fixtures hold a nested JSON tree
 *     ('{"val":3,"left":...}'). A JSON object line is NOT a valid line-based
 *     test input for the platform (genericValidator.parseTestCaseInput treats a
 *     leading '{' as the JSON-object test format, which yields an undefined
 *     argument). Each tree is therefore re-encoded to the platform-standard
 *     LEVEL-ORDER ARRAY ('[3,9,20,null,null,15,7]'), which the drivers parse
 *     natively. The re-encoding is proven lossless at build time: the tree is
 *     rebuilt from the level-order array and the SOLVER is re-run on it; the
 *     expected output must be identical to the SOLVER's own output.
 *   - Linked lists: node values in order as ONE JSON array line; the merged or
 *     reversed list is returned as an array of node values (the platform's
 *     drivers print arrays verbatim; a nested node object would print as
 *     "[object Object]").
 *   - Word lists: authored comma-separated lists are re-encoded as JSON arrays.
 *   - Multiple parameters: ONE stdin line per parameter, in functionSignature
 *     order (genericValidator.parseTestCaseInput: line N -> parameter N). Legacy
 *     records whose source starter is `solve(input)` over a multi-line input are
 *     re-signatured to typed parameters using exactly the parameter names the
 *     legacy starter destructures; no test content is invented.
 *   - Curated multi-line inputs store the line separator as a LITERAL backslash-n
 *     (verified char codes 92,110); they are re-encoded to real newlines here.
 *
 * Every fixture in this module is additionally checked at validation time by an
 * INDEPENDENT reference implementation (see scripts/validateAuthoredDsaBatch1.js)
 * run through the real sandbox: examples + hidden tests must all pass.
 * ---------------------------------------------------------------------------
 */
'use strict';

/* ---------------------------------------------------------- source bindings */
const fs = require('fs');
const path = require('path');
const { SOLVERS } = require('./testCaseGenerators');
const { CURATED } = require('./curatedProblems');

/* ---------------------------------------------------------------- signatures */
/** L(name, [[paramName, type], ...], returnType) -> FunctionSignature */
const L = (name, params, returnType) => ({
  name,
  params: params.map(([pName, pType]) => ({ name: pName, type: pType })),
  returnType,
});



/* ------------------------------------------------------------ codec helpers */
/** Level-order array (null = missing child) -> nested {val,left,right} tree. */
function fromLevelOrder(arr) {
  if (!arr || arr.length === 0) return null;
  const nodes = arr.map((v) =>
    v === null || v === undefined ? null : { val: v, left: null, right: null }
  );
  let j = 1;
  for (let i = 0; i < nodes.length && j < nodes.length; i++) {
    if (!nodes[i]) continue;
    nodes[i].left = nodes[j++] || null;
    if (j < nodes.length) nodes[i].right = nodes[j++] || null;
  }
  return nodes[0];
}

/** Nested tree -> level-order array (LeetCode serialisation, trailing nulls cut). */
function toLevelOrder(root) {
  if (!root) return [];
  const out = [];
  const q = [root];
  while (q.length) {
    const n = q.shift();
    if (!n) { out.push(null); continue; }
    out.push(n.val);
    q.push(n.left || null, n.right || null);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

/** Linked-list node chain -> array of node values. */
function listToArray(node) {
  const out = [];
  let cur = node;
  while (cur) { out.push(cur.val); cur = cur.next; }
  return out;
}

/* ------------------------------------------------- shared starter preambles */
/**
 * Tree building boilerplate shared by the eight binary-tree records. The
 * parameter a learner receives is the LEVEL-ORDER ARRAY (Java/C++: its tokens as
 * strings, because neither the Java `int[]` nor the C++ `parseIntArray` driver
 * helper can represent a missing child) — `buildTree`/`build_tree` turns it into
 * a node chain so the learner only writes the algorithm.
 */
const TREE_PREAMBLE = {
  javascript: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

/** levelOrder: [v, ...] where null marks a missing child -> TreeNode | null */
function buildTree(levelOrder) {
  if (!levelOrder || levelOrder.length === 0) return null;
  const nodes = levelOrder.map((v) => (v === null || v === undefined ? null : new TreeNode(v)));
  let j = 1;
  for (let i = 0; i < nodes.length && j < nodes.length; i++) {
    if (!nodes[i]) continue;
    nodes[i].left = nodes[j++] || null;
    if (j < nodes.length) nodes[i].right = nodes[j++] || null;
  }
  return nodes[0];
}
`,
  python: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def build_tree(level_order):
    """level_order: list of values where None marks a missing child -> TreeNode."""
    if not level_order:
        return None
    nodes = [None if v is None else TreeNode(v) for v in level_order]
    j = 1
    for i in range(len(nodes)):
        if nodes[i] is None or j >= len(nodes):
            continue
        nodes[i].left = nodes[j]
        j += 1
        if j < len(nodes):
            nodes[i].right = nodes[j]
            j += 1
    return nodes[0]
`,
  java: `import java.util.*;

static class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) { this.val = val; }
}

class Solution {
    /** levelOrder tokens ("null" = missing child) -> root node. */
    static TreeNode buildTree(String[] levelOrder) {
        if (levelOrder == null || levelOrder.length == 0) return null;
        TreeNode[] nodes = new TreeNode[levelOrder.length];
        for (int i = 0; i < levelOrder.length; i++) {
            String tok = levelOrder[i].trim();
            nodes[i] = tok.equals("null") ? null : new TreeNode(Integer.parseInt(tok));
        }
        int j = 1;
        for (int i = 0; i < nodes.length && j < nodes.length; i++) {
            if (nodes[i] == null) continue;
            nodes[i].left = nodes[j++];
            if (j < nodes.length) nodes[i].right = nodes[j++];
        }
        return nodes[0];
    }
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

/** levelOrder text ("[3,9,20,null,...]") -> root node. */
TreeNode* buildTree(const string& raw) {
    vector<string> tokens;
    string cur;
    for (size_t i = 0; i < raw.size(); i++) {
        char c = raw[i];
        if (c == '[' || c == ']' || c == ',' || c == ' ') {
            if (!cur.empty()) { tokens.push_back(cur); cur.clear(); }
        } else {
            cur.push_back(c);
        }
    }
    if (!cur.empty()) tokens.push_back(cur);
    if (tokens.empty()) return nullptr;
    vector<TreeNode*> nodes(tokens.size(), nullptr);
    for (size_t i = 0; i < tokens.size(); i++) {
        nodes[i] = tokens[i] == "null" ? nullptr : new TreeNode(stoi(tokens[i]));
    }
    size_t j = 1;
    for (size_t i = 0; i < nodes.size() && j < nodes.size(); i++) {
        if (!nodes[i]) continue;
        nodes[i]->left = nodes[j++];
        if (j < nodes.size()) nodes[i]->right = nodes[j++];
    }
    return nodes[0];
}
`,
};

/** Compose a tree-record starter: shared preamble + the learner's function. */

/* ------------------------------------------------ fixture helpers / builders */
/**
 * Adapter for single-tree records. Re-encodes the SOLVER's nested JSON tree into
 * the level-order array, and PROVES the re-encoding is lossless by requiring the
 * SOLVER to produce the identical output from the rebuilt tree.
 */
function treeAdaptFactory(title) {
  const solver = SOLVERS[title];
  return (genLine) => {
    const arr = toLevelOrder(JSON.parse(genLine));
    const stored = JSON.stringify(arr);
    const solverInput = JSON.stringify(fromLevelOrder(arr));
    if (String(solver.solve(solverInput)) !== String(solver.solve(genLine))) {
      throw new Error(`authoredDsaBatch1: level-order re-encoding is lossy for "${title}": ${genLine}`);
    }
    return { stored, solverInput };
  };
}

/** Render fixtures as human-readable examples (`name = line` joined by ", "). */
function examplesFromTests(tests, paramNames, count) {
  return tests.slice(0, count || 3).map((t) => {
    const lines = String(t.input).split('\n');
    const input = lines.map((l, i) => `${paramNames[i]} = ${l}`).join(', ');
    return { input, output: t.output };
  });
}

/** Envelope (max nodes / value range) of the tree fixtures — verified bounds. */
function treeEnvelope(tests) {
  let maxNodes = 0;
  let lo = Infinity;
  let hi = -Infinity;
  for (const t of tests) {
    const arr = JSON.parse(String(t.input).split('\n')[0]);
    if (arr.length > maxNodes) maxNodes = arr.length;
    for (const v of arr) {
      if (v === null) continue;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  return { maxNodes, lo, hi };
}


/* ============================== BATCH 1 RECORDS ============================== */

/**
 * The eight binary-tree records. Semantics + all 53 fixtures come from
 * testCaseGenerators.js SOLVERS[<title>]; the tree parameter is re-encoded to the
 * platform's level-order array form (proven lossless by treeAdaptFactory).
 */
const TREE_RECORDS = [
  {
    slug: 'binary-tree-inorder-traversal',
    title: 'Binary Tree Inorder Traversal',
    description:
      'Given the `root` of a binary tree, return its inorder traversal: the node values visited '
      + 'left subtree, then root, then right subtree. The tree is supplied as a level-order array '
      + 'of node values, where null marks a missing child.',
    signature: {
      javascript: L('inorderTraversal', [['root', 'number[]']], 'number[]'),
      python: L('inorder_traversal', [['root', 'List[int]']], 'List[int]'),
      java: L('inorderTraversal', [['root', 'String[]']], 'List<Integer>'),
      cpp: L('inorderTraversal', [['root', 'string']], 'vector<int>'),
    },
    starter: treeStarter({
      javascript: `function inorderTraversal(root) {
  const tree = buildTree(root);

  return [];
}`,
      python: `def inorder_traversal(root):
    tree = build_tree(root)

    return []`,
      java: `    public List<Integer> inorderTraversal(String[] root) {
        TreeNode tree = buildTree(root);

        return new ArrayList<>();
    }
`,
      cpp: `vector<int> inorderTraversal(string root) {
    TreeNode* tree = buildTree(root);

    return {};
}`,
    }),
    referenceBody: `function inorderTraversal(root) {
  const tree = buildTree(root);
  const result = [];
  const visit = (node) => {
    if (!node) return;
    visit(node.left);
    result.push(node.val);
    visit(node.right);
  };
  visit(tree);
  return result;
}`,
  },
  {
    slug: 'maximum-depth-of-binary-tree',
    title: 'Maximum Depth of Binary Tree',
    description:
      'Given the `root` of a binary tree, return its maximum depth: the number of nodes along the '
      + 'longest path from the root node down to the farthest leaf node. The tree is supplied as a '
      + 'level-order array of node values, where null marks a missing child.',
    signature: {
      javascript: L('maxDepth', [['root', 'number[]']], 'number'),
      python: L('max_depth', [['root', 'List[int]']], 'int'),
      java: L('maxDepth', [['root', 'String[]']], 'int'),
      cpp: L('maxDepth', [['root', 'string']], 'int'),
    },
    starter: treeStarter({
      javascript: `function maxDepth(root) {
  const tree = buildTree(root);

  return 0;
}`,
      python: `def max_depth(root):
    tree = build_tree(root)

    return 0`,
      java: `    public int maxDepth(String[] root) {
        TreeNode tree = buildTree(root);

        return 0;
    }
`,
      cpp: `int maxDepth(string root) {
    TreeNode* tree = buildTree(root);

    return 0;
}`,
    }),
    referenceBody: `function maxDepth(root) {
  const tree = buildTree(root);
  const depth = (node) => (node ? 1 + Math.max(depth(node.left), depth(node.right)) : 0);
  return depth(tree);
}`,
  },
  {
    slug: 'symmetric-tree',
    title: 'Symmetric Tree',
    description:
      'Given the `root` of a binary tree, return whether it is a mirror of itself: the left subtree '
      + 'is a mirror reflection of the right subtree. The tree is supplied as a level-order array '
      + 'of node values, where null marks a missing child.',
    signature: {
      javascript: L('isSymmetric', [['root', 'number[]']], 'boolean'),
      python: L('is_symmetric', [['root', 'List[int]']], 'bool'),
      java: L('isSymmetric', [['root', 'String[]']], 'boolean'),
      cpp: L('isSymmetric', [['root', 'string']], 'bool'),
    },
    starter: treeStarter({
      javascript: `function isSymmetric(root) {
  const tree = buildTree(root);

  return false;
}`,
      python: `def is_symmetric(root):
    tree = build_tree(root)

    return False`,
      java: `    public boolean isSymmetric(String[] root) {
        TreeNode tree = buildTree(root);

        return false;
    }
`,
      cpp: `bool isSymmetric(string root) {
    TreeNode* tree = buildTree(root);

    return false;
}`,
    }),
    referenceBody: `function isSymmetric(root) {
  const tree = buildTree(root);
  const mirror = (a, b) => {
    if (!a && !b) return true;
    if (!a || !b || a.val !== b.val) return false;
    return mirror(a.left, b.right) && mirror(a.right, b.left);
  };
  return mirror(tree && tree.left, tree && tree.right);
}`,
  },
  {
    slug: 'same-tree',
    title: 'Same Tree',
    description:
      'Given the roots `p` and `q` of two binary trees, return whether the two trees are the same: '
      + 'identical in both structure and node values. Each tree is supplied as a level-order array '
      + 'of node values, where null marks a missing child.',
    signature: {
      javascript: L('isSameTree', [['p', 'number[]'], ['q', 'number[]']], 'boolean'),
      python: L('is_same_tree', [['p', 'List[int]'], ['q', 'List[int]']], 'bool'),
      java: L('isSameTree', [['p', 'String[]'], ['q', 'String[]']], 'boolean'),
      cpp: L('isSameTree', [['p', 'string'], ['q', 'string']], 'bool'),
    },
    starter: treeStarter({
      javascript: `function isSameTree(p, q) {
  const treeP = buildTree(p);
  const treeQ = buildTree(q);

  return false;
}`,
      python: `def is_same_tree(p, q):
    tree_p = build_tree(p)
    tree_q = build_tree(q)

    return False`,
      java: `    public boolean isSameTree(String[] p, String[] q) {
        TreeNode treeP = buildTree(p);
        TreeNode treeQ = buildTree(q);

        return false;
    }
`,
      cpp: `bool isSameTree(string p, string q) {
    TreeNode* treeP = buildTree(p);
    TreeNode* treeQ = buildTree(q);

    return false;
}`,
    }),
    referenceBody: `function isSameTree(p, q) {
  const treeP = buildTree(p);
  const treeQ = buildTree(q);
  const same = (a, b) => {
    if (!a && !b) return true;
    if (!a || !b || a.val !== b.val) return false;
    return same(a.left, b.left) && same(a.right, b.right);
  };
  return same(treeP, treeQ);
}`,
  },
  {
    slug: 'path-sum',
    title: 'Path Sum',
    description:
      'Given the `root` of a binary tree and an integer `target`, return whether the tree has a '
      + 'root-to-leaf path whose node values sum to `target`. The tree is supplied as a level-order '
      + 'array of node values, where null marks a missing child; `target` is the second parameter.',
    signature: {
      javascript: L('hasPathSum', [['root', 'number[]'], ['target', 'number']], 'boolean'),
      python: L('has_path_sum', [['root', 'List[int]'], ['target', 'int']], 'bool'),
      java: L('hasPathSum', [['root', 'String[]'], ['target', 'int']], 'boolean'),
      cpp: L('hasPathSum', [['root', 'string'], ['target', 'int']], 'bool'),
    },
    starter: treeStarter({
      javascript: `function hasPathSum(root, target) {
  const tree = buildTree(root);

  return false;
}`,
      python: `def has_path_sum(root, target):
    tree = build_tree(root)

    return False`,
      java: `    public boolean hasPathSum(String[] root, int target) {
        TreeNode tree = buildTree(root);

        return false;
    }
`,
      cpp: `bool hasPathSum(string root, int target) {
    TreeNode* tree = buildTree(root);

    return false;
}`,
    }),
    referenceBody: `function hasPathSum(root, target) {
  const tree = buildTree(root);
  const walk = (node, remaining) => {
    if (!node) return false;
    if (!node.left && !node.right) return remaining === node.val;
    return walk(node.left, remaining - node.val) || walk(node.right, remaining - node.val);
  };
  return walk(tree, target);
}`,
  },
  {
    slug: 'binary-tree-level-order-traversal',
    title: 'Binary Tree Level Order Traversal',
    description:
      'Given the `root` of a binary tree, return its level-order traversal: the node values of each '
      + 'level grouped from left to right, one array per level. The tree is supplied as a '
      + 'level-order array of node values, where null marks a missing child.',
    signature: {
      javascript: L('levelOrder', [['root', 'number[]']], 'number[][]'),
      python: L('level_order', [['root', 'List[int]']], 'List[List[int]]'),
      java: L('levelOrder', [['root', 'String[]']], 'List<List<Integer>>'),
      cpp: L('levelOrder', [['root', 'string']], 'vector<vector<int>>'),
    },
    starter: treeStarter({
      javascript: `function levelOrder(root) {
  const tree = buildTree(root);

  return [];
}`,
      python: `def level_order(root):
    tree = build_tree(root)

    return []`,
      java: `    public List<List<Integer>> levelOrder(String[] root) {
        TreeNode tree = buildTree(root);

        return new ArrayList<>();
    }
`,
      cpp: `vector<vector<int>> levelOrder(string root) {
    TreeNode* tree = buildTree(root);

    return {};
}`,
    }),
    referenceBody: `function levelOrder(root) {
  const tree = buildTree(root);
  if (!tree) return [];
  const res = [];
  let frontier = [tree];
  while (frontier.length) {
    res.push(frontier.map((n) => n.val));
    const next = [];
    for (const n of frontier) {
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    frontier = next;
  }
  return res;
}`,
  },
  {
    slug: 'validate-binary-search-tree',
    title: 'Validate Binary Search Tree',
    description:
      'Given the `root` of a binary tree, return whether it is a valid binary search tree: for '
      + 'every node, all values in its left subtree are smaller and all values in its right '
      + 'subtree are larger. The tree is supplied as a level-order array of node values, where '
      + 'null marks a missing child.',
    signature: {
      javascript: L('isValidBST', [['root', 'number[]']], 'boolean'),
      python: L('is_valid_bst', [['root', 'List[int]']], 'bool'),
      java: L('isValidBST', [['root', 'String[]']], 'boolean'),
      cpp: L('isValidBST', [['root', 'string']], 'bool'),
    },
    starter: treeStarter({
      javascript: `function isValidBST(root) {
  const tree = buildTree(root);

  return false;
}`,
      python: `def is_valid_bst(root):
    tree = build_tree(root)

    return False`,
      java: `    public boolean isValidBST(String[] root) {
        TreeNode tree = buildTree(root);

        return false;
    }
`,
      cpp: `bool isValidBST(string root) {
    TreeNode* tree = buildTree(root);

    return false;
}`,
    }),
    referenceBody: `function isValidBST(root) {
  const tree = buildTree(root);
  const check = (node, lo, hi) => {
    if (!node) return true;
    if (node.val <= lo || node.val >= hi) return false;
    return check(node.left, lo, node.val) && check(node.right, node.val, hi);
  };
  return check(tree, -Infinity, Infinity);
}`,
  },
  {
    slug: 'binary-tree-maximum-path-sum',
    title: 'Binary Tree Maximum Path Sum',
    description:
      'Given the `root` of a binary tree, return the maximum path sum: the largest sum of node '
      + 'values along any path that starts and ends at any node of the tree (a path must contain '
      + 'at least one node). The tree is supplied as a level-order array of node values, where '
      + 'null marks a missing child.',
    signature: {
      javascript: L('maxPathSum', [['root', 'number[]']], 'number'),
      python: L('max_path_sum', [['root', 'List[int]']], 'int'),
      java: L('maxPathSum', [['root', 'String[]']], 'int'),
      cpp: L('maxPathSum', [['root', 'string']], 'int'),
    },
    starter: treeStarter({
      javascript: `function maxPathSum(root) {
  const tree = buildTree(root);

  return 0;
}`,
      python: `def max_path_sum(root):
    tree = build_tree(root)

    return 0`,
      java: `    public int maxPathSum(String[] root) {
        TreeNode tree = buildTree(root);

        return 0;
    }
`,
      cpp: `int maxPathSum(string root) {
    TreeNode* tree = buildTree(root);

    return 0;
}`,
    }),
    referenceBody: `function maxPathSum(root) {
  const tree = buildTree(root);
  let best = -Infinity;
  const gain = (node) => {
    if (!node) return 0;
    const left = Math.max(0, gain(node.left));
    const right = Math.max(0, gain(node.right));
    best = Math.max(best, left + right + node.val);
    return node.val + Math.max(left, right);
  };
  gain(tree);
  return best;
}`,
  },
];

/** Standard constraints block for the eight binary-tree records. */
function treeConstraints(tests, extra) {
  const e = treeEnvelope(tests);
  const base = [
    'The tree is given as a level-order array of node values where null marks a missing child',
    `1 <= number of nodes <= ${e.maxNodes}`,
    `${e.lo} <= node value <= ${e.hi}`,
  ];
  return base.concat(extra || []);
}

function treeStarter(parts) {
  return {
    javascript: TREE_PREAMBLE.javascript + '\n' + parts.javascript + '\n',
    python: TREE_PREAMBLE.python + '\n\n' + parts.python + '\n',
    java: TREE_PREAMBLE.java + parts.java + '}\n',
    cpp: TREE_PREAMBLE.cpp + '\n' + parts.cpp + '\n',
  };
}

/**
 * Build the 3 sample + 50 hidden fixtures for a SOLVERS-backed record.
 * `adapt(genLine)` returns { stored, solverInput }:
 *   stored      - the line-based stdin actually saved in the database
 *   solverInput - the input the reviewed SOLVER expects
 * `adaptOutput(rawOut)` maps a solver output into the stored expected output;
 * it is the identity for every current record — the linked-list record ships
 * from the (L) legacy source because SOLVERS['Merge Two Sorted Lists'].solve
 * reassigns its const parameters and throws ("Assignment to constant variable").
 * The tree re-encoding is asserted lossless here: the rebuilt tree must yield
 * the SOLVER's own output.
 */
function solverFixtures(title, adapt, adaptOutput) {
  const solver = SOLVERS[title];
  if (!solver) throw new Error(`authoredDsaBatch1: no SOLVERS entry for "${title}"`);
  const sampleTests = [];
  const hiddenTests = [];
  const out = adaptOutput || ((r) => r);
  for (let i = 0; i < 53; i++) {
    const genLine = solver.gen(i);

    const { stored, solverInput } = adapt(genLine);
    const expected = String(out(solver.solve(solverInput), stored, genLine));
    if (i < 3) {
      sampleTests.push({ input: stored, output: expected, explanation: `Sample test case ${i + 1}` });
    } else {
      hiddenTests.push({ input: stored, output: expected, category: ['edge', 'stress', 'random'][i % 3] });
    }
  }
  return { sampleTests, hiddenTests };
}

/* ============================ SOURCE LOADERS ============================== */
/**
 * Fail-closed extraction of a literal data array from an in-repo seeder file.
 * The seeders intentionally export nothing (requiring one must never seed), so
 * the literal is located textually and evaluated in isolation. Used for the (L)
 * legacy entries and the (M) metadata rows; the offline validator re-uses this
 * loader to prove the payload still matches its sources.
 */
function loadLiteralArray(file, declMarker) {
  const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const at = src.indexOf(declMarker);
  if (at < 0) throw new Error(`authoredDsaBatch1: declaration "${declMarker}" missing in ${file}`);
  const arrStart = src.indexOf('[', at);
  const arrEnd = arrStart < 0 ? -1 : src.indexOf('\n];', arrStart);
  if (arrEnd < 0) throw new Error(`authoredDsaBatch1: literal array not closed in ${file}`);
  const arr = new Function(`return (${src.slice(arrStart, arrEnd + 2)});`)();
  if (!Array.isArray(arr) || arr.length === 0) throw new Error(`authoredDsaBatch1: empty array from ${file}`);
  return arr;
}

const LEGACY_ENTRIES = loadLiteralArray('seedCodingProblems.js', 'const codingProblems = [');
const META_ROWS = loadLiteralArray('seedCodingProblemsExpanded.js', 'const codingProblems = [');

function legacyEntry(title) {
  const e = LEGACY_ENTRIES.find((x) => x && x.title === title);
  if (!e) throw new Error(`authoredDsaBatch1: no (L) legacy entry for "${title}"`);
  return e;
}

function metaRow(title) {
  const r = META_ROWS.find((x) => x && x.title === title);
  if (!r || !r.difficulty || !r.topic) throw new Error(`authoredDsaBatch1: no (M) metadata row for "${title}"`);
  return r;
}

/** The exact CodingProblem pre-save slug formula (models/CodingProblem.js). */
function slugify(title) {
  return String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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

/* ====================== TYPED STARTER CONSTRUCTION ========================= */
/** Typed default return literal per language/return type (every stub compiles). */
function defaultReturn(lang, type) {
  const t = String(type || '');
  const tl = t.toLowerCase();
  if (lang === 'python') {
    if (tl === 'bool' || tl === 'boolean') return 'False';
    if (tl.includes('[') || tl.startsWith('list')) return '[]';
    if (/int|number|float|double/.test(tl)) return '0';
    if (tl === 'str' || tl === 'string') return "''";
    return 'None';
  }
  if (lang === 'java') {
    if (tl === 'boolean') return 'false';
    if (tl === 'int') return '0';
    if (tl.startsWith('list')) return 'new ArrayList<>()';
    if (tl.endsWith('[]')) return `new ${t}{}`;
    return 'null';
  }
  if (lang === 'cpp') {
    if (tl === 'bool') return 'false';
    if (tl === 'int') return '0';
    if (t.includes('vector')) return '{}';
    return '""';
  }
  if (tl === 'boolean') return 'false';
  if (tl.endsWith('[]')) return '[]';
  if (/number|int|float|double/.test(tl)) return '0';
  if (tl === 'string') return "''";
  return 'null';
}

/** Build the four-language typed starter block from typed signatures. Every stub
 *  returns a typed default (legacy-seed style) so JS/Python/Java/C++ templates
 *  all parse and compile — unlike an empty Java method body, which does not. */
function typedStarters(sigs) {
  const js = sigs.javascript, py = sigs.python, jv = sigs.java, cp = sigs.cpp;
  if (!js || !py || !jv || !cp) throw new Error('authoredDsaBatch1: incomplete signature set');
  for (const [lang, s] of Object.entries(sigs)) {
    if (!s || !s.name || !Array.isArray(s.params) || !s.returnType) {
      throw new Error(`authoredDsaBatch1: malformed ${lang} signature`);
    }
  }
  const jsParams = js.params.map((p) => p.name).join(', ');
  const pyParams = py.params.map((p) => p.name).join(', ');
  const jvParams = jv.params.map((p) => `${p.type} ${p.name}`).join(', ');
  const cpParams = cp.params.map((p) => `${p.type} ${p.name}`).join(', ');
  const javaHeader = jv.returnType.toLowerCase().startsWith('list') ? 'import java.util.*;\n\n' : '';
  return {
    javascript: `function ${js.name}(${jsParams}) {\n  \n  return ${defaultReturn('javascript', js.returnType)};\n}\n`,
    python: `def ${py.name}(${pyParams}):\n    \n    return ${defaultReturn('python', py.returnType)}\n`,
    java: `${javaHeader}class Solution {\n    public ${jv.returnType} ${jv.name}(${jvParams}) {\n        \n        return ${defaultReturn('java', jv.returnType)};\n    }\n}\n`,
    cpp: `${cp.returnType} ${cp.name}(${cpParams}) {\n    \n    return ${defaultReturn('cpp', cp.returnType)};\n}\n`,
  };
}

/* ========================= TEST INPUT RE-ENCODERS ========================== */
/** Curated multi-line inputs store a LITERAL backslash-n (char codes 92,110). */
function decodeLiteralNewlines(s) {
  return String(s).split('\\n').join('\n');
}

/** Comma-separated word list line -> JSON array line. */
function wordListLineToJson(csvLine) {
  return JSON.stringify(String(csvLine).split(','));
}

/** Legacy number grid [[1,0],...] -> curated row-string grid ["10",...]. */
function gridToRowStrings(input) {
  const grid = JSON.parse(String(input));
  if (!Array.isArray(grid) || grid.length === 0 || !Array.isArray(grid[0])) {
    throw new Error(`authoredDsaBatch1: not a 2D grid: ${input}`);
  }
  return JSON.stringify(grid.map((row) => row.map((v) => (v ? '1' : '0')).join('')));
}

/** '[[a,a,b],[aa,b]]' -> '[["a","a","b"],["aa","b"]]' — the platform JSON form
 *  used by the source's own example outputs. */
function quotePartitionList(s) {
  return String(s).replace(/\[([^\[\]]+)\]/g, (_, inner) =>
    '[' + inner.split(',').map((t) => '"' + t.trim() + '"').join(',') + ']');
}

/** Drop partitions whose parts are not all palindromes (applies the source
 *  description's own definition to a source row that violated it). */
function sanitizePartitionOutput(jsonStr) {
  const parts = JSON.parse(jsonStr);
  if (!Array.isArray(parts)) throw new Error(`authoredDsaBatch1: bad partition output: ${jsonStr}`);
  return JSON.stringify(parts.filter((p) => Array.isArray(p) && p.every((t) => t === String(t).split('').reverse().join(''))));
}

/** Re-encode the first `treeCount` input lines as level-order arrays (trailing
 *  lines kept verbatim) and prove the re-encoding is lossless against the solver. */
function treeAdaptLines(title, treeCount) {
  const solver = SOLVERS[title];
  if (!solver) throw new Error(`authoredDsaBatch1: no SOLVERS entry for "${title}"`);
  return (genLine) => {
    const lines = String(genLine).split('\n');
    const arrs = lines.slice(0, treeCount).map((l) => toLevelOrder(JSON.parse(l)));
    const tails = lines.slice(treeCount);
    const stored = arrs.map((a) => JSON.stringify(a)).concat(tails).join('\n');
    const solverInput = arrs.map((a) => JSON.stringify(fromLevelOrder(a))).concat(tails).join('\n');
    if (String(solver.solve(solverInput)) !== String(solver.solve(genLine))) {
      throw new Error(`authoredDsaBatch1: level-order re-encoding is lossy for "${title}": ${genLine}`);
    }
    return { stored, solverInput };
  };
}

/* ============================ CONTENT SPECS =============================== */
/**
 * Typed signatures, independent reference solutions, and source-faithful test
 * builders for the eight (L)/(C) records. Signature parameters come from the
 * legacy starter's own destructuring (or CURATED); every input/output transform
 * is a documented re-encoding of source data. The offline validator executes
 * each record's referenceSolution over every fixture through the real sandbox
 * and fails closed on any mismatch.
 */
/** Keep the first occurrence of each distinct input (sample/hidden merging). */
function dedupeByInput(list) {
  const seen = new Set();
  return list.filter((t) => {
    const k = String(t.input);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const SOURCED_SPECS = [
  {
    title: 'Merge Two Sorted Lists',
    source: 'L',
    refNote:
      'typed re-signature from the legacy starter destructuring (list1, list2); the source '
      + 'hidden row for [-9,-7,-3] vs [-10,-7,3] summed to 5 elements (dropped a duplicate -7) '
      + 'and its expected output was re-derived through the reference solution',
    sigs: {
      javascript: L('solve', [['list1', 'number[]'], ['list2', 'number[]']], 'number[]'),
      python: L('solve', [['list1', 'List[int]'], ['list2', 'List[int]']], 'List[int]'),
      java: L('solve', [['list1', 'int[]'], ['list2', 'int[]']], 'int[]'),
      cpp: L('solve', [['list1', 'vector<int>'], ['list2', 'vector<int>']], 'vector<int>'),
    },
    reference: `function solve(list1, list2) {
  const out = [];
  let i = 0, j = 0;
  while (i < list1.length && j < list2.length) {
    if (list1[i] <= list2[j]) out.push(list1[i++]);
    else out.push(list2[j++]);
  }
  while (i < list1.length) out.push(list1[i++]);
  while (j < list2.length) out.push(list2[j++]);
  return out;
}`,
    buildTests: (e) => ({
      samples: e.visibleTestCases.map((t) => ({ input: t.input, output: t.expectedOutput })),
      hidden: e.hiddenTestCases.map((t) => ({
        input: t.input,
        output: String(t.input).startsWith('[-9,-7,-3]') ? '[-10,-9,-7,-7,-3,3]' : t.expectedOutput,
      })),
    }),
  },
  {
    title: 'Word Ladder',
    source: 'L',
    refNote:
      'typed re-signature from the legacy starter destructuring (beginWord, endWord, wordList); '
      + 'the comma-separated wordList line re-encoded as a JSON array; the hidden row whose source '
      + 'input was truncated ("rc...") dropped; the unreachable-endWord row expected 0 per the '
      + 'source description (return 0 when endWord is absent from wordList)',
    sigs: {
      javascript: L('solve', [['beginWord', 'string'], ['endWord', 'string'], ['wordList', 'string[]']], 'number'),
      python: L('solve', [['beginWord', 'str'], ['endWord', 'str'], ['wordList', 'List[str]']], 'int'),
      java: L('solve', [['beginWord', 'String'], ['endWord', 'String'], ['wordList', 'String[]']], 'int'),
      cpp: L('solve', [['beginWord', 'string'], ['endWord', 'string'], ['wordList', 'vector<string>']], 'int'),
    },
    reference: `function solve(beginWord, endWord, wordList) {
  const words = new Set(wordList);
  if (!words.has(endWord)) return 0;
  const seen = new Set([beginWord]);
  let frontier = [beginWord];
  let depth = 1;
  while (frontier.length) {
    const next = [];
    for (const w of frontier) {
      for (let i = 0; i < w.length; i++) {
        for (let c = 97; c <= 122; c++) {
          const cand = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);
          if (cand === w || seen.has(cand) || !words.has(cand)) continue;
          if (cand === endWord) return depth + 1;
          seen.add(cand);
          next.push(cand);
        }
      }
    }
    frontier = next;
    depth += 1;
  }
  return 0;
}`,
    buildTests: (e) => {
      const encode = (t) => {
        const lines = String(t.input).split('\n');
        lines[2] = wordListLineToJson(lines[2]);
        const input = lines.join('\n');
        const output = lines[0] === 'a' && lines[1] === 'c' ? '0' : t.expectedOutput;
        return { input, output };
      };
      return {
        samples: e.visibleTestCases.map(encode),
        hidden: e.hiddenTestCases
          .filter((t) => !String(t.input).includes('rc...'))
          .map(encode),
      };
    },
  },
  {
    title: 'Linked List Cycle',
    source: 'L',
    refNote: 'typed re-signature from the legacy starter destructuring (arr, pos); tests unchanged from source',
    sigs: {
      javascript: L('solve', [['arr', 'number[]'], ['pos', 'number']], 'boolean'),
      python: L('solve', [['arr', 'List[int]'], ['pos', 'int']], 'bool'),
      java: L('solve', [['arr', 'int[]'], ['pos', 'int']], 'boolean'),
      cpp: L('solve', [['arr', 'vector<int>'], ['pos', 'int']], 'bool'),
    },
    reference: `function solve(arr, pos) {
  if (!arr || arr.length === 0 || pos < 0 || pos >= arr.length) return false;
  const nodes = arr.map((v) => ({ val: v, next: null }));
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].next = nodes[i + 1];
  nodes[nodes.length - 1].next = nodes[pos];
  let slow = nodes[0];
  let fast = nodes[0];
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,
    buildTests: (e) => ({
      samples: e.visibleTestCases.map((t) => ({ input: t.input, output: t.expectedOutput })),
      hidden: e.hiddenTestCases.map((t) => ({ input: t.input, output: t.expectedOutput })),
    }),
  },
  {
    title: 'Reverse Linked List',
    source: 'L',
    refNote: 'typed re-signature (head: number[]) from the legacy starter parameter; tests unchanged from source',
    sigs: {
      javascript: L('solve', [['head', 'number[]']], 'number[]'),
      python: L('solve', [['head', 'List[int]']], 'List[int]'),
      java: L('solve', [['head', 'int[]']], 'int[]'),
      cpp: L('solve', [['head', 'vector<int>']], 'vector<int>'),
    },
    reference: `function solve(head) {
  const out = [];
  const arr = head || [];
  for (let i = arr.length - 1; i >= 0; i--) out.push(arr[i]);
  return out;
}`,
    buildTests: (e) => ({
      samples: e.visibleTestCases.map((t) => ({ input: t.input, output: t.expectedOutput })),
      hidden: e.hiddenTestCases.map((t) => ({ input: t.input, output: t.expectedOutput })),
    }),
  },
  {
    title: 'Palindrome Partitioning',
    source: 'L',
    refNote:
      'signature already typed in the source; expected outputs re-encoded from the source token '
      + 'form to the platform JSON form used by the source example output, and the non-palindromic '
      + '[ab,ab] partition of the abab row dropped per the source description',
    sigs: {
      javascript: L('solve', [['s', 'string']], 'string[][]'),
      python: L('solve', [['s', 'str']], 'List[List[str]]'),
      java: L('solve', [['s', 'String']], 'List<List<String>>'),
      cpp: L('solve', [['s', 'string']], 'vector<vector<string>>'),
    },
    reference: `function solve(s) {
  const res = [];
  const path = [];
  const isPal = (t) => {
    for (let i = 0, j = t.length - 1; i < j; i++, j--) if (t[i] !== t[j]) return false;
    return true;
  };
  const walk = (start) => {
    if (start === s.length) { res.push(path.slice()); return; }
    for (let end = start + 1; end <= s.length; end++) {
      const piece = s.slice(start, end);
      if (!isPal(piece)) continue;
      path.push(piece);
      walk(end);
      path.pop();
    }
  };
  walk(0);
  return res;
}`,
    buildTests: (e) => {
      const conv = (t) => ({ input: t.input, output: sanitizePartitionOutput(quotePartitionList(t.expectedOutput)) });
      return { samples: e.visibleTestCases.map(conv), hidden: e.hiddenTestCases.map(conv) };
    },
  },
  {
    title: 'Number of Islands',
    source: 'C+L',
    refNote:
      'signature/description/constraints/examples from (C); (C) sample+hidden kept verbatim; '
      + 'legacy number-grid tests re-encoded to the curated row-string grid form so every fixture '
      + 'shares the curated string[][] contract',
    sigsFromCurated: true,
    sigsOverride: {
      // The platform C++ driver has no char-matrix parser (unknown types fall back
      // to `auto`, which cannot bind vector<vector<char>>); row strings carry the
      // same data as the curated JS string[][] contract and parse via
      // parseStringArray, so the C++ template compiles unchanged.
      cpp: L('numIslands', [['grid', 'vector<string>']], 'int'),
    },
    reference: `function solve(grid) {
  const g = (grid || []).map((row) => String(row).split(''));
  const rows = g.length;
  const cols = rows ? g[0].length : 0;
  let count = 0;
  const sink = (r, c) => {
    if (r < 0 || c < 0 || r >= rows || c >= cols || g[r][c] !== '1') return;
    g[r][c] = '0';
    sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (g[r][c] === '1') { count++; sink(r, c); }
    }
  }
  return count;
}`,
    buildTests: (e, c) => {
      const samples = dedupeByInput([
        { input: decodeLiteralNewlines(c.sample.input), output: c.sample.output },
        ...e.visibleTestCases.map((t) => ({ input: gridToRowStrings(t.input), output: t.expectedOutput })),
      ]);
      const hidden = dedupeByInput([
        { input: decodeLiteralNewlines(c.hidden.input), output: c.hidden.output },
        ...e.hiddenTestCases.map((t) => ({ input: gridToRowStrings(t.input), output: t.expectedOutput })),
      ]).filter((t) => !samples.some((s) => s.input === t.input));
      return { samples, hidden };
    },
  },
  {
    title: 'Course Schedule',
    source: 'C+L',
    refNote:
      'signature/description/constraints/examples from (C); curated multi-line inputs re-encoded '
      + 'from literal backslash-n to real newlines; (L) tests merged in (same line format) with '
      + 'duplicates removed',
    sigsFromCurated: true,
    reference: `function solve(numCourses, prerequisites) {
  const indeg = new Array(numCourses).fill(0);
  const adj = Array.from({ length: numCourses }, () => []);
  for (const pair of prerequisites || []) {
    adj[pair[1]].push(pair[0]);
    indeg[pair[0]]++;
  }
  const queue = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);
  let seen = 0;
  while (queue.length) {
    const cur = queue.pop();
    seen++;
    for (const nxt of adj[cur]) if (--indeg[nxt] === 0) queue.push(nxt);
  }
  return seen === numCourses;
}`,
    buildTests: (e, c) => {
      const samples = dedupeByInput([
        { input: decodeLiteralNewlines(c.sample.input), output: c.sample.output },
        ...e.visibleTestCases.map((t) => ({ input: decodeLiteralNewlines(t.input), output: t.expectedOutput })),
      ]);
      const hidden = dedupeByInput([
        { input: decodeLiteralNewlines(c.hidden.input), output: c.hidden.output },
        ...e.hiddenTestCases.map((t) => ({ input: decodeLiteralNewlines(t.input), output: t.expectedOutput })),
      ]).filter((t) => !samples.some((s) => s.input === t.input));
      return { samples, hidden };
    },
  },
  {
    title: 'Binary Search',
    source: 'C+L',
    refNote:
      'signature/description/constraints/examples from (C); curated multi-line inputs re-encoded '
      + 'from literal backslash-n to real newlines; (L) tests merged in (same line format) with '
      + 'duplicates removed',
    sigsFromCurated: true,
    reference: `function solve(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
    buildTests: (e, c) => {
      const samples = dedupeByInput([
        { input: decodeLiteralNewlines(c.sample.input), output: c.sample.output },
        ...e.visibleTestCases.map((t) => ({ input: decodeLiteralNewlines(t.input), output: t.expectedOutput })),
      ]);
      const hidden = dedupeByInput([
        { input: decodeLiteralNewlines(c.hidden.input), output: c.hidden.output },
        ...e.hiddenTestCases.map((t) => ({ input: decodeLiteralNewlines(t.input), output: t.expectedOutput })),
      ]).filter((t) => !samples.some((s) => s.input === t.input));
      return { samples, hidden };
    },
  },
];

/* =========================== RECORD ASSEMBLY ============================== */

/** Identity/order table for the eight (S) tree records. Slugs must equal the
 *  audit report's slugs; difficulty/topic/tags come from (M), deduplicated. */
const TREE_META = [
  { slug: 'binary-tree-inorder-traversal', title: 'Binary Tree Inorder Traversal', paramNames: ['root'] },
  { slug: 'maximum-depth-of-binary-tree', title: 'Maximum Depth of Binary Tree', paramNames: ['root'] },
  { slug: 'symmetric-tree', title: 'Symmetric Tree', paramNames: ['root'] },
  { slug: 'same-tree', title: 'Same Tree', paramNames: ['p', 'q'], adapt: treeAdaptLines('Same Tree', 2) },
  { slug: 'path-sum', title: 'Path Sum', paramNames: ['root', 'target'], adapt: treeAdaptLines('Path Sum', 1) },
  { slug: 'binary-tree-level-order-traversal', title: 'Binary Tree Level Order Traversal', paramNames: ['root'] },
  { slug: 'validate-binary-search-tree', title: 'Validate Binary Search Tree', paramNames: ['root'] },
  { slug: 'binary-tree-maximum-path-sum', title: 'Binary Tree Maximum Path Sum', paramNames: ['root'] },
];

/** Finish one authored tree record into the full CodingProblem payload shape. */
function finishTreeRecord(meta) {
  const rec = TREE_RECORDS.find((r) => r.slug === meta.slug);
  if (!rec) throw new Error(`authoredDsaBatch1: no authored tree record for "${meta.slug}"`);
  if (rec.title !== meta.title) throw new Error(`authoredDsaBatch1: title mismatch for "${meta.slug}"`);
  const name = rec.signature && rec.signature.javascript && rec.signature.javascript.name;
  if (!name || !rec.referenceBody.includes(`function ${name}(`)) {
    throw new Error(`authoredDsaBatch1: referenceBody/signature mismatch for "${rec.title}"`);
  }
  const adapt = meta.adapt || treeAdaptFactory(rec.title);
  const tests = solverFixtures(rec.title, adapt);
  const all = tests.sampleTests.concat(tests.hiddenTests);
  const m = metaRow(rec.title);
  const topics = dedupeTopics(m.topic, m.tags);
  return {
    slug: rec.slug,
    title: rec.title,
    provenance: {
      source: 'S',
      ref: `scripts/testCaseGenerators.js SOLVERS["${rec.title}"]`,
      note: 'semantics + all 53 fixtures from the reviewed solver (level-order re-encoding asserted lossless at fixture build); description/signature/starter/reference authored from that semantics; difficulty/topic/tags from (M) with case-insensitive dedupe',
    },
    description: rec.description,
    difficulty: m.difficulty,
    topic: topics.topic,
    tags: topics.tags,
    constraints: treeConstraints(all),
    examples: examplesFromTests(all, meta.paramNames, 3),
    sampleTests: tests.sampleTests,
    hiddenTests: tests.hiddenTests,
    starterCode: rec.starter,
    functionSignature: rec.signature,
    referenceSolution: {
      code: TREE_PREAMBLE.javascript + '\n' + rec.referenceBody + `\nconst solve = ${name};\n`,
      language: 'javascript',
    },
    timeLimitMs: 2000,
    memoryLimitKb: 256000,
  };
}

/** Build one (L)/(C) record from its spec + in-repo sources. */
function buildSourcedRecord(spec) {
  const e = legacyEntry(spec.title);
  const c = spec.sigsFromCurated ? CURATED[spec.title] : null;
  if (spec.sigsFromCurated && (!c || !c.functionSignature)) {
    throw new Error(`authoredDsaBatch1: no (C) curated entry for "${spec.title}"`);
  }
  const sigs = Object.assign({}, spec.sigs || c.functionSignature, spec.sigsOverride || undefined);
  const starterCode = typedStarters(sigs);
  const built = spec.buildTests(e, c || {});
  if (!built || !Array.isArray(built.samples) || !Array.isArray(built.hidden)) {
    throw new Error(`authoredDsaBatch1: buildTests failed for "${spec.title}"`);
  }
  const m = metaRow(spec.title);
  const topics = dedupeTopics(m.topic, m.tags);
  const content = c
    ? { description: c.desc, constraints: c.constraints, examples: c.examples }
    : { description: e.description, constraints: e.constraints, examples: e.examples };
  return {
    slug: slugify(spec.title),
    title: spec.title,
    provenance: {
      source: spec.source,
      ref: c
        ? `scripts/curatedProblems.js CURATED["${spec.title}"] + scripts/seedCodingProblems.js codingProblems["${spec.title}"]`
        : `scripts/seedCodingProblems.js codingProblems["${spec.title}"]`,
      note: spec.refNote,
    },
    description: content.description,
    difficulty: m.difficulty,
    topic: topics.topic,
    tags: topics.tags,
    constraints: content.constraints,
    examples: content.examples,
    sampleTests: built.samples.map((t, i) => ({
      input: t.input, output: t.output, explanation: `Sample test case ${i + 1}`,
    })),
    hiddenTests: built.hidden.map((t, i) => ({
      input: t.input, output: t.output, category: ['edge', 'stress', 'random'][i % 3],
    })),
    starterCode,
    functionSignature: sigs,
    referenceSolution: {
      // The in-process reference path looks up `solve`, while the sandbox driver
      // invokes the signature's own name; expose both (function declaration +
      // top-level alias) so either path can execute this reference.
      code: sigs.javascript.name === 'solve'
        ? spec.reference
        : `${spec.reference}\nconst ${sigs.javascript.name} = solve;\n`,
      language: 'javascript',
    },
    timeLimitMs: e.timeLimitMs || 2000,
    memoryLimitKb: e.memoryLimitKb || 256000,
  };
}

/** Canonical Batch 1 order: the eight (S) records then the eight (L)/(C) ones. */
const BATCH_TITLES = [
  'Binary Tree Inorder Traversal', 'Maximum Depth of Binary Tree', 'Symmetric Tree', 'Same Tree',
  'Path Sum', 'Binary Tree Level Order Traversal', 'Validate Binary Search Tree',
  'Binary Tree Maximum Path Sum', 'Merge Two Sorted Lists', 'Word Ladder', 'Linked List Cycle',
  'Reverse Linked List', 'Number of Islands', 'Course Schedule', 'Binary Search',
  'Palindrome Partitioning',
];

/** Structural fail-closed contract. The full audit replica (placeholder text,
 *  fence balance, ...) lives in scripts/validateAuthoredDsaBatch1.js. */
function assertRecordShape(r) {
  const problems = [];
  if (!r.slug || slugify(r.title) !== r.slug) problems.push('slug/title mismatch');
  if (!r.description || String(r.description).trim().length < 40) problems.push('description too short');
  if (!['easy', 'medium', 'hard'].includes(String(r.difficulty || '').toLowerCase())) problems.push('difficulty invalid');
  if (!r.topic || !Array.isArray(r.tags)) problems.push('topic/tags missing');
  else {
    const lower = [r.topic, ...r.tags].map((x) => String(x).toLowerCase().trim());
    if (new Set(lower).size !== lower.length) problems.push('duplicate topics remain');
    if (lower.some((x) => !x)) problems.push('empty topic entry');
  }
  if (!Array.isArray(r.constraints) || r.constraints.length === 0) problems.push('constraints empty');
  else if (r.constraints.some((x) => !String(x || '').trim())) problems.push('empty constraint entry');
  if (!Array.isArray(r.examples) || r.examples.length === 0) problems.push('examples empty');
  else if (r.examples.some((x) => !x || x.input === undefined || x.output === undefined)) problems.push('examples malformed');
  if (!Array.isArray(r.sampleTests) || r.sampleTests.length < 1) problems.push('sampleTests empty');
  if (!Array.isArray(r.hiddenTests) || r.hiddenTests.length < 1) problems.push('hiddenTests empty');
  for (const t of (r.sampleTests || []).concat(r.hiddenTests || [])) {
    if (!t || t.input === undefined || t.input === null || String(t.input).trim() === '') problems.push('empty test input');
    if (!t || t.output === undefined || t.output === null || String(t.output).trim() === '') problems.push('empty test output');
  }
  if (new Set((r.sampleTests || []).map((t) => String(t.input))).size !== (r.sampleTests || []).length) {
    problems.push('duplicate sample inputs');
  }
  for (const lang of ['javascript', 'python', 'java', 'cpp']) {
    if (!r.starterCode || !String(r.starterCode[lang] || '').trim()) problems.push('starterCode missing: ' + lang);
    const s = r.functionSignature && r.functionSignature[lang];
    if (!s || !s.name || !Array.isArray(s.params) || !s.returnType) problems.push('functionSignature invalid: ' + lang);
  }
  if (!r.referenceSolution || !r.referenceSolution.code) problems.push('referenceSolution missing');
  if (!(Number(r.timeLimitMs) > 0) || !(Number(r.memoryLimitKb) > 0)) problems.push('limits invalid');
  if (problems.length) {
    throw new Error(`authoredDsaBatch1: record "${r.title}" invalid: ${problems.join('; ')}`);
  }
}

function buildRecords() {
  const built = TREE_META.map(finishTreeRecord).concat(SOURCED_SPECS.map(buildSourcedRecord));
  const byTitle = new Map();
  for (const r of built) {
    if (byTitle.has(r.title)) throw new Error(`authoredDsaBatch1: duplicate record "${r.title}"`);
    byTitle.set(r.title, r);
  }
  const ordered = BATCH_TITLES.map((t) => {
    const r = byTitle.get(t);
    if (!r) throw new Error(`authoredDsaBatch1: record "${t}" was not built`);
    return r;
  });
  for (const r of ordered) assertRecordShape(r);
  return ordered;
}

const records = buildRecords();

module.exports = {
  BATCH_TITLES,
  records,
  TREE_RECORDS,
  provenance: records.map((r) => ({
    title: r.title, slug: r.slug, source: r.provenance.source,
    ref: r.provenance.ref, note: r.provenance.note,
  })),
  _internals: {
    slugify, dedupeTopics, loadLiteralArray, legacyEntry, metaRow, assertRecordShape,
    LEGACY_ENTRIES, META_ROWS, TREE_META, SOURCED_SPECS,
  },
};

