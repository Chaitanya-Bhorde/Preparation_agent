/**
 * Unit tests for the SQL display projection.
 *
 * The projection derives the schema table list and the worked example from
 * content that is ALREADY stored (schemaSetupSQL + sampleTestCases). These
 * tests pin the two properties that matter: it must never invent content, and
 * it must never touch hidden test data.
 */
const {
  projectSqlProblem, parseSchemaTables, parseInserts, splitStatements, coerceLiteral, columnsOf,
} = require('../sqlSchemaProjection');

const SCRIPT = [
  "CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(100), budget INT);",
  "CREATE TABLE employees (id INT, name VARCHAR(100), department_id INT, salary DECIMAL(10,2));",
  "INSERT INTO departments VALUES (1, 'Engineering', 2000000), (2, 'Sales', 900000);",
  "INSERT INTO employees VALUES (1, 'Alice', 1, 120000), (2, 'Bob', 2, 95000);",
].join('\n');

describe('P8 — SQL schema/sample projection (no fabrication)', () => {
  it('splits statements without breaking on semicolons inside string literals', () => {
    const parts = splitStatements("INSERT INTO t VALUES ('a;b'); INSERT INTO t VALUES ('c');");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toContain("'a;b'");
  });

  it('derives table names, column names and SQL types from the DDL', () => {
    const tables = parseSchemaTables(SCRIPT);
    expect(tables.map((t) => t.tableName)).toEqual(['departments', 'employees']);

    const dept = tables[0];
    expect(dept.columns.map((c) => c.name)).toEqual(['id', 'name', 'budget']);
    expect(dept.columns[0].type).toBe('INT');
    expect(dept.columns[0].notes).toMatch(/PRIMARY KEY/);
    expect(dept.columns[1].type).toBe('VARCHAR(100)');

    const emp = tables[1];
    expect(emp.columns[3].type).toBe('DECIMAL(10,2)');
  });

  it('derives the sample rows and coerces literals to real values', () => {
    const tables = parseSchemaTables(SCRIPT);
    const inserts = parseInserts(SCRIPT, tables);
    expect(inserts.map((i) => i.tableName)).toEqual(['departments', 'employees']);

    const departments = inserts[0].rows;
    expect(departments).toHaveLength(2);
    expect(departments[0]).toEqual({ id: 1, name: 'Engineering', budget: 2000000 });
    expect(typeof departments[0].budget).toBe('number');

    const employees = inserts[1].rows;
    expect(employees[1].name).toBe('Bob');
    expect(employees[1].salary).toBe(95000);
  });

  it('coerces SQL literals correctly', () => {
    expect(coerceLiteral('42')).toBe(42);
    expect(coerceLiteral("'hi'")).toBe('hi');
    expect(coerceLiteral("'O''Brien'")).toBe("O'Brien");
    expect(coerceLiteral('NULL')).toBeNull();
    expect(coerceLiteral('TRUE')).toBe(true);
  });

  it('columnsOf preserves first-seen key order across heterogeneous rows', () => {
    expect(columnsOf([{ b: 1 }, { a: 2 }, { b: 3 }])).toEqual(['b', 'a']);
  });

  it('builds a worked example from the stored sample case when none is authored', () => {
    const projected = projectSqlProblem({
      title: 'T',
      schemaSetupSQL: SCRIPT,
      schemaTables: [],
      examples: [],
      sampleTestCases: [{ inputStateSQL: '', expectedOutputRows: [{ name: 'Alice' }, { name: 'Bob' }] }],
      hiddenTestCases: [{ inputStateSQL: 'SECRET_INSERT', expectedOutputRows: [{ name: 'SECRET' }] }],
    });

    expect(projected.schemaTables).toHaveLength(2);
    expect(projected.examples).toHaveLength(1);

    const ex = projected.examples[0];
    expect(ex.inputTables.map((t) => t.tableName)).toEqual(['departments', 'employees']);
    expect(ex.inputTables[1].rows[0]).toEqual({ id: 1, name: 'Alice', department_id: 1, salary: 120000 });
    expect(ex.outputTable).toEqual({ columns: ['name'], rows: [{ name: 'Alice' }, { name: 'Bob' }] });
  });

  it('NEVER reads or leaks hidden test data', () => {
    const projected = projectSqlProblem({
      title: 'T',
      schemaSetupSQL: SCRIPT,
      sampleTestCases: [{ inputStateSQL: '', expectedOutputRows: [{ name: 'Alice' }] }],
      hiddenTestCases: [
        { inputStateSQL: 'INSERT INTO employees VALUES (99, "SECRET_NAME", 9, 1);', expectedOutputRows: [{ name: 'SECRET_NAME' }] },
      ],
    });
    const serialised = JSON.stringify(projected.examples);
    expect(serialised).not.toContain('SECRET_NAME');
    expect(serialised).not.toContain('SECRET_INSERT');
  });

  it('authored schemaTables and examples always win over the derived ones', () => {
    const authored = projectSqlProblem({
      schemaSetupSQL: SCRIPT,
      schemaTables: [{ tableName: 'HandWritten', columns: [{ name: 'x', type: 'INT' }] }],
      examples: [{ exampleNumber: 9, inputTables: [], outputTable: { columns: [], rows: [] } }],
      sampleTestCases: [{ inputStateSQL: '', expectedOutputRows: [{ a: 1 }] }],
    });
    expect(authored.schemaTables[0].tableName).toBe('HandWritten');
    expect(authored.examples[0].exampleNumber).toBe(9);
  });

  it('returns empty arrays rather than inventing content when nothing is available', () => {
    const projected = projectSqlProblem({ title: 'Empty', schemaSetupSQL: '', sampleTestCases: [] });
    expect(projected.schemaTables).toEqual([]);
    expect(projected.examples).toEqual([]);
  });

  it('does not mutate the input document', () => {
    const original = { schemaSetupSQL: SCRIPT, schemaTables: [], examples: [], sampleTestCases: [] };
    const snapshot = JSON.stringify(original);
    projectSqlProblem(original);
    expect(JSON.stringify(original)).toBe(snapshot);
  });

  it('tolerates a null problem', () => {
    expect(projectSqlProblem(null)).toBeNull();
  });

  it('handles an explicit column list on INSERT', () => {
    const tables = parseSchemaTables('CREATE TABLE t (a INT, b VARCHAR(10));');
    const inserts = parseInserts("INSERT INTO t (b, a) VALUES ('x', 7);", tables);
    expect(inserts[0].rows[0]).toEqual({ b: 'x', a: 7 });
  });
});
