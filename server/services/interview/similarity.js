/**
 * similarity — deterministic duplicate-question detection.
 *
 * Within one session the same (or semantically equivalent) question must never
 * be asked twice. This module normalizes question text and compares token-set
 * similarity; the question generator uses it to reject duplicates BEFORE the
 * question reaches the user.
 */

// Words that carry no topical meaning in interview questions.
const STOPWORDS = new Set([
  'what', 'is', 'are', 'was', 'were', 'the', 'a', 'an', 'explain', 'explanation',
  'difference', 'different', 'differ', 'between', 'in', 'of', 'and', 'or', 'to',
  'how', 'why', 'when', 'do', 'does', 'did', 'can', 'could', 'would', 'should',
  'you', 'your', 'with', 'for', 'on', 'about', 'describe', 'tell', 'give',
  'example', 'examples', 'please', 'me', 'it', 'its', 'their', 'there', 'this',
  'that', 'these', 'those', 'work', 'works', 'working', 'use', 'uses', 'using',
  'used', 'by', 'at', 'as', 'from', 'which', 'into', 'more', 'some', 'any',
]);

/** Normalize a question into a comparable token string. */
function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Content tokens (stopwords removed). */
function contentTokens(text) {
  return tokenize(text).filter((t) => !STOPWORDS.has(t));
}

/** Jaccard similarity between the content tokens of two questions. */
function similarity(a, b) {
  const ta = new Set(contentTokens(a));
  const tb = new Set(contentTokens(b));
  if (ta.size === 0 && tb.size === 0) return 1;
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;
  const union = new Set([...ta, ...tb]).size;
  return intersection / union;
}

/**
 * Is `candidate` a duplicate of any question in `previousTexts`?
 * Two questions are duplicates when their normalized content tokens are
 * identical, or their Jaccard similarity exceeds DUPLICATE_THRESHOLD
 * (tuned so "What is polymorphism?" vs "Explain polymorphism in OOP." → dup,
 * but genuinely different questions in the same topic stay distinct).
 */
const DUPLICATE_THRESHOLD = 0.5;

function isDuplicateQuestion(candidate, previousTexts, threshold = DUPLICATE_THRESHOLD) {
  if (!candidate) return false;
  for (const prev of previousTexts || []) {
    if (!prev) continue;
    if (similarity(candidate, prev) >= threshold) return true;
  }
  return false;
}

/**
 * How strongly does the candidate overlap concepts already tested?
 * Returns the fraction of candidate concepts that were already asked about.
 */
function conceptOverlap(candidateConcepts, askedConcepts) {
  if (!Array.isArray(candidateConcepts) || candidateConcepts.length === 0) return 0;
  const asked = new Set((askedConcepts || []).map((c) => String(c).toLowerCase().trim()));
  if (asked.size === 0) return 0;
  let overlap = 0;
  for (const c of candidateConcepts) {
    if (asked.has(String(c).toLowerCase().trim())) overlap++;
  }
  return overlap / candidateConcepts.length;
}

module.exports = { tokenize, contentTokens, similarity, isDuplicateQuestion, conceptOverlap, DUPLICATE_THRESHOLD };
