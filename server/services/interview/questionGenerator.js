/**
 * questionGenerator — produces the next interview question.
 *
 * Guarantees enforced here (NOT left to the LLM):
 *  1. Topic control   — the question's topic must resolve to one of the
 *                       session's selected topics, else the response is
 *                       rejected and regeneration is attempted.
 *  2. Duplicate rule  — the question text is compared against every previous
 *                       question in the session (normalized similarity);
 *                       duplicates are rejected and regenerated.
 *  3. Difficulty      — resolved from the session difficulty + rolling
 *                       performance so it adapts as the candidate improves
 *                       or struggles.
 *
 * When the AI provider fails or keeps returning invalid output, we degrade
 * gracefully to the curated fallback bank (source: 'fallback') instead of
 * breaking the interview.
 */

const fields = require('../../config/interviewFields');
const { callJson, AiServiceError } = require('./aiClient');
const { isDuplicateQuestion, conceptOverlap } = require('./similarity');
const { getFallbackQuestion } = require('./fallbackBank');

const MAX_GENERATION_ATTEMPTS = 2;
const MAX_CONCEPT_OVERLAP = 0.5; // skip questions re-testing >=50% known concepts

/** Resolve the effective difficulty for the next question. */
function resolveDifficulty(session, recentScores = []) {
  const { difficulty } = session;
  if (difficulty !== 'mixed') return difficulty;

  // Mixed: cycle easy → medium → hard, adjusted by performance.
  if (recentScores.length === 0) return 'easy';
  const avg = recentScores.reduce((s, v) => s + v, 0) / recentScores.length;
  if (avg >= 8) return 'hard';
  if (avg >= 6) return 'medium';
  return 'easy';
}

/**
 * Difficulty the AI should aim for given recent performance trend.
 * Strong candidates are pushed up; struggling candidates get a breather.
 */
function adaptDifficulty(base, recentScores = []) {
  if (recentScores.length < 2) return base;
  const avg = recentScores.reduce((s, v) => s + v, 0) / recentScores.length;
  if (avg >= 8.5) {
    if (base === 'easy') return 'medium';
    if (base === 'medium') return 'hard';
  } else if (avg < 3.5) {
    if (base === 'hard') return 'medium';
    if (base === 'medium') return 'easy';
  }
  return base;
}

function buildContextBlock(session, questionSummaries, recentQA) {
  const topicLabels = session.topics.join(', ');
  const askedList = questionSummaries
    .slice(-8)
    .map((q, i) => `${i + 1}. [${q.topic}] ${q.text}`)
    .join('\n');
  const conceptList = [...new Set(questionSummaries.flatMap((q) => q.expectedConcepts || []))]
    .slice(0, 30).join(', ') || 'none yet';
  const qaBlock = recentQA
    .map((qa) => `Q: ${qa.question}\nA: ${String(qa.answer).slice(0, 300)}\nScore: ${qa.score}/10`)
    .join('\n---\n');
  return { topicLabels, askedList, conceptList, qaBlock };
}

function questionPrompt({ session, targetDifficulty, isFollowUp, prevQuestion, prevAnswer, prevEvaluation, questionSummaries, recentQA }) {
  const { topicLabels, askedList, conceptList, qaBlock } = buildContextBlock(session, questionSummaries, recentQA);

  const followUpBlock = isFollowUp
    ? `
THIS MUST BE A DIRECT FOLLOW-UP to the previous question, probing deeper into the same concept based on the candidate's answer. Do NOT switch to a new concept or topic.

Previous question: "${prevQuestion}"
Candidate's answer: "${(prevAnswer || '').slice(0, 600)}"
Evaluation summary: score ${prevEvaluation?.overall ?? 'n/a'}/10, missing concepts: ${(prevEvaluation?.missingConcepts || []).join(', ') || 'none noted'}.
If the answer was strong (score >= 7): ask a harder probing follow-up (internal mechanics, edge cases, trade-offs).
If the answer was weak (score < 4): ask a simpler clarifying follow-up on the same concept.`
    : '';

  return `You are a senior technical interviewer conducting a realistic mock interview for a ${session.experienceLevel}-level candidate.

HARD CONSTRAINTS (violating any of these makes your output invalid):
1. The question MUST be about exactly one of these topics: ${topicLabels}. Nothing else.
2. NEVER repeat or paraphrase a question already asked:
${askedList || '(none asked yet)'}
3. Concepts already tested — do NOT re-test them: ${conceptList}
4. Target difficulty: ${targetDifficulty}. Wording must be clear, unambiguous, one identifiable concept, appropriate for a real fresher/junior technical interview. Avoid obscure trivia.
5. Respond ONLY with valid JSON.

Recent interview context (last answers):
${qaBlock || '(interview just started)'}
${followUpBlock}

JSON shape:
{
  "question": "the interview question",
  "topic": "one of: ${topicLabels}",
  "difficulty": "easy|medium|hard",
  "type": "conceptual|comparison|scenario|coding|troubleshooting",
  "expectedConcepts": ["3-6 key concepts a good answer must include"],
  "expectedAnswer": "2-4 sentence ideal answer"
}`;
}

