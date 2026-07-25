const CodingProblem = require('../models/CodingProblem');
const CodeSubmission = require('../models/CodeSubmission');

exports.getCodingProblems = async (req, res) => {
  try {
    const { difficulty, topic, tags, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (difficulty) query.difficulty = difficulty;
    if (topic) query.topic = topic;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await CodingProblem.countDocuments(query);
    const problems = await CodingProblem.find(query)
      .select('-visibleTestCases.expectedOutput -hiddenTestCases.expectedOutput')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: problems.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: problems,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCodingProblem = async (req, res) => {
  try {
    const problem = await CodingProblem.findOne({ slug: req.params.slug });
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const solved = await CodeSubmission.findOne({
      user: req.user.id,
      problem: problem._id,
      verdict: 'Accepted',
    }).select('verdict');
    let userStatus = 'unsolved';
    if (solved) {
      userStatus = 'solved';
    } else {
      const attempted = await CodeSubmission.findOne({
        user: req.user.id,
        problem: problem._id,
      }).select('verdict');
      if (attempted) userStatus = 'attempted';
    }

    res.status(200).json({ success: true, data: { ...problem.toObject(), userStatus } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCodingTags = async (req, res) => {
  try {
    const tags = await CodingProblem.distinct('tags');
    res.status(200).json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCodingTopics = async (req, res) => {
  try {
    const topics = await CodingProblem.distinct('topic');
    res.status(200).json({ success: true, data: topics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};