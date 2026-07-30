const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const SQLProblem = require('../models/SQLProblem');

const COMPANY_TAG_MAP = {
  Google: { sql: ['joins','window-functions','cte','query-optimization'], difficulty: ['medium','hard'] },
  Amazon: { sql: ['joins','subqueries','aggregation','indexing'], difficulty: ['medium','hard'] },
  Microsoft: { sql: ['joins','subqueries','cte'], difficulty: ['medium','hard'] },
  Meta: { sql: ['joins','window-functions','subqueries'], difficulty: ['medium','hard'] },
  TCS: { sql: ['joins','aggregation','subqueries','basic-queries'], difficulty: ['easy','medium'] },
  Infosys: { sql: ['joins','subqueries','group-by'], difficulty: ['easy','medium'] },
  Wipro: { sql: ['basic-queries','joins','aggregation'], difficulty: ['easy','medium'] },
  Cognizant: { sql: ['joins','subqueries','group-by','having'], difficulty: ['easy','medium'] },
  HCL: { sql: ['joins','basic-queries','aggregation'], difficulty: ['easy','medium'] },
  'Tech Mahindra': { sql: ['joins','subqueries','group-by'], difficulty: ['easy','medium'] },
  Zensar: { sql: ['joins','basic-queries','subqueries','aggregation'], difficulty: ['easy','medium'] },
  Accenture: { sql: ['joins','subqueries','cte','window-functions'], difficulty: ['easy','medium'] },
  Capgemini: { sql: ['joins','subqueries','group-by'], difficulty: ['easy','medium'] },
  Deloitte: { sql: ['joins','cte','window-functions','subqueries'], difficulty: ['medium','hard'] },
  IBM: { sql: ['joins','subqueries','query-optimization','cte'], difficulty: ['medium','hard'] },
  Oracle: { sql: ['joins','subqueries','plsql','indexing','query-optimization'], difficulty: ['medium','hard'] },
  SAP: { sql: ['joins','cte','subqueries','performance'], difficulty: ['medium','hard'] },
  EY: { sql: ['joins','subqueries','group-by','having'], difficulty: ['easy','medium'] },
};

function getSQLCompanies(topic, tags, difficulty) {
  const t = (topic || '').toLowerCase();
  const tagsLower = (tags || []).map(x => x.toLowerCase());
  const matches = [];
  for (const [company, patterns] of Object.entries(COMPANY_TAG_MAP)) {
    let score = 0;
    if (patterns.sql.some(pt => t.includes(pt))) score += 2;
    score += tagsLower.filter(tag => patterns.sql.some(pt => tag.includes(pt))).length;
    if (patterns.difficulty.includes(difficulty)) score += 1;
    if (score >= 2) matches.push(company);
  }
  return matches;
}

const sqlProblems = [
  // Basic SELECT
  { title: 'Select All Employees', topic: 'Basic SELECT', difficulty: 'easy', tags: ['SELECT', 'basic'], companies: getSQLCompanies('Basic SELECT', ['SELECT','basic'], 'easy') },
  { title: 'Select Specific Columns', topic: 'Basic SELECT', difficulty: 'easy', tags: ['SELECT', 'columns'] },
  { title: 'Select with Alias', topic: 'Basic SELECT', difficulty: 'easy', tags: ['SELECT', 'AS'] },
  { title: 'Distinct Values', topic: 'Basic SELECT', difficulty: 'easy', tags: ['SELECT', 'DISTINCT'] },
  { title: 'Select with Limit', topic: 'Basic SELECT', difficulty: 'easy', tags: ['SELECT', 'LIMIT'] },
  
  // WHERE Clause
  { title: 'Filter by Department', topic: 'WHERE Clause', difficulty: 'easy', tags: ['WHERE', 'filtering'] },
  { title: 'Multiple Conditions', topic: 'WHERE Clause', difficulty: 'easy', tags: ['WHERE', 'AND', 'OR'] },
  { title: 'Range Queries', topic: 'WHERE Clause', difficulty: 'easy', tags: ['WHERE', 'BETWEEN'] },
  { title: 'Pattern Matching', topic: 'WHERE Clause', difficulty: 'easy', tags: ['WHERE', 'LIKE'] },
  { title: 'NULL Values', topic: 'WHERE Clause', difficulty: 'easy', tags: ['WHERE', 'IS NULL'] },
  { title: 'IN Operator', topic: 'WHERE Clause', difficulty: 'easy', tags: ['WHERE', 'IN'] },
  { title: 'NOT IN Operator', topic: 'WHERE Clause', difficulty: 'easy', tags: ['WHERE', 'NOT IN'] },
  
  // ORDER BY
  { title: 'Order By Salary', topic: 'ORDER BY', difficulty: 'easy', tags: ['ORDER BY', 'sorting'] },
  { title: 'Order By Multiple Columns', topic: 'ORDER BY', difficulty: 'easy', tags: ['ORDER BY', 'multiple'] },
  { title: 'Order By with ASC/DESC', topic: 'ORDER BY', difficulty: 'easy', tags: ['ORDER BY', 'direction'] },
  
  // GROUP BY
  { title: 'Count Employees per Department', topic: 'GROUP BY', difficulty: 'easy', tags: ['GROUP BY', 'COUNT'] },
  { title: 'Average Salary by Department', topic: 'GROUP BY with Aggregation', difficulty: 'easy', tags: ['GROUP BY', 'AVG'] },
  { title: 'Sum of Sales', topic: 'GROUP BY', difficulty: 'easy', tags: ['GROUP BY', 'SUM'] },
  { title: 'Min Max Values', topic: 'GROUP BY', difficulty: 'easy', tags: ['GROUP BY', 'MIN', 'MAX'] },
  { title: 'Group By with Having', topic: 'GROUP BY with HAVING', difficulty: 'medium', tags: ['GROUP BY', 'HAVING'] },
  
  // JOINs
  { title: 'Simple INNER JOIN', topic: 'JOINs', difficulty: 'medium', tags: ['JOIN', 'INNER JOIN'] },
  { title: 'LEFT JOIN with NULL Handling', topic: 'LEFT JOIN', difficulty: 'medium', tags: ['LEFT JOIN', 'NULL'] },
  { title: 'RIGHT JOIN', topic: 'JOINs', difficulty: 'medium', tags: ['RIGHT JOIN'] },
  { title: 'FULL OUTER JOIN', topic: 'JOINs', difficulty: 'medium', tags: ['FULL JOIN'] },
  { title: 'Self JOIN', topic: 'Self JOIN', difficulty: 'medium', tags: ['self join', 'JOIN'] },
  { title: 'Multiple JOINs', topic: 'Multi-table JOIN', difficulty: 'hard', tags: ['JOIN', 'multiple'] },
  { title: 'Cross JOIN', topic: 'JOINs', difficulty: 'medium', tags: ['CROSS JOIN'] },
  
  // Subqueries
  { title: 'Find Highest Paid Employee', topic: 'Subquery', difficulty: 'easy', tags: ['subquery', 'MAX'] },
  { title: 'Employees Above Average', topic: 'Subquery with GROUP BY', difficulty: 'medium', tags: ['subquery', 'HAVING', 'GROUP BY'] },
  { title: 'Correlated Subquery', topic: 'Subquery', difficulty: 'hard', tags: ['correlated', 'subquery'] },
  { title: 'Subquery in FROM', topic: 'Subquery', difficulty: 'medium', tags: ['subquery', 'derived'] },
  { title: 'EXISTS Operator', topic: 'Subquery', difficulty: 'medium', tags: ['EXISTS', 'subquery'] },
  
  // Window Functions
  { title: 'Rank Employees by Salary', topic: 'Window Functions', difficulty: 'hard', tags: ['RANK', 'window function'] },
  { title: 'Dense Rank for Scores', topic: 'DENSE_RANK', difficulty: 'hard', tags: ['DENSE_RANK', 'window function'] },
  { title: 'Running Total of Sales', topic: 'Window Functions - SUM OVER', difficulty: 'hard', tags: ['window function', 'SUM'] },
  { title: 'Row Number', topic: 'Window Functions', difficulty: 'medium', tags: ['ROW_NUMBER', 'window function'] },
  { title: 'Lead and Lag', topic: 'Window Functions', difficulty: 'medium', tags: ['LEAD', 'LAG', 'window function'] },
  { title: 'First and Last Order per Customer', topic: 'Window Functions - FIRST_VALUE LAST_VALUE', difficulty: 'hard', tags: ['FIRST_VALUE', 'LAST_VALUE'] },
  
  // Advanced Topics
  { title: 'Find Duplicate Emails', topic: 'GROUP BY with HAVING', difficulty: 'easy', tags: ['GROUP BY', 'HAVING', 'duplicates'] },
  { title: 'Delete Duplicate Rows', topic: 'Duplicate Detection', difficulty: 'easy', tags: ['GROUP BY', 'HAVING', 'duplicates'] },
  { title: 'Date Difference Calculation', topic: 'Window Functions with Date', difficulty: 'hard', tags: ['LAG', 'window function', 'date'] },
  { title: 'Nth Highest Salary', topic: 'Subquery with LIMIT/OFFSET', difficulty: 'medium', tags: ['subquery', 'LIMIT', 'OFFSET'] },
  { title: 'Product Sales Analysis', topic: 'Multi-table JOIN with Aggregation', difficulty: 'medium', tags: ['JOIN', 'GROUP BY', 'SUM'] },
  { title: 'Cumulative Distribution', topic: 'Window Functions', difficulty: 'hard', tags: ['CUME_DIST', 'window function'] },
  { title: 'Percent Rank', topic: 'Window Functions', difficulty: 'hard', tags: ['PERCENT_RANK', 'window function'] },
  { title: 'NTILE Function', topic: 'Window Functions', difficulty: 'medium', tags: ['NTILE', 'window function'] },
  { title: 'Conditional Aggregation', topic: 'Aggregation', difficulty: 'medium', tags: ['CASE', 'aggregation'] },
  { title: 'Pivot Table', topic: 'Aggregation', difficulty: 'hard', tags: ['CASE', 'pivot'] },
  { title: 'Recursive CTE', topic: 'CTE', difficulty: 'hard', tags: ['CTE', 'recursive'] },
  { title: 'Common Table Expressions', topic: 'CTE', difficulty: 'medium', tags: ['CTE', 'WITH'] },
  { title: 'Window Frame', topic: 'Window Functions', difficulty: 'hard', tags: ['ROWS', 'RANGE', 'window function'] },
  { title: 'Filtering Window Results', topic: 'Window Functions', difficulty: 'medium', tags: ['WHERE', 'window function'] },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent');
    console.log('Connected to MongoDB');
    await SQLProblem.deleteMany({});
    
    const problemsWithSlugs = sqlProblems.map(p => {
      const slug = p.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
      return { ...p, slug };
    });
    
    const seenTitles = new Map();
    const duplicates = [];
    problemsWithSlugs.forEach(p => {
      if (seenTitles.has(p.title)) {
        duplicates.push({ title: p.title, topic: p.topic, originalTopic: seenTitles.get(p.title) });
      } else {
        seenTitles.set(p.title, p.topic);
      }
    });

    if (duplicates.length > 0) {
      console.log(`[PRE-FLIGHT] Found ${duplicates.length} duplicate title(s):`);
      duplicates.forEach(d => console.log(`  - "${d.title}" in "${d.topic}" (original: ${d.originalTopic})`));
    }
    
    // Generate sample and hidden test cases for each problem
    const problemsWithTestCases = problemsWithSlugs.map(problem => {
      const sampleTestCases = [
        {
          inputStateSQL: '',
          expectedOutputRows: [
            { id: 1, name: 'Sample', value: 100 },
          ],
        },
      ];
      
      const hiddenTestCases = [
        {
          inputStateSQL: `INSERT INTO test_table VALUES (2, 'Test', 200);`,
          expectedOutputRows: [
            { id: 1, name: 'Sample', value: 100 },
            { id: 2, name: 'Test', value: 200 },
          ],
        },
      ];
      
      const sqlCompanies = getSQLCompanies(problem.topic, problem.tags, problem.difficulty);
      return {
        ...problem,
        description: `Solve the ${problem.title} SQL problem.`,
        schemaSetupSQL: `CREATE TABLE test_table (id INT, name VARCHAR(100), value INT);
INSERT INTO test_table VALUES (1, 'Sample', 100);`,
        sampleTestCases,
        hiddenTestCases,
        referenceSolutionSQL: 'SELECT * FROM test_table;',
        companies: sqlCompanies,
      };
    });

    const deduped = problemsWithTestCases.filter((p, idx, arr) => arr.findIndex(q => q.title === p.title) === idx);
    const removed = problemsWithTestCases.length - deduped.length;
    if (removed > 0) {
      console.log(`[PRE-FLIGHT] Removed ${removed} duplicate(s), proceeding with ${deduped.length} unique problems.`);
    }
    
    const created = await SQLProblem.insertMany(deduped, { ordered: false });
    console.log(`Seeded ${created.length} SQL problems`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    if (error.writeErrors) {
      error.writeErrors.forEach(w => console.error(`  Failed doc ${w.err.index}:`, w.err.message));
    }
    process.exit(1);
  }
}

seed();