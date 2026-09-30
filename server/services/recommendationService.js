/**
 * recommendationService.js
 * ---------------------------------------------------------------------------
 * Real, performance-driven learning recommendations.
 *
 * THE RULE THIS ENFORCES
 *   Nothing here is invented. Every number comes from a stored submission
 *   record, and when a user has not submitted enough for a signal to exist the
 *   service returns an explicit empty state instead of padding the list with
 *   arbitrary problems.
 *
 * PIPELINE
 *   stored activity
 *     -> feature engineering      (per-topic / per-difficulty aggregates)
 *     -> weak-topic detection     (Bayesian-smoothed accuracy threshold)
 *     -> candidate scoring        (transparent weighted ranker)
 *     -> ranked recommendations   (each carries its own `reason` + `scoreBreakdown`)
 *
 * WHY A LIGHTWEIGHT MODEL, NOT A NEURAL NETWORK
 *   With a single learner's handful of submissions there is no training set to
 *   fit, and a black-box model would not be explainable. The ranker below is a
 *   linear scorer over four normalised features with published weights, so a
 *   recommendation can always be justified in one sentence in an interview:
 *   "you are at 40% on Dynamic Programming over 12 attempts, so unsolved
 *   medium Dynamic Programming problems are ranked highest."
 *
 * TRAINING / FEATURE DATA (all read at inference time, no offline step)
 *   codesubmissions        - DSA verdicts, language, runtime per attempt
 *   codingproblems         - topic/tags/difficulty/acceptanceRate of candidates
 *   sqlsubmissions         - SQL topic-level verdicts
 *   aptitudesubmissions    - aptitude topic-level scores
 *   coresubjectsubmissions - core (technical round) accuracy per subject
 *   interviewsessions      - self-reported weak areas from the final report
 * ---------------------------------------------------------------------------
 */

const CodeSubmission = require('../models/CodeSubmission');
const CodingProblem = require('../models/CodingProblem');
const SQLSubmission = require('../models/SQLSubmission');
const AptitudeSubmission = require('../models/AptitudeSubmission');
const CoreSubjectSubmission = require('../models/CoreSubjectSubmission');
const Subject = require('../models/Subject');

// --- Tunable constants (documented so the behaviour is predictable) ---------
const MIN_ATTEMPTS_PER_TOPIC = 3;   // below this a topic has no signal
const MIN_TOTAL_ATTEMPTS = 5;       // below this the user has no signal at all
const WEAK_ACCURACY_CEILING = 0.5;  // smoothed accuracy under this => weak
const STRONG_ACCURACY_FLOOR = 0.75; // smoothed accuracy over this => mastered
const BAYES_PRIOR_STRENGTH = 4;     // pseudo-attempts blended into the mean
const DEFAULT_BAYES_PRIOR = 0.5;    // prior success rate for an unseen topic
const STALE_AFTER_DAYS = 7;         // not attempted recently => worth revisiting
const MAX_RECOMMENDATIONS = 10;

const WEIGHTS = {
  weakness: 0.45,   // how much the user struggles in the candidate's topic
  novelty: 0.25,    // not solved yet
  difficultyFit: 0.15, // close to the user's demonstrated level
  popularity: 0.15, // community acceptance rate as a sanity prior
};

/** Days since `date`, clamped at 0. */
function daysSince(date) {
  if (!date) return Infinity;
  return Math.max(0, (Date.now() - new Date(date).getTime()) / 86400000);
}

/**
 * Beta smoothing: accuracy = (successes + prior*k) / (attempts + k).
 * Prevents a 0/1 record from reading as "0% skill" and a 5/6 record from
 * reading as "83% skill" — the same idea as a Bayesian prior in A/B testing.
 */
function smoothedAccuracy(successes, attempts) {
  return (successes + DEFAULT_BAYES_PRIOR * BAYES_PRIOR_STRENGTH)
    / (attempts + BAYES_PRIOR_STRENGTH);
}

/**
 * Accumulate one attempt (or several) against a feature bucket.
 * `delta` is the number of ATTEMPTS; solved-ness is recorded separately so a
 * problem with 6 submissions still counts as exactly one solved problem.
 */
