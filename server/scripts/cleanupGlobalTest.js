const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connection = mongoose.connection;
connection.on('connected', async () => {
  try {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({ email: /^tlbtest/ }).toArray();
    const ids = users.map(u => u._id);
    if (ids.length) {
      await db.collection('userstats').deleteMany({ userId: { $in: ids } });
      await db.collection('users').deleteMany({ _id: { $in: ids } });
    }
    await db.collection('leaderboards').deleteMany({ leaderboardType: 'Global' });
    console.log(`✅ Cleaned ${ids.length} test users + userstats + global leaderboard snapshots`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
});
mongoose.connect(process.env.MONGO_URI);