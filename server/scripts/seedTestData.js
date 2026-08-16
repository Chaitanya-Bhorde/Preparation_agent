const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { User, UserStats, UserFriends, CodingProblem } = require('../models');

const connection = mongoose.connection;

connection.on('connected', async () => {
  console.log('✅ MongoDB connected\n');

  try {
    // Clean up old test data
    console.log('🔄 Cleaning old test data...');
    await User.deleteMany({ email: { $regex: /^testuser/ } });
    await UserStats.deleteMany({});
    await UserFriends.deleteMany({});
    await CodingProblem.deleteMany({});
    console.log('✅ Cleanup complete\n');

    // Create test users
    console.log('🔄 Creating 5 test users...');
    const users = await User.insertMany([
      { name: 'Test User 1', username: 'testuser1', email: 'testuser1@test.com', password: 'hash1234', collegeId: null },
      { name: 'Test User 2', username: 'testuser2', email: 'testuser2@test.com', password: 'hash1234', collegeId: null },
      { name: 'Test User 3', username: 'testuser3', email: 'testuser3@test.com', password: 'hash1234', collegeId: null },
      { name: 'Test User 4', username: 'testuser4', email: 'testuser4@test.com', password: 'hash1234', collegeId: null },
      { name: 'Test User 5', username: 'testuser5', email: 'testuser5@test.com', password: 'hash1234', collegeId: null }
    ]);
    console.log(`✅ Created ${users.length} test users\n`);

    // Create UserStats for each user
    console.log('🔄 Creating UserStats for each user...');
    const userStats = await UserStats.insertMany([
      {
        userId: users[0]._id,
        totalProblems: 45,
        easyCount: 20,
        mediumCount: 15,
        hardCount: 10,
        totalSubmissions: 120,
        successfulSubmissions: 45,
        acceptanceRate: 37.5,
        currentStreak: 5,
        longestStreak: 12,
        rankingTier: 'Gold',
        languageStats: { JavaScript: 15, Java: 20, Python: 10 },
        categoryStats: new Map([['Binary Search', 8], ['Linked List', 12]])
      },
      {
        userId: users[1]._id,
        totalProblems: 38,
        easyCount: 15,
        mediumCount: 15,
        hardCount: 8,
        totalSubmissions: 95,
        successfulSubmissions: 38,
        acceptanceRate: 40.0,
        currentStreak: 3,
        longestStreak: 8,
        rankingTier: 'Silver',
        languageStats: { JavaScript: 10, Java: 15, Python: 13 },
        categoryStats: new Map([['Arrays', 10], ['Trees', 8]])
      },
      {
        userId: users[2]._id,
        totalProblems: 52,
        easyCount: 25,
        mediumCount: 18,
        hardCount: 9,
        totalSubmissions: 150,
        successfulSubmissions: 56,
        acceptanceRate: 37.14,
        currentStreak: 7,
        longestStreak: 15,
        rankingTier: 'Platinum',
        languageStats: { JavaScript: 20, Java: 15, Python: 17 },
        categoryStats: new Map([['Dynamic Programming', 15], ['Graphs', 12]])
      },
      {
        userId: users[3]._id,
        totalProblems: 25,
        easyCount: 10,
        mediumCount: 10,
        hardCount: 5,
        totalSubmissions: 60,
        successfulSubmissions: 25,
        acceptanceRate: 41.67,
        currentStreak: 2,
        longestStreak: 5,
        rankingTier: 'Bronze',
        languageStats: { JavaScript: 5, Java: 8, Python: 12 },
        categoryStats: new Map([['Math', 5], ['Strings', 8]])
      },
      {
        userId: users[4]._id,
        totalProblems: 60,
        easyCount: 30,
        mediumCount: 20,
        hardCount: 10,
        totalSubmissions: 100,
        successfulSubmissions: 23,
        acceptanceRate: 23.0,
        currentStreak: 10,
        longestStreak: 20,
        rankingTier: 'Diamond',
        languageStats: { JavaScript: 25, Java: 20, Python: 15 },
        categoryStats: new Map([['Dynamic Programming', 20], ['Binary Search', 15]])
      }
    ]);
    console.log(`✅ Created ${userStats.length} UserStats records\n`);

    // Create Coding Problems
    console.log('🔄 Creating Coding Problems...');
    const problems = await CodingProblem.insertMany([
      { problemId: 'prob1', title: 'Two Sum', topic: 'Arrays', description: 'Given an array of integers, find two numbers that add up to a target value.', difficulty: 'easy', slug: 'two-sum-1' },
      { problemId: 'prob2', title: 'Longest Substring', topic: 'Strings', description: 'Find the length of the longest substring without repeating characters.', difficulty: 'medium', slug: 'longest-substring-1' },
      { problemId: 'prob3', title: 'DP Coin Change', topic: 'Dynamic Programming', description: 'Given coin denominations and a total amount, find the fewest coins needed.', difficulty: 'hard', slug: 'dp-coin-change-1' }
    ]);
    console.log(`✅ Created ${problems.length} Coding Problems\n`);

    // Create UserFriends relationships
    console.log('🔄 Creating UserFriends relationships...');
    await UserFriends.insertMany([
      {
        userId: users[0]._id,
        friends: [
          { friendId: users[1]._id, addedAt: new Date() },
          { friendId: users[2]._id, addedAt: new Date() }
        ]
      },
      {
        userId: users[1]._id,
        friends: [
          { friendId: users[0]._id, addedAt: new Date() }
        ]
      },
      {
        userId: users[2]._id,
        friends: [
          { friendId: users[0]._id, addedAt: new Date() }
        ]
      },
      {
        userId: users[3]._id,
        friends: [
          { friendId: users[4]._id, addedAt: new Date() }
        ]
      },
      {
        userId: users[4]._id,
        friends: [
          { friendId: users[3]._id, addedAt: new Date() }
        ]
      }
    ]);
    console.log('✅ Created UserFriends relationships\n');

    console.log('🎉 All test data seeded successfully!\n');
    console.log('Expected ranking order (by totalProblems desc, then acceptanceRate desc):');
    console.log('1. testuser5: 60 problems, 23.0% acceptance (Diamond)');
    console.log('2. testuser3: 52 problems, 37.14% acceptance (Platinum)');
    console.log('3. testuser1: 45 problems, 37.5% acceptance (Gold)');
    console.log('4. testuser2: 38 problems, 40.0% acceptance (Silver)');
    console.log('5. testuser4: 25 problems, 41.67% acceptance (Bronze)\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding test data:', err.message);
    process.exit(1);
  }
});

mongoose.connect(process.env.MONGO_URI);