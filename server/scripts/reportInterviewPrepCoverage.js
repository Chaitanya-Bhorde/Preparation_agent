// Reports, per subject, which seeded topics have notes / MCQs / interview questions
// in ./data. Purely a developer aid: it reads the same files the seeder discovers.
// Usage: node scripts/reportInterviewPrepCoverage.js [subjectSlug ...]
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'data');
const seederSrc = fs.readFileSync(path.join(__dirname, 'seedInterviewPrep.js'), 'utf8');
const start = seederSrc.indexOf('const TOPICS =');
const end = seederSrc.indexOf('};', start);
// eslint-disable-next-line no-new-func
const TOPICS = new Function(`return ${seederSrc.slice(start + 'const TOPICS ='.length, end + 1)}`)();

const FILE_KEYS = {
  dbms: 'dbms', os: 'os', cns: 'cns', sql: 'sql', java: 'java',
  python: 'python', dsa: 'dsa', mern: 'mern', 'system-design': 'systemDesign',
};

function discover(subjectSlug) {
  const key = FILE_KEYS[subjectSlug];
  const pattern = new RegExp(`^${key}(Notes|Mcqs|Interview)\\d*\\.js$`, 'i');
  const kindOf = { Notes: 'notes', Mcqs: 'mcqs', Interview: 'interview' };
  const files = { notes: [], mcqs: [], interview: [] };
  for (const file of fs.readdirSync(dir).sort()) {
    const match = pattern.exec(file);
    if (match) files[kindOf[match[1]]].push(file);
  }
  return files;
}

// A topic can be described by several notes files (say a short summary plus a
// later, more detailed one). Both the seeder and the UI surface only the most
// detailed note for a topic, so measure that one. Anything thinner than this is
// reported as a THIN note rather than silently passing.
const MIN_NOTE_CHARS = 600;

const requested = process.argv.slice(2);
const slugs = requested.length ? requested : Object.keys(TOPICS);
let grandGaps = 0;

for (const slug of slugs) {
  const files = discover(slug);
  const loaded = { notes: [], mcqs: [], interview: [] };
  for (const kind of ['notes', 'mcqs', 'interview']) {
    for (const file of files[kind]) {
      try {
        const mod = require(path.join(dir, file));
        if (Array.isArray(mod)) loaded[kind].push(...mod);
      } catch (error) {
        console.log(`  ! broken ${file}: ${error.message}`);
      }
    }
  }
  const topics = TOPICS[slug] || [];
  const counts = topics.map((name) => {
    const topicNotes = loaded.notes.filter(r => r.topic === name);
    const bestNote = topicNotes.reduce(
      (best, note) => (best && (best.content || '').length >= (note.content || '').length ? best : note),
      null
    );
    const m = loaded.mcqs.filter(r => r.topic === name).length;
    const q = loaded.interview.filter(r => r.topic === name).length;
    return { name, n: topicNotes.length, bestChars: bestNote ? (bestNote.content || '').length : 0, m, q };
  });
  const gaps = counts.filter(c => c.n === 0 || c.m < 3 || c.q === 0);
  const thin = counts.filter(c => c.n > 0 && c.bestChars < MIN_NOTE_CHARS);
  grandGaps += gaps.length + thin.length;
  console.log(`\n=== ${slug} === topics=${topics.length}`);
  console.log(`  files: notes=[${files.notes.join(', ')}] mcqs=[${files.mcqs.join(', ')}] interview=[${files.interview.join(', ')}]`);
  console.log(`  totals: notes=${loaded.notes.length} mcqs=${loaded.mcqs.length} interview=${loaded.interview.length}`);
  console.log(`  topics OK: ${topics.length - gaps.length}/${topics.length}`);
  console.log(`  detailed notes (>=${MIN_NOTE_CHARS} chars): ${topics.length - thin.length}/${topics.length}`);
  for (const gap of gaps) {
    console.log(`  GAP ${gap.name} -> notes=${gap.n} mcqs=${gap.m} interview=${gap.q}`);
  }
  for (const topic of thin) {
    console.log(`  THIN ${topic.name} -> best note is only ${topic.bestChars} chars`);
  }
}
console.log(`\nTotal topics needing attention: ${grandGaps}`);
