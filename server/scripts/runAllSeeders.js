const { exec } = require('child_process');
const path = require('path');

const seeders = [
  'seedConceptNotes.js',
  'seedCodingProblemsExpanded.js',
  'seedSQLProblemsExpanded.js',
];

async function runSeeders() {
  for (const seedFile of seeders) {
    const seedPath = path.join(__dirname, seedFile);
    console.log(`\n========================================`);
    console.log(`Running ${seedFile}...`);
    console.log(`========================================\n`);

    await new Promise((resolve, reject) => {
      exec(`node ${seedPath}`, (error, stdout, stderr) => {
        console.log(stdout);
        if (stderr) console.error(stderr);
        if (error) {
          console.error(`Error running ${seedFile}:`, error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  console.log('\n========================================');
  console.log('All seeders completed successfully!');
  console.log('========================================\n');
  process.exit(0);
}

runSeeders().catch((error) => {
  console.error('Seeder execution failed:', error);
  process.exit(1);
});