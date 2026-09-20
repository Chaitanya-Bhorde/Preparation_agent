/**
 * Feature Engineering Module for ML-based Analytics
 *
 * Builds real feature vectors from user activity in MongoDB.
 * All signals are derived from actual user submissions.
 */

const Submission = require('../../models/Submission');
const SQLSubmission = require('../../models/SQLSubmission');
const AptitudeSubmission = require('../../models/AptitudeSubmission');
const InterviewSession = require('../../models/InterviewSession');

/**
 * Centralized analytics configuration — single source of truth for thresholds.
 */
const HEATMAP_INTENSITY = {
  empty: 0,
  low: 1,
  medium: { min: 2, max: 3 },
  high: { min: 4, max: 5 },
  veryHigh: { min: 6, max: Infinity },
};

function safeDiv(a, b) {
  return b > 0 ? a / b : 0;
}

function difficultyScore(diff) {
  const map = { easy: 1, medium: 2, hard: 3 };
  return map[diff] || 1;
}

/**
 * Determine topic status based on attempts, accuracy, and solved count.
 * Distinguishes Weak vs Under-practiced.
 */
function determineStatus(attempts, accuracy, solved) {
  if (attempts === 0) return 'NEVER_ATTEMPTED';
  if (attempts < 3) {
    return accuracy >= 50 ? 'UNDER_PRACTICED' : 'WEAK_UNDERPRACTICED';
  }
  if (accuracy >= 70) return 'STRONG';
  if (accuracy >= 40) return 'MEDIUM';
  return 'WEAK';
}

/**
 * Compute confidence that the weak-area detection is reliable.
 */
function computeConfidence(attempts, recentAttempts) {
  const attemptConfidence = Math.min(attempts / 10, 1);
  const recencyConfidence = Math.min(recentAttempts / 5, 1);
  return Math.round((attemptConfidence * 0.7 + recencyConfidence * 0.3) * 100);
}

/**
 * Compute topic-level features for DSA domain.
 */
async function getDSAFeatures(userId) {
  const subs = await Submission.find({
    user: userId,
    type: 'submit',
    category: { $in: ['dsa', undefined] },
  }).select('status problem problemDifficulty problemTags createdAt').lean();

  const topicMap = {};
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  subs.forEach((sub) => {
    (sub.problemTags || []).forEach((tag) => {
      if (!topicMap[tag]) topicMap[tag] = { attempts: 0, accepted: 0, solved: new Set(), recentAttempts: 0, recentAccepted: 0, difficultySum: 0, lastAttempt: null };
      const t = topicMap[tag];
      t.attempts += 1;
      if (sub.status === 'accepted') { t.accepted += 1; if (sub.problem) t.solved.add(sub.problem.toString()); }
      if (sub.createdAt >= cutoff) { t.recentAttempts += 1; if (sub.status === 'accepted') t.recentAccepted += 1; }
      t.difficultySum += difficultyScore(sub.problemDifficulty);
      if (!t.lastAttempt || sub.createdAt > t.lastAttempt) t.lastAttempt = sub.createdAt;
    });
  });

  return Object.keys(topicMap).map((topic) => {
    const t = topicMap[topic];
    const solved = t.solved.size;
    const accuracy = safeDiv(t.accepted, t.attempts) * 100;
    const recentAccuracy = safeDiv(t.recentAccepted, t.recentAttempts) * 100;
    const avgDifficulty = safeDiv(t.difficultySum, t.attempts);
    const trend = t.recentAttempts > 0 ? recentAccuracy - accuracy : 0;
    return buildFeature(topic, 'DSA', t.attempts, solved, accuracy, recentAccuracy, avgDifficulty, trend, t.recentAttempts, t.lastAttempt, { attempts: t.attempts, accepted: t.accepted, solved, recentAttempts: t.recentAttempts, recentAccuracy: Math.round(recentAccuracy), lastAttempt: t.lastAttempt });
  }).sort((a, b) => a.attempts - b.attempts);
}

function buildFeature(topic, domain, attempts, solved, accuracy, recentAccuracy, avgDifficulty, trend, recentAttempts, lastAttempt, evidence) {
  return {
    topic, domain, attempts, solved,
    accuracy: Math.round(accuracy), recentAccuracy: Math.round(recentAccuracy),
    acceptanceRate: Math.round(accuracy),
    avgDifficulty: Math.round(avgDifficulty * 10) / 10,
    trend: Math.round(trend),
    status: determineStatus(attempts, accuracy, solved),
    confidence: computeConfidence(attempts, recentAttempts),
    evidence,
  };
}

