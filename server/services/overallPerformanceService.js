'use strict';

/**
 * overallPerformanceService.js
 * ---------------------------------------------------------------------------
 * THE single source of truth for the four PrepAgent performance sections
 * (DSA, Aptitude, SQL, Mock Interview) and for the Overall score that ranks a
 * user on the public leaderboard.
 *
 * WHY THIS EXISTS
 *   The previous leaderboard rendered a Problems/Easy/Medium/Hard/Acceptance
 *   block sourced from a `leaderboards` SNAPSHOT collection plus a `userstats`
 *   collection that the DSA submit path never wrote. It therefore showed stale
 *   rows, could not show Aptitude / SQL / Mock Interview at all, and its ranks
 *   were frozen until somebody re-ran a compute job. Everything here is instead
 *   aggregated from the real submission / session records on every request, so
 *   the board can never drift from activity.
 *
 * NOTHING HERE IS FABRICATED
 *   - A section with no real activity is reported as `null` (the UI renders it
 *     as "—"/"Not Attempted"). It is NEVER coerced to 0, because 0 is a real
 *     score meaning "attempted and got everything wrong".
 *   - A user with no activity in ANY section has `overall === null` and is not
 *     ranked at all.
 *   - Test accounts (User.isTestAccount) are excluded from every public board.
 * ---------------------------------------------------------------------------
 */

const CodeSubmission = require('../models/CodeSubmission');
const SQLSubmission = require('../models/SQLSubmission');
const AptitudeSubmission = require('../models/AptitudeSubmission');
const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');
const mongoose = require('mongoose');

// --- Published scoring constants (mirrors services/recommendationService) ---
const BAYES_PRIOR = 0.5;
const BAYES_STRENGTH = 4;

/** The four leaderboard sections, in display order. */
const SECTIONS = ['dsa', 'aptitude', 'sql', 'mockInterview'];

const SECTION_LABELS = {
  dsa: 'DSA',
  aptitude: 'Aptitude',
  sql: 'SQL',
  mockInterview: 'Mock Interview',
};

const SECTION_HEADINGS = {
  dsa: 'DSA',
  aptitude: 'Aptitude',
  sql: 'SQL',
  mockInterview: 'Mock Interview',
};

/**
 * `$unwind` does NOT hoist a `$lookup`ed document to the top level, so the flag
 * must be read from its qualified path. Matching a bare `isTestAccount` would
 * evaluate against a MISSING field and `{ $ne: true }` matches missing — which
 * quietly let every flagged test account back onto the board (the same fix is
 * applied in services/dsaLeaderboardService).
 */
const PUBLIC_USER_MATCH = { 'userDoc.isTestAccount': { $ne: true } };

/* ------------------------------------------------------------------ maths */

/**
 * Beta-smoothed accuracy as a 0-100 integer, or `null` when there is no
 * attempt at all (which is NOT the same thing as 0%).
 */
function smoothedScore(successes, attempts) {
  const a = Number(attempts) || 0;
  if (a <= 0) return null;
  const s = Number(successes) || 0;
  return Math.round(((s + BAYES_PRIOR * BAYES_STRENGTH) / (a + BAYES_STRENGTH)) * 100);
}

/** Arithmetic mean over the values that exist; `null` when none do. */
function mean(values) {
  const nums = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (nums.length === 0) return null;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return Math.round(avg * 10) / 10;
}

/* ------------------------------------------------------- per-domain counts */

/**
 * THE SCORING CONTRACT (identical for every user, published in the API
 * response under `scoring` so a client can explain any row it renders)
 *
 *   Count-based sections (DSA / SQL / Aptitude) use the Beta-smoothed accuracy
 *   that already exists in services/recommendationService:
 *
 *       score = 100 * (successes + prior*k) / (attempts + k),  prior = 0.5, k = 4
 *
 *   Smoothing stops a single lucky Accepted from reading as "100% skill" and a
 *   single miss from reading as "0% skill". The counts behind it are REAL:
 *     - DSA     : distinct problems attempted / distinct problems solved
 *                  (the canonical unique-solved rule of dsaProgressService)
 *     - SQL     : distinct problems attempted / distinct problems solved
 *     - Aptitude: graded questions answered / graded questions correct,
 *                  including mock-test papers (same source as featureEngineering)
 *
 *   Mock Interview has no attempt denominator — it is a set of completed,
 *   evaluated sessions — so it uses the project's existing `averagePercentage`
 *   convention (controllers/analyticsController.interviewStats): the mean of
 *   `finalReport.percentage` across COMPLETED sessions.
 *
 *   Overall = arithmetic mean of the AVAILABLE section scores, i.e. normalised
 *   over the sections the user actually attempted. A missing section is dropped
 *   from both the sum and the divisor, so nobody is punished for not having
 *   attempted a section and nobody is rewarded for it either. There is exactly
 *   one formula, applied to every user.
 *
 * RANKING
 *   Sorted by Overall (desc). Deterministic tie-breakers, in order:
 *     1. more completed sections
 *     2. more total graded activity (submissions + questions + interviews)
 *     3. name, then userId — guarantees a stable, reproducible board.
 *   Rank is the 1-based index of the sorted list; it is never stored, so it
 *   recalculates the moment real activity changes.
 */

