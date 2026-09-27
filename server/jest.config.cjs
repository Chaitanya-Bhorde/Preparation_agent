/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  maxWorkers: 1,
  // Suites that boot MongoMemoryServer need more than Jest's 5000 ms default:
  // on a clean machine the first create() downloads and starts a mongod binary,
  // which can take tens of seconds. The default caused "Exceeded timeout of
  // 5000 ms for a hook" on CI while passing only where the binary was cached.
  testTimeout: 120000,
  // Fixtures/data files inside __tests__ folders must not be executed as suites.
  testPathIgnorePatterns: ['/node_modules/', '\\.data\\.js$'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    'middleware/**/*.js',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
};
