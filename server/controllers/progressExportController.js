const User = require('../models/User');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');

// @desc    Export progress as JSON (for PDF generation on frontend)
// @route   GET /api/progress/export
exports.exportProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get all submissions
    const submissions = await Submission.find({ user: req.user.id, type: 'submit' })
      .populate('problem', 'title difficulty tags')
      .sort({ createdAt: -1 });

    // Get topic performance
    const topicStats = {};
    submissions.forEach(sub => {
      if (sub.problem && sub.problem.tags) {
        sub.problem.tags.forEach(tag => {
          if (!topicStats[tag]) {
            topicStats[tag] = { total: 0, solved: 0 };
          }
          topicStats[tag].total++;
          if (sub.status === 'accepted') {
            topicStats[tag].solved++;
          }
        });
      }
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSubmissions = await Submission.find({
      user: req.user.id,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: 1 });

    const dailyActivity = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dailyActivity[date] = { submissions: 0, accepted: 0 };
    }
    recentSubmissions.forEach(sub => {
      const date = sub.createdAt.toISOString().split('T')[0];
      if (dailyActivity[date]) {
        dailyActivity[date].submissions++;
        if (sub.status === 'accepted') dailyActivity[date].accepted++;
      }
    });

    // Get company-wise stats
    const companyStats = {};
    const problemsWithCompanies = await Problem.find({
      _id: { $in: submissions.map(s => s.problem?._id).filter(Boolean) },
      companies: { $exists: true, $not: { $size: 0 } },
    });
    problemsWithCompanies.forEach(problem => {
      problem.companies.forEach(company => {
        if (!companyStats[company]) {
          companyStats[company] = { total: 0, solved: 0 };
        }
        companyStats[company].total++;
        const solved = submissions.some(
          s => s.problem?._id.toString() === problem._id.toString() && s.status === 'accepted'
        );
        if (solved) companyStats[company].solved++;
      });
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        name: user.name,
        email: user.email,
        college: user.profile?.college || '',
        branch: user.profile?.branch || '',
        year: user.profile?.year || '',
        cgpa: user.profile?.cgpa || '',
      },
      stats: {
        totalSolved: user.stats.totalSolved,
        easySolved: user.stats.easySolved,
        mediumSolved: user.stats.mediumSolved,
        hardSolved: user.stats.hardSolved,
        totalSubmissions: user.stats.totalSubmissions,
        acceptanceRate: user.stats.totalSubmissions > 0
          ? Math.round((user.stats.totalSolved / user.stats.totalSubmissions) * 100)
          : 0,
        streak: user.stats.streak || 0,
        atsScore: user.profile.atsScore || 0,
      },
      topicPerformance: Object.entries(topicStats).map(([topic, data]) => ({
        topic,
        total: data.total,
        solved: data.solved,
        successRate: Math.round((data.solved / data.total) * 100) || 0,
      })),
      companyPerformance: Object.entries(companyStats).map(([company, data]) => ({
        company,
        total: data.total,
        solved: data.solved,
      })),
      dailyActivity: Object.entries(dailyActivity)
        .map(([date, data]) => ({ date, ...data }))
        .reverse(),
      recentSubmissions: submissions.slice(0, 20).map(sub => ({
        title: sub.problem?.title || 'Unknown',
        difficulty: sub.problem?.difficulty || 'unknown',
        status: sub.status,
        language: sub.language,
        date: sub.createdAt,
      })),
    };

    res.status(200).json({ success: true, data: exportData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};