/**
 * authoredDsaBatch4.js
 * ---------------------------------------------------------------------------
 * BATCH 4 of the canonical DSA content repair: the TWO records that remain
 * reconstructable from legitimate project-local ground truth after Batches 1-3.
 *
 * PROVENANCE — one source, used verbatim:
 *   (S1) git edbc6db: server/scripts/seedDSA100.js.backup   (REVIEWED section)
 *        Reviewed historical seed. For both records it carries a complete
 *        contract: description, difficulty, topic, tags, constraints,
 *        inputFormat, outputFormat, a typed per-language functionSignature,
 *        per-language starterCode, sample tests and 50 hidden tests.
 *        The file's later "ADDITIONAL PROBLEMS" tail (the known-corrupt section:
 *        Math.random() generators, hard-coded wrong outputs, string-typed
 *        signatures) is cut off before parsing and can never contribute a
 *        record. Every field shipped here is copied from the reviewed section
 *        into scripts/authoredDsaBatch4.source.json by server/_b4_extract.js and
 *        is re-verified against the blob by validateAuthoredDsaBatch4.js.
 *
 * These two records are the ONLY titles shared between that file and the
 * canonical bank that Batch 3 did not already author with a fully reproducible
 * fixture set. (Intersection of Two Linked Lists is present there too, but 50 of
 * its 51 fixtures are corrupt and no independent implementation reproduces them,
 * so it is deliberately NOT authored.)
 *
 * DRIVER ADAPTATION (identical to the one Batch 1 proved for its eight tree
 * records, and the reason this batch can exist at all):
 *   The source declares the parameter type `TreeNode`. The merged
 *   /api/coding/submit pipeline feeds ONE line-based stdin string per parameter
 *   to the per-language driver, and a nested node object is not representable.
 *   The source's OWN fixtures already encode trees as level-order JSON arrays
 *   ("[1,null,2,3]"), so the typed parameter is the array form:
 *     javascript number[] | python List[int] | java String[] | cpp string
 *   and the starter ships the proven TREE_PREAMBLE (TreeNode +
 *   buildTree/build_tree) so the learner only writes the algorithm. Tree
 *   semantics are unchanged.
 *
 * FIXTURE POLICY (the Batch 3 ADMIT rule, unchanged):
 *   A source fixture is ADMITTED only when TWO INDEPENDENT implementations
 *   (a: recursive/DFS, b: iterative) each reproduce the source's stored expected
 *   output. Every other fixture is DROPPED with a recorded reason and never
 *   reaches the database — the source's generated hidden tests are partly
 *   corrupt (e.g. stored "[9,11]" for the input "[9,10,11]"), so blind
 *   preservation is impossible. Nothing is invented: a dropped fixture is
 *   replaced by nothing.
 * ---------------------------------------------------------------------------
 */
'use strict';

const SRC = require('./authoredDsaBatch4.source.json');
const B3 = require('./authoredDsaBatch3');

/* The proven structural replica of full_audit.js auditDsa (Batch 3), reused so
 * Batch 4 is checked by exactly the same contract. */
const auditReplica = B3.auditReplica;
const slugify = B3.slugify;

const BATCH_TITLES = [
  'Binary Tree Preorder Traversal',
  'Minimum Depth of Binary Tree',
];

/* Canonical [title -> slug] identity, verified against the live bank. */
const CANONICAL = {
  'Binary Tree Preorder Traversal': 'binary-tree-preorder-traversal',
  'Minimum Depth of Binary Tree': 'minimum-depth-of-binary-tree',
};

