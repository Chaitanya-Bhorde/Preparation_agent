/**
 * fallbackBank â€” curated static questions used ONLY when the AI provider is
 * unavailable or repeatedly returns invalid/duplicate questions. Keeps a live
 * interview from silently breaking. Questions are tagged with difficulty and
 * flow through the same duplicate-check as AI questions.
 *
 * Shape per entry: { text, difficulty, type, expectedConcepts, expectedAnswer }
 */

const BANK = {
  // â”€â”€ Programming Languages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  c: [
    {
      text: 'What is the difference between a pointer and a reference in C?',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['pointer', 'memory address', 'dereferencing', 'null pointer'],
      expectedAnswer:
        'A pointer stores the memory address of a variable and can be reassigned, set to NULL, and supports arithmetic. C does not have references like C++; pointers are the only way to work indirectly with memory, requiring explicit dereferencing with *.',
    },
    {
      text: 'Explain what happens when an array name is used in an expression in C, and how it relates to pointers.',
      difficulty: 'medium',
      type: 'conceptual',
      expectedConcepts: ['array decay', 'pointer arithmetic', 'sizeof'],
      expectedAnswer:
        'In most expressions an array name decays to a pointer to its first element, so arr[i] is equivalent to *(arr + i). sizeof(arr) still returns the full array size, which distinguishes arrays from pointers.',
    },
  ],
  cpp: [
    {
      text: 'What is the difference between stack memory and heap memory in C++?',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['stack allocation', 'heap allocation', 'new and delete', 'lifetime'],
      expectedAnswer:
        'Stack memory is automatic: variables are allocated/freed with scope, fast, limited size. Heap memory is manually managed with new/delete (or smart pointers), larger, lives until explicitly freed, and risks leaks if mismanaged.',
    },
  ],
  java: [
    {
      text: 'What is the difference between JDK, JRE, and JVM?',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['JVM', 'JRE', 'JDK', 'bytecode'],
      expectedAnswer:
        'JVM executes Java bytecode and provides platform independence. JRE contains the JVM plus core libraries needed to run applications. JDK is the full development kit: JRE plus compiler (javac), debugger, and development tools.',
    },
    {
      text: 'Why is Java platform independent, and what role does bytecode play in that?',
      difficulty: 'easy',
      type: 'conceptual',
      expectedConcepts: ['bytecode', 'JVM', 'compile once run anywhere'],
      expectedAnswer:
        'javac compiles source code to bytecode, a platform-neutral intermediate representation. Each platform has its own JVM that translates/executes the same bytecode, so the same .class file runs anywhere a JVM exists â€” write once, run anywhere.',
    },
  ],
  python: [
    {
      text: 'What is the difference between a list and a tuple in Python?',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['mutability', 'tuple', 'list', 'hashability'],
      expectedAnswer:
        'Lists are mutable and resizable; tuples are immutable. Tuples can be dictionary keys and are slightly faster/lighter. Use lists for dynamic collections and tuples for fixed records.',
    },
  ],

  javascript: [
    {
      text: 'Explain the difference between var, let, and const in JavaScript.',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['var hoisting', 'let block scope', 'const reassignment', 'temporal dead zone'],
      expectedAnswer:
        'var is function-scoped and hoisted with undefined initialization; let and const are block-scoped with a temporal dead zone. const prevents reassignment (object contents can still mutate). Prefer const by default, let when reassigning.',
    },
    {
      text: 'What is a JavaScript closure and where would you use one?',
      difficulty: 'medium',
      type: 'conceptual',
      expectedConcepts: ['closure', 'lexical scope', 'encapsulation', 'data privacy'],
      expectedAnswer:
        'A closure is a function that remembers variables from its lexical scope even after the outer function has returned. Uses: data privacy, function factories, callbacks, and module patterns. Cite an increment-counter example.',
    },
  ],
  typescript: [
    {
      text: 'What problems does TypeScript solve compared to plain JavaScript?',
      difficulty: 'easy',
      type: 'conceptual',
      expectedConcepts: ['static typing', 'compile-time errors', 'interfaces', 'tooling'],
      expectedAnswer:
        'TypeScript adds static types, interfaces, and generics on top of JavaScript, catching type errors at compile time instead of runtime. It improves IDE autocompletion, refactoring safety, and documentation of APIs.',
    },
  ],

  // â”€â”€ Java Ecosystem â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  'core-java': [
    {
      text: 'What is the difference between == and .equals() when comparing objects in Java?',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['reference equality', 'equals method', 'hashCode contract', 'string pool'],
      expectedAnswer:
        '== compares references (same object in memory); .equals() compares logical content if the class overrides it (String does). When overriding equals you must also override hashCode to preserve the contract for HashMap/HashSet.',
    },
  ],
  'advanced-java': [
    {
      text: 'In Java servlets, what is the difference between doGet() and doPost(), and when would you use each?',
      difficulty: 'medium',
      type: 'comparison',
      expectedConcepts: ['HTTP GET', 'HTTP POST', 'servlet lifecycle', 'idempotency'],
      expectedAnswer:
        'doGet handles GET requests: parameters go in the URL, cacheable/bookmarkable, used for fetching data. doPost handles POST: data goes in the request body, suited for sensitive or large payloads and state-changing operations.',
    },
  ],
  'java-oop': [
    {
      text: 'What is polymorphism in Java? Explain compile-time and runtime polymorphism with examples.',
      difficulty: 'medium',
      type: 'conceptual',
      expectedConcepts: ['method overloading', 'method overriding', 'dynamic dispatch', 'upcasting'],
      expectedAnswer:
        'Polymorphism lets one interface take many forms. Compile-time is method overloading (same name, different parameters, resolved at compile time). Runtime is method overriding: a subclass provides its own implementation, and the JVM picks the version based on the actual object type at runtime (dynamic dispatch via upcasting).',
    },
  ],
  'java-collections': [
    {
      text: 'What is the difference between ArrayList and LinkedList in Java?',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['dynamic array', 'doubly linked list', 'O(1) access', 'insertion cost'],
      expectedAnswer:
        'ArrayList is backed by a dynamic array: O(1) random access, amortized O(1) append, but O(n) insertions/deletions in the middle. LinkedList is a doubly linked list: O(1) insertion/deletion at known nodes but O(n) access. ArrayList is the default choice due to cache locality.',
    },
  ],
  'java-multithreading': [
    {
      text: 'What is a race condition in Java, and how do you prevent it?',
      difficulty: 'medium',
      type: 'troubleshooting',
      expectedConcepts: ['race condition', 'synchronized', 'atomicity', 'thread safety', 'volatile'],
      expectedAnswer:
        'A race condition occurs when two threads access shared mutable state without synchronization and the result depends on timing (e.g., count++ is read-modify-write). Prevent with synchronized blocks/methods, Locks, atomic classes (AtomicInteger), or immutable/concurrent data structures. volatile only guarantees visibility, not atomicity.',
    },
  ],
  'java-exception-handling': [
    {
      text: 'Explain the difference between checked and unchecked exceptions in Java.',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['checked exception', 'RuntimeException', 'try-catch', 'throws'],
      expectedAnswer:
        'Checked exceptions (e.g., IOException) extend Exception and must be caught or declared with throws â€” the compiler enforces recovery for recoverable external failures. Unchecked exceptions extend RuntimeException (e.g., NullPointerException) and usually indicate programming bugs; handling is optional.',
    },
  ],
  'java-streams': [
    {
      text: 'What is the difference between intermediate and terminal operations in the Java Stream API?',
      difficulty: 'medium',
      type: 'conceptual',
      expectedConcepts: ['lazy evaluation', 'map and filter', 'collect and forEach', 'stream pipeline'],
      expectedAnswer:
        'Intermediate operations (map, filter, sorted) are lazy: they build a pipeline description and return a new stream without processing elements. Terminal operations (collect, forEach, reduce) trigger actual evaluation and consume the stream. Laziness enables short-circuiting and fusion of operations.',
    },
  ],
  'java-generics': [
    {
      text: 'What problem do generics solve in Java, and what is type erasure?',
      difficulty: 'hard',
      type: 'conceptual',
      expectedConcepts: ['compile-time type safety', 'type erasure', 'raw types', 'ClassCastException'],
      expectedAnswer:
        'Generics provide compile-time type safety for collections and APIs, eliminating explicit casts and ClassCastException risks. Type erasure means generic type information is removed at compile time (List of String becomes List), so the JVM has no runtime type parameters â€” the compiler inserts checked casts instead.',
    },
  ],

  // â”€â”€ Data Structures & Algorithms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  arrays: [
    {
      text: 'How do you find the maximum subarray sum of an array, and what is its time complexity?',
      difficulty: 'medium',
      type: 'coding',
      expectedConcepts: ['Kadane algorithm', 'local vs global max', 'O(n)', 'negative numbers'],
      expectedAnswer:
        "Kadane's algorithm: scan once keeping the best subarray ending at the current index (extend or restart when the running sum drops below the current element) and track the global maximum. O(n) time, O(1) space.",
    },
  ],
  strings: [
    {
      text: 'How would you check whether two strings are anagrams of each other?',
      difficulty: 'easy',
      type: 'coding',
      expectedConcepts: ['frequency count', 'character map', 'sorting alternative', 'O(n)'],
      expectedAnswer:
        'Compare character frequency counts: build a count array/map for one string, decrement for the other, and verify all counts end at zero (lengths must match first). O(n) time; sorting both strings and comparing is the simpler O(n log n) alternative.',
    },
  ],
  'linked-list': [
    {
      text: 'How do you detect a cycle in a linked list?',
      difficulty: 'easy',
      type: 'coding',
      expectedConcepts: ['Floyd cycle detection', 'slow and fast pointers', 'O(1) space'],
      expectedAnswer:
        "Use Floyd's tortoise-and-hare: move a slow pointer one step and a fast pointer two steps; if they ever meet, a cycle exists (a visited-set alternative works but uses O(n) space). Finding the cycle start: reset one pointer to head, move both one step until they meet.",
    },
  ],
  stack: [
    {
      text: 'How would you use a stack to check for balanced parentheses in an expression?',
      difficulty: 'easy',
      type: 'coding',
      expectedConcepts: ['LIFO', 'push and pop matching', 'unmatched openers', 'O(n)'],
      expectedAnswer:
        'Push opening brackets; on a closing bracket, pop and check it matches the opener type; the expression is balanced if the stack is empty at the end and no pop failed. O(n) time and space.',
    },
  ],
  queue: [
    {
      text: 'How can you implement a queue using two stacks?',
      difficulty: 'medium',
      type: 'coding',
      expectedConcepts: ['amortized analysis', 'transfer on empty', 'dequeue order'],
      expectedAnswer:
        'Stack A for enqueue; on dequeue, if the out-stack is empty, pop everything from A into the out-stack (reversing order), then pop. Each element is moved at most once, so dequeue is amortized O(1).',
    },
  ],
  hashing: [
    {
      text: 'What is the difference between HashMap and ConcurrentHashMap in Java?',
      difficulty: 'medium',
      type: 'comparison',
      expectedConcepts: ['thread safety', 'bucket locking', 'fail-fast iterator', 'null keys'],
      expectedAnswer:
        'HashMap is not thread-safe and allows one null key; concurrent modification throws ConcurrentModificationException (fail-fast). ConcurrentHashMap is thread-safe using fine-grained bucket-level locking/CAS, allows no null keys or values, and its iterators are weakly consistent.',
    },
  ],
  'sliding-window': [
    {
      text: 'Explain the sliding window technique and the kind of problems it solves.',
      difficulty: 'medium',
      type: 'conceptual',
      expectedConcepts: ['contiguous subarray', 'expand and shrink', 'O(n) vs O(n^2)', 'window invariant'],
      expectedAnswer:
        'Sliding window maintains a contiguous window with two pointers: expand the right edge each step and shrink from the left while a constraint is violated. It converts brute-force O(nÂ·k) subarray/substring problems (longest substring without repeats, max sum of size k) into O(n).',
    },
  ],
  'two-pointers': [
    {
      text: 'How does the two-pointer technique work for finding a pair with a given sum in a sorted array?',
      difficulty: 'easy',
      type: 'coding',
      expectedConcepts: ['sorted array', 'left and right pointers', 'O(n)', 'sum comparison'],
      expectedAnswer:
        'Place one pointer at each end. If the sum is too small, advance the left pointer; if too large, retreat the right pointer; stop when they meet. O(n) time, O(1) space â€” valid because the array is sorted.',
    },
  ],
  'binary-search': [
    {
      text: 'What are the key conditions for binary search to work, and what is a common bug in its implementation?',
      difficulty: 'medium',
      type: 'troubleshooting',
      expectedConcepts: ['sorted input', 'mid overflow', 'infinite loop', 'boundary handling'],
      expectedAnswer:
        'Binary search needs sorted, randomly-accessible data. Classic bugs: mid computed as (low+high)/2 can overflow (use low+(high-low)/2), and off-by-one loop bounds (low<=high vs low<high with matching mid updates) cause missed elements or infinite loops.',
    },
  ],
  recursion: [
    {
      text: 'What is a base case in recursion, and what happens if it is missing?',
      difficulty: 'easy',
      type: 'conceptual',
      expectedConcepts: ['base case', 'recursive case', 'stack overflow', 'call stack'],
      expectedAnswer:
        'The base case is the smallest input solved without further recursion; the recursive case must reduce toward it. Without a reachable base case, calls never unwind and the call stack grows until a StackOverflowError/RecursionError.',
    },
  ],
  backtracking: [
    {
      text: 'Explain how backtracking differs from brute-force enumeration, using N-Queens as an example.',
      difficulty: 'hard',
      type: 'conceptual',
      expectedConcepts: ['pruning invalid states', 'undo choice', 'state space tree', 'constraint satisfaction'],
      expectedAnswer:
        'Backtracking builds candidates incrementally and abandons (prunes) a partial solution the moment it violates constraints, undoing the last choice and trying the next â€” in N-Queens, never placing a second queen on a used row/column/diagonal. Brute force enumerates full boards, so backtracking explores a vastly smaller state space.',
    },
  ],
  trees: [
    {
      text: 'Compare BFS (level-order) and DFS for traversing a binary tree.',
      difficulty: 'medium',
      type: 'comparison',
      expectedConcepts: ['queue vs stack', 'level order', 'inorder preorder postorder', 'space complexity'],
      expectedAnswer:
        'BFS uses a queue and visits nodes level by level â€” ideal for shortest-path/level problems, O(width) space. DFS uses recursion or a stack and goes deep first (inorder, preorder, postorder), O(height) space. Both visit every node in O(n).',
    },
  ],
  'binary-search-tree': [
    {
      text: 'What property makes a binary search tree useful, and what is its worst-case time complexity?',
      difficulty: 'medium',
      type: 'conceptual',
      expectedConcepts: ['left smaller right larger', 'inorder sorted', 'skewed tree', 'balanced trees'],
      expectedAnswer:
        'For every node, left subtree keys are smaller and right subtree keys are larger, so search/insert/delete are O(h) and inorder traversal yields sorted order. Worst case (sorted insertions â†’ skewed tree) degrades to O(n); balanced variants (AVL/Red-Black) keep O(log n).',
    },
  ],
  heap: [
    {
      text: 'How would you find the k largest elements in an unbounded array using a heap?',
      difficulty: 'medium',
      type: 'coding',
      expectedConcepts: ['min-heap of size k', 'O(n log k)', 'priority queue', 'k-th largest'],
      expectedAnswer:
        'Maintain a min-heap of size k: push each element; when size exceeds k, pop the smallest. The heap always holds the k largest seen so far; the root is the k-th largest. Time O(n log k), space O(k).',
    },
  ],
  graphs: [
    {
      text: 'Explain the difference between BFS and DFS for graph traversal and when you would use each.',
      difficulty: 'medium',
      type: 'comparison',
      expectedConcepts: ['queue', 'stack or recursion', 'shortest path unweighted', 'visited set'],
      expectedAnswer:
        'BFS explores neighbors level by level with a queue, guaranteeing shortest paths in unweighted graphs. DFS dives deep via stack/recursion, useful for cycle detection, topological sort, connectivity. Both are O(V+E) with a visited set to handle cycles.',
    },
  ],
  greedy: [
    {
      text: 'What makes a greedy algorithm correct, and give one classic example.',
      difficulty: 'hard',
      type: 'conceptual',
      expectedConcepts: ['greedy choice property', 'optimal substructure', 'interval scheduling'],
      expectedAnswer:
        'A greedy algorithm is correct when the problem has the greedy-choice property (a locally optimal choice leads to a global optimum) and optimal substructure. Example: interval scheduling â€” always take the activity finishing earliest; an exchange argument proves optimality.',
    },
  ],
  'dynamic-programming': [
    {
      text: 'What are the two conditions required for a problem to be solved with dynamic programming?',
      difficulty: 'medium',
      type: 'conceptual',
      expectedConcepts: ['overlapping subproblems', 'optimal substructure', 'memoization', 'tabulation'],
      expectedAnswer:
        'Overlapping subproblems (the same subproblems recur, so memoization or bottom-up tabulation avoids recomputation) and optimal substructure (an optimal solution is composed of optimal sub-solutions). Fibonacci and shortest-path problems are canonical examples.',
    },
  ],
  sorting: [
    {
      text: 'Compare quicksort and mergesort in terms of time complexity, space, and stability.',
      difficulty: 'medium',
      type: 'comparison',
      expectedConcepts: ['average O(n log n)', 'worst case O(n^2)', 'stability', 'in-place'],
      expectedAnswer:
        'Quicksort: average O(n log n), worst O(n^2) with bad pivots, in-place with O(log n) stack, not stable â€” very fast in practice due to cache locality. Mergesort: always O(n log n), stable, but needs O(n) auxiliary space. Mergesort suits linked lists/external sorting; quicksort suits in-memory arrays.',
    },
  ],
  searching: [
    {
      text: 'When would linear search be preferred over binary search?',
      difficulty: 'easy',
      type: 'conceptual',
      expectedConcepts: ['unsorted data', 'small n', 'one-time lookup', 'random access'],
      expectedAnswer:
        'Linear search needs no sorted data or preprocessing, so it wins for tiny arrays, one-off lookups, unsorted/streaming data, or linked structures without random access â€” at small n the O(n) vs O(log n) gap is negligible while sorting first costs more.',
    },
  ],

  // â”€â”€ CS Fundamentals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  dbms: [
    {
      text: 'What is normalization in a database, and why is it important?',
      difficulty: 'medium',
      type: 'conceptual',
      expectedConcepts: ['redundancy', '1NF 2NF 3NF', 'update anomaly', 'denormalization tradeoff'],
      expectedAnswer:
        'Normalization organizes tables to remove redundant data and insert/update/delete anomalies by splitting data into well-formed relations â€” 1NF atomic values, 2NF no partial dependency on part of a key, 3NF no transitive dependency. Read-heavy systems sometimes denormalize for performance.',
    },
  ],
  sql: [
    {
      text: 'What is the difference between WHERE and HAVING clauses in SQL?',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['row filter', 'aggregate filter', 'GROUP BY', 'query order'],
      expectedAnswer:
        'WHERE filters individual rows before grouping; HAVING filters groups after GROUP BY and can reference aggregates (e.g., HAVING COUNT(*) > 5). WHERE cannot use aggregate functions.',
    },
  ],
  'operating-systems': [
    {
      text: 'What is the difference between a process and a thread?',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['address space', 'context switching', 'shared memory', 'isolation'],
      expectedAnswer:
        'A process has its own isolated address space and resources; threads within a process share the address space, open files, and heap but keep their own stack and registers. Threads are cheaper to create/switch and communicate via shared memory (requiring synchronization); process isolation gives fault containment.',
    },
  ],
  'computer-networks': [
    {
      text: 'What happens when you type a URL into a browser and press Enter?',
      difficulty: 'medium',
      type: 'scenario',
      expectedConcepts: ['DNS resolution', 'TCP handshake', 'TLS', 'HTTP request response', 'rendering'],
      expectedAnswer:
        'The browser resolves the hostname via DNS, opens a TCP connection (3-way handshake), negotiates TLS for HTTPS, sends the HTTP request, receives and parses the response, then builds the DOM/CSSOM and renders. Caching (browser/DNS/CDN) short-circuits many steps.',
    },
  ],
  oop: [
    {
      text: 'What is polymorphism? Explain compile-time and runtime polymorphism with examples.',
      difficulty: 'easy',
      type: 'conceptual',
      expectedConcepts: ['method overloading', 'method overriding', 'dynamic dispatch'],
      expectedAnswer:
        'Polymorphism lets one interface take many forms. Compile-time: method overloading, resolved at compile time. Runtime: method overriding â€” a subclass redefines a parent method and the actual object type decides which version runs (dynamic dispatch), e.g., Animal a = new Dog(); a.speak().',
    },
  ],
  'system-design-basics': [
    {
      text: 'What is the difference between horizontal and vertical scaling, and what are their trade-offs?',
      difficulty: 'medium',
      type: 'comparison',
      expectedConcepts: ['scale out', 'scale up', 'load balancing', 'single point of failure'],
      expectedAnswer:
        'Vertical scaling adds CPU/RAM to one machine â€” simple, but capped and a single point of failure. Horizontal scaling adds machines behind a load balancer â€” near-unlimited growth and fault tolerance, but requires distributed-state handling (sessions, caching, consistency).',
    },
  ],
  'software-engineering': [
    {
      text: 'What is the purpose of version control, and what is a typical Git feature-branch workflow?',
      difficulty: 'easy',
      type: 'conceptual',
      expectedConcepts: ['commits', 'branching', 'pull request', 'code review'],
      expectedAnswer:
        'Version control tracks every change, enables collaboration, and allows safe branching/reverting. Feature-branch flow: branch per feature, small commits, pull request for review, CI passes, merge to main, delete branch â€” keeping main deployable.',
    },
  ],
  'rest-apis': [
    {
      text: 'What makes an API RESTful? Explain resources, HTTP methods, and status codes.',
      difficulty: 'easy',
      type: 'conceptual',
      expectedConcepts: ['resource URIs', 'GET POST PUT DELETE', 'statelessness', 'status codes'],
      expectedAnswer:
        'REST models data as resources addressed by URIs, manipulated with standard HTTP verbs (GET read, POST create, PUT/PATCH update, DELETE remove) returning meaningful status codes (200, 201, 400, 401, 404, 500). Requests are stateless, enabling scalability and caching.',
    },
  ],

  // â”€â”€ Web Development â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  html: [
    {
      text: 'What is the difference between block-level and inline elements in HTML?',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['block element', 'inline element', 'layout behavior', 'semantic html'],
      expectedAnswer:
        'Block elements (div, p, h1) start on a new line and take full available width; inline elements (span, a, strong) flow within text taking only needed width. Semantic block elements (header, main, article) additionally convey meaning for accessibility and SEO.',
    },
  ],
  css: [
    {
      text: 'Explain how the CSS box model works.',
      difficulty: 'easy',
      type: 'conceptual',
      expectedConcepts: ['content', 'padding', 'border', 'margin', 'box-sizing'],
      expectedAnswer:
        'Every element is a box: content â†’ padding â†’ border â†’ margin, from inside out. With box-sizing: border-box, width/height include padding and border, simplifying layout. Adjacent block margins collapse.',
    },
  ],
  react: [
    {
      text: 'What is the difference between props and state in React?',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['props immutable', 'useState', 're-render', 'unidirectional data flow'],
      expectedAnswer:
        'Props are read-only inputs passed from parent to child; state is component-owned mutable data via useState/useReducer. Changing state triggers a re-render; data flows down and events flow up.',
    },
  ],
  nodejs: [
    {
      text: 'How does the Node.js event loop enable non-blocking I/O?',
      difficulty: 'medium',
      type: 'conceptual',
      expectedConcepts: ['single thread', 'libuv', 'callbacks promises', 'CPU-bound caveat'],
      expectedAnswer:
        'Node runs JS on a single main thread; I/O work is delegated to the OS/libuv thread pool and completes asynchronously. Callbacks/promises are executed when the event loop reaches their phase, so the thread never blocks on I/O â€” but CPU-heavy tasks block the loop and need worker threads.',
    },
  ],
  expressjs: [
    {
      text: 'What is Express middleware and how does the next() function work?',
      difficulty: 'medium',
      type: 'conceptual',
      expectedConcepts: ['request pipeline', 'next()', 'error middleware', 'ordering'],
      expectedAnswer:
        'Middleware are functions in the request pipeline receiving (req, res, next); they can inspect/modify the request, end the response, or call next() to pass control to the next handler in registration order. Error middleware (err, req, res, next) captures next(err) â€” ordering matters.',
    },
  ],
  mongodb: [
    {
      text: 'Compare MongoDB with relational databases: when would you choose each?',
      difficulty: 'medium',
      type: 'comparison',
      expectedConcepts: ['documents vs tables', 'schema flexibility', 'joins vs embedding', 'ACID'],
      expectedAnswer:
        'MongoDB stores flexible JSON-like documents, scales horizontally, and fits evolving/hierarchical data. Relational DBs enforce schemas and excel at complex joins and strict ACID transactions. Choose Mongo for catalogs/profiles/logs; SQL for financial or heavily relational data.',
    },
  ],
  'git-github': [
    {
      text: 'What is the difference between git merge and git rebase?',
      difficulty: 'medium',
      type: 'comparison',
      expectedConcepts: ['merge commit', 'linear history', 'rewrite commits', 'conflicts'],
      expectedAnswer:
        'Merge combines branches with a merge commit, preserving true history but creating bubbles. Rebase replays commits on top of the target branch for linear history but rewrites hashes â€” safe only for unshared branches; shared branches should merge.',
    },
  ],
  docker: [
    {
      text: 'What is the difference between a Docker image and a container?',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['immutable image', 'running instance', 'layers', 'Dockerfile'],
      expectedAnswer:
        'An image is an immutable, layered template built from a Dockerfile; a container is a running (or stopped) instance of the image with its own writable layer. Images are versioned/shareable; many containers can run from one image.',
    },
  ],
  'aws-cloud': [
    {
      text: 'What are the main benefits of cloud computing compared to self-hosted servers?',
      difficulty: 'easy',
      type: 'conceptual',
      expectedConcepts: ['on-demand provisioning', 'pay as you go', 'elasticity', 'managed services'],
      expectedAnswer:
        'Cloud offers on-demand, pay-as-you-go infrastructure with elasticity, global regions for low latency, and managed services (databases, queues, storage) that remove server maintenance â€” trading capital expense for operational flexibility.',
    },
  ],
  redux: [
    {
      text: 'What problem does Redux solve in a React application?',
      difficulty: 'medium',
      type: 'conceptual',
      expectedConcepts: ['centralized store', 'actions and reducers', 'prop drilling'],
      expectedAnswer:
        'Redux centralizes state in a single store updated by dispatching actions handled by pure reducers. This removes prop drilling, makes changes predictable/debuggable, and shares state across distant components â€” best reserved for genuinely global state.',
    },
  ],
};

