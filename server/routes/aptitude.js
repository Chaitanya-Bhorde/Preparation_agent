const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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

// GET /api/aptitude/questions/:topicId?difficulty=easy|medium|hard
// Returns 50 questions for the requested difficulty (solutions hidden) + counts per difficulty.
router.get('/questions/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { difficulty } = req.query;
    // A non-ObjectId in the path is a malformed request, not a server fault.
    // Without this guard the value reaches Mongoose and throws a CastError,
    // which the catch below turns into a 500 that also echoes the driver message.
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ error: 'Invalid topic id' });
    }
    const validDiff = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : null;
    const query = validDiff ? { topicId, difficulty: validDiff } : { topicId };
    // Hide the answer key and worked solution from unauthenticated callers.
    // `correctAnswer` MUST be excluded here: without it this public endpoint
    // leaks the full answer key (43 topics x 50 questions).
    // `options.isCorrect` must be excluded as well - it is a second encoding of
    // the same key, so excluding `correctAnswer` alone would leave the answer
    // trivially derivable by the client (the UI only ever needs label + text;
    // it reads scoring feedback from POST /submit-answer instead).
    const questions = await AptitudeQuestion.find(query)
      .select('-explanation -solutionSteps -correctAnswer -options.isCorrect')
      .limit(50);

    if (!questions.length) return res.status(404).json({ error: 'No questions found' });
    const counts = {};
    for (const d of ['easy', 'medium', 'hard']) {
      counts[d] = await AptitudeQuestion.countDocuments({ topicId, difficulty: d });
    }
    res.json({ total: questions.length, difficulty: validDiff, counts, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/aptitude/submit-answer  - instant feedback + one persisted practice row per answer
router.post('/submit-answer', protect, async (req, res) => {
  try {
    const { questionId, selectedAnswer, timeTaken } = req.body;
    const question = await AptitudeQuestion.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    const isCorrect = question.correctAnswer === selectedAnswer;
    await AptitudeSubmission.create({
      userId: req.user.id,
      type: 'single-question',
      topicId: question.topicId,
      category: question.category,
      answers: [{ questionId, selectedAnswer, isCorrect, timeTaken: timeTaken || 0 }],
      correctCount: isCorrect ? 1 : 0,
      totalCount: 1,
      startTime: new Date(),
      endTime: new Date(),
    });
    res.status(200).json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      solutionSteps: question.solutionSteps,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/aptitude/mock/generate  - build a fresh random 30-question paper (new options each time)
router.post('/mock/generate', protect, async (req, res) => {
  try {
    const { category } = req.body; // 'full' | 'quantitative-only' | 'logical-only' | 'verbal-only'
    const catMap = {
      'quantitative-only': 'quantitative',
      'logical-only': 'logical',
      'verbal-only': 'verbal',
    };
    const cat = catMap[category] || null;
    const questionFilter = cat ? { category: cat } : {};
    const mix = { easy: 10, medium: 12, hard: 8 };
    const pickedIds = [];
    for (const d of ['easy', 'medium', 'hard']) {
      const pool = await AptitudeQuestion.find({
        ...questionFilter,
        difficulty: d,
        questionText: { $nin: [null, '', 'undefined'] },
        topic: { $exists: true, $nin: [null, '', 'undefined'] },
      }).select('_id').lean();
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      pool.slice(0, mix[d]).forEach(q => pickedIds.push(q._id));
    }
    const questions = await AptitudeQuestion.find({
      _id: { $in: pickedIds },
      questionText: { $nin: [null, '', 'undefined'] },
    }).lean();
    if (!questions.length) return res.status(404).json({ error: 'No questions available for this paper.' });
    // Build a shuffled-option snapshot per question so answers relabel correctly.
    const snapshot = questions.map(q => {
      const labels = ['A', 'B', 'C', 'D'];
      const shuffled = [];
      const opts = q.options.slice();
      while (opts.length) {
        const idx = Math.floor(Math.random() * opts.length);
        shuffled.push(opts.splice(idx, 1)[0]);
      }
      shuffled.forEach((o, i) => { o.label = labels[i]; });
      const correctText = (q.options.find(o => o.label === q.correctAnswer) || q.options.find(o => o.isCorrect) || q.options[0]).text;
      return {
        questionId: q._id,
        questionText: q.questionText,
        difficulty: q.difficulty,
        options: shuffled.map(o => ({ label: o.label, text: o.text })),
        correctAnswer: shuffled.find(o => o.text === correctText).label,
      };
    });
    const mock = new AptitudeMockTest({
      name: cat ? `${cat.charAt(0).toUpperCase() + cat.slice(1)} Mock Test` : 'Full Aptitude Test',
      description: '30-question mixed aptitude test (fresh paper)',
      category: category || 'full',
      questionIds: snapshot.map(s => s.questionId),
      questions: snapshot,
      totalQuestions: snapshot.length,
      duration: 30,
      passingScore: 60,
      difficultyMix: mix,
    });
    await mock.save();
    const publicQuestions = snapshot.map(s => ({
      _id: s.questionId,
      questionText: s.questionText,
      difficulty: s.difficulty,
      options: s.options,
    }));
    res.status(201).json({
      success: true,
      mock: {
        _id: mock._id,
        name: mock.name,
        description: mock.description,
        duration: mock.duration,
        totalQuestions: mock.totalQuestions,
        passingScore: mock.passingScore,
        category: mock.category,
      },
      questions: publicQuestions,
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

// POST /api/aptitude/submit-mock  - submit an entire mock test, calculate score (snapshot-aware)
router.post('/submit-mock', protect, async (req, res) => {
  try {
    const { mockTestId, answers } = req.body; // answers = [{questionId, selectedAnswer, timeTaken}]
    const userId = req.user.id;
    const mockTest = await AptitudeMockTest.findById(mockTestId);
    if (!mockTest) return res.status(404).json({ error: 'Mock test not found' });
    // Generate-made papers carry a shuffled-option snapshot; static seeded ones fall back to DB.
    let questionMap;
    if (mockTest.questions && mockTest.questions.length) {
      questionMap = new Map(mockTest.questions.map(q => [q.questionId.toString(), q]));
    } else {
      const questions = await AptitudeQuestion.find({ _id: { $in: mockTest.questionIds } });
      questionMap = new Map(questions.map(q => [q._id.toString(), q]));
    }
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
    await updateUserAchievements(userId, {
      category: mockTest.category,
      attempted: answers.length,
      correct: correctCount,
      mockTest: true,
    });
    await updateLeaderboardAptitude(userId, answers.length, correctCount, score);
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

// Helper: record real attempt counts + award badges.
// `attempted`/`correct` are QUESTION counts taken from the graded submission,
// never a per-paper proxy. A mixed paper ('full') has no single category, so it
// is deliberately NOT attributed to quantitative/logical/verbal — those buckets
// are filled by /aptitude/progress from the questions' own stored category.
async function updateUserAchievements(userId, { category, attempted = 0, correct = 0, mockTest = false } = {}) {
  let achievements = await UserAchievements.findOne({ userId });
  if (!achievements) achievements = new UserAchievements({ userId });
  const catRaw = String(category || '').replace(/-only$/, '');
  const cat = ['quantitative', 'logical', 'verbal'].includes(catRaw) ? catRaw : null;
  achievements.statistics.totalQuestionsAttempted += attempted;
  achievements.statistics.totalCorrect += correct;
  if (cat) {
    achievements.statistics.categoryCounts[cat].attempted += attempted;
    achievements.statistics.categoryCounts[cat].correct += correct;
  }
  if (mockTest) achievements.statistics.totalMockTestsTaken += 1;

  // Day streak (consecutive calendar days with activity), not a running tally
  // of correct answers. Streaks that have not been touched today or yesterday
  // are no longer current.
  const DAY_MS = 86400000;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last = achievements.lastUpdated ? new Date(achievements.lastUpdated) : null;
  if (last) last.setHours(0, 0, 0, 0);
  const diffDays = last ? Math.round((today - last) / DAY_MS) : null;
  if (diffDays === null || diffDays > 1) achievements.statistics.currentStreak = 1;
  else if (diffDays === 1) achievements.statistics.currentStreak += 1;
  if (achievements.statistics.currentStreak > achievements.statistics.longestStreak) {
    achievements.statistics.longestStreak = achievements.statistics.currentStreak;
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
    // `>=` not `===`: the threshold is a minimum ("earn at 100 correct"), so an
    // exact comparison made every badge unreachable past the very first one.
    if (badge.category) {
      if (achievements.statistics.categoryCounts[badge.category].correct >= badge.threshold) {
        const badgeExists = achievements.badges.find(b => b.id === badge.id);
        if (!badgeExists) {
          achievements.badges.push({
            id: badge.id, name: badge.name, description: badge.name,
            icon: badge.icon, earnedAt: new Date(), category: 'aptitude',
          });
        }
      }
    } else if (achievements.statistics.totalCorrect >= badge.threshold) {
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
async function updateLeaderboardAptitude(userId, attemptedCount, correctCount, score) {
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
  leaderboard.aptitude.questionsAttempted += attemptedCount;
  leaderboard.aptitude.questionsCorrect += correctCount;
  leaderboard.aptitude.mockTestsCompleted += 1;
  leaderboard.aptitude.averageScore = (leaderboard.aptitude.averageScore + score) / 2;
  leaderboard.aptitude.bestScore = Math.max(leaderboard.aptitude.bestScore || 0, score);
  leaderboard.lastUpdated = new Date();
  await leaderboard.save();
}


// GET /api/aptitude/mock/:mockTestId/questions
// Returns the mock's meta + its 30 questions (solutions hidden). Generated papers
// return their saved shuffled-option snapshot so reloading shows the same paper.
router.get('/mock/:mockTestId/questions', async (req, res) => {
  try {
    const { mockTestId } = req.params;
    const mockTest = await AptitudeMockTest.findById(mockTestId).lean();
    if (!mockTest) return res.status(404).json({ error: 'Mock test not found' });
    let questions;
    if (mockTest.questions && mockTest.questions.length) {
      questions = mockTest.questions.map(s => ({
        _id: s.questionId,
        questionText: s.questionText,
        difficulty: s.difficulty,
        // Rebuild each option from label/text only: the stored snapshot carries
        // `isCorrect`, which would re-expose the answer key for generated papers.
        options: (s.options || []).map(o => ({ label: o.label, text: o.text })),
      }));
    } else {
      // Same answer-key projection as GET /questions/:topicId - including
      // options.isCorrect, which would otherwise re-expose the key.
      questions = await AptitudeQuestion.find({ _id: { $in: mockTest.questionIds } })
        .select('-explanation -solutionSteps -correctAnswer -options.isCorrect')
        .lean();
    }
    const mock = { name: mockTest.name, description: mockTest.description, duration: mockTest.duration, totalQuestions: mockTest.totalQuestions, passingScore: mockTest.passingScore, category: mockTest.category };
    res.json({ success: true, mock, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/aptitude/progress
// Personal aptitude analytics: stats + badges (auth required).
// Every number is aggregated from the user's own `aptitudesubmissions` rows.
// Badges are the only field taken from UserAchievements, because that is where
// they are actually awarded.
router.get('/progress', protect, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = req.user.id;
    const oid = new mongoose.Types.ObjectId(userId);
    const [achievements, agg, byCategory, activity] = await Promise.all([
      UserAchievements.findOne({ userId }).lean(),
      AptitudeSubmission.aggregate([
        { $match: { userId: oid } },
        { $group: {
            _id: null,
            totalQuestions: { $sum: '$totalCount' },
            correctQuestions: { $sum: '$correctCount' },
            mockTestsTaken: { $sum: { $cond: [{ $eq: ['$type', 'mock-test'] }, 1, 0] } },
            bestScore: { $max: '$score' },
            avgScore: { $avg: '$score' },
          } },
      ]).exec(),
      // Per-question category breakdown. A submission's own category can be
      // 'full', so the real category lives on the question each answer points at.
      AptitudeSubmission.aggregate([
        { $match: { userId: oid } },
        { $unwind: '$answers' },
        { $lookup: { from: 'aptitudequestions', localField: 'answers.questionId', foreignField: '_id', as: 'q' } },
        { $unwind: '$q' },
        { $match: { 'q.category': { $in: ['quantitative', 'logical', 'verbal'] } } },
        { $group: {
            _id: '$q.category',
            attempted: { $sum: 1 },
            correct: { $sum: { $cond: [{ $eq: ['$answers.isCorrect', true] }, 1, 0] } },
          } },
      ]).exec(),
      AptitudeSubmission.find({ userId: oid }).select('createdAt').lean(),
    ]);
    const a = agg[0] || { totalQuestions: 0, correctQuestions: 0, mockTestsTaken: 0, bestScore: 0, avgScore: 0 };
    const { computeStreaks } = require('../services/analyticsService');
    const streaks = computeStreaks(
      activity.map((d) => d.createdAt).sort((x, y) => new Date(y) - new Date(x))
    );
    const categoryCounts = { quantitative: { attempted: 0, correct: 0 }, logical: { attempted: 0, correct: 0 }, verbal: { attempted: 0, correct: 0 } };
    byCategory.forEach((row) => { categoryCounts[row._id] = { attempted: row.attempted, correct: row.correct }; });
    const stats = {
      totalQuestionsAttempted: a.totalQuestions,
      totalCorrect: a.correctQuestions,
      accuracy: a.totalQuestions > 0 ? Math.round((a.correctQuestions / a.totalQuestions) * 100) : 0,
      mockTestsTaken: a.mockTestsTaken,
      bestScore: a.bestScore || 0,
      averageScore: a.totalQuestions > 0 ? Math.round(a.avgScore) : 0,
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.maxStreak,
      categoryCounts,
      badges: (achievements && achievements.badges) || [],
    };
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