/**
 * DSA: roll submissions up per PROBLEM (not per submission) so three Accepted
 * runs of the same problem still count as one solved problem, then roll the
 * solved problems up per user. Same rule as dsaProgressService.
 */
function dsaPipeline() {
  return [
    { $match: { category: 'dsa', user: { $exists: true } } },
    {
      $group: {
        _id: { user: '$user', problem: '$problem' },
        submissions: { $sum: 1 },
        accepted: { $sum: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, 1, 0] } },
        lastAttemptAt: { $max: '$createdAt' },
      },
    },
    {
      $group: {
        _id: '$_id.user',
        problemsAttempted: { $sum: 1 },
        problemsSolved: { $sum: { $cond: [{ $gt: ['$accepted', 0] }, 1, 0] } },
        totalSubmissions: { $sum: '$submissions' },
        acceptedSubmissions: { $sum: '$accepted' },
        lastAttemptAt: { $max: '$lastAttemptAt' },
      },
    },
  ];
}

/** SQL: identical unique-problem rule over `sqlsubmissions` (the live path). */
function sqlPipeline() {
  return [
    { $match: { type: 'submit', user: { $exists: true } } },
    {
      $group: {
        _id: { user: '$user', problem: '$problem' },
        submissions: { $sum: 1 },
        accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
        lastAttemptAt: { $max: '$createdAt' },
      },
    },
    {
      $group: {
        _id: '$_id.user',
        problemsAttempted: { $sum: 1 },
        problemsSolved: { $sum: { $cond: [{ $gt: ['$accepted', 0] }, 1, 0] } },
        totalSubmissions: { $sum: '$submissions' },
        acceptedSubmissions: { $sum: '$accepted' },
        lastAttemptAt: { $max: '$lastAttemptAt' },
      },
    },
  ];
}

/**
 * Aptitude: per-QUESTION accuracy, never per-paper.
 *
 * Rows written before the `answers` array existed carry only `correctCount` /
 * `totalCount`, and a mock test carries `totalQuestions` instead of
 * `totalCount`. Both shapes are handled so an older paper is never counted as
 * "0 questions" (which would silently read as 0% accuracy).
 */
function aptitudePipeline() {
  const answersSize = { $size: { $ifNull: ['$answers', []] } };
  const hasAnswers = { $gt: [answersSize, 0] };
  return [
    { $match: { userId: { $exists: true } } },
    {
      $group: {
        _id: '$userId',
        questions: {
          $sum: {
            $cond: [
              hasAnswers,
              answersSize,
              { $ifNull: ['$totalCount', { $ifNull: ['$totalQuestions', 0] }] },
            ],
          },
        },
        correct: {
          $sum: {
            $cond: [
              hasAnswers,
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ['$answers', []] },
                    cond: { $eq: ['$$this.isCorrect', true] },
                  },
                },
              },
              { $ifNull: ['$correctCount', 0] },
            ],
          },
        },
        papers: { $sum: 1 },
        mockTests: { $sum: { $cond: [{ $eq: ['$type', 'mock-test'] }, 1, 0] } },
        bestScore: { $max: '$score' },
        lastAttemptAt: { $max: '$createdAt' },
      },
    },
  ];
}

/**
 * Mock interview: only COMPLETED sessions, and only sessions that carry a real
 * evaluation. `finalReport.percentage` is authoritative; a report that predates
 * it falls back to score/maxScore, and a session with neither is skipped rather
 * than counted as 0.
 */
