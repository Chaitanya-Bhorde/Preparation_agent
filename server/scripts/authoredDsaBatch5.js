/**
 * authoredDsaBatch5.js
 * ---------------------------------------------------------------------------
 * BATCH 5 of the canonical DSA content repair: the ONE remaining record that a
 * complete, project-local source scan proves recoverable.
 *
 * PROVENANCE — one source, used verbatim:
 *   (S1) git edbc6db: server/scripts/seedDSA100.js.backup   (REVIEWED section)
 *        Reviewed historical seed. For "Min Stack" it carries a complete
 *        contract: description, difficulty, topic, tags, companies,
 *        constraints, inputFormat, outputFormat, a typed per-language
 *        functionSignature, per-language starterCode, 3 sample tests and 50
 *        hidden tests.
 *        The file's later "// ===== ADDITIONAL PROBLEMS =====" tail is the
 *        known-corrupt section (wrong inputFormat schema, string-typed
 *        signatures, Math.random() generators, hard-coded wrong outputs). It is
 *        cut off before parsing and can never contribute a record.
 *        Every field shipped here is copied from the reviewed section into
 *        scripts/authoredDsaBatch5.source.json by server/_b5_extract.js, which
 *        EVALUATES the seed so its sig()/starter() helpers expand into real
 *        typed per-language objects, and is re-verified against the blob by
 *        validateAuthoredDsaBatch5.js.
 *
 * WHY THIS IS THE ONLY RECORD IN THE BATCH
 *   server/_inv_final.js classifies all 187 remaining audit failures against
 *   every project-local source (3094 git blobs, 767 working-tree files, the
 *   live DB, CURATED, SOLVERS, seedData.js, both historical seeds):
 *     A (source verified) = 1  -> Min Stack
 *     B (partial source)  = 3  -> Kth Largest Element in Stream,
 *                                  Intersection of Two Linked Lists, LRU Cache
 *     C (content source)  = 183
 *   Batches 1-4 already authored 39 of the previously-recoverable records, so
 *   Min Stack is the only one left with a complete, non-contradictory contract.
 *
 * DRIVER ADAPTATION (the same class of adaptation Batch 1 proved for its tree
 * records, and the reason this batch can exist at all)
 *   The source's signature under-declares what its OWN fixtures require:
 *     * fixtures are TWO stdin lines - the operation list, then one argument
 *       list per operation - but the source declares a single `ops` parameter.
 *       The platform driver feeds ONE line-based stdin string per declared
 *       parameter, so the argument line would be silently dropped and every
 *       fixture would be unrunnable. The signature is therefore widened to the
 *       two parameters the source's own fixtures already use:
 *         javascript  ops: string[]   opArgs: number[][]
 *         python      ops: List[str]  opArgs: List[List[int]]
 *         java        ops: String[]   opArgs: int[][]
 *         cpp         ops: string     opArgs: vector<vector<int>>
 *       (C++ takes `ops` as the raw line because the C++ driver's
 *       parseStringArray splits on whitespace, not on commas, so a
 *       comma-separated JSON array is not representable there; the starter
 *       ships a small PREAMBLE helper that parses it, exactly as Batch 1's tree
 *       records ship buildTree.)
 *     * the source's stored expected output is ONE JSON text whose elements are
 *       `null` or an integer, e.g. "[null,null,null,null,-3,null,0,-2]". No
 *       array-of-strings representation can reproduce that byte-for-byte in all
 *       four languages (Java prints "null" via Arrays.toString, C++ cannot
 *       hold a null in vector<string>). The function therefore returns that
 *       JSON text directly, and outputsMatch() then applies strict trimmed
 *       string equality:
 *         javascript string | python str | java String | cpp string
 *       The bytes the judge compares are identical to the source's stored
 *       expected output; the problem's semantics are unchanged.
 *
 * FIXTURE POLICY (the Batch 3/4 ADMIT rule, unchanged):
 *   A source fixture is ADMITTED only when TWO INDEPENDENT implementations
 *   (a: single array + min scan, b: parallel value/min stacks) each reproduce
 *   the source's stored expected output. Every other fixture is DROPPED with a
 *   recorded reason and never reaches the database. Of the source's 53
 *   fixtures, 52 are admitted and 1 is dropped: sample 3 stores 4 result
 *   entries for a 5-operation input, so it is arithmetically impossible. It is
 *   NOT replaced by an invented fixture.
 * ---------------------------------------------------------------------------
 */
