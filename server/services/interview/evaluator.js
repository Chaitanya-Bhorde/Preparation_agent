/**
 * evaluator — structured answer evaluation.
 *
 * Every candidate answer gets a 0-10 score across multiple dimensions plus a
 * verdict, concise in-interview feedback, and detailed feedback for the final
 * report. The full evaluation is always persisted; only the concise part is
 * shown during the interview.
 *
 * Empty/very short answers are short-circuited deterministically (no AI call).
 */

const { callJson, AiServiceError } = require('./aiClient');

const MIN_ANSWER_LENGTH = 2;
const SCORE_DIMENSIONS = ['overall', 'correctness', 'technicalAccuracy', 'completeness', 'clarity', 'depth', 'communication'];
const VERDICTS = ['correct', 'partially_correct', 'incorrect'];

/** Clamp any number into 0-10; NaN → 0. */
function clampScore(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, Math.round(n * 10) / 10));
}

function clampStringArray(arr, maxItems = 6, maxLen = 140) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((s) => typeof s === 'string' && s.trim())
    .map((s) => s.trim().slice(0, maxLen))
    .slice(0, maxItems);
}

function evaluationPrompt({ question, topic, answer, experienceLevel, isFollowUp }) {
  return `You are an experienced technical interviewer evaluating a candidate's spoken/typed interview answer.

Question (${topic}${isFollowUp ? ', follow-up' : ''}): "${question}"
Candidate answer: "${answer.slice(0, 4000)}"
Candidate level: ${experienceLevel}

Evaluate honestly and specifically. Understand the answer SEMANTICALLY — do not just match keywords. Do not invent technical facts. Judge correctness against what a real interviewer would expect at this level.

Respond ONLY with valid JSON:
{
  "overall": 0-10,
  "correctness": 0-10,
  "technicalAccuracy": 0-10,
  "completeness": 0-10,
  "clarity": 0-10,
  "depth": 0-10,
  "communication": 0-10,
  "confidence": 0-10,
  "relevance": 0-10,
  "quality": "strong|average|weak|incorrect",
  "verdict": "correct|partially_correct|incorrect",
  "strengths": ["max 3 short strengths"],
  "missingConcepts": ["max 4 short missing/mistaken concepts"],
  "detectedMistakes": ["max 3 short factual mistakes or misconceptions stated by the candidate, empty array if none"],
  "feedback": "1-2 sentence concise feedback shown DURING the interview",
  "detailedFeedback": "3-5 sentence full feedback for the final report: what was right, what was missing, how to improve",
  "recommendedAction": "follow_up|next_topic|clarify|retry",
  "followUpReason": "1 sentence: why the recommended action is useful (empty if next_topic)"
}

Decision rules for recommendedAction:
- "clarify"  — the answer is factually WRONG or contains a misconception: recommend a corrective probe that addresses the specific mistake (the interviewer will challenge it constructively). Use this INSTEAD of simply moving on.
- "follow_up" — the answer is partially correct or superficial: a deeper follow-up on the missing concept would meaningfully deepen the assessment.
- "next_topic" — the answer is complete and correct; move the interview forward.
- "retry"    — the answer is empty, irrelevant, or shows the candidate did not understand the question at all.

quality mapping guide: strong (correct + thorough), average (correct core, some gaps), weak (major gaps or very superficial), incorrect (factually wrong).`;
}

/**
 * Evaluate an answer. Returns a normalized evaluation object.
 * @throws {AiServiceError} if the AI provider fails — caller decides fallback.
 */