/* ------------------------------------------------------------------ preamble
 * Copied verbatim from scripts/authoredDsaBatch1.js TREE_PREAMBLE (the preamble
 * that Batch 1's validator compiled and executed in all four languages).
 * `root` is a level-order array; null marks a missing child.
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

/* --------------------------------------------------- independent references */
/** Level-order array -> plain node chain (module-local, mirrors the preamble). */
function fromLevel(levelOrder) {
  if (!Array.isArray(levelOrder) || levelOrder.length === 0 || levelOrder[0] === null) return null;
  const nodes = levelOrder.map((v) => (v === null || v === undefined ? null : { val: v, left: null, right: null }));
  let j = 1;
  for (let i = 0; i < nodes.length && j < nodes.length; i++) {
    if (!nodes[i]) continue;
    nodes[i].left = nodes[j++] || null;
    if (j < nodes.length) nodes[i].right = nodes[j++] || null;
  }
  return nodes[0];
}

const preorderRecursive = (root) => {
  const out = [];
  (function visit(n) { if (!n) return; out.push(n.val); visit(n.left); visit(n.right); })(fromLevel(root));
  return out;
};
const preorderIterative = (root) => {
  const out = [];
  const stack = [];
  const t = fromLevel(root);
  if (t) stack.push(t);
  while (stack.length) {
    const n = stack.pop();
    out.push(n.val);
    if (n.right) stack.push(n.right);
    if (n.left) stack.push(n.left);
  }
  return out;
};

