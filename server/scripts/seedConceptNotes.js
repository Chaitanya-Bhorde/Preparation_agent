const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const ConceptNote = require('../models/ConceptNote');

const conceptNotes = [
  {
    topic: 'Arrays',
    slug: 'arrays',
    summary: 'Arrays are fundamental data structures that store elements in contiguous memory locations.',
    coreConcept: 'Arrays provide O(1) access time by index but O(n) insertion/deletion at arbitrary positions. They are the building blocks for many advanced algorithms.',
    keyPoints: [
      'Fixed size in most languages (dynamic arrays resize)',
      'Contiguous memory allocation',
      'O(1) random access by index',
      'O(n) insertion/deletion at arbitrary positions',
      'Cache-friendly due to locality of reference',
    ],
    commonMistakes: [
      'Off-by-one errors in indexing',
      'Not handling empty arrays',
      'Modifying array while iterating',
      'Confusing pass-by-reference vs pass-by-value',
    ],
    codeExamples: [
      {
        title: 'Two Pointer Technique',
        code: 'function twoSum(nums, target) {\n  let left = 0, right = nums.length - 1;\n  while (left < right) {\n    const sum = nums[left] + nums[right];\n    if (sum === target) return [left, right];\n    sum < target ? left++ : right--;\n  }\n  return [];\n}',
        language: 'javascript',
      },
    ],
    relatedTopics: ['Hash Table', 'Two Pointer', 'Binary Search', 'Sliding Window'],
    difficulty: 'beginner',
  },
  {
    topic: 'Strings',
    slug: 'strings',
    summary: 'Strings are sequences of characters used to represent text data.',
    coreConcept: 'Strings can be manipulated using various techniques like two pointers, sliding window, and hashing. Understanding string immutability and memory layout is crucial.',
    keyPoints: [
      'Strings are immutable in many languages',
      'Character access is O(1)',
      'Concatenation can be O(n)',
      'Use StringBuilder for efficient concatenation',
      'ASCII vs Unicode considerations',
    ],
    commonMistakes: [
      'Forgetting string immutability',
      'Inefficient concatenation in loops',
      'Not handling empty strings',
      'Ignoring case sensitivity',
    ],
    codeExamples: [
      {
        title: 'Palindrome Check',
        code: 'function isPalindrome(s) {\n  s = s.toLowerCase().replace(/[^a-z0-9]/g, \'\');\n  return s === s.split(\'\').reverse().join(\'\');\n}',
        language: 'javascript',
      },
    ],
    relatedTopics: ['Two Pointer', 'Sliding Window', 'Dynamic Programming'],
    difficulty: 'beginner',
  },
  {
    topic: 'Dynamic Programming',
    slug: 'dynamic-programming',
    summary: 'Dynamic Programming solves complex problems by breaking them into overlapping subproblems and storing results.',
    coreConcept: 'DP optimizes recursive solutions by caching subproblem results (memoization) or building solutions bottom-up (tabulation). Key is identifying optimal substructure.',
    keyPoints: [
      'Identify overlapping subproblems',
      'Define clear state and recurrence relation',
      'Choose between memoization and tabulation',
      'Time complexity: O(number of states × transition cost)',
      'Space complexity can often be optimized',
    ],
    commonMistakes: [
      'Not defining base cases correctly',
      'Wrong state definition',
      'Forgetting to memoize',
      'Using recursion without memoization',
    ],
    codeExamples: [
      {
        title: 'Fibonacci with Memoization',
        code: 'function fib(n, memo = {}) {\n  if (n in memo) return memo[n];\n  if (n <= 1) return n;\n  memo[n] = fib(n-1, memo) + fib(n-2, memo);\n  return memo[n];\n}',
        language: 'javascript',
      },
    ],
    relatedTopics: ['Recursion', 'Memoization', 'Tabulation'],
    difficulty: 'intermediate',
  },
  {
    topic: 'Linked List',
    slug: 'linked-list',
    summary: 'Linked lists are linear data structures where nodes are linked using pointers.',
    coreConcept: 'Linked lists provide O(1) insertion/deletion at known positions but O(n) access time. Variations include singly, doubly, and circular linked lists.',
    keyPoints: [
      'Nodes contain data and pointer(s)',
      'O(1) insertion/deletion at head',
      'O(n) random access',
      'No contiguous memory',
      'No random access without traversal',
    ],
    commonMistakes: [
      'Losing head pointer during deletion',
      'Not handling null references',
      'Off-by-one in pointer manipulation',
      'Forgetting to update next/prev pointers',
      'Creating cycles accidentally',
    ],
    codeExamples: [
      {
        title: 'Reverse Linked List',
        code: 'function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr) {\n    const next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}',
        language: 'javascript',
      },
    ],
    relatedTopics: ['Two Pointer', 'Recursion', 'Fast and Slow Pointers'],
    difficulty: 'beginner',
  },
  {
    topic: 'Stack',
    slug: 'stack',
    summary: 'Stack is a LIFO (Last In First Out) data structure.',
    coreConcept: 'Stacks are used for problems requiring reverse order processing, backtracking, or nested structure validation.',
    keyPoints: [
      'LIFO ordering',
      'O(1) push and pop operations',
      'O(n) search',
      'Used in recursion, expression evaluation',
      'Can be implemented with arrays or linked lists',
    ],
    commonMistakes: [
      'Not checking for empty stack before pop',
      'Confusing push/pop order',
      'Using stack when queue is needed',
    ],
    codeExamples: [
      {
        title: 'Valid Parentheses',
        code: 'function isValid(s) {\n  const stack = [];\n  const map = { \'(\': \')\', \'{\': \'}\', \'[\': \']\' };\n  for (const char of s) {\n    if (map[char]) stack.push(char);\n    else if (map[stack.pop()] !== char) return false;\n  }\n  return stack.length === 0;\n}',
        language: 'javascript',
      },
    ],
    relatedTopics: ['Queue', 'Recursion', 'Expression Parsing'],
    difficulty: 'beginner',
  },
  {
    topic: 'Graph',
    slug: 'graph',
    summary: 'Graphs are non-linear data structures consisting of vertices and edges.',
    coreConcept: 'Graphs model relationships between entities. Key concepts include BFS, DFS, topological sort, and shortest path algorithms.',
    keyPoints: [
      'Represented as adjacency list or matrix',
      'BFS for shortest path in unweighted graphs',
      'DFS for connectivity and cycle detection',
      'Topological sort for dependency ordering',
      'Union-Find for disjoint sets',
    ],
    commonMistakes: [
      'Not marking visited nodes',
      'Confusing BFS and DFS',
      'Not handling disconnected graphs',
      'Infinite loops in cyclic graphs',
    ],
    codeExamples: [
      {
        title: 'BFS Traversal',
        code: 'function bfs(graph, start) {\n  const visited = new Set([start]);\n  const queue = [start];\n  while (queue.length) {\n    const node = queue.shift();\n    for (const neighbor of graph[node]) {\n      if (!visited.has(neighbor)) {\n        visited.add(neighbor);\n        queue.push(neighbor);\n      }\n    }\n  }\n  return visited;\n}',
        language: 'javascript',
      },
    ],
    relatedTopics: ['BFS', 'DFS', 'Topological Sort', 'Union-Find'],
    difficulty: 'intermediate',
  },
  {
    topic: 'Binary Search',
    slug: 'binary-search',
    summary: 'Binary search efficiently finds elements in sorted arrays by repeatedly dividing search space in half.',
    coreConcept: 'Binary search achieves O(log n) time by eliminating half the search space in each iteration. Works only on sorted or monotonic data.',
    keyPoints: [
      'Requires sorted/monotonic data',
      'O(log n) time complexity',
      'O(1) space for iterative, O(log n) for recursive',
      'Variants: lower_bound, upper_bound',
      'Can be applied to answer space',
    ],
    commonMistakes: [
      'Infinite loops with incorrect mid calculation',
      'Off-by-one in boundary conditions',
      'Not handling duplicates correctly',
      'Applying to unsorted data',
    ],
    codeExamples: [
      {
        title: 'Classic Binary Search',
        code: 'function binarySearch(nums, target) {\n  let left = 0, right = nums.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (nums[mid] === target) return mid;\n    nums[mid] < target ? left = mid + 1 : right = mid - 1;\n  }\n  return -1;\n}',
        language: 'javascript',
      },
    ],
    relatedTopics: ['Arrays', 'Sorted Array', 'Search Algorithm'],
    difficulty: 'beginner',
  },
  {
    topic: 'Hash Table',
    slug: 'hash-table',
    summary: 'Hash tables provide O(1) average case operations using key-value mapping.',
    coreConcept: 'Hash tables use hash functions to map keys to indices. Collisions are handled via chaining or open addressing.',
    keyPoints: [
      'O(1) average case operations',
      'O(n) worst case with collisions',
      'Hash function determines distribution',
      'Load factor affects performance',
      'Common implementations: unordered_map, HashMap, dict',
    ],
    commonMistakes: [
      'Not handling collisions',
      'Poor hash function causing clustering',
      'Not resizing when load factor is high',
      'Using mutable keys',
    ],
    codeExamples: [
      {
        title: 'Two Sum using HashMap',
        code: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
        language: 'javascript',
      },
    ],
    relatedTopics: ['Arrays', 'Dictionary', 'Set'],
    difficulty: 'beginner',
  },
  {
    topic: 'Tree',
    slug: 'tree',
    summary: 'Trees are hierarchical data structures with root and child nodes.',
    coreConcept: 'Trees represent hierarchical relationships. Binary trees, BSTs, and balanced trees are common variants with specific properties.',
    keyPoints: [
      'Hierarchical structure',
      'Root has no parent, leaves have no children',
      'Binary tree: max 2 children',
      'BST: left < root < right',
      'Traversals: inorder, preorder, postorder',
    ],
    commonMistakes: [
      'Confusing traversal orders',
      'Not handling null nodes',
      'Incorrect BST validation',
      'Stack overflow in deep recursion',
    ],
    codeExamples: [
      {
        title: 'Inorder Traversal',
        code: 'function inorderTraversal(root) {\n  const result = [];\n  function traverse(node) {\n    if (!node) return;\n    traverse(node.left);\n    result.push(node.val);\n    traverse(node.right);\n  }\n  traverse(root);\n  return result;\n}',
        language: 'javascript',
      },
    ],
    relatedTopics: ['Binary Search Tree', 'DFS', 'Recursion'],
    difficulty: 'beginner',
  },
  {
    topic: 'Heap',
    slug: 'heap',
    summary: 'Heaps are complete binary trees with heap property (min-heap or max-heap).',
    coreConcept: 'Heaps efficiently manage priority queues. Min-heap has smallest at root, max-heap has largest.',
    keyPoints: [
      'Complete binary tree property',
      'Min-heap: parent < children',
      'Max-heap: parent > children',
      'O(log n) insert and extract',
      'O(1) peek at root',
    ],
    commonMistakes: [
      'Not maintaining heap property after operations',
      'Using heap when sort suffices',
      'Confusing min and max heap',
    ],
    codeExamples: [
      {
        title: 'Heapify Operation',
        code: 'function heapify(arr, n, i) {\n  let largest = i;\n  const left = 2 * i + 1, right = 2 * i + 2;\n  if (left < n && arr[left] > arr[largest]) largest = left;\n  if (right < n && arr[right] > arr[largest]) largest = right;\n  if (largest !== i) {\n    [arr[i], arr[largest]] = [arr[largest], arr[i]];\n    heapify(arr, n, largest);\n  }\n}',
        language: 'javascript',
      },
    ],
    relatedTopics: ['Priority Queue', 'Sorting', 'Graph Algorithms'],
    difficulty: 'intermediate',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent');
    console.log('Connected to MongoDB');
    await ConceptNote.deleteMany({});

    const notesWithSlugs = conceptNotes.map(note => ({
      ...note,
      slug: note.slug || note.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    }));

    const seenSlugs = new Map();
    const duplicates = [];
    notesWithSlugs.forEach(note => {
      if (seenSlugs.has(note.slug)) {
        duplicates.push({ slug: note.slug, topic: note.topic, originalTopic: seenSlugs.get(note.slug) });
      } else {
        seenSlugs.set(note.slug, note.topic);
      }
    });

    if (duplicates.length > 0) {
      console.log(`[PRE-FLIGHT] Found ${duplicates.length} duplicate slug(s):`);
      duplicates.forEach(d => console.log(`  - "${d.slug}" in "${d.topic}" (original: ${d.originalTopic})`));
    }

    const deduped = notesWithSlugs.filter((note, idx, arr) => arr.findIndex(n => n.slug === note.slug) === idx);
    const removed = notesWithSlugs.length - deduped.length;
    if (removed > 0) {
      console.log(`[PRE-FLIGHT] Removed ${removed} duplicate(s), proceeding with ${deduped.length} unique notes.`);
    }

    const created = await ConceptNote.insertMany(deduped, { ordered: false });
    console.log(`Seeded ${created.length} concept notes`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    if (error.writeErrors) {
      error.writeErrors.forEach(w => console.error(`  Failed doc ${w.err.index}:`, w.err.message));
    }
    process.exit(1);
  }
}

seed();