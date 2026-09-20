/**
 * Recommendation Engine - generates personalized recommendations from real user data.
 */
const { getDSAFeatures, getSQLFeatures, getAptitudeFeatures, getInterviewFeatures, simpleKMeans } = require('./featureEngineering');

async function generateRecommendations(userId) {
  const dsaFeatures = await getDSAFeatures(userId);
  const sqlFeatures = await getSQLFeatures(userId);
  const aptitudeFeatures = await getAptitudeFeatures(userId);
  const interviewFeatures = await getInterviewFeatures(userId);

  const allFeatures = [...dsaFeatures, ...sqlFeatures, ...aptitudeFeatures, ...interviewFeatures];
  const clustered = allFeatures.length >= 4 ? simpleKMeans(allFeatures, 4) : allFeatures.map((f) => ({ ...f, clusterLabel: f.status }));

  const recommendations = [];
  const domainRecs = {
    DSA: generateDomainRecs(dsaFeatures, clustered.filter((f) => f.domain === 'DSA')),
    SQL: generateDomainRecs(sqlFeatures, clustered.filter((f) => f.domain === 'SQL')),
    Aptitude: generateDomainRecs(aptitudeFeatures, clustered.filter((f) => f.domain === 'Aptitude')),
    Interview: generateDomainRecs(interviewFeatures, clustered.filter((f) => f.domain === 'Interview')),
  };

  Object.values(domainRecs).forEach((recs) => recs.forEach((r) => recommendations.push(r)));
  generateCrossDomainRecs(domainRecs).forEach((r) => recommendations.push(r));

  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return recommendations.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return (b.confidence || 0) - (a.confidence || 0);
  });
}
module.exports = { generateRecommendations };


/**
 * Generate per-domain recommendations based on topic features.
 */
function generateDomainRecs(features, clustered) {
  if (!features.length) return [];
  const weakAreas = features.filter((f) => f.status === 'WEAK');
  const underPracticed = features.filter((f) => f.status === 'UNDER_PRACTICED' || f.status === 'WEAK_UNDERPRACTICED');
  const mediumAreas = features.filter((f) => f.status === 'MEDIUM');
  const recs = [];

  weakAreas.forEach((f) => {
    recs.push({
      domain: f.domain,
      topic: f.topic,
      status: 'WEAK',
      confidence: Math.min(f.confidence + 20, 100),
      priority: f.confidence >= 60 ? 'HIGH' : 'MEDIUM',
      reason: buildWeakReason(f),
      recommendedAction: buildAction(f.domain, f.topic, 'weak'),
      evidence: f.evidence,
    });
  });

  underPracticed.slice(0, 5).forEach((f) => {
    recs.push({
      domain: f.domain,
      topic: f.topic,
      status: 'UNDER_PRACTICED',
      confidence: Math.max(f.confidence, 30),
      priority: 'MEDIUM',
      reason: f.attempts + ' attempt(s). Insufficient data to assess proficiency.',
      recommendedAction: buildAction(f.domain, f.topic, 'underpracticed'),
      evidence: f.evidence,
    });
  });

  mediumAreas.filter((f) => f.trend < 0 && f.attempts >= 5).forEach((f) => {
    recs.push({
      domain: f.domain,
      topic: f.topic,
      status: 'MEDIUM',
      confidence: Math.min(f.confidence + 10, 100),
      priority: 'MEDIUM',
      reason: 'Performance declining (trend: ' + f.trend + '%). Focus on fundamentals.',
      recommendedAction: buildAction(f.domain, f.topic, 'medium'),
      evidence: f.evidence,
    });
  });

  return recs;
}

function buildWeakReason(f) {
  const parts = [];
  parts.push('Accuracy: ' + f.accuracy + '% across ' + f.attempts + ' attempts');
  if (f.recentAccuracy > 0) {
    if (f.trend < 0) parts.push('recent accuracy declining (trend: ' + f.trend + '%)');
    else parts.push('recent accuracy: ' + f.recentAccuracy + '%');
  }
  parts.push((f.evidence.solved || f.evidence.correct || 0) + ' problems solved');
  return parts.join('. ') + '.';
}

function buildAction(domain, topic, type) {
  switch (domain) {
    case 'DSA':
      return type === 'weak' ? 'Practice 5 Easy + 4 Medium + 1 Hard ' + topic + ' problems.' : 'Start with 3 Easy ' + topic + ' problems to build familiarity.';
    case 'SQL':
      return type === 'weak' ? 'Practice 3 Easy + 3 Medium ' + topic + ' SQL problems, then attempt a SQL mock interview.' : 'Start with 2 Easy ' + topic + ' SQL problems.';
    case 'Aptitude':
      return type === 'weak' ? 'Practice 15 ' + topic + ' questions, then attempt a timed ' + topic + ' mock test.' : 'Practice 5 ' + topic + ' questions to build confidence.';
    case 'Interview':
      return type === 'weak' ? 'Review ' + topic + ' fundamentals and attempt 2 ' + topic + '-focused mock interviews.' : 'Start with 1 ' + topic + ' mock interview to assess current level.';
    default:
      return 'Practice ' + topic + ' problems.';
  }
}

/**
 * Cross-domain analysis: detect when multiple signals point to the same weak area.
 */
function generateCrossDomainRecs(domainRecs) {
  const recs = [];
  const topicSignals = {};
  Object.entries(domainRecs).forEach(([domain, items]) => {
    items.filter((r) => r.status === 'WEAK' || r.status === 'WEAK_UNDERPRACTICED')
      .forEach((r) => {
        const key = r.topic.toLowerCase();
        if (!topicSignals[key]) topicSignals[key] = { domains: [], recs: [] };
        topicSignals[key].domains.push(domain);
        topicSignals[key].recs.push(r);
      });
  });
  Object.entries(topicSignals).forEach(([topic, data]) => {
    if (data.domains.length >= 2) {
      recs.push({
        domain: 'Cross-Domain',
        topic: topic,
        status: 'WEAK',
        confidence: Math.min(Math.max(...data.recs.map((r) => r.confidence)), 100),
        priority: 'HIGH',
        reason: 'Weak in ' + topic + ' across ' + data.domains.join(', ') + '. Compound weakness detected.',
        recommendedAction: 'Prioritize ' + topic + ' practice across ' + data.domains.join(', ') + '.',
        evidence: { domains: data.domains, count: data.recs.length },
      });
    }
  });
  return recs;
}
