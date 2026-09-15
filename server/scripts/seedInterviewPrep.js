// Comprehensive, idempotent seeder for the Interview Preparation core subjects.
// Seeds every subject and topic and attaches notes, MCQs and interview questions
// from the matching files in ./data. Re-running is safe: the current subject's
// notes/MCQs/interview questions are replaced, topics are upserted in place.
//
// Usage: node scripts/seedInterviewPrep.js   (or: node scripts/seedInterviewPrep.js dsa)
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Note = require('../models/Note');
const MCQ = require('../models/MCQ');
const CoreInterviewQuestion = require('../models/CoreInterviewQuestion');

const SUBJECTS = [
  { name: 'DBMS', slug: 'dbms', description: 'Database Management Systems - Core concepts for placement interviews.', icon: 'Database', color: 'blue', order: 1 },
  { name: 'Operating Systems', slug: 'os', description: 'Operating Systems - Process management, memory, file systems.', icon: 'Monitor', color: 'green', order: 2 },
  { name: 'Computer Networks', slug: 'cns', description: 'Computer Networks - OSI/TCP models, protocols, addressing.', icon: 'Globe', color: 'purple', order: 3 },
  { name: 'SQL', slug: 'sql', description: 'Structured Query Language - DDL, DML, joins, subqueries.', icon: 'Table', color: 'cyan', order: 4 },
  { name: 'Java', slug: 'java', description: 'Java Programming - OOP, collections, multithreading.', icon: 'Coffee', color: 'orange', order: 5 },
  { name: 'Python', slug: 'python', description: 'Python Programming - Data structures, OOP, decorators.', icon: 'Snake', color: 'yellow', order: 6 },
  { name: 'DSA', slug: 'dsa', description: 'Data Structures & Algorithms - Arrays, trees, graphs, DP.', icon: 'Brain', color: 'red', order: 7 },
  { name: 'MERN Stack', slug: 'mern', description: 'MERN Stack - MongoDB, Express, React, Node.js.', icon: 'Layers', color: 'teal', order: 8 },
  { name: 'System Design', slug: 'system-design', description: 'System Design - Scalability, distributed systems.', icon: 'Architecture', color: 'indigo', order: 9 },
];

// Data files are auto-discovered by filename prefix so adding content is just
// dropping a file into ./data: e.g. dsaNotes.js, dsaNotes2.js, dsaMcqs3.js.
const FILE_KEYS = {
  dbms: 'dbms',
  os: 'os',
  cns: 'cns',
  sql: 'sql',
  java: 'java',
  python: 'python',
  dsa: 'dsa',
  mern: 'mern',
  'system-design': 'systemDesign',
};

function discoverFiles(subjectSlug, dir) {
  const key = FILE_KEYS[subjectSlug];
  const pattern = new RegExp(`^${key}(Notes|Mcqs|Interview)\\d*\\.js$`, 'i');
  const kindOf = { Notes: 'notes', Mcqs: 'mcqs', Interview: 'interview' };
  const files = { notes: [], mcqs: [], interview: [] };
  for (const file of fs.readdirSync(dir).sort()) {
    const match = pattern.exec(file);
    if (match) files[kindOf[match[1]]].push(file);
  }
  return files;
}