function interviewPipeline() {
  return [
    { $match: { status: 'COMPLETED' } },
    {
      $project: {
        user: 1,
        percentage: {
          $ifNull: [
            '$finalReport.percentage',
            {
              $cond: [
                { $gt: [{ $ifNull: ['$finalReport.maxScore', 0] }, 0] },
                {
                  $multiply: [
                    { $divide: [{ $ifNull: ['$finalReport.score', 0] }, '$finalReport.maxScore'] },
                    100,
                  ],
                },
                null,
              ],
            },
          ],
        },
        lastAttemptAt: '$completedAt',
      },
    },
    { $match: { user: { $exists: true }, percentage: { $ne: null } } },
    {
      $group: {
        _id: '$user',
        interviews: { $sum: 1 },
        percentageSum: { $sum: '$percentage' },
        averagePercentage: { $avg: '$percentage' },
        lastAttemptAt: { $max: '$lastAttemptAt' },
      },
    },
  ];
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

/* -------------------------------------------------------------- assembly */

/**
 * All per-user counts for all four sections, keyed by section then userId.
 * Exposed for unit tests and for callers that want the raw evidence.
 */
async function collectSectionCounts() {
  const [dsaRows, sqlRows, aptitudeRows, interviewRows] = await Promise.all([
    CodeSubmission.aggregate(dsaPipeline()),
    SQLSubmission.aggregate(sqlPipeline()),
    AptitudeSubmission.aggregate(aptitudePipeline()),
    InterviewSession.aggregate(interviewPipeline()),
  ]);

  const counts = { dsa: {}, sql: {}, aptitude: {}, mockInterview: {} };
  const put = (section, row) => {
    if (row && row._id) counts[section][String(row._id)] = row;
  };
  dsaRows.forEach((r) => put('dsa', r));
  sqlRows.forEach((r) => put('sql', r));
  aptitudeRows.forEach((r) => put('aptitude', r));
  interviewRows.forEach((r) => put('mockInterview', r));
  return counts;
}

function emptyCounts() {
  return { dsa: {}, sql: {}, aptitude: {}, mockInterview: {} };
}

function pickCounts(counts, userId) {
  return {
    dsa: counts.dsa[userId] || null,
    sql: counts.sql[userId] || null,
    aptitude: counts.aptitude[userId] || null,
    mockInterview: counts.mockInterview[userId] || null,
  };
}

function toObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
}
/**
 * Turn raw per-user counts into the public row shape.
 * Pure function — exported so the maths can be unit-tested without a database.
 */
function buildRow({ userId, name, counts }) {
  const dsa = counts.dsa || null;
  const sql = counts.sql || null;
  const aptitude = counts.aptitude || null;
  const interview = counts.mockInterview || null;

  const sectionScores = {
    dsa: smoothedScore(dsa ? dsa.problemsSolved : 0, dsa ? dsa.problemsAttempted : 0),
    aptitude: smoothedScore(aptitude ? aptitude.correct : 0, aptitude ? aptitude.questions : 0),
    sql: smoothedScore(sql ? sql.problemsSolved : 0, sql ? sql.problemsAttempted : 0),
    // Interviews have no attempt denominator; the project already reports the
    // mean `finalReport.percentage` (analyticsController.interviewStats).
    mockInterview: interview ? Math.round(interview.averagePercentage) : null,
  };

  const available = SECTIONS.filter((s) => sectionScores[s] !== null);
  const overall = mean(available.map((s) => sectionScores[s]));

  const activity = {
    dsaSolved: dsa ? dsa.problemsSolved : 0,
    dsaAttempted: dsa ? dsa.problemsAttempted : 0,
    dsaSubmissions: dsa ? dsa.totalSubmissions : 0,
    sqlSolved: sql ? sql.problemsSolved : 0,
    sqlAttempted: sql ? sql.problemsAttempted : 0,
    sqlSubmissions: sql ? sql.totalSubmissions : 0,
    aptitudeQuestions: aptitude ? aptitude.questions : 0,
    aptitudeCorrect: aptitude ? aptitude.correct : 0,
    aptitudePapers: aptitude ? aptitude.papers : 0,
    aptitudeMockTests: aptitude ? aptitude.mockTests : 0,
    interviews: interview ? interview.interviews : 0,
  };

  const totalActivity =
    activity.dsaSubmissions +
    activity.sqlSubmissions +
    activity.aptitudeQuestions +
    activity.interviews;

  return {
    userId: String(userId),
    name: name || 'Unknown user',
    dsa: sectionScores.dsa,
    aptitude: sectionScores.aptitude,
    sql: sectionScores.sql,
    mockInterview: sectionScores.mockInterview,
    overall,
    sectionsCompleted: available.length,
    totalActivity,
    activity,
  };
}

/**
 * Deterministic ordering — see the RANKING block in the file header.
 * Exported so the ranking rule can be unit-tested on its own.
 */
function compareRows(a, b) {
  if (b.overall !== a.overall) return b.overall - a.overall;
  if (b.sectionsCompleted !== a.sectionsCompleted) return b.sectionsCompleted - a.sectionsCompleted;
  if (b.totalActivity !== a.totalActivity) return b.totalActivity - a.totalActivity;
  const byName = String(a.name).localeCompare(String(b.name));
  if (byName !== 0) return byName;
  return a.userId.localeCompare(b.userId);
}

