const SQLProblem = require('../models/SQLProblem');
const SQLSubmission = require('../models/SQLSubmission');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { executeAndCompare } = require('../utils/sqlResultComparator');
const { updateStreak } = require('../utils/streak');

exports.getSQLProblems = async (req, res) => {
  try {
    const { difficulty, topic, tags, search, company, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (difficulty) query.difficulty = difficulty;
    if (topic) query.topic = topic;
    if (tags) query.tags = { $in: tags.split(',') };
    if (company) query.companies = company;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await SQLProblem.countDocuments(query);
    const problems = await SQLProblem.find(query)
      .select('-schemaSetupSQL -sampleTestCases -hiddenTestCases -referenceSolutionSQL')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const userSubmissions = await SQLSubmission.find({
      user: req.user.id,
      problem: { $in: problems.map(p => p._id) },
    }).select('problem status type');

    const problemStatusMap = {};
    userSubmissions.forEach(sub => {
      const pid = sub.problem.toString();
      const isAccepted = sub.status === 'passed' && sub.type === 'submit';
      if (!problemStatusMap[pid] || (isAccepted && problemStatusMap[pid] !== 'solved')) {
        problemStatusMap[pid] = isAccepted ? 'solved' : 'attempted';
      }
    });

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

exports.getSQLProblem = async (req, res) => {
  try {
    const problem = await SQLProblem.findOne({ slug: req.params.slug })
      .select('-hiddenTestCases -referenceSolutionSQL');
    if (!problem) {
      return res.status(404).json({ success: false, message: 'SQL problem not found' });
    }

    const solved = await SQLSubmission.findOne({
      user: req.user.id,
      problem: problem._id,
      status: 'passed',
      type: 'submit',
    }).select('status');

    let userStatus = 'unsolved';
    if (solved) {
      userStatus = 'solved';
    } else {
      const attempted = await SQLSubmission.findOne({
        user: req.user.id,
        problem: problem._id,
        type: 'submit',
      }).select('status');
      if (attempted) userStatus = 'attempted';
    }

    res.status(200).json({ success: true, data: { ...problem.toObject(), userStatus } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.runSQL = async (req, res) => {
  try {
    const { problemId, query } = req.body;
    if (!problemId || !query) {
      return res.status(400).json({ success: false, message: 'Please provide problemId and query' });
    }

    const problem = await SQLProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'SQL problem not found' });
    }

    const results = [];
    let allPassed = true;

    for (const tc of problem.sampleTestCases) {
      const startTime = Date.now();
      const comparison = await executeAndCompare(problem.schemaSetupSQL, tc.inputStateSQL, query, tc.expectedOutputRows);
      const elapsed = Date.now() - startTime;

      const tcResult = {
        passed: comparison.match,
        isSample: true,
        error: comparison.error || null,
        actualRows: comparison.details?.normalizedActual || [],
        expectedRows: tc.expectedOutputRows || [],
        missingRows: comparison.details?.missingRows || [],
        extraRows: comparison.details?.extraRows || [],
        wrongValueRows: comparison.details?.wrongValueRows || [],
      };
      results.push(tcResult);
      if (!comparison.match) allPassed = false;
    }

    const passedCount = results.filter(r => r.passed).length;
    const submission = await SQLSubmission.create({
      user: req.user.id,
      problem: problemId,
      submittedQuery: query,
      status: allPassed ? 'passed' : 'failed',
      testCasesPassed: passedCount,
      totalTestCases: problem.sampleTestCases.length,
      testCaseResults: results,
      executionTime: 0,
      type: 'run',
      problemDifficulty: problem.difficulty,
      problemTags: problem.tags,
    });

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitSQL = async (req, res) => {
  try {
    const body = req.body || {};
    const problemId = body.problemId;
    const query = body.query;
    console.log('SQL SUBMIT BODY:', JSON.stringify(body));
    if (!problemId || !query) {
      return res.status(400).json({ success: false, message: 'Please provide problemId and query' });
    }

    const problem = await SQLProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'SQL problem not found' });
    }

    const allTestCases = [...problem.sampleTestCases, ...problem.hiddenTestCases];
    const results = [];
    let allPassed = true;

    for (const tc of allTestCases) {
      const startTime = Date.now();
      const comparison = await executeAndCompare(problem.schemaSetupSQL, tc.inputStateSQL, query, tc.expectedOutputRows);
      const elapsed = Date.now() - startTime;

      const isSample = problem.sampleTestCases.includes(tc);
      const tcResult = {
        passed: comparison.match,
        isSample,
        error: comparison.error || null,
        actualRows: comparison.details?.normalizedActual || [],
        expectedRows: tc.expectedOutputRows || [],
        missingRows: comparison.details?.missingRows || [],
        extraRows: comparison.details?.extraRows || [],
        wrongValueRows: comparison.details?.wrongValueRows || [],
      };
      results.push(tcResult);
      if (!comparison.match) allPassed = false;
    }

    const passedCount = results.filter(r => r.passed).length;
    const status = allPassed ? 'passed' : 'failed';

    const submission = await SQLSubmission.create({
      user: req.user.id,
      problem: problemId,
      submittedQuery: query,
      status,
      testCasesPassed: passedCount,
      totalTestCases: allTestCases.length,
      testCaseResults: results,
      executionTime: 0,
      type: 'submit',
      problemDifficulty: problem.difficulty,
      problemTags: problem.tags,
    });

    problem.totalSubmissions += 1;
    if (status === 'passed') problem.acceptedSubmissions += 1;
    problem.acceptanceRate = Math.round((problem.acceptedSubmissions / problem.totalSubmissions) * 100);
    await problem.save();

    if (status === 'passed') {
      const existingAccepted = await SQLSubmission.findOne({
        user: req.user.id,
        problem: problemId,
        status: 'passed',
        type: 'submit',
        _id: { $ne: submission._id },
      });
      if (!existingAccepted) {
        const solvedIncrement = problem.difficulty === 'easy'
          ? { 'stats.easySolved': 1, 'stats.totalSolved': 1, 'stats.totalSubmissions': 1 }
          : problem.difficulty === 'medium'
          ? { 'stats.mediumSolved': 1, 'stats.totalSolved': 1, 'stats.totalSubmissions': 1 }
          : { 'stats.hardSolved': 1, 'stats.totalSolved': 1, 'stats.totalSubmissions': 1 };
        await User.findByIdAndUpdate(req.user.id, { $inc: solvedIncrement });
      } else {
        await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.totalSubmissions': 1 } });
      }
    } else {
      await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.totalSubmissions': 1 } });
    }

    // Dual-write to unified Submission model for analytics
    const subStatus = status === 'passed' ? 'accepted' : 'wrong_answer';
    const traceLine = `SQL DUAL-WRITE TRACE: category=sql status=${subStatus} userId=${req.user.id} problemId=${problemId}\n`;
    try {
      await require('fs').promises.appendFile(require('path').join(__dirname, '../logs/sql-dualwrite-debug.log'), traceLine);
    } catch {}
    console.log('SQL DUAL-WRITE TRACE:', { category: 'sql', status: subStatus, userId: req.user.id, problemId });
    let created;
    try {
      created = await Submission.create({
        user: req.user.id,
        problem: problemId,
        code: query,
        language: 'sql',
        status: subStatus,
        type: 'submit',
        passedTestCases: passedCount,
        totalTestCases: allTestCases.length,
        problemDifficulty: problem.difficulty,
        problemTags: problem.tags,
        category: 'sql',
        score: Math.round((passedCount / allTestCases.length) * 100),
      });
      console.log('SQL DUAL-WRITE RESULT:', created.toObject());
      const resultLine = `SQL DUAL-WRITE RESULT: ${JSON.stringify(created.toObject())}\n`;
      try {
        await require('fs').promises.appendFile(require('path').join(__dirname, '../logs/sql-dualwrite-debug.log'), resultLine);
      } catch {}
    } catch (dualWriteErr) {
      console.error('SQL dual-write to Submission failed:', dualWriteErr.message);
    }

    if (status === 'passed') {
      updateStreak(req.user.id).catch(err => console.error('Streak update failed:', err.message));
    }

    const Leaderboard = require('../models/Leaderboard');
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const weeklyAccepted = await Submission.countDocuments({ user: req.user.id, createdAt: { $gte: oneWeekAgo }, type: 'submit', status: 'accepted' });
    const monthlyAccepted = await Submission.countDocuments({ user: req.user.id, createdAt: { $gte: oneMonthAgo }, type: 'submit', status: 'accepted' });
    const totalSubs = await Submission.countDocuments({ user: req.user.id, type: 'submit' });
    const acceptedSubs = await Submission.countDocuments({ user: req.user.id, type: 'submit', status: 'accepted' });
    const acceptanceRate = totalSubs > 0 ? Math.round((acceptedSubs / totalSubs) * 100) : 0;
    const leaderboardUser = await User.findById(req.user.id);
    await Leaderboard.findOneAndUpdate(
      { user: req.user.id },
      {
        totalSolved: leaderboardUser.stats.totalSolved,
        easySolved: leaderboardUser.stats.easySolved,
        mediumSolved: leaderboardUser.stats.mediumSolved,
        hardSolved: leaderboardUser.stats.hardSolved,
        totalSubmissions: leaderboardUser.stats.totalSubmissions,
        acceptanceRate,
        atsScore: leaderboardUser.profile.atsScore || 0,
        streak: leaderboardUser.stats.streak || 0,
        weeklySolved: weeklyAccepted,
        monthlySolved: monthlyAccepted,
        lastUpdated: Date.now(),
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSQLSubmissions = async (req, res) => {
  try {
    const { problemId, page = 1, limit = 20 } = req.query;
    const query = { user: req.user.id };
    if (problemId) query.problem = problemId;

    const total = await SQLSubmission.countDocuments(query);
    const submissions = await SQLSubmission.find(query)
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

exports.getSQLSubmission = async (req, res) => {
  try {
    const submission = await SQLSubmission.findById(req.params.id)
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

exports.getSQLTopics = async (req, res) => {
  try {
    const topics = await SQLProblem.distinct('topic', { isActive: true });
    res.status(200).json({ success: true, data: topics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSQLCompanies = async (req, res) => {
  try {
    const companies = await SQLProblem.distinct('companies', { isActive: true });
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSQLTags = async (req, res) => {
  try {
    const tags = await SQLProblem.distinct('tags', { isActive: true });
    res.status(200).json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
