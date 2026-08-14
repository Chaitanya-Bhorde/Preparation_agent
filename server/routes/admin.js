const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Submission = require('../models/Submission');
const CodingProblem = require('../models/CodingProblem');
const router = express.Router();

/** Human-readable unique problemId derived from a title (mirrors slug logic). */
const slugify = (s) => String(s || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/** Normalize a request body into a CodingProblem payload (shared by POST/PUT). */
const pick = (obj, keys) => {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
};

router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('name email role stats profile.college profile.atsScore createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const totalSubmissions = await Submission.countDocuments({ user: req.params.id });
    const acceptedSubmissions = await Submission.countDocuments({ user: req.params.id, status: 'accepted' });
    const recentSubmissions = await Submission.find({ user: req.params.id })
      .populate('problem', 'title slug difficulty tags')
      .sort({ createdAt: -1 })
      .limit(10);
    res.status(200).json({
      success: true,
      data: {
        user,
        stats: {
          totalSubmissions,
          acceptedSubmissions,
          acceptanceRate: totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
        },
        recentSubmissions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/users/:id/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await Submission.deleteMany({ user: req.params.id });
    res.status(200).json({ success: true, message: 'User and associated submissions deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===========================================================================
// Admin CRUD for CodingProblems (Phase 4.1)
// Metadata-driven: a problem created here works in /api/coding/submit with NO
// per-problem validator code, as long as `inputFormat`/`outputFormat` describe
// the function and sample/hidden tests carry inputs + expected outputs.
// ===========================================================================

// POST /api/admin/coding-problems  -> create
router.post('/coding-problems', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, description, difficulty, topic, tags, companies, inputFormat, outputFormat, sampleTests, hiddenTests, functionSignature, starterCode, referenceSolution, timeLimitMs, memoryLimitKb } = req.body;

    if (!title || !description || !difficulty || !topic) {
      return res.status(400).json({ success: false, message: 'title, description, difficulty and topic are required' });
    }
    if (!Array.isArray(inputFormat) || inputFormat.length === 0) {
      return res.status(400).json({ success: false, message: 'inputFormat is required to drive the metadata-driven validator' });
    }

    const sig = functionSignature && functionSignature.javascript;
    const slug = slugify(title);
    const problem = await CodingProblem.create({
      problemId: slug,
      title,
      slug,
      description,
      difficulty,
      topic,
      tags: Array.isArray(tags) ? tags : [],
      companies: Array.isArray(companies) ? companies : [],
      inputFormat,
      outputFormat: outputFormat || { type: (sig && sig.returnType) || 'integer', description: 'Expected output of the function' },
      sampleTests: Array.isArray(sampleTests) ? sampleTests : [],
      hiddenTests: Array.isArray(hiddenTests) ? hiddenTests : [],
      functionSignature: functionSignature || { javascript: { name: (sig && sig.name) || 'solve', params: (sig && sig.params) || [], returnType: (sig && sig.returnType) || 'integer' } },
      starterCode: starterCode || {},
      referenceSolution: referenceSolution || { code: '', language: 'javascript' },
      timeLimitMs: timeLimitMs || 2000,
      memoryLimitKb: memoryLimitKb || 256000,
      isActive: true,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: problem });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A problem with this title/problemId already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/coding-problems/:id  -> update
router.put('/coding-problems/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const fields = pick(req.body, ['title', 'description', 'difficulty', 'topic', 'tags', 'companies', 'inputFormat', 'outputFormat', 'sampleTests', 'hiddenTests', 'functionSignature', 'starterCode', 'referenceSolution', 'timeLimitMs', 'memoryLimitKb', 'isActive']);
    if (fields.title) fields.slug = slugify(fields.title);

    const problem = await CodingProblem.findByIdAndUpdate(req.params.id, fields, { new: true, runValidators: true });
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });
    res.status(200).json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/coding-problems  -> list (metadata only, no test content)
router.get('/coding-problems', protect, authorize('admin'), async (req, res) => {
  try {
    const problems = await CodingProblem.find()
      .select('-sampleTests -hiddenTests -referenceSolution')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: problems.length, data: problems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/coding-problems/:id  -> get one (full doc for editing)
router.get('/coding-problems/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const problem = await CodingProblem.findById(req.params.id);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });
    res.status(200).json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;