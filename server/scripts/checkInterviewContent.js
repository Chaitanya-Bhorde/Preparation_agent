// Static coverage checker: reports, per subject, which topics lack a note, MCQ
// or interview record based on the files currently present in ./data.
// Usage: node scripts/checkInterviewContent.js [subjectSlug ...]
const fs = require('fs');
const path = require('path');

const seederSource = fs.readFileSync(path.join(__dirname, 'seedInterviewPrep.js'), 'utf8');
const EXCLUDED_TOPICS = new Set(['Data', 'CS']);
const TOPICS = require('./seedInterviewPrep.topics.json');

const FILE_KEYS = { dbms: 'dbms', os: 'os', cns: 'cns', sql: 'sql', java: 'java', python: 'python', dsa: 'dsa', mern: 'mern', 'system-design': 'systemDesign' };
const kindOf = { Notes: 'notes', Mcqs: 'mcqs', Interview: 'interview' };

function discoverFiles(slug, dir) {
  const pattern = new RegExp(`^${FILE_KEYS[slug]}(Notes|Mcqs|Interview)\\d*\\.js$`, 'i');
  const files = { notes: [], mcqs: [], interview: [] };
  for (const file of fs.readdirSync(dir).sort()) {
    const match = pattern.exec(file);
    if (match) files[kindOf[match[1]]].push(file);
  }
  return files;
}

function loadRecords(files, dir) {
  const records = [];
  const errors = [];
  for (const file of files) {
    try {
      const mod = require(path.join(dir, file));
      if (Array.isArray(mod)) records.push(...mod);
      else errors.push(`${file}: not an array`);
    } catch (error) {
      errors.push(`${file}: ${error.message}`);
    }
  }
  return { records, errors };
}

const dir = path.join(__dirname, 'data');
const requested = process.argv.slice(2);
const slugs = requested.length ? requested : Object.keys(FILE_KEYS);
let total = 0;

for (const slug of slugs) {
  const topics = TOPICS[slug] || [];
  const files = discoverFiles(slug, dir);
  const notes = loadRecords(files.notes, dir);
  const mcqs = loadRecords(files.mcqs, dir);
  const iqs = loadRecords(files.interview, dir);
  const count = (records) => records.reduce((acc, r) => { acc[r.topic] = (acc[r.topic] || 0) + 1; return acc; }, {});
  const noteMap = count(notes.records);
  const mcqMap = count(mcqs.records);
  const iqMap = count(iqs.records);

  const missingNotes = topics.filter(t => !noteMap[t]);
  const missingMcqs = topics.filter(t => !mcqMap[t]);
  const missingIqs = topics.filter(t => !iqMap[t]);
  const unknown = [...new Set([...notes.records, ...mcqs.records, ...iqs.records].map(r => r.topic))].filter(t => !topics.includes(t));
  total += missingNotes.length + missingMcqs.length + missingIqs.length;

  console.log(`\n=== ${slug} ===`);
  console.log(`  files: notes=${files.notes.length} mcqs=${files.mcqs.length} interview=${files.interview.length}`);
  console.log(`  records: notes=${notes.records.length} mcqs=${mcqs.records.length} interview=${iqs.records.length}`);
  console.log(`  topics=${topics.length} | topics missing notes: ${missingNotes.length ? missingNotes.join(', ') : 'none'}`);
  console.log(`  topics missing mcqs (${missingMcqs.length}): ${missingMcqs.join(', ') || 'none'}`);
  console.log(`  topics missing interview qs (${missingIqs.length}): ${missingIqs.join(', ') || 'none'}`);
  if (unknown.length) console.log(`  !! topics not in TOPICS map: ${unknown.join(', ')}`);
  for (const e of [...notes.errors, ...mcqs.errors, ...iqs.errors]) console.log(`  !! ${e}`);
}
console.log(`\nTOTAL gaps: ${total}`);
