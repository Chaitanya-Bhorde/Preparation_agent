const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Submission = require('../models/Submission');
const router = express.Router();

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

module.exports = router;