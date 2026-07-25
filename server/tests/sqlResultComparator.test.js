const { normalizeRows, rowsMatch, findMissingRows, findExtraRows, findWrongValueRows, compareResults, executeAndCompare } = require('../utils/sqlResultComparator');

describe('normalizeRows', () => {
  it('should return empty array for null input', () => {
    expect(normalizeRows(null)).toEqual([]);
  });

  it('should return empty array for undefined input', () => {
    expect(normalizeRows(undefined)).toEqual([]);
  });

  it('should return empty array for empty array input', () => {
    expect(normalizeRows([])).toEqual([]);
  });

  it('should sort columns alphabetically', () => {
    const rows = [{ b: 1, a: 2, c: 3 }];
    const result = normalizeRows(rows);
    expect(Object.keys(result[0])).toEqual(['a', 'b', 'c']);
  });

  it('should convert undefined to null', () => {
    const rows = [{ a: 1, b: undefined }];
    const result = normalizeRows(rows);
    expect(result[0]).toEqual({ a: 1, b: null });
  });

  it('should sort rows by all columns', () => {
    const rows = [{ name: 'Bob', salary: 50000 }, { name: 'Alice', salary: 60000 }];
    const result = normalizeRows(rows);
    expect(result[0].name).toBe('Alice');
    expect(result[1].name).toBe('Bob');
  });

  it('should sort rows with nulls last', () => {
    const rows = [{ name: 'Bob', salary: 50000 }, { name: null, salary: null }];
    const result = normalizeRows(rows);
    expect(result[0].name).toBe('Bob');
    expect(result[1].name).toBeNull();
  });

  it('should handle multiple rows with same values', () => {
    const rows = [{ a: 1 }, { a: 1 }, { a: 2 }];
    const result = normalizeRows(rows);
    expect(result).toHaveLength(3);
    expect(result[0].a).toBe(1);
    expect(result[1].a).toBe(1);
    expect(result[2].a).toBe(2);
  });
});

describe('rowsMatch', () => {
  it('should return true for identical rows', () => {
    const actual = [{ name: 'Alice', salary: 100000 }];
    const expected = [{ name: 'Alice', salary: 100000 }];
    expect(rowsMatch(actual, expected)).toBe(true);
  });

  it('should return false for different lengths', () => {
    const actual = [{ name: 'Alice' }];
    const expected = [{ name: 'Alice' }, { name: 'Bob' }];
    expect(rowsMatch(actual, expected)).toBe(false);
  });

  it('should return false for different column values', () => {
    const actual = [{ name: 'Alice', salary: 100000 }];
    const expected = [{ name: 'Alice', salary: 120000 }];
    expect(rowsMatch(actual, expected)).toBe(false);
  });

  it('should return true for empty arrays', () => {
    expect(rowsMatch([], [])).toBe(true);
  });

  it('should return false for different column counts', () => {
    const actual = [{ name: 'Alice', salary: 100000, dept: 'Eng' }];
    const expected = [{ name: 'Alice', salary: 100000 }];
    expect(rowsMatch(actual, expected)).toBe(false);
  });

  it('should handle null values', () => {
    const actual = [{ name: 'Bob', amount: null }];
    const expected = [{ name: 'Bob', amount: null }];
    expect(rowsMatch(actual, expected)).toBe(true);
  });

  it('should return false when null vs value mismatch', () => {
    const actual = [{ name: 'Bob', amount: null }];
    const expected = [{ name: 'Bob', amount: 100 }];
    expect(rowsMatch(actual, expected)).toBe(false);
  });
});

describe('findMissingRows', () => {
  it('should find rows present in expected but not in actual', () => {
    const actual = [{ id: 1, name: 'Alice' }];
    const expected = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
    const missing = findMissingRows(actual, expected);
    expect(missing).toHaveLength(1);
    expect(missing[0]).toEqual({ id: 2, name: 'Bob' });
  });

  it('should return empty when all rows are present', () => {
    const actual = [{ id: 1 }, { id: 2 }];
    const expected = [{ id: 1 }, { id: 2 }];
    expect(findMissingRows(actual, expected)).toEqual([]);
  });

  it('should detect missing with null values', () => {
    const actual = [{ id: 1, name: null }];
    const expected = [{ id: 1, name: null }, { id: 2, name: 'Bob' }];
    expect(findMissingRows(actual, expected)).toHaveLength(1);
  });
});

describe('findExtraRows', () => {
  it('should find rows present in actual but not in expected', () => {
    const actual = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const expected = [{ id: 1 }, { id: 2 }];
    const extra = findExtraRows(actual, expected);
    expect(extra).toHaveLength(1);
    expect(extra[0]).toEqual({ id: 3 });
  });

  it('should return empty when no extra rows', () => {
    const actual = [{ id: 1 }];
    const expected = [{ id: 1 }];
    expect(findExtraRows(actual, expected)).toEqual([]);
  });
});