'use strict';

const SRC = require('./authoredDsaBatch5.source.json');
const B4 = require('./authoredDsaBatch4');

/* The proven structural replica of full_audit.js auditDsa (Batch 3 -> Batch 4). */
const auditReplica = B4.auditReplica;
const slugify = B4.slugify;

const BATCH_TITLES = ['Min Stack'];

/* Canonical [title -> slug] identity, verified against the live bank. */
const CANONICAL = { 'Min Stack': 'min-stack' };


/* ------------------------------------------------------------------ preamble
 * Shipped with the starter so the learner only writes the algorithm.
 * Only C++ and Java need it: the C++ driver cannot split a comma-separated
 * JSON array of strings, and the Java driver already parses `ops` correctly.
 */
const PREAMBLE = {
  cpp: `// Splits a raw JSON array line such as ["MinStack","push","getMin"]
// into its quoted elements. Provided for you: use parseOps(ops) to get the
// operation list.
static vector<string> parseOps(const string& raw) {
    vector<string> out;
    string s;
    for (char c : raw) {
        if (c == '"') continue;
        if (c == '[' || c == ']') continue;
        s += c;
    }
    stringstream ss(s);
    string item;
    while (getline(ss, item, ',')) {
        string t;
        for (char c : item) if (!isspace((unsigned char)c)) t += c;
        out.push_back(t);
    }
    return out;
}
`,
  java: '',
  javascript: '',
  python: '',
};

/* The adapted, typed per-language signature (see DRIVER ADAPTATION above). */
const SIGNATURES = {
  'Min Stack': {
    javascript: { name: 'MinStack', params: [{ name: 'ops', type: 'string[]' }, { name: 'opArgs', type: 'number[][]' }], returnType: 'string' },
    python: { name: 'MinStack', params: [{ name: 'ops', type: 'List[str]' }, { name: 'opArgs', type: 'List[List[int]]' }], returnType: 'str' },
    java: { name: 'MinStack', params: [{ name: 'ops', type: 'String[]' }, { name: 'opArgs', type: 'int[][]' }], returnType: 'String' },
    cpp: { name: 'MinStack', params: [{ name: 'ops', type: 'string' }, { name: 'opArgs', type: 'vector<vector<int>>' }], returnType: 'string' },
  },
};

/* --------------------------------------------- two independent implementations
 * a: one array of values; getMin rescans it.
 * b: a values stack and a parallel running-minimum stack; getMin reads the top
 *    of the minimum stack. Different data structures, same defined value, so a
 *    fixture is only admitted when BOTH reproduce the stored expected output. */
const IMPL = {
  'Min Stack': {
    a: (ops, opArgs) => {
      const st = [], out = [];
      for (let i = 0; i < ops.length; i++) {
        const op = ops[i];
        if (op === 'MinStack') out.push(null);
        else if (op === 'push') { st.push(opArgs[i][0]); out.push(null); }
        else if (op === 'pop') { st.pop(); out.push(null); }
        else if (op === 'top') out.push(st[st.length - 1]);
        else if (op === 'getMin') out.push(Math.min.apply(null, st));
        else throw new Error('unknown operation: ' + op);
      }
      return out;
    },
    b: (ops, opArgs) => {
      const vals = [], mins = [], out = [];
      for (let i = 0; i < ops.length; i++) {
        const op = ops[i];
        if (op === 'MinStack') out.push(null);
        else if (op === 'push') {
          const v = opArgs[i][0];
          vals.push(v);
          mins.push(mins.length ? Math.min(v, mins[mins.length - 1]) : v);
          out.push(null);
        } else if (op === 'pop') { vals.pop(); mins.pop(); out.push(null); }
        else if (op === 'top') out.push(vals[vals.length - 1]);
        else if (op === 'getMin') out.push(mins[mins.length - 1]);
        else throw new Error('unknown operation: ' + op);
      }
      return out;
    },
  },
};