function bump(map, key, _field, delta = 1) {
  if (!key) return;
  // Tags are stored with inconsistent casing across the 266-problem bank
  // ("Hash Table" vs "hash-table" vs "HashTable"). Normalising the key to
  // lower case with separators collapsed is what lets a candidate problem's tag
  // actually match the topic the user has a track record in.
  const k = normalizeTopic(key);
  if (!map.has(k)) map.set(k, { attempts: 0, solved: 0, lastAttempt: null, label: String(key) });
  const row = map.get(k);
  row.attempts += delta;
  if (!row.lastAttempt) row.lastAttempt = Date.now();
  return row;
}

/**
 * Canonical topic key: lower case, non-alphanumerics collapsed to a single
 * space, trimmed. "Hash Table" / "hash-table" / "hashTable" all become
 * "hash table". The DISPLAY name is kept separately on the weak-topic entry.
 */
function normalizeTopic(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Recover a human-readable topic label from a normalised key. The raw tag is
 * kept on the bucket the first time it is seen, so "hash table" is displayed
 * as the bank actually spells it ("Hash Table") rather than the slug form.
 */
function displayName(key, row) {
  return (row && row.label) || String(key).replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * STEP 1 — FEATURE ENGINEERING
 * Turn raw submission rows into per-topic and per-difficulty aggregates.
 *
 * A "solved" problem is counted ONCE (the user cannot solve the same problem
 * twice), while `attempts` counts every submission. Difficulty and topic come
 * from a $lookup on the live problem so a submission whose problem document has
 * since been removed is still counted as an attempt, never silently dropped.
 */
async function buildFeatures(userId) {
  const uid = userId && userId._id ? userId._id : userId;

  const rollups = await CodeSubmission.aggregate([
    { $match: { user: uid, category: 'dsa' } },
    {
      $group: {
        _id: '$problem',
        attempts: { $sum: 1 },
        accepted: { $sum: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, 1, 0] } },
      },
    },
    { $lookup: { from: 'codingproblems', localField: '_id', foreignField: '_id', as: 'p' } },
    { $addFields: { difficulty: { $ifNull: [{ $first: '$p.difficulty' }, null] }, tags: { $ifNull: [{ $first: '$p.tags' }, []] } } },
  ]);

  const topicStats = new Map();
  const difficultyStats = new Map();
  const solvedProblemIds = [];
  let totalAttempts = 0;
  let totalSolved = 0;
  let lastActivity = null;

  for (const row of rollups) {
    totalAttempts += row.attempts;
    const solved = row.accepted > 0 ? 1 : 0;
    totalSolved += solved;
    if (solved) solvedProblemIds.push(row._id);

    if (row.difficulty) {
      bump(difficultyStats, row.difficulty, null, row.attempts);
      if (solved) {
        const d = difficultyStats.get(normalizeTopic(row.difficulty));
        if (d) d.solved += 1;
      }
    }
    // A problem can carry several tags; each records the attempt, which is the
    // standard multi-label attribution for topic accuracy. `solved` is added
    // separately and exactly ONCE per solved problem, never once per attempt.
    // The lookup MUST use the same normalised key that bump() stored, otherwise
    // a multi-word tag ("dynamic-programming") is written under one key and read
    // under another and the solved count silently stays zero.
    (row.tags || []).forEach((tag) => {
      bump(topicStats, tag, null, row.attempts);
      if (solved) {
        const t = topicStats.get(normalizeTopic(tag));
        if (t) t.solved += 1;
      }
    });
  }

  return { topicStats, difficultyStats, solvedProblemIds, totalAttempts, totalSolved, lastActivity };
}

/**
 * STEP 2 — WEAK-TOPIC DETECTION
 * A topic is weak only when it has enough attempts to be meaningful AND its
 * Bayesian-smoothed accuracy sits below the ceiling. Topics that are already
 * strong are reported separately so the UI can show what NOT to drill.
 */
