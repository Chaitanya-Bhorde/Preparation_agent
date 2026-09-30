const User = require('../models/User');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const { generateRecommendations } = require('../services/recommendationService');

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
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // The real, performance-driven pipeline lives in
    // services/recommendationService.js. It reads the user's ACTUAL submission
    // history (DSA + SQL + aptitude + core subjects), detects weak topics with a
    // Bayesian-smoothed accuracy, and ranks unsolved problems with a published
    // weighted scorer. When the data is thin it returns an explicit empty state
    // instead of padding the list with arbitrary problems.
    const payload = await generateRecommendations(user._id);

    // Preserve the existing response contract so current clients keep working,
    // while adding the new, explainable fields.
    const weakTopics = [
      ...(user.weakTopics || []),
      ...payload.weakTopics.map((w) => w.topic),
    ];
    const uniqueWeakTopics = [...new Set(weakTopics)];

    res.status(200).json({
      success: true,
      data: {
        recommendations: payload.recommendations,
        revisionQueue: payload.recommendations.slice(0, 5),
        weakTopics: uniqueWeakTopics,
        weakTopicStats: payload.weakTopics,
        strongTopics: payload.strongTopics,
        tagPerformance: payload.weakTopics.map((w) => ({
          tag: w.topic,
          successRate: w.accuracy / 100,
          totalAttempts: w.attempts,
          solved: w.solved,
          daysSinceLastAttempt: w.daysSinceLastAttempt,
        })),
        targetDifficulty: payload.targetDifficulty,
        recentSuccessRate: payload.features.totalAttempts > 0
          ? Math.round((payload.features.uniqueSolved / payload.features.totalAttempts) * 100)
          : 0,
        coreSubjectWeakTopics: payload.crossDomain.coreSubjects
          ? payload.crossDomain.coreSubjects.weakSubjects.map((s) => ({
              subject: s.subject,
              slug: undefined,
              accuracy: s.accuracy,
              total: s.attempts,
            }))
          : [],
        // --- new, documented fields ---
        hasEnoughData: payload.hasEnoughData,
        message: payload.message,
        model: payload.model,
        features: payload.features,
        crossDomain: payload.crossDomain,
      },
    });
  } catch (error) {
    console.error('getRecommendations failed:', error);
    res.status(500).json({ success: false, message: 'Could not build recommendations' });
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
      const problem = await Problem.findById(problemId).select('tags');
      if (problem && problem.tags && problem.tags.length > 0) {
        await User.findByIdAndUpdate(req.user.id, {
          $pullAll: { weakTopics: problem.tags },
        });
      }
    }
    res.status(200).json({ success: true, message: 'Revision progress updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};