async function evaluateAnswer({ question, topic, answer, experienceLevel = 'fresher', isFollowUp = false }) {
  const trimmed = String(answer || '').trim();

  // Deterministic short-circuit: empty or near-empty answer.
  if (trimmed.length < MIN_ANSWER_LENGTH) {
    return {
      overall: 0,
      correctness: 0,
      technicalAccuracy: 0,
      completeness: 0,
      clarity: 0,
      depth: 0,
      communication: 0,
      confidence: 0,
      relevance: 0,
      quality: 'incorrect',
      verdict: 'incorrect',
      strengths: [],
      missingConcepts: ['No substantive answer provided'],
      detectedMistakes: [],
      feedback: 'No answer was provided. Let\'s move on — try to attempt the next one.',
      detailedFeedback: 'The candidate did not provide a substantive answer to this question.',
      recommendedAction: 'next_topic',
      followUpReason: '',
      followUpNeeded: false,
    };
  }

  const parsed = await callJson(
    [
      { role: 'system', content: 'You are a precise JSON generator that scores interview answers. Output only valid JSON matching the requested shape.' },
      { role: 'user', content: evaluationPrompt({ question, topic, answer: trimmed, experienceLevel, isFollowUp }) },
    ],
    { temperature: 0.2, maxTokens: 900 }
  );

  if (!parsed || typeof parsed !== 'object') {
    throw new AiServiceError('Malformed evaluation response.');
  }

  const verdict = VERDICTS.includes(parsed.verdict)
    ? parsed.verdict
    : (clampScore(parsed.overall) >= 7 ? 'correct' : clampScore(parsed.overall) >= 4 ? 'partially_correct' : 'incorrect');

  const evaluation = {};
  for (const dim of SCORE_DIMENSIONS) {
    evaluation[dim] = clampScore(parsed[dim]);
  }
  // overall defaults to the mean of the sub-scores if the model omitted it.
  if (!parsed.overall && parsed.overall !== 0) {
    const subs = ['correctness', 'technicalAccuracy', 'completeness', 'clarity', 'depth', 'communication']
      .map((d) => evaluation[d]);
    evaluation.overall = clampScore(subs.reduce((s, v) => s + v, 0) / subs.length);
  }

  evaluation.verdict = verdict;

  // ── Qualitative analysis (§ analysis contract) ──────────────────────────
  const QUALITIES = ['strong', 'average', 'weak', 'incorrect'];
  const ACTIONS = ['follow_up', 'next_topic', 'clarify', 'retry'];
  let quality = QUALITIES.includes(parsed.quality) ? parsed.quality : null;
  if (!quality) {
    // Derive from verdict + overall when the model omitted it.
    if (verdict === 'incorrect') quality = 'incorrect';
    else if (evaluation.overall >= 8) quality = 'strong';
    else if (evaluation.overall >= 6) quality = 'average';
    else quality = 'weak';
  }
  // A factually wrong answer is always incorrect regardless of the label.
  if (verdict === 'incorrect' && quality === 'strong') quality = 'weak';

  evaluation.quality = quality;
  evaluation.confidence = clampScore(parsed.confidence);
  evaluation.relevance = clampScore(parsed.relevance);
  evaluation.detectedMistakes = clampStringArray(parsed.detectedMistakes, 3);

  let action = ACTIONS.includes(parsed.recommendedAction) ? parsed.recommendedAction : null;
  if (!action) {
    // Deterministic policy: wrong → corrective probe, partial/superficial →
    // follow-up, complete → next topic. (Keeps behavior consistent even when
    // the model omits the field.)
    if (verdict === 'incorrect') action = 'clarify';
    else if (verdict === 'partially_correct' && evaluation.missingConcepts.length > 0) action = 'follow_up';
    else action = 'next_topic';
  }
  // "retry" only makes sense for empty/irrelevant answers; a retry prompt for
  // a substantive-but-wrong answer would waste a turn — downgrade to clarify.
  if (action === 'retry' && trimmed.split(/\s+/).length >= 8) action = 'clarify';

  evaluation.recommendedAction = action;
  evaluation.followUpReason = String(parsed.followUpReason || '').trim().slice(0, 300);

  // followUpNeeded is now DERIVED from the recommended action so incorrect
  // answers reliably get corrective probes (the interviewer challenges the
  // misconception instead of silently moving on).
  evaluation.followUpNeeded = action === 'follow_up' || action === 'clarify';

  evaluation.strengths = clampStringArray(parsed.strengths, 3);
  evaluation.missingConcepts = clampStringArray(parsed.missingConcepts, 4);
  evaluation.feedback = String(parsed.feedback || '').trim().slice(0, 500) || 'Answer received and evaluated.';
  evaluation.detailedFeedback = String(parsed.detailedFeedback || '').trim().slice(0, 1500) || evaluation.feedback;

  return evaluation;
}

/**
 * Deterministic offline evaluation used ONLY when the AI provider fails, so a
 * provider outage can never block a candidate mid-interview. Scores come from
 * answer length + keyword coverage of the question's expected concepts.
 * Marked with evaluator:'heuristic' so reports can show it was degraded.
 */
