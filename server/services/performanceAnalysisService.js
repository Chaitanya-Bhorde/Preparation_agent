'use strict';

/**
 * performanceAnalysisService.js
 * ---------------------------------------------------------------------------
 * Turns the EXISTING real feature vectors (services/ml/featureEngineering) into
 * the three sections the Analytics page needs:
 *
 *   1. Your Strengths              — topics that are genuinely strong
 *   2. Areas That Need Improvement — topics that are genuinely weak
 *   3. Personalized Suggestions    — what to do about it, per section
 *
 * WHY IT REUSES featureEngineering
 *   `getDSAFeatures`, `getSQLFeatures`, `getAptitudeFeatures` and
 *   `getInterviewFeatures` already read the four real activity collections and
 *   already encode the project's status rules (`determineStatus`), confidence
 *   weighting (`computeConfidence`) and 30-day recency signals
 *   (`recentAccuracy` / `trend`). Duplicating that maths here would create a
 *   second, subtly different definition of "weak" — so it is imported, not
 *   reimplemented. The recommendation text itself comes from the existing
 *   `buildAction`/`buildWeakReason` helpers in services/ml/recommendationEngine,
 *   so the wording matches what /api/recommendations already tells the user.
 *
 * NO FABRICATED OUTPUT
 *   A topic only becomes a strength with a real accuracy AND enough attempts to
 *   be meaningful; a topic only becomes a weakness with a real accuracy below
 *   the threshold. A user with no activity gets empty arrays plus an explicit
 *   message — never a placeholder topic.
 */

const {
  getDSAFeatures,
  getSQLFeatures,
  getAptitudeFeatures,
  getMockInterviewFeatures,
} = require('./ml/featureEngineering');
const { generateRecommendations, buildAction } = require('./ml/recommendationEngine');

/** Minimum attempts before a topic may be called a strength. */
const STRONG_MIN_ATTEMPTS = 3;
/** Minimum attempts before a topic may be called weak (avoids one-off verdicts). */
const WEAK_MIN_ATTEMPTS = 3;
/** Cap on rows rendered per section, so the UI stays readable. */
const MAX_PER_SECTION = 6;

const DOMAIN_TO_SECTION = {
  DSA: 'dsa',
  SQL: 'sql',
  Aptitude: 'aptitude',
  Interview: 'mockInterview',
};

const SECTION_LABELS = {
  dsa: 'DSA',
  sql: 'SQL',
  aptitude: 'Aptitude',
  mockInterview: 'Mock Interview',
};

/** Canonical section order used for grouping and rendering. */
const SECTION_ORDER = ['dsa', 'aptitude', 'sql', 'mockInterview'];

/** Section key for a feature's domain, with the Interview alias mapped. */
function sectionOf(domain) {
  return DOMAIN_TO_SECTION[domain] || 'dsa';
}

function labelOf(domain) {
  return SECTION_LABELS[sectionOf(domain)] || domain;
}

/**
 * Load all four real feature vectors for one user in parallel.
 * This is the single place the analytics layer touches the database.
 */
async function loadFeatures(userId) {
  const [dsa, sql, aptitude, interview] = await Promise.all([
    getDSAFeatures(userId),
    getSQLFeatures(userId),
    getAptitudeFeatures(userId),
    getMockInterviewFeatures(userId),
  ]);
  return { dsa, sql, aptitude, interview, all: [...dsa, ...sql, ...aptitude, ...interview] };
}

/** The "attempts" figure the UI shows for a topic, per domain shape. */
function attemptsOf(f) {
  return Number(f.attempts) || 0;
}

/**
 * Strengths: status STRONG (accuracy >= 70 in featureEngineering) AND enough
 * attempts to trust it. Sorted best-first.
 */
function buildStrengths(features) {
  return features
    .filter((f) => f && f.status === 'STRONG' && attemptsOf(f) >= STRONG_MIN_ATTEMPTS)
    .sort((a, b) => b.accuracy - a.accuracy || b.attempts - a.attempts)
    .map((f) => ({
      section: sectionOf(f.domain),
      sectionLabel: labelOf(f.domain),
      topic: f.topic,
      accuracy: f.accuracy,
      recentAccuracy: f.recentAccuracy,
      attempts: attemptsOf(f),
      solved: f.solved || 0,
      trend: f.trend,
      confidence: f.confidence,
    }));
}

