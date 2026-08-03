const mongoose = require('mongoose');
const SQLProblem = require('../models/SQLProblem');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const problems = await SQLProblem.find({});
  console.log('Found', problems.length, 'problems');
  const usedNumbers = new Set(problems.map(p => p.problemNumber).filter(n => n && typeof n === 'number'));
  let nextNumber = 1;
  const allocNumber = () => { while (usedNumbers.has(nextNumber)) nextNumber++; const n = nextNumber; usedNumbers.add(n); nextNumber++; return n; };
  let full=0, part=0, skip=0;
  for (const p of problems) {
    const u = {};
    if (!p.problemNumber) u.problemNumber = allocNumber();
    if (!p.topics || p.topics.length === 0) u.topics = [p.topic];
    if (!p.schemaTables || p.schemaTables.length === 0) {
      u.schemaTables = [{ tableName: 'employees', columns: [{name:'id',type:'INT'},{name:'name',type:'VARCHAR(100)'},{name:'department',type:'VARCHAR(100)'},{name:'salary',type:'DECIMAL(10,2)'}], notes: 'id is the primary key for this table.' }];
    }
    if (p.description && p.description.includes('Solve the')) {
      u.description = 'Write a SQL query to solve: ' + p.title + '. Given the input table, return the expected output.';
    }
    if (!p.examples || p.examples.length === 0) {
      const rows = (p.sampleTestCases && p.sampleTestCases[0] && p.sampleTestCases[0].expectedOutputRows) ? p.sampleTestCases[0].expectedOutputRows : [{id:1,name:'Sample',value:100}];
      u.examples = [{ exampleNumber: 1, inputTables: [{ tableName: 'employees', rows: [{id:1,name:'Alice',department:'Engineering',salary:120000},{id:2,name:'Bob',department:'Marketing',salary:95000},{id:3,name:'Charlie',department:'Engineering',salary:110000}] }], outputTable: { columns: Object.keys(rows[0]), rows: rows }, explanation: 'The query produces these results based on the input data.' }];
    }
    if (!p.constraints || p.constraints.length === 0) u.constraints = ['The table may contain up to 1000 rows.', 'Return all matching rows without duplicates.'];
    if (Object.keys(u).length > 0) {
      await SQLProblem.findByIdAndUpdate(p._id, { $set: u });
      if (u.description && u.schemaTables && u.examples) full++; else if (u.schemaTables || u.examples) part++; else skip++;
      console.log(((u.description)?'FULL':'PART') + ' ' + p.title);
    } else skip++;
  }
  console.log('\nSUMMARY Full:', full, 'Part:', part, 'Skip:', skip);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
