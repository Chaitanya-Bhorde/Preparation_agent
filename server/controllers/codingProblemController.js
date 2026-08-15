const CodingProblem = require('../models/CodingProblem');
const CodeSubmission = require('../models/CodeSubmission');
const { generateStarterCode } = require('../utils/codeGenerator');

const SUPPORTED_LANGS = ['javascript', 'python', 'java', 'cpp', 'c', 'csharp'];

// Generate starter code from functionSignature (ensures consistency across languages)
function buildStarterCode(pObj) {
  if (!pObj.functionSignature) return;
  const generatedStarter = {};
  for (const lang of SUPPORTED_LANGS) {
    const sig = pObj.functionSignature[lang];
    if (sig) {
      generatedStarter[lang] = generateStarterCode(sig, lang);
    } else if (pObj.starterCode && pObj.starterCode[lang]) {
      generatedStarter[lang] = pObj.starterCode[lang];
    }
  }
  if (Object.keys(generatedStarter).length > 0) {
    pObj.starterCode = generatedStarter;
  }
}

// Map sort parameter to MongoDB sort object
function getSortObject(sortBy) {
  switch (sortBy) {
    case 'difficulty':       return { difficulty: 1 };
    case 'difficulty-desc':  return { difficulty: -1 };
    case 'acceptanceRate':   return { acceptanceRate: -1 };
    case 'acceptanceRate-asc': return { acceptanceRate: 1 };
    case 'attempts':         return { attempts: -1 };
    case 'likes':            return { likes: -1 };
    case 'likes-asc':        return { likes: 1 };
    case 'title':            return { title: 1 };
    case 'title-desc':       return { title: -1 };
    case 'oldest':           return { createdAt: 1 };
    case 'created-asc':      return { createdAt: 1 };
    case 'created-desc':     return { createdAt: -1 };
    default:                 return { createdAt: -1 };
  }
}

// Add user interaction fields (liked/disliked) to a mapped problem response
function withUserFields(pObj, userId) {
  return {
    userLiked: (pObj.likedBy || []).some((uid) => uid.toString() === userId),
    userDisliked: (pObj.dislikedBy || []).some((uid) => uid.toString() === userId),
  };
}

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
  // Remove internal field names from response
  delete pObj.sampleTests;
  delete pObj.hiddenTests;
  // Never expose the likedBy/dislikedBy arrays to clients (privacy)
  delete pObj.likedBy;
  delete pObj.dislikedBy;
  return pObj;
}

