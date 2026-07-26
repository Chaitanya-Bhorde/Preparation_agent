const mongoose = require('mongoose');
const SQLProblem = require('./models/SQLProblem');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent');
    console.log('Connected to MongoDB');
    
    const count = await SQLProblem.countDocuments();
    console.log('Total SQL Problems:', count);
    
    const problems = await SQLProblem.find().limit(3);
    console.log('\nFirst 3 problems:');
    problems.forEach(p => {
      console.log(`- ${p.title} | slug: ${p.slug} | difficulty: ${p.difficulty}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

check();