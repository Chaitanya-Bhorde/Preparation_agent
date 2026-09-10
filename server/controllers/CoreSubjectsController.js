const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Note = require('../models/Note');
const MCQ = require('../models/MCQ');
const CoreInterviewQuestion = require('../models/CoreInterviewQuestion');
const CoreSubjectSubmission = require('../models/CoreSubjectSubmission');

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true }).sort({ order: 1, name: 1 });
    const result = [];
    for (const subject of subjects) {
      const topicCount = await Topic.countDocuments({ subject: subject._id, isActive: true });
      const mcqCount = await MCQ.countDocuments({ subject: subject._id, isActive: true });
      const iqCount = await CoreInterviewQuestion.countDocuments({ subject: subject._id, isActive: true });
      const noteCount = await Note.countDocuments({ subject: subject._id, isActive: true });
      result.push({
        _id: subject._id, name: subject.name, slug: subject.slug,
        description: subject.description, icon: subject.icon, color: subject.color,
        topics: topicCount, mcqs: mcqCount, interviewQuestions: iqCount, notes: noteCount,
      });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubject = async (req, res) => {
  try {
    const subject = await Subject.findOne({ slug: req.params.subjectSlug, isActive: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    const topics = await Topic.find({ subject: subject._id, isActive: true }).sort({ order: 1, name: 1 });
    const mcqCount = await MCQ.countDocuments({ subject: subject._id, isActive: true });
    const iqCount = await CoreInterviewQuestion.countDocuments({ subject: subject._id, isActive: true });
    res.json({ success: true, data: { ...subject.toObject(), topics, mcqs: mcqCount, interviewQuestions: iqCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTopics = async (req, res) => {
  try {
    const subject = await Subject.findOne({ slug: req.params.subjectSlug, isActive: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    const topics = await Topic.find({ subject: subject._id, isActive: true }).sort({ order: 1, name: 1 });
    res.json({ success: true, data: topics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getNotes = async (req, res) => {
  try {
    const subject = await Subject.findOne({ slug: req.params.subjectSlug, isActive: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    const { topic } = req.query;
    const filter = { subject: subject._id, isActive: true };
    if (topic) filter.topic = topic;
    const notes = await Note.find(filter).sort({ order: 1, title: 1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMCQs = async (req, res) => {
  try {
    const subject = await Subject.findOne({ slug: req.params.subjectSlug, isActive: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    const { topic, difficulty, limit } = req.query;
    const filter = { subject: subject._id, isActive: true };
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    let query = MCQ.find(filter);
    if (limit) query = query.limit(parseInt(limit));
    const mcqs = await query.sort({ difficulty: 1, _id: 1 });
    const sanitized = mcqs.map(m => ({
      _id: m._id, subject: m.subject, topic: m.topic,
      question: m.question, options: m.options, difficulty: m.difficulty,
    }));
    res.json({ success: true, data: sanitized, total: sanitized.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInterviewQuestions = async (req, res) => {
  try {
    const subject = await Subject.findOne({ slug: req.params.subjectSlug, isActive: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    const { topic, difficulty, limit } = req.query;
    const filter = { subject: subject._id, isActive: true };
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    let query = CoreInterviewQuestion.find(filter);
    if (limit) query = query.limit(parseInt(limit));
    const questions = await query.sort({ difficulty: 1, _id: 1 });
    res.json({ success: true, data: questions, total: questions.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitMCQAttempt = async (req, res) => {
  try {
    const { subjectSlug, questionId } = req.params;
    const { selectedAnswer, timeTaken } = req.body;
    const subject = await Subject.findOne({ slug: subjectSlug, isActive: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    const mcq = await MCQ.findOne({ _id: questionId, subject: subject._id, isActive: true });
    if (!mcq) return res.status(404).json({ success: false, message: 'Question not found' });
    const isCorrect = mcq.correctAnswer === selectedAnswer;
    const submission = new CoreSubjectSubmission({
      userId: req.user.id, subject: subject._id, topic: mcq.topic,
      questionId: mcq._id, questionType: 'mcq', selectedAnswer,
      isCorrect, timeTaken: timeTaken || 0, difficulty: mcq.difficulty,
    });
    await submission.save();
    res.json({ success: true, data: { isCorrect, correctAnswer: mcq.correctAnswer, explanation: mcq.explanation } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitInterviewAttempt = async (req, res) => {
  try {
    const { subjectSlug, questionId } = req.params;
    const { timeTaken } = req.body;
    const subject = await Subject.findOne({ slug: subjectSlug, isActive: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    const question = await CoreInterviewQuestion.findOne({ _id: questionId, subject: subject._id, isActive: true });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    const submission = new CoreSubjectSubmission({
      userId: req.user.id, subject: subject._id, topic: question.topic,
      questionId: question._id, questionType: 'interview',
      timeTaken: timeTaken || 0, difficulty: question.difficulty,
    });
    await submission.save();
    res.json({ success: true, data: { message: 'Attempt recorded' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const subject = await Subject.findOne({ slug: req.params.subjectSlug, isActive: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    const userId = req.user.id;
    const submissions = await CoreSubjectSubmission.find({ userId, subject: subject._id });
    const topics = await Topic.find({ subject: subject._id, isActive: true }).sort({ order: 1, name: 1 });
    const topicStats = topics.map(topic => {
      const topicSubs = submissions.filter(s => s.topic && s.topic.toString() === topic._id.toString());
      const mcqSubs = topicSubs.filter(s => s.questionType === 'mcq');
      const correct = mcqSubs.filter(s => s.isCorrect).length;
      const total = mcqSubs.length;
      return { topicId: topic._id, name: topic.name, attempts: total, correct, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0 };
    });
    const mcqSubs = submissions.filter(s => s.questionType === 'mcq');
    const totalCorrect = mcqSubs.filter(s => s.isCorrect).length;
    const totalAttempts = mcqSubs.length;
    const interviewSubs = submissions.filter(s => s.questionType === 'interview');
    res.json({
      success: true,
      data: {
        subject: subject.name,
        overallAccuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
        totalMCQs: totalAttempts, totalCorrect,
        totalInterviewAttempts: interviewSubs.length, topicStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


