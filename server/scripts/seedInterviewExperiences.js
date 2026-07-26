const mongoose = require('mongoose');
const InterviewExperience = require('../models/InterviewExperience');
const User = require('../models/User');

const experiences = [
  {
    company: 'Google', role: 'SDE-1', year: 2024, roundType: 'Technical Round 1',
    difficulty: 'Medium', experience: '45-min Google Meet interview. Two coding problems on shared doc.',
    tips: 'Practice graph problems. Communicate thought process clearly.',
    offerReceived: true, packageOffered: '24 LPA',
    questions: [
      { question: 'Longest substring without repeating characters', answer: 'Sliding window with hash map', topic: 'Strings' },
      { question: 'Detect cycle in directed graph', answer: 'DFS with three colors', topic: 'Graphs' },
    ],
  },
  {
    company: 'Microsoft', role: 'SDE-2', year: 2024, roundType: 'Technical Round 2',
    difficulty: 'Hard', experience: 'Design round for real-time collaboration system.',
    tips: 'Study system design. Understand CAP theorem.',
    offerReceived: true, packageOffered: '42 LPA',
    questions: [
      { question: 'Design collaborative document editing', answer: 'Operational Transformation', topic: 'System Design' },
      { question: 'Offline support strategy', answer: 'Local-first with CRDTs', topic: 'System Design' },
    ],
  },
  {
    company: 'Amazon', role: 'SDE-1', year: 2023, roundType: 'Online Assessment',
    difficulty: 'Easy', experience: '2 coding + 1 debugging on HackerEarth. 90 mins.',
    tips: 'Practice LeetCode. Focus on arrays and strings.',
    offerReceived: false, packageOffered: '',
    questions: [
      { question: 'Two sum problem', answer: 'Hash map O(n)', topic: 'Arrays' },
      { question: 'Valid BST check', answer: 'In-order traversal', topic: 'Trees' },
    ],
  },
  {
    company: 'Adobe', role: 'SDE-1', year: 2024, roundType: 'HR Round',
    difficulty: 'Medium', experience: 'Conversational HR round. Asked about background and goals.',
    tips: 'Research company. Use STAR method.',
    offerReceived: true, packageOffered: '28 LPA',
    questions: [
      { question: 'Why Adobe?', answer: 'Innovation in creative software', topic: 'Behavioral' },
      { question: 'Difficult team member', answer: 'STAR conflict mediation', topic: 'Behavioral' },
    ],
  },
  {
    company: 'Goldman Sachs', role: 'Analyst', year: 2023, roundType: 'Technical Round 1',
    difficulty: 'Hard', experience: 'Finance-focused problems. Stock trading algorithm optimization.',
    tips: 'Financial algorithms. Optimization problems.',
    offerReceived: false, packageOffered: '',
    questions: [
      { question: 'Max profit with k transactions', answer: 'DP state transition', topic: 'Dynamic Programming' },
      { question: 'Range query data structure', answer: 'Segment tree', topic: 'Data Structures' },
    ],
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent');
    console.log('MongoDB connected');
    const users = await User.find({}).limit(1);
    const userId = users.length > 0 ? users[0]._id : null;
    await InterviewExperience.deleteMany({});
    console.log('Cleared existing experiences');
    const data = experiences.map(exp => ({ ...exp, user: userId }));
    await InterviewExperience.insertMany(data);
    console.log(`Seeded ${experiences.length} experiences`);
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seed();
