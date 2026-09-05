/**
 * Centralized interview field/topic configuration.
 *
 * Single source of truth for every interview field the AI Mock Interview
 * feature supports. The backend validates user-supplied topics AND AI-generated
 * question topics against this list. The frontend mirrors it as a fallback
 * (client/src/config/interviewFields.js) but always fetches it live from
 * GET /api/interview/fields.
 */

const CATEGORIES = [
  { id: 'languages', label: 'Programming Languages' },
  { id: 'java', label: 'Java Ecosystem' },
  { id: 'dsa', label: 'Data Structures & Algorithms' },
  { id: 'cs-fundamentals', label: 'CS Fundamentals' },
  { id: 'web', label: 'Web Development' },
];

const FIELDS = [
  // ── Programming Languages ────────────────────────────────────────────────
  { id: 'c', label: 'C', category: 'languages', aliases: ['c language'] },
  { id: 'cpp', label: 'C++', category: 'languages', aliases: ['cpp', 'c plus plus'] },
  { id: 'java', label: 'Java', category: 'languages', aliases: [] },
  { id: 'python', label: 'Python', category: 'languages', aliases: [] },
  { id: 'javascript', label: 'JavaScript', category: 'languages', aliases: ['js', 'es6', 'ecmascript'] },
  { id: 'typescript', label: 'TypeScript', category: 'languages', aliases: ['ts'] },

  // ── Java Ecosystem ───────────────────────────────────────────────────────
  { id: 'core-java', label: 'Core Java', category: 'java', aliases: ['java fundamentals', 'java basics'] },
  { id: 'advanced-java', label: 'Advanced Java', category: 'java', aliases: ['servlets', 'jsp'] },
  { id: 'java-oop', label: 'Java OOP', category: 'java', aliases: ['object oriented programming java'] },
  { id: 'java-collections', label: 'Java Collections', category: 'java', aliases: ['collection framework', 'java collection framework'] },
  { id: 'java-multithreading', label: 'Java Multithreading', category: 'java', aliases: ['multithreading', 'concurrency java'] },
  { id: 'java-exception-handling', label: 'Java Exception Handling', category: 'java', aliases: ['exception handling'] },
  { id: 'java-streams', label: 'Java Streams', category: 'java', aliases: ['streams api', 'java stream api'] },
  { id: 'java-generics', label: 'Java Generics', category: 'java', aliases: ['generics'] },

  // ── Data Structures & Algorithms ─────────────────────────────────────────
  { id: 'arrays', label: 'Arrays', category: 'dsa', aliases: ['array'] },
  { id: 'strings', label: 'Strings', category: 'dsa', aliases: ['string'] },
  { id: 'linked-list', label: 'Linked List', category: 'dsa', aliases: ['linkedlist', 'doubly linked list'] },
  { id: 'stack', label: 'Stack', category: 'dsa', aliases: ['stack ds'] },
  { id: 'queue', label: 'Queue', category: 'dsa', aliases: ['queues', 'deque'] },
  { id: 'hashing', label: 'HashMap / Hashing', category: 'dsa', aliases: ['hashmap', 'hash table', 'hashtable', 'hash set'] },
  { id: 'sliding-window', label: 'Sliding Window', category: 'dsa', aliases: ['sliding window technique'] },
  { id: 'two-pointers', label: 'Two Pointers', category: 'dsa', aliases: ['two pointer'] },
  { id: 'binary-search', label: 'Binary Search', category: 'dsa', aliases: [] },
  { id: 'recursion', label: 'Recursion', category: 'dsa', aliases: ['recursive'] },
  { id: 'backtracking', label: 'Backtracking', category: 'dsa', aliases: [] },
  { id: 'trees', label: 'Trees', category: 'dsa', aliases: ['binary tree', 'tree traversal'] },
  { id: 'binary-search-tree', label: 'Binary Search Tree', category: 'dsa', aliases: ['bst'] },
  { id: 'heap', label: 'Heap / Priority Queue', category: 'dsa', aliases: ['heap', 'priority queue'] },
  { id: 'graphs', label: 'Graphs', category: 'dsa', aliases: ['graph', 'bfs', 'dfs'] },
  { id: 'greedy', label: 'Greedy', category: 'dsa', aliases: ['greedy algorithm'] },
  { id: 'dynamic-programming', label: 'Dynamic Programming', category: 'dsa', aliases: ['dp', 'memoization'] },
  { id: 'sorting', label: 'Sorting', category: 'dsa', aliases: ['sorting algorithms'] },
  { id: 'searching', label: 'Searching', category: 'dsa', aliases: ['searching algorithms'] },

  // ── CS Fundamentals ──────────────────────────────────────────────────────
  { id: 'dbms', label: 'DBMS', category: 'cs-fundamentals', aliases: ['database', 'database management'] },
  { id: 'sql', label: 'SQL', category: 'cs-fundamentals', aliases: ['mysql'] },
  { id: 'operating-systems', label: 'Operating Systems', category: 'cs-fundamentals', aliases: ['os', 'operating system'] },
  { id: 'computer-networks', label: 'Computer Networks', category: 'cs-fundamentals', aliases: ['networking', 'networks'] },
  { id: 'oop', label: 'OOP', category: 'cs-fundamentals', aliases: ['object oriented programming', 'oops'] },
  { id: 'system-design-basics', label: 'System Design Basics', category: 'cs-fundamentals', aliases: ['system design'] },
  { id: 'software-engineering', label: 'Software Engineering', category: 'cs-fundamentals', aliases: ['sdlc'] },
  { id: 'rest-apis', label: 'REST APIs', category: 'cs-fundamentals', aliases: ['rest', 'restful api'] },

  // ── Web Development ──────────────────────────────────────────────────────
  { id: 'html', label: 'HTML', category: 'web', aliases: ['html5'] },
  { id: 'css', label: 'CSS', category: 'web', aliases: ['css3', 'flexbox'] },
  { id: 'react', label: 'React', category: 'web', aliases: ['reactjs'] },
  { id: 'nodejs', label: 'Node.js', category: 'web', aliases: ['node', 'node js'] },
  { id: 'expressjs', label: 'Express.js', category: 'web', aliases: ['express'] },
  { id: 'mongodb', label: 'MongoDB', category: 'web', aliases: ['mongo', 'nosql'] },
  { id: 'git-github', label: 'Git / GitHub', category: 'web', aliases: ['git', 'github', 'version control'] },
  { id: 'docker', label: 'Docker', category: 'web', aliases: ['containers'] },
  { id: 'aws-cloud', label: 'AWS / Cloud Basics', category: 'web', aliases: ['aws', 'cloud basics', 'cloud computing'] },
  { id: 'redux', label: 'Redux / State Management', category: 'web', aliases: ['redux', 'state management'] },
];