/**
 * Compute topic-level features for SQL domain.
 */
async function getSQLFeatures(userId) {
  const subs = await SQLSubmission.find({ user: userId, type: 'submit' })
    .select('status difficulty topics createdAt').lean();

  const topicMap = {};
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  subs.forEach((sub) => {
    const tags = sub.topics || [];
    if (tags.length === 0) tags.push('general');
    tags.forEach((tag) => {
      if (!topicMap[tag]) topicMap[tag] = { attempts: 0, accepted: 0, solved: new Set(), recentAttempts: 0, recentAccepted: 0, difficultySum: 0, lastAttempt: null };
      const t = topicMap[tag];
      t.attempts += 1;
      if (sub.status === 'accepted') { t.accepted += 1; if (sub.problem) t.solved.add(sub.problem.toString()); }
      if (sub.createdAt >= cutoff) { t.recentAttempts += 1; if (sub.status === 'accepted') t.recentAccepted += 1; }
      t.difficultySum += difficultyScore(sub.difficulty);
      if (!t.lastAttempt || sub.createdAt > t.lastAttempt) t.lastAttempt = sub.createdAt;
    });
  });

  return Object.keys(topicMap).map((topic) => {
    const t = topicMap[topic];
    const solved = t.solved.size;
    const accuracy = safeDiv(t.accepted, t.attempts) * 100;
    const recentAccuracy = safeDiv(t.recentAccepted, t.recentAttempts) * 100;
    const avgDifficulty = safeDiv(t.difficultySum, t.attempts);
    const trend = t.recentAttempts > 0 ? recentAccuracy - accuracy : 0;
    return buildFeature(topic, 'SQL', t.attempts, solved, accuracy, recentAccuracy, avgDifficulty, trend, t.recentAttempts, t.lastAttempt,
      { attempts: t.attempts, accepted: t.accepted, solved, recentAttempts: t.recentAttempts, recentAccuracy: Math.round(recentAccuracy), lastAttempt: t.lastAttempt });
  }).sort((a, b) => a.attempts - b.attempts);
}

/**
 * Compute topic-level features for Aptitude domain.
 */
async function getAptitudeFeatures(userId) {
  const subs = await AptitudeSubmission.find({ user: userId, type: 'single-question' })
    .select('answers category correctCount totalCount createdAt').lean();
  const topicMap = {};
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  subs.forEach((sub) => {
    const category = sub.category || 'general';
    if (!topicMap[category]) topicMap[category] = { attempts: 0, correct: 0, total: 0, recentAttempts: 0, recentCorrect: 0, lastAttempt: null };
    const t = topicMap[category];
    const correct = sub.answers ? sub.answers.filter((a) => a.isCorrect).length : (sub.correctCount || 0);
    const total = sub.answers ? sub.answers.length : (sub.totalCount || 1);
    t.attempts += 1;
    t.correct += correct;
    t.total += total;
    if (sub.createdAt >= cutoff) { t.recentAttempts += 1; t.recentCorrect += correct; }
    if (!t.lastAttempt || sub.createdAt > t.lastAttempt) t.lastAttempt = sub.createdAt;
  });

  return Object.keys(topicMap).map((topic) => {
    const t = topicMap[topic];
    const accuracy = safeDiv(t.correct, t.attempts) * 100;
    const recentAccuracy = safeDiv(t.recentCorrect, t.recentAttempts) * 100;
    const trend = t.recentAttempts > 0 ? recentAccuracy - accuracy : 0;
    return buildFeature(topic, 'Aptitude', t.attempts, t.correct, accuracy, recentAccuracy, 1.0, trend, t.recentAttempts, t.lastAttempt,
      { attempts: t.attempts, correct: t.correct, total: t.total, recentAttempts: t.recentAttempts, recentAccuracy: Math.round(recentAccuracy), lastAttempt: t.lastAttempt });
  }).sort((a, b) => a.attempts - b.attempts);
}


/**
 * Compute topic-level features for Aptitude domain.
 */
