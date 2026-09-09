// DBMS MCQs Part 4 (More ACID, Indexing, Deadlocks, Concurrency, Joins)
module.exports = [
  { topic: 'ACID Properties', question: 'Bank transfer shows:', options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'], correctAnswer: 0, explanation: 'Both debit and credit or neither = Atomicity.', difficulty: 'medium' },
  { topic: 'ACID Properties', question: 'Consistency maintained by:', options: ['Integrity constraints', 'Indexing', 'Caching', 'Partitioning'], correctAnswer: 0, explanation: 'Integrity constraints maintain consistency.', difficulty: 'medium' },
  { topic: 'ACID Properties', question: 'Allows dirty reads:', options: ['Serializable', 'Repeatable Read', 'Read Committed', 'Read Uncommitted'], correctAnswer: 3, explanation: 'Read Uncommitted allows dirty reads.', difficulty: 'hard' },
  { topic: 'ACID Properties', question: 'Highest isolation level:', options: ['Read Committed', 'Repeatable Read', 'Serializable', 'Read Uncommitted'], correctAnswer: 2, explanation: 'Serializable is highest.', difficulty: 'medium' },
  { topic: 'ACID Properties', question: 'Same row twice, different values:', options: ['Dirty read', 'Non-repeatable read', 'Phantom read', 'Lost update'], correctAnswer: 1, explanation: 'Non-repeatable read.', difficulty: 'hard' },
  { topic: 'Indexing', question: 'Index similar to:', options: ['Table', 'Book index', 'View', 'Transaction'], correctAnswer: 1, explanation: 'Index works like a book index.', difficulty: 'easy' },
  { topic: 'Indexing', question: 'Determines physical order:', options: ['Non-clustered', 'Clustered', 'Hash', 'Bitmap'], correctAnswer: 1, explanation: 'Clustered index determines physical order.', difficulty: 'medium' },
  { topic: 'Indexing', question: 'Clustered indexes per table:', options: ['Unlimited', 'Only 1', 'At most 2', 'Depends'], correctAnswer: 1, explanation: 'Only one clustered index per table.', difficulty: 'easy' },
  { topic: 'Indexing', question: 'B+ Tree preferred because:', options: ['Faster single lookup', 'All data in leaf nodes for ranges', 'Less memory', 'Simpler'], correctAnswer: 1, explanation: 'B+ Tree: leaf nodes enable range queries.', difficulty: 'medium' },
  { topic: 'Indexing', question: 'Disadvantage of indexing:', options: ['Slower SELECT', 'Faster INSERT', 'Extra storage', 'Reduced integrity'], correctAnswer: 2, explanation: 'Indexes use extra storage and slow writes.', difficulty: 'easy' },
  { topic: 'Deadlocks', question: 'Deadlock when:', options: ['Transaction fails', 'Transactions wait for each other indefinitely', 'Committed', 'Crashes'], correctAnswer: 1, explanation: 'Deadlock: circular wait.', difficulty: 'easy' },
  { topic: 'Deadlocks', question: 'NOT necessary for deadlock?', options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption', 'Circular Wait'], correctAnswer: 2, explanation: 'Preemption is NOT a condition.', difficulty: 'medium' },
  { topic: 'Deadlocks', question: 'Bankers Algorithm for:', options: ['Prevention', 'Avoidance', 'Detection', 'Recovery'], correctAnswer: 1, explanation: 'Bankers Algorithm avoids deadlock.', difficulty: 'medium' },
  { topic: 'Deadlocks', question: 'Wait-for graph for:', options: ['Prevention', 'Avoidance', 'Detection', 'Optimization'], correctAnswer: 2, explanation: 'Wait-for graph detects deadlock.', difficulty: 'medium' },
  { topic: 'Deadlocks', question: 'Request all at once breaks:', options: ['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'Circular Wait'], correctAnswer: 1, explanation: 'Breaks Hold and Wait.', difficulty: 'medium' },
];
