/**
 * reportGenerator — builds the final interview report.
 *
 * Deterministic aggregation (topic performance, skills, communication) is
 * computed from persisted evaluations — never from the AI — so scores can't
 * drift. One AI call produces the final assessment paragraph and recommended
 * topics; if it fails, a deterministic fallback assessment is generated
 * instead. The report is persisted on the session.
 */

const { callJson } = require('./aiClient');

const round1 = (n) => Math.round(n * 10) / 10;
const round0 = (n) => Math.round(n);

function buildReportPrompt(session, qaRows) {
  const rows = qaRows
    .slice(0, 25)
    .map((r, i) => `${i + 1}. [${r.topic}] "${r.question}" → score ${r.overall}/10, missing: ${r.missingConcepts.join(', ') || 'none'}`)
    .join('\n');

  return `You are a senior interviewer writing the final assessment for a completed mock interview.

Candidate level: ${session.experienceLevel}. Difficulty: ${session.difficulty}. Topics: ${session.topics.join(', ')}.

Question results:
${rows}

Respond ONLY with valid JSON:
{
  "assessment": "3-4 sentence overall assessment naming strong and weak topics specifically",
  "strengths": ["up to 4 short bullet strings"],
  "areasToImprove": ["up to 4 short bullet strings"],
  "recommendedTopics": ["5-8 specific topics/concepts to practice next, each within 6 words, strictly related to the interview topics"]
}`;
}

/** Deterministic assessment fallback when the AI call fails. */
function buildFallbackAssessment(session, topicPerformance, skills) {
  const strong = topicPerformance.filter((t) => t.averageScore >= 7).map((t) => t.topic);
  const weak = topicPerformance.filter((t) => t.averageScore < 6).map((t) => t.topic);
  const parts = [];
  if (strong.length) parts.push(`Strong understanding of ${strong.join(' and ')}`);
  else parts.push('Fundamentals need consistent work across all selected topics');
  if (weak.length) parts.push(`${weak.join(' and ')} require more practice`);
  else parts.push('Performance was consistent across topics');
  const weakestSkill = Object.entries(skills).sort((a, b) => a[1] - b[1])[0];
  if (weakestSkill) parts.push(`The lowest-scoring skill area was ${weakestSkill[0]} (${weakestSkill[1]}/10)`);

  return {
    assessment: parts.join('. ') + '.',
    strengths: strong.slice(0, 4).map((t) => `Solid answers in ${t}`),
    areasToImprove: weak.slice(0, 4).map((t) => `Deepen ${t} fundamentals`),
    recommendedTopics: weak.slice(0, 4).concat(strong.slice(0, 2)).map((t) => `${t} advanced concepts`),
  };
}

/**
 * @param {object} session InterviewSession doc
 * @param {Array} answers  populated answers (question + evaluation)
 * @returns {object} finalReport subdocument payload
 */
async function generateReport(session, answers) {
  const scored = answers.filter((a) => a.evaluation && typeof a.evaluation.overall === 'number');

  // ── Deterministic aggregation ───────────────────────────────────────────
  const topicAgg = {};
  for (const a of scored) {
    const t = a.question?.topic || 'General';
    if (!topicAgg[t]) topicAgg[t] = { sum: 0, n: 0 };
    topicAgg[t].sum += a.evaluation.overall;
    topicAgg[t].n += 1;
  }
  const topicPerformance = Object.entries(topicAgg)
    .map(([topic, { sum, n }]) => ({ topic, averageScore: round1(sum / n), questionsAsked: n }))
    .sort((a, b) => b.averageScore - a.averageScore);

  const avg = (fn) => (scored.length ? round1(scored.reduce((s, a) => s + fn(a.evaluation), 0) / scored.length) : 0);
  const skills = {
    conceptualUnderstanding: avg((e) => e.correctness),
    problemSolving: avg((e) => (e.technicalAccuracy + e.depth) / 2),
    technicalDepth: avg((e) => e.depth),
    accuracy: avg((e) => e.technicalAccuracy),
  };
  const communication = {
    clarity: avg((e) => e.clarity),
    conciseness: avg((e) => e.completeness),
    confidenceIndicator: 'not_available', // reliable voice metrics are not measurable in-browser
    notes: 'Confidence indicators require voice-delivery analysis, which browsers do not expose reliably.',
  };

  const overallScore = scored.length
    ? round0((scored.reduce((s, a) => s + a.evaluation.overall, 0) / scored.length) * 10)
    : 0;

  const qaRows = scored.map((a) => ({
    question: a.question?.text || '',
    topic: a.question?.topic || '',
    overall: a.evaluation.overall,
    missingConcepts: a.evaluation.missingConcepts || [],
  }));

  // ── AI assessment (with deterministic fallback) ─────────────────────────
  let aiPart = null;
  let generatedBy = 'deterministic-fallback';
  try {
    const parsed = await callJson(
      [
        { role: 'system', content: 'You are a precise JSON generator. Output only valid JSON matching the requested shape.' },
        { role: 'user', content: buildReportPrompt(session, qaRows) },
      ],
      { temperature: 0.4, maxTokens: 800 }
    );
    if (parsed && typeof parsed.assessment === 'string' && parsed.assessment.trim().length > 20) {
      generatedBy = 'ai';
      aiPart = {
        assessment: parsed.assessment.trim().slice(0, 1200),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String).slice(0, 4) : [],
        areasToImprove: Array.isArray(parsed.areasToImprove) ? parsed.areasToImprove.map(String).slice(0, 4) : [],
        recommendedTopics: Array.isArray(parsed.recommendedTopics)
          ? parsed.recommendedTopics.map((t) => String(t).slice(0, 60)).filter(Boolean).slice(0, 8)
          : [],
      };
    }
  } catch (err) {
    console.error(`[interview] report AI call failed: ${err.message}`);
  }

  if (!aiPart) aiPart = buildFallbackAssessment(session, topicPerformance, skills);

  return {
    overallScore,
    maxScore: 100,
    topicPerformance,
    skills,
    communication,
    strengths: aiPart.strengths,
    areasToImprove: aiPart.areasToImprove,
    assessment: aiPart.assessment,
    recommendedTopics: aiPart.recommendedTopics,
    generatedBy,
  };
}

module.exports = { generateReport };
