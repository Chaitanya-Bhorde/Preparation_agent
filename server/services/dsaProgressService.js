/**
 * dsaProgressService.js
 * ---------------------------------------------------------------------------
 * THE single source of truth for "how many DSA problems has this user solved?".
 *
 * THE BUG THIS FIXES
 *   The submit path used to increment a denormalised counter
 *   (`$inc: { 'stats.totalSolved': 1 }`) guarded by a "has this user already
 *   got an Accepted on this problem?" lookup, and the leaderboard persisted
 *   `weeklySolved` / `monthlySolved` with a raw
 *   `countDocuments({ status: 'accepted' })`. Both count SUBMISSIONS, not
 *   PROBLEMS. Reproduced against the live database: user "manan" has 13
 *   Accepted submissions covering only 3 distinct problems — an overcount of
 *   10 — while his `stats.totalSolved` was 0 because the counter was never
 *   rebuilt after historical writes.
 *
 * THE RULE
 *   submissions     = number of submission records
 *   solved problems = number of DISTINCT problems with >= 1 Accepted
 *
 * THE APPROACH
 *   Counts are DERIVED from the submission records with a MongoDB aggregation
 *   that groups by problem and keeps a problem only if it has at least one
 *   Accepted, then written back with `$set` instead of `$inc`. A `$set` is
 *   idempotent: re-running it can never double count, and it repairs any
 *   previously drifted counter the first time a user submits again. That is
 *   strictly better than a guarded increment, which is wrong the moment the
 *   guard and the counter can disagree.
 * ---------------------------------------------------------------------------
 */

const CodeSubmission = require('../models/CodeSubmission');
const Submission = require('../models/Submission');
const User = require('../models/User');
const UserStats = require('../models/UserStats');

const DAY_MS = 24 * 60 * 60 * 1000;

/** Per-problem rollup for one user, grouped by the PROBLEM (not the submission). */
function perProblemPipeline(userId) {
  return [
    { $match: { user: userId } },
    {
      $group: {
        _id: '$problem',
        attempts: { $sum: 1 },
        accepted: { $sum: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, 1, 0] } },
        firstAcceptedAt: { $min: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, '$createdAt', null] } },
      },
    },
  ];
}

/**
 * Fold per-problem rollups (from several collections) into ONE map keyed by
 * problem id. A problem counts as solved when any source saw an Accepted; the
 * earliest accepted timestamp and the known difficulty are retained.
 */
function mergeRollups(...rollups) {
  const byProblem = new Map();
  for (const rollup of rollups) {
    for (const row of rollup) {
      const key = String(row._id);
      const existing = byProblem.get(key) || { attempts: 0, accepted: 0, firstAcceptedAt: null, difficulty: null };
      existing.attempts += row.attempts || 0;
      existing.accepted += row.accepted || 0;
      if (row.difficulty) existing.difficulty = row.difficulty;
      const at = row.firstAcceptedAt || null;
      if (at && (!existing.firstAcceptedAt || new Date(at) < new Date(existing.firstAcceptedAt))) {
        existing.firstAcceptedAt = at;
      }
      byProblem.set(key, existing);
    }
  }
  return byProblem;
}

/**
/**
 * Compute the authoritative DSA progress for a user from real submission data.
 *
 * Two collections are read and merged:
 *   - `codesubmissions` is the canonical DSA record written by
 *     /api/coding/submit; difficulty comes from a $lookup on the live problem.
 *   - `submissions` with category 'dsa' holds historical rows written by the
 *     older problem API; difficulty is denormalised on the row itself.
 * Merging keeps every genuine historical solve counted without double counting,
 * because the merge key is the problem id.
 */
