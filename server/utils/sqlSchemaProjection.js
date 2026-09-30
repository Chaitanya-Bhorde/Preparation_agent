/**
 * sqlSchemaProjection.js
 * ---------------------------------------------------------------------------
 * Builds the DISPLAY structures for a SQL problem (schema tables + a worked
 * example with sample data and the expected output table) from data that is
 * ALREADY stored in the database.
 *
 * WHY THIS EXISTS
 *   All 49 SQL problems in the bank have `schemaTables: []` and `examples: []`,
 *   so the client never rendered a schema or a sample table. But the content is
 *   not missing — it lives inside `schemaSetupSQL` (the CREATE TABLE DDL and the
 *   INSERT statements that populate it) and inside
 *   `sampleTestCases[].expectedOutputRows`. This module PROJECTS that existing
 *   content into the shape the UI needs.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *   It never invents a constraint, a column, a row or an expected output. Every
 *   value returned is parsed out of stored text or read straight from a stored
 *   array. If nothing can be derived, the field comes back as an empty array
 *   and the UI shows an honest "not recorded" state. A fabricated sample table
 *   would be worse than a missing one, because it would make a wrong query look
 *   Accepted.
 *
 * HIDDEN TEST CASES
 *   Only `sampleTestCases` is ever read here. `hiddenTestCases` is never
 *   touched, so nothing from the hidden suite can reach the client through this
 *   path.
 * ---------------------------------------------------------------------------
 */

/** Split a SQL script into statements, ignoring the contents of string literals. */
function splitStatements(sql) {
  const text = String(sql || '');
  const statements = [];
  let current = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'") {
      // '' is an escaped quote inside a literal, not a terminator.
      if (inString && text[i + 1] === "'") { current += "''"; i++; continue; }
      inString = !inString;
      current += ch;
      continue;
    }
    if (ch === ';' && !inString) { statements.push(current); current = ''; continue; }
    current += ch;
  }
  if (current.trim()) statements.push(current);
  return statements.map((s) => s.trim()).filter(Boolean);
}

/** Split on a delimiter that is not inside parentheses, quotes or brackets. */
function splitTopLevel(body, delimiter) {
  const parts = [];
  let depth = 0;
  let inString = false;
  let current = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "'") {
      if (inString && body[i + 1] === "'") { current += "''"; i++; continue; }
      inString = !inString;
      current += ch;
      continue;
    }
    if (!inString) {
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
      else if (ch === delimiter && depth === 0) { parts.push(current.trim()); current = ''; continue; }
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

// A SQL type keyword, optionally carrying a precision specifier:
// VARCHAR(100), DECIMAL(10,2), etc.
const isTypeKeyword = (word) =>
  /^(INT|INTEGER|BIGINT|SMALLINT|TINYINT|VARCHAR|CHAR|TEXT|DATE|DATETIME|TIMESTAMP|TIME|BOOLEAN|BOOL|REAL|DOUBLE|FLOAT|DECIMAL|NUMERIC|BLOB|JSON|NULL)(\s*\([\s\d,]*\))?$/i.test(String(word || '').trim());

/** Find the index of the first top-level comma. */
function topLevelCommaIndex(body) {
  const parts = splitTopLevel(body, ',');
  if (parts.length <= 1) return -1;
  // Re-scan to locate the boundary precisely.
  let depth = 0; let inString = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "'") { if (inString && body[i + 1] === "'") { i++; continue; } inString = !inString; continue; }
    if (inString) continue;
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (ch === ',' && depth === 0) return i;
  }
  return -1;
}


/**
 * Parse the CREATE TABLE statements of a script into displayable table
 * definitions: `[{ tableName, columns: [{ name, type, notes }] }]`.
 */