const depthRecursive = (n) => {
  if (!n) return 0;
  if (!n.left && !n.right) return 1;
  return 1 + Math.min(n.left ? depthRecursive(n.left) : Infinity, n.right ? depthRecursive(n.right) : Infinity);
};
const minDepthRecursive = (root) => depthRecursive(fromLevel(root));
const minDepthBfs = (root) => {
  const t = fromLevel(root);
  if (!t) return 0;
  let level = [t];
  let d = 1;
  while (level.length) {
    const next = [];
    for (const n of level) {
      if (!n.left && !n.right) return d;
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    level = next;
    d += 1;
  }
  return d;
};

/** title -> [implementation a, implementation b] (must agree, or a fixture drops). */
const IMPL = {
  'Binary Tree Preorder Traversal': { a: preorderRecursive, b: preorderIterative },
  'Minimum Depth of Binary Tree': { a: minDepthRecursive, b: minDepthBfs },
};

/* ------------------------------------------------------------- signatures */
/** L(name, [[paramName, type], ...], returnType) -> FunctionSignature */
const L = (name, params, returnType) => ({
  name,
  params: params.map(([pName, pType]) => ({ name: pName, type: pType })),
  returnType,
});

/* The source's own tree parameter is the level-order array it already stores in
 * every fixture; java/cpp receive the tokens/text form because neither driver
 * helper can represent a missing child (Batch 1's proven convention). */
const SIGNATURES = {
  'Binary Tree Preorder Traversal': {
    javascript: L('preorderTraversal', [['root', 'number[]']], 'number[]'),
    python: L('preorderTraversal', [['root', 'List[int]']], 'List[int]'),
    java: L('preorderTraversal', [['root', 'String[]']], 'List<Integer>'),
    cpp: L('preorderTraversal', [['root', 'string']], 'vector<int>'),
  },
  'Minimum Depth of Binary Tree': {
    javascript: L('minDepth', [['root', 'number[]']], 'number'),
    python: L('minDepth', [['root', 'List[int]']], 'int'),
    java: L('minDepth', [['root', 'String[]']], 'int'),
    cpp: L('minDepth', [['root', 'string']], 'int'),
  },
};

/* --------------------------------------------------- learner skeletons */
const STARTER_BODY = {
  'Binary Tree Preorder Traversal': {
    javascript: `function preorderTraversal(root) {
  const tree = buildTree(root);

  return [];
}`,
    python: `def preorderTraversal(root):
    tree = build_tree(root)

    return []`,
    java: `    public List<Integer> preorderTraversal(String[] root) {
        TreeNode tree = buildTree(root);

        return new ArrayList<>();
    }
`,
    cpp: `vector<int> preorderTraversal(string root) {
    TreeNode* tree = buildTree(root);

    return {};
}`,
  },
  'Minimum Depth of Binary Tree': {
    javascript: `function minDepth(root) {
  const tree = buildTree(root);

  return 0;
}`,
    python: `def minDepth(root):
    tree = build_tree(root)

    return 0`,
    java: `    public int minDepth(String[] root) {
        TreeNode tree = buildTree(root);

        return 0;
    }
`,
    cpp: `int minDepth(string root) {
    TreeNode* tree = buildTree(root);

    return 0;
}`,
  },
};

/** Reviewed per-language reference bodies (composed with the tree preamble). */
const REFERENCE_BODY = {
  'Binary Tree Preorder Traversal': {
    javascript: `function preorderTraversal(root) {
  const tree = buildTree(root);
  const out = [];
  const visit = (node) => {
    if (!node) return;
    out.push(node.val);
    visit(node.left);
    visit(node.right);
  };
  visit(tree);
  return out;
}`,
    python: `def preorderTraversal(root):
    tree = build_tree(root)
    out = []
    stack = [tree] if tree is not None else []
    while stack:
        node = stack.pop()
        out.append(node.val)
        if node.right is not None:
            stack.append(node.right)
        if node.left is not None:
            stack.append(node.left)
    return out`,
    java: `    public List<Integer> preorderTraversal(String[] root) {
        TreeNode tree = buildTree(root);
        List<Integer> out = new ArrayList<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        if (tree != null) stack.push(tree);
        while (!stack.isEmpty()) {
            TreeNode node = stack.pop();
            out.add(node.val);
            if (node.right != null) stack.push(node.right);
            if (node.left != null) stack.push(node.left);
        }
        return out;
    }
`,
    cpp: `vector<int> preorderTraversal(string root) {
    TreeNode* tree = buildTree(root);
    vector<int> out;
    vector<TreeNode*> stack;
    if (tree) stack.push_back(tree);
    while (!stack.empty()) {
        TreeNode* node = stack.back();
        stack.pop_back();
        out.push_back(node->val);
        if (node->right) stack.push_back(node->right);
        if (node->left) stack.push_back(node->left);
    }
    return out;
}`,
  },
  'Minimum Depth of Binary Tree': {
    javascript: `function minDepth(root) {
  const tree = buildTree(root);
  if (!tree) return 0;
  let level = [tree];
  let depth = 1;
  while (level.length) {
    const next = [];
    for (const node of level) {
      if (!node.left && !node.right) return depth;
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    level = next;
    depth += 1;
  }
  return depth;
}`,
    python: `def minDepth(root):
    tree = build_tree(root)
    if tree is None:
        return 0
    level = [tree]
    depth = 1
    while level:
        nxt = []
        for node in level:
            if node.left is None and node.right is None:
                return depth
            if node.left is not None:
                nxt.append(node.left)
            if node.right is not None:
                nxt.append(node.right)
        level = nxt
        depth += 1
    return depth`,
    java: `    public int minDepth(String[] root) {
        TreeNode tree = buildTree(root);
        if (tree == null) return 0;
        List<TreeNode> level = new ArrayList<>();
        level.add(tree);
        int depth = 1;
        while (!level.isEmpty()) {
            List<TreeNode> next = new ArrayList<>();
            for (TreeNode node : level) {
                if (node.left == null && node.right == null) return depth;
                if (node.left != null) next.add(node.left);
                if (node.right != null) next.add(node.right);
            }
            level = next;
            depth++;
        }
        return depth;
    }
`,
    cpp: `int minDepth(string root) {
    TreeNode* tree = buildTree(root);
    if (!tree) return 0;
    vector<TreeNode*> level;
    level.push_back(tree);
    int depth = 1;
    while (!level.empty()) {
        vector<TreeNode*> next;
        for (size_t i = 0; i < level.size(); i++) {
            TreeNode* node = level[i];
            if (!node->left && !node->right) return depth;
            if (node->left) next.push_back(node->left);
            if (node->right) next.push_back(node->right);
        }
        level = next;
        depth++;
    }
    return depth;
}`,
  },
};

/** Compose the shared tree preamble with a body (same shape as Batch 1). */
function compose(title, bodies) {
  const b = bodies[title];
  if (!b) throw new Error(`authoredDsaBatch4: no body for "${title}"`);
  return {
    javascript: TREE_PREAMBLE.javascript + '\n' + b.javascript + '\n',
    python: TREE_PREAMBLE.python + '\n\n' + b.python + '\n',
    java: TREE_PREAMBLE.java + b.java + '}\n',
    cpp: TREE_PREAMBLE.cpp + '\n' + b.cpp + '\n',
  };
}

/** All four learner templates for a record. */
function starterCode(title) { return compose(title, STARTER_BODY); }

/** All four reference solutions for a record (used by the validator). */
function referencesFor(title) { return compose(title, REFERENCE_BODY); }

/** The self-contained JavaScript reference stored in referenceSolution.code. */
function javascriptReference(title) {
  const name = SIGNATURES[title].javascript.name;
  return TREE_PREAMBLE.javascript + '\n' + REFERENCE_BODY[title].javascript + `\nconst solve = ${name};\n`;
}

/* -------------------------------------------------------------- source glue */
function source(title) {
  const s = SRC[title];
  if (!s) throw new Error(`authoredDsaBatch4: no source record for "${title}"`);
  if (!s.description || !s.functionSignature || !s.functionSignature.javascript) {
    throw new Error(`authoredDsaBatch4: incomplete source for "${title}"`);
  }
  return s;
}

/** Literal backslash-n -> real newline (the seed files' escaping convention). */
const decodeLiteralNewlines = (s) => String(s == null ? '' : s).split('\\n').join('\n');

/** The single level-order JSON array line of a fixture input. */
function parseInput(input) {
  const text = decodeLiteralNewlines(input).trim();
  const line = text.split(/\r?\n/)[0].trim();
  return JSON.parse(line);
}

/* ------------------------------------------------------------------ fixtures */
/**
 * Re-derive every source fixture with the two independent implementations.
 * ADMIT only when a === b === stored; everything else is DROPPED with a reason.
 */
function buildTests(title) {
  const s = source(title);
  const impl = IMPL[title];
  const samples = [];
  const hidden = [];
  const dropped = [];
  const admit = (tc, bucket) => {
    const fail = (reason) => dropped.push({ input: String(tc.input), output: String(tc.output), reason });
    let arr;
    try { arr = parseInput(tc.input); } catch (e) { fail('input is not a JSON level-order array: ' + e.message); return; }
    if (!Array.isArray(arr)) { fail('input is not an array'); return; }
    let a;
    let b;
    try { a = JSON.stringify(impl.a(arr)); b = JSON.stringify(impl.b(arr)); } catch (e) { fail('implementation error: ' + e.message); return; }
    if (a !== b) { fail(`independent implementations disagree (a=${a}, b=${b})`); return; }
    if (a !== String(tc.output)) { fail(`stored expected output not reproducible (both implementations produce ${a})`); return; }
    const rec = { input: decodeLiteralNewlines(tc.input).trim(), output: String(tc.output) };
    if (tc.explanation) rec.explanation = tc.explanation;
    bucket.push(rec);
  };
  for (const tc of s.sampleTests || []) admit(tc, samples);
  for (const tc of s.hiddenTests || []) admit(tc, hidden);
  return { samples, hidden, dropped };
}

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

const PROVENANCE_REF = (title) =>
  `scripts/authoredDsaBatch4.source.json["${title}"] <- git edbc6db: server/scripts/seedDSA100.js.backup (reviewed section)`;

/** Build the canonical-shape record for one Batch 4 title. */
function buildRecord(title) {
  const s = source(title);
  const sig = SIGNATURES[title];
  const { samples, hidden, dropped } = buildTests(title);
  const tt = dedupeTopics(s.topic, s.tags);
  const srcConstraint = (s.inputFormat && s.inputFormat[0] && s.inputFormat[0].constraints) || null;
  return {
    title,
    slug: CANONICAL[title],
    description: s.description,
    difficulty: s.difficulty,
    topic: tt.topic,
    tags: tt.tags,
    companies: s.companies || [],
    constraints: s.constraints,
    examples: samples.map((t) => ({ input: `root = ${t.input}`, output: t.output })),
    sampleTests: samples,
    hiddenTests: hidden,
    inputFormat: [{
      paramName: 'root',
      type: sig.javascript.params[0].type,
      constraints: srcConstraint || 'See constraints',
    }],
    outputFormat: s.outputFormat,
    functionSignature: sig,
    starterCode: starterCode(title),
    referenceSolution: { code: javascriptReference(title), language: 'javascript' },
    timeLimitMs: s.difficulty === 'hard' ? 3000 : s.difficulty === 'medium' ? 2000 : 1500,
    memoryLimitKb: 256000,
    provenance: {
      source: 'S1',
      ref: PROVENANCE_REF(title),
      note: 'description/constraints/inputFormat/outputFormat/signature/starterCode/sample+hidden copied from the reviewed historical seed; the TreeNode parameter is adapted to the level-order array the source fixtures already use (Batch 1 convention); every admitted fixture is reproduced by two independent implementations; non-reproducible fixtures are dropped, not repaired.',
      dropped,
    },
  };
}

/* --------------------------------------------------------------------- build */
const records = BATCH_TITLES.map((t) => {
  const r = buildRecord(t);
  const issues = auditReplica(r);
  if (issues.length) {
    throw new Error(`authoredDsaBatch4: "${t}" fails the structural contract: ${issues.join(' | ')}`);
  }
  return r;
});

/* ------------------------------------------------------------------- guards */
if (BATCH_TITLES.length !== 2) throw new Error('authoredDsaBatch4: Batch 4 authors exactly 2 records');

const BATCH1_TITLES = require('./authoredDsaBatch1').BATCH_TITLES;
const BATCH2_TITLES = require('./authoredDsaBatch2').BATCH_TITLES;
const BATCH3_TITLES = B3.BATCH_TITLES;
for (const t of BATCH_TITLES) {
  if (BATCH1_TITLES.includes(t)) throw new Error(`authoredDsaBatch4: "${t}" is a Batch 1 record`);
  if (BATCH2_TITLES.includes(t)) throw new Error(`authoredDsaBatch4: "${t}" is a Batch 2 record`);
  if (BATCH3_TITLES.includes(t)) throw new Error(`authoredDsaBatch4: "${t}" is a Batch 3 record`);
}
if (BATCH1_TITLES.length !== 16) throw new Error('authoredDsaBatch4: Batch 1 title set changed');
if (BATCH2_TITLES.length !== 8) throw new Error('authoredDsaBatch4: Batch 2 title set changed');
if (BATCH3_TITLES.length !== 13) throw new Error('authoredDsaBatch4: Batch 3 title set changed');
if (new Set([...BATCH1_TITLES, ...BATCH2_TITLES, ...BATCH3_TITLES, ...BATCH_TITLES]).size !== 39) {
  throw new Error('authoredDsaBatch4: the four authored batches must be 39 disjoint titles');
}
for (const r of records) {
  if (r.slug !== slugify(r.title)) throw new Error(`authoredDsaBatch4: slug mismatch for "${r.title}"`);
}
if (new Set(records.map((r) => r.slug)).size !== records.length) {
  throw new Error('authoredDsaBatch4: duplicate slug in payload');
}

module.exports = {
  BATCH_TITLES,
  records,
  auditReplica,
  slugify,
  starterCode,
  referencesFor,
  javascriptReference,
  buildTests,
  buildRecord,
  source,
  _internals: { CANONICAL, SIGNATURES, IMPL, TREE_PREAMBLE, decodeLiteralNewlines, dedupeTopics, parseInput },
};
