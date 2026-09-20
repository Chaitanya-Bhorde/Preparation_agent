/**
 * SQL Sandbox - isolated SQL execution using sql.js (WASM SQLite)
 * Security: In-memory database, fresh per execution, restricted operations
 */

const initSqlJs = require('sql.js');
let SQL = null;

async function getSQL() {
  if (!SQL) SQL = await initSqlJs();
  return SQL;
}

const DANGEROUS_PATTERNS = [
  /DROP\s+(TABLE|SCHEMA|DATABASE|VIEW|FUNCTION|INDEX)/i,
  /ALTER\s+(TABLE|SCHEMA|DATABASE)/i,
  /CREATE\s+(DATABASE|USER|ROLE|VIEW|TRIGGER|FUNCTION)/i,
  /GRANT\s+/i, /REVOKE\s+/i,
  /DELETE\s+FROM/i, /INSERT\s+INTO/i, /UPDATE\s+/i, /MERGE\s+/i,
  /EXEC(UTE)?\s+/i, /CALL\s+/i, /LOAD\s+/i, /COPY\s+/i,
  /IMPORT\s+/i, /EXPORT\s+/i, /ATTACH\s+/i, /DETACH\s+/i,
];

const BLOCKED_TABLES = ['sqlite_', 'information_schema', 'pg_catalog'];

function validateQuerySafety(query) {
  if (!query || typeof query !== 'string') throw new Error('Invalid query');
  const trimmed = query.trim();
  if (trimmed.length === 0) throw new Error('Empty query');
  if (trimmed.length > 10000) throw new Error('Query too long');
  const upperQuery = trimmed.toUpperCase();
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(upperQuery)) throw new Error('Disallowed operation');
  }
  for (const table of BLOCKED_TABLES) {
    if (new RegExp('\\b' + table, 'i').test(upperQuery)) throw new Error('Access denied');
  }
  return true;
}

async function createSandbox() {
  const sql = await getSQL();
  return new sql.Database();
}

function closeSandbox(db) {
  if (db) db.close();
}

function determineStatementType(query) {
  const t = query.trim().toUpperCase();
  if (t.startsWith('SELECT')) return 'SELECT';
  if (t.startsWith('WITH')) return 'CTE';
  if (t.startsWith('INSERT')) return 'INSERT';
  if (t.startsWith('UPDATE')) return 'UPDATE';
  if (t.startsWith('DELETE')) return 'DELETE';
  if (t.startsWith('CREATE')) return 'CREATE';
  return 'UNKNOWN';
}

function processSQLResult(result, query) {
  if (!result || result.length === 0) {
    return { rows: [], rowCount: 0, columns: [], statementType: determineStatementType(query) };
  }
  const firstResult = result[0];
  const columns = firstResult.columns || [];
  const values = firstResult.values || [];
  const rows = values.map(row => {
    const rowObj = {};
    columns.forEach((col, idx) => { rowObj[col] = row[idx]; });
    return rowObj;
  });
  return { rows, rowCount: rows.length, columns, statementType: determineStatementType(query) };
}

function compareResults(actualRows, expectedRows, mode = 'exact') {
  const actual = Array.isArray(actualRows) ? actualRows : [actualRows];
  const expected = Array.isArray(expectedRows) ? expectedRows : [expectedRows];
  
  if (mode === 'exact') {
    if (actual.length !== expected.length) {
      return { passed: false, actual, expected, message: 'Row count mismatch' };
    }
    for (let i = 0; i < actual.length; i++) {
      const aRow = actual[i], eRow = expected[i];
      const aKeys = Object.keys(aRow).sort(), eKeys = Object.keys(eRow).sort();
      if (aKeys.join() !== eKeys.join()) {
        return { passed: false, actual, expected, message: 'Column mismatch' };
      }
      for (const key of aKeys) {
        if (JSON.stringify(aRow[key]) !== JSON.stringify(eRow[key])) {
          return { passed: false, actual, expected, message: 'Value mismatch at row ' + (i + 1) };
        }
      }
    }
    return { passed: true, actual, expected, message: 'Results match' };
  }
  
  if (mode === 'set') {
    const actualSet = new Set(actual.map(r => JSON.stringify(Object.entries(r).sort())));
    const expectedSet = new Set(expected.map(r => JSON.stringify(Object.entries(r).sort())));
    if (actualSet.size !== expectedSet.size) {
      return { passed: false, actual, expected, message: 'Row count mismatch' };
    }
    for (const item of expectedSet) {
      if (!actualSet.has(item)) {
        return { passed: false, actual, expected, message: 'Sets do not match' };
      }
    }
    return { passed: true, actual, expected, message: 'Results match (set mode)' };
  }
  
  return compareResults(actualRows, expectedRows, 'exact');
}

function sanitizeError(error) {
  const msg = error?.message || String(error);
  if (msg.includes('SQLITE_ERROR')) {
    if (msg.includes('syntax') || msg.includes('near')) return 'SQL syntax error. Please check your query.';
    if (msg.includes('no such table')) return 'Table not found. Please check your table name.';
    if (msg.includes('no such column')) return 'Column not found. Please check your column name.';
    if (msg.includes('constraint')) return 'Constraint violation. Please check your data.';
  }
  if (msg.includes('timeout')) return 'Query execution timed out. Please simplify your query.';
  return msg.length > 500 ? 'Query execution failed. Please check your query.' : msg;
}

async function executeSQL({ query, schemaSetup, testCases, expectedOutputs, timeoutMs = 5000 }) {
  let db;
  try {
    db = await createSandbox();
    
    if (schemaSetup) {
      const statements = schemaSetup.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (trimmed) {
          const upper = trimmed.toUpperCase();
          if (/DROP\s/i.test(upper)) throw new Error('DROP not allowed');
          db.run(trimmed);
        }
      }
    }
    
    validateQuerySafety(query);
    const startTime = Date.now();
    let result;
    try {
      result = db.exec(query);
    } catch (execError) {
      return { success: false, error: sanitizeError(execError) };
    }
    const executionTime = Date.now() - startTime;
    if (executionTime > timeoutMs) {
      return { success: false, error: 'Query execution timed out' };
    }
    
    const processedResults = processSQLResult(result, query);
    
    const comparisonResults = [];
    if (testCases && expectedOutputs && processedResults.rows.length > 0) {
      for (let i = 0; i < Math.min(testCases.length, expectedOutputs.length); i++) {
        const comparison = compareResults(
          processedResults.rows,
          expectedOutputs[i],
          testCases[i]?.comparisonMode || 'exact'
        );
        comparisonResults.push({
          testCaseIndex: i,
          passed: comparison.passed,
          expected: expectedOutputs[i],
          actual: comparison.actual,
          message: comparison.message,
        });
      }
    }
    
    return {
      success: true,
      data: processedResults,
      comparisonResults,
      passedCount: comparisonResults.filter(r => r.passed).length,
      totalCount: comparisonResults.length,
      executionTime,
    };
  } catch (error) {
    return { success: false, error: sanitizeError(error) };
  } finally {
    if (db) closeSandbox(db);
  }
}

async function getSandboxHealth() {
  try {
    const db = await createSandbox();
    db.run('CREATE TABLE test (id INTEGER)');
    db.exec('SELECT 1 as test');
    closeSandbox(db);
    return { healthy: true, message: 'SQL sandbox is operational' };
  } catch (error) {
    return { healthy: false, message: sanitizeError(error) };
  }
}

module.exports = { executeSQL, createSandbox, closeSandbox, validateQuerySafety, getSandboxHealth };