// Generic per-category questions for fields without curated entries.
const GENERIC = {
  languages: [
    {
      text: 'What are the main differences between compiled and interpreted languages?',
      difficulty: 'easy',
      type: 'conceptual',
      expectedConcepts: ['compilation', 'interpretation', 'runtime errors', 'performance'],
      expectedAnswer:
        'Compiled languages translate source to machine code ahead of execution (fast runtime, compile-time errors); interpreted languages execute via an interpreter at runtime (flexible, portable, slower). Many modern languages mix both (bytecode + JIT).',
    },
  ],
  java: [
    {
      text: 'What is the JVM and how does it execute Java programs?',
      difficulty: 'easy',
      type: 'conceptual',
      expectedConcepts: ['bytecode', 'class loading', 'JIT compilation', 'garbage collection'],
      expectedAnswer:
        'The JVM loads .class bytecode, verifies it, and executes it â€” interpreting first and JIT-compiling hot paths to native code. It manages memory via garbage collection and provides platform independence.',
    },
  ],
  dsa: [
    {
      text: 'How do you analyze the time and space complexity of an algorithm?',
      difficulty: 'easy',
      type: 'conceptual',
      expectedConcepts: ['Big O', 'worst case', 'loop analysis', 'auxiliary space'],
      expectedAnswer:
        'Count how core operations grow with input size n and express it in Big-O ignoring constants and lower-order terms (nested loops â†’ O(nÂ²), halving â†’ O(log n)). Space complexity counts extra memory: recursion depth, auxiliary arrays, hash maps.',
    },
  ],
  'cs-fundamentals': [
    {
      text: 'What is the difference between a compiler and an interpreter?',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['translation model', 'error reporting', 'execution speed'],
      expectedAnswer:
        'A compiler translates the whole program before execution, reporting errors up front; an interpreter translates and executes line by line at runtime. Compiled programs run faster; interpreted ones are more flexible and portable.',
    },
  ],
  web: [
    {
      text: 'What is the difference between HTTP and HTTPS?',
      difficulty: 'easy',
      type: 'comparison',
      expectedConcepts: ['TLS encryption', 'port 443', 'certificates', 'man in the middle'],
      expectedAnswer:
        'HTTPS is HTTP over TLS: traffic is encrypted and the server is authenticated via certificates, preventing eavesdropping and man-in-the-middle tampering. HTTP sends plaintext on port 80; HTTPS uses port 443.',
    },
  ],
};

/**
 * Pick a fallback question for a topic.
 * @param {string} fieldId canonical field id
 * @param {string} difficulty easy | medium | hard (already resolved, never 'mixed')
 * @param {string[]} takenTexts question texts already asked (dedupe)
 */
function getFallbackQuestion(fieldId, difficulty, takenTexts = []) {
  const direct = BANK[fieldId];
  const generic = GENERIC[fieldId] || GENERIC.dsa;
  const pool = (direct && direct.length > 0 ? direct : generic) || generic;
  if (!pool || pool.length === 0) return null;

  const unused = pool.filter((q) => !takenTexts.includes(q.text));
  const candidates = unused.length > 0 ? unused : pool;

  const byDifficulty = candidates.filter((q) => q.difficulty === difficulty);
  const pick = byDifficulty.length > 0
    ? byDifficulty[Math.floor(Math.random() * byDifficulty.length)]
    : candidates[Math.floor(Math.random() * candidates.length)];

  return { ...pick, difficulty: pick.difficulty || difficulty || 'medium' };
}

module.exports = { BANK, GENERIC, getFallbackQuestion };

