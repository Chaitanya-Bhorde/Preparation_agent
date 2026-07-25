const initSqlJs = require('sql.js');

function normalizeRows(rows) {
  if (!rows || rows.length === 0) return [];
  const keys = Object.keys(rows[0]).sort();
  return rows.map(row => {
    const normalized = {};
    keys.forEach(k => {
      normalized[k] = row[k] === undefined || row[k] === null ? null : row[k];
    });
    return normalized;
  }).sort((a, b) => {
    for (const k of keys) {
      const va = a[k];
      const vb = b[k];
      if (va === null && vb === null) continue;
      if (va === null) return 1;
      if (vb === null) return -1;
      if (va < vb) return -1;
      if (va > vb) return 1;
    }
    return 0;
  });
}

function rowsMatch(actual, expected) {
  if (actual.length !== expected.length) return false;
  for (let i = 0; i < actual.length; i++) {
    const aKeys = Object.keys(actual[i]);
    const eKeys = Object.keys(expected[i]);
    if (aKeys.length !== eKeys.length) return false;
    for (const k of aKeys) {
      if (actual[i][k] !== expected[i][k]) return false;
    }
  }
  return true;
}

function findMissingRows(actual, expected) {
  return expected.filter(eRow =>
    !actual.some(aRow => {
      const eKeys = Object.keys(eRow);
      return eKeys.every(k => aRow[k] === eRow[k]);
    })
  );
}

function findExtraRows(actual, expected) {
  return actual.filter(aRow =>
    !expected.some(eRow => {
      const eKeys = Object.keys(eRow);
      return eKeys.every(k => aRow[k] === eRow[k]);
    })
  );
}

function findWrongValueRows(actual, expected) {
  const wrong = [];
  const actualByContent = new Map();
  actual.forEach((row, idx) => {
    const key = JSON.stringify(Object.keys(row).sort().map(k => String(row[k])));
    if (!actualByContent.has(key)) actualByContent.set(key, []);
    actualByContent.get(key).push({ row, idx });
  });

  const expectedByContent = new Map();
  expected.forEach((row, idx) => {
    const key = JSON.stringify(Object.keys(row).sort().map(k => String(row[k])));
    if (!expectedByContent.has(key)) expectedByContent.set(key, []);
    expectedByContent.get(key).push({ row, idx });
  });

  for (const [key, actualEntries] of actualByContent) {
    const expectedEntries = expectedByContent.get(key);
    if (expectedEntries && actualEntries.length === expectedEntries.length) {
      for (let i = 0; i < actualEntries.length; i++) {
        const a = actualEntries[i].row;
        const e = expectedEntries[i].row;
        const allKeys = [...new Set([...Object.keys(a), ...Object.keys(e)])].sort();
        const mismatchedColumns = allKeys.filter(k => a[k] !== e[k]);
        if (mismatchedColumns.length > 0) {
          wrong.push({
            index: actualEntries[i].idx,
            actual: a,
            expected: e,
            mismatchedColumns,
          });
        }
      }
    } else if (!expectedEntries) {
      const aKeys = Object.keys(actualEntries[0].row);
      const potentialMatches = expected.filter(eRow => {
        return aKeys.every(k => eRow.hasOwnProperty(k));
      });
      for (const aEntry of actualEntries) {
        for (const potential of potentialMatches) {
          const allKeys = [...new Set([...Object.keys(aEntry.row), ...Object.keys(potential)])].sort();
          const mismatchedColumns = allKeys.filter(k => aEntry.row[k] !== potential[k]);
          if (mismatchedColumns.length > 0 && mismatchedColumns.length < Object.keys(potential).length) {
            wrong.push({
              index: aEntry.idx,
              actual: aEntry.row,
              expected: potential,
              mismatchedColumns,
            });
          }
        }
      }
    }
  }
  return wrong;
}

function compareResults(actualRows, expectedRows) {
  const normalizedActual = normalizeRows(actualRows);
  const normalizedExpected = normalizeRows(expectedRows);

  const match = rowsMatch(normalizedActual, normalizedExpected);

  if (match) {
    return { match: true, details: { missingRows: [], extraRows: [], wrongValueRows: [] } };
  }

  const missingRows = findMissingRows(normalizedActual, normalizedExpected);
  const extraRows = findExtraRows(normalizedActual, normalizedExpected);
  const wrongValueRows = findWrongValueRows(normalizedActual, normalizedExpected);

  return {
    match: false,
    details: {
      missingRows,
      extraRows,
      wrongValueRows,
      normalizedActual,
      normalizedExpected,
    },
  };
}

async function executeAndCompare(schemaSetupSQL, inputStateSQL, userQuery, expectedOutputRows) {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  try {
    if (schemaSetupSQL) {
      db.run(schemaSetupSQL);
    }
    if (inputStateSQL) {
      db.run(inputStateSQL);
    }

    const stmt = db.prepare(userQuery);
    const cols = stmt.getColumnNames();
    const actualRows = [];
    while (stmt.step()) {
      actualRows.push(stmt.getAsObject());
    }
    stmt.free();
    db.close();

    return compareResults(actualRows, expectedOutputRows);
  } catch (error) {
    db.close();
    return { match: false, error: error.message, details: { missingRows: [], extraRows: [], wrongValueRows: [] } };
  }
}

module.exports = { normalizeRows, rowsMatch, findMissingRows, findExtraRows, findWrongValueRows, compareResults, executeAndCompare };