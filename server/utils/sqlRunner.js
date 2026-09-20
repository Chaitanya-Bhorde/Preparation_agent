const { executeSQL, createSandbox, closeSandbox, validateQuerySafety, getSandboxHealth } = require('./sqlSandbox');

/**
 * SQL Execution Engine - runs user queries in isolated sandbox
 * 
 * Security:
 * - Uses sql.js (WASM SQLite) - in-memory database
 * - Each execution gets a fresh database instance  
 * - Time-limited (default 5s timeout)
 * - Dangerous operations blocked (DROP, ALTER, GRANT, etc.)
 * - No access to production databases
 * - Error messages sanitized
 */
async function runSQL({ query, schemaSetup, testCases, expectedOutputs, timeoutMs = 5000 } = {}) {
  return executeSQL({ query, schemaSetup, testCases, expectedOutputs, timeoutMs });
}

/**
 * Backward compatible alias
 */
const executeSQLOld = runSQL;

/**
 * Health check
 */
async function checkSQLHealth() {
  return getSandboxHealth();
}

module.exports = { 
  executeSQL: runSQL,
  runSQL,
  executeAndCompare: runSQL,
  checkSQLHealth,
  validateQuery: validateQuerySafety,
};