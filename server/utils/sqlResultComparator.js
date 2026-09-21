/**
 * SQL Result Comparator - compares query results with expected outputs
 * Used for testing SQL queries against expected results
 */

/**
 * Compare two result sets
 * @param {Array} actual - Actual query results
 * @param {Array} expected - Expected results
 * @param {string} mode - 'exact' (order matters) or 'set' (order doesn't matter)
 */
function compareSQLResults(actual, expected, mode = 'exact') {
  // Normalize to arrays
  const actualRows = Array.isArray(actual) ? actual : [actual];
  const expectedRows = Array.isArray(expected) ? expected : [expected];
  
  if (mode === 'exact') {
    // Exact match: same rows in same order
    if (actualRows.length !== expectedRows.length) {
      return {
        passed: false,
        actual: actualRows,
        expected: expectedRows,
        message: `Row count mismatch: expected ${expectedRows.length}, got ${actualRows.length}`
      };
    }
    
    for (let i = 0; i < actualRows.length; i++) {
      const aRow = actualRows[i];
      const eRow = expectedRows[i];
      const aKeys = Object.keys(aRow).sort();
      const eKeys = Object.keys(eRow).sort();
      
      if (aKeys.join() !== eKeys.join()) {
        return {
          passed: false,
          actual: actualRows,
          expected: expectedRows,
          message: `Column mismatch at row ${i + 1}`
        };
      }
      
      for (const key of aKeys) {
        if (JSON.stringify(aRow[key]) !== JSON.stringify(eRow[key])) {
          return {
            passed: false,
            actual: actualRows,
            expected: expectedRows,
            message: `Value mismatch at row ${i + 1}, column ${key}`
          };
        }
      }
    }
    
    return { passed: true, actual: actualRows, expected: expectedRows, message: 'Results match exactly' };
  }
  
  if (mode === 'set') {
    // Multiset match: same rows, any order, duplicates respected
    // (a plain Set would dedupe repeated rows and wrongly treat
    //  [{id:1},{id:1}] as equal to [{id:1}])
    const countRows = (rows) => {
      const counts = new Map();
      for (const r of rows) {
        const key = JSON.stringify(Object.entries(r).sort());
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      return counts;
    };
    const actualCounts = countRows(actualRows);
    const expectedCounts = countRows(expectedRows);

    if (actualCounts.size !== expectedCounts.size) {
      return {
        passed: false,
        actual: actualRows,
        expected: expectedRows,
        message: `Row count mismatch (set mode): expected ${expectedRows.length} rows, got ${actualRows.length}`
      };
    }

    for (const [key, count] of expectedCounts) {
      if (actualCounts.get(key) !== count) {
        return {
          passed: false,
          actual: actualRows,
          expected: expectedRows,
          message: actualCounts.has(key)
            ? `Row frequency mismatch (set mode): a row appears ${actualCounts.get(key)} time(s) but expected ${count}`
            : 'Result sets do not match'
        };
      }
    }

    return { passed: true, actual: actualRows, expected: expectedRows, message: 'Results match (set mode)' };
  }
  
  // Default to exact
  return compareSQLResults(actual, expected, 'exact');
}

module.exports = { compareSQLResults };
