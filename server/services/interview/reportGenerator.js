/**
 * reportGenerator — builds the final interview report (§ scoring spec).
 *
 * Score model: every MAIN question is worth EXACTLY 2 marks.
 *   2 = fully correct / complete
 *   1 = partially correct / somewhat relevant
 *   0 = incorrect / irrelevant / no meaningful answer
 *
 * maxScore = selectedQuestionCount × 2. For 5 selected questions the report
 * is always X/10 regardless of how many AI follow-ups happened — follow-ups
 * are stored as supporting conversation and NEVER contribute to the score,
 * the denominator, or the question counts.
 *
 * Per-question marks are read from the persisted evaluation (`marks`,
 * stamped deterministically by the evaluator). The 0-10 AI dimension scores
 * are still used for qualitative analysis (skills/communication/topics), but
 * they never redefine the headline score.
 */

const { callJson } = require('./aiClient');
const { deriveMarks } = require('./evaluator');

const round1 = (n) => Math.round(n * 10) / 10;

function buildReportPrompt(session, mainQuestions) {
  const rows = mainQuestions
    .slice(0, 25)
    .map((q, i) => `${i + 1}. [${q.topic}] "${q.question}" → ${q.score}/${q.maxScore} (${q.result}), missing: ${q.missingConcepts.join(', ') || 'none'}`)
    .join('\n');

  return `You are a senior interviewer writing the final assessment for a completed mock interview.

Candidate level: ${session.experienceLevel}. Difficulty: ${session.difficulty}. Topics: ${session.topics.join(', ')}.

Main question results (2 marks each):
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
function buildFallbackAssessment(session, mainQuestions) {
  const full = mainQuestions.filter((q) => q.score === 2).map((q) => q.topic);
  const failed = mainQuestions.filter((q) => q.score === 0).map((q) => q.topic);
  const partial = mainQuestions.filter((q) => q.score === 1).map((q) => q.topic);
  const strong = [...new Set(full)];
  const weak = [...new Set(failed.concat(partial))];
  const parts = [];
  if (strong.length) parts.push(`Strong understanding of ${strong.join(' and ')}`);
  else parts.push('Fundamentals need consistent work across all selected topics');
  if (weak.length) parts.push(`${weak.join(' and ')} require more practice`);
  else parts.push('Performance was consistent across topics');
  return {
    assessment: parts.join('. ') + '.',
    strengths: strong.slice(0, 4).map((t) => `Solid answers in ${t}`),
    areasToImprove: weak.slice(0, 4).map((t) => `Deepen ${t} fundamentals`),
    recommendedTopics: weak.slice(0, 4).concat(strong.slice(0, 2)).map((t) => `${t} advanced concepts`),
  };
}

/**
 * @param {object} session InterviewSession doc (uses totalQuestions = selected count)
 * @param {Array} answers  populated answers (question + evaluation), any order
 * @returns {object} finalReport subdocument payload
 */
async function generateReport(session, answers) {
  const all = Array.isArray(answers) ? answers : [];
  // § main/follow-up separation — the scored set is MAIN questions ONLY.
  const mainAnswers = all.filter((a) => a.question && !a.question.isFollowUp);
  const followUpAnswers = all.filter((a) => a.question && a.question.isFollowUp);

  const selected = Number(session.totalQuestions) || mainAnswers.length;
  const maxScore = selected * 2;

  console.log(`[interview] report generation debug session=${session._id}:`, {
    selectedQuestionCount: selected,
    totalAnswers: all.length,
    mainAnswers: mainAnswers.length,
    followUpAnswers: followUpAnswers.length,
    maxScore,
  });

  // ── Per-question analysis rows (MAIN questions only — the scored set) ──
  const mainQuestions = mainAnswers.map((a, i) => {
    const ev = a.evaluation || {};
    const rawMarks = Number(ev.marks);
    const marks = Number.isFinite(rawMarks) && ev.marks !== null && ev.marks !== undefined
      ? Math.max(0, Math.min(2, Math.round(rawMarks)))
      : deriveMarks(ev);
    return {
      questionNumber: i + 1,
      question: a.question?.text || '',
      topic: a.question?.topic || '',
      userAnswer: a.text || '',
      score: marks,
      maxScore: 2,
      result: marks === 2 ? 'correct' : marks === 1 ? 'partial' : 'incorrect',
      verdict: ev.verdict || null,
      explanation: String(ev.detailedFeedback || ev.feedback || '').slice(0, 1500),
      strengths: Array.isArray(ev.strengths) ? ev.strengths : [],
      missingConcepts: Array.isArray(ev.missingConcepts) ? ev.missingConcepts : [],
      expectedAnswer: a.question?.expectedAnswer || '',
      expectedConcepts: Array.isArray(a.question?.expectedConcepts) ? a.question.expectedConcepts : [],
    };
  });

  // ── Headline score: sum of MAIN question marks ONLY ────────────────────
  const score = mainQuestions.reduce((s, q) => s + q.score, 0);
  const fullCount = mainQuestions.filter((q) => q.score === 2).length;
  const partialCount = mainQuestions.filter((q) => q.score === 1).length;
  const incorrectCount = mainQuestions.filter((q) => q.score === 0).length;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  // ── Follow-up conversation (supporting context — NEVER scored) ─────────
  const followUps = followUpAnswers.map((a) => ({
    question: a.question?.text || '',
    userAnswer: a.text || '',
    feedback: a.evaluation?.feedback || '',
  }));


  // ── Deterministic topic/skill aggregation from MAIN evaluations ────────
  const scoredMains = mainAnswers.filter((a) => a.evaluation && Number.isFinite(Number(a.evaluation.overall)));
  const topicAgg = {};
  for (const a of scoredMains) {
    const t = a.question?.topic || 'General';
    if (!topicAgg[t]) topicAgg[t] = { sum: 0, n: 0 };
    topicAgg[t].sum += a.evaluation.marks ?? deriveMarks(a.evaluation);
    topicAgg[t].n += 1;
  }
  const topicPerformance = Object.entries(topicAgg)
    .map(([topic, { sum, n }]) => ({ topic, averageScore: round1(sum / n), questionsAsked: n }))
    .sort((a, b) => b.averageScore - a.averageScore);

  const avg = (fn) => (scoredMains.length ? round1(scoredMains.reduce((s, a) => s + fn(a.evaluation), 0) / scoredMains.length) : 0);
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
    confidenceIndicator: clarityAvg >= 7.5 ? 'strong' : clarityAvg >= 6 ? 'good' : clarityAvg >= 4 ? 'moderate' : scoredMains.length ? 'low' : 'not_available',
    notes: 'Confidence/clarity is inferred from answer communication scores collected during the interview.',
  };

  const mistakes = [];
  for (const a of scoredMains) {
    for (const m of a.evaluation.detectedMistakes || []) {
      if (m && !mistakes.some((x) => x.toLowerCase() === String(m).toLowerCase())) mistakes.push(String(m).slice(0, 140));
    }
  }
  for (const q of mainQuestions) {
    if (q.score === 0 && q.question) {
      mistakes.push(`Incorrect: ${String(q.question).slice(0, 100)}`);
    }
  }

  const stats = {
    selectedQuestionCount: selected,
    mainQuestionsAsked: mainAnswers.length,
    mainQuestionsAnswered: mainQuestions.length,
    // Legacy aliases (same values) kept for older clients/tests.
    questionsAsked: mainAnswers.length,
    questionsAnswered: mainQuestions.length,
    followUpCount: followUpAnswers.length,
    followUpsAnswered: followUpAnswers.filter((a) => a.evaluation && Number.isFinite(Number(a.evaluation.overall))).length,
    fullCount,
    partialCount,
    incorrectCount,
    mistakesCount: mistakes.length,
  };


  // Zero-answers guard
  const answeredMains = mainAnswers.filter((a) => a.text && String(a.text).trim().length > 2);
  const hasAnyAnswers = answeredMains.length > 0;

  let aiPart = null;
  let generatedBy = 'deterministic-fallback';

  if (!hasAnyAnswers) {
    aiPart = {
      assessment: 'No answers were submitted, so candidate understanding could not be evaluated.',
      strengths: [],
      areasToImprove: [],
      recommendedTopics: [],
    };
    generatedBy = 'no-answers';
  } else {
    const answeredQuestions = mainQuestions.filter((q) => q.userAnswer && q.userAnswer.trim().length > 0);
    try {
      const parsed = await callJson(
        [
          { role: 'system', content: 'You are a precise JSON generator. Output only valid JSON matching the requested shape.' },
          { role: 'user', content: buildReportPrompt(session, answeredQuestions) },
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
      console.error('[interview] report AI call failed: ' + err.message);
    }

    if (!aiPart) aiPart = buildFallbackAssessment(session, answeredQuestions);
  }

  return {
    // § headline score — marks based, e.g. 7/10 for a 5-question interview
    score,
    maxScore,
    percentage,
    // Legacy 0-100 percentage kept for readiness score & older consumers.
    overallScore: percentage,
    stats,
    mainQuestions,
    followUps,
    topicPerformance,
    skills,
    communication,
    mistakes: mistakes.slice(0, 10),
    strengths: aiPart.strengths,
    areasToImprove: aiPart.areasToImprove,
    assessment: aiPart.assessment,
    recommendedTopics: aiPart.recommendedTopics,
    generatedBy,
  };
}

module.exports = { generateReport };

