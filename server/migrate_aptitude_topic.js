const mongoose = require('mongoose');
const AptitudeQuestion = require('./models/AptitudeQuestion');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent';

async function migrate() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await AptitudeQuestion.updateMany(
      { topic: { $exists: false } },
      [{ $set: { topic: '$category' } }]
    );

    console.log(`Migration complete: ${result.nModified} documents updated`);
    mongoose.connection.close();
  } catch (error) {
    console.error('Migration failed:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

migrate();