function identifyWeakTopics(topicStats) {
  const weak = [];
  const strong = [];
  topicStats.forEach((row, topicKey) => {
    if (row.attempts < MIN_ATTEMPTS_PER_TOPIC) return;
    const accuracy = smoothedAccuracy(row.solved, row.attempts);
    const entry = {
      topic: displayName(topicKey, row),
      key: topicKey,
      attempts: row.attempts,
      solved: row.solved,
      accuracy: Math.round(accuracy * 100),
      daysSinceLastAttempt: Math.round(daysSince(row.lastAttempt)),
    };
    if (accuracy < WEAK_ACCURACY_CEILING) weak.push(entry);
    else if (accuracy > STRONG_ACCURACY_FLOOR) strong.push(entry);
  });
  weak.sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts);
  strong.sort((a, b) => b.accuracy - a.accuracy);
  return { weak, strong };
}

/**
 * Cross-domain performance summary. Each domain contributes only if the user
 * actually has rows in it; an empty domain is reported as `null` rather than as
 * a zero score, so the UI can say "no aptitude data yet" instead of "0%".
 */
async function buildCrossDomainSummary(userId) {
  const uid = userId && userId._id ? userId._id : userId;
  const DAY = 86400000;

  const sqlRows = await SQLSubmission.aggregate([
    { $match: { user: uid, type: 'submit' } },
    { $group: { _id: '$problem', attempts: { $sum: 1 }, accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } } } },
  ]);
  const sqlAttempts = sqlRows.reduce((s, r) => s + r.attempts, 0);
  const sqlSolved = sqlRows.filter((r) => r.accepted > 0).length;

  const aptitudeRows = await AptitudeSubmission.aggregate([
    { $match: { userId: uid } },
    { $group: { _id: '$_id', score: { $avg: '$score' } } },
  ]);
  const aptitudeAvg = aptitudeRows.length
    ? Math.round(aptitudeRows.reduce((s, r) => s + (r.score || 0), 0) / aptitudeRows.length)
    : null;

  const coreRows = await CoreSubjectSubmission.aggregate([
    { $match: { userId: uid } },
    { $group: { _id: '$subject', attempts: { $sum: 1 }, correct: { $sum: { $cond: ['$isCorrect', 1, 0] } } } },
  ]);
  const coreAccuracy = coreRows.length
    ? Math.round((coreRows.reduce((s, r) => s + r.correct, 0) / coreRows.reduce((s, r) => s + r.attempts, 0)) * 100)
    : null;
  const subjectNames = await Subject.find({ _id: { $in: coreRows.map((r) => r._id) } }).select('name slug').lean();
  const subjectNameById = new Map(subjectNames.map((s) => [String(s._id), s.name]));

  return {
    sql: sqlAttempts > 0
      ? { attempts: sqlAttempts, uniqueSolved: sqlSolved, accuracy: Math.round((sqlSolved / sqlAttempts) * 100) }
      : null,
    aptitude: aptitudeAvg !== null ? { attempts: aptitudeRows.length, averageScore: aptitudeAvg } : null,
    coreSubjects: coreAccuracy !== null
      ? {
          accuracy: coreAccuracy,
          weakSubjects: coreRows
            .map((r) => ({ subject: subjectNameById.get(String(r._id)) || 'Unknown', accuracy: Math.round((r.correct / r.attempts) * 100), attempts: r.attempts }))
            .filter((s) => s.attempts >= 3 && s.accuracy < 60)
            .sort((a, b) => a.accuracy - b.accuracy),
        }
      : null,
    _dayMs: DAY,
  };
}

/**
 * STEP 3 — CANDIDATE SCORING (the "model")
 *
 * score = w_weakness  * (1 - smoothed accuracy of the candidate's weakest topic)
 *       + w_novelty   * 1                              (always 1: we only score unsolved)
 *       + w_diffFit   * fit to the user's demonstrated difficulty band
 *       + w_popularity* normalised acceptanceRate
 *
 * Every term is in [0,1] and the weights are published above, so a single
 * recommendation can be traced back to concrete numbers. `reason` is generated
 * from the same inputs, which is what makes the output explainable.
 */