// GET /api/coding-problems/stats
// Returns the user's aggregate problem stats: total, solved, attempted, unsolved
exports.getCodingProblemStats = async (req, res) => {
  try {
    const total = await CodingProblem.countDocuments({ isActive: true });

    const submissions = await CodeSubmission.find({
      user: req.user.id,
      category: 'dsa',
    }).select('problem verdict').lean();

    const solved = new Set();
    const attempted = new Set();
    submissions.forEach((sub) => {
      const pid = sub.problem ? sub.problem.toString() : null;
      if (!pid) return;
      if (sub.verdict === 'Accepted') solved.add(pid);
      else attempted.add(pid);
    });

    const solvedCount = solved.size;
    const attemptedOnly = attempted.size - solvedCount; // attempted but not solved

    res.status(200).json({
      success: true,
      data: {
        total,
        solved: solvedCount,
        attempted: attemptedOnly,
        unsolved: total - solvedCount - attemptedOnly,
        acceptanceRate: total > 0 ? Math.round((solvedCount / total) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('getCodingProblemStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/coding-problems/:id/like
// Body: { action: 'like' | 'unlike' | 'dislike' | 'undislike' }
exports.likeCodingProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const userId = req.user.id;

    const problem = await CodingProblem.findById(id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const liked = problem.likedBy || [];
    const disliked = problem.dislikedBy || [];
    const likedIdx = liked.findIndex((uid) => uid.toString() === userId);
    const dislikedIdx = disliked.findIndex((uid) => uid.toString() === userId);

    if (action === 'like') {
      if (likedIdx === -1) {
        liked.push(userId);
        problem.likes = (problem.likes || 0) + 1;
      }
      if (dislikedIdx !== -1) {
        disliked.splice(dislikedIdx, 1);
        problem.dislikes = Math.max(0, (problem.dislikes || 0) - 1);
      }
    } else if (action === 'unlike') {
      if (likedIdx !== -1) {
        liked.splice(likedIdx, 1);
        problem.likes = Math.max(0, (problem.likes || 0) - 1);
      }
    } else if (action === 'dislike') {
      if (dislikedIdx === -1) {
        disliked.push(userId);
        problem.dislikes = (problem.dislikes || 0) + 1;
      }
      if (likedIdx !== -1) {
        liked.splice(likedIdx, 1);
        problem.likes = Math.max(0, (problem.likes || 0) - 1);
      }
    } else if (action === 'undislike') {
      if (dislikedIdx !== -1) {
        disliked.splice(dislikedIdx, 1);
        problem.dislikes = Math.max(0, (problem.dislikes || 0) - 1);
      }
    }

    problem.likedBy = liked;
    problem.dislikedBy = disliked;
    await problem.save();

    res.status(200).json({
      success: true,
      data: {
        likes: problem.likes,
        dislikes: problem.dislikes,
        userLiked: liked.some((uid) => uid.toString() === userId),
        userDisliked: disliked.some((uid) => uid.toString() === userId),
      },
    });
  } catch (error) {
    console.error('likeCodingProblem error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/coding-problems
// Supports filters: difficulty, topic, tags, search, company, status, sort, page, limit
// Returns problems with `userStatus` derived from CodeSubmission + `userLiked`/`userDisliked`.
exports.getCodingProblems = async (req, res) => {
  try {
        const {
      difficulty, topic, tags, search, company,
      status, sort, page = 1, limit = 20,
    } = req.query;
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

    const sortObj = getSortObject(sort);
    const pageSize = parseInt(limit) || 20;
    const curPage = parseInt(page) || 1;

    // --- Status filtering (solved/attempted/unsolved) ---
    // When `status` is set we compute userStatus before pagination, so fetch
    // all matching problems, derive status from submissions, filter, then paginate.
    if (status && status !== 'all') {
      const allMatching = await CodingProblem.find(query)
        .select('-sampleTests -hiddenTests -solution')
        .sort(sortObj);

      const allIds = allMatching.map(p => p._id);
      const submissions = await CodeSubmission.find({
        user: req.user.id,
        problem: { $in: allIds },
      }).select('problem verdict');

      const statusMap = {};
      submissions.forEach((sub) => {
        const pid = sub.problem.toString();
        const current = statusMap[pid];
        if (!current || (sub.verdict === 'Accepted' && current !== 'solved')) {
          statusMap[pid] = sub.verdict === 'Accepted' ? 'solved' : 'attempted';
        }
      });

      const filtered = [];
      for (const p of allMatching) {
        const pObj = typeof p.toObject === 'function' ? p.toObject() : p;
        buildStarterCode(pObj);
        const mapped = mapProblemForResponse(pObj);
        mapped.userStatus = statusMap[p._id.toString()] || 'unsolved';
        withUserFields(mapped, pObj, req.user.id);
        if (mapped.userStatus === status) {
          filtered.push(mapped);
        }
      }

      const total = filtered.length;
      const start = (curPage - 1) * pageSize;
      const data = filtered.slice(start, start + pageSize);

      return res.status(200).json({
        success: true,
        count: data.length,
        total,
        totalPages: Math.ceil(total / pageSize),
        currentPage: curPage,
        data,
      });
    }

    // --- No status filter: efficient paginated query ---
    const total = await CodingProblem.countDocuments(query);
    let problems = await CodingProblem.find(query)
      .select('-sampleTests -hiddenTests -solution')
      .sort(sortObj)
      .skip((curPage - 1) * pageSize)
      .limit(pageSize);

    // Generate starter code from functionSignature if available
    const problemsWithStarter = problems.map(p => {
      const pObj = typeof p.toObject === "function" ? p.toObject() : p;
      buildStarterCode(pObj);
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
        ...withUserFields(p, req.user.id),
      };
    });

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: curPage,
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
    buildStarterCode(problemObj);

    const mapped = mapProblemForResponse(problemObj);
    res.status(200).json({ success: true, data: { ...mapped, userStatus, ...withUserFields(problem, req.user.id) } });
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
