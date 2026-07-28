const Submission = require('../models/Submission');
const CodeSubmission = require('../models/CodeSubmission');
const SQLSubmission = require('../models/SQLSubmission');
const User = require('../models/User');
const Problem = require('../models/Problem');
const ConceptNote = require('../models/ConceptNote');
const CodingProblem = require('../models/CodingProblem');
const SQLProblem = require('../models/SQLProblem');

exports.getTopicProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[TOPIC_PROGRESS] ===== START for user:', userId, '=====');

    // Fetch all submissions for this user from multiple collections
    const regularSubmissions = await Submission.find({ user: userId, type: 'submit' }).populate('problem', 'tags difficulty category').lean();
    const codeSubmissions = await CodeSubmission.find({ user: userId }).populate('problem', 'tags difficulty').lean();
    const sqlSubmissions = await SQLSubmission.find({ user: userId }).populate('problem', 'tags difficulty').lean();
    
    console.log('[TOPIC_PROGRESS] Regular submissions:', regularSubmissions.length);
    console.log('[TOPIC_PROGRESS] Code submissions:', codeSubmissions.length);
    console.log('[TOPIC_PROGRESS] SQL submissions:', sqlSubmissions.length);

    // Track distinct problems per tag to avoid counting re-submissions
    const tagMap = {};
    const problemTagMap = {};

    // Helper to process a submission
    const processSubmission = (sub, defaultCategory = 'DSA') => {
      let tags = sub.problem?.tags;
      let difficulty = sub.problem?.difficulty;
      let category = sub.problem?.category || defaultCategory;
      let pid = sub.problem?._id?.toString();
      let title = sub.problem?.title;

      if (!tags || tags.length === 0) {
        tags = sub.problemTags;
        difficulty = sub.problemDifficulty;
        category = defaultCategory;
        pid = sub.problem?.toString() || `embedded-${sub._id}`;
        title = '(embedded)';
        console.log('[TOPIC_PROGRESS] Using embedded fallback for submission:', sub._id);
      }

      if (!tags || tags.length === 0) {
        console.log('[TOPIC_PROGRESS] Skipping submission with no tags (no fallback):', sub._id);
        return;
      }

      if (!problemTagMap[pid]) {
        problemTagMap[pid] = {
          title,
          tags,
          difficulty,
          category,
          hasAccepted: false
        };
      }
      const isAccepted = sub.verdict === 'Accepted' || sub.status === 'accepted';
      if (isAccepted) {
        problemTagMap[pid].hasAccepted = true;
      }

      tags.forEach((tag) => {
        if (!tagMap[tag]) {
          tagMap[tag] = {
            distinctProblems: new Set(),
            acceptedProblems: new Set(),
            easy: 0,
            medium: 0,
            hard: 0,
          };
        }
        tagMap[tag].distinctProblems.add(pid);
        if (isAccepted) {
          if (!tagMap[tag].acceptedProblems.has(pid)) {
            tagMap[tag].acceptedProblems.add(pid);
            const diff = difficulty || 'easy';
            if (diff === 'easy') tagMap[tag].easy++;
            else if (diff === 'medium') tagMap[tag].medium++;
            else if (diff === 'hard') tagMap[tag].hard++;
          }
        }
      });
    };

    regularSubmissions.forEach((sub) => processSubmission(sub, 'DSA'));
    codeSubmissions.forEach((sub) => processSubmission(sub, 'DSA'));
    sqlSubmissions.forEach((sub) => processSubmission(sub, 'SQL'));

    // Get all distinct tags from problems across all collections
    const allProblems = await Problem.find({ isActive: true }).select('tags category');
    const allCodingProblems = await CodingProblem.find({ isActive: true }).select('tags');
    const allSQLProblems = await SQLProblem.find({ isActive: true }).select('tags');
    
    console.log('[TOPIC_PROGRESS] All active problems count:', allProblems.length);
    console.log('[TOPIC_PROGRESS] All active coding problems count:', allCodingProblems.length);
    console.log('[TOPIC_PROGRESS] All active SQL problems count:', allSQLProblems.length);

    const tagCategoryMap = {};
    const tagTotalProblems = {};

    allProblems.forEach((p) => {
      (p.tags || []).forEach((tag) => {
        if (!tagTotalProblems[tag]) tagTotalProblems[tag] = new Set();
        tagTotalProblems[tag].add(p._id.toString());
        if (p.category === 'SQL') {
          tagCategoryMap[tag] = 'SQL';
        } else if (!tagCategoryMap[tag]) {
          tagCategoryMap[tag] = 'DSA';
        }
      });
    });

    allCodingProblems.forEach((p) => {
      (p.tags || []).forEach((tag) => {
        if (!tagTotalProblems[tag]) tagTotalProblems[tag] = new Set();
        tagTotalProblems[tag].add(p._id.toString());
        if (!tagCategoryMap[tag]) {
          tagCategoryMap[tag] = 'DSA';
        }
      });
    });

    allSQLProblems.forEach((p) => {
      (p.tags || []).forEach((tag) => {
        if (!tagTotalProblems[tag]) tagTotalProblems[tag] = new Set();
        tagTotalProblems[tag].add(p._id.toString());
        tagCategoryMap[tag] = 'SQL';
      });
    });

    const topicList = Array.from(new Set([
      ...(await Problem.distinct('tags')),
      ...(await CodingProblem.distinct('tags')),
      ...(await SQLProblem.distinct('tags'))
    ]));
    console.log('[TOPIC_PROGRESS] All distinct tags in DB:', topicList);

    const conceptNotes = await ConceptNote.find({}).sort({ topic: 1 });
    const noteMap = {};
    conceptNotes.forEach((note) => { noteMap[note.topic] = note; });

    const dsaTopics = [];
    const sqlTopics = [];

    topicList.forEach((topic) => {
      const data = tagMap[topic];
      const totalDistinct = data ? data.distinctProblems.size : 0;
      const acceptedDistinct = data ? data.acceptedProblems.size : 0;
      const totalProblemsInDB = tagTotalProblems[topic] ? tagTotalProblems[topic].size : 0;
      const accuracy = totalDistinct > 0 ? Math.round((acceptedDistinct / totalDistinct) * 100) : 0;
      const category = tagCategoryMap[topic] || 'DSA';

      console.log('[TOPIC_PROGRESS] Topic:', topic,
        '| totalDistinct:', totalDistinct,
        '| acceptedDistinct:', acceptedDistinct,
        '| totalProblemsInDB:', totalProblemsInDB,
        '| accuracy:', accuracy,
        '| category:', category);

      const topicData = {
        topic,
        total: totalDistinct,
        accepted: acceptedDistinct,
        totalProblems: totalProblemsInDB,
        easy: data ? data.easy : 0,
        medium: data ? data.medium : 0,
        hard: data ? data.hard : 0,
        accuracy,
        hasNote: !!noteMap[topic],
        category,
      };

      if (category === 'SQL') {
        sqlTopics.push(topicData);
      } else {
        dsaTopics.push(topicData);
      }
    });

    dsaTopics.sort((a, b) => a.topic.localeCompare(b.topic));
    sqlTopics.sort((a, b) => a.topic.localeCompare(b.topic));

    const allTopics = [...dsaTopics, ...sqlTopics];
    const totalAccuracy = allTopics.length > 0
      ? Math.round(allTopics.reduce((a, b) => a + b.accuracy, 0) / allTopics.length)
      : 0;

    console.log('[TOPIC_PROGRESS] ===== END for user:', userId, '=====');

    res.status(200).json({
      success: true,
      data: {
        topics: allTopics,
        dsaTopics,
        sqlTopics,
        totalAccuracy,
        totalTopics: allTopics.length,
        conceptNotes: noteMap,
      },
    });
  } catch (error) {
    console.error('[TOPIC_PROGRESS] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTopicDetails = async (req, res) => {
  try {
    const { topic } = req.params;
    const problems = await Problem.find({ tags: topic, isActive: true }).select('title slug difficulty tags');
    const note = await ConceptNote.findOne({ topic });
    res.status(200).json({ success: true, data: { topic, problems, note } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getConceptNotes = async (req, res) => {
  try {
    const notes = await ConceptNote.find({}).sort({ topic: 1 });
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};