function scoreCandidate(problem, ctx) {
  const order = { easy: 0, medium: 1, hard: 2 };
  const tags = Array.isArray(problem.tags) ? problem.tags : [];
  const topic = problem.topic || tags[0] || null;

  // Weakness: use the WORST of the candidate's topics, because that is the
  // single most actionable reason to attempt it.
  let weakness = 0;
  let weakestTopic = null;
  let weakestAccuracy = null;
  let weakestAttempts = 0;
  tags.concat(topic ? [topic] : []).forEach((t) => {
    const row = ctx.topicStats.get(normalizeTopic(t));
    if (!row || row.attempts < MIN_ATTEMPTS_PER_TOPIC) return;
    const acc = smoothedAccuracy(row.solved, row.attempts);
    // Keep the topic with the LOWEST accuracy, i.e. the HIGHEST weakness
    // (1 - accuracy). Guarding on `acc > weakness` instead would compare an
    // accuracy against a weakness score, always be true, and silently zero the
    // weakness term for every candidate.
    const w = 1 - acc;
    if (w <= weakness) return;
    weakness = w;
    weakestTopic = displayName(normalizeTopic(t), row);
    weakestAccuracy = Math.round(acc * 100);
    weakestAttempts = row.attempts;
  });

  // Difficulty fit: 1 when the candidate matches the band the user is actually
  // clearing, tapering to 0.3 for a band they have never touched. The band is
  // compared as a NAME (`problem.difficulty === level`) — comparing the numeric
  // index against the name would never be equal.
  const level = ctx.recommendedDifficulty;
  let difficultyFit = 0.3;
  if (level) {
    if (problem.difficulty === level) difficultyFit = 1;
    else if (Math.abs((order[problem.difficulty] ?? 0) - (order[level] ?? 0)) === 1) difficultyFit = 0.6;
    else difficultyFit = 0.3;
  }

  const popularity = Math.min(1, Math.max(0, (problem.acceptanceRate || 0) / 100));

  const breakdown = {
    weakness: Number((weakness * WEIGHTS.weakness).toFixed(4)),
    novelty: WEIGHTS.novelty,
    difficultyFit: Number((difficultyFit * WEIGHTS.difficultyFit).toFixed(4)),
    popularity: Number((popularity * WEIGHTS.popularity).toFixed(4)),
  };
  const score = Number(Object.values(breakdown).reduce((a, b) => a + b, 0).toFixed(4));

  let reason;
  if (weakestTopic && weakestAttempts >= MIN_ATTEMPTS_PER_TOPIC) {
    const stale = ctx.staleTopics.has(weakestTopic) ? ` and you have not touched it in ${ctx.staleTopics.get(weakestTopic)}+ days` : '';
    reason = `You are at ${weakestAccuracy}% on ${weakestTopic} over ${weakestAttempts} attempt${weakestAttempts === 1 ? '' : 's'}${stale}.`;
  } else if (problem.difficulty === level) {
    reason = `Matches your current level: you are clearing most ${level} problems.`;
  } else {
    reason = `Unsolved ${problem.difficulty} problem to broaden your coverage.`;
  }

  return { score, breakdown, reason, weakestTopic };
}

/** Pick the difficulty band the user is demonstrably operating at. */
function recommendedDifficulty(difficultyStats) {
  const score = (name) => {
    const row = difficultyStats.get(name);
    if (!row) return null;
    return smoothedAccuracy(row.solved, row.attempts);
  };
  const easy = score('easy');
  const medium = score('medium');
  const hard = score('hard');

  if (medium !== null && medium >= 0.5) return 'hard';
  if (easy !== null && easy >= 0.5) return 'medium';
  if (easy !== null) return 'easy';
  return null;
}

/**
 * PUBLIC ENTRY POINT
 *
 * @returns {Promise<object>} a payload that is ALWAYS honest:
 *   - `hasEnoughData: false` + a human message when the user has not submitted
 *     enough for ANY topic signal, and `recommendations: []`.
 *   - otherwise ranked problems, each with `reason` and a `scoreBreakdown`.
 */