/* ------------------------------------------------------------ starter bodies
 * A skeleton that compiles in all four languages and names the contract. The
 * audit only *reviews* TODO/FIXME/NotImplemented markers, and none appear. */
const STARTER_BODY = {
  'Min Stack': {
    javascript: `// Min Stack - return the JSON array of per-operation results.
//
//   ops   : string[]   e.g. ["MinStack","push","getMin","pop","top"]
//   opArgs  : number[][] one entry per operation; [] for operations that take
//                      no value, otherwise a single-element list [value]
//
// Return the results as a JSON array text, e.g. "[null,null,null,-3]":
//   "MinStack", "push", "pop" -> null
//   "top"                      -> the value currently on top
//   "getMin"                   -> the smallest value currently in the stack
function MinStack(ops, opArgs) {
  const results = [];

  return '[' + results.join(',') + ']';
}
`,
    python: `# Min Stack - return the JSON array of per-operation results.
#
#   ops   : List[str]           e.g. ["MinStack", "push", "getMin"]
#   opArgs  : List[List[int]]     one entry per operation; [] when the operation
#                               takes no value, otherwise [value]
#
# Return the results as a JSON array text, e.g. "[null,null,null,-3]":
#   "MinStack", "push", "pop" -> null
#   "top"                      -> the value currently on top
#   "getMin"                   -> the smallest value currently in the stack
def MinStack(ops, opArgs):
    results = []

    return '[' + ','.join(results) + ']'
`,
    java: `    // Min Stack - return the JSON array of per-operation results.
    //
    //   ops   : String[]    e.g. {"MinStack", "push", "getMin"}
    //   opArgs  : int[][]     one entry per operation; empty when the operation
    //                      takes no value, otherwise a single-element row
    //
    // Return the results as a JSON array text, e.g. "[null,null,null,-3]":
    //   "MinStack", "push", "pop" -> null
    //   "top"                      -> the value currently on top
    //   "getMin"                   -> the smallest value currently in the stack
    public String MinStack(String[] ops, int[][] opArgs) {
        List<String> results = new ArrayList<>();

        return "[" + String.join(",", results) + "]";
    }
`,
    cpp: `// Min Stack - return the JSON array of per-operation results.
//
//   ops   : string              raw JSON array line, use parseOps(ops)
//   opArgs  : vector<vector<int>> one entry per operation; empty when the
//                              operation takes no value, otherwise {value}
//
// Return the results as a JSON array text, e.g. "[null,null,null,-3]":
//   "MinStack", "push", "pop" -> null
//   "top"                      -> the value currently on top
//   "getMin"                   -> the smallest value currently in the stack
string MinStack(string ops, vector<vector<int>> opArgs) {
    vector<string> results;

    string out = "[";
    for (size_t i = 0; i < results.size(); i++) {
        if (i) out += ",";
        out += results[i];
    }
    out += "]";
    return out;
}
`,
  },
};


/* --------------------------------------------------------- reference bodies
 * Used by the validator to execute every admitted fixture through the real
 * drivers. These are the reviewed solutions, not the learner's template. */