function parseSchemaTables(script) {
  const tables = [];
  for (const statement of splitStatements(script)) {
    const match = /^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"\[]?[\w.]+[`"\]]?)\s*\(([\s\S]*)\)\s*$/i.exec(statement);
    if (!match) continue;
    const tableName = match[1].replace(/[`"\[\]]/g, '');
    const columns = [];
    let primaryKey = null;

    for (const rawPart of splitTopLevel(match[2], ',')) {
      const part = rawPart.trim();
      if (!part) continue;

      const tokens = part.split(/\s+/);
      const firstName = (tokens[0] || '').replace(/[`"\[\]]/g, '');
      let typeIndex = 1;
      while (typeIndex < tokens.length && !isTypeKeyword(tokens[typeIndex])) typeIndex++;

      // A part is a COLUMN definition when a type keyword follows the first
      // identifier. `id INT PRIMARY KEY` is therefore a column with a PRIMARY
      // KEY note, whereas a bare `PRIMARY KEY (id)` is a table constraint.
      if (typeIndex >= tokens.length) {
        const pk = /PRIMARY\s+KEY\s*\(([^)]*)\)/i.exec(part);
        if (pk) {
          primaryKey = pk[1].replace(/[`"\[\]]/g, '').trim();
        } else if (/^(UNIQUE|CHECK|FOREIGN\s+KEY|CONSTRAINT|KEY|INDEX)\b/i.test(part)) {
          columns.push({ name: '(constraint)', type: '—', notes: part.replace(/\s+/g, ' ').trim() });
        }
        continue;
      }

      if (!firstName) continue;
      // The type token may already include its precision, e.g. VARCHAR(100).
      let type = tokens[typeIndex].toUpperCase().replace(/\s+/g, '');
      let idx = typeIndex + 1;
      if (!type.endsWith(')') && tokens[idx] && tokens[idx].startsWith('(')) {
        type += tokens[idx];
        idx += 1;
      }
      const rest = tokens.slice(idx).join(' ').replace(/\s+/g, ' ').trim();
      columns.push({ name: firstName, type, ...(rest ? { notes: rest } : {}) });
    }

    if (primaryKey) {
      const pkCol = columns.find((c) => c.name.toLowerCase() === primaryKey.toLowerCase());
      if (pkCol) pkCol.notes = pkCol.notes ? `${pkCol.notes}, PRIMARY KEY` : 'PRIMARY KEY';
    }
    tables.push({ tableName, columns });
  }
  return tables;
}

/** Coerce a SQL literal token to a JS value (number, boolean, null, or string). */
function coerceLiteral(token) {
  const t = String(token || '').trim();
  if (t === '' || t.toUpperCase() === 'NULL') return null;
  if (t.toUpperCase() === 'TRUE') return true;
  if (t.toUpperCase() === 'FALSE') return false;
  const unquoted = t.replace(/^'(.*)'$/s, '$1').replace(/''/g, "'");
  const asNumber = Number(unquoted);
  if (!Number.isNaN(asNumber) && unquoted.trim() !== '') return asNumber;
  return unquoted;
}

/**
 * Parse INSERT statements into `{ tableName, rows: [ {column: value} ] }`.
 * Column names come from the parsed CREATE TABLE, so this needs the schema.
 */
function parseInserts(script, schemaTables) {
  const out = [];
  const columnsByTable = new Map(
    (schemaTables || []).map((t) => [t.tableName.toLowerCase(), t.columns.map((c) => c.name)])
  );

  for (const statement of splitStatements(script)) {
    const match = /^INSERT\s+INTO\s+([`"\[]?[\w.]+[`"\]]?)\s*(?:\(([^)]*)\))?\s*VALUES\s*([\s\S]*)$/i.exec(statement);
    if (!match) continue;
    const tableName = match[1].replace(/[`"\[\]]/g, '');
    const explicit = match[2] ? match[2].split(',').map((c) => c.replace(/[`"\[\]]/g, '').trim()) : null;
    const columns = explicit || columnsByTable.get(tableName.toLowerCase()) || [];

    const rows = [];
    for (const tuple of splitTopLevel(match[3], ',')) {
      const inner = tuple.trim().replace(/^\(/, '').replace(/\)$/, '');
      if (!inner.trim()) continue;
      const values = splitTopLevel(inner, ',').map(coerceLiteral);
      const row = {};
      if (columns.length === 0) values.forEach((v, i) => { row[`col${i + 1}`] = v; });
      else columns.forEach((col, i) => { if (col) row[col] = values[i] === undefined ? null : values[i]; });
      rows.push(row);
    }
    if (rows.length > 0) out.push({ tableName, rows });
  }
  return out;
}

/** Union of the keys across a set of rows, preserving first-seen order. */
function columnsOf(rows) {
  const seen = new Set();
  const cols = [];
  (rows || []).forEach((r) => {
    Object.keys(r || {}).forEach((k) => {
      if (!seen.has(k)) { seen.add(k); cols.push(k); }
    });
  });
  return cols;
}

/**
 * Public entry point.
 *
 * @param {object} problem a SQLProblem document (lean or full)
 * @returns {object} a copy with `schemaTables` and `examples` filled in from
 *          STORED content when the authored fields are empty. Never mutates the
 *          input and never reads `hiddenTestCases`.
 */
function projectSqlProblem(problem) {
  if (!problem) return problem;
  const script = problem.schemaSetupSQL || '';

  // Authored content always wins; the projection is a fallback, not an override.
  const authoredTables = Array.isArray(problem.schemaTables) ? problem.schemaTables : [];
  const schemaTables = authoredTables.length > 0 ? authoredTables : parseSchemaTables(script);

  const authoredExamples = Array.isArray(problem.examples) ? problem.examples : [];
  let examples = authoredExamples;
  if (examples.length === 0) {
    // Only the VISIBLE sample case is used. Hidden cases are never read here.
    const sample = (Array.isArray(problem.sampleTestCases) ? problem.sampleTestCases : [])[0];
    const inserts = parseInserts(script, schemaTables);
    const inputTables = inserts.map((i) => ({ tableName: i.tableName, rows: i.rows }));
    const expectedRows = Array.isArray(sample && sample.expectedOutputRows) ? sample.expectedOutputRows : [];
    if (inputTables.length > 0 && expectedRows.length > 0) {
      examples = [{
        exampleNumber: 1,
        inputTables,
        outputTable: { columns: columnsOf(expectedRows), rows: expectedRows },
        explanation: 'Sample input and the expected result for this problem.',
      }];
    }
  }

  return { ...problem, schemaTables, examples };
}

module.exports = {
  projectSqlProblem,
  parseSchemaTables,
  parseInserts,
  splitStatements,
  splitTopLevel,
  coerceLiteral,
  columnsOf,
};