/** Validate an AI-returned question against session constraints. Returns error string or validated object. */
function validateGeneratedQuestion(parsed, session, previousTexts, askedConcepts) {
  if (!parsed || typeof parsed !== 'object') return 'not an object';
  const question = String(parsed.question || '').trim();
  if (question.length < 10 || question.length > 600) return 'question text missing or out of range';

  const field = fields.resolveField(parsed.topic);
  const topicLabel = field ? field.label : null;
  if (!topicLabel || !session.topics.includes(topicLabel)) {
    return `topic '${String(parsed.topic).slice(0, 40)}' is outside selected topics`;
  }

  const diff = String(parsed.difficulty || '').toLowerCase();
  const difficulty = fields.CORE_DIFFICULTIES.includes(diff) ? diff : null;
  if (!difficulty) return 'invalid difficulty';

  const type = ['conceptual', 'comparison', 'scenario', 'coding', 'troubleshooting'].includes(parsed.type)
    ? parsed.type
    : 'conceptual';

  if (isDuplicateQuestion(question, previousTexts)) return 'duplicate question';

  const concepts = Array.isArray(parsed.expectedConcepts)
    ? parsed.expectedConcepts.map((c) => String(c).slice(0, 60)).filter(Boolean).slice(0, 8)
    : [];
  if (concepts.length > 0 && conceptOverlap(concepts, askedConcepts) >= MAX_CONCEPT_OVERLAP) {
    return 're-tests already-covered concepts';
  }

  return {
    question,
    topic: topicLabel,
    difficulty,
    type,
    expectedConcepts: concepts,
    expectedAnswer: String(parsed.expectedAnswer || '').slice(0, 1200),
  };
}

/** Deterministic fallback question built from the static bank. */
function buildFallback(session, resolvedDifficulty, previousTexts) {
  const shuffled = [...session.topics].sort(() => Math.random() - 0.5);
  for (const topic of shuffled) {
    const field = fields.resolveField(topic);
    if (!field) continue;
    const q = getFallbackQuestion(field.id, resolvedDifficulty, previousTexts);
    if (q && !isDuplicateQuestion(q.text, previousTexts)) {
      return {
        question: q.text,
        topic: field.label,
        difficulty: fields.CORE_DIFFICULTIES.includes(q.difficulty) ? q.difficulty : resolvedDifficulty,
        type: q.type || 'conceptual',
        expectedConcepts: q.expectedConcepts || [],
        expectedAnswer: q.expectedAnswer || '',
        source: 'fallback',
      };
    }
  }
  return null;
}

/**
 * Generate the next question for a session.
 * @param {object} opts
 *   session          InterviewSession doc
 *   isFollowUp       boolean
 *   prevQuestion     {text} of the previous question (for follow-ups)
 *   prevAnswer       candidate's last answer text
 *   prevEvaluation   evaluation object of the last answer
 *   questionSummaries [{text, topic, expectedConcepts}]
 *   recentQA         [{question, answer, score}] last 2-3 pairs
 *   recentScores     [number] recent overall scores (difficulty adaptation)
 * @returns {object} { question, topic, difficulty, type, expectedConcepts, expectedAnswer, source }
 * @throws {AiServiceError} only when both AI and fallback fail
 */
async function generateQuestion(opts) {
  const {
    session, isFollowUp = false, prevQuestion = null, prevAnswer = '',
    prevEvaluation = null, questionSummaries = [], recentQA = [], recentScores = [],
  } = opts;

  const previousTexts = questionSummaries.map((q) => q.text);
  const askedConcepts = questionSummaries.flatMap((q) => q.expectedConcepts || []);
  const baseDifficulty = resolveDifficulty(session, recentScores);
  const targetDifficulty = isFollowUp ? baseDifficulty : adaptDifficulty(baseDifficulty, recentScores);

  try {
    const prompt = questionPrompt({
      session, targetDifficulty, isFollowUp, prevQuestion: prevQuestion?.text,
      prevAnswer, prevEvaluation, questionSummaries, recentQA,
    });

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      try {
        const parsed = await callJson(
          [
            { role: 'system', content: 'You are a precise JSON generator for a technical interview system. Output only valid JSON matching the requested shape.' },
            { role: 'user', content: prompt },
          ],
          { temperature: attempt === 0 ? 0.6 : 0.85 }
        );
        const validated = validateGeneratedQuestion(parsed, session, previousTexts, askedConcepts);
        if (typeof validated === 'string') {
          console.warn(`[interview] question attempt ${attempt + 1} rejected: ${validated}`);
          continue;
        }
        return { ...validated, source: 'ai' };
      } catch (err) {
        if (err instanceof AiServiceError) {
          console.error(`[interview] AI question generation failed (attempt ${attempt + 1}): ${err.message}`);
          break; // provider-level failure — go to fallback
        }
        throw err;
      }
    }
  } catch (err) {
    console.error(`[interview] question generation error: ${err.message}`);
  }

  // Graceful degradation.
  const fallback = buildFallback(session, targetDifficulty, previousTexts);
  if (fallback) {
    console.warn('[interview] using fallback question bank');
    return fallback;
  }
  throw new AiServiceError('Unable to generate a valid interview question.');
}

module.exports = {
  generateQuestion,
  resolveDifficulty,
  adaptDifficulty,
  validateGeneratedQuestion,
  buildFallback,
};