const REFERENCE_BODY = {
  'Min Stack': {
    javascript: `function MinStack(ops, opArgs) {
  const values = [];
  const mins = [];
  const results = [];
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op === 'MinStack') {
      results.push(null);
    } else if (op === 'push') {
      const v = opArgs[i][0];
      values.push(v);
      mins.push(mins.length ? Math.min(v, mins[mins.length - 1]) : v);
      results.push(null);
    } else if (op === 'pop') {
      values.pop();
      mins.pop();
      results.push(null);
    } else if (op === 'top') {
      results.push(values[values.length - 1]);
    } else if (op === 'getMin') {
      results.push(mins[mins.length - 1]);
    } else {
      throw new Error('unknown operation: ' + op);
    }
  }
  return '[' + results.map((r) => (r === null ? 'null' : String(r))).join(',') + ']';
}
`,
    python: `def MinStack(ops, opArgs):
    values = []
    mins = []
    results = []
    for i, op in enumerate(ops):
        if op == 'MinStack':
            results.append(None)
        elif op == 'push':
            v = opArgs[i][0]
            values.append(v)
            mins.append(min(v, mins[-1]) if mins else v)
            results.append(None)
        elif op == 'pop':
            values.pop()
            mins.pop()
            results.append(None)
        elif op == 'top':
            results.append(values[-1])
        elif op == 'getMin':
            results.append(mins[-1])
        else:
            raise ValueError('unknown operation: ' + str(op))
    return '[' + ','.join('null' if r is None else str(r) for r in results) + ']'
`,

    java: `    public String MinStack(String[] ops, int[][] opArgs) {
        List<Integer> values = new ArrayList<>();
        List<Integer> mins = new ArrayList<>();
        List<String> results = new ArrayList<>();
        for (int i = 0; i < ops.length; i++) {
            String op = ops[i];
            if (op.equals("MinStack")) {
                results.add("null");
            } else if (op.equals("push")) {
                int v = opArgs[i][0];
                values.add(v);
                mins.add(mins.isEmpty() ? v : Math.min(v, mins.get(mins.size() - 1)));
                results.add("null");
            } else if (op.equals("pop")) {
                values.remove(values.size() - 1);
                mins.remove(mins.size() - 1);
                results.add("null");
            } else if (op.equals("top")) {
                results.add(String.valueOf(values.get(values.size() - 1)));
            } else if (op.equals("getMin")) {
                results.add(String.valueOf(mins.get(mins.size() - 1)));
            } else {
                throw new IllegalArgumentException("unknown operation: " + op);
            }
        }
        return "[" + String.join(",", results) + "]";
    }
`,
    cpp: `string MinStack(string ops, vector<vector<int>> opArgs) {
    vector<string> opList = parseOps(ops);
    vector<int> values;
    vector<int> mins;
    vector<string> results;
    for (size_t i = 0; i < opList.size(); i++) {
        const string& op = opList[i];
        if (op == "MinStack") {
            results.push_back("null");
        } else if (op == "push") {
            int v = opArgs[i][0];
            values.push_back(v);
            mins.push_back(mins.empty() ? v : min(v, mins.back()));
            results.push_back("null");
        } else if (op == "pop") {
            values.pop_back();
            mins.pop_back();
            results.push_back("null");
        } else if (op == "top") {
            results.push_back(to_string(values.back()));
        } else if (op == "getMin") {
            results.push_back(to_string(mins.back()));
        } else {
            throw runtime_error("unknown operation: " + op);
        }
    }
    string out = "[";
    for (size_t i = 0; i < results.size(); i++) {
        if (i) out += ",";
        out += results[i];
    }
    out += "]";
    return out;
}
`,
  },
};


/** Compose a body with the language preamble (same shape as Batch 4). */
function compose(title, bodies) {
  const b = bodies[title];
  if (!b) throw new Error(`authoredDsaBatch5: no body for "${title}"`);
  return {
    javascript: b.javascript,
    python: b.python,
    java: 'import java.util.*;\n\n' + PREAMBLE.java + 'class Solution {\n' + b.java + '}\n',
    cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\n' + PREAMBLE.cpp + '\n' + b.cpp,
  };
}

/** All four learner templates for a record. */
function starterCode(title) { return compose(title, STARTER_BODY); }

/** All four reference solutions for a record (used by the validator). */
function referencesFor(title) { return compose(title, REFERENCE_BODY); }

/** The self-contained JavaScript reference stored in referenceSolution.code. */
function javascriptReference(title) {
  const name = SIGNATURES[title].javascript.name;
  return REFERENCE_BODY[title].javascript + `\nconst solve = ${name};\n`;
}

