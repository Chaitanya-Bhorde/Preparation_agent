const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const connection = mongoose.connection;
connection.on('connected', async () => {
  try {
    const db = mongoose.connection.db;
    const indexes = await db.collection('leaderboards').indexes();
    console.log('Current leaderboards indexes:');
    indexes.forEach(i => console.log(` - ${i.name}: ${JSON.stringify(i.key)} unique=${!!i.unique}`));

    // Drop any index keyed on `user` (old schema) and any legacy unique userId index
    for (const idx of indexes) {
      if (idx.name === 'user_1' || idx.name === 'userId_1' ||
          (idx.key['user'] !== undefined) || (idx.unique && idx.key['userId'] !== undefined)) {
        await db.collection('leaderboards').dropIndex(idx.name);
        console.log(`✅ Dropped index: ${idx.name}`);
      }
    }
    console.log('\n✅ Cleanup complete. Remaining indexes:');
    (await db.collection('leaderboards').indexes()).forEach(i => console.log(` - ${i.name}`));
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
});
mongoose.connect(process.env.MONGO_URI);