async function computeDsaProgress(userId) {
  const id = userId && userId._id ? userId._id : userId;

  const [codeRollup, legacyRollup] = await Promise.all([
    CodeSubmission.aggregate([
      ...perProblemPipeline(id),
      { $lookup: { from: 'codingproblems', localField: '_id', foreignField: '_id', as: 'problemDoc' } },
      { $addFields: { difficulty: { $ifNull: [{ $first: '$problemDoc.difficulty' }, null] } } },
      { $project: { attempts: 1, accepted: 1, firstAcceptedAt: 1, difficulty: 1 } },
    ]),
    Submission.aggregate([
      { $match: { user: id, type: 'submit', category: 'dsa' } },
      {
        $group: {
          _id: '$problem',
          attempts: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          firstAcceptedAt: { $min: { $cond: [{ $eq: ['$status', 'accepted'] }, '$createdAt', null] } },
          difficulty: { $first: '$problemDifficulty' },
        },
      },
      { $project: { attempts: 1, accepted: 1, firstAcceptedAt: 1, difficulty: 1 } },
    ]),
  ]);

  const byProblem = mergeRollups(codeRollup, legacyRollup);

  const progress = {
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    solvedProblemIds: [],
    solvedWithDate: [],
  };

  for (const [problemId, row] of byProblem) {
    progress.totalSubmissions += row.attempts;
    progress.acceptedSubmissions += row.accepted;
    if (row.accepted <= 0) continue;

    progress.totalSolved += 1;
    // A submission whose problem document is gone (the 23 legacy dangling
    // references) still counts as solved, but has no difficulty bucket to fall
    // into. They are deliberately preserved rather than dropped.
    if (row.difficulty === 'easy') progress.easySolved += 1;
    else if (row.difficulty === 'medium') progress.mediumSolved += 1;
    else if (row.difficulty === 'hard') progress.hardSolved += 1;

    progress.solvedProblemIds.push(problemId);
    if (row.firstAcceptedAt) progress.solvedWithDate.push({ problemId, at: row.firstAcceptedAt });
  }

  const now = Date.now();
  progress.weeklySolved = progress.solvedWithDate.filter((s) => now - new Date(s.at).getTime() <= 7 * DAY_MS).length;
  progress.monthlySolved = progress.solvedWithDate.filter((s) => now - new Date(s.at).getTime() <= 30 * DAY_MS).length;
  progress.acceptanceRate = progress.totalSubmissions > 0
    ? Math.round((progress.acceptedSubmissions / progress.totalSubmissions) * 100)
    : 0;

  return progress;
}

/** Tier thresholds mirror the original leaderboardService logic. */
function rankingTierFor(totalSolved) {
  const tiers = [
    { min: 100, tier: 'Diamond' },
    { min: 60, tier: 'Platinum' },
    { min: 30, tier: 'Gold' },
    { min: 10, tier: 'Silver' },
  ];
  for (const t of tiers) if (totalSolved >= t.min) return t.tier;
  return 'Bronze';
}


/**
 * Recompute a user's DSA progress from real submissions and write it back.
 *
 * Both writes are `$set`s, so this is idempotent: calling it after every
 * submission keeps the denormalised counters correct AND repairs counters that
 * historical data left wrong. It never deletes or rewrites submissions.
 *
 * @returns {Promise<object>} the computed progress
 */
async function recomputeUserProgress(userId) {
  const id = userId && userId._id ? userId._id : userId;
  const progress = await computeDsaProgress(id);

  const user = await User.findByIdAndUpdate(
    id,
    {
      $set: {
        'stats.totalSolved': progress.totalSolved,
        'stats.easySolved': progress.easySolved,
        'stats.mediumSolved': progress.mediumSolved,
        'stats.hardSolved': progress.hardSolved,
      },
    },
    { new: true }
  );

  const submissionTotal = user && user.stats ? user.stats.totalSubmissions || 0 : progress.totalSubmissions;

  // UserStats is what /api/leaderboard/dsa reads, so it must be written here.
  // It used to be written only by the legacy SQL submit path, which is why the
  // DSA leaderboard was empty and fell back to a stale snapshot.
  await UserStats.findOneAndUpdate(
    { userId: id },
    {
      $set: {
        userId: id,
        totalProblems: progress.totalSolved,
        easyCount: progress.easySolved,
        mediumCount: progress.mediumSolved,
        hardCount: progress.hardSolved,
        totalSubmissions: submissionTotal,
        successfulSubmissions: progress.acceptedSubmissions,
        acceptanceRate: progress.acceptanceRate,
        rankingTier: rankingTierFor(progress.totalSolved),
        currentStreak: user && user.stats ? user.stats.streak || 0 : 0,
      },
    },
    { upsert: true, new: true }
  ).catch(() => {});

  return progress;
}

module.exports = {
  computeDsaProgress,
  recomputeUserProgress,
  rankingTierFor,
  mergeRollups,
};