const TOPICS = {
  dbms: ['DBMS Introduction', 'DBMS vs File System', 'Three Schema Architecture', 'Data Independence', 'ER Model', 'Entities and Relationships', 'Keys', 'Functional Dependencies', 'Normalization', '1NF', '2NF', '3NF', 'BCNF', 'Transactions', 'ACID Properties', 'Transaction States', 'Concurrency Control', 'Serializability', 'Deadlocks', 'Indexing', 'B-Tree', 'B+ Tree', 'Views', 'Database Security', 'Recovery', 'Joins', 'Relational Algebra'],
  os: ['OS Introduction', 'Types of OS', 'Process', 'Process States', 'PCB', 'Threads', 'Process vs Thread', 'CPU Scheduling', 'FCFS', 'SJF', 'SRTF', 'Round Robin', 'Priority Scheduling', 'Synchronization', 'Critical Section', 'Mutex', 'Semaphore', 'Deadlock', 'Deadlock Prevention', 'Deadlock Avoidance', "Banker's Algorithm", 'Memory Management', 'Paging', 'Segmentation', 'Virtual Memory', 'Page Replacement', 'FIFO', 'LRU', 'Thrashing', 'File Systems'],
  cns: ['Network Basics', 'OSI Model', 'TCP/IP Model', 'OSI vs TCP/IP', 'Network Topologies', 'Network Devices', 'IP Addressing', 'IPv4', 'IPv6', 'Subnetting', 'MAC Address', 'ARP', 'DNS', 'DHCP', 'HTTP', 'HTTPS', 'FTP', 'SMTP', 'TCP', 'UDP', 'TCP vs UDP', 'TCP 3-Way Handshake', 'Flow Control', 'Congestion Control', 'Routing', 'Switching', 'Hub vs Switch vs Router', 'Firewall', 'Socket', 'Network Attacks'],
  sql: ['SQL Introduction', 'DDL', 'DML', 'DQL', 'DCL', 'TCL', 'CREATE', 'ALTER', 'DROP', 'INSERT', 'UPDATE', 'DELETE', 'SELECT', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'DISTINCT', 'Aggregate Functions', 'Joins', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'Self Join', 'Subqueries', 'Correlated Subqueries', 'UNION', 'UNION ALL', 'EXISTS', 'IN', 'BETWEEN', 'LIKE', 'CASE', 'Constraints', 'Primary Key', 'Foreign Key', 'UNIQUE', 'NOT NULL', 'CHECK', 'Indexes', 'Views', 'Stored Procedures', 'Triggers', 'Window Functions', 'CTE', 'Transactions'],
  java: ['Java Introduction', 'JVM JDK JRE', 'Data Types and Variables', 'Operators', 'Control Flow', 'Arrays', 'Strings', 'OOP Concepts', 'Inheritance', 'Polymorphism', 'Abstraction and Interfaces', 'Encapsulation', 'Exception Handling', 'Collections Framework', 'ArrayList vs LinkedList', 'HashMap', 'Generics', 'Multithreading', 'Thread Lifecycle', 'Synchronization', 'Lambda Expressions', 'Streams API', 'File I/O', 'Garbage Collection'],
  python: ['Python Introduction', 'Data Types', 'Variables and Scope', 'Operators', 'Control Flow', 'Lists', 'Tuples', 'Dictionaries', 'Sets', 'Strings', 'Functions', 'Lambda and Map Filter', 'Comprehensions', 'Modules and Packages', 'Exception Handling', 'File Handling', 'OOP in Python', 'Inheritance', 'Iterators and Generators', 'Decorators', 'Context Managers', 'Multithreading', 'Multiprocessing', 'JSON and Serialization'],
  dsa: ['DSA Introduction', 'Time and Space Complexity', 'Asymptotic Notation', 'Arrays', 'Two Pointers', 'Sliding Window', 'Prefix Sum', 'String Algorithms', 'Linked List', 'Doubly Linked List', 'Stack', 'Queue', 'Hashing', 'Recursion', 'Backtracking', 'Sorting Algorithms', 'Merge Sort', 'Quick Sort', 'Binary Search', 'Binary Tree', 'Binary Search Tree', 'Tree Traversals', 'Heap and Priority Queue', 'Graph Representation', 'BFS', 'DFS', 'Shortest Path', 'Topological Sort', 'Greedy Algorithms', 'Dynamic Programming', 'Trie'],
  mern: ['MERN Introduction', 'HTML Basics', 'CSS Basics', 'JavaScript Basics', 'ES6 Features', 'JavaScript Async', 'JavaScript DOM', 'React Introduction', 'JSX', 'Components', 'Props', 'State and useState', 'useEffect', 'React Hooks', 'React Router', 'Redux Toolkit', 'Context API', 'React Performance', 'Node.js Introduction', 'Node Event Loop', 'Node Modules and npm', 'Express Basics', 'Express Routing', 'Express Middleware', 'REST API Design', 'MongoDB Basics', 'Mongoose', 'MongoDB Indexing', 'Authentication with JWT', 'Error Handling in Express', 'MERN Deployment'],
  'system-design': ['System Design Introduction', 'Scalability', 'Load Balancing', 'Caching', 'CDN', 'Database Sharding', 'Database Replication', 'CAP Theorem', 'Consistency Models', 'SQL vs NoSQL', 'Message Queues', 'Microservices', 'API Gateway', 'Rate Limiting', 'Horizontal vs Vertical Scaling', 'Latency vs Throughput', 'Monitoring and Logging', 'Distributed Transactions', 'Consistent Hashing', 'Design a URL Shortener', 'Design a Chat Application', 'Design a News Feed', 'Design a Rate Limiter', 'Design a Payment System', 'Design a File Storage Service', 'Design a Notification System'],
};

