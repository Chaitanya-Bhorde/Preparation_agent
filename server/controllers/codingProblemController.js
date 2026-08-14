const CodingProblem = require('../models/CodingProblem');
const CodeSubmission = require('../models/CodeSubmission');
const { generateStarterCode } = require('../utils/codeGenerator');

// Map new schema fields to legacy API response fields for backward compatibility
function mapProblemForResponse(problem) {
  const pObj = typeof problem.toObject === "function" ? problem.toObject() : problem;
  // Prefer the new schema's sampleTests; fall back to legacy visibleTestCases if present in DB
  const samples = pObj.sampleTests || pObj.visibleTestCases || [];
  const normalize = (tc) => ({
    ...tc,
    expectedOutput: tc.expectedOutput ?? tc.output ?? '',
  });
  // Alias new fields to old names for API compatibility
  pObj.visibleTestCases = samples.map(normalize);
  // Provide `examples` so the frontend description tab can render Input/Output/Explanation
  pObj.examples = samples.map((tc) => ({
    input: tc.input ?? '',
    output: tc.output ?? tc.expectedOutput ?? '',
    explanation: tc.explanation,
    expectedOutput: tc.output ?? tc.expectedOutput ?? '',
  }));
  pObj.hiddenTestCases = pObj.hiddenTests || pObj.hiddenTestCases || [];
  // Remove new field names from response to avoid confusion
  delete pObj.sampleTests;
  delete pObj.hiddenTests;
  return pObj;
}

// GET /api/coding-problems
// Supports filters: difficulty, topic, tags, search, company, page, limit
// Returns problems with `userStatus` derived from CodeSubmission.
exports.getCodingProblems = async (req, res) => {
  try {
    const { difficulty, topic, tags, search, company, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (difficulty) query.difficulty = difficulty;
    if (topic) query.topic = topic;
    if (tags) query.tags = { $in: tags.split(',') };
    if (company) query.companies = company;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await CodingProblem.countDocuments(query);
    let problems = await CodingProblem.find(query)
      .select('-sampleTests -hiddenTests -solution')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Generate starter code from functionSignature if available
    const problemsWithStarter = problems.map(p => {
      const pObj = typeof p.toObject === "function" ? p.toObject() : p;
      if (pObj.functionSignature) {
        const generatedStarter = {};
        const hasStarter = pObj.starterCode && Object.values(pObj.starterCode).some(v => v);
        
        if (!hasStarter) {
          // Generate all from signature
          for (const lang of ['javascript', 'python', 'java', 'cpp', 'c', 'csharp']) {
            const sig = pObj.functionSignature[lang];
            if (sig) {
              generatedStarter[lang] = generateStarterCode(sig, lang);
            }
          }
          if (Object.keys(generatedStarter).length > 0) {
            pObj.starterCode = generatedStarter;
          }
        } else {
          // Regenerate from signature to ensure consistency
          for (const lang of ['javascript', 'python', 'java', 'cpp', 'c', 'csharp']) {
            const sig = pObj.functionSignature[lang];
            if (sig) {
              generatedStarter[lang] = generateStarterCode(sig, lang);
            } else if (pObj.starterCode[lang]) {
              generatedStarter[lang] = pObj.starterCode[lang];
            }
          }
          pObj.starterCode = generatedStarter;
        }
      }
      return pObj;
    });

    const pageIds = problems.map((p) => p._id);
    const pageSubmissions = await CodeSubmission.find({
      user: req.user.id,
      problem: { $in: pageIds },
    }).select('problem verdict');

    const problemStatusMap = {};
    pageSubmissions.forEach((sub) => {
      const pid = sub.problem.toString();
      const current = problemStatusMap[pid];
      if (!current || (sub.verdict === 'Accepted' && current !== 'solved')) {
        problemStatusMap[pid] = sub.verdict === 'Accepted' ? 'solved' : 'attempted';
      }
    });

    const data = problemsWithStarter.map((p) => {
      const mapped = mapProblemForResponse(p);
      return {
        ...mapped,
        userStatus: problemStatusMap[p._id.toString()] || 'unsolved',
      };
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

// GET /api/coding-problems/:slug
// Returns single problem with `userStatus`.
exports.getCodingProblem = async (req, res) => {
  try {
    const problem = await CodingProblem.findOne({ slug: req.params.slug, isActive: true });
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const solved = await CodeSubmission.findOne({
      user: req.user.id,
      problem: problem._id,
      verdict: 'Accepted',
    }).select('verdict');
    let userStatus = 'unsolved';
    if (solved) {
      userStatus = 'solved';
    } else {
      const attempted = await CodeSubmission.findOne({
        user: req.user.id,
        problem: problem._id,
      }).select('verdict');
      if (attempted) userStatus = 'attempted';
    }

    // Generate starter code from functionSignature if available
    const problemObj = typeof problem.toObject === "function" ? problem.toObject() : problem;
    if (problemObj.functionSignature) {
      const generatedStarter = {};
      const hasStarter = problemObj.starterCode && Object.values(problemObj.starterCode).some(v => v);
      
      if (!hasStarter) {
        // Generate all from signature
        for (const lang of ['javascript', 'python', 'java', 'cpp', 'c', 'csharp']) {
          const sig = problemObj.functionSignature[lang];
          if (sig) {
            generatedStarter[lang] = generateStarterCode(sig, lang);
          }
        }
        if (Object.keys(generatedStarter).length > 0) {
          problemObj.starterCode = generatedStarter;
        }
      } else {
        // Regenerate from signature to ensure consistency
        for (const lang of ['javascript', 'python', 'java', 'cpp', 'c', 'csharp']) {
          const sig = problemObj.functionSignature[lang];
          if (sig) {
            generatedStarter[lang] = generateStarterCode(sig, lang);
          } else if (problemObj.starterCode[lang]) {
            generatedStarter[lang] = problemObj.starterCode[lang];
          }
        }
        problemObj.starterCode = generatedStarter;
      }
    }

    const mapped = mapProblemForResponse(problemObj);
    res.status(200).json({ success: true, data: { ...mapped, userStatus } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCodingCompanies = async (req, res) => {
  try {
    const companies = await CodingProblem.distinct('companies');
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCodingTags = async (req, res) => {
  try {
    const tags = await CodingProblem.distinct('tags');
    res.status(200).json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCodingTopics = async (req, res) => {
  try {
    const topics = await CodingProblem.distinct('topic');
    res.status(200).json({ success: true, data: topics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
