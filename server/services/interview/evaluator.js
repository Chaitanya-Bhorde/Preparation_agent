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

Evaluate honestly and specifically. Do not invent technical facts. Judge correctness against what a real interviewer would expect at this level.

Respond ONLY with valid JSON:
{
  "overall": 0-10,
  "correctness": 0-10,
  "technicalAccuracy": 0-10,
  "completeness": 0-10,
  "clarity": 0-10,
  "depth": 0-10,
  "communication": 0-10,
  "verdict": "correct|partially_correct|incorrect",
  "strengths": ["max 3 short strengths"],
  "missingConcepts": ["max 4 short missing/mistaken concepts"],
  "feedback": "1-2 sentence concise feedback shown DURING the interview",
  "detailedFeedback": "3-5 sentence full feedback for the final report: what was right, what was missing, how to improve",
  "followUpNeeded": true|false
}

followUpNeeded is true only when a follow-up on THIS question would meaningfully deepen the assessment (e.g., the answer was superficial but shows promise, or a key part needs probing). Do not set it true when the answer is clearly complete or clearly wrong.`;
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
      verdict: 'incorrect',
      strengths: [],
      missingConcepts: ['No substantive answer provided'],
      feedback: 'No answer was provided. Let\'s move on — try to attempt the next one.',
      detailedFeedback: 'The candidate did not provide a substantive answer to this question.',
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
  evaluation.strengths = clampStringArray(parsed.strengths, 3);
  evaluation.missingConcepts = clampStringArray(parsed.missingConcepts, 4);
  evaluation.feedback = String(parsed.feedback || '').trim().slice(0, 500) || 'Answer received and evaluated.';
  evaluation.detailedFeedback = String(parsed.detailedFeedback || '').trim().slice(0, 1500) || evaluation.feedback;
  evaluation.followUpNeeded = Boolean(parsed.followUpNeeded);

  return evaluation;
}

module.exports = { evaluateAnswer, clampScore, MIN_ANSWER_LENGTH };