/* -------------------------------------------------------------- source glue */
function source(title) {
  const s = SRC;
  if (!s) throw new Error(`authoredDsaBatch5: no source record`);
  if (s.title !== title) throw new Error(`authoredDsaBatch5: source title mismatch`);
  if (!s.description || !s.functionSignature || !s.functionSignature.javascript) {
    throw new Error(`authoredDsaBatch5: incomplete source for "${title}"`);
  }
  return s;
}

/** Literal backslash-n -> real newline (the seed files' escaping convention). */
const decodeLiteralNewlines = (s) => String(s == null ? '' : s).split('\\n').join('\n');

/**
 * The two JSON lines of a fixture input: operations, then one arg list per op.
 *
 * PLACEHOLDER NORMALISATION (recorded, not silent):
 *   The source's hidden-test generator wrote the string `""` where an operation
 *   takes no argument, e.g. `[[],[0],[1],"",""]`. That is the same meaning as
 *   `[]` ("no argument"), and every stored expected output is reproduced from
 *   it, but the Java driver's parseIntMatrix calls Integer.parseInt("") and
 *   throws, so the form is not executable there. Every non-array entry is
 *   therefore normalised to `[]` BEFORE the expected output is re-derived, and a
 *   fixture is admitted only if BOTH independent implementations still produce
 *   the source's stored expected output from the normalised input. The
 *   normalised input is what ships, so the bytes the judge compares are still
 *   the source's own stored expected output.
 */
function parseInput(input) {
  const text = decodeLiteralNewlines(input).trim();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length !== 2) throw new Error(`expected 2 input lines, got ${lines.length}`);
  const ops = JSON.parse(lines[0]);
  const rawArgs = JSON.parse(lines[1]);
  if (!Array.isArray(ops)) throw new Error('first line is not a JSON array');
  if (!Array.isArray(rawArgs)) throw new Error('second line is not a JSON array');
  if (ops.length !== rawArgs.length) throw new Error(`ops has ${ops.length} entries but opArgs has ${rawArgs.length}`);
  let normalised = 0;
  const opArgs = rawArgs.map((a) => {
    if (Array.isArray(a)) return a;
    normalised++;
    return [];
  });
  return { ops, opArgs, normalised, canonical: JSON.stringify(ops) + '\n' + JSON.stringify(opArgs) };
}



/* ------------------------------------------------------------------ fixtures
 * Re-derive every source fixture with the two independent implementations.
 * ADMIT only when a === b === stored; everything else is DROPPED with a reason
 * and never reaches the database. Nothing is invented or repaired. */
