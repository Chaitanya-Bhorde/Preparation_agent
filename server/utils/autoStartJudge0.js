const { exec, spawn } = require('child_process');
const path = require('path');

const JUDGE0_DIR = path.join(__dirname, '..', '..', 'judge0-server');

// Check if Docker is running
const checkDocker = () => {
  return new Promise((resolve) => {
    exec('docker ps', (error) => {
      resolve(!error);
    });
  });
};

// Check if Judge0 is already running
const checkJudge0 = async () => {
  try {
    const axios = require('axios');
    await axios.get('http://localhost:2358/status', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
};

// Start Judge0
const startJudge0 = () => {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting Judge0...');
    
    // Try docker compose (new syntax)
    const compose = spawn('docker', ['compose', '-f', 'docker-compose.yml', 'up', '-d'], {
      cwd: JUDGE0_DIR,
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    compose.stdout.on('data', (data) => {
      output += data.toString();
    });

    compose.stderr.on('data', (data) => {
      output += data.toString();
    });

    compose.on('close', (code) => {
      if (code === 0 || output.includes('is up-to-date') || output.includes('Running')) {
        console.log('✅ Judge0 started');
        resolve();
      } else {
        console.log('⚠️  Judge0 auto-start failed. Please start Docker Desktop manually.');
        console.log('   Then run: cd judge0-server && docker compose up -d');
        resolve(); // Don't reject, let server start anyway
      }
    });

    compose.on('error', (err) => {
      console.log('⚠️  Could not auto-start Judge0. Please start Docker Desktop manually.');
      resolve(); // Don't reject
    });
  });
};

const autoStart = async () => {
  console.log('🔍 Checking Docker...');
  const dockerRunning = await checkDocker();

  if (!dockerRunning) {
    // IMPORTANT: never call process.exit(1) here when running inside the web
    // server. Previously this killed the whole backend right after startup,
    // which made every /api/coding/run and /api/coding/submit fail. When
    // CODING_EXECUTION_ENGINE=local the app does not even need Judge0.
    console.log('❌ Docker is not running — skipping Judge0 auto-start.');
    console.log('   The server continues without Judge0. To enable Judge0:');
    console.log('   1. Start Docker Desktop');
    console.log('   2. cd judge0-server && docker compose up -d');
    console.log('   (or keep CODING_EXECUTION_ENGINE=local to run code on this machine)');
    return false;
  }

  console.log('✅ Docker is running');

  const judge0Running = await checkJudge0();

  if (!judge0Running) {
    await startJudge0();
    // Wait for Judge0 to fully start
    await new Promise(resolve => setTimeout(resolve, 5000));
  } else {
    console.log('✅ Judge0 already running');
  }
  return true;
};

// Export for use in server.js
if (require.main === module) {
  autoStart()
    .then((ok) => {
      if (ok) {
        console.log('✅ Setup complete! Starting server...\n');
      }
      process.exit(ok ? 0 : 1);
    })
    .catch((err) => {
      console.error('Error:', err);
      process.exit(1);
    });
} else {
  module.exports = { autoStart };
}