async function generateRecommendations(userId, options = {}) {
  const limit = Math.min(options.limit || MAX_RECOMMENDATIONS, MAX_RECOMMENDATIONS);
  const features = await buildFeatures(userId);
  const { weak, strong } = identifyWeakTopics(features.topicStats);
  const level = recommendedDifficulty(features.difficultyStats);
  const crossDomain = await buildCrossDomainSummary(userId);

  const insufficient =
    features.totalAttempts < MIN_TOTAL_ATTEMPTS && weak.length === 0 &&
    !crossDomain.sql && !crossDomain.coreSubjects;

  const payload = {
    hasEnoughData: !insufficient,
    message: insufficient
      ? 'Not enough data yet. Solve more problems to generate personalized recommendations.'
      : null,
    recommendations: [],
    weakTopics: weak,
    strongTopics: strong,
    targetDifficulty: level,
    model: {
      name: 'weighted-topic-weakness-ranker',
      version: 1,
      weights: WEIGHTS,
      thresholds: {
        minAttemptsPerTopic: MIN_ATTEMPTS_PER_TOPIC,
        minTotalAttempts: MIN_TOTAL_ATTEMPTS,
        weakAccuracyCeiling: WEAK_ACCURACY_CEILING,
        strongAccuracyFloor: STRONG_ACCURACY_FLOOR,
      },
      smoothing: `Beta(prior=${DEFAULT_BAYES_PRIOR}, k=${BAYES_PRIOR_STRENGTH})`,
    },
    features: {
      totalAttempts: features.totalAttempts,
      uniqueSolved: features.totalSolved,
      topicsWithSignal: features.topicStats.size,
      recommendedDifficulty: level,
    },
    crossDomain: {
      dsa: { attempts: features.totalAttempts, uniqueSolved: features.totalSolved },
      sql: crossDomain.sql,
      aptitude: crossDomain.aptitude,
      coreSubjects: crossDomain.coreSubjects,
    },
  };

  // Honest fallback: do NOT pad the list with arbitrary problems.
  if (insufficient) return payload;

  // Candidate selection: unsolved problems, optionally narrowed to the weak
  // topics. The tag filter is case-INSENSITIVE because the bank is not
  // consistently cased ("Hash Table" vs "hash-table"), and a case-sensitive
  // $in would silently match nothing.
  const weakTopicKeys = weak.map((w) => w.key);
  const filter = { isActive: true, _id: { $nin: features.solvedProblemIds } };
  if (weakTopicKeys.length > 0) {
    const insensitive = weakTopicKeys.map((k) => new RegExp(`^${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
    filter.$or = [
      { tags: { $in: insensitive } },
      { topic: { $in: insensitive } },
    ];
  }

  const candidates = await CodingProblem.find(filter)
    .select('title slug difficulty topic tags acceptanceRate companies isActive')
    .limit(400)
    .lean();

  const staleTopics = new Map();
  weak.forEach((w) => {
    if (w.daysSinceLastAttempt >= STALE_AFTER_DAYS) staleTopics.set(w.key, w.daysSinceLastAttempt);
  });

  const ctx = {
    topicStats: features.topicStats,
    recommendedDifficulty: level,
    staleTopics,
  };

  payload.recommendations = candidates
    .map((p) => {
      const scored = scoreCandidate(p, ctx);
      return {
        _id: p._id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        topic: p.topic,
        tags: p.tags || [],
        acceptanceRate: p.acceptanceRate || 0,
        score: scored.score,
        scoreBreakdown: scored.breakdown,
        reason: scored.reason,
      };
    })
    .sort((a, b) => b.score - a.score || (b.acceptanceRate - a.acceptanceRate))
    .slice(0, limit);

  return payload;
}

module.exports = {
  generateRecommendations,
  // Exported for unit tests so the maths can be verified without a database.
  buildFeatures,
  identifyWeakTopics,
  scoreCandidate,
  recommendedDifficulty,
  smoothedAccuracy,
  MIN_ATTEMPTS_PER_TOPIC,
  MIN_TOTAL_ATTEMPTS,
  WEIGHTS,
};


