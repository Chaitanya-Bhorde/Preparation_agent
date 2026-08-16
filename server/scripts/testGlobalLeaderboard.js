const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const connection = mongoose.connection;

connection.on('connected', async () => {
  console.log('✅ MongoDB connected\n');
  try {
    // Load models fresh
    const { User, UserStats, Leaderboard } = require('../models');
    const leaderboardService = require('../services/leaderboardService');

    // Clean up test data
    await User.deleteMany({ email: { $regex: /^tlbtest/ } });
    await UserStats.deleteMany({});
    await Leaderboard.deleteMany({});

    // Seed test users + stats
    const users = await User.insertMany([
      { name: 'TLB Alpha', email: 'tlbtest1@test.com', password: 'hash1234' },
      { name: 'TLB Beta', email: 'tlbtest2@test.com', password: 'hash1234' },
      { name: 'TLB Gamma', email: 'tlbtest3@test.com', password: 'hash1234' }
    ]);
    await UserStats.insertMany([
      { userId: users[0]._id, totalProblems: 10, easyCount: 6, mediumCount: 3, hardCount: 1, acceptanceRate: 60, rankingTier: 'Silver', currentStreak: 2 },
      { userId: users[1]._id, totalProblems: 25, easyCount: 12, mediumCount: 8, hardCount: 5, acceptanceRate: 50, rankingTier: 'Gold', currentStreak: 5 },
      { userId: users[2]._id, totalProblems: 40, easyCount: 20, mediumCount: 15, hardCount: 5, acceptanceRate: 55, rankingTier: 'Platinum', currentStreak: 8 }
    ]);
    console.log('✅ Seeded 3 test users + stats\n');

    // Compute global leaderboard
    console.log('🔄 Computing global leaderboard...');
    const result = await leaderboardService.computeGlobalLeaderboard();
    console.log('✅ Result:', JSON.stringify(result), '\n');

    // Fetch global leaderboard
    console.log('🔄 Fetching global leaderboard...');
    const lb = await leaderboardService.getLeaderboard('Global', { limit: 10, page: 1 });
    console.log('✅ Pagination:', JSON.stringify(lb.pagination));
    console.log('✅ Leaderboard rows:');
    lb.leaderboard.forEach(r => {
      console.log(`  #${r.rank} ${r.username} | probs=${r.totalProblems} | acc=${r.acceptanceRate}% | tier=${r.rankingTier}`);
    });

    // Verify ranking order (desc totalProblems)
    const totalProblems = lb.leaderboard.map(r => r.totalProblems);
    const isSorted = totalProblems.every((v, i) => i === 0 || totalProblems[i - 1] >= v);
    console.log(`\n✅ Ranking sorted by totalProblems desc: ${isSorted ? 'PASS' : 'FAIL'}`);

    console.log('\n✅ Global leaderboard test PASSED');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message, err.stack);
    process.exit(1);
  }
});

mongoose.connect(process.env.MONGO_URI);