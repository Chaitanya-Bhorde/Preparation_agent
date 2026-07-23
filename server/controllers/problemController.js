const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const { generateStarterCode } = require('../utils/codeGenerator');

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

    if (solvedStatus) {
      const userSubmissions = await Submission.find({
        user: req.user.id,
        type: 'submit',
      }).select('problem status');

      const solvedIds = new Set();
      const submittedIds = new Set();

      userSubmissions.forEach((sub) => {
        const pid = sub.problem.toString();
        submittedIds.add(pid);
        if (sub.status === 'accepted') {
          solvedIds.add(pid);
        }
      });

      if (solvedStatus === 'solved') {
        query._id = { $in: Array.from(solvedIds) };
      } else if (solvedStatus === 'attempted') {
        const attemptedOnly = Array.from(submittedIds).filter((id) => !solvedIds.has(id));
        query._id = { $in: attemptedOnly };
      } else if (solvedStatus === 'unsolved') {
        query._id = { $nin: Array.from(submittedIds) };
      }
    }

    const total = await Problem.countDocuments(query);
    let problems = await Problem.find(query)
      .select('-testCases -solution -driverTemplate')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const pageSubmissions = await Submission.find({
      user: req.user.id,
      type: 'submit',
      problem: { $in: problems.map((p) => p._id) },
    }).select('problem status');

    const problemStatusMap = {};
    pageSubmissions.forEach((sub) => {
      const pid = sub.problem.toString();
      if (!problemStatusMap[pid] || (sub.status === 'accepted' && problemStatusMap[pid] !== 'accepted')) {
        problemStatusMap[pid] = sub.status === 'accepted' ? 'solved' : 'attempted';
      }
    });

    const data = problems.map((p) => ({
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
      .select('-testCases.expectedOutput -solution -driverTemplate');
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    const solved = await Submission.findOne({
      user: req.user.id,
      problem: problem._id,
      status: 'accepted',
      type: 'submit',
    }).select('status');
    let userStatus = 'unsolved';
    if (solved) {
      userStatus = 'solved';
    } else {
      const attempted = await Submission.findOne({
        user: req.user.id,
        problem: problem._id,
        type: 'submit',
      }).select('status');
      if (attempted) userStatus = 'attempted';
    }
    const problemObj = problem.toObject();
    if (problemObj.starterCode) {
      const generatedStarter = {};
      for (const lang of ['javascript', 'python', 'java', 'cpp', 'c']) {
        const sig = problemObj.functionSignature?.[lang];
        if (sig) {
          generatedStarter[lang] = generateStarterCode(sig, lang);
        } else if (problemObj.starterCode[lang]) {
          generatedStarter[lang] = problemObj.starterCode[lang];
        } else {
          generatedStarter[lang] = generateStarterCode(null, lang);
        }
      }
      problemObj.starterCode = generatedStarter;
    }
    res.status(200).json({ success: true, data: { ...problemObj, userStatus } });
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