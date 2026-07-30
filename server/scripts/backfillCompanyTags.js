const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CodingProblem = require('../models/CodingProblem');
const SQLProblem = require('../models/SQLProblem');
const AptitudeQuestion = require('../models/AptitudeQuestion');

// Based on real student feedback and interview patterns across 15-20 companies
const COMPANY_TAG_MAP = {
  // Product-based companies - focus on DSA, algorithms, system design prep
  'Google': { dsa: ['arrays','strings','dynamic-programming','graph','tree','binary-search','heap','trie'], difficulty: ['medium','hard'], sql: ['joins','window-functions','cte','query-optimization'], aptitude: ['logical','quant'] },
  'Amazon': { dsa: ['arrays','strings','linked-list','tree','graph','dynamic-programming','stack','queue'], difficulty: ['medium','hard'], sql: ['joins','subqueries','aggregation','indexing'], aptitude: ['quant','logical'] },
  'Microsoft': { dsa: ['arrays','strings','linked-list','tree','dynamic-programming','backtracking'], difficulty: ['medium','hard'], sql: ['joins','subqueries','cte'], aptitude: ['logical','quant'] },
  'Meta': { dsa: ['arrays','strings','graph','tree','binary-search','dynamic-programming'], difficulty: ['medium','hard'], sql: ['joins','window-functions','subqueries'], aptitude: ['logical'] },
  
  // Service-based / Indian IT companies - mix of basic DSA + SQL + Aptitude
  'TCS': { dsa: ['arrays','strings','linked-list','stack','queue','tree'], difficulty: ['easy','medium'], sql: ['joins','aggregation','subqueries','basic-queries'], aptitude: ['quant','verbal','logical'] },
  'Infosys': { dsa: ['arrays','strings','sorting','searching','linked-list'], difficulty: ['easy','medium'], sql: ['joins','subqueries','group-by'], aptitude: ['quant','verbal','logical'] },
  'Wipro': { dsa: ['arrays','strings','basic-algorithms','sorting'], difficulty: ['easy','medium'], sql: ['basic-queries','joins','aggregation'], aptitude: ['quant','verbal'] },
  'Cognizant': { dsa: ['arrays','strings','linked-list','tree-basics','stack'], difficulty: ['easy','medium'], sql: ['joins','subqueries','group-by','having'], aptitude: ['quant','logical','verbal'] },
  'HCL': { dsa: ['arrays','strings','sorting','basic-ds'], difficulty: ['easy','medium'], sql: ['joins','basic-queries','aggregation'], aptitude: ['quant','verbal'] },
  'Tech Mahindra': { dsa: ['arrays','strings','linked-list','stack','queue'], difficulty: ['easy','medium'], sql: ['joins','subqueries','group-by'], aptitude: ['quant','logical','verbal'] },
  'Zensar': { dsa: ['arrays','strings','basic-algorithms','sorting','searching'], difficulty: ['easy','medium'], sql: ['joins','basic-queries','subqueries','aggregation'], aptitude: ['quant','verbal','logical'] },
  'Accenture': { dsa: ['arrays','strings','linked-list','tree','dynamic-programming'], difficulty: ['easy','medium'], sql: ['joins','subqueries','cte','window-functions'], aptitude: ['quant','logical','verbal'] },
  
  // Mid-size / consulting / other
  'Capgemini': { dsa: ['arrays','strings','stack','queue','basic-ds'], difficulty: ['easy','medium'], sql: ['joins','subqueries','group-by'], aptitude: ['quant','verbal','logical'] },
  'Deloitte': { dsa: ['arrays','strings','linked-list','tree','dynamic-programming'], difficulty: ['medium','hard'], sql: ['joins','cte','window-functions','subqueries'], aptitude: ['quant','logical'] },
  'IBM': { dsa: ['arrays','strings','graph','tree','dynamic-programming'], difficulty: ['medium','hard'], sql: ['joins','subqueries','query-optimization','cte'], aptitude: ['quant','logical'] },
  'Oracle': { dsa: ['arrays','strings','linked-list','tree','dynamic-programming','sql-heavy'], difficulty: ['medium','hard'], sql: ['joins','subqueries','plsql','indexing','query-optimization'], aptitude: ['quant','logical'] },
  'SAP': { dsa: ['arrays','strings','tree','graph','dynamic-programming'], difficulty: ['medium','hard'], sql: ['joins','cte','subqueries','performance'], aptitude: ['quant','logical'] },
  'EY': { dsa: ['arrays','strings','linked-list','stack','queue','tree-basics'], difficulty: ['easy','medium'], sql: ['joins','subqueries','group-by','having'], aptitude: ['quant','verbal','logical'] },
};