const DIFFICULTIES = ['easy', 'medium', 'hard', 'mixed'];
const CORE_DIFFICULTIES = ['easy', 'medium', 'hard'];
const EXPERIENCE_LEVELS = ['fresher', 'junior', 'intermediate', 'advanced'];
const MODES = ['text', 'voice'];
const QUESTION_COUNTS = [5, 10, 15, 20];
const DEFAULT_QUESTION_COUNT = 10;

const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').trim();

const FIELD_BY_KEY = (() => {
  const map = new Map();
  for (const f of FIELDS) {
    map.set(normalize(f.label), f);
    map.set(normalize(f.id), f);
    for (const a of f.aliases || []) map.set(normalize(a), f);
  }
  return map;
})();

/** Resolve a user/AI supplied topic string to a canonical field, or null. */
function resolveField(topic) {
  if (!topic) return null;
  return FIELD_BY_KEY.get(normalize(topic)) || null;
}

/**
 * Validate an array of topics.
 * Returns { valid, invalid, canonical } where canonical is a de-duplicated
 * list of { id, label, category } capped at MAX_TOPICS_PER_SESSION.
 */
const MAX_TOPICS_PER_SESSION = 20;
function validateTopics(topics) {
  const invalid = [];
  const seen = new Set();
  const canonical = [];
  for (const t of Array.isArray(topics) ? topics : []) {
    const field = resolveField(t);
    if (!field) {
      invalid.push(String(t).slice(0, 60));
    } else if (!seen.has(field.id)) {
      seen.add(field.id);
      canonical.push({ id: field.id, label: field.label, category: field.category });
    }
    if (canonical.length >= MAX_TOPICS_PER_SESSION) break;
  }
  return { valid: invalid.length === 0 && canonical.length > 0, invalid, canonical };
}

/** Grouped shape for GET /api/interview/fields. */
function getFields() {
  return CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    fields: FIELDS.filter((f) => f.category === c.id).map((f) => ({ id: f.id, label: f.label })),
  }));
}

function getFieldLabels() {
  return FIELDS.map((f) => f.label);
}

module.exports = {
  CATEGORIES,
  FIELDS,
  DIFFICULTIES,
  CORE_DIFFICULTIES,
  EXPERIENCE_LEVELS,
  MODES,
  QUESTION_COUNTS,
  DEFAULT_QUESTION_COUNT,
  MAX_TOPICS_PER_SESSION,
  resolveField,
  validateTopics,
  getFields,
  getFieldLabels,
};
