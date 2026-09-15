// Audit core-subject coverage: per subject -> per topic notes / MCQs / interview questions.
// Usage: node scripts/auditCoreSubjects.js
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Note = require('../models/Note');
const MCQ = require('../models/MCQ');
const CoreInterviewQuestion = require('../models/CoreInterviewQuestion');

async function audit() {
  await mongoose.connect(process.env.MONGO_URI);
  const subjects = await Subject.find({}).sort({ order: 1 });
  let grandMissingNotes = 0;
  for (const subject of subjects) {
    const topics = await Topic.find({ subject: subject._id }).sort({ order: 1 });
    const notes = await Note.find({ subject: subject._id });
    const mcqs = await MCQ.find({ subject: subject._id });
    const iqs = await CoreInterviewQuestion.find({ subject: subject._id });
    const noteTopicIds = new Set(notes.map(n => String(n.topic)));
    const mcqTopicIds = new Set(mcqs.map(m => String(m.topic)));
    const iqTopicIds = new Set(iqs.map(i => String(i.topic)));
    const missingNotes = topics.filter(t => !noteTopicIds.has(String(t._id)));
    const missingMcqs = topics.filter(t => !mcqTopicIds.has(String(t._id)));
    const missingIqs = topics.filter(t => !iqTopicIds.has(String(t._id)));
    grandMissingNotes += missingNotes.length;
    console.log(`\n=== ${subject.name} (${subject.slug}) ===`);
    console.log(`topics=${topics.length} notes=${notes.length} mcqs=${mcqs.length} interview=${iqs.length}`);
    console.log(`topics WITHOUT notes (${missingNotes.length}): ${missingNotes.map(t => t.name).join(', ') || '-'}`);
    console.log(`topics WITHOUT mcqs (${missingMcqs.length}): ${missingMcqs.map(t => t.name).join(', ') || '-'}`);
    console.log(`topics WITHOUT interview qs (${missingIqs.length}): ${missingIqs.map(t => t.name).join(', ') || '-'}`);
  }
  console.log(`\nTOTAL topics without notes: ${grandMissingNotes}`);
  await mongoose.disconnect();
  process.exit(0);
}

audit().catch(e => { console.error('Audit failed:', e); process.exit(1); });
