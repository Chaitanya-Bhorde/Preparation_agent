const Submission = require('../models/Submission');
const User = require('../models/User');
const Problem = require('../models/Problem');
const ConceptNote = require('../models/ConceptNote');

exports.getTopicProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[TOPIC_PROGRESS] ===== START for user:', userId, '=====');

    // Fetch all submissions for this user (only 'submit' type), populated with problem data
    const allSubmissions = await Submission.find({ user: userId, type: 'submit' }).populate('problem', 'tags difficulty category');
    console.log('[TOPIC_PROGRESS] Total submissions found:', allSubmissions.length);

    // Track distinct problems per tag to avoid counting re-submissions
    // tagMap[tag] = { distinctProblemIds: Set, acceptedProblemIds: Set, easy: count, medium: count, hard: count }
    const tagMap = {};
    // Also track per-problem to know which tags each problem contributes to
    const problemTagMap = {};

    allSubmissions.forEach((sub) => {
      // FALLBACK: If populate failed (problem deleted/invalid), use embedded problemTags and problemDifficulty
      let tags = sub.problem?.tags;
      let difficulty = sub.problem?.difficulty;
      let category = sub.problem?.category || 'DSA';
      let pid = sub.problem?._id?.toString();
      let title = sub.problem?.title;

      if (!tags || tags.length === 0) {
        // Fall back to embedded submission fields
        tags = sub.problemTags;
        difficulty = sub.problemDifficulty;
        category = 'DSA'; // default for embedded fallback
        pid = sub.problem?.toString() || `embedded-${sub._id}`;
        title = '(embedded)';
        console.log('[TOPIC_PROGRESS] Using embedded fallback for submission:', sub._id);
      }

      if (!tags || tags.length === 0) {
        console.log('[TOPIC_PROGRESS] Skipping submission with no tags (no fallback):', sub._id);
        return;
      }

      // Initialize problemTagMap entry for this problem
      if (!problemTagMap[pid]) {
        problemTagMap[pid] = {
          title,
          tags,
          difficulty,
          category,
          hasAccepted: false
        };
      }
      if (sub.status === 'accepted') {
        problemTagMap[pid].hasAccepted = true;
      }

      // Initialize tag entries
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
        // Track distinct problem IDs for this tag
        tagMap[tag].distinctProblems.add(pid);
        // Track accepted problems directly (same pattern as analyticsController)
        if (sub.status === 'accepted') {
          tagMap[tag].acceptedProblems.add(pid);
        }
      });
    });

    // Get all distinct tags from problems, along with their categories
    const allProblems = await Problem.find({ isActive: true }).select('tags category');
    console.log('[TOPIC_PROGRESS] All active problems count:', allProblems.length);

    const tagCategoryMap = {};
    const tagTotalProblems = {};
    allProblems.forEach((p) => {
      (p.tags || []).forEach((tag) => {
        if (!tagTotalProblems[tag]) tagTotalProblems[tag] = new Set();
        tagTotalProblems[tag].add(p._id.toString());
        // Determine category: if any problem with this tag is SQL, mark as SQL
        if (p.category === 'SQL') {
          tagCategoryMap[tag] = 'SQL';
        } else if (!tagCategoryMap[tag]) {
          tagCategoryMap[tag] = 'DSA';
        }
      });
    });

    const topicList = await Problem.distinct('tags');
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

    // Sort both arrays alphabetically
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
