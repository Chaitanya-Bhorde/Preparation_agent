/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  maxWorkers: 1,
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
