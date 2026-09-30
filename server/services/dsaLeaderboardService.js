/**
 * dsaLeaderboardService.js
 * ---------------------------------------------------------------------------
 * DSA rankings derived DIRECTLY from the real submission records.
 *
 * WHY THIS EXISTS
 *   /api/leaderboard/dsa used to read the `userstats` collection, which only
 *   the legacy SQL submit path ever wrote. It had 0 documents in the live
 *   database, so the endpoint fell through to a stale 6-row `leaderboards`
 *   snapshot and a real user such as "manan" simply did not appear. This
 *   service removes the denormalised middle-man entirely: rankings are an
 *   aggregation over `codesubmissions`, so they can never be stale.
 *
 * THE COUNTING RULE
 *   Group by (user, problem) first, keep only problems with at least one
 *   Accepted, then count those rows. Three Accepted submissions of the same
 *   problem therefore contribute exactly ONE solved problem, while the raw
 *   submission count is reported separately for transparency.
 * ---------------------------------------------------------------------------
 */

const CodeSubmission = require('../models/CodeSubmission');

/**
 * Accounts that must never appear on a public leaderboard.
 * Used as a qualified path (e.g. `'userDoc.isTestAccount'`) because `$unwind`
 * keeps a looked-up document under its own field name.
 */
const PUBLIC_USER_MATCH = { 'userDoc.isTestAccount': { $ne: true } };

/**
 * Shared aggregation: per-user, per-problem rollup -> unique solved counts.
 * @param {Object} [opts]
 * @param {Object} [opts.match] extra `$match` applied to the submissions
 */
function dsaRankingPipeline(opts = {}) {
  return [
    { $match: { category: 'dsa', ...(opts.match || {}) } },
    // 1. Collapse duplicate submissions of the same problem.
    {
      $group: {
        _id: { user: '$user', problem: '$problem' },
        submissions: { $sum: 1 },
        accepted: { $sum: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, 1, 0] } },
      },
    },
    // 2. Keep only problems that were actually solved at least once.
    { $match: { accepted: { $gt: 0 } } },
    { $lookup: { from: 'codingproblems', localField: '_id.problem', foreignField: '_id', as: 'problemDoc' } },
    { $addFields: { difficulty: { $ifNull: [{ $first: '$problemDoc.difficulty' }, null] } } },
    // 3. Roll the solved problems up per user.
    {
      $group: {
        _id: '$_id.user',
        solvedCount: { $sum: 1 },
        easyCount: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } },
        mediumCount: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } },
        hardCount: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } },
        // Accepted submissions on solved problems (can exceed solvedCount on
        // purpose: it is the "submission count" column, not a solved count).
        acceptedOnSolved: { $sum: '$submissions' },
      },
    },
    // 4. Attach the real account and drop anything that is not a real user.
    //    NOTE: `$unwind` does NOT promote the sub-document's fields to the top
    //    level, so the flag stays under `userDoc`. Matching a bare
    //    `isTestAccount` here would evaluate against a MISSING field, and
    //    `{ $ne: true }` matches missing — which silently let every flagged
    //    test account back onto the board. The qualified path is required.
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDoc' } },
    { $unwind: '$userDoc' },
    { $match: { 'userDoc.isTestAccount': { $ne: true } } },
    { $project: { _id: 0, userId: '$_id', username: '$userDoc.name', solvedCount: 1, easyCount: 1, mediumCount: 1, hardCount: 1, acceptedOnSolved: 1 } },
    { $sort: { solvedCount: -1, easyCount: -1, username: 1 } },
  ];
}

/** Count how many real users have at least one solved DSA problem. */
async function countRankedUsers() {
  const rows = await CodeSubmission.aggregate([
    { $match: { category: 'dsa', verdict: 'Accepted' } },
    { $group: { _id: '$user' } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDoc' } },
    { $unwind: '$userDoc' },
    { $match: PUBLIC_USER_MATCH },
    { $count: 'n' },
  ]);
  return rows[0] ? rows[0].n : 0;
}

/**
 * Paginated DSA leaderboard.
 * @returns {Promise<{leaderboard: Array, pagination: Object}>}
 */
async function getDsaLeaderboard({ limit = 20, page = 1 } = {}) {
  const rows = await CodeSubmission.aggregate([
    ...dsaRankingPipeline(),
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);
  const total = await countRankedUsers();
  return {
    leaderboard: rows,
    pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
  };
}

module.exports = { dsaRankingPipeline, getDsaLeaderboard, countRankedUsers, PUBLIC_USER_MATCH };
