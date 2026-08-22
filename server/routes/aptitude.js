const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const AptitudeTopic = require('../models/AptitudeTopic');
const AptitudeQuestion = require('../models/AptitudeQuestion');
const AptitudeSubmission = require('../models/AptitudeSubmission');
const AptitudeMockTest = require('../models/AptitudeMockTest');
const UserAchievements = require('../models/UserAchievements');
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');

// GET /api/aptitude/topics  - list topics by category (public so topics page loads without auth)
router.get('/topics', async (req, res) => {
  try {
    const { category } = req.query; // 'quantitative', 'logical', 'verbal', or all
    const query = category ? { category } : {};
    const topics = await AptitudeTopic.find(query).sort({ priority: -1, name: 1 });
    res.json({
      total: topics.length,
      byCategory: {
        quantitative: topics.filter(t => t.category === 'quantitative').length,
        logical: topics.filter(t => t.category === 'logical').length,
        verbal: topics.filter(t => t.category === 'verbal').length,
      },
      topics,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/aptitude/questions/:topicId  - 50 questions (solutions hidden initially)
router.get('/questions/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const questions = await AptitudeQuestion.find({ topicId }).select('-explanation -solutionSteps').limit(50);
    if (!questions.length) return res.status(404).json({ error: 'No questions found' });
    res.json({ total: questions.length, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/aptitude/submit-answer  - submit a single answer, get immediate feedback
router.post('/submit-answer', protect, async (req, res) => {
  try {
    const { questionId, selectedAnswer, timeTaken } = req.body;
    const userId = req.user.id;
    const question = await AptitudeQuestion.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    const isCorrect = question.correctAnswer === selectedAnswer;
    const submission = new AptitudeSubmission({
      userId,
      type: 'single-question',
      topicId: question.topicId,
      category: question.category,
      totalQuestions: 1,
      answers: [{ questionId, selectedAnswer, isCorrect, timeTaken }],
      correctCount: isCorrect ? 1 : 0,
      totalCount: 1,
      score: isCorrect ? 100 : 0,
      passed: isCorrect,
      verdict: isCorrect ? 'Excellent' : 'Poor',
      startTime: new Date(),
      endTime: new Date(),
      duration: timeTaken,
    });
    await submission.save();
    await updateUserAchievements(userId, question.category, isCorrect);
    res.status(201).json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      solutionSteps: question.solutionSteps,
      submissionId: submission._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/aptitude/mock-tests  - list available mock tests
router.get('/mock-tests', async (req, res) => {
  try {
    const mockTests = await AptitudeMockTest.find()
      .select('name description category totalQuestions duration')
      .limit(10);
    res.json({ total: mockTests.length, mockTests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/aptitude/submit-mock  - submit an entire mock test, calculate score
router.post('/submit-mock', protect, async (req, res) => {
  try {
    const { mockTestId, answers } = req.body; // answers = [{questionId, selectedAnswer, timeTaken}]
    const userId = req.user.id;
    const mockTest = await AptitudeMockTest.findById(mockTestId);
    if (!mockTest) return res.status(404).json({ error: 'Mock test not found' });
    const questions = await AptitudeQuestion.find({ _id: { $in: mockTest.questionIds } });
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));
    let correctCount = 0;
    const gradedAnswers = answers.map(ans => {
      const question = questionMap.get(ans.questionId);
      const isCorrect = !!(question && question.correctAnswer === ans.selectedAnswer);
      if (isCorrect) correctCount++;
      return {
        questionId: ans.questionId,
        selectedAnswer: ans.selectedAnswer,
        isCorrect,
        timeTaken: ans.timeTaken,
      };
    });
    const score = Math.round((correctCount / answers.length) * 100);
    const passed = score >= mockTest.passingScore;
    const verdict = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Failed';
    const submission = new AptitudeSubmission({
      userId,
      type: 'mock-test',
      mockTestId,
      category: mockTest.category,
      totalQuestions: answers.length,
      answers: gradedAnswers,
      correctCount,
      totalCount: answers.length,
      score,
      passed,
      verdict,
      duration: answers.reduce((sum, a) => sum + (a.timeTaken || 0), 0),
    });
    await submission.save();
    await updateUserAchievements(userId, mockTest.category, true, 'mock-test');
    await updateLeaderboardAptitude(userId, correctCount, score);
    res.status(201).json({
      submissionId: submission._id,
      score,
      correctCount,
      totalCount: answers.length,
      passed,
            verdict,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/aptitude/results/:submissionId  - full results + solutions for a submission
router.get('/results/:submissionId', protect, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;
    const submission = await AptitudeSubmission.findById(submissionId)
      .populate('userId', 'name email')
      .populate('mockTestId', 'name duration');
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.userId._id.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const answerDetails = await Promise.all(
      submission.answers.map(async (ans) => {
        const question = await AptitudeQuestion.findById(ans.questionId);
        return {
          ...ans.toObject(),
          question: {
            questionText: question.questionText,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            solutionSteps: question.solutionSteps,
          },
        };
      })
    );
        res.json({ submission: { ...submission.toObject(), answers: answerDetails } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: update user achievements + award badges based on performance
async function updateUserAchievements(userId, category, isCorrect, type) {
  let achievements = await UserAchievements.findOne({ userId });
  if (!achievements) achievements = new UserAchievements({ userId });
  const catRaw = String(category || '').replace(/-only$/, '');
  const cat = (catRaw === 'quantitative' || catRaw === 'logical' || catRaw === 'verbal') ? catRaw : 'quantitative';
  achievements.statistics.totalQuestionsAttempted += 1;
  if (isCorrect) {
    achievements.statistics.totalCorrect += 1;
    achievements.statistics.categoryCounts[cat].correct += 1;
  }
  achievements.statistics.categoryCounts[cat].attempted += 1;
  if (type === 'mock-test') achievements.statistics.totalMockTestsTaken += 1;
  if (isCorrect) {
    achievements.statistics.currentStreak += 1;
    if (achievements.statistics.currentStreak > achievements.statistics.longestStreak) {
      achievements.statistics.longestStreak = achievements.statistics.currentStreak;
    }
  } else {
    achievements.statistics.currentStreak = 0;
  }
  const badges = [
    { threshold: 100, id: 'first-hundred', name: 'First Hundred', icon: '🎯', category: null },
    { threshold: 500, id: 'five-hundred', name: 'Five Hundred', icon: '⭐', category: null },
    { threshold: 1000, id: 'thousand-master', name: 'Thousand Master', icon: '👑', category: null },
    { threshold: 100, id: 'quantitative-master', name: 'Quantitative Master', icon: '🧮', category: 'quantitative' },
    { threshold: 100, id: 'logical-king', name: 'Logical King', icon: '🧠', category: 'logical' },
    { threshold: 100, id: 'verbal-ace', name: 'Verbal Ace', icon: '📚', category: 'verbal' },
  ];
  for (const badge of badges) {
    if (badge.category) {
      if (achievements.statistics.categoryCounts[badge.category].correct === badge.threshold) {
        const badgeExists = achievements.badges.find(b => b.id === badge.id);
        if (!badgeExists) {
          achievements.badges.push({
            id: badge.id, name: badge.name, description: badge.name,
            icon: badge.icon, earnedAt: new Date(), category: 'aptitude',
          });
        }
      }
    } else if (achievements.statistics.totalCorrect === badge.threshold) {
      const badgeExists = achievements.badges.find(b => b.id === badge.id);
      if (!badgeExists) {
        achievements.badges.push({
          id: badge.id, name: badge.name, description: badge.name,
          icon: badge.icon, earnedAt: new Date(), category: 'general',
        });
      }
    }
  }
  achievements.lastUpdated = new Date();
  await achievements.save();
}

// Helper: update the aptitude section of the per-user leaderboard
async function updateLeaderboardAptitude(userId, correctCount, score) {
  let leaderboard = await Leaderboard.findOne({ userId });
  if (!leaderboard) {
    const ui = await User.findById(userId).select('name email');
    leaderboard = new Leaderboard({
      userId,
      username: ui ? ui.name : 'user-' + String(userId).slice(0, 6),
      email: ui ? ui.email : '',
      rank: 0, totalProblems: 0, acceptanceRate: 0, rankingTier: 'Bronze',
      easyCount: 0, mediumCount: 0, hardCount: 0, currentStreak: 0,
    });
  }
  if (!leaderboard.aptitude) leaderboard.aptitude = { questionsAttempted: 0, questionsCorrect: 0, averageScore: 0, mockTestsCompleted: 0, bestScore: 0, rank: 0 };
  leaderboard.aptitude.questionsAttempted += 1;
  leaderboard.aptitude.questionsCorrect += correctCount;
  leaderboard.aptitude.mockTestsCompleted += 1;
  leaderboard.aptitude.averageScore = (leaderboard.aptitude.averageScore + score) / 2;
  leaderboard.aptitude.bestScore = Math.max(leaderboard.aptitude.bestScore || 0, score);
  leaderboard.lastUpdated = new Date();
  await leaderboard.save();
}


// GET /api/aptitude/mock/:mockTestId/questions
// Returns the mock's meta + its 30 questions (solutions hidden).
router.get('/mock/:mockTestId/questions', async (req, res) => {
  try {
    const { mockTestId } = req.params;
    const mockTest = await AptitudeMockTest.findById(mockTestId).lean();
    if (!mockTest) return res.status(404).json({ error: 'Mock test not found' });
    const questions = await AptitudeQuestion.find({ _id: { $in: mockTest.questionIds } })
      .select('-explanation -solutionSteps -correctAnswer')
      .lean();
    // Shuffle deterministically so options order varies but stays stable per load.
    const mock = { name: mockTest.name, description: mockTest.description, duration: mockTest.duration, totalQuestions: mockTest.totalQuestions, passingScore: mockTest.passingScore, category: mockTest.category };
    res.json({ success: true, mock, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/aptitude/progress
// Personal aptitude analytics: stats + badges (auth required).
router.get('/progress', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const [achievements, agg] = await Promise.all([
      UserAchievements.findOne({ userId }).lean(),
      AptitudeSubmission.aggregate([
        { $match: { userId: new (require('mongoose').Types).ObjectId(userId) } },
        { $group: {
            _id: null,
            totalQuestions: { $sum: '$totalCount' },
            correctQuestions: { $sum: '$correctCount' },
            singleSubmissions: { $sum: { $cond: [{ $eq: ['$type', 'single-question'] }, 1, 0] } },
            mockSubmissions: { $sum: { $cond: [{ $eq: ['$type', 'mock-test'] }, 1, 0] } },
            mockTestsTaken: { $sum: { $cond: [{ $eq: ['$type', 'mock-test'] }, 1, 0] } },
            bestScore: { $max: '$score' },
            avgScore: { $avg: '$score' },
          } },
      ]).exec(),
    ]);
    const a = agg[0] || { totalQuestions: 0, correctQuestions: 0, singleSubmissions: 0, mockSubmissions: 0, mockTestsTaken: 0, bestScore: 0, avgScore: 0 };
    const stats = {
      totalQuestionsAttempted: (achievements && achievements.statistics.totalQuestionsAttempted) || a.totalQuestions,
      totalCorrect: (achievements && achievements.statistics.totalCorrect) || a.correctQuestions,
      accuracy: a.totalQuestions > 0 ? Math.round((a.correctQuestions / a.totalQuestions) * 100) : 0,
      mockTestsTaken: a.mockTestsTaken,
      bestScore: a.bestScore || 0,
      averageScore: a.totalQuestions > 0 ? Math.round(a.avgScore) : 0,
      currentStreak: (achievements && achievements.statistics.currentStreak) || 0,
      longestStreak: (achievements && achievements.statistics.longestStreak) || 0,
      categoryCounts: (achievements && achievements.statistics.categoryCounts) || { quantitative: { attempted: 0, correct: 0 }, logical: { attempted: 0, correct: 0 }, verbal: { attempted: 0, correct: 0 } },
      badges: (achievements && achievements.badges) || [],
    };
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
