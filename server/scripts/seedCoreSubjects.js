require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Note = require('../models/Note');
const MCQ = require('../models/MCQ');
const CoreInterviewQuestion = require('../models/CoreInterviewQuestion');
const DBMS_MCQS_1 = require('./data/dbmsMcqs1');
const DBMS_MCQS_2 = require('./data/dbmsMcqs2');
const DBMS_MCQS_3 = require('./data/dbmsMcqs3');
const DBMS_MCQS_4 = require('./data/dbmsMcqs4');
const DBMS_MCQS_5 = require('./data/dbmsMcqs5');
const OS_MCQS_1 = require('./data/osMcqs1');
const OS_MCQS_2 = require('./data/osMcqs2');
const CNS_MCQS_1 = require('./data/cnsMcqs1');
const CNS_MCQS_2 = require('./data/cnsMcqs2');
const SQL_MCQS_1 = require('./data/sqlMcqs1');
const SQL_MCQS_2 = require('./data/sqlMcqs2');

const DBMS_ALL_MCQS = [...DBMS_MCQS_1, ...DBMS_MCQS_2, ...DBMS_MCQS_3, ...DBMS_MCQS_4, ...DBMS_MCQS_5];
const OS_ALL_MCQS = [...OS_MCQS_1, ...OS_MCQS_2];
const CNS_ALL_MCQS = [...CNS_MCQS_1, ...CNS_MCQS_2];
const SQL_ALL_MCQS = [...SQL_MCQS_1, ...SQL_MCQS_2];
const DBMS_INTERVIEW_QS = require('./data/dbmsInterview');
const DBMS_INTERVIEW_QS_2 = require('./data/dbmsInterview2');
const DBMS_ALL_INTERVIEW = [...DBMS_INTERVIEW_QS, ...DBMS_INTERVIEW_QS_2];
const DBMS_NOTES = require('./data/dbmsNotes');
const OS_NOTES = require('./data/osNotes');
const CNS_NOTES = require('./data/cnsNotes');
const SQL_NOTES = require('./data/sqlNotes');

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

const TOPICS = {
  dbms: ['DBMS Introduction', 'DBMS vs File System', 'Three Schema Architecture', 'Data Independence', 'ER Model', 'Entities and Relationships', 'Keys', 'Functional Dependencies', 'Normalization', '1NF', '2NF', '3NF', 'BCNF', 'Transactions', 'ACID Properties', 'Transaction States', 'Concurrency Control', 'Serializability', 'Deadlocks', 'Indexing', 'B-Tree', 'B+ Tree', 'Views', 'Database Security', 'Recovery', 'Joins', 'Relational Algebra'],
  os: ['OS Introduction', 'Types of OS', 'Process', 'Process States', 'PCB', 'Threads', 'Process vs Thread', 'CPU Scheduling', 'FCFS', 'SJF', 'SRTF', 'Round Robin', 'Priority Scheduling', 'Synchronization', 'Critical Section', 'Mutex', 'Semaphore', 'Deadlock', 'Deadlock Prevention', 'Deadlock Avoidance', "Banker's Algorithm", 'Memory Management', 'Paging', 'Segmentation', 'Virtual Memory', 'Page Replacement', 'FIFO', 'LRU', 'Thrashing', 'File Systems'],
  cns: ['Network Basics', 'OSI Model', 'TCP/IP Model', 'OSI vs TCP/IP', 'Network Topologies', 'Network Devices', 'IP Addressing', 'IPv4', 'IPv6', 'Subnetting', 'MAC Address', 'ARP', 'DNS', 'DHCP', 'HTTP', 'HTTPS', 'FTP', 'SMTP', 'TCP', 'UDP', 'TCP vs UDP', 'TCP 3-Way Handshake', 'Flow Control', 'Congestion Control', 'Routing', 'Switching', 'Hub vs Switch vs Router', 'Firewall', 'Socket', 'Network Attacks'],
  sql: ['SQL Introduction', 'DDL', 'DML', 'DQL', 'DCL', 'TCL', 'CREATE', 'ALTER', 'DROP', 'INSERT', 'UPDATE', 'DELETE', 'SELECT', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'DISTINCT', 'Aggregate Functions', 'Joins', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'Self Join', 'Subqueries', 'Correlated Subqueries', 'UNION', 'UNION ALL', 'EXISTS', 'IN', 'BETWEEN', 'LIKE', 'CASE', 'Constraints', 'Primary Key', 'Foreign Key', 'UNIQUE', 'NOT NULL', 'CHECK', 'Indexes', 'Views', 'Stored Procedures', 'Triggers', 'Window Functions', 'CTE', 'Transactions'],
};