const slugify = (text) => text.toLowerCase().replace(/\+/g, ' plus ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function loadRecords(files, dir) {
  const records = [];
  for (const file of files) {
    try {
      const mod = require(path.join(dir, file));
      if (Array.isArray(mod) && mod.length) records.push(...mod);
    } catch (error) {
      console.log(`  ! skipped ${file}: ${error.message}`);
    }
  }
  return records;
}
async function seedSubject(subjectDef, dir) {
  const subject = await Subject.findOneAndUpdate(
    { slug: subjectDef.slug },
    { ...subjectDef, isActive: true },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );

  const topicNames = TOPICS[subjectDef.slug] || [];
  const topicByName = new Map();
  for (let i = 0; i < topicNames.length; i += 1) {
    const name = topicNames[i];
    const topic = await Topic.findOneAndUpdate(
      { subject: subject._id, slug: slugify(name) },
      { subject: subject._id, name, slug: slugify(name), order: i + 1, isActive: true },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );
    topicByName.set(name, topic);
  }

  const files = discoverFiles(subjectDef.slug, dir);

  // Notes: rebuild for this subject only, so re-running is idempotent.
  const notes = loadRecords(files.notes, dir);
  await Note.deleteMany({ subject: subject._id });
  const noteDocs = [];
  notes.forEach((note, index) => {
    const topic = topicByName.get(note.topic);
    if (!topic) return;
    noteDocs.push({
      subject: subject._id, topic: topic._id, title: note.title, content: note.content,
      keyPoints: note.keyPoints || [], examples: note.examples || [],
      commonMistakes: note.commonMistakes || [], interviewTips: note.interviewTips || [],
      order: index + 1, isActive: true,
    });
  });
  if (noteDocs.length) await Note.insertMany(noteDocs);

  const mcqs = loadRecords(files.mcqs, dir);
  await MCQ.deleteMany({ subject: subject._id });
  const mcqDocs = [];
  mcqs.forEach((mcq) => {
    const topic = topicByName.get(mcq.topic);
    if (!topic) return;
    mcqDocs.push({
      subject: subject._id, topic: topic._id, question: mcq.question, options: mcq.options,
      correctAnswer: mcq.correctAnswer, explanation: mcq.explanation || '',
      difficulty: mcq.difficulty || 'medium', isActive: true,
    });
  });
  if (mcqDocs.length) await MCQ.insertMany(mcqDocs);

  const questions = loadRecords(files.interview, dir);
  await CoreInterviewQuestion.deleteMany({ subject: subject._id });
  const iqDocs = [];
  questions.forEach((q) => {
    const topic = topicByName.get(q.topic);
    if (!topic) return;
    iqDocs.push({
      subject: subject._id, topic: topic._id, question: q.question, answer: q.answer,
      explanation: q.explanation || '', difficulty: q.difficulty || 'medium',
      followUps: q.followUps || [], isActive: true,
    });
  });
  if (iqDocs.length) await CoreInterviewQuestion.insertMany(iqDocs);

  const topicsWithNotes = new Set(noteDocs.map(d => String(d.topic)));
  const topicsWithMcqs = new Set(mcqDocs.map(d => String(d.topic)));
  const topicsWithIqs = new Set(iqDocs.map(d => String(d.topic)));
  const missing = topicNames.filter((name) => {
    const id = String(topicByName.get(name)._id);
    return !topicsWithNotes.has(id) || !topicsWithMcqs.has(id) || !topicsWithIqs.has(id);
  });

  console.log(`\n=== ${subject.name} (${subject.slug}) ===`);
  console.log(`  topics: ${topicNames.length} | notes: ${noteDocs.length} | mcqs: ${mcqDocs.length} | interview: ${iqDocs.length}`);
  console.log(`  coverage gaps: ${missing.length ? missing.join(', ') : 'none'}`);
  return { topics: topicNames.length, notes: noteDocs.length, mcqs: mcqDocs.length, interview: iqDocs.length };
}

async function run() {
  const requested = process.argv.slice(2);
  const targets = requested.length ? SUBJECTS.filter(s => requested.includes(s.slug)) : SUBJECTS;
  if (!targets.length) {
    console.error(`Unknown subject slug. Valid options: ${SUBJECTS.map(s => s.slug).join(', ')}`);
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected. Seeding ${targets.length} subject(s)...`);
  const dir = path.join(__dirname, 'data');
  const totals = { topics: 0, notes: 0, mcqs: 0, interview: 0 };
  for (const subjectDef of targets) {
    const counts = await seedSubject(subjectDef, dir);
    totals.topics += counts.topics;
    totals.notes += counts.notes;
    totals.mcqs += counts.mcqs;
    totals.interview += counts.interview;
  }
  console.log(`\nDone. topics=${totals.topics} notes=${totals.notes} mcqs=${totals.mcqs} interview=${totals.interview}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (error) => {
  console.error('Seeding failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});