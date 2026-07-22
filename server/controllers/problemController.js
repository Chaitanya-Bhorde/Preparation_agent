const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
exports.getProblems = async (req, res) => {
  try {
    const { difficulty, tags, search, status: solvedStatus, category, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (difficulty) query.difficulty = difficulty;
    if (tags) query.tags = { $in: tags.split(',') };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Problem.countDocuments(query);
    let problems = await Problem.find(query)
      .select('-testCases -solution')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const userSubmissions = await Submission.find({
      user: req.user.id,
      problem: { $in: problems.map(p => p._id) },
    }).select('problem status');

    const problemStatusMap = {};
    userSubmissions.forEach(sub => {
      const pid = sub.problem.toString();
      if (!problemStatusMap[pid] || (sub.status === 'accepted' && problemStatusMap[pid] !== 'accepted')) {
        problemStatusMap[pid] = sub.status === 'accepted' ? 'solved' : 'attempted';
      }
    });

    if (solvedStatus === 'solved') {
      const solvedIds = Object.keys(problemStatusMap).filter(k => problemStatusMap[k] === 'solved');
      problems = problems.filter(p => solvedIds.includes(p._id.toString()));
    } else if (solvedStatus === 'attempted') {
      const attemptedIds = Object.keys(problemStatusMap).filter(k => problemStatusMap[k] === 'attempted');
      problems = problems.filter(p => attemptedIds.includes(p._id.toString()));
    } else if (solvedStatus === 'unsolved') {
      const allIds = Object.keys(problemStatusMap);
      problems = problems.filter(p => !allIds.includes(p._id.toString()));
    }

    const data = problems.map(p => ({
      ...p.toObject(),
      userStatus: problemStatusMap[p._id.toString()] || 'unsolved',
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data,
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
    const solved = await Submission.findOne({
      user: req.user.id,
      problem: problem._id,
      status: 'accepted',
    }).select('status');
    let userStatus = 'unsolved';
    if (solved) {
      userStatus = 'solved';
    } else {
      const attempted = await Submission.findOne({
        user: req.user.id,
        problem: problem._id,
      }).select('status');
      if (attempted) userStatus = 'attempted';
    }
    res.status(200).json({ success: true, data: { ...problem.toObject(), userStatus } });
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