async function getAptitudeFeatures(userId) {
  const subs = await AptitudeSubmission.find({ user: userId, type: 'single-question' })
    .select('answers category correctCount totalCount createdAt').lean();
  const topicMap = {};
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  subs.forEach((sub) => {
    const category = sub.category || 'general';
    if (!topicMap[category]) topicMap[category] = { attempts: 0, correct: 0, total: 0, recentAttempts: 0, recentCorrect: 0, lastAttempt: null };
    const t = topicMap[category];
    const correct = sub.answers ? sub.answers.filter((a) => a.isCorrect).length : (sub.correctCount || 0);
    const total = sub.answers ? sub.answers.length : (sub.totalCount || 1);
    t.attempts += 1;
    t.correct += correct;
    t.total += total;
    if (sub.createdAt >= cutoff) { t.recentAttempts += 1; t.recentCorrect += correct; }
    if (!t.lastAttempt || sub.createdAt > t.lastAttempt) t.lastAttempt = sub.createdAt;
  });

  return Object.keys(topicMap).map((topic) => {
    const t = topicMap[topic];
    const accuracy = safeDiv(t.correct, t.attempts) * 100;
    const recentAccuracy = safeDiv(t.recentCorrect, t.recentAttempts) * 100;
    const trend = t.recentAttempts > 0 ? recentAccuracy - accuracy : 0;
    return buildFeature(topic, 'Aptitude', t.attempts, t.correct, accuracy, recentAccuracy, 1.0, trend, t.recentAttempts, t.lastAttempt,
      { attempts: t.attempts, correct: t.correct, total: t.total, recentAttempts: t.recentAttempts, recentAccuracy: Math.round(recentAccuracy), lastAttempt: t.lastAttempt });
  }).sort((a, b) => a.attempts - b.attempts);
}


/**
 * Compute topic-level features from InterviewSession collection.
 */
async function getInterviewFeatures(userId) {
  const sessions = await InterviewSession.find({ user: userId, status: 'COMPLETED' })
    .select('finalReport createdAt').lean();
  if (!sessions.length) return [];
  const topicMap = {};
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  sessions.forEach((session) => {
    const report = session.finalReport;
    if (!report || !report.mainQuestions) return;
    const isRecent = session.createdAt >= cutoff;
    report.mainQuestions.forEach((mq) => {
      const topic = mq.topic || 'general';
      if (!topicMap[topic]) topicMap[topic] = { attempts: 0, correct: 0, totalScore: 0, maxScore: 0, recentAttempts: 0, recentScore: 0, lastAttempt: null };
      const t = topicMap[topic];
      t.attempts += 1;
      t.totalScore += (mq.score || 0);
      t.maxScore += (mq.maxScore || 2);
      const isCorrect = (mq.score || 0) === (mq.maxScore || 2) ? 1 : ((mq.score > 0) ? 0.5 : 0);
      t.correct += isCorrect;
      if (isRecent) { t.recentAttempts += 1; t.recentScore += (mq.score || 0); }
      if (!t.lastAttempt || session.createdAt > t.lastAttempt) t.lastAttempt = session.createdAt;
    });
  });

  return Object.keys(topicMap).map((topic) => {
    const t = topicMap[topic];
    const accuracy = safeDiv(t.totalScore, t.maxScore) * 100;
    const recentAccuracy = safeDiv(t.recentScore, t.recentAttempts * 2) * 100;
    const trend = t.recentAttempts > 0 ? recentAccuracy - accuracy : 0;
    return buildFeature(topic, 'Interview', t.attempts, t.correct, accuracy, recentAccuracy, 1.5, trend, t.recentAttempts, t.lastAttempt,
      { attempts: t.attempts, score: Math.round(t.totalScore), maxScore: t.maxScore, recentAttempts: t.recentAttempts, recentScore: Math.round(t.recentScore), lastAttempt: t.lastAttempt });
  }).sort((a, b) => a.attempts - b.attempts);
}



