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

// @desc    Get leaderboard
// @route   GET /api/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { period = 'all', page = 1, limit = 50 } = req.query;
    
    let sortField = { all: 'totalSolved', weekly: 'weeklySolved', monthly: 'monthlySolved' }[period] || 'totalSolved';
    
    const leaderboard = await Leaderboard.find()
      .populate('user', 'name email profile.college profile.year profile.profilePicture')
      .sort({ [sortField]: -1, lastUpdated: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Leaderboard.countDocuments();

    // Get current user's rank
    const currentUserEntry = await Leaderboard.findOne({ user: req.user.id });
    let userRank = 0;
    if (currentUserEntry) {
      userRank = await Leaderboard.countDocuments({
        [sortField]: { $gt: currentUserEntry[sortField] }
      }) + 1;
    }

    res.status(200).json({
      success: true,
      data: leaderboard,
      userRank,
      total,
      totalPages: Math.ceil(total / limit),
      page: parseInt(page),
      period,
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