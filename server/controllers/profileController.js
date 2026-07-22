const Submission = require('../models/Submission');
const User = require('../models/User');
const Problem = require('../models/Problem');
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSubmissions = await Submission.find({
      user: req.user.id,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: -1 });
    const dailyActivity = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dailyActivity[date] = { submissions: 0, accepted: 0 };
    }
    recentSubmissions.forEach((sub) => {
      const date = sub.createdAt.toISOString().split('T')[0];
      if (dailyActivity[date]) {
        dailyActivity[date].submissions += 1;
        if (sub.status === 'accepted') dailyActivity[date].accepted += 1;
      }
    });
    const difficultyStats = { easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 } };
    const allProblems = await Problem.find({ isActive: true });
    allProblems.forEach((p) => {
      difficultyStats[p.difficulty].total += 1;
    });
    const acceptedSubmissions = await Submission.find({
      user: req.user.id,
      status: 'accepted',
      type: 'submit',
    }).distinct('problem');
    for (const problemId of acceptedSubmissions) {
      const problem = await Problem.findById(problemId);
      if (problem) {
        difficultyStats[problem.difficulty].solved += 1;
      }
    }
    const tagStats = {};
    allProblems.forEach((p) => {
      p.tags.forEach((tag) => {
        if (!tagStats[tag]) {
          tagStats[tag] = { solved: 0, total: 0 };
        }
        tagStats[tag].total += 1;
      });
    });
    const userAcceptedProblems = await Submission.find({
      user: req.user.id,
      status: 'accepted',
      type: 'submit',
    }).populate('problem', 'tags');
    const solvedTags = new Set();
    userAcceptedProblems.forEach((sub) => {
      if (sub.problem && sub.problem.tags) {
        sub.problem.tags.forEach((tag) => {
          solvedTags.add(tag);
        });
      }
    });
    solvedTags.forEach((tag) => {
      if (tagStats[tag]) {
        tagStats[tag].solved += 1;
      }
    });
    const recentSubmissionsList = await Submission.find({ user: req.user.id })
      .populate('problem', 'title slug difficulty')
      .sort({ createdAt: -1 })
      .limit(20);
    const totalAccepted = await Submission.countDocuments({
      user: req.user.id,
      status: 'accepted',
      type: 'submit',
    });
    const totalSubmissions = await Submission.countDocuments({ user: req.user.id });
    const acceptanceRate = totalSubmissions > 0 ? Math.round((totalAccepted / totalSubmissions) * 100) : 0;
    res.status(200).json({
      success: true,
      data: {
        overallStats: {
          totalSolved: user.stats.totalSolved || 0,
          totalSubmissions: totalSubmissions,
          acceptanceRate,
          currentStreak: user.stats.streak || 0,
        },
        difficultyBreakdown: {
          easy: `${difficultyStats.easy.solved}/${difficultyStats.easy.total}`,
          medium: `${difficultyStats.medium.solved}/${difficultyStats.medium.total}`,
          hard: `${difficultyStats.hard.solved}/${difficultyStats.hard.total}`,
        },
        difficultyStats,
        tagStats: Object.entries(tagStats).map(([tag, data]) => ({
          tag,
          solved: data.solved,
          total: data.total,
        })),
        recentSubmissions: recentSubmissionsList.map((sub) => ({
          id: sub._id,
          problemTitle: sub.problem?.title || 'Unknown',
          problemSlug: sub.problem?.slug || '',
          difficulty: sub.problem?.difficulty || 'easy',
          status: sub.status,
          submittedAt: sub.createdAt,
        })),
        dailyActivity: Object.entries(dailyActivity)
          .map(([date, data]) => ({ date, ...data }))
          .reverse(),
        weakTopics: user.weakTopics || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};