describe('findWrongValueRows', () => {
  it('should find rows with mismatched column values', () => {
    const actual = [{ name: 'Alice', salary: 100000 }];
    const expected = [{ name: 'Alice', salary: 120000 }];
    const wrong = findWrongValueRows(actual, expected);
    expect(wrong).toHaveLength(1);
    expect(wrong[0].mismatchedColumns).toEqual(['salary']);
    expect(wrong[0].index).toBe(0);
  });

  it('should return empty when all values match', () => {
    const actual = [{ name: 'Alice', salary: 100000 }];
    const expected = [{ name: 'Alice', salary: 100000 }];
    expect(findWrongValueRows(actual, expected)).toEqual([]);
  });

  it('should handle empty arrays', () => {
    expect(findWrongValueRows([], [])).toEqual([]);
  });

  it('should not report extra rows as wrong values', () => {
    const actual = [{ a: 1 }, { a: 2 }];
    const expected = [{ a: 1 }];
    expect(findWrongValueRows(actual, expected)).toEqual([]);
  });

  it('should report multiple wrong columns', () => {
    const actual = [{ name: 'Alice', salary: 100000, dept: 'Eng' }];
    const expected = [{ name: 'Alice', salary: 120000, dept: 'Sales' }];
    const wrong = findWrongValueRows(actual, expected);
    expect(wrong).toHaveLength(1);
    expect(wrong[0].mismatchedColumns).toEqual(['dept', 'salary']);
  });
});

describe('compareResults', () => {
  it('should return match true for identical rows', () => {
    const result = compareResults(
      [{ name: 'Alice', salary: 100000 }],
      [{ name: 'Alice', salary: 100000 }]
    );
    expect(result.match).toBe(true);
  });

  it('should return match false for different rows', () => {
    const result = compareResults(
      [{ name: 'Alice', salary: 100000 }],
      [{ name: 'Alice', salary: 120000 }]
    );
    expect(result.match).toBe(false);
  });

  it('should return match false when rows are missing', () => {
    const result = compareResults(
      [{ name: 'Alice', salary: 100000 }],
      [{ name: 'Alice', salary: 100000 }, { name: 'Bob', salary: 50000 }]
    );
    expect(result.match).toBe(false);
    expect(result.details.missingRows).toHaveLength(1);
  });

  it('should return match false when extra rows exist', () => {
    const result = compareResults(
      [{ name: 'Alice', salary: 100000 }, { name: 'Charlie', salary: 80000 }],
      [{ name: 'Alice', salary: 100000 }]
    );
    expect(result.match).toBe(false);
    expect(result.details.extraRows).toHaveLength(1);
  });

  it('should handle empty arrays comparison', () => {
    const result = compareResults([], []);
    expect(result.match).toBe(true);
  });

  it('should handle column-order-independent comparison', () => {
    const result = compareResults(
      [{ salary: 100000, name: 'Alice' }],
      [{ name: 'Alice', salary: 100000 }]
    );
    expect(result.match).toBe(true);
  });

  it('should handle row-order-independent comparison', () => {
    const result = compareResults(
      [{ name: 'Bob' }, { name: 'Alice' }],
      [{ name: 'Alice' }, { name: 'Bob' }]
    );
    expect(result.match).toBe(true);
  });

  it('should handle multiple data types', () => {
    const result = compareResults(
      [{ id: 1, name: 'Alice', salary: 100000.50, hired: true }],
      [{ id: 1, name: 'Alice', salary: 100000.50, hired: true }]
    );
    expect(result.match).toBe(true);
  });

  it('should detect complex mismatch with missing, extra, wrong', () => {
    const actual = [
      { id: 1, val: 'a' },
      { id: 2, val: 'b' },
      { id: 5, val: 'e' },
    ];
    const expected = [
      { id: 1, val: 'a' },
      { id: 2, val: 'x' },
      { id: 3, val: 'c' },
    ];
    const result = compareResults(actual, expected);
    expect(result.match).toBe(false);
    expect(result.details.missingRows.length).toBeGreaterThan(0);
    expect(result.details.extraRows.length).toBeGreaterThan(0);
    expect(result.details.wrongValueRows.length).toBeGreaterThan(0);
  });
});

describe('executeAndCompare', () => {
  it('should execute SQL and compare results correctly', async () => {
    const schema = `CREATE TABLE test (id INT, name VARCHAR(50));
INSERT INTO test VALUES (1, 'Alice');
INSERT INTO test VALUES (2, 'Bob');`;
    const query = 'SELECT * FROM test';
    const expected = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    const result = await executeAndCompare(schema, '', query, expected);
    expect(result.match).toBe(true);
  });

  it('should detect wrong results from SQL', async () => {
    const schema = `CREATE TABLE test (id INT, name VARCHAR(50));
INSERT INTO test VALUES (1, 'Alice');
INSERT INTO test VALUES (2, 'Bob');`;
    const query = 'SELECT * FROM test';
    const expected = [
      { id: 1, name: 'Alice' },
    ];
    const result = await executeAndCompare(schema, '', query, expected);
    expect(result.match).toBe(false);
  });

  it('should handle inputStateSQL for additional setup', async () => {
    const schema = `CREATE TABLE test (id INT, name VARCHAR(50));
INSERT INTO test VALUES (1, 'Alice');`;
    const inputState = `INSERT INTO test VALUES (2, 'Bob');`;
    const query = 'SELECT * FROM test ORDER BY id';
    const expected = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    const result = await executeAndCompare(schema, inputState, query, expected);
    expect(result.match).toBe(true);
  });

  it('should return error for invalid SQL', async () => {
    const schema = 'CREATE TABLE test (id INT);';
    const query = 'SELECT * FROM nonexistent';
    const expected = [];
    const result = await executeAndCompare(schema, '', query, expected);
    expect(result.match).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle empty table', async () => {
    const schema = 'CREATE TABLE test (id INT);';
    const query = 'SELECT * FROM test';
    const expected = [];
    const result = await executeAndCompare(schema, '', query, expected);
    expect(result.match).toBe(true);
  });
});