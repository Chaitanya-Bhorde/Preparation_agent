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
  // Separate main questions from follow-ups for accurate counting
  const mainAnswers = answers.filter((a) => a.question && !a.question.isFollowUp);
  const followUpAnswers = answers.filter((a) => a.question && a.question.isFollowUp);
  
  const scored = answers.filter((a) => a.evaluation && typeof a.evaluation.overall === 'number');
  const scoredMain = mainAnswers.filter((a) => a.evaluation && typeof a.evaluation.overall === 'number');
  const scoredFollowUps = followUpAnswers.filter((a) => a.evaluation && typeof a.evaluation.overall === 'number');

  // Debug logging for report generation
  console.log(`[interview] report generation debug session=${session._id}:`, {
    selectedQuestionCount: session.totalQuestions,
    totalAnswers: answers.length,
    mainAnswers: mainAnswers.length,
    followUpAnswers: followUpAnswers.length,
    scoredMain: scoredMain.length,
    scoredFollowUps: scoredFollowUps.length,
  });

  // ── Deterministic aggregation ───────────────────────────────────────────
  // Topic performance based on MAIN questions only (follow-ups are adaptive probes)
  const topicAgg = {};
  for (const a of scoredMain) {
    const t = a.question?.topic || 'General';
    if (!topicAgg[t]) topicAgg[t] = { sum: 0, n: 0 };
    topicAgg[t].sum += a.evaluation.overall;
    topicAgg[t].n += 1;
  }
  const topicPerformance = Object.entries(topicAgg)
    .map(([topic, { sum, n }]) => ({ topic, averageScore: round1(sum / n), questionsAsked: n }))
    .sort((a, b) => b.averageScore - a.averageScore);

  // Skills based on main questions only for accurate assessment
  const avg = (fn) => (scoredMain.length ? round1(scoredMain.reduce((s, a) => s + fn(a.evaluation), 0) / scoredMain.length) : 0);
  const skills = {
    conceptualUnderstanding: avg((e) => e.correctness),
    problemSolving: avg((e) => (e.technicalAccuracy + e.depth) / 2),
    technicalDepth: avg((e) => e.depth),
    accuracy: avg((e) => e.technicalAccuracy),
  };
  const clarityAvg = avg((e) => e.clarity);
  const communication = {
    clarity: clarityAvg,
    conciseness: avg((e) => e.completeness),
    confidenceIndicator: clarityAvg >= 7.5 ? 'strong' : clarityAvg >= 6 ? 'good' : clarityAvg >= 4 ? 'moderate' : scoredMain.length ? 'low' : 'not_available',
    notes: 'Confidence/clarity is inferred from answer communication scores collected during the interview.',
  };

  // Overall score calculated from MAIN questions only (the selected interview length)
  const overallScore = scoredMain.length
    ? round0((scoredMain.reduce((s, a) => s + a.evaluation.overall, 0) / scoredMain.length) * 10)
    : 0;

  // ── Interview activity stats (§ report spec) — always deterministic ─────
  // CRITICAL: questionsAsked counts ONLY main questions (the selected count)
  // Follow-ups are adaptive probes and counted separately
  const questionsAsked = mainAnswers.length;
  const questionsAnswered = scoredMain.length;
  const followUpCount = followUpAnswers.length;
  const followUpsAnswered = scoredFollowUps.length;
  
  const mistakes = [];
  for (const a of scoredMain) {
    for (const m of a.evaluation.detectedMistakes || []) {
      if (m && !mistakes.some((x) => x.toLowerCase() === m.toLowerCase())) mistakes.push(String(m).slice(0, 140));
    }
  }
  for (const a of scoredMain) {
    if ((a.evaluation.verdict === 'incorrect' || a.evaluation.quality === 'incorrect') && a.question?.text) {
      mistakes.push(`Incorrect: ${String(a.question.text).slice(0, 100)}`);
    }
  }
  const stats = {
    questionsAsked,
    questionsAnswered,
    followUpCount,
    followUpsAnswered,
    mistakesCount: mistakes.length,
    selectedQuestionCount: session.totalQuestions, // The user's selected count
  };

  // QA rows for AI assessment: include both main and follow-ups for context
  const qaRows = scored.map((a) => ({
    question: a.question?.text || '',
    topic: a.question?.topic || '',
    overall: a.evaluation.overall,
    missingConcepts: a.evaluation.missingConcepts || [],
    isFollowUp: a.question?.isFollowUp || false,
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
    stats,
    mistakes: mistakes.slice(0, 10),
    strengths: aiPart.strengths,
    areasToImprove: aiPart.areasToImprove,
    assessment: aiPart.assessment,
    recommendedTopics: aiPart.recommendedTopics,
    generatedBy,
  };
}

module.exports = { generateReport };
