// Reports per-subject, per-topic coverage of notes/MCQs/interview questions across scripts/data files.
// Usage: node scripts/checkDataCoverage.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PREFIX = { dbms: 'DBMS', os: 'Operating Systems', cns: 'Computer Networks', sql: 'SQL', java: 'Java', python: 'Python', dsa: 'DSA', mern: 'MERN Stack', 'system-design': 'System Design' };

const buckets = {};
for (const key of Object.keys(PREFIX)) buckets[key] = { notes: {}, mcqs: {}, interview: {} };

for (const file of fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.js'))) {
  const prefix = Object.keys(PREFIX).find((p) => file.toLowerCase().startsWith(p.toLowerCase()));
  if (!prefix) continue;
  const kind = /notes/i.test(file) ? 'notes' : /mcq/i.test(file) ? 'mcqs' : /interview/i.test(file) ? 'interview' : null;
  if (!kind) continue;
  let mod;
  try { mod = require(path.join(DATA_DIR, file)); } catch (e) { console.log(`! ${file}: ${e.message}`); continue; }
  if (!Array.isArray(mod)) continue;
  for (const rec of mod) {
    if (!rec || !rec.topic) continue;
    const key = rec.topic.trim();
    buckets[prefix][kind][key] = (buckets[prefix][kind][key] || 0) + 1;
  }
}

const plan = require(path.join(__dirname, 'seedInterviewPrep.topics.js'));

let totalGaps = 0;
for (const [slug, topics] of Object.entries(plan)) {
  const b = buckets[slug];
  if (!b) continue;
  const missingNotes = topics.filter((t) => !b.notes[t]);
  const missingMcqs = topics.filter((t) => !b.mcqs[t]);
  const missingInterview = topics.filter((t) => !b.interview[t]);
  totalGaps += missingNotes.length + missingMcqs.length + missingInterview.length;
  console.log(`\n=== ${PREFIX[slug]} (${slug}) plan=${topics.length} notes=${Object.keys(b.notes).length} mcqs=${Object.keys(b.mcqs).length} interview=${Object.keys(b.interview).length} ===`);
  console.log(`  NOTES missing (${missingNotes.length}): ${missingNotes.join(', ') || '-'}`);
  console.log(`  MCQS missing (${missingMcqs.length}): ${missingMcqs.join(', ') || '-'}`);
  console.log(`  INTERVIEW missing (${missingInterview.length}): ${missingInterview.join(', ') || '-'}`);
  const strayNotes = Object.keys(b.notes).filter((t) => !topics.includes(t));
  const strayMcqs = Object.keys(b.mcqs).filter((t) => !topics.includes(t));
  if (strayNotes.length) console.log(`  ! note topics not in plan: ${strayNotes.join(', ')}`);
  if (strayMcqs.length) console.log(`  ! mcq topics not in plan: ${strayMcqs.join(', ')}`);
}
console.log(`\nTOTAL GAPS: ${totalGaps}`);