const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    await Subject.deleteMany({});
    await Topic.deleteMany({});
    await Note.deleteMany({});
    await MCQ.deleteMany({});
    await CoreInterviewQuestion.deleteMany({});
    for (const subjData of SUBJECTS) {
      const subject = await Subject.create(subjData);
      console.log(`Seeded subject: ${subject.name}`);
      const topicNames = TOPICS[subjData.slug] || [];
      for (let i = 0; i < topicNames.length; i++) {
        const slug = slugify(topicNames[i]);
        await Topic.findOneAndUpdate(
          { subject: subject._id, slug },
          { subject: subject._id, name: topicNames[i], slug, order: i },
          { upsert: true, new: true }
        );
      }
      console.log(`  Seeded ${topicNames.length} topics`);
    }
    const dbmsSubject = await Subject.findOne({ slug: 'dbms' });
    if (dbmsSubject && DBMS_ALL_MCQS.length > 0) {
      const dbmsTopics = await Topic.find({ subject: dbmsSubject._id });
      const topicMap = {};
      dbmsTopics.forEach(t => { topicMap[t.name] = t._id; });
      const mcqsToInsert = DBMS_ALL_MCQS.map(m => ({
        subject: dbmsSubject._id, topic: topicMap[m.topic] || dbmsTopics[0]._id,
        question: m.question, options: m.options, correctAnswer: m.correctAnswer,
        explanation: m.explanation, difficulty: m.difficulty,
      }));
      await MCQ.insertMany(mcqsToInsert);
      console.log(`Seeded ${mcqsToInsert.length} DBMS MCQs`);
    }
    const osSubject = await Subject.findOne({ slug: 'os' });
    if (osSubject && OS_ALL_MCQS.length > 0) {
      const osTopics = await Topic.find({ subject: osSubject._id });
      const topicMap = {};
      osTopics.forEach(t => { topicMap[t.name] = t._id; });
      const mcqsToInsert = OS_ALL_MCQS.map(m => ({
        subject: osSubject._id, topic: topicMap[m.topic] || osTopics[0]._id,
        question: m.question, options: m.options, correctAnswer: m.correctAnswer,
        explanation: m.explanation, difficulty: m.difficulty,
      }));
      await MCQ.insertMany(mcqsToInsert);
      console.log(`Seeded ${mcqsToInsert.length} OS MCQs`);
    }
    const cnsSubject = await Subject.findOne({ slug: 'cns' });
    if (cnsSubject && CNS_ALL_MCQS.length > 0) {
      const cnsTopics = await Topic.find({ subject: cnsSubject._id });
      const topicMap = {};
      cnsTopics.forEach(t => { topicMap[t.name] = t._id; });
      const mcqsToInsert = CNS_ALL_MCQS.map(m => ({
        subject: cnsSubject._id, topic: topicMap[m.topic] || cnsTopics[0]._id,
        question: m.question, options: m.options, correctAnswer: m.correctAnswer,
        explanation: m.explanation, difficulty: m.difficulty,
      }));
      await MCQ.insertMany(mcqsToInsert);
      console.log(`Seeded ${mcqsToInsert.length} CNS MCQs`);
    }
    const sqlSubject = await Subject.findOne({ slug: 'sql' });
    if (sqlSubject && SQL_ALL_MCQS.length > 0) {
      const sqlTopics = await Topic.find({ subject: sqlSubject._id });
      const topicMap = {};
      sqlTopics.forEach(t => { topicMap[t.name] = t._id; });
      const mcqsToInsert = SQL_ALL_MCQS.map(m => ({
        subject: sqlSubject._id, topic: topicMap[m.topic] || sqlTopics[0]._id,
        question: m.question, options: m.options, correctAnswer: m.correctAnswer,
        explanation: m.explanation, difficulty: m.difficulty,
      }));
      await MCQ.insertMany(mcqsToInsert);
      console.log(`Seeded ${mcqsToInsert.length} SQL MCQs`);
    }
    // Seed DBMS Interview Questions
    if (dbmsSubject && DBMS_ALL_INTERVIEW.length > 0) {
      const dbmsTopics = await Topic.find({ subject: dbmsSubject._id });
      const topicMap = {};
      dbmsTopics.forEach(t => { topicMap[t.name] = t._id; });
      const iqsToInsert = DBMS_ALL_INTERVIEW.map(q => ({
        subject: dbmsSubject._id, topic: topicMap[q.topic] || dbmsTopics[0]._id,
        question: q.question, answer: q.answer, explanation: q.explanation || '',
        difficulty: q.difficulty, followUps: q.followUps || [],
      }));
      await CoreInterviewQuestion.insertMany(iqsToInsert);
      console.log(`Seeded ${iqsToInsert.length} DBMS Interview Questions`);
    }
    // Seed DBMS Notes
    if (dbmsSubject && DBMS_NOTES.length > 0) {
      const dbmsTopics = await Topic.find({ subject: dbmsSubject._id });
      const topicMap = {};
      dbmsTopics.forEach(t => { topicMap[t.name] = t._id; });
      const notesToInsert = DBMS_NOTES.map(n => ({
        subject: dbmsSubject._id, topic: topicMap[n.topic] || dbmsTopics[0]._id,
        title: n.title, content: n.content, keyPoints: n.keyPoints || [],
        interviewTips: n.interviewTips || [], order: 0,
      }));
      await Note.insertMany(notesToInsert);
      console.log(`Seeded ${notesToInsert.length} DBMS Notes`);
    }
    // Seed OS Notes
    if (osSubject && OS_NOTES.length > 0) {
      const osTopics = await Topic.find({ subject: osSubject._id });
      const topicMap = {};
      osTopics.forEach(t => { topicMap[t.name] = t._id; });
      const notesToInsert = OS_NOTES.map(n => ({
        subject: osSubject._id, topic: topicMap[n.topic] || osTopics[0]._id,
        title: n.title, content: n.content, keyPoints: n.keyPoints || [],
        interviewTips: n.interviewTips || [], order: 0,
      }));
      await Note.insertMany(notesToInsert);
      console.log(`Seeded ${notesToInsert.length} OS Notes`);
    }
    // Seed CNS Notes
    if (cnsSubject && CNS_NOTES.length > 0) {
      const cnsTopics = await Topic.find({ subject: cnsSubject._id });
      const topicMap = {};
      cnsTopics.forEach(t => { topicMap[t.name] = t._id; });
      const notesToInsert = CNS_NOTES.map(n => ({
        subject: cnsSubject._id, topic: topicMap[n.topic] || cnsTopics[0]._id,
        title: n.title, content: n.content, keyPoints: n.keyPoints || [],
        interviewTips: n.interviewTips || [], order: 0,
      }));
      await Note.insertMany(notesToInsert);
      console.log(`Seeded ${notesToInsert.length} CNS Notes`);
    }
    // Seed SQL Notes
    if (sqlSubject && SQL_NOTES.length > 0) {
      const sqlTopics = await Topic.find({ subject: sqlSubject._id });
      const topicMap = {};
      sqlTopics.forEach(t => { topicMap[t.name] = t._id; });
      const notesToInsert = SQL_NOTES.map(n => ({
        subject: sqlSubject._id, topic: topicMap[n.topic] || sqlTopics[0]._id,
        title: n.title, content: n.content, keyPoints: n.keyPoints || [],
        interviewTips: n.interviewTips || [], order: 0,
      }));
      await Note.insertMany(notesToInsert);
      console.log(`Seeded ${notesToInsert.length} SQL Notes`);
    }
    console.log('Seed completed successfully');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}
seed();
