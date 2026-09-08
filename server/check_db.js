const mongoose = require('mongoose');
const InterviewSession = require('./models/InterviewSession');
const InterviewAnswer = require('./models/InterviewAnswer');

mongoose.connect('mongodb+srv://chaitanyabhorde56_db_user:fimo2nv@cluster0.1q5xv.mongodb.net/testdb?retryWrites=true&w=majority')
  .then(async () => {
    const sessions = await InterviewSession.find({}).sort({createdAt: -1}).limit(3).lean();
    for (const s of sessions) {
      console.log('Session:', s._id, 'totalQuestions:', s.totalQuestions, 'status:', s.status, 'mode:', s.mode);
      const answers = await InterviewAnswer.find({session: s._id}).populate('question').lean();
      const main = answers.filter(a => a.question && !a.question.isFollowUp);
      const fu = answers.filter(a => a.question && a.question.isFollowUp);
      console.log('  Answers: total=' + answers.length, 'main=' + main.length, 'followups=' + fu.length);
      main.forEach(a => console.log('    MAIN:', a.evaluation?.marks ?? 'null', '/', a.evaluation?.maxMarks, '-', a.question?.topic || 'untagged'));
      const fr = s.finalReport;
      if (fr) {
        console.log('  Report stats:', JSON.stringify(fr.stats));
        console.log('  Report score:', fr.score, '/', fr.maxScore);
      }
    }
    mongoose.disconnect();
  })
  .catch(e => { console.error(e); mongoose.disconnect(); });