function heuristicEvaluation({ question, answer, expectedConcepts = [], expectedAnswer = '' }) {
  const text = String(answer || '').trim();
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = `${text.toLowerCase()} ${expectedAnswer.toLowerCase()}`;

  const concepts = expectedConcepts
    .map((c) => String(c).toLowerCase().trim())
    .filter(Boolean);
  const hit = concepts.filter((c) => {
    const tokens = c.split(/[^a-z0-9]+/).filter((t) => t.length > 2);
    return tokens.some((t) => haystack.includes(t));
  });
  const coverage = concepts.length ? hit.length / concepts.length : 0;

  // Length signal: <15 words weak, 15-60 reasonable, 60+ thorough (capped).
  const lengthScore =
    words.length < 5 ? 1 : words.length < 15 ? 4 : words.length < 60 ? 6.5 : 8;
  const conceptScore = concepts.length ? 3 + coverage * 6 : Math.min(7, lengthScore);

  const overall = clampScore(lengthScore * 0.4 + conceptScore * 0.6);
  const verdict = overall >= 7 ? 'correct' : overall >= 4 ? 'partially_correct' : 'incorrect';
  const quality = verdict === 'incorrect' ? 'incorrect' : overall >= 8 ? 'strong' : overall >= 6 ? 'average' : 'weak';
  const missingList = concepts.filter((c) => !hit.includes(c)).slice(0, 4);
  const missingCount = missingList.length;

  return {
    overall,
    correctness: clampScore(conceptScore),
    technicalAccuracy: clampScore(conceptScore * 0.9),
    completeness: clampScore(3 + coverage * 6),
    clarity: clampScore(lengthScore),
    depth: clampScore(Math.min(overall, lengthScore)),
    communication: clampScore(lengthScore),
    confidence: clampScore(lengthScore * 0.8),
    relevance: clampScore(coverage > 0 ? 7 : 4),
    quality,
    verdict,
    strengths: hit.slice(0, 3).map((c) => `Mentioned: ${c}`),
    missingConcepts: missingList,
    feedback:
      'Evaluated in offline mode (AI interviewer temporarily unavailable). Score reflects answer substance against the expected key concepts.',
    detailedFeedback:
      'This answer was scored by a fallback heuristic evaluator because the AI service was unavailable. ' +
      (concepts.length
        ? `Expected concepts: ${concepts.join(', ')}. Covered: ${hit.length ? hit.join(', ') : 'none detected'}.`
        : 'No concept list was available for detailed matching.'),
    detectedMistakes: [],
    recommendedAction: verdict === 'incorrect' ? 'clarify' : verdict === 'partially_correct' && missingCount > 0 ? 'follow_up' : 'next_topic',
    followUpReason: verdict === 'incorrect'
      ? 'Answer appears incorrect; a corrective probe is recommended.'
      : verdict === 'partially_correct' && missingCount > 0
        ? 'Key expected concepts are missing; a deeper follow-up is recommended.'
        : '',
    followUpNeeded: false, // heuristic mode never generates AI follow-ups
    evaluator: 'heuristic',
  };
}

/**
 * Deterministic marks derivation (§ scoring spec): every MAIN question is
 * worth exactly 2 marks — 2 = fully correct/complete, 1 = partially
 * correct/relevant, 0 = incorrect/irrelevant/empty.
 *
 * The mapping from the 0-10 AI evaluation is FIXED (not random):
 *   verdict 'incorrect' OR overall < 4        → 0
 *   verdict 'correct'   AND overall >= 8      → 2
 *   anything else (partial / 4 ≤ score < 8)   → 1
 * Follow-up evaluations are also given marks for storage, but the report
 * MUST NOT include them in the main-question score sum.
 */
const MARKS_PER_MAIN_QUESTION = 2;

function deriveMarks(evaluation) {
  if (!evaluation) return 0;
  const overall = Number(evaluation.overall);
  if (!Number.isFinite(overall)) return 0;
  if (evaluation.verdict === 'incorrect' || overall < 4) return 0;
  if (evaluation.verdict === 'correct' && overall >= 8) return 2;
  return 1;
}

module.exports = { evaluateAnswer, heuristicEvaluation, clampScore, deriveMarks, MARKS_PER_MAIN_QUESTION, MIN_ANSWER_LENGTH };