function buildTests(title) {
  const s = source(title);
  const impl = IMPL[title];
  const samples = [];
  const hidden = [];
  const dropped = [];
  let normalisedEntries = 0;
  const admit = (tc, bucket) => {
    const fail = (reason) => dropped.push({ sourceInput: decodeLiteralNewlines(tc.input).trim(), storedOutput: String(tc.output), reason });
    let parsed;
    try { parsed = parseInput(tc.input); } catch (e) { fail('input is not two JSON lines of equal length: ' + e.message); return; }
    let a, b;
    try { a = JSON.stringify(impl.a(parsed.ops, parsed.opArgs)); b = JSON.stringify(impl.b(parsed.ops, parsed.opArgs)); }
    catch (e) { fail('implementation error: ' + e.message); return; }
    if (a !== b) { fail(`independent implementations disagree (a=${a}, b=${b})`); return; }
    if (a !== String(tc.output)) { fail(`stored expected output not reproducible (both implementations produce ${a}, source stores ${tc.output})`); return; }
    normalisedEntries += parsed.normalised;
    const rec = { input: parsed.canonical, output: String(tc.output) };
    if (tc.explanation) rec.explanation = tc.explanation;
    bucket.push(rec);
  };
  for (const tc of s.sampleTests || []) admit(tc, samples);
  for (const tc of s.hiddenTests || []) admit(tc, hidden);
  return { samples, hidden, dropped, normalisedEntries };
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
  `scripts/authoredDsaBatch5.source.json["${title}"] <- git edbc6db: server/scripts/seedDSA100.js.backup (reviewed section)`;

/** Build the canonical-shape record for one Batch 5 title. */
function buildRecord(title) {
  const s = source(title);
  const sig = SIGNATURES[title];
  const { samples, hidden, dropped, normalisedEntries } = buildTests(title);
  const tt = dedupeTopics(s.topic, s.tags);
  const srcInput = Array.isArray(s.inputFormat) ? s.inputFormat : [];
  return {
    title,
    slug: CANONICAL[title],
    description: s.description,
    difficulty: s.difficulty,
    topic: tt.topic,
    tags: tt.tags,
    companies: s.companies || [],
    constraints: s.constraints,
    examples: samples.map((t) => ({ input: t.input, output: t.output })),
    sampleTests: samples,
    hiddenTests: hidden,
    inputFormat: [
      { paramName: 'ops', type: sig.javascript.params[0].type, constraints: (srcInput[0] && srcInput[0].constraints) || 'Operation sequence' },
      { paramName: 'opArgs', type: sig.javascript.params[1].type, constraints: 'One entry per operation; empty when the operation takes no value' },
    ],
    outputFormat: s.outputFormat,
    functionSignature: sig,
    starterCode: starterCode(title),
    referenceSolution: { code: javascriptReference(title), language: 'javascript' },
    timeLimitMs: s.difficulty === 'hard' ? 3000 : s.difficulty === 'medium' ? 2000 : 1500,
    memoryLimitKb: 256000,
    provenance: {
      source: 'S1',
      ref: PROVENANCE_REF(title),
      note: 'description/constraints/inputFormat/outputFormat/starterCode/sample+hidden copied from the reviewed historical seed; '
        + 'the signature is widened to the two stdin lines the source fixtures already use and returns the JSON result text, because the stored '
        + 'expected output mixes nulls and integers and no array-of-strings representation reproduces it in all four languages; '
        + 'every admitted fixture is reproduced by two independent implementations; non-reproducible fixtures are dropped, not repaired.',
      dropped,
      normalisation: {
        what: 'the source wrote the string "" where an operation takes no argument; it is normalised to [] before the expected output is re-derived',
        entriesNormalised: normalisedEntries,
        admittedAfterReDerivation: samples.length + hidden.length,
      },
    },
  };
}


/* --------------------------------------------------------------------- build */
const records = BATCH_TITLES.map((t) => {
  const r = buildRecord(t);
  const issues = auditReplica(r);
  if (issues.length) {
    throw new Error(`authoredDsaBatch5: "${t}" fails the structural contract: ${issues.join(' | ')}`);
  }
  return r;
});

/* ------------------------------------------------------------------- guards */
if (BATCH_TITLES.length !== 1) throw new Error('authoredDsaBatch5: Batch 5 authors exactly 1 record');

const B1 = require('./authoredDsaBatch1').BATCH_TITLES;
const B2 = require('./authoredDsaBatch2').BATCH_TITLES;
const B3 = require('./authoredDsaBatch3').BATCH_TITLES;
for (const t of BATCH_TITLES) {
  if (B1.includes(t) || B2.includes(t) || B3.includes(t) || B4.BATCH_TITLES.includes(t)) {
    throw new Error(`authoredDsaBatch5: "${t}" already authored by an earlier batch`);
  }
}
if (new Set([...B1, ...B2, ...B3, ...B4.BATCH_TITLES, ...BATCH_TITLES]).size !== 40) {
  throw new Error('authoredDsaBatch5: expected 40 distinct authored titles across batches 1-5');
}
for (const r of records) {
  if (r.slug !== slugify(r.title)) throw new Error(`authoredDsaBatch5: slug mismatch for "${r.title}"`);
  if (!r.sampleTests.length) throw new Error(`authoredDsaBatch5: no admitted sample tests for "${r.title}"`);
  if (!r.hiddenTests.length) throw new Error(`authoredDsaBatch5: no admitted hidden tests for "${r.title}"`);
}

module.exports = {
  BATCH_TITLES,
  CANONICAL,
  records,
  SIGNATURES,
  PREAMBLE,
  buildTests,
  referencesFor,
  starterCode,
  javascriptReference,
  auditReplica,
  slugify,
};
