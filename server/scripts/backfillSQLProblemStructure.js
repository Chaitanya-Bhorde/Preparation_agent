const mongoose = require('mongoose');
const SQLProblem = require('../models/SQLProblem');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
// ---------------------------------------------------------------------------
// NOTE (2026-09 hardening): the original version of this script injected a
// GENERIC 'employees(id, name, department, salary)' schema and a hardcoded
// Alice/Bob/Charlie example into EVERY problem that lacked one - including
// problems whose reference solution queries `orders`, `users`, `sales`,
// `students`, `projects`, `departments`, `products`, `org_chart`, `dept_sales`.
// That produced a schema that directly contradicts the problem, and 48 of 49
// SQL problems ended up sharing one identical fake schema/example.
//
// The generic dataset is therefore now only applied when it is actually
// compatible: the problem's own reference solution must reference nothing but
// `employees`, and must not use a column outside the generic column set.
// Anything else is reported as a content gap instead of being silently filled.
//
// The fixture values and the compatibility rule live in
// utils/placeholderFixtures.js so this script, seedSQLProblemsExpanded.js and
// full_audit.js share one definition.
const {
  GENERIC_SQL_TABLE,
  GENERIC_SQL_SCHEMA_TABLE,
  GENERIC_SQL_ROWS,
  genericFixtureIsCompatible,
} = require('../utils/placeholderFixtures');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const problems = await SQLProblem.find({});
  console.log('Found', problems.length, 'problems');
  const usedNumbers = new Set(problems.map(p => p.problemNumber).filter(n => n && typeof n === 'number'));
  let nextNumber = 1;
  const allocNumber = () => { while (usedNumbers.has(nextNumber)) nextNumber++; const n = nextNumber; usedNumbers.add(n); nextNumber++; return n; };
  let full=0, part=0, skip=0;
  const contentGaps = [];
  for (const p of problems) {
    const u = {};
    if (!p.problemNumber) u.problemNumber = allocNumber();
    if (!p.topics || p.topics.length === 0) u.topics = [p.topic];
    const compatible = genericFixtureIsCompatible(p.referenceSolutionSQL);
    if (!p.schemaTables || p.schemaTables.length === 0) {
      if (compatible) u.schemaTables = [GENERIC_SQL_SCHEMA_TABLE];
      else contentGaps.push({ slug: p.slug, title: p.title, missing: 'schemaTables', ref: (p.referenceSolutionSQL || '').slice(0, 90) });
    }
    if (p.description && p.description.includes('Solve the')) {
      u.description = 'Write a SQL query to solve: ' + p.title + '. Given the input table, return the expected output.';
    }
    if (!p.examples || p.examples.length === 0) {
      if (compatible) {
        const rows = (p.sampleTestCases && p.sampleTestCases[0] && p.sampleTestCases[0].expectedOutputRows) ? p.sampleTestCases[0].expectedOutputRows : [{id:1,name:'Sample',value:100}];
        u.examples = [{ exampleNumber: 1, inputTables: [{ tableName: GENERIC_SQL_TABLE, rows: GENERIC_SQL_ROWS }], outputTable: { columns: Object.keys(rows[0]), rows: rows }, explanation: 'The query produces these results based on the input data.' }];
      } else {
        contentGaps.push({ slug: p.slug, title: p.title, missing: 'examples', ref: (p.referenceSolutionSQL || '').slice(0, 90) });
      }
    }
    if (!p.constraints || p.constraints.length === 0) u.constraints = ['The table may contain up to 1000 rows.', 'Return all matching rows without duplicates.'];
    if (Object.keys(u).length > 0) {
      await SQLProblem.findByIdAndUpdate(p._id, { $set: u });
      if (u.description && u.schemaTables && u.examples) full++; else if (u.schemaTables || u.examples) part++; else skip++;
      console.log(((u.description)?'FULL':'PART') + ' ' + p.title);
    } else skip++;
  }
  console.log('\nSUMMARY Full:', full, 'Part:', part, 'Skip:', skip);
  if (contentGaps.length > 0) {
    console.warn(`\n[CONTENT GAP] ${contentGaps.length} field(s) need AUTHORED data`);
    console.warn('  (skipped on purpose: the generic employees fixture would contradict these problems).');
    contentGaps.slice(0, 60).forEach((g) => console.warn(`   - ${g.slug}  needs ${g.missing}  ref="${g.ref}"`));
    if (contentGaps.length > 60) console.warn(`   ... and ${contentGaps.length - 60} more`);
  }
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
