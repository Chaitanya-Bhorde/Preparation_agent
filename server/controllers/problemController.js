const Problem = require('../models/Problem');
exports.getProblems = async (req, res) => {
  try {
    const { difficulty, tags, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (difficulty) query.difficulty = difficulty;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Problem.countDocuments(query);
    const problems = await Problem.find(query)
      .select('-testCases -solution')
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
exports.getProblem = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug })
      .select('-testCases.expectedOutput -solution');
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    res.status(200).json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.createProblem = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const problem = await Problem.create(req.body);
    res.status(201).json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    res.status(200).json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    res.status(200).json({ success: true, message: 'Problem deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getTags = async (req, res) => {
  try {
    const tags = await Problem.distinct('tags');
    res.status(200).json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};