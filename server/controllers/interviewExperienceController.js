const InterviewExperience = require('../models/InterviewExperience');
const CompanyInfo = require('../models/CompanyInfo');

// @desc    Create interview experience
// @route   POST /api/interview-experiences
exports.createExperience = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const experience = await InterviewExperience.create(req.body);
    
    // Update company info with interview questions if company exists
    if (req.body.company && req.body.questions?.length > 0) {
      const company = await CompanyInfo.findOne({ 
        name: { $regex: new RegExp(`^${req.body.company}$`, 'i') } 
      });
      if (company) {
        const newQuestions = req.body.questions.filter(q => 
          !company.interviewQuestions.some(existing => 
            existing.question.toLowerCase() === q.question.toLowerCase()
          )
        );
        if (newQuestions.length > 0) {
          company.interviewQuestions.push(...newQuestions.map(q => ({
            question: q.question,
            category: 'Technical',
            difficulty: req.body.difficulty || 'Medium',
            hint: q.answer?.substring(0, 100) || '',
            expectedAnswer: q.answer || '',
          })));
          await company.save();
        }
      }
    }

    res.status(201).json({ success: true, data: experience });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all interview experiences
// @route   GET /api/interview-experiences
exports.getExperiences = async (req, res) => {
  try {
    const { company, role, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };
    if (company) query.company = { $regex: new RegExp(company, 'i') };
    if (role) query.role = { $regex: new RegExp(role, 'i') };

    const total = await InterviewExperience.countDocuments(query);
    const experiences = await InterviewExperience.find(query)
      .populate('user', 'name profile.college profile.year')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: experiences,
      total,
      totalPages: Math.ceil(total / limit),
      page: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single interview experience
// @route   GET /api/interview-experiences/:id
exports.getExperience = async (req, res) => {
  try {
    const experience = await InterviewExperience.findById(req.params.id)
      .populate('user', 'name profile.college profile.year');
    if (!experience) {
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }
    res.status(200).json({ success: true, data: experience });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update interview experience
// @route   PUT /api/interview-experiences/:id
exports.updateExperience = async (req, res) => {
  try {
    let experience = await InterviewExperience.findById(req.params.id);
    if (!experience) {
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }
    if (experience.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    experience = await InterviewExperience.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: experience });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete interview experience
// @route   DELETE /api/interview-experiences/:id
exports.deleteExperience = async (req, res) => {
  try {
    const experience = await InterviewExperience.findById(req.params.id);
    if (!experience) {
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }
    if (experience.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await experience.deleteOne();
    res.status(200).json({ success: true, message: 'Experience deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Vote on interview experience
// @route   POST /api/interview-experiences/:id/vote
exports.voteExperience = async (req, res) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const experience = await InterviewExperience.findById(req.params.id);
    if (!experience) {
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }

    const userId = req.user.id;
    const hasUpvoted = experience.upvotes.includes(userId);
    const hasDownvoted = experience.downvotes.includes(userId);

    if (voteType === 'upvote') {
      if (hasUpvoted) {
        experience.upvotes.pull(userId);
      } else {
        experience.upvotes.push(userId);
        if (hasDownvoted) experience.downvotes.pull(userId);
      }
    } else if (voteType === 'downvote') {
      if (hasDownvoted) {
        experience.downvotes.pull(userId);
      } else {
        experience.downvotes.push(userId);
        if (hasUpvoted) experience.upvotes.pull(userId);
      }
    }

    await experience.save();
    res.status(200).json({
      success: true,
      data: {
        upvotes: experience.upvotes.length,
        downvotes: experience.downvotes.length,
        userVote: hasUpvoted ? null : hasDownvoted ? null : voteType,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my interview experiences
// @route   GET /api/interview-experiences/my
exports.getMyExperiences = async (req, res) => {
  try {
    const experiences = await InterviewExperience.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: experiences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};