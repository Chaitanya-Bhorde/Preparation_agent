const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Clear all cached models to pick up schema changes
if (mongoose.models) {
  Object.keys(mongoose.models).forEach(key => delete mongoose.models[key]);
}
if (mongoose.modelSchemas) {
  Object.keys(mongoose.modelSchemas).forEach(key => delete mongoose.modelSchemas[key]);
}

const leaderboardService = require('../services/leaderboardService');

const connection = mongoose.connection;

connection.on('connected', async () => {
  console.log('✅ MongoDB connected\n');

  try {
    // Test global leaderboard computation
    console.log('🔄 Computing global leaderboard...');
    const globalResult = await leaderboardService.computeGlobalLeaderboard();
    console.log('✅ Global leaderboard result:', globalResult);

    // Test college leaderboards computation
    console.log('\n🔄 Computing college leaderboards...');
    const collegeResult = await leaderboardService.computeCollegeLeaderboards();
    console.log('✅ College leaderboard result:', collegeResult);

    // Test fetching global leaderboard
    console.log('\n🔄 Fetching global leaderboard (top 10)...');
    const globalLeaderboard = await leaderboardService.getLeaderboard('Global', {
      limit: 10,
      page: 1
    });
    console.log('✅ Global leaderboard fetched:');
    console.log(JSON.stringify(globalLeaderboard.leaderboard, null, 2));
    console.log(`Total users: ${globalLeaderboard.pagination.total}`);

    console.log('\n✅ All leaderboard tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
});

mongoose.connect(process.env.MONGO_URI);