/**
 * Weak areas: the project already distinguishes
 *   WEAK                 — enough attempts, genuinely low accuracy
 *   WEAK_UNDERPRACTICED  — very few attempts AND low accuracy (unreliable)
 * Only the first is treated as a confirmed weakness; the second is reported as
 * "needs more data" so a single unlucky attempt is never declared a deficit.
 */
function buildWeakAreas(features) {
  const rows = features
    .filter((f) => f && (f.status === 'WEAK' || f.status === 'WEAK_UNDERPRACTICED'))
    .map((f) => ({
      section: sectionOf(f.domain),
      sectionLabel: labelOf(f.domain),
      topic: f.topic,
      // A thin sample is reported as unconfirmed, never as a hard weakness.
      confirmed: f.status === 'WEAK' && attemptsOf(f) >= WEAK_MIN_ATTEMPTS,
      performance: f.accuracy,
      metric: f.domain === 'Interview' ? 'Score' : 'Accuracy',
      attempts: attemptsOf(f),
      recentAccuracy: f.recentAccuracy,
      trend: f.trend,
      solved: f.solved || 0,
      confidence: f.confidence,
      action: buildAction(f.domain, f.topic, 'weak'),
    }));

  // Confirmed weaknesses first, then by lowest accuracy, then by name for a
  // stable order across reloads.
  rows.sort((a, b) => {
    if (a.confirmed !== b.confirmed) return a.confirmed ? -1 : 1;
    if (a.performance !== b.performance) return a.performance - b.performance;
    return String(a.topic).localeCompare(String(b.topic));
  });
  return rows;
}

/** Group rows by their `section` key, preserving the canonical section order. */
function groupBySection(rows) {
  const out = {};
  SECTION_ORDER.forEach((s) => { out[s] = []; });
  rows.forEach((r) => {
    if (!out[r.section]) out[r.section] = [];
    out[r.section].push(r);
  });
  return out;
}

/** Keep the N highest-priority rows per section so the panel stays readable. */
function capBySection(rows, cap) {
  return Object.values(groupBySection(rows)).flatMap((list) => list.slice(0, cap));
}

/**
 * Personalized suggestions, grouped by section, built from the EXISTING
 * recommendation engine so the advice is identical to what the recommendations
 * panel already shows and carries the same evidence.
 *
 * Cross-domain recommendations (the same topic weak in two sections at once)
 * are kept, but under their own `crossDomain` key rather than being attributed
 * to one arbitrary section.
 */
async function buildSuggestions(userId) {
  const recommendations = await generateRecommendations(userId);
  const crossDomain = recommendations
    .filter((r) => r && r.domain === 'Cross-Domain')
    .map((r) => ({
      topic: r.topic,
      priority: r.priority,
      reason: r.reason,
      suggestion: r.recommendedAction || r.action || null,
      domains: (r.evidence && r.evidence.domains) || [],
    }));

  const rows = recommendations
    .filter((r) => r && r.domain !== 'Cross-Domain')
    .map((r) => ({
      // `domain` is the engine's own label (DSA / SQL / Aptitude / Interview);
      // `section` is its leaderboard-aligned key. Both are published so a
      // client can group either way without re-deriving the mapping.
      domain: r.domain,
      section: sectionOf(r.domain),
      sectionLabel: labelOf(r.domain),
      topic: r.topic,
      status: r.status,
      priority: r.priority,
      reason: r.reason,
      suggestion: r.recommendedAction || r.action || null,
      evidence: r.evidence || null,
    }));

  return {
    hasAny: rows.length > 0 || crossDomain.length > 0,
    bySection: groupBySection(rows),
    ordered: rows,
    crossDomain,
  };
}

/**
 * The whole Analytics analysis payload for one user.
 * @returns {Promise<{strengths:Array, weakAreas:Array, suggestions:Object}>}
 */
async function analyze(userId) {
  const features = await loadFeatures(userId);
  const suggestions = await buildSuggestions(userId);

  return {
    strengths: capBySection(buildStrengths(features.all), MAX_PER_SECTION),
    weakAreas: capBySection(buildWeakAreas(features.all), MAX_PER_SECTION),
    suggestions,
    topicsWithSignal: features.all.length,
    hasAnyActivity: features.all.length > 0,
  };
}

module.exports = {
  STRONG_MIN_ATTEMPTS,
  WEAK_MIN_ATTEMPTS,
  MAX_PER_SECTION,
  SECTION_LABELS,
  SECTION_ORDER,
  sectionOf,
  loadFeatures,
  buildStrengths,
  buildWeakAreas,
  buildSuggestions,
  groupBySection,
  analyze,
};
