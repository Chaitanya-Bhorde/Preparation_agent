const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const { executeCode } = require('../utils/judge0');
exports.createSubmission = async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    if (!problemId || !code || !language) {
      return res.status(400).json({ success: false, message: 'Please provide problemId, code, and language' });
    }
    const problem = await Problem.findById(problemId).populate('testCases');
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    const submission = await Submission.create({
      user: req.user.id,
      problem: problemId,
      code,
      language,
      status: 'pending',
      totalTestCases: problem.testCases.length,
    });
    const results = await executeCode(code, language, problem.testCases);
    const passedCount = results.filter((r) => r.passed).length;
    const status = passedCount === problem.testCases.length ? 'accepted' : 'wrong_answer';
    submission.status = status;
    submission.testCaseResults = results.map((r, idx) => ({
      testCase: problem.testCases[idx]._id,
      passed: r.passed,
      input: r.input || problem.testCases[idx].input,
      expectedOutput: r.expectedOutput || problem.testCases[idx].expectedOutput,
      actualOutput: r.output || '',
      executionTime: r.executionTime || 0,
      memoryUsed: r.memoryUsed || 0,
    }));
    submission.passedTestCases = passedCount;
    submission.executionTime = Math.max(...results.map((r) => r.executionTime || 0));
    submission.memoryUsed = Math.max(...results.map((r) => r.memoryUsed || 0));
    submission.score = Math.round((passedCount / problem.testCases.length) * 100);
    await submission.save();
    problem.totalSubmissions += 1;
    if (status === 'accepted') problem.acceptedSubmissions += 1;
    problem.acceptanceRate = Math.round((problem.acceptedSubmissions / problem.totalSubmissions) * 100);
    await problem.save();
    if (status === 'accepted') {
      const existingAccepted = await Submission.findOne({
        user: req.user.id,
        problem: problemId,
        status: 'accepted',
        _id: { $ne: submission._id },
      });
      if (!existingAccepted) {
        const updateObj = { 'stats.totalSolved': 1, 'stats.totalSubmissions': 1 };
        if (problem.difficulty === 'easy') updateObj['stats.easySolved'] = 1;
        else if (problem.difficulty === 'medium') updateObj['stats.mediumSolved'] = 1;
        else if (problem.difficulty === 'hard') updateObj['stats.hardSolved'] = 1;
        await User.findByIdAndUpdate(req.user.id, { $inc: updateObj });
      }
    } else {
      await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.totalSubmissions': 1 } });
    }
    if (status !== 'accepted') {
      const user = await User.findById(req.user.id);
      const weakTopics = problem.tags.filter((tag) => !user.weakTopics.includes(tag));
      if (weakTopics.length > 0) {
        await User.findByIdAndUpdate(req.user.id, {
          $addToSet: { weakTopics: { $each: weakTopics } },
        });
      }
    }
    res.status(201).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getSubmissions = async (req, res) => {
  try {
    const { problemId, page = 1, limit = 20 } = req.query;
    const query = { user: req.user.id };
    if (problemId) query.problem = problemId;
    const total = await Submission.countDocuments(query);
    const submissions = await Submission.find(query)
      .populate('problem', 'title slug difficulty tags')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.status(200).json({
      success: true,
      count: submissions.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: submissions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('problem', 'title slug difficulty tags')
      .populate('user', 'name email');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    if (submission.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};