/** Attach the 1-based rank. Ranks are never persisted. */
function withRanks(rows) {
  return rows.slice().sort(compareRows).map((row, index) => ({ ...row, rank: index + 1 }));
}

/** Strip the internal sort helpers before anything leaves the server. */
/**
 * Every ranked row that has at least one real section, unsorted.
 * Only `name` is published — never the email, never the profile picture.
 */
async function buildAllRows() {
  const counts = await collectSectionCounts();
  const userIds = new Set();
  Object.values(counts).forEach((bucket) => Object.keys(bucket).forEach((id) => userIds.add(id)));
  if (userIds.size === 0) return [];

  // A submission whose owner was deleted, or whose owner is a flagged
  // automated test account, is not a leaderboard participant. The flag is
  // matched at the query level (not in JS) so a flagged account never even
  // contributes a name.
  const users = await User.find({
    _id: { $in: [...userIds].map(toObjectId) },
    isTestAccount: { $ne: true },
  })
    .select('name')
    .lean();

  const rows = [];
  users.forEach((u) => {
    const id = String(u._id);
    const row = buildRow({ userId: id, name: u.name, counts: pickCounts(counts, id) });
    // No section attempted => overall === null => not a leaderboard entry.
    if (row.overall === null) return;
    rows.push(row);
  });
  return rows;
}

/** The scoring rules, published so the UI can explain any row it renders. */
function scoringContract() {
  return {
    sections: SECTIONS.map((key) => ({ key, label: SECTION_HEADINGS[key] })),
    smoothing: `Beta(prior=${BAYES_PRIOR}, k=${BAYES_STRENGTH})`,
    rules: {
      dsa: 'Unique problems solved / unique problems attempted (Beta-smoothed).',
      aptitude: 'Correct graded questions / graded questions answered (Beta-smoothed), mock tests included.',
      sql: 'Unique problems solved / unique problems attempted (Beta-smoothed).',
      mockInterview: 'Average finalReport.percentage across completed mock interviews.',
    },
    overall: 'Mean of the available section scores. A section with no activity is excluded from both the sum and the divisor (never counted as 0).',
    ranking: 'Overall descending, then sections completed, then total activity, then name — the same rule for every user.',
    emptyState: 'A section with no activity is reported as null and shown as "—". It is never reported as 0.',
  };
}

/**
 * The public leaderboard.
 *
 * @param {Object}  [opts]
 * @param {number}  [opts.limit=50]
 * @param {number}  [opts.page=1]
 * @param {string}  [opts.currentUserId] highlight row for the caller
 * @returns {Promise<{leaderboard:Array, pagination:Object, currentUser:Object|null, scoring:Object}>}
 */
async function getOverallLeaderboard({ limit = 50, page = 1, currentUserId } = {}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);

  const ranked = withRanks(await buildAllRows());
  const total = ranked.length;
  const start = (safePage - 1) * safeLimit;

  const currentUser = currentUserId
    ? ranked.find((r) => r.userId === String(currentUserId)) || null
    : null;

  return {
    leaderboard: ranked.slice(start, start + safeLimit).map(publicRow),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.max(Math.ceil(total / safeLimit), 1),
    },
    currentUser: currentUser ? publicRow(currentUser) : null,
    scoring: scoringContract(),
  };
}

/**
 * One user's own performance, used by the Analytics "Overall Performance" card.
 * Includes their live rank on exactly the same board the leaderboard renders.
 */
async function getUserOverallPerformance(userId) {
  const ranked = withRanks(await buildAllRows());
  const mine = ranked.find((r) => r.userId === String(userId));
  if (mine) {
    return { ...publicRow(mine), totalRankedUsers: ranked.length, hasAnyActivity: true, scoring: scoringContract() };
  }
  // Registered but no activity anywhere: honest empty state, never a fake 0.
  const blank = publicRow(buildRow({ userId, name: null, counts: pickCounts(emptyCounts(), String(userId)) }));
  return { ...blank, totalRankedUsers: ranked.length, hasAnyActivity: false, scoring: scoringContract() };
}

module.exports = {
  SECTIONS,
  SECTION_LABELS,
  SECTION_HEADINGS,
  BAYES_PRIOR,
  BAYES_STRENGTH,
  PUBLIC_USER_MATCH,
  dsaPipeline,
  sqlPipeline,
  aptitudePipeline,
  interviewPipeline,
  collectSectionCounts,
  buildRow,
  buildAllRows,
  withRanks,
  compareRows,
  publicRow,
  scoringContract,
  smoothedScore,
  mean,
  round1,
  getOverallLeaderboard,
  getUserOverallPerformance,
};
function publicRow(row) {
  const { totalActivity, ...rest } = row;
  return rest;
}