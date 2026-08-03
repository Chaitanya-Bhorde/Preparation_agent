const mongoose = require('mongoose');
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');
const Submission = require('../models/Submission');

// @desc    Update leaderboard (called after submission)
// @route   POST /api/leaderboard/update
exports.updateLeaderboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const weeklySubmissions = await Submission.countDocuments({
      user: req.user.id,
      createdAt: { $gte: oneWeekAgo },
      type: 'submit',
      status: 'accepted',
    });

    const monthlySubmissions = await Submission.countDocuments({
      user: req.user.id,
      createdAt: { $gte: oneMonthAgo },
      type: 'submit',
      status: 'accepted',
    });

    const totalSubmissions = await Submission.countDocuments({
      user: req.user.id,
      type: 'submit',
    });
    const acceptedSubmissions = await Submission.countDocuments({
      user: req.user.id,
      type: 'submit',
      status: 'accepted',
    });

    const acceptanceRate = totalSubmissions > 0
      ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
      : 0;

    const leaderboardEntry = await Leaderboard.findOneAndUpdate(
      { user: req.user.id },
      {
        totalSolved: user.stats.totalSolved,
        easySolved: user.stats.easySolved,
        mediumSolved: user.stats.mediumSolved,
        hardSolved: user.stats.hardSolved,
        totalSubmissions: user.stats.totalSubmissions,
        acceptanceRate,
        atsScore: user.profile.atsScore || 0,
        streak: user.stats.streak || 0,
        weeklySolved: weeklySubmissions,
        monthlySolved: monthlySubmissions,
        lastUpdated: Date.now(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: leaderboardEntry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get leaderboard (per category: dsa | sql | aptitude | overall) using $group + $sort
// @route   GET /api/leaderboard/:category?page=&limit=
exports.getLeaderboard = async (req, res) => {
  try {
    const category = (req.params.category || 'overall').toLowerCase();
    const allowed = ['dsa', 'sql', 'aptitude', 'overall'];
    if (!allowed.includes(category)) {
      return res.status(400).json({ success: false, message: `Invalid category. Must be one of: ${allowed.join(', ')}` });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const match = { type: 'submit' };
    if (category !== 'overall') match.category = category;

    const leaderboard = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$user',
          solvedIds: {
            $addToSet: { $cond: [{ $eq: ['$status', 'accepted'] }, '$problem', null] },
          },
          totalSubmissions: { $sum: 1 },
          acceptedSubmissions: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          earliestSolve: { $min: { $cond: [{ $eq: ['$status', 'accepted'] }, '$createdAt', null] } },
        },
      },
      {
        $project: {
          solvedCount: { $size: { $setDifference: ['$solvedIds', [null]] } },
          totalSubmissions: 1,
          acceptedSubmissions: 1,
          earliestSolve: 1,
          acceptanceRate: {
            $cond: [
              { $eq: ['$totalSubmissions', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$acceptedSubmissions', '$totalSubmissions'] }, 100] }, 0] },
            ],
          },
        },
      },
      { $sort: { solvedCount: -1, acceptanceRate: -1, earliestSolve: 1 } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          solvedCount: 1,
          acceptanceRate: 1,
        },
      },
      { $match: { solvedCount: { $gt: 0 } } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    // Total ranked participants (for pagination) — same grouping minus skip/limit.
    const totalResult = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$user',
          solvedIds: { $addToSet: { $cond: [{ $eq: ['$status', 'accepted'] }, '$problem', null] } },
        },
      },
      { $project: { solvedCount: { $size: { $setDifference: ['$solvedIds', [null]] } } } },
      { $match: { solvedCount: { $gt: 0 } } },
      { $count: 'total' },
    ]);
    const total = totalResult[0] ? totalResult[0].total : 0;

    // Current user's global rank for this category.
    const userSolvedResult = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$user',
          solvedIds: { $addToSet: { $cond: [{ $eq: ['$status', 'accepted'] }, '$problem', null] } },
        },
      },
      { $project: { solvedCount: { $size: { $setDifference: ['$solvedIds', [null]] } } } },
      { $match: { _id: new mongoose.Types.ObjectId(req.user.id) } },
    ]);
    const mySolved = userSolvedResult[0] ? userSolvedResult[0].solvedCount : 0;

    let userRank = 0;
    if (mySolved > 0) {
      const ahead = await Submission.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$user',
            solvedIds: { $addToSet: { $cond: [{ $eq: ['$status', 'accepted'] }, '$problem', null] } },
          },
        },
        { $project: { solvedCount: { $size: { $setDifference: ['$solvedIds', [null]] } } } },
        { $match: { solvedCount: { $gt: mySolved } } },
        { $count: 'n' },
      ]);
      userRank = (ahead[0] ? ahead[0].n : 0) + 1;
    }

    // Attach sequential rank per row (page-relative global rank).
    const data = leaderboard.map((row, i) => ({ rank: (page - 1) * limit + i + 1, ...row }));

    res.status(200).json({
      success: true,
      category,
      data,
      userRank,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my leaderboard stats
// @route   GET /api/leaderboard/me
exports.getMyLeaderboardStats = async (req, res) => {
  try {
    const entry = await Leaderboard.findOne({ user: req.user.id })
      .populate('user', 'name email profile.college profile.year');
    
    if (!entry) {
      return res.status(200).json({
        success: true,
        data: null,
        rank: null,
      });
    }

    const rank = await Leaderboard.countDocuments({
      totalSolved: { $gt: entry.totalSolved }
    }) + 1;

    res.status(200).json({
      success: true,
      data: entry,
      rank,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};