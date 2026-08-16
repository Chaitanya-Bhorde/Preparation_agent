const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const connection = mongoose.connection;

connection.on('connected', async () => {
  console.log('✅ MongoDB connected');

  const { UserStats, Leaderboard, UserFriends } = require('../models');

  try {
    // Verify models are registered
    console.log('✅ UserStats model loaded:', !!UserStats);
    console.log('✅ Leaderboard model loaded:', !!Leaderboard);
    console.log('✅ UserFriends model loaded:', !!UserFriends);

    // Check indexes (create collection first if needed by syncing indexes)
    await UserStats.createCollections ? null : null;
    await UserStats.ensureIndexes();
    const userStatsIndexes = await UserStats.collection.indexExists(true);
    const userStatsIndexNames = Object.keys(await UserStats.collection.getIndexes());
    console.log('✅ UserStats indexes:', userStatsIndexNames);

    await Leaderboard.ensureIndexes();
    const leaderboardIndexNames = Object.keys(await Leaderboard.collection.getIndexes());
    console.log('✅ Leaderboard indexes:', leaderboardIndexNames);

    await UserFriends.ensureIndexes();
    const userFriendsIndexNames = Object.keys(await UserFriends.collection.getIndexes());
    console.log('✅ UserFriends indexes:', userFriendsIndexNames);

    console.log('\n✅ All models loaded and indexes verified!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
});

mongoose.connect(process.env.MONGO_URI);