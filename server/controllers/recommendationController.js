const User = require('../models/User');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');

const REVISION_INTERVALS = [1, 3, 7, 14, 30];

const calculateNextReview = (currentIntervalIndex, passed) => {
  if (passed) {
    const nextIndex = Math.min(currentIntervalIndex + 1, REVISION_INTERVALS.length - 1);
    const dueDate = new Date(Date.now() + REVISION_INTERVALS[nextIndex] * 24 * 60 * 60 * 1000);
    return { intervalIndex: nextIndex, dueDate };
  }
  const dueDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
  return { intervalIndex: 0, dueDate };
};

exports.getRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const weakTopics = user.weakTopics || [];

    const allSubmissions = await Submission.find({ user: req.user.id })
      .populate('problem', 'tags difficulty');
    const tagStats = {};
    allSubmissions.forEach((sub) => {
      if (sub.problem && sub.problem.tags) {
        sub.problem.tags.forEach((tag) => {
          if (!tagStats[tag]) tagStats[tag] = { total: 0, accepted: 0 };
          tagStats[tag].total += 1;
          if (sub.status === 'accepted') tagStats[tag].accepted += 1;
        });
      }
    });
    const tagSuccessRates = Object.entries(tagStats).map(([tag, stats]) => ({
      tag,
      successRate: stats.total > 0 ? stats.accepted / stats.total : 0,
      totalAttempts: stats.total,
    }));
    const lowPerformanceTags = tagSuccessRates
      .filter((t) => t.successRate < 0.5 && t.totalAttempts >= 2)
      .map((t) => t.tag);
    const allWeakTopics = [...new Set([...weakTopics, ...lowPerformanceTags])];

    const solvedProblemIds = await Submission.find({
      user: req.user.id,
      status: 'accepted',
    }).distinct('problem');

    let recommendations = [];
    if (allWeakTopics.length > 0) {
      const weakProblems = await Problem.find({
        tags: { $in: allWeakTopics },
        _id: { $nin: solvedProblemIds },
        isActive: true,
      })
        .select('-testCases -solution')
        .limit(5)
        .sort({ acceptanceRate: 1 });
      recommendations.push(...weakProblems);
    }

    const recentSubmissions = await Submission.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    const recentSuccessRate = recentSubmissions.filter((s) => s.status === 'accepted').length / Math.max(recentSubmissions.length, 1);

    let targetDifficulty;
    if (recentSuccessRate > 0.7) {
      targetDifficulty = 'hard';
    } else if (recentSuccessRate > 0.4) {
      targetDifficulty = 'medium';
    } else {
      targetDifficulty = 'easy';
    }

    const remainingCount = 10 - recommendations.length;
    if (remainingCount > 0) {
      const adaptiveProblems = await Problem.find({
        difficulty: targetDifficulty,
        _id: { $nin: [...solvedProblemIds, ...recommendations.map((r) => r._id)] },
        isActive: true,
      })
        .select('-testCases -solution')
        .limit(remainingCount)
        .sort({ acceptanceRate: -1 });
      recommendations.push(...adaptiveProblems);
    }

    const now = new Date();
    const dueRevisionEntries = (user.revisionQueue || []).filter((entry) => {
      if (!entry.dueDate) return true;
      return new Date(entry.dueDate) <= now;
    });
    const revisionProblemIds = dueRevisionEntries.map((r) => r.problem);
    const revisionProblems = await Problem.find({
      _id: { $in: revisionProblemIds },
    }).select('-testCases -solution');

    res.status(200).json({
      success: true,
      data: {
        recommendations,
        revisionQueue: revisionProblems,
        weakTopics: allWeakTopics,
        tagPerformance: tagSuccessRates,
        targetDifficulty,
        recentSuccessRate: Math.round(recentSuccessRate * 100),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToRevision = async (req, res) => {
  try {
    const { problemId } = req.body;
    const initialDueDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $addToSet: { revisionQueue: { problem: problemId, dueDate: initialDueDate, intervalIndex: 0 } },
      },
      { new: true }
    );
    res.status(200).json({ success: true, data: user.revisionQueue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeFromRevision = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: { revisionQueue: { problem: req.params.problemId } },
      },
      { new: true }
    );
    res.status(200).json({ success: true, data: user.revisionQueue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRevisionProgress = async (req, res) => {
  try {
    const { problemId, passed } = req.body;
    const user = await User.findById(req.user.id);
    const entry = (user.revisionQueue || []).find(
      (e) => e.problem.toString() === problemId
    );
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Problem not in revision queue' });
    }
    const { intervalIndex, dueDate } = calculateNextReview(entry.intervalIndex || 0, passed);
    await User.findOneAndUpdate(
      {
        _id: req.user.id,
        'revisionQueue.problem': problemId,
      },
      {
        $set: {
          'revisionQueue.$.intervalIndex': intervalIndex,
          'revisionQueue.$.dueDate': dueDate,
        },
      },
      { new: true }
    );
    if (passed) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { weakTopics: { $in: [] } },
      });
    }
    res.status(200).json({ success: true, message: 'Revision progress updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};