function simpleKMeans(data, k = 4, maxIter = 20) {
  if (!data.length) return [];
  if (data.length <= k) return data.map((d) => ({ ...d, cluster: 0, clusterLabel: 'MEDIUM' }));
  const features = data.map((d) => [d.accuracy / 100, Math.min(d.attempts / 20, 1), (d.trend + 100) / 200, d.recentAccuracy / 100]);
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.floor(Math.random() * data.length);
    centroids.push([...features[idx]]);
  }
  let assignments = new Array(data.length).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < data.length; i++) {
      let minDist = Infinity, bestCluster = 0;
      for (let ci = 0; ci < k; ci++) {
        let dist = 0;
        for (let d = 0; d < 4; d++) dist += Math.pow(features[i][d] - centroids[ci][d], 2);
        if (dist < minDist) { minDist = dist; bestCluster = ci; }
      }
      if (assignments[i] !== bestCluster) { assignments[i] = bestCluster; changed = true; }
    }
    const newCentroids = Array.from({ length: k }, () => ({ sum: [0, 0, 0, 0], count: 0 }));
    for (let i = 0; i < data.length; i++) {
      const ci = assignments[i];
      for (let d = 0; d < 4; d++) newCentroids[ci].sum[d] += features[i][d];
      newCentroids[ci].count += 1;
    }
    for (let ci = 0; ci < k; ci++) {
      if (newCentroids[ci].count > 0) centroids[ci] = [0, 1, 2, 3].map((d) => newCentroids[ci].sum[d] / newCentroids[ci].count);
    }
    if (!changed) break;
  }
  const clusterStats = {};
  for (let i = 0; i < data.length; i++) {
    const ci = assignments[i];
    if (!clusterStats[ci]) clusterStats[ci] = { accSum: 0, count: 0 };
    clusterStats[ci].accSum += features[i][0];
    clusterStats[ci].count += 1;
  }
  const sorted = Object.keys(clusterStats)
    .map((ci) => ({ cluster: parseInt(ci), avg: clusterStats[ci].accSum / clusterStats[ci].count }))
    .sort((a, b) => b.avg - a.avg);
  const labels = {};
  sorted.forEach((cs, idx) => {
    if (idx === 0) labels[cs.cluster] = 'STRONG';
    else if (idx === 1) labels[cs.cluster] = 'MEDIUM';
    else if (idx === 2) labels[cs.cluster] = 'WEAK';
    else labels[cs.cluster] = 'UNDER_PRACTICED';
  });
  return data.map((d, i) => ({ ...d, cluster: assignments[i], clusterLabel: labels[assignments[i]] || 'MEDIUM' }));
}


module.exports = {
  HEATMAP_INTENSITY,
  safeDiv,
  difficultyScore,
  determineStatus,
  computeConfidence,
  buildFeature,
  getDSAFeatures,
  getSQLFeatures,
  getAptitudeFeatures,
  getInterviewFeatures,
  getMockInterviewFeatures: getInterviewFeatures,
  simpleKMeans,
};


function simpleKMeans(data, k = 4, maxIter = 20) {
  if (!data.length) return [];
  if (data.length <= k) return data.map((d) => ({ ...d, cluster: 0, clusterLabel: 'MEDIUM' }));
  const features = data.map((d) => [d.accuracy / 100, Math.min(d.attempts / 20, 1), (d.trend + 100) / 200, d.recentAccuracy / 100]);
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.floor(Math.random() * data.length);
    centroids.push([...features[idx]]);
  }
  let assignments = new Array(data.length).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < data.length; i++) {
      let minDist = Infinity, bestCluster = 0;
      for (let ci = 0; ci < k; ci++) {
        let dist = 0;
        for (let d = 0; d < 4; d++) dist += Math.pow(features[i][d] - centroids[ci][d], 2);
        if (dist < minDist) { minDist = dist; bestCluster = ci; }
      }
      if (assignments[i] !== bestCluster) { assignments[i] = bestCluster; changed = true; }
    }
    const newCentroids = Array.from({ length: k }, () => ({ sum: [0, 0, 0, 0], count: 0 }));
    for (let i = 0; i < data.length; i++) {
      const ci = assignments[i];
      for (let d = 0; d < 4; d++) newCentroids[ci].sum[d] += features[i][d];
      newCentroids[ci].count += 1;
    }
    for (let ci = 0; ci < k; ci++) {
      if (newCentroids[ci].count > 0) centroids[ci] = [0, 1, 2, 3].map((d) => newCentroids[ci].sum[d] / newCentroids[ci].count);
    }
    if (!changed) break;
  }
  const clusterStats = {};
  for (let i = 0; i < data.length; i++) {
    const ci = assignments[i];
    if (!clusterStats[ci]) clusterStats[ci] = { accSum: 0, count: 0 };
    clusterStats[ci].accSum += features[i][0];
    clusterStats[ci].count += 1;
  }
  const sorted = Object.keys(clusterStats)
    .map((ci) => ({ cluster: parseInt(ci), avg: clusterStats[ci].accSum / clusterStats[ci].count }))
    .sort((a, b) => b.avg - a.avg);
  const labels = {};
  sorted.forEach((cs, idx) => {
    if (idx === 0) labels[cs.cluster] = 'STRONG';
    else if (idx === 1) labels[cs.cluster] = 'MEDIUM';
    else if (idx === 2) labels[cs.cluster] = 'WEAK';
    else labels[cs.cluster] = 'UNDER_PRACTICED';
  });
  return data.map((d, i) => ({ ...d, cluster: assignments[i], clusterLabel: labels[assignments[i]] || 'MEDIUM' }));
}

