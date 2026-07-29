const AptitudeQuestion = require('../models/AptitudeQuestion');
const AptitudeSubmission = require('../models/AptitudeSubmission');
const AptitudeResult = require('../models/AptitudeResult');
const Submission = require('../models/Submission');
const { updateStreak } = require('../utils/streak');

exports.getQuestions = async (req, res) => {
  try {
    const { category, difficulty, tags, topic, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) query.question = { $regex: search, $options: 'i' };

    const total = await AptitudeQuestion.countDocuments(query);
    const questions = await AptitudeQuestion.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const data = questions.map((q) => {
      const obj = q.toObject();
      return obj;
    });

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

exports.submitAnswer = async (req, res) => {
  try {
    const { questionId } = req.body;
    const { selectedIndex } = req.body;
    const question = await AptitudeQuestion.findById(questionId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const correct = question.correctIndex === Number(selectedIndex);
    const submission = await AptitudeSubmission.create({
      user: req.user.id,
      question: question._id,
      selectedIndex: Number(selectedIndex),
      correct,
      category: question.category,
      difficulty: question.difficulty,
      tags: question.tags,
    });

    const existing = await AptitudeResult.findOne({
      user: req.user.id,
      testType: 'aptitude_practice',
    });
    if (existing) {
      const inc = { totalQuestions: 1 };
      if (correct) inc.correctAnswers = 1;
      const newScore = existing.totalQuestions > 0
        ? Math.round(((existing.correctAnswers + (correct ? 1 : 0)) / (existing.totalQuestions + 1)) * 100)
        : (correct ? 100 : 0);
      await AptitudeResult.findByIdAndUpdate(existing._id, {
        $inc: inc,
        $set: { score: newScore },
      });
    } else {
      await AptitudeResult.create({
        user: req.user.id,
        score: correct ? 100 : 0,
        testType: 'aptitude_practice',
        totalQuestions: 1,
        correctAnswers: correct ? 1 : 0,
        category: 'aptitude',
      });
    }

    // Dual-write to unified Submission model for analytics
    try {
      await Submission.create({
        user: req.user.id,
        problem: question._id,
        code: JSON.stringify({ selectedIndex: Number(selectedIndex) }),
        language: 'javascript',
        status: correct ? 'accepted' : 'wrong_answer',
        type: 'submit',
        passedTestCases: correct ? 1 : 0,
        totalTestCases: 1,
        problemDifficulty: question.difficulty,
        problemTags: question.tags,
        category: 'aptitude',
        score: correct ? 100 : 0,
      });
    } catch (dualWriteErr) {
      console.error('Aptitude dual-write to Submission failed:', dualWriteErr.message);
    }

    if (correct) {
      updateStreak(req.user.id).catch(err => console.error('Streak update failed:', err.message));
    }

    res.status(201).json({
      success: true,
      data: {
        ...submission.toObject(),
        correct,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = ['quant', 'verbal', 'logical'];
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};