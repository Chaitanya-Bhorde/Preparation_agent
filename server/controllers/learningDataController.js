const Submission = require('../models/Submission');
const CodeSubmission = require('../models/CodeSubmission');
const SQLSubmission = require('../models/SQLSubmission');
const AptitudeSubmission = require('../models/AptitudeSubmission');
const CoreSubjectSubmission = require('../models/CoreSubjectSubmission');
const InterviewSession = require('../models/InterviewSession');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewAnswer = require('../models/InterviewAnswer');
const PracticeHistory = require('../models/PracticeHistory');
const UserStats = require('../models/UserStats');
const UserAchievements = require('../models/UserAchievements');
const Mistake = require('../models/Mistake');
const Draft = require('../models/Draft');
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');

/**
 * DELETE /api/learning-data  (protected)
 *
 * Full learning-data reset for the authenticated user only.
 *
 * Deletes every practice/interview record belonging to `req.user` across the
 * dual-collection submission architecture (Submission + CodeSubmission), plus
 * aptitude, SQL, core-subject, interview, practice-history, stats, mistake,
 * draft and leaderboard rows. Question banks, problems, system data and the
 * User document itself (identity: name/email/password/role) are preserved.
 *
 * Deterministic only — no LLM or ML-service calls are made, so a provider
 * outage (429/404) can never block or fail a reset.
 *
 * Safety: requires an explicit `confirm: 'RESET'` in the request body so an
 * accidental DELETE cannot wipe data.
 */
async function resetLearningData(req, res) {
  try {
    if (req.body?.confirm !== 'RESET') {
      return res.status(400).json({
        success: false,
        message: "Confirmation required: send { confirm: 'RESET' } to wipe learning data.",
      });
    }

    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const deleted = {};

    // Interview data is keyed by session: answers/questions only carry a
    // session ref, so cascade from the user's sessions first.
    const sessionIds = (await InterviewSession.find({ user: userId }).select('_id')).map((d) => d._id);
    if (sessionIds.length > 0) {
      deleted.interviewQuestions = (await InterviewQuestion.deleteMany({ session: { $in: sessionIds } })).deletedCount;
      deleted.interviewAnswers = (await InterviewAnswer.deleteMany({ session: { $in: sessionIds } })).deletedCount;
    } else {
      deleted.interviewQuestions = 0;
      deleted.interviewAnswers = 0;
    }
    deleted.interviewSessions = (await InterviewSession.deleteMany({ user: userId })).deletedCount;

    deleted.submissions = (await Submission.deleteMany({ user: userId })).deletedCount;
    deleted.codeSubmissions = (await CodeSubmission.deleteMany({ user: userId })).deletedCount;
    deleted.sqlSubmissions = (await SQLSubmission.deleteMany({ user: userId })).deletedCount;

    deleted.aptitudeSubmissions = (await AptitudeSubmission.deleteMany({ userId })).deletedCount;
    deleted.coreSubjectSubmissions = (await CoreSubjectSubmission.deleteMany({ userId })).deletedCount;

    deleted.practiceHistory = (await PracticeHistory.deleteMany({ userId })).deletedCount;
    deleted.userStats = (await UserStats.deleteMany({ userId })).deletedCount;
    // UserAchievements mirrors aptitude performance (badges, attempted/correct
    // counts, mock-test counts, streaks) — leaving it behind would show stale
    // performance after a reset, so it is user learning data too.
    deleted.userAchievements = (await UserAchievements.deleteMany({ userId })).deletedCount;
    deleted.mistakes = (await Mistake.deleteMany({ user: userId })).deletedCount;
    deleted.drafts = (await Draft.deleteMany({ user: userId })).deletedCount;
    deleted.leaderboardRows = (await Leaderboard.deleteMany({ userId })).deletedCount;

    // The User document survives (identity preserved), but its derived
    // learning counters must read zero afterwards. Goals (dailyGoal/weeklyGoal),
    // profile and credentials stay untouched. weakTopics/revisionQueue are
    // derived from past submissions, so they are cleared too.
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'stats.totalSolved': 0,
          'stats.easySolved': 0,
          'stats.mediumSolved': 0,
          'stats.hardSolved': 0,
          'stats.totalSubmissions': 0,
          'stats.streak': 0,
          'stats.lastActiveDate': null,
          weakTopics: [],
          revisionQueue: [],
        },
      },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const totalDeleted = Object.values(deleted).reduce((sum, n) => sum + n, 0);
    return res.json({
      success: true,
      message: 'Learning data reset. Your account and question banks are untouched.',
      data: { deleted, totalDeleted },
    });
  } catch (error) {
    // Never partially mask a failure: report it, keep the account usable.
    console.error('[learningData] reset failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Learning data reset failed. No changes were confirmed; please retry.',
    });
  }
}

module.exports = { resetLearningData };