const CompanyInfo = require('../models/CompanyInfo');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');

exports.getCompanies = async (req, res) => {
  try {
    const companies = await CompanyInfo.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getCompanyProblems = async (req, res) => {
  try {
    const { company } = req.params;
    const problems = await Problem.find({ companies: company, isActive: true }).select('title slug difficulty tags category');
    res.status(200).json({ success: true, data: problems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getCompanyInfo = async (req, res) => {
  try {
    const { company } = req.params;
    const info = await CompanyInfo.findOne({ slug: company });
    const problems = await Problem.find({ companies: company, isActive: true }).countDocuments();
    const userId = req.user.id;
    const acceptedCount = await Submission.countDocuments({ user: userId, status: 'accepted', 'problem.companies': company });
    res.status(200).json({ success: true, data: { info, problems, progress: problems > 0 ? Math.round((acceptedCount / problems) * 100) : 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};