function tagCodingProblem(problem) {
  const topic = (problem.topic || '').toLowerCase();
  const tags = (problem.tags || []).map(t => t.toLowerCase());
  const difficulty = problem.difficulty;
  
  const matchedCompanies = [];
  
  for (const [company, patterns] of Object.entries(COMPANY_TAG_MAP)) {
    let score = 0;
    
    // Topic match
    if (patterns.dsa.some(t => topic.includes(t))) score += 2;
    
    // Tag match
    const tagHits = tags.filter(t => patterns.dsa.some(pt => t.includes(pt))).length;
    score += tagHits;
    
    // Difficulty alignment
    if (patterns.difficulty.includes(difficulty)) score += 1;
    
    if (score >= 2) {
      matchedCompanies.push(company);
    }
  }
  
  return matchedCompanies;
}

function tagSQLProblem(problem) {
  const topic = (problem.topic || '').toLowerCase();
  const tags = (problem.tags || []).map(t => t.toLowerCase());
  const difficulty = problem.difficulty;
  
  const matchedCompanies = [];
  
  for (const [company, patterns] of Object.entries(COMPANY_TAG_MAP)) {
    let score = 0;
    
    if (patterns.sql.some(t => topic.includes(t))) score += 2;
    
    const tagHits = tags.filter(t => patterns.sql.some(pt => t.includes(pt))).length;
    score += tagHits;
    
    if (patterns.difficulty.includes(difficulty)) score += 1;
    
    if (score >= 2) {
      matchedCompanies.push(company);
    }
  }
  
  return matchedCompanies;
}

function tagAptitudeQuestion(question) {
  const category = (question.category || '').toLowerCase();
  const tags = (question.tags || []).map(t => t.toLowerCase());
  const difficulty = question.difficulty;
  
  const matchedCompanies = [];
  
  for (const [company, patterns] of Object.entries(COMPANY_TAG_MAP)) {
    let score = 0;
    
    if (patterns.aptitude.some(t => category.includes(t))) score += 2;
    
    const tagHits = tags.filter(t => patterns.aptitude.some(pt => t.includes(pt))).length;
    score += tagHits;
    
    if (patterns.difficulty.includes(difficulty)) score += 1;
    
    if (score >= 2) {
      matchedCompanies.push(company);
    }
  }
  
  return matchedCompanies;
}

const backfillCompanyTags = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent');
    console.log('Connected to MongoDB');
    
    const companies = new Set();
    
    // Backfill CodingProblem
    const codingProblems = await CodingProblem.find({});
    console.log(`Found ${codingProblems.length} coding problems`);
    for (const problem of codingProblems) {
      const companyTags = tagCodingProblem(problem);
      if (companyTags.length > 0) {
        problem.companies = companyTags;
        await problem.save();
        companyTags.forEach(c => companies.add(c));
      }
    }
    console.log(`Backfilled coding problems with company tags`);
    
    // Backfill SQLProblem
    const sqlProblems = await SQLProblem.find({});
    console.log(`Found ${sqlProblems.length} SQL problems`);
    for (const problem of sqlProblems) {
      const companyTags = tagSQLProblem(problem);
      if (companyTags.length > 0) {
        problem.companies = companyTags;
        await problem.save();
        companyTags.forEach(c => companies.add(c));
      }
    }
    console.log(`Backfilled SQL problems with company tags`);
    
    // Backfill AptitudeQuestion
    const aptitudeQuestions = await AptitudeQuestion.find({});
    console.log(`Found ${aptitudeQuestions.length} aptitude questions`);
    for (const question of aptitudeQuestions) {
      const companyTags = tagAptitudeQuestion(question);
      if (companyTags.length > 0) {
        question.companies = companyTags;
        await question.save();
        companyTags.forEach(c => companies.add(c));
      }
    }
    console.log(`Backfilled aptitude questions with company tags`);
    
    console.log(`\nBackfill complete. Unique companies found: ${[...companies].sort().join(', ')}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Backfill error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

backfillCompanyTags();