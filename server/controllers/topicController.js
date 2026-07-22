const Submission = require('../models/Submission');
const User = require('../models/User');
const Problem = require('../models/Problem');
const ConceptNote = require('../models/ConceptNote');

exports.getTopicProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const allSubmissions = await Submission.find({ user: userId }).populate('problem', 'tags difficulty');
    const topicMap = {};
    allSubmissions.forEach((sub) => {
      if (sub.problem && sub.problem.tags) {
        sub.problem.tags.forEach((tag) => {
          if (!topicMap[tag]) topicMap[tag] = { total: 0, accepted: 0, easy: 0, medium: 0, hard: 0 };
          topicMap[tag].total += 1;
          if (sub.status === 'accepted') {
            topicMap[tag].accepted += 1;
            if (sub.problem.difficulty === 'easy') topicMap[tag].easy += 1;
            if (sub.problem.difficulty === 'medium') topicMap[tag].medium += 1;
            if (sub.problem.difficulty === 'hard') topicMap[tag].hard += 1;
          }
        });
      }
    });
    const totalAttempted = Object.keys(topicMap).length;
    const topicList = await Problem.distinct('tags');
    const conceptNotes = await ConceptNote.find({}).sort({ topic: 1 });
    const noteMap = {};
    conceptNotes.forEach((note) => { noteMap[note.topic] = note; });
    const result = topicList.map((topic) => {
      const data = topicMap[topic] || { total: 0, accepted: 0, easy: 0, medium: 0, hard: 0 };
      const accuracy = data.total > 0 ? Math.round((data.accepted / data.total) * 100) : 0;
      return {
        topic,
        ...data,
        accuracy,
        hasNote: !!noteMap[topic],
      };
    });
    const totalAccuracy = result.length > 0 ? Math.round(result.reduce((a, b) => a + b.accuracy, 0) / result.length) : 0;
    res.status(200).json({ success: true, data: { topics: result, totalAccuracy, totalTopics: result.length, conceptNotes: noteMap } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getTopicDetails = async (req, res) => {
  try {
    const { topic } = req.params;
    const problems = await Problem.find({ tags: topic, isActive: true }).select('title slug difficulty tags');
    const note = await ConceptNote.findOne({ topic });
    res.status(200).json({ success: true, data: { topic, problems, note } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getConceptNotes = async (req, res) => {
  try {
    const notes = await ConceptNote.find({}).sort({